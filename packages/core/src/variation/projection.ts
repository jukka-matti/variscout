/**
 * Projection functions for the Process Health Toolbar.
 *
 * These pure functions compute projections that answer:
 * - "What Cpk would we achieve if this subset were fixed?" (drill projection)
 * - "How much could we gain just by centering the process?" (centering opportunity)
 * - "What spec limits would fit the good data?" (spec suggestion)
 * - "What if we fixed multiple findings?" (cumulative projection)
 * - "What if all subsets performed like the benchmark?" (benchmark projection)
 */

import type { StatsResult, SpecLimits, DataRow } from '../types';
import { toNumericValue, inferCharacteristicType } from '../types';
import { simulateOverallImpact } from './simulation';
import type { ProcessProjection, CenteringOpportunity, SpecSuggestion } from './types';
import { formatStatistic } from '../i18n/format';
import { findBestSubgroup } from './bestSubgroup';
import type { CategoryStats } from './types';

export type { ProcessProjection, CenteringOpportunity, SpecSuggestion };

/** Minimum gap between Cp and Cpk to show centering opportunity */
const CENTERING_GAP_THRESHOLD = 0.1;

/** Minimum data points in complement for meaningful projection */
const MIN_COMPLEMENT_COUNT = 2;

/**
 * Compute a drill projection: "if the current subset were fixed, what Cpk would the overall process achieve?"
 *
 * The "fix" scenario assumes the problematic subset is brought in line with the complement
 * (i.e., projectedSubsetStats = complementStats).
 */
export function computeDrillProjection(
  subsetStats: { mean: number; stdDev: number; count: number },
  complementStats: { mean: number; stdDev: number; count: number },
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>
): ProcessProjection | null {
  if (complementStats.count < MIN_COMPLEMENT_COUNT) return null;
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) return null;

  const impact = simulateOverallImpact(
    subsetStats,
    complementStats,
    // "Fix" = bring subset to complement performance
    { mean: complementStats.mean, stdDev: complementStats.stdDev },
    specs
  );

  if (impact.currentOverall.cpk === undefined || impact.projectedOverall.cpk === undefined) {
    return null;
  }

  return {
    currentCpk: impact.currentOverall.cpk,
    projectedCpk: impact.projectedOverall.cpk,
    label: 'if fixed',
    findingCount: 1,
  };
}

/**
 * Compute centering opportunity: how much Cpk could improve just by centering the process.
 *
 * Cp measures spread only (perfect centering). Cpk measures spread + centering.
 * The gap Cp - Cpk represents the "free win" from adjusting process aim.
 */
export function computeCenteringOpportunity(stats: StatsResult): CenteringOpportunity | null {
  if (stats.cp === undefined || stats.cpk === undefined) return null;

  const gap = stats.cp - stats.cpk;
  if (gap <= CENTERING_GAP_THRESHOLD) return null;

  return {
    currentCpk: stats.cpk,
    cp: stats.cp,
    gap,
  };
}

/**
 * Compute spec suggestion from complement data's natural tolerance (Mean +/- 3sigma).
 */
export function computeSpecSuggestion(complementStats: {
  mean: number;
  stdDev: number;
  count: number;
}): SpecSuggestion | null {
  if (complementStats.count < MIN_COMPLEMENT_COUNT) return null;
  if (complementStats.stdDev === 0) return null;

  const suggestedLsl = complementStats.mean - 3 * complementStats.stdDev;
  const suggestedUsl = complementStats.mean + 3 * complementStats.stdDev;

  const formatVal = (v: number): string => {
    // Use up to 1 decimal place, drop trailing zeros
    return Number(formatStatistic(v, 'en', 1)).toString();
  };

  return {
    suggestedLsl,
    suggestedUsl,
    label: `Achievable: ${formatVal(suggestedLsl)}–${formatVal(suggestedUsl)}`,
  };
}

/**
 * Compute cumulative projection from multiple scoped findings.
 *
 * Each finding defines a data subset via its activeFilters. The projection chains
 * simulateOverallImpact() calls: each finding's fix changes the baseline for the next.
 */
export function computeCumulativeProjection(
  findingFilters: Array<{ activeFilters: Record<string, (string | number)[]> }>,
  rawData: DataRow[],
  outcome: string,
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>
): ProcessProjection | null {
  if (findingFilters.length < 1) return null;
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) return null;
  if (rawData.length < 2) return null;

  // Extract overall numeric values
  const allValues = rawData
    .map(r => toNumericValue(r[outcome]))
    .filter((v): v is number => v !== undefined);
  if (allValues.length < 2) return null;

  const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const overallVar =
    allValues.reduce((sum, v) => sum + (v - overallMean) ** 2, 0) / allValues.length;
  const overallStdDev = Math.sqrt(overallVar);

  // Start with current overall stats
  let currentOverallMean = overallMean;
  let currentOverallStdDev = overallStdDev;
  let remainingData = rawData;

  // First projection's current Cpk (before any fixes)
  const computeCpk = (mean: number, stdDev: number): number | undefined => {
    if (stdDev === 0) return undefined;
    if (specs.usl !== undefined && specs.lsl !== undefined) {
      return Math.min((specs.usl - mean) / (3 * stdDev), (mean - specs.lsl) / (3 * stdDev));
    } else if (specs.usl !== undefined) {
      return (specs.usl - mean) / (3 * stdDev);
    } else if (specs.lsl !== undefined) {
      return (mean - specs.lsl) / (3 * stdDev);
    }
    return undefined;
  };

  const baseCpk = computeCpk(overallMean, overallStdDev);

  // Chain projections
  for (const finding of findingFilters) {
    // Build subset from finding's activeFilters
    const subset = remainingData.filter(row => {
      return Object.entries(finding.activeFilters).every(([factor, values]) => {
        const cellValue = row[factor];
        if (cellValue === undefined || cellValue === null) return false;
        return values.includes(cellValue as string | number);
      });
    });

    if (subset.length === 0) continue;

    const complement = remainingData.filter(row => !subset.includes(row));
    if (complement.length < MIN_COMPLEMENT_COUNT) continue;

    // Compute subset stats
    const subsetValues = subset
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);
    if (subsetValues.length === 0) continue;

    const subsetMean = subsetValues.reduce((a, b) => a + b, 0) / subsetValues.length;
    const subsetVar =
      subsetValues.reduce((sum, v) => sum + (v - subsetMean) ** 2, 0) / subsetValues.length;

    // Compute complement stats
    const compValues = complement
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);
    if (compValues.length < MIN_COMPLEMENT_COUNT) continue;

    const compMean = compValues.reduce((a, b) => a + b, 0) / compValues.length;
    const compVar = compValues.reduce((sum, v) => sum + (v - compMean) ** 2, 0) / compValues.length;

    const impact = simulateOverallImpact(
      { mean: subsetMean, stdDev: Math.sqrt(subsetVar), count: subsetValues.length },
      { mean: compMean, stdDev: Math.sqrt(compVar), count: compValues.length },
      { mean: compMean, stdDev: Math.sqrt(compVar) }, // fix = match complement
      specs
    );

    // Update running overall for next iteration
    currentOverallMean = impact.projectedOverall.mean;
    currentOverallStdDev = impact.projectedOverall.stdDev;

    // Remove fixed subset from remaining data for next finding
    remainingData = complement;
  }

  const projectedCpk = computeCpk(currentOverallMean, currentOverallStdDev);
  if (baseCpk === undefined || projectedCpk === undefined) return null;

  return {
    currentCpk: baseCpk,
    projectedCpk,
    label: findingFilters.length === 1 ? 'if fixed' : `if ${findingFilters.length} fixed`,
    findingCount: findingFilters.length,
  };
}

/**
 * Compute benchmark projection: "If all subsets performed like the benchmark → Cpk X"
 *
 * Instead of using complement stats as the "fix" target, uses the benchmark's stats.
 * This answers the stronger question: "What if the problematic subset matched our best performer?"
 */
export function computeBenchmarkProjection(
  subsetStats: { mean: number; stdDev: number; count: number },
  benchmarkStats: { mean: number; stdDev: number; count: number },
  complementStats: { mean: number; stdDev: number; count: number },
  specs?: Pick<SpecLimits, 'usl' | 'lsl'>,
  benchmarkLabel?: string
): ProcessProjection | null {
  if (benchmarkStats.count < MIN_COMPLEMENT_COUNT) return null;
  if (complementStats.count < MIN_COMPLEMENT_COUNT) return null;
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) return null;

  const impact = simulateOverallImpact(
    subsetStats,
    complementStats,
    // "Fix" = bring subset to benchmark performance (not complement)
    { mean: benchmarkStats.mean, stdDev: benchmarkStats.stdDev },
    specs
  );

  if (impact.currentOverall.cpk === undefined || impact.projectedOverall.cpk === undefined) {
    return null;
  }

  return {
    currentCpk: impact.currentOverall.cpk,
    projectedCpk: impact.projectedOverall.cpk,
    label: benchmarkLabel ? `benchmark: ${benchmarkLabel}` : 'benchmark',
    findingCount: 1,
  };
}

/** Result of a matched-best projection for one factor (spec §5 what-if hover). */
export interface MatchedBestProjection {
  /** The best-performing level every group is projected toward. */
  bestLevel: string;
  /** Overall outcome mean as observed. */
  currentMean: number;
  /** Overall outcome mean if every group matched the best group's mean. */
  projectedMean: number;
  /** Overall Cpk as observed — only present when spec limits are supplied. */
  currentCpk?: number;
  /** Overall Cpk after the matched-best shift — only with spec limits. */
  projectedCpk?: number;
  /** Number of factor levels (groups). */
  k: number;
  /** Number of valid observations used. */
  n: number;
}

/** Standard Cpk for one-sided / two-sided limits; `undefined` on degenerates. */
function cpkFor(
  mean: number,
  stdDev: number,
  specs: Pick<SpecLimits, 'usl' | 'lsl'>
): number | undefined {
  if (!(stdDev > 0)) return undefined;
  const { usl, lsl } = specs;
  let cpk: number | undefined;
  if (usl !== undefined && lsl !== undefined) {
    cpk = Math.min((usl - mean) / (3 * stdDev), (mean - lsl) / (3 * stdDev));
  } else if (usl !== undefined) {
    cpk = (usl - mean) / (3 * stdDev);
  } else if (lsl !== undefined) {
    cpk = (mean - lsl) / (3 * stdDev);
  } else {
    return undefined;
  }
  return Number.isFinite(cpk) ? cpk : undefined;
}

/**
 * Matched-best projection: "if every <factor> group matched the best group."
 *
 * The spec §5 factor-strip hover quantity. Every group's rows are mean-shifted
 * by (bestMean − groupMean) — within-group spread preserved, group means
 * collapsed onto the best — and the overall mean (plus Cpk when limits are
 * supplied) is recomputed on the shifted data. This is DISTINCT from
 * `computeCumulativeProjection`, which computes complement-fixing (bringing one
 * problematic subset in line with the rest of the data); a different quantity.
 *
 * Direction comes from `inferCharacteristicType(specs)`: smaller-is-better picks
 * the lowest-mean level, larger-is-better the highest, explicit nominal-with-anchor
 * the closest-to-target. With no inferable direction (empty-spec 'nominal'
 * fallback) the projection returns `undefined` — house style never recommends a
 * "best" by row order, which is direction-blind and can recommend a
 * mean-worsening shift (the `findBestSubgroup` precedent). This is a level-native
 * contribution estimate, never a cause.
 *
 * @param data Rows carrying the outcome and factor columns.
 * @param outcome Outcome (Y) column name.
 * @param factor Factor column to project across.
 * @param specs Optional spec limits / direction. No direction → `undefined`.
 * @returns The projection, or `undefined` on any degenerate (one group, <3 valid
 *   rows (need within-group spread), no direction).
 */
export function computeMatchedBestProjection(
  data: DataRow[],
  outcome: string,
  factor: string,
  specs?: SpecLimits
): MatchedBestProjection | undefined {
  // Group the valid (outcome + factor present) rows by factor level.
  const groups = new Map<string, number[]>();
  const allValues: number[] = [];
  for (const row of data) {
    const val = toNumericValue(row[outcome]);
    if (val === undefined) continue;
    const lvl = String(row[factor] ?? '');
    if (lvl === '' || lvl === 'undefined' || lvl === 'null') continue;
    if (!groups.has(lvl)) groups.set(lvl, []);
    groups.get(lvl)!.push(val);
    allValues.push(val);
  }

  const k = groups.size;
  const n = allValues.length;
  if (k < 2 || n < 3) return undefined;

  // Per-level stats for direction-aware best selection.
  const categories: CategoryStats[] = [];
  const groupMean = new Map<string, number>();
  for (const [level, vals] of groups) {
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;
    groupMean.set(level, m);
    categories.push({ value: level, count: vals.length, mean: m, stdDev: Math.sqrt(variance) });
  }

  const characteristicType = inferCharacteristicType(specs ?? {});
  const best = findBestSubgroup(categories, characteristicType, specs?.target, {
    usl: specs?.usl,
    lsl: specs?.lsl,
  });
  // No inferable direction → suppress the recommendation entirely.
  if (best === undefined) return undefined;

  const bestLevel = String(best.value);
  const bestMean = best.mean;

  // Shift every group's rows onto the best group's mean (spread preserved).
  const currentMean = allValues.reduce((a, b) => a + b, 0) / n;
  const shifted: number[] = [];
  for (const [level, vals] of groups) {
    const shift = bestMean - (groupMean.get(level) ?? 0);
    for (const v of vals) shifted.push(v + shift);
  }
  const projectedMean = shifted.reduce((a, b) => a + b, 0) / shifted.length;

  if (!Number.isFinite(currentMean) || !Number.isFinite(projectedMean)) return undefined;

  const result: MatchedBestProjection = {
    bestLevel,
    currentMean,
    projectedMean,
    k,
    n,
  };

  // Cpk only when spec limits are present.
  if (specs && (specs.usl !== undefined || specs.lsl !== undefined)) {
    const curVar = allValues.reduce((s, v) => s + (v - currentMean) ** 2, 0) / n;
    const projVar = shifted.reduce((s, v) => s + (v - projectedMean) ** 2, 0) / shifted.length;
    result.currentCpk = cpkFor(currentMean, Math.sqrt(curVar), specs);
    result.projectedCpk = cpkFor(projectedMean, Math.sqrt(projVar), specs);
  }

  return result;
}
