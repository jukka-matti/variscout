/**
 * Projection functions for the Process Health Toolbar.
 *
 * These pure functions compute projections that answer:
 * - "What Cpk would we achieve if this subset were fixed?" (drill projection)
 * - "How much could we gain just by centering the process?" (centering opportunity)
 * - "What spec limits would fit the good data?" (spec suggestion)
 * - "What if we fixed multiple findings?" (cumulative projection)
 */

import type { StatsResult, SpecLimits, DataRow } from '../types';
import { toNumericValue } from '../types';
import { simulateOverallImpact } from './simulation';
import type { ProcessProjection, CenteringOpportunity, SpecSuggestion } from './types';

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
    return Number(v.toFixed(1)).toString();
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
