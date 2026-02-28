/**
 * Factor suggestion logic — drill recommendations and optimal factor selection
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import { getEtaSquared } from '../stats';
import { VARIATION_THRESHOLDS } from '../navigation';
import { calculateCategoryTotalSS } from './contributions';
import type { OptimalFactorResult } from './types';

export type { OptimalFactorResult };

/**
 * Get the maximum single-category Total SS contribution for a factor.
 * Used for drill suggestion ranking and drill-down investigation.
 *
 * This metric uses the same numbers visible in the category popover,
 * making the suggestion logic transparent: "Machine is suggested because
 * one category (C) accounts for 53% of total variation."
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @returns Max contribution as fraction (0-1), or 0 if insufficient data
 */
export function getMaxCategoryContribution(
  data: DataRow[],
  factor: string,
  outcome: string
): number {
  const result = calculateCategoryTotalSS(data, factor, outcome);
  if (!result) return 0;
  let max = 0;
  for (const pct of result.contributions.values()) {
    if (pct > max) max = pct;
  }
  return max / 100; // Return as fraction (0-1)
}

/**
 * Calculate max category Total SS contribution for each factor on current filtered data
 *
 * For each factor, finds the single largest category's share of Total SS.
 * Used for drill suggestions — factors with >50% max category contribution
 * should be highlighted in charts as recommended drill targets.
 *
 * @param data - Current (possibly filtered) data
 * @param factors - Available factor columns to analyze
 * @param outcome - The outcome column name
 * @param excludeFactors - Factors to exclude (e.g., already filtered)
 * @returns Map of factor name to max category contribution percentage (0-100)
 */
export function calculateFactorVariations(
  data: DataRow[],
  factors: string[],
  outcome: string,
  excludeFactors: string[] = []
): Map<string, number> {
  const variations = new Map<string, number>();

  if (!outcome || data.length < 2) {
    return variations;
  }

  const excludeSet = new Set(excludeFactors);

  for (const factor of factors) {
    // Skip excluded factors
    if (excludeSet.has(factor)) continue;

    const maxContrib = getMaxCategoryContribution(data, factor, outcome);
    if (maxContrib > 0) {
      variations.set(factor, maxContrib * 100);
    }
  }

  return variations;
}

/**
 * Check if a factor should be highlighted as a drill target
 *
 * @param variationPct - The variation percentage for the factor
 * @returns true if variation is above HIGH_IMPACT threshold (50%)
 */
export function shouldHighlightDrill(variationPct: number): boolean {
  return variationPct >= VARIATION_THRESHOLDS.HIGH_IMPACT;
}

/**
 * Default minimum threshold for auto-switch (5%)
 * Factors with variation below this won't be suggested as next drill targets
 */
export const DRILL_SWITCH_THRESHOLD = 5;

/**
 * Get the next recommended factor for drill-down based on max category contribution
 *
 * After drilling into a factor (e.g., filtering to Machine A), this function
 * finds the remaining factor with highest variation in the filtered data.
 * This guides users through drill-down investigation by automatically suggesting
 * the next most impactful analysis direction.
 *
 * @param factorVariations - Map of factor name to variation percentage (0-100)
 * @param currentFactor - The factor that was just drilled (will be excluded)
 * @param minThreshold - Minimum variation % to recommend (default: 5)
 * @returns The factor with highest variation above threshold, or null if none qualify
 */
export function getNextDrillFactor(
  factorVariations: Map<string, number>,
  currentFactor: string,
  minThreshold: number = DRILL_SWITCH_THRESHOLD
): string | null {
  let bestFactor: string | null = null;
  let bestVariation = minThreshold;

  for (const [factor, variation] of factorVariations) {
    // Skip the current factor (already drilled)
    if (factor === currentFactor) continue;

    // Find the factor with highest variation above threshold
    if (variation > bestVariation) {
      bestFactor = factor;
      bestVariation = variation;
    }
  }

  return bestFactor;
}

/**
 * Find the best value (category) for a factor based on deviation from overall mean
 * This identifies which category of the factor contributes most to variation
 */
function findBestValueForFactor(
  data: DataRow[],
  factor: string,
  outcome: string
): string | number | undefined {
  // Group data by factor
  const groups = new Map<string | number, number[]>();

  for (const row of data) {
    const factorValue = row[factor];
    const outcomeValue = toNumericValue(row[outcome]);

    if (factorValue !== undefined && factorValue !== null && outcomeValue !== undefined) {
      const key = factorValue as string | number;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(outcomeValue);
    }
  }

  if (groups.size === 0) return undefined;

  // Calculate overall mean
  const allValues = data
    .map(r => toNumericValue(r[outcome]))
    .filter((v): v is number => v !== undefined);

  if (allValues.length === 0) return undefined;

  const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

  // Find group with highest deviation from mean
  let bestValue: string | number | undefined;
  let maxDeviation = 0;

  for (const [value, outcomes] of groups) {
    const groupMean = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
    const deviation = Math.abs(groupMean - overallMean) * outcomes.length;

    if (deviation > maxDeviation) {
      maxDeviation = deviation;
      bestValue = value;
    }
  }

  return bestValue;
}

/**
 * Find the optimal combination of factors that explain a target percentage of variation
 *
 * Uses a greedy algorithm to select factors by highest eta squared contribution.
 * This enables drill-down investigation by identifying the 1-3 factors
 * that explain ~70% of total variation.
 *
 * @param data - Raw data array
 * @param factors - Available factor columns to analyze
 * @param outcome - The outcome column name
 * @param targetPct - Target percentage of variation to explain (default: 70)
 * @param maxFactors - Maximum number of factors to select (default: 3)
 * @returns Array of optimal factors sorted by contribution, with cumulative percentages
 */
export function findOptimalFactors(
  data: DataRow[],
  factors: string[],
  outcome: string,
  targetPct: number = 70,
  maxFactors: number = 3
): OptimalFactorResult[] {
  if (!outcome || data.length < 2 || factors.length === 0) {
    return [];
  }

  // Calculate eta squared for each factor
  const factorStats: { factor: string; variationPct: number; bestValue?: string | number }[] = [];

  for (const factor of factors) {
    const etaSquared = getEtaSquared(data, factor, outcome);
    if (etaSquared > 0) {
      // Find the best value (category with most variation contribution)
      const bestValue = findBestValueForFactor(data, factor, outcome);
      factorStats.push({
        factor,
        variationPct: etaSquared * 100,
        bestValue,
      });
    }
  }

  // Sort by variation percentage descending
  factorStats.sort((a, b) => b.variationPct - a.variationPct);

  // Greedy selection until we hit target or max factors
  const selected: OptimalFactorResult[] = [];
  let cumulativeRemaining = 100;

  for (const stat of factorStats) {
    if (selected.length >= maxFactors) break;

    // Calculate cumulative as product of remaining variation
    // E.g., if factor explains 67%, remaining is 33%, cumulative isolated is 67%
    const contribution = (cumulativeRemaining * stat.variationPct) / 100;
    cumulativeRemaining = cumulativeRemaining - contribution;
    const cumulativeIsolated = 100 - cumulativeRemaining;

    selected.push({
      factor: stat.factor,
      variationPct: stat.variationPct,
      bestValue: stat.bestValue,
      cumulativePct: cumulativeIsolated,
    });

    // Stop if we've reached the target
    if (cumulativeIsolated >= targetPct) break;
  }

  return selected;
}
