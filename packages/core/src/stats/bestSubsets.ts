/**
 * Best subsets regression — factor prioritization via R² adjusted.
 *
 * Evaluates all 2^k − 1 non-empty subsets of factors and ranks them by
 * adjusted R² (how much outcome variation each factor combination explains).
 *
 * Built on multi-factor ANOVA sum-of-squares decomposition rather than
 * full OLS regression — appropriate for VariScout's categorical factors
 * and avoids the heavier GLM machinery.
 *
 * Methodology note (from domain expert discussion):
 *   "Don't search for the function first. Search for which variables
 *    make a difference by contributing to the overall explanation of
 *    variation and which ones don't. That's best subsets regression."
 */

import * as d3 from 'd3-array';
import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { fDistributionPValue } from './distributions';

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
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of factors to avoid combinatorial explosion (2^10 = 1024 subsets) */
const MAX_FACTORS = 10;

/** Minimum observations required for meaningful analysis */
const MIN_OBSERVATIONS = 5;

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
 *
 * R² adjusted only increases when a new factor explains enough new variance
 * to offset the penalty for the additional parameter.
 */
export function computeRSquaredAdjusted(rSquared: number, n: number, k: number): number {
  if (n - k - 1 <= 0) return 0; // Saturated or over-determined model
  return 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);
}

/**
 * Compute multi-factor ANOVA sum-of-squares for a subset of factors.
 *
 * Uses a cell-means approach: group observations by the unique combination
 * of all factor levels in the subset, then compute SSB and SSW as if
 * the combination were a single compound factor.
 *
 * This is equivalent to a main-effects-only model (no interactions).
 * For VariScout's use case (ranking factor importance), this is sufficient.
 */
function computeSubsetSS(
  values: number[],
  factorColumns: string[][],
  n: number
): { ssb: number; ssw: number; dfModel: number } {
  // Build compound group key for each observation
  const groups = new Map<string, number[]>();

  for (let i = 0; i < n; i++) {
    const key = factorColumns.map(col => col[i]).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(values[i]);
  }

  const grandMean = d3.mean(values) ?? 0;
  let ssb = 0;
  let ssw = 0;

  for (const vals of groups.values()) {
    const groupMean = d3.mean(vals) ?? 0;
    ssb += vals.length * (groupMean - grandMean) ** 2;
    for (const v of vals) {
      ssw += (v - groupMean) ** 2;
    }
  }

  // Degrees of freedom for the model = (number of cells - 1)
  const dfModel = groups.size - 1;

  return { ssb, ssw, dfModel };
}

/**
 * Evaluate all 2^k − 1 non-empty subsets of factors and rank by R² adjusted.
 *
 * @param data - Data rows
 * @param outcome - Outcome column name
 * @param factors - Factor column names (max 10)
 * @returns Ranked results or null if insufficient data
 *
 * @example
 * const result = computeBestSubsets(rows, 'Weight', ['Supplier', 'Shift', 'Machine']);
 * // result.subsets[0] → best model, e.g. { factors: ['Supplier', 'Machine'], rSquaredAdj: 0.71 }
 */
export function computeBestSubsets(
  data: DataRow[],
  outcome: string,
  factors: string[]
): BestSubsetsResult | null {
  // Guard: too many factors
  if (factors.length === 0 || factors.length > MAX_FACTORS) return null;

  // Extract valid numeric outcome values and corresponding factor labels
  const validValues: number[] = [];
  const factorColumns: string[][] = factors.map(() => []);

  for (const row of data) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;

    // All factor values must be present
    const factorVals = factors.map(f => String(row[f] ?? ''));
    if (factorVals.some(v => v === '' || v === 'undefined' || v === 'null')) continue;

    validValues.push(val);
    factorVals.forEach((v, i) => factorColumns[i].push(v));
  }

  const n = validValues.length;
  if (n < MIN_OBSERVATIONS) return null;

  // Compute total sum of squares (SST)
  const grandMean = d3.mean(validValues) ?? 0;
  const ssTotal = d3.sum(validValues, v => (v - grandMean) ** 2);

  if (ssTotal === 0) return null; // No variation in outcome

  // Enumerate all 2^k − 1 non-empty subsets
  const k = factors.length;
  const totalSubsets = (1 << k) - 1; // 2^k - 1
  const subsets: BestSubsetResult[] = [];

  for (let mask = 1; mask <= totalSubsets; mask++) {
    // Extract factors for this subset
    const subsetFactors: string[] = [];
    const subsetColumns: string[][] = [];
    for (let j = 0; j < k; j++) {
      if (mask & (1 << j)) {
        subsetFactors.push(factors[j]);
        subsetColumns.push(factorColumns[j]);
      }
    }

    // Compute SS for this subset
    const { ssb, ssw, dfModel } = computeSubsetSS(validValues, subsetColumns, n);

    // R²
    const rSquared = ssTotal > 0 ? ssb / ssTotal : 0;

    // R² adjusted
    const rSquaredAdj = computeRSquaredAdjusted(rSquared, n, dfModel);

    // F-statistic and p-value
    const dfResidual = n - dfModel - 1;
    let fStatistic = 0;
    let pValue = 1;

    if (dfModel > 0 && dfResidual > 0 && ssw > 0) {
      const msModel = ssb / dfModel;
      const msResidual = ssw / dfResidual;
      fStatistic = msModel / msResidual;
      pValue = fDistributionPValue(fStatistic, dfModel, dfResidual);
    }

    subsets.push({
      factors: subsetFactors,
      factorCount: subsetFactors.length,
      rSquared,
      rSquaredAdj,
      fStatistic,
      pValue,
      isSignificant: pValue < 0.05,
      dfModel,
    });
  }

  // Sort by R² adjusted descending (best model first)
  subsets.sort((a, b) => b.rSquaredAdj - a.rSquaredAdj);

  return {
    subsets,
    n,
    totalFactors: k,
    factorNames: factors,
    grandMean,
    ssTotal,
  };
}

/**
 * Get the single best factor — convenience wrapper for the common case
 * where you just want to know which individual factor matters most.
 *
 * This is equivalent to ranking factors by η² (eta-squared), which the
 * existing getEtaSquared() function already computes per-factor.
 * Best subsets extends this to factor *combinations*.
 */
export function getBestSingleFactor(
  data: DataRow[],
  outcome: string,
  factors: string[]
): BestSubsetResult | null {
  const result = computeBestSubsets(data, outcome, factors);
  if (!result) return null;

  // Filter to single-factor models and return the best one
  const singles = result.subsets.filter(s => s.factorCount === 1);
  return singles.length > 0 ? singles[0] : null;
}
