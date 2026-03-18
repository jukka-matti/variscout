import type {
  MultiRegressionOptions,
  MultiRegressionResult,
  CoefficientResult,
  RegressionTerm,
  VIFWarning,
} from '../types';
import { transpose, multiply, inverse, multiplyVector, diagonal } from '../matrix';
import { fDistributionPValue, tDistributionPValue } from './distributions';
import { formatStatistic } from '../i18n/format';

/**
 * Build dummy variables for a categorical column using reference coding
 * Creates k-1 dummy variables for k levels, with the first level as reference
 *
 * @param data - Data rows
 * @param column - Column name to encode
 * @param validRows - Indices of valid rows
 * @returns Object with dummy column names, values matrix, and level info
 */
function buildDummyVariables<T extends Record<string, unknown>>(
  data: T[],
  column: string,
  validRows: number[]
): {
  dummyNames: string[];
  dummyValues: number[][];
  levels: string[];
  referenceLevel: string;
} {
  // Get unique levels, sorted for consistency
  const levels = [...new Set(validRows.map(i => String(data[i][column])))].sort();

  if (levels.length < 2) {
    return { dummyNames: [], dummyValues: [], levels, referenceLevel: levels[0] || '' };
  }

  // First level is reference (omitted)
  const referenceLevel = levels[0];
  const nonRefLevels = levels.slice(1);

  const dummyNames = nonRefLevels.map(level => `${column}_${level}`);
  const dummyValues: number[][] = validRows.map(i => {
    const value = String(data[i][column]);
    return nonRefLevels.map(level => (value === level ? 1 : 0));
  });

  return { dummyNames, dummyValues, levels, referenceLevel };
}

/**
 * Build the full design matrix with continuous, categorical, and interaction terms
 */
function buildFullDesignMatrix<T extends Record<string, unknown>>(
  data: T[],
  yColumn: string,
  xColumns: string[],
  options: MultiRegressionOptions = {}
): {
  X: number[][];
  Y: number[];
  terms: RegressionTerm[];
  termNames: string[];
  n: number;
  validRows: number[];
} | null {
  const { categoricalColumns = [], includeInteractions = false } = options;

  // Separate continuous and categorical columns
  const continuousCols = xColumns.filter(c => !categoricalColumns.includes(c));
  const categoryCols = xColumns.filter(c => categoricalColumns.includes(c));

  // First pass: find valid rows (all required columns have valid values)
  const validRows: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Check Y value
    const yVal = Number(row[yColumn]);
    if (isNaN(yVal) || !isFinite(yVal)) continue;

    // Check continuous X values
    let valid = true;
    for (const col of continuousCols) {
      const val = Number(row[col]);
      if (isNaN(val) || !isFinite(val)) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    // Check categorical values exist
    for (const col of categoryCols) {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    validRows.push(i);
  }

  if (validRows.length < xColumns.length + 2) {
    // Need at least p + 2 observations for meaningful regression
    return null;
  }

  // Build design matrix
  const terms: RegressionTerm[] = [];
  const termNames: string[] = [];
  const X: number[][] = validRows.map(() => [1]); // Start with intercept column

  // Add continuous predictors
  for (const col of continuousCols) {
    terms.push({
      columns: [col],
      label: col,
      type: 'continuous',
    });
    termNames.push(col);

    validRows.forEach((rowIdx, i) => {
      X[i].push(Number(data[rowIdx][col]));
    });
  }

  // Add categorical predictors (dummy-encoded)
  const dummyInfo: Map<string, { names: string[]; levels: string[]; referenceLevel: string }> =
    new Map();

  for (const col of categoryCols) {
    const { dummyNames, dummyValues, levels, referenceLevel } = buildDummyVariables(
      data,
      col,
      validRows
    );

    dummyInfo.set(col, { names: dummyNames, levels, referenceLevel });

    for (let d = 0; d < dummyNames.length; d++) {
      terms.push({
        columns: [col],
        label: dummyNames[d],
        type: 'categorical',
        level: levels[d + 1], // +1 because reference is skipped
        referenceLevel,
      });
      termNames.push(dummyNames[d]);

      validRows.forEach((_, i) => {
        X[i].push(dummyValues[i][d]);
      });
    }
  }

  // Add interaction terms if requested
  if (includeInteractions && xColumns.length >= 2) {
    // Only add continuous × continuous interactions for now
    for (let i = 0; i < continuousCols.length; i++) {
      for (let j = i + 1; j < continuousCols.length; j++) {
        const col1 = continuousCols[i];
        const col2 = continuousCols[j];
        const interactionName = `${col1} × ${col2}`;

        terms.push({
          columns: [col1, col2],
          label: interactionName,
          type: 'interaction',
        });
        termNames.push(interactionName);

        validRows.forEach((rowIdx, k) => {
          const val1 = Number(data[rowIdx][col1]);
          const val2 = Number(data[rowIdx][col2]);
          X[k].push(val1 * val2);
        });
      }
    }

    // Add continuous × categorical interactions
    for (const contCol of continuousCols) {
      for (const catCol of categoryCols) {
        const info = dummyInfo.get(catCol);
        if (!info) continue;

        for (let d = 0; d < info.names.length; d++) {
          const level = info.levels[d + 1];
          const interactionName = `${contCol} × ${catCol}_${level}`;

          terms.push({
            columns: [contCol, catCol],
            label: interactionName,
            type: 'interaction',
            level,
            referenceLevel: info.referenceLevel,
          });
          termNames.push(interactionName);

          validRows.forEach((rowIdx, k) => {
            const contVal = Number(data[rowIdx][contCol]);
            const catVal = String(data[rowIdx][catCol]) === level ? 1 : 0;
            X[k].push(contVal * catVal);
          });
        }
      }
    }
  }

  // Extract Y values
  const Y = validRows.map(i => Number(data[i][yColumn]));

  return { X, Y, terms, termNames, n: validRows.length, validRows };
}

/**
 * Calculate VIF (Variance Inflation Factor) for each predictor
 * VIF = 1 / (1 - R²) where R² is from regressing that predictor on all others
 */
function calculateVIF(X: number[][]): number[] {
  const n = X.length;
  const p = X[0].length - 1; // Exclude intercept

  if (p < 2) return []; // VIF not meaningful with single predictor

  const vifs: number[] = [];

  // For each predictor (excluding intercept at index 0)
  for (let j = 1; j <= p; j++) {
    // Extract predictor j as response
    const yj = X.map(row => row[j]);

    // Build design matrix with all other predictors
    const Xother: number[][] = X.map(row => {
      const newRow = [1]; // Intercept
      for (let k = 1; k <= p; k++) {
        if (k !== j) newRow.push(row[k]);
      }
      return newRow;
    });

    // Calculate R² for this regression
    const XtX = multiply(transpose(Xother), Xother);
    if (!XtX) {
      vifs.push(Infinity);
      continue;
    }

    const XtXinv = inverse(XtX);
    if (!XtXinv) {
      vifs.push(Infinity);
      continue;
    }

    const XtY = multiplyVector(transpose(Xother), yj);
    if (!XtY) {
      vifs.push(Infinity);
      continue;
    }

    const beta = multiplyVector(XtXinv, XtY);
    if (!beta) {
      vifs.push(Infinity);
      continue;
    }

    // Calculate R²
    const yMean = yj.reduce((a, b) => a + b, 0) / n;
    let ssTot = 0;
    let ssRes = 0;

    for (let i = 0; i < n; i++) {
      const predicted = Xother[i].reduce((sum, xVal, k) => sum + xVal * beta[k], 0);
      ssTot += Math.pow(yj[i] - yMean, 2);
      ssRes += Math.pow(yj[i] - predicted, 2);
    }

    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const vif = r2 < 1 ? 1 / (1 - r2) : Infinity;
    vifs.push(vif);
  }

  return vifs;
}

/**
 * Get VIF warnings based on severity thresholds
 */
function getVIFWarnings(vifs: number[], termNames: string[]): VIFWarning[] {
  const warnings: VIFWarning[] = [];

  vifs.forEach((vif, i) => {
    if (vif >= 5) {
      let severity: 'moderate' | 'high' | 'severe';
      let suggestion: string;

      if (vif >= 10) {
        severity = 'severe';
        suggestion = `Consider removing ${termNames[i]} or combining with correlated predictors`;
      } else if (vif >= 7) {
        severity = 'high';
        suggestion = `${termNames[i]} is highly correlated with other predictors`;
      } else {
        severity = 'moderate';
        suggestion = `${termNames[i]} shows some correlation with other predictors`;
      }

      warnings.push({
        term: termNames[i],
        vif,
        severity,
        suggestion,
      });
    }
  });

  return warnings;
}

/**
 * Get strength rating (1-5) based on adjusted R² value
 */
function getAdjustedRSquaredRating(adjR2: number): 1 | 2 | 3 | 4 | 5 {
  if (adjR2 >= 0.9) return 5;
  if (adjR2 >= 0.7) return 4;
  if (adjR2 >= 0.5) return 3;
  if (adjR2 >= 0.3) return 2;
  return 1;
}

/**
 * Generate plain-language insight for multiple regression results
 */
function generateMultiRegressionInsight(result: {
  yColumn: string;
  isSignificant: boolean;
  adjustedRSquared: number;
  coefficients: CoefficientResult[];
  topPredictors: string[];
  hasCollinearity: boolean;
}): string {
  if (!result.isSignificant) {
    return `No significant relationship found for ${result.yColumn}`;
  }

  const sigCoeffs = result.coefficients.filter(c => c.isSignificant);
  if (sigCoeffs.length === 0) {
    return `Model is significant overall but no individual predictors stand out`;
  }

  // Find the strongest predictor by standardized coefficient
  const strongest = [...sigCoeffs].sort(
    (a, b) => Math.abs(b.standardized) - Math.abs(a.standardized)
  )[0];

  const direction = strongest.coefficient > 0 ? 'increases' : 'decreases';
  const effect = formatStatistic(Math.abs(strongest.coefficient), 'en', 2);

  let insight = `${strongest.term} ${direction} ${result.yColumn} by ${effect} per unit`;

  if (result.topPredictors.length > 1) {
    insight += `. Top predictors: ${result.topPredictors.slice(0, 3).join(', ')}`;
  }

  if (result.hasCollinearity) {
    insight += ' (multicollinearity detected)';
  }

  return insight;
}

/**
 * Calculate multiple regression analysis using Ordinary Least Squares (OLS)
 *
 * Fits a General Linear Model: Y = β₀ + β₁X₁ + β₂X₂ + ... + ε
 *
 * Supports:
 * - Multiple continuous predictors
 * - Categorical predictors (dummy-encoded)
 * - Two-way interaction terms
 * - VIF diagnostics for multicollinearity
 *
 * @param data - Array of data records
 * @param yColumn - Column name for response (Y) variable
 * @param xColumns - Column names for predictor (X) variables
 * @param options - Optional settings for categorical encoding, interactions
 * @returns MultiRegressionResult with coefficients, fit statistics, and diagnostics
 *
 * @example
 * // Basic multiple regression with continuous predictors
 * const result = calculateMultipleRegression(data, 'Yield', ['Temperature', 'Pressure']);
 *
 * @example
 * // With categorical predictor and interactions
 * const result = calculateMultipleRegression(data, 'Yield', ['Temperature', 'Machine'], {
 *   categoricalColumns: ['Machine'],
 *   includeInteractions: true
 * });
 */
export function calculateMultipleRegression<T extends Record<string, unknown>>(
  data: T[],
  yColumn: string,
  xColumns: string[],
  options: MultiRegressionOptions = {}
): MultiRegressionResult | null {
  // Validate inputs
  if (data.length === 0 || xColumns.length === 0) return null;

  // Build design matrix
  const design = buildFullDesignMatrix(data, yColumn, xColumns, options);
  if (!design) return null;

  const { X, Y, terms, termNames, n } = design;
  const p = terms.length; // Number of predictors (excluding intercept)

  // Need sufficient degrees of freedom
  if (n <= p + 1) return null;

  // OLS: β̂ = (X'X)⁻¹X'Y
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  if (!XtX) return null;

  const XtXinv = inverse(XtX);
  if (!XtXinv) return null;

  const XtY = multiplyVector(Xt, Y);
  if (!XtY) return null;

  const beta = multiplyVector(XtXinv, XtY);
  if (!beta) return null;

  const intercept = beta[0];

  // Calculate fitted values and residuals
  const yMean = Y.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0;
  let ssRes = 0;
  let ssReg = 0;

  const fitted: number[] = [];
  for (let i = 0; i < n; i++) {
    let yHat = 0;
    for (let j = 0; j < X[i].length; j++) {
      yHat += X[i][j] * beta[j];
    }
    fitted.push(yHat);

    ssTot += Math.pow(Y[i] - yMean, 2);
    ssRes += Math.pow(Y[i] - yHat, 2);
    ssReg += Math.pow(yHat - yMean, 2);
  }

  // R² and Adjusted R²
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - p - 1);

  // Mean Square Error
  const dfRes = n - p - 1;
  const mse = dfRes > 0 ? ssRes / dfRes : 0;
  const rmse = Math.sqrt(mse);

  // F-statistic for overall model significance
  const dfReg = p;
  const msReg = dfReg > 0 ? ssReg / dfReg : 0;
  const fStatistic = mse > 0 ? msReg / mse : 0;
  const pValueF = fDistributionPValue(fStatistic, dfReg, dfRes);
  const isSignificant = pValueF < 0.05;

  // Calculate standard errors and t-statistics for each coefficient
  // SE(β̂) = sqrt(MSE * diag((X'X)⁻¹))
  const diagonalXtXinv = diagonal(XtXinv);

  // Calculate standardized coefficients (need predictor std devs)
  const xStdDevs: number[] = [1]; // Placeholder for intercept
  for (let j = 1; j <= p; j++) {
    const xCol = X.map(row => row[j]);
    const xMean = xCol.reduce((a, b) => a + b, 0) / n;
    const variance = xCol.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / (n - 1);
    xStdDevs.push(Math.sqrt(variance));
  }
  const yStdDev = Math.sqrt(ssTot / (n - 1));

  const coefficients: CoefficientResult[] = [];
  for (let j = 0; j < p; j++) {
    const coef = beta[j + 1]; // +1 to skip intercept
    const se = Math.sqrt(mse * diagonalXtXinv[j + 1]);
    const tStat = se > 0 ? coef / se : 0;
    const pValue = se > 0 ? tDistributionPValue(tStat, dfRes) : 1;

    // Standardized coefficient: β* = β × (sx / sy)
    const standardized =
      yStdDev > 0 && xStdDevs[j + 1] > 0 ? coef * (xStdDevs[j + 1] / yStdDev) : 0;

    coefficients.push({
      term: termNames[j],
      coefficient: coef,
      stdError: se,
      tStatistic: tStat,
      pValue,
      isSignificant: pValue < 0.05,
      standardized,
      termInfo: terms[j],
    });
  }

  // Calculate VIF for multicollinearity detection
  const vifs = calculateVIF(X);
  vifs.forEach((vif, i) => {
    if (i < coefficients.length) {
      coefficients[i].vif = vif;
    }
  });

  const vifWarnings = getVIFWarnings(vifs, termNames);
  const hasCollinearity = vifWarnings.some(w => w.severity === 'severe');

  // Top predictors by absolute standardized coefficient
  const topPredictors = [...coefficients]
    .filter(c => c.isSignificant)
    .sort((a, b) => Math.abs(b.standardized) - Math.abs(a.standardized))
    .map(c => c.term)
    .slice(0, 5);

  const strengthRating = getAdjustedRSquaredRating(adjustedRSquared);

  const insight = generateMultiRegressionInsight({
    yColumn,
    isSignificant,
    adjustedRSquared,
    coefficients,
    topPredictors,
    hasCollinearity,
  });

  return {
    yColumn,
    xColumns,
    terms,
    n,
    p,
    rSquared,
    adjustedRSquared,
    fStatistic,
    pValue: pValueF,
    isSignificant,
    rmse,
    intercept,
    coefficients,
    vifWarnings,
    hasCollinearity,
    insight,
    topPredictors,
    strengthRating,
  };
}
