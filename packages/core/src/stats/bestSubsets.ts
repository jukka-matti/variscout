/**
 * Best subsets regression — factor prioritization via R² adjusted.
 *
 * Evaluates all 2^k − 1 non-empty subsets of factor groups and ranks them by
 * adjusted R² (how much outcome variation each factor combination explains).
 *
 * Uses a unified OLS engine that handles both categorical factors (reference
 * coding with k-1 indicator columns) and continuous factors (slope coefficients
 * with optional quadratic terms). Factor groups are enumerated, not individual
 * predictor columns, so 2^k stays manageable.
 *
 * Methodology note (from domain expert discussion):
 *   "Don't search for the function first. Search for which variables
 *    make a difference by contributing to the overall explanation of
 *    variation and which ones don't. That's best subsets regression."
 */

import * as d3 from 'd3-array';
import type { DataRow, PredictorInfo, TypeIIIResult } from '../types';
import { toNumericValue } from '../types';
import { fDistributionPValue } from './distributions';
import { classifyAllFactors } from './factorTypeDetection';
import type { FactorSpec, FactorEncoding } from './designMatrix';
import { buildDesignMatrix } from './designMatrix';
import { solveOLS, shouldIncludeQuadratic } from './olsRegression';
import type { OLSSolution } from './olsRegression';
import { computeTypeIIISS } from './typeIIISS';
import type { ResolvedMode } from '../analysisStrategy';

// ============================================================================
// Types
// ============================================================================

/**
 * Result for one factor subset in the best subsets analysis.
 */
export interface BestSubsetResult {
  /** Factor names included in this subset */
  factors: string[];
  /** Number of factors in the subset */
  factorCount: number;
  /** R² — proportion of total variance explained (SSB / SST) */
  rSquared: number;
  /** R² adjusted — penalised for number of model parameters */
  rSquaredAdj: number;
  /** F-statistic for the overall model */
  fStatistic: number;
  /** P-value from F-distribution */
  pValue: number;
  /** Whether the overall model is significant (p < 0.05) */
  isSignificant: boolean;
  /** Total degrees of freedom consumed by this model */
  dfModel: number;
  /** Level effects relative to grand mean. factor → (level → effect) */
  levelEffects: Map<string, Map<string, number>>;
  /** Cell means. compound key → { mean, n } */
  cellMeans: Map<string, { mean: number; n: number }>;

  // === NEW fields for continuous support (optional, backward-compatible) ===

  /** Continuous predictor coefficients and diagnostics */
  predictors?: PredictorInfo[];
  /** Intercept value */
  intercept?: number;
  /** Model type used */
  modelType?: 'anova' | 'ols' | 'glm';
  /** Factor type classification */
  factorTypes?: Map<string, 'continuous' | 'categorical'>;
  /** Reference levels for categorical factors */
  referenceLevels?: Map<string, string>;
  /** Whether quadratic terms are included */
  hasQuadraticTerms?: boolean;
  /** RMSE */
  rmse?: number;
  /** VIF per predictor (keyed by factor name for grouped factors) */
  vif?: Map<string, number>;
  /** Type III SS per factor */
  typeIIIResults?: Map<string, TypeIIIResult>;
  /** Model warnings */
  warnings?: string[];
}

/**
 * Complete best subsets analysis result.
 */
export interface BestSubsetsResult {
  /** All evaluated subsets, sorted by R² adjusted (descending) */
  subsets: BestSubsetResult[];
  /** Total number of observations */
  n: number;
  /** Total number of factors evaluated */
  totalFactors: number;
  /** Factor names in the analysis */
  factorNames: string[];
  /** Grand mean of the outcome */
  grandMean: number;
  /** Total sum of squares (SST) */
  ssTotal: number;

  // === NEW fields ===

  /** Factor type classification */
  factorTypes?: Map<string, 'continuous' | 'categorical'>;
  /** Whether OLS engine was used (true if any continuous factor) */
  usedOLS?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of factors to avoid combinatorial explosion (2^10 = 1024 subsets) */
const MAX_FACTORS = 10;

/** Minimum observations required for meaningful analysis */
const MIN_OBSERVATIONS = 5;

/** R² - R²adj gap threshold for overfitting warning */
const OVERFITTING_GAP_THRESHOLD = 0.1;

/** Minimum observations per predictor ratio */
const MIN_OBS_PER_PREDICTOR = 10;

// ============================================================================
// Core algorithm
// ============================================================================

/**
 * Compute R² adjusted.
 *
 * R²adj = 1 − (1 − R²) × (n − 1) / (n − k − 1)
 *
 * where:
 *   R² = SSmodel / SStotal
 *   n  = number of observations
 *   k  = number of model parameters (excluding intercept)
 */
export function computeRSquaredAdjusted(rSquared: number, n: number, k: number): number {
  if (n - k - 1 <= 0) return 0; // Saturated or over-determined model
  return 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);
}

// ============================================================================
// Internal: Pure ANOVA cell-means approach (for all-categorical, backward compat)
// ============================================================================

interface SubsetSSResult {
  ssb: number;
  ssw: number;
  dfModel: number;
  cellMeans: Map<string, { mean: number; n: number }>;
}

function computeSubsetSS(values: number[], factorColumns: string[][], n: number): SubsetSSResult {
  const groups = new Map<string, number[]>();

  for (let i = 0; i < n; i++) {
    const key = factorColumns.map(col => col[i]).join('\x00');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(values[i]);
  }

  const grandMean = d3.mean(values) ?? 0;
  let ssb = 0;
  let ssw = 0;
  const cellMeans = new Map<string, { mean: number; n: number }>();

  for (const [key, vals] of groups.entries()) {
    const groupMean = d3.mean(vals) ?? 0;
    cellMeans.set(key, { mean: groupMean, n: vals.length });
    ssb += vals.length * (groupMean - grandMean) ** 2;
    for (const v of vals) {
      ssw += (v - groupMean) ** 2;
    }
  }

  const dfModel = groups.size - 1;
  return { ssb, ssw, dfModel, cellMeans };
}

/**
 * Compute marginal level effects for each factor in a subset.
 */
function computeLevelEffects(
  subsetFactors: string[],
  cellMeans: Map<string, { mean: number; n: number }>,
  grandMean: number
): Map<string, Map<string, number>> {
  const effects = new Map<string, Map<string, number>>();

  for (let fi = 0; fi < subsetFactors.length; fi++) {
    const factorName = subsetFactors[fi];
    const levelSums = new Map<string, number>();
    const levelCounts = new Map<string, number>();

    for (const [key, { mean, n }] of cellMeans.entries()) {
      const parts = key.split('\x00');
      const level = parts[fi];
      levelSums.set(level, (levelSums.get(level) ?? 0) + mean * n);
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + n);
    }

    const levelEffects = new Map<string, number>();
    for (const [level, sum] of levelSums.entries()) {
      const count = levelCounts.get(level) ?? 1;
      const marginalMean = sum / count;
      levelEffects.set(level, marginalMean - grandMean);
    }

    effects.set(factorName, levelEffects);
  }

  return effects;
}

// ============================================================================
// Internal: OLS-based approach for mixed/continuous factors
// ============================================================================

/**
 * Build level effects from cell-means approach for categorical factors
 * (backward compatible with ANOVA approach).
 */
function computeLevelEffectsFromData(
  data: DataRow[],
  outcome: string,
  categoricalFactors: string[],
  grandMean: number
): Map<string, Map<string, number>> {
  const effects = new Map<string, Map<string, number>>();

  for (const factor of categoricalFactors) {
    const groups = new Map<string, number[]>();
    for (const row of data) {
      const val = toNumericValue(row[outcome]);
      if (val === undefined) continue;
      const level = String(row[factor] ?? '');
      if (!level || level === 'undefined' || level === 'null') continue;
      if (!groups.has(level)) groups.set(level, []);
      groups.get(level)!.push(val);
    }

    const levelEffects = new Map<string, number>();
    for (const [level, vals] of groups.entries()) {
      const levelMean = d3.mean(vals) ?? 0;
      levelEffects.set(level, levelMean - grandMean);
    }
    effects.set(factor, levelEffects);
  }

  return effects;
}

/**
 * Build cell means from data for a subset of factors.
 */
function computeCellMeansFromData(
  data: DataRow[],
  outcome: string,
  factors: string[]
): Map<string, { mean: number; n: number }> {
  const groups = new Map<string, number[]>();

  for (const row of data) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const parts: string[] = [];
    let valid = true;
    for (const f of factors) {
      const v = String(row[f] ?? '');
      if (!v || v === 'undefined' || v === 'null') {
        valid = false;
        break;
      }
      parts.push(v);
    }
    if (!valid) continue;

    const key = parts.join('\x00');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(val);
  }

  const cellMeans = new Map<string, { mean: number; n: number }>();
  for (const [key, vals] of groups.entries()) {
    cellMeans.set(key, { mean: d3.mean(vals) ?? 0, n: vals.length });
  }
  return cellMeans;
}

/**
 * Extract PredictorInfo from OLS solution and encodings.
 */
function extractPredictors(solution: OLSSolution, encodings: FactorEncoding[]): PredictorInfo[] {
  const predictors: PredictorInfo[] = [];

  for (const enc of encodings) {
    if (enc.type === 'categorical') {
      const nonRefLevels = enc.levels!.filter(l => l !== enc.referenceLevel);
      for (let li = 0; li < nonRefLevels.length; li++) {
        const colIdx = enc.columnIndices[li];
        predictors.push({
          name: `${enc.factorName}[${nonRefLevels[li]}]`,
          factorName: enc.factorName,
          type: 'categorical',
          level: nonRefLevels[li],
          coefficient: solution.coefficients[colIdx],
          standardError: solution.standardErrors[colIdx],
          tStatistic: solution.tStatistics[colIdx],
          pValue: solution.pValues[colIdx],
          isSignificant: solution.pValues[colIdx] < 0.05,
        });
      }
    } else {
      // Continuous — linear term
      const linearIdx = enc.columnIndices[0];
      predictors.push({
        name: enc.factorName,
        factorName: enc.factorName,
        type: 'continuous',
        coefficient: solution.coefficients[linearIdx],
        standardError: solution.standardErrors[linearIdx],
        tStatistic: solution.tStatistics[linearIdx],
        pValue: solution.pValues[linearIdx],
        isSignificant: solution.pValues[linearIdx] < 0.05,
        mean: enc.mean,
      });

      // Quadratic term if present
      if (enc.quadraticIndex !== undefined) {
        const qIdx = enc.quadraticIndex;
        predictors.push({
          name: `${enc.factorName}²`,
          factorName: enc.factorName,
          type: 'quadratic',
          coefficient: solution.coefficients[qIdx],
          standardError: solution.standardErrors[qIdx],
          tStatistic: solution.tStatistics[qIdx],
          pValue: solution.pValues[qIdx],
          isSignificant: solution.pValues[qIdx] < 0.05,
          mean: enc.mean,
        });
      }
    }
  }

  return predictors;
}

/**
 * Compute VIF for each factor group.
 *
 * For a factor with multiple columns (categorical dummies, or linear+quadratic),
 * compute the generalized VIF: regress those columns on all other predictor columns,
 * compute R², and VIF = 1 / (1 - R²).
 *
 * For single-column predictors, standard VIF formula applies.
 */
function computeVIF(
  X: Float64Array[],
  n: number,
  _p: number,
  encodings: FactorEncoding[]
): Map<string, number> {
  const vifMap = new Map<string, number>();

  if (encodings.length <= 1) {
    // Single factor — VIF is meaningless (no other predictors to compare against)
    if (encodings.length === 1) {
      vifMap.set(encodings[0].factorName, 1.0);
    }
    return vifMap;
  }

  for (let fi = 0; fi < encodings.length; fi++) {
    const enc = encodings[fi];
    const targetCols = enc.columnIndices;

    // For grouped factors, use the average VIF across columns in the group
    let totalVIF = 0;

    for (const targetCol of targetCols) {
      // Build X_other: intercept + all other predictor columns
      const otherCols: Float64Array[] = [X[0]]; // intercept
      for (let oi = 0; oi < encodings.length; oi++) {
        if (oi === fi) continue;
        for (const col of encodings[oi].columnIndices) {
          otherCols.push(X[col]);
        }
      }

      if (otherCols.length <= 1) {
        // Only intercept — VIF = 1
        totalVIF += 1.0;
        continue;
      }

      try {
        const result = solveOLS(otherCols, X[targetCol], n, otherCols.length);
        const r2 = result.rSquared;
        totalVIF += r2 < 1 ? 1 / (1 - r2) : Infinity;
      } catch {
        totalVIF += 1.0;
      }
    }

    vifMap.set(enc.factorName, targetCols.length > 0 ? totalVIF / targetCols.length : 1.0);
  }

  return vifMap;
}

/**
 * Generate model warnings (guardrails).
 */
function checkGuardrails(
  solution: OLSSolution,
  n: number,
  p: number,
  vif: Map<string, number>
): string[] {
  const warnings: string[] = [];

  // Overfitting: R² - R²adj gap too large
  const gap = solution.rSquared - solution.rSquaredAdj;
  if (gap > OVERFITTING_GAP_THRESHOLD) {
    warnings.push(
      `Possible overfitting: R² - R²adj = ${gap.toFixed(3)} (threshold: ${OVERFITTING_GAP_THRESHOLD})`
    );
  }

  // Observation-to-predictor ratio
  const ratio = n / (p - 1); // p includes intercept
  if (p > 1 && ratio < MIN_OBS_PER_PREDICTOR) {
    warnings.push(
      `Low observation-to-predictor ratio: ${ratio.toFixed(1)} (recommended: ≥ ${MIN_OBS_PER_PREDICTOR})`
    );
  }

  // High VIF
  for (const [factor, vifValue] of vif.entries()) {
    if (vifValue > 10) {
      warnings.push(`High multicollinearity: VIF(${factor}) = ${vifValue.toFixed(1)} (> 10)`);
    }
  }

  return warnings;
}

// ============================================================================
// Main exported function
// ============================================================================

/**
 * Evaluate all 2^k − 1 non-empty subsets of factors and rank by R² adjusted.
 *
 * Automatically detects factor types (continuous vs categorical) and uses:
 * - Pure ANOVA cell-means for all-categorical (backward compatible)
 * - OLS with design matrices for mixed or all-continuous data
 *
 * @param data - Data rows
 * @param outcome - Outcome column name
 * @param factors - Factor column names (max 10)
 * @returns Ranked results or null if insufficient data
 */
export function computeBestSubsets(
  data: DataRow[],
  outcome: string,
  factors: string[]
): BestSubsetsResult | null {
  if (factors.length === 0 || factors.length > MAX_FACTORS) return null;

  // Extract valid numeric outcome values and corresponding factor labels
  const validValues: number[] = [];
  const factorColumns: string[][] = factors.map(() => []);

  for (const row of data) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    const factorVals = factors.map(f => String(row[f] ?? ''));
    if (factorVals.some(v => v === '' || v === 'undefined' || v === 'null')) continue;

    validValues.push(val);
    factorVals.forEach((v, i) => factorColumns[i].push(v));
  }

  const n = validValues.length;
  if (n < MIN_OBSERVATIONS) return null;

  const grandMean = d3.mean(validValues) ?? 0;
  const ssTotal = d3.sum(validValues, v => (v - grandMean) ** 2);
  if (ssTotal === 0) return null;

  // Classify factor types
  const classifications = classifyAllFactors(data, factors);
  const factorTypeMap = new Map<string, 'continuous' | 'categorical'>();
  for (const [name, cls] of classifications.entries()) {
    factorTypeMap.set(name, cls.type);
  }

  const hasContinuous = Array.from(factorTypeMap.values()).some(t => t === 'continuous');

  // Decide engine path
  if (hasContinuous) {
    return computeBestSubsetsOLS(data, outcome, factors, factorTypeMap, n, grandMean, ssTotal);
  }

  // All-categorical: use original ANOVA cell-means approach (backward compatible)
  return computeBestSubsetsANOVA(factors, validValues, factorColumns, n, grandMean, ssTotal);
}

/**
 * All-categorical ANOVA path (preserves exact backward compatibility).
 */
function computeBestSubsetsANOVA(
  factors: string[],
  validValues: number[],
  factorColumns: string[][],
  n: number,
  grandMean: number,
  ssTotal: number
): BestSubsetsResult {
  const k = factors.length;
  const totalSubsets = (1 << k) - 1;
  const subsets: BestSubsetResult[] = [];

  for (let mask = 1; mask <= totalSubsets; mask++) {
    const subsetFactors: string[] = [];
    const subsetColumns: string[][] = [];
    for (let j = 0; j < k; j++) {
      if (mask & (1 << j)) {
        subsetFactors.push(factors[j]);
        subsetColumns.push(factorColumns[j]);
      }
    }

    const { ssb, ssw, dfModel, cellMeans } = computeSubsetSS(validValues, subsetColumns, n);
    const rSquared = ssTotal > 0 ? ssb / ssTotal : 0;
    const rSquaredAdj = computeRSquaredAdjusted(rSquared, n, dfModel);

    const dfResidual = n - dfModel - 1;
    let fStatistic = 0;
    let pValue = 1;

    if (dfModel > 0 && dfResidual > 0 && ssw > 0) {
      const msModel = ssb / dfModel;
      const msResidual = ssw / dfResidual;
      fStatistic = msModel / msResidual;
      pValue = fDistributionPValue(fStatistic, dfModel, dfResidual);
    }

    const levelEffects = computeLevelEffects(subsetFactors, cellMeans, grandMean);

    subsets.push({
      factors: subsetFactors,
      factorCount: subsetFactors.length,
      rSquared,
      rSquaredAdj,
      fStatistic,
      pValue,
      isSignificant: pValue < 0.05,
      dfModel,
      levelEffects,
      cellMeans,
    });
  }

  subsets.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  return {
    subsets,
    n,
    totalFactors: factors.length,
    factorNames: factors,
    grandMean,
    ssTotal,
  };
}

/**
 * OLS path for mixed continuous+categorical factors.
 *
 * Group-constrained enumeration: iterate over factor groups (2^k-1),
 * not individual predictor columns.
 */
function computeBestSubsetsOLS(
  data: DataRow[],
  outcome: string,
  factors: string[],
  factorTypeMap: Map<string, 'continuous' | 'categorical'>,
  n: number,
  grandMean: number,
  ssTotal: number
): BestSubsetsResult {
  const k = factors.length;

  // Pre-screen continuous factors for quadratic terms
  const quadraticFlags = new Map<string, boolean>();
  for (const factor of factors) {
    if (factorTypeMap.get(factor) === 'continuous') {
      // Extract y and x for this factor
      const yVals: number[] = [];
      const xVals: number[] = [];
      for (const row of data) {
        const yVal = toNumericValue(row[outcome]);
        const xVal = toNumericValue(row[factor]);
        if (yVal !== undefined && xVal !== undefined) {
          yVals.push(yVal);
          xVals.push(xVal);
        }
      }

      if (yVals.length >= 4) {
        const yArr = new Float64Array(yVals);
        const xArr = new Float64Array(xVals);
        const qResult = shouldIncludeQuadratic(yArr, xArr, yVals.length);
        quadraticFlags.set(factor, qResult.include);
      } else {
        quadraticFlags.set(factor, false);
      }
    }
  }

  // Build factor specs with type info
  const allSpecs: FactorSpec[] = factors.map(f => ({
    name: f,
    type: factorTypeMap.get(f) ?? 'categorical',
    includeQuadratic: quadraticFlags.get(f) ?? false,
  }));

  const totalSubsets = (1 << k) - 1;
  const subsets: BestSubsetResult[] = [];

  for (let mask = 1; mask <= totalSubsets; mask++) {
    const selectedSpecs: FactorSpec[] = [];
    const selectedFactors: string[] = [];
    for (let j = 0; j < k; j++) {
      if (mask & (1 << j)) {
        selectedSpecs.push(allSpecs[j]);
        selectedFactors.push(factors[j]);
      }
    }

    // Build design matrix and solve OLS
    let matrixResult;
    try {
      matrixResult = buildDesignMatrix(data, outcome, selectedSpecs);
    } catch {
      continue;
    }

    if (matrixResult.n < matrixResult.p + 1 || matrixResult.n < MIN_OBSERVATIONS) {
      continue;
    }

    let solution: OLSSolution;
    try {
      solution = solveOLS(matrixResult.X, matrixResult.y, matrixResult.n, matrixResult.p);
    } catch {
      continue;
    }

    // Compute cell means and level effects for categorical factors using data
    const categoricalFactors = selectedFactors.filter(f => factorTypeMap.get(f) === 'categorical');

    const levelEffects =
      categoricalFactors.length > 0
        ? computeLevelEffectsFromData(data, outcome, categoricalFactors, grandMean)
        : new Map<string, Map<string, number>>();

    const cellMeans =
      selectedFactors.length > 0
        ? computeCellMeansFromData(data, outcome, selectedFactors)
        : new Map<string, { mean: number; n: number }>();

    // Build predictor info
    const predictors = extractPredictors(solution, matrixResult.encodings);

    // Reference levels
    const referenceLevels = new Map<string, string>();
    for (const enc of matrixResult.encodings) {
      if (enc.type === 'categorical' && enc.referenceLevel) {
        referenceLevels.set(enc.factorName, enc.referenceLevel);
      }
    }

    const dfModel = matrixResult.p - 1; // subtract intercept
    const hasQuadratic = selectedSpecs.some(s => s.includeQuadratic);

    // Build subset factor types
    const subsetFactorTypes = new Map<string, 'continuous' | 'categorical'>();
    for (const f of selectedFactors) {
      subsetFactorTypes.set(f, factorTypeMap.get(f) ?? 'categorical');
    }

    subsets.push({
      factors: selectedFactors,
      factorCount: selectedFactors.length,
      rSquared: solution.rSquared,
      rSquaredAdj: solution.rSquaredAdj,
      fStatistic: solution.fStatistic,
      pValue: solution.fPValue,
      isSignificant: solution.fPValue < 0.05,
      dfModel,
      levelEffects,
      cellMeans,
      // New OLS fields
      predictors,
      intercept: solution.coefficients[0],
      modelType: 'ols',
      factorTypes: subsetFactorTypes,
      referenceLevels,
      hasQuadraticTerms: hasQuadratic,
      rmse: solution.rmse,
    });
  }

  subsets.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  // For the best model, compute Type III SS, VIF, and warnings
  if (subsets.length > 0) {
    const best = subsets[0];
    const bestSpecs = best.factors.map(f => ({
      name: f,
      type: factorTypeMap.get(f) ?? ('categorical' as const),
      includeQuadratic: quadraticFlags.get(f) ?? false,
    }));

    // Type III SS
    const typeIIIResults = computeTypeIIISS(data, outcome, bestSpecs);
    if (typeIIIResults) {
      best.typeIIIResults = typeIIIResults;
    }

    // VIF
    try {
      const matrixResult = buildDesignMatrix(data, outcome, bestSpecs);
      const vif = computeVIF(
        matrixResult.X,
        matrixResult.n,
        matrixResult.p,
        matrixResult.encodings
      );
      best.vif = vif;

      // Guardrails
      const solution = solveOLS(matrixResult.X, matrixResult.y, matrixResult.n, matrixResult.p);
      best.warnings = checkGuardrails(solution, matrixResult.n, matrixResult.p, vif);
    } catch {
      // VIF computation failed — not critical
    }
  }

  return {
    subsets,
    n,
    totalFactors: k,
    factorNames: factors,
    grandMean,
    ssTotal,
    factorTypes: factorTypeMap,
    usedOLS: true,
  };
}

// ============================================================================
// Question generation (Layer 1 → investigation questions)
// ============================================================================

/**
 * A generated investigation question from Factor Intelligence analysis.
 */
export interface GeneratedQuestion {
  /** Question text, e.g., "Does Shift explain variation?" */
  text: string;
  /** Factor(s) this question is about */
  factors: string[];
  /** R²adj evidence for ranking */
  rSquaredAdj: number;
  /** Whether this question is auto-answered (R²adj below threshold) */
  autoAnswered: boolean;
  /** Auto-answer status if applicable */
  autoStatus?: 'ruled-out';
  /** Question source */
  source: 'factor-intel';
  /** Question type */
  type:
    | 'single-factor'
    | 'combination'
    | 'main-effect'
    | 'interaction'
    | 'curve-shape'
    | 'optimal-value';
}

/** Maximum number of multi-factor combination questions to generate */
const MAX_COMBINATION_QUESTIONS = 5;

/** Mode-dispatched question formatters (ADR-047 pattern). */
const singleFactorFormatters: Record<ResolvedMode, (factor: string) => string> = {
  standard: f => `Does ${f} explain variation?`,
  capability: f => `Does ${f} affect Cpk?`,
  yamazumi: f => `Does ${f} explain variation?`,
  performance: f => `Does ${f} affect channel performance?`,
};

const combinationFormatters: Record<ResolvedMode, (factorList: string) => string> = {
  standard: fl => `Does ${fl} together explain more variation?`,
  capability: fl => `Does ${fl} together affect Cpk more?`,
  yamazumi: fl => `Does ${fl} together explain more variation?`,
  performance: fl => `Does ${fl} together affect channel performance more?`,
};

function formatSingleFactorQuestion(factor: string, mode?: ResolvedMode): string {
  return singleFactorFormatters[mode ?? 'standard'](factor);
}

function formatCombinationQuestion(factorList: string, mode?: ResolvedMode): string {
  return combinationFormatters[mode ?? 'standard'](factorList);
}

export function generateQuestionsFromRanking(
  result: BestSubsetsResult,
  options?: { autoRuleOutThreshold?: number; mode?: ResolvedMode }
): GeneratedQuestion[] {
  const threshold = options?.autoRuleOutThreshold ?? 0.05;
  const mode = options?.mode;
  const questions: GeneratedQuestion[] = [];

  const singles: BestSubsetResult[] = [];
  const combos: BestSubsetResult[] = [];

  for (const subset of result.subsets) {
    if (subset.rSquaredAdj <= 0) continue;

    if (subset.factorCount === 1) {
      singles.push(subset);
    } else {
      combos.push(subset);
    }
  }

  for (const subset of singles) {
    const isRuledOut = subset.rSquaredAdj < threshold;
    questions.push({
      text: formatSingleFactorQuestion(subset.factors[0], mode),
      factors: subset.factors,
      rSquaredAdj: subset.rSquaredAdj,
      autoAnswered: isRuledOut,
      ...(isRuledOut ? { autoStatus: 'ruled-out' as const } : {}),
      source: 'factor-intel',
      type: 'single-factor',
    });
  }

  for (const subset of combos.slice(0, MAX_COMBINATION_QUESTIONS)) {
    const isRuledOut = subset.rSquaredAdj < threshold;
    const factorList = subset.factors.join(' + ');
    questions.push({
      text: formatCombinationQuestion(factorList, mode),
      factors: subset.factors,
      rSquaredAdj: subset.rSquaredAdj,
      autoAnswered: isRuledOut,
      ...(isRuledOut ? { autoStatus: 'ruled-out' as const } : {}),
      source: 'factor-intel',
      type: 'combination',
    });
  }

  questions.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  return questions;
}

export function getBestSingleFactor(
  data: DataRow[],
  outcome: string,
  factors: string[]
): BestSubsetResult | null {
  const result = computeBestSubsets(data, outcome, factors);
  if (!result) return null;

  const singles = result.subsets.filter(s => s.factorCount === 1);
  return singles.length > 0 ? singles[0] : null;
}

// ============================================================================
// Model prediction from level effects
// ============================================================================

/** A single factor level change in a model prediction */
export interface LevelChange {
  /** Factor name */
  factor: string;
  /** Current level value */
  from: string;
  /** Target level value */
  to: string;
  /** Delta = target effect - current effect */
  effect: number;
}

/** Prediction result from an additive model */
export interface ModelPrediction {
  /** Predicted mean at target levels */
  predictedMean: number;
  /** Change in predicted mean (target - current) */
  meanDelta: number;
  /** Per-factor level changes with individual deltas */
  levelChanges: LevelChange[];
}

/**
 * Predict the mean change from switching factor levels, using the additive
 * level-effects model from a best subset result.
 *
 * Returns null if any factor or level is missing from the model.
 */
export function predictFromModel(
  bestSubset: BestSubsetResult,
  grandMean: number,
  currentLevels: Record<string, string>,
  targetLevels: Record<string, string>
): ModelPrediction | null {
  let currentPredicted = grandMean;
  let targetPredicted = grandMean;
  const levelChanges: LevelChange[] = [];

  for (const factor of bestSubset.factors) {
    const factorEffects = bestSubset.levelEffects.get(factor);
    if (!factorEffects) return null;

    const currentLevel = currentLevels[factor];
    const targetLevel = targetLevels[factor];
    if (currentLevel === undefined || targetLevel === undefined) return null;

    const currentEffect = factorEffects.get(currentLevel);
    const targetEffect = factorEffects.get(targetLevel);
    if (currentEffect === undefined || targetEffect === undefined) return null;

    currentPredicted += currentEffect;
    targetPredicted += targetEffect;

    levelChanges.push({
      factor,
      from: currentLevel,
      to: targetLevel,
      effect: targetEffect - currentEffect,
    });
  }

  return {
    predictedMean: targetPredicted,
    meanDelta: targetPredicted - currentPredicted,
    levelChanges,
  };
}

// ============================================================================
// Unified prediction for mixed continuous+categorical models
// ============================================================================

/**
 * Predict the outcome value for a given set of factor values using the
 * unified OLS model. Handles both continuous and categorical factors.
 *
 * @param bestSubset - A BestSubsetResult from the OLS engine (must have predictors and intercept)
 * @param factorValues - Map from factor name to its value (string for categorical, number for continuous)
 * @returns Predicted outcome value, or null if the model lacks OLS info
 */
export function predictFromUnifiedModel(
  bestSubset: BestSubsetResult,
  factorValues: Record<string, string | number>
): number | null {
  if (bestSubset.intercept === undefined || !bestSubset.predictors) {
    return null;
  }

  let predicted = bestSubset.intercept;

  for (const predictor of bestSubset.predictors) {
    const rawValue = factorValues[predictor.factorName];
    if (rawValue === undefined) return null;

    if (predictor.type === 'categorical') {
      // Dummy coding: 1 if value matches level, 0 otherwise
      const isMatch = String(rawValue) === predictor.level;
      predicted += isMatch ? predictor.coefficient : 0;
    } else if (predictor.type === 'continuous') {
      const numVal = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
      if (isNaN(numVal)) return null;
      predicted += predictor.coefficient * numVal;
    } else if (predictor.type === 'quadratic') {
      // Quadratic term uses centered value: coefficient * (x - mean)²
      const numVal = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
      if (isNaN(numVal)) return null;
      const centered = numVal - (predictor.mean ?? 0);
      predicted += predictor.coefficient * centered * centered;
    }
  }

  return predicted;
}

// ============================================================================
// Investigation coverage
// ============================================================================

/** Result of computing investigation coverage */
export interface CoverageResult {
  /** Number of checked (answered or ruled-out) questions */
  checked: number;
  /** Total number of questions */
  total: number;
  /** Percentage of R²adj explored (0-100) */
  exploredPercent: number;
}

/**
 * Compute investigation coverage: what fraction of total R²adj has been
 * explored (answered or ruled-out) versus still open/investigating.
 */
export function computeCoverage(
  questions: Array<{ status: string; evidence?: { rSquaredAdj?: number } }>
): CoverageResult {
  const total = questions.length;
  if (total === 0) return { checked: 0, total: 0, exploredPercent: 0 };

  let checkedCount = 0;
  let checkedR2 = 0;
  let totalR2 = 0;

  for (const q of questions) {
    const r2 = q.evidence?.rSquaredAdj ?? 0;
    totalR2 += r2;
    if (q.status === 'answered' || q.status === 'ruled-out') {
      checkedCount++;
      checkedR2 += r2;
    }
  }

  const exploredPercent = totalR2 > 0 ? (checkedR2 / totalR2) * 100 : 0;

  return {
    checked: checkedCount,
    total,
    exploredPercent,
  };
}
