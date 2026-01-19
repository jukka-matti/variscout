/**
 * Variation tracking calculations for drill-down analysis
 *
 * Provides pure, framework-agnostic functions for calculating:
 * - Cumulative variation through drill paths (multiplicative η²)
 * - Factor variations for drill suggestions
 *
 * Used by:
 * - PWA: Full breadcrumb experience with useVariationTracking hook
 * - Excel Add-in: Variation % indicator on boxplot
 * - Azure: Future full breadcrumb experience
 */

import type { DataRow } from './types';
import { toNumericValue } from './types';
import { getEtaSquared } from './stats';
import { VARIATION_THRESHOLDS, getVariationImpactLevel, getVariationInsight } from './navigation';

/**
 * Result of drill variation calculation
 */
export interface DrillVariationResult {
  /**
   * Array of variation data for each drill level
   * Index 0 is root (100%), subsequent indices match filter order
   */
  levels: DrillLevelVariation[];

  /**
   * Final cumulative variation percentage (product of all η²)
   * This is the total % of original variation isolated to current path
   */
  cumulativeVariationPct: number;

  /**
   * Impact level based on cumulative variation
   */
  impactLevel: 'high' | 'moderate' | 'low';

  /**
   * Insight text for the current cumulative variation
   */
  insightText: string;
}

/**
 * Variation data for a single drill level
 */
export interface DrillLevelVariation {
  /** Factor name (null for root level) */
  factor: string | null;

  /** Filter values at this level (null for root) */
  values: (string | number)[] | null;

  /** Local η² at this level (100 for root) */
  localVariationPct: number;

  /** Cumulative η² up to and including this level */
  cumulativeVariationPct: number;
}

/**
 * Calculate cumulative variation percentages through a drill path
 *
 * At each drill level, calculates:
 * 1. Local η² - how much variation the factor explains at that level
 * 2. Cumulative η² - product of all local η² values
 *
 * This enables the "variation funnel" insight: drilling 3 levels deep
 * to isolate e.g. 46% of total variation into one specific condition.
 *
 * @param rawData - Original unfiltered data
 * @param filters - Current filters as Record<factor, values[]>
 * @param outcome - The outcome column name
 * @returns Drill variation result with levels, cumulative %, and insights
 *
 * @example
 * const result = calculateDrillVariation(data, { Shift: ['Night'], Machine: ['C'] }, 'Weight');
 * // result.cumulativeVariationPct = 46.5
 * // result.insightText = "Fix this combination to address more than half..."
 */
export function calculateDrillVariation(
  rawData: DataRow[],
  filters: Record<string, (string | number)[]>,
  outcome: string
): DrillVariationResult | null {
  if (!outcome || rawData.length < 2) {
    return null;
  }

  const levels: DrillLevelVariation[] = [
    {
      factor: null,
      values: null,
      localVariationPct: 100,
      cumulativeVariationPct: 100,
    },
  ];

  let cumulativePct = 100;
  let currentData = rawData;

  // Get ordered filter entries
  const filterEntries = Object.entries(filters).filter(
    ([_, values]) => values && values.length > 0
  );

  // Process each filter level
  for (const [factor, values] of filterEntries) {
    // Calculate local η² for this factor on the current data
    const etaSquared = getEtaSquared(currentData, factor, outcome);
    const localPct = etaSquared * 100;

    // Update cumulative (multiply, not add)
    cumulativePct = (cumulativePct * localPct) / 100;

    levels.push({
      factor,
      values,
      localVariationPct: localPct,
      cumulativeVariationPct: cumulativePct,
    });

    // Filter data for next level
    currentData = currentData.filter(row => {
      const cellValue = row[factor];
      return values.includes(cellValue as string | number);
    });

    if (currentData.length < 2) {
      break;
    }
  }

  const impactLevel = getVariationImpactLevel(cumulativePct);
  const insightText = getVariationInsight(cumulativePct);

  return {
    levels,
    cumulativeVariationPct: cumulativePct,
    impactLevel,
    insightText,
  };
}

/**
 * Calculate eta-squared for each factor on current filtered data
 *
 * Used for drill suggestions - factors with >50% variation should be
 * highlighted in charts as recommended drill targets.
 *
 * @param data - Current (possibly filtered) data
 * @param factors - Available factor columns to analyze
 * @param outcome - The outcome column name
 * @param excludeFactors - Factors to exclude (e.g., already filtered)
 * @returns Map of factor name to variation percentage (0-100)
 *
 * @example
 * const variations = calculateFactorVariations(filteredData, ['Shift', 'Machine', 'Operator'], 'Weight', ['Shift']);
 * // variations.get('Machine') = 67.5 -> highlight Machine in boxplot
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

    const etaSquared = getEtaSquared(data, factor, outcome);
    if (etaSquared > 0) {
      variations.set(factor, etaSquared * 100);
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
 * Filter data by a set of filters
 * Utility function for applying drill filters to raw data
 *
 * @param data - Raw data array
 * @param filters - Filters as Record<factor, values[]>
 * @returns Filtered data array
 */
export function applyFilters(
  data: DataRow[],
  filters: Record<string, (string | number)[]>
): DataRow[] {
  return data.filter(row => {
    return Object.entries(filters).every(([col, values]) => {
      if (!values || values.length === 0) return true;
      const cellValue = row[col];
      return values.includes(cellValue as string | number);
    });
  });
}

/**
 * Default minimum threshold for auto-switch (5%)
 * Factors with variation below this won't be suggested as next drill targets
 */
export const DRILL_SWITCH_THRESHOLD = 5;

/**
 * Get the next recommended factor for drill-down based on eta-squared
 *
 * After drilling into a factor (e.g., filtering to Machine A), this function
 * finds the remaining factor with highest variation in the filtered data.
 * This guides users through a "variation funnel" by automatically suggesting
 * the next most impactful analysis direction.
 *
 * @param factorVariations - Map of factor name to variation percentage (0-100)
 * @param currentFactor - The factor that was just drilled (will be excluded)
 * @param minThreshold - Minimum variation % to recommend (default: 5)
 * @returns The factor with highest variation above threshold, or null if none qualify
 *
 * @example
 * // After drilling into Machine A, find next best factor to show
 * const variations = new Map([['Shift', 67], ['Operator', 23], ['Machine', 45]]);
 * const next = getNextDrillFactor(variations, 'Machine'); // Returns 'Shift'
 *
 * @example
 * // When all remaining factors have low variation
 * const variations = new Map([['Shift', 3], ['Operator', 2]]);
 * const next = getNextDrillFactor(variations, 'Machine'); // Returns null
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
 * Result item for optimal factor selection
 */
export interface OptimalFactorResult {
  /** Factor name */
  factor: string;
  /** Variation percentage explained by this factor (η² * 100) */
  variationPct: number;
  /** Best value for this factor (highest variation category) */
  bestValue?: string | number;
  /** Cumulative variation isolated after applying this and all previous factors */
  cumulativePct: number;
}

/**
 * Find the optimal combination of factors that explain a target percentage of variation
 *
 * Uses a greedy algorithm to select factors by highest η² contribution.
 * This enables the "variation funnel" feature by identifying the 1-3 factors
 * that explain ~70% of total variation.
 *
 * @param data - Raw data array
 * @param factors - Available factor columns to analyze
 * @param outcome - The outcome column name
 * @param targetPct - Target percentage of variation to explain (default: 70)
 * @param maxFactors - Maximum number of factors to select (default: 3)
 * @returns Array of optimal factors sorted by contribution, with cumulative percentages
 *
 * @example
 * const optimal = findOptimalFactors(data, ['Shift', 'Machine', 'Operator'], 'Weight');
 * // [
 * //   { factor: 'Shift', variationPct: 67, cumulativePct: 67 },
 * //   { factor: 'Machine', variationPct: 45, cumulativePct: 82 }
 * // ]
 * // -> Two factors explain 82% of variation, exceeding 70% target
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

  // Calculate η² for each factor
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
