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
/** Internal result from computeSubsetSS including cell means for level effect computation */
interface SubsetSSResult {
  ssb: number;
  ssw: number;
  dfModel: number;
  cellMeans: Map<string, { mean: number; n: number }>;
}

function computeSubsetSS(values: number[], factorColumns: string[][], n: number): SubsetSSResult {
  // Build compound group key for each observation
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

  // Degrees of freedom for the model = (number of cells - 1)
  const dfModel = groups.size - 1;

  return { ssb, ssw, dfModel, cellMeans };
}

/**
 * Compute marginal level effects for each factor in a subset.
 *
 * For each factor, computes the weighted marginal mean per level
 * (averaging across all other factor levels, weighted by cell size),
 * then subtracts the grand mean.
 */
function computeLevelEffects(
  subsetFactors: string[],
  cellMeans: Map<string, { mean: number; n: number }>,
  grandMean: number
): Map<string, Map<string, number>> {
  const effects = new Map<string, Map<string, number>>();

  for (let fi = 0; fi < subsetFactors.length; fi++) {
    const factorName = subsetFactors[fi];
    // Accumulate weighted sum and count per level of this factor
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
    const { ssb, ssw, dfModel, cellMeans } = computeSubsetSS(validValues, subsetColumns, n);

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

    // Compute level effects for this subset
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
  type: 'single-factor' | 'combination' | 'main-effect' | 'interaction';
}

/** Maximum number of multi-factor combination questions to generate */
const MAX_COMBINATION_QUESTIONS = 5;

/**
 * Generate investigation questions from best subsets ranking.
 * Each factor/combination becomes a question, ranked by R²adj.
 * Factors with R²adj < threshold are auto-answered as 'ruled-out'.
 */
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

  // Separate single-factor and multi-factor subsets
  const singles: BestSubsetResult[] = [];
  const combos: BestSubsetResult[] = [];

  for (const subset of result.subsets) {
    // Skip subsets with R²adj <= 0
    if (subset.rSquaredAdj <= 0) continue;

    if (subset.factorCount === 1) {
      singles.push(subset);
    } else {
      combos.push(subset);
    }
  }

  // Generate all single-factor questions
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

  // Generate top N multi-factor combination questions
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

  // Sort by R²adj descending
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

  // Filter to single-factor models and return the best one
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
 *
 * @param bestSubset - A single BestSubsetResult with levelEffects populated
 * @param grandMean - Grand mean of the outcome (from BestSubsetsResult)
 * @param currentLevels - Current factor levels (factor → level string)
 * @param targetLevels - Target factor levels (factor → level string)
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
 *
 * @param questions - Array of question-like objects with status and optional evidence
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
