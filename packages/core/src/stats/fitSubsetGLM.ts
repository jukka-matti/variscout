/**
 * Fit a single, explicitly-named factor subset as a GLM (OLS) and return the
 * full coefficient table — including the intercept row.
 *
 * `computeBestSubsets` enumerates 2^k − 1 subsets and, for the all-CATEGORICAL
 * shape, takes a pure ANOVA cell-means path that returns NO per-coefficient
 * table (no predictors / intercept / SE / Type III). The model drawer needs
 * the coefficient table for *whatever subset is shown* — categorical or mixed.
 * `fitSubsetGLM` re-fits exactly that subset on demand via the public
 * `buildDesignMatrix` + `solveOLS` primitives, classifying factors with the
 * same `classifyAllFactors` semantics `computeBestSubsets` uses, so the numbers
 * agree with the OLS path to machine precision.
 *
 * The intercept (index 0 of the OLS solution arrays — its SE/t/p are certified
 * by the same NIST regression suite as every other coefficient) is exposed as
 * the FIRST entry of `predictors`, labeled `(Intercept)`. Downstream coef-table
 * rendering iterates `predictors`; the equation / predict widgets read
 * `intercept` directly and skip the `(Intercept)` predictor row by its
 * `factorName === INTERCEPT_TERM` sentinel.
 *
 * No statistical logic is duplicated (the quadratic-flag scaffolding loop is an
 * accepted copy of computeBestSubsetsOLS's — keep in sync). Classification,
 * reference coding (most-frequent level, ties alphabetical), and the QR solver
 * are all the same primitives the enumeration path uses. The drawer (and only
 * the drawer) pays this one extra fit.
 *
 * @module fitSubsetGLM
 */

import type { DataRow, PredictorInfo, TypeIIIResult } from '../types';
import { classifyAllFactors } from './factorTypeDetection';
import type { FactorSpec } from './designMatrix';
import { buildDesignMatrix } from './designMatrix';
import { solveOLS, shouldIncludeQuadratic } from './olsRegression';
import { computeTypeIIISS } from './typeIIISS';
import { toNumericValue } from '../types';

/** Term label used for the intercept row in the coefficient table. */
export const INTERCEPT_TERM = '(Intercept)';

/** Minimum observations required for a meaningful fit (matches bestSubsets). */
const MIN_OBSERVATIONS = 5;

/** Maximum factors (matches bestSubsets — keeps Type III re-fits bounded). */
const MAX_FACTORS = 10;

/**
 * Coefficient table + diagnostics for one explicitly-named factor subset.
 */
export interface FitSubsetGLMResult {
  /**
   * Per-coefficient table. The FIRST entry is the intercept row
   * (`factorName === INTERCEPT_TERM`, `type: 'continuous'`); the remaining
   * rows are the factor predictors (categorical dummies / continuous slopes /
   * quadratic / interaction), in design-matrix order.
   */
  predictors: PredictorInfo[];
  /** Intercept coefficient (β₀ — fitted value at every reference level). */
  intercept: number;
  /** Residual standard error S = √(SSE/(n−p)) — the "S" of the model summary. */
  rmse: number;
  /** Residual (error) sum of squares. */
  sse: number;
  /**
   * Total sum of squares Σ(y − ȳ)² — computed over the SAME listwise-deleted
   * rows as `sse` and `n` (the OLS fit uses only complete cases). Exposed so
   * consumers (e.g. the ANOVA Total row in the model drawer) can use the same
   * population as the Error row, avoiding inconsistency when factors have
   * missing values. Satisfies: sst = sse + model SS (within floating-point).
   */
  sst: number;
  /** R² — proportion of total variation explained. */
  rSquared: number;
  /** Adjusted R². */
  rSquaredAdj: number;
  /** Number of observations used (after missing-value exclusion). */
  n: number;
  /** Reference level per categorical factor (the omitted, most-frequent level). */
  referenceLevels: Map<string, string>;
  /** Per-factor Type III (model-comparison) SS decomposition. */
  typeIII: Map<string, TypeIIIResult>;
  /** Model warnings (e.g. rank deficiency); omitted when none. */
  warnings?: string[];
}

/** Options for {@link fitSubsetGLM}. */
export interface FitSubsetGLMOptions {
  /**
   * Pre-computed factor-type classification (continuous | categorical) keyed by
   * factor name. When omitted, `classifyAllFactors` is run on `data` — the same
   * semantics `computeBestSubsets` uses. Pass this to keep the drawer's
   * classification identical to the enumeration that produced the ranking.
   */
  factorTypes?: Map<string, 'continuous' | 'categorical'>;
}

/**
 * Fit `outcome ~ factors` as a single OLS model and return the full coefficient
 * table (intercept row first), residual S/SSE, R²/R²adj, reference levels, and
 * the Type III SS decomposition.
 *
 * @param data    Source rows.
 * @param outcome Numeric outcome column name.
 * @param factors Factor column names for this exact subset (max 10).
 * @param opts    Optional pre-computed factor-type classification.
 * @returns The fitted model, or `null` on a degenerate fit (no factors, too
 *          many factors, too few rows, zero variation, or an unsolvable
 *          design). Rank-deficient-but-solvable fits return a result with
 *          `warnings` populated — never NaN/Infinity in the numeric fields.
 */
export function fitSubsetGLM(
  data: DataRow[],
  outcome: string,
  factors: string[],
  opts?: FitSubsetGLMOptions
): FitSubsetGLMResult | null {
  if (factors.length === 0 || factors.length > MAX_FACTORS) return null;

  // --- Classify factor types with the same semantics as computeBestSubsets ---
  const factorTypeMap =
    opts?.factorTypes ??
    (() => {
      const map = new Map<string, 'continuous' | 'categorical'>();
      const classifications = classifyAllFactors(data, factors);
      for (const [name, cls] of classifications.entries()) {
        map.set(name, cls.type);
      }
      return map;
    })();

  // --- Pre-screen continuous factors for a quadratic term (mirrors the OLS
  //     path's quadratic-flag construction so coefficients match exactly). ---
  const buildSpecs = (): FactorSpec[] =>
    factors.map(f => {
      const type = factorTypeMap.get(f) ?? 'categorical';
      if (type !== 'continuous') {
        return { name: f, type };
      }

      const yVals: number[] = [];
      const xVals: number[] = [];
      for (const row of data) {
        const yVal = toNumericValue(row[outcome]);
        const xVal = toNumericValue(row[f]);
        if (yVal !== undefined && xVal !== undefined) {
          yVals.push(yVal);
          xVals.push(xVal);
        }
      }

      let includeQuadratic = false;
      if (yVals.length >= 4) {
        includeQuadratic = shouldIncludeQuadratic(
          new Float64Array(yVals),
          new Float64Array(xVals),
          yVals.length
        ).include;
      }
      return { name: f, type, includeQuadratic };
    });

  const specs = buildSpecs();

  // --- Build the design matrix for exactly this subset ---
  let matrix;
  try {
    matrix = buildDesignMatrix(data, outcome, specs);
  } catch {
    return null;
  }

  if (matrix.n < MIN_OBSERVATIONS || matrix.n < matrix.p + 1) return null;

  let solution;
  try {
    solution = solveOLS(matrix.X, matrix.y, matrix.n, matrix.p);
  } catch {
    return null;
  }

  // Zero total variation → R²/F undefined; nothing to model.
  if (solution.sst === 0) return null;

  // --- Build the coefficient table (intercept row first) ---
  const interceptCoef = solution.coefficients[0];
  if (!Number.isFinite(interceptCoef)) return null;

  const interceptRow: PredictorInfo = {
    name: INTERCEPT_TERM,
    factorName: INTERCEPT_TERM,
    type: 'continuous',
    coefficient: interceptCoef,
    standardError: finiteOrZeroSE(solution.standardErrors[0]),
    tStatistic: Number.isFinite(solution.tStatistics[0]) ? solution.tStatistics[0] : 0,
    pValue: Number.isFinite(solution.pValues[0]) ? solution.pValues[0] : 1,
    isSignificant: Number.isFinite(solution.pValues[0]) && solution.pValues[0] < 0.05,
  };

  const factorPredictors = extractFactorPredictors(solution, matrix.encodings);
  const predictors: PredictorInfo[] = [interceptRow, ...factorPredictors];

  // --- Reference levels per categorical factor ---
  const referenceLevels = new Map<string, string>();
  for (const enc of matrix.encodings) {
    if (enc.type === 'categorical' && enc.referenceLevel) {
      referenceLevels.set(enc.factorName, enc.referenceLevel);
    }
  }

  // --- Type III SS for the same factors (model-comparison decomposition) ---
  // computeTypeIIISS returns null on degenerate (e.g. SSE=0); empty map signals 'no decomposition available'.
  const typeIII = computeTypeIIISS(data, outcome, specs) ?? new Map<string, TypeIIIResult>();

  // --- Warnings: rank deficiency surfaced via the solution's effective rank ---
  const warnings: string[] = [];
  if (solution.rank < matrix.p) {
    warnings.push(
      `Rank-deficient model: effective rank ${solution.rank} < ${matrix.p} parameters ` +
        `(collinear or single-level factor — affected coefficients dropped to 0).`
    );
  }

  return {
    predictors,
    intercept: interceptCoef,
    rmse: Number.isFinite(solution.rmse) ? solution.rmse : 0,
    sse: Number.isFinite(solution.sse) ? solution.sse : 0,
    // sst from the OLS solver — same listwise-deleted population as sse/n.
    sst: Number.isFinite(solution.sst) ? solution.sst : 0,
    rSquared: Number.isFinite(solution.rSquared) ? solution.rSquared : 0,
    rSquaredAdj: Number.isFinite(solution.rSquaredAdj) ? solution.rSquaredAdj : 0,
    n: matrix.n,
    referenceLevels,
    typeIII,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

/**
 * Coerce a possibly-infinite SE (rank-deficient coefficient) to a finite value.
 * Boundary 2: never surface Infinity to consumers.
 * // SE collapses to 0 (not undefined) because PredictorInfo.standardError is number — rank-deficient coefs display 0 SE per the warnings contract.
 */
function finiteOrZeroSE(se: number): number {
  return Number.isFinite(se) ? se : 0;
}

/**
 * Build the non-intercept predictor rows from an OLS solution and the design
 * encodings. Mirrors bestSubsets' `extractPredictors` exactly (categorical
 * dummies / continuous linear+quadratic / interaction columns). Non-finite
 * coefficients are coerced to 0 by rowFor and surface with a rank-deficiency
 * warning — rank-deficient parameters display as 0 per the warnings contract.
 */
function extractFactorPredictors(
  solution: {
    coefficients: Float64Array;
    standardErrors: Float64Array;
    tStatistics: Float64Array;
    pValues: Float64Array;
  },
  encodings: ReturnType<typeof buildDesignMatrix>['encodings']
): PredictorInfo[] {
  const predictors: PredictorInfo[] = [];

  const rowFor = (
    colIdx: number
  ): {
    coefficient: number;
    standardError: number;
    tStatistic: number;
    pValue: number;
    isSignificant: boolean;
  } => {
    const p = Number.isFinite(solution.pValues[colIdx]) ? solution.pValues[colIdx] : 1;
    return {
      coefficient: Number.isFinite(solution.coefficients[colIdx])
        ? solution.coefficients[colIdx]
        : 0,
      standardError: finiteOrZeroSE(solution.standardErrors[colIdx]),
      tStatistic: Number.isFinite(solution.tStatistics[colIdx]) ? solution.tStatistics[colIdx] : 0,
      pValue: p,
      isSignificant: p < 0.05,
    };
  };

  for (const enc of encodings) {
    if (enc.type === 'interaction') {
      for (let ci = 0; ci < enc.columnIndices.length; ci++) {
        predictors.push({
          name: enc.factorName,
          factorName: enc.factorName,
          type: 'interaction',
          sourceFactors: enc.sourceFactors as [string, string],
          interactionType: enc.interactionType,
          ...rowFor(enc.columnIndices[ci]),
        });
      }
      continue;
    }

    if (enc.type === 'categorical') {
      const nonRefLevels = enc.levels!.filter(l => l !== enc.referenceLevel);
      for (let li = 0; li < nonRefLevels.length; li++) {
        predictors.push({
          name: `${enc.factorName}[${nonRefLevels[li]}]`,
          factorName: enc.factorName,
          type: 'categorical',
          level: nonRefLevels[li],
          ...rowFor(enc.columnIndices[li]),
        });
      }
      continue;
    }

    // continuous — linear term
    predictors.push({
      name: enc.factorName,
      factorName: enc.factorName,
      type: 'continuous',
      mean: enc.mean,
      ...rowFor(enc.columnIndices[0]),
    });

    // quadratic term if present
    if (enc.quadraticIndex !== undefined) {
      predictors.push({
        name: `${enc.factorName}²`,
        factorName: enc.factorName,
        type: 'quadratic',
        mean: enc.mean,
        ...rowFor(enc.quadraticIndex),
      });
    }
  }

  return predictors;
}
