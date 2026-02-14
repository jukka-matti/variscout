/**
 * Variation tracking calculations for drill-down analysis
 *
 * Provides pure, framework-agnostic functions for calculating:
 * - Cumulative variation through drill paths (multiplicative η²)
 * - Factor variations for drill suggestions
 * - Direct adjustment simulations (what-if analysis)
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
 * This enables the "Investigation Mindmap" insight: drilling 3 levels deep
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
 * This guides users through an "Investigation Mindmap" by automatically suggesting
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
 * This enables the "Investigation Mindmap" feature by identifying the 1-3 factors
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
 * Projected statistics if certain categories were excluded
 * Used for the Process Improvement Simulator (Phase 2: Interactive Toggle)
 */
export interface ProjectedStats {
  /** Projected mean after exclusions */
  mean: number;
  /** Projected standard deviation after exclusions */
  stdDev: number;
  /** Projected Cpk (requires specs) */
  cpk?: number;
  /** Projected Cp (requires both USL and LSL) */
  cp?: number;
  /** Number of remaining samples after exclusions */
  remainingCount: number;
  /** Percentage improvement in mean centering (closer to target) */
  meanImprovementPct?: number;
  /** Percentage reduction in standard deviation */
  stdDevReductionPct?: number;
  /** Percentage improvement in Cpk */
  cpkImprovementPct?: number;
}

/**
 * Statistics for a single category within a factor
 * Used for the Process Improvement Simulator (Phase 1: Category Breakdown)
 */
export interface CategoryStats {
  /** Category value (e.g., "Machine A", "Shift_1") */
  value: string | number;
  /** Number of samples in this category */
  count: number;
  /** Category mean */
  mean: number;
  /** Category standard deviation */
  stdDev: number;
  /** Percentage of total variation contributed by this category (0-100) */
  contributionPct: number;
}

/**
 * Result of category contribution calculation
 */
export interface CategoryContributionResult {
  /**
   * Map from category value to percentage of total variation
   * Sum of all percentages equals the factor's η² percentage
   */
  contributions: Map<string | number, number>;

  /**
   * Total factor η² (sum of all category contributions as decimal)
   */
  factorEtaSquared: number;

  /**
   * Total SS for reference
   */
  ssTotal: number;
}

/**
 * Result of Total SS contribution calculation per category
 */
export interface CategoryTotalSSResult {
  /**
   * Map from category value to percentage of total SS
   * This captures both mean shift AND spread (within-group variation)
   */
  contributions: Map<string | number, number>;

  /**
   * Total SS for reference
   */
  ssTotal: number;
}

/**
 * Calculate each category's Total Sum of Squares contribution
 *
 * This captures BOTH mean shift AND spread (within-group variation), unlike
 * the between-group only metric from calculateCategoryContributions.
 *
 * From an MBB perspective, this better answers: "Which categories should I focus on?"
 * A category with high variation but mean near overall mean now shows non-zero impact.
 *
 * Formula:
 * - Category Total SS = Σ (x_ij - overall_mean)² for all values in category
 * - Category % = (Category Total SS / Total SS) × 100
 *
 * Note: Sum of all category %s = 100% (total variation is fully partitioned)
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @returns CategoryTotalSSResult with map of category -> % of total SS
 *
 * @example
 * const result = calculateCategoryTotalSS(data, 'Machine', 'Weight');
 * // result.contributions.get('Machine_A') = 23
 * // Even if Machine_A's mean equals overall mean, its spread contributes to total variation
 */
export function calculateCategoryTotalSS(
  data: DataRow[],
  factor: string,
  outcome: string
): CategoryTotalSSResult | null {
  if (data.length < 2) {
    return null;
  }

  // Extract all numeric outcome values
  const outcomeValues = data
    .map(d => toNumericValue(d[outcome]))
    .filter((v): v is number => v !== undefined);

  if (outcomeValues.length < 2) {
    return null;
  }

  const overallMean = outcomeValues.reduce((a, b) => a + b, 0) / outcomeValues.length;

  // Calculate SS_total
  const ssTotal = outcomeValues.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0);

  if (ssTotal === 0) {
    return null;
  }

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

  // Calculate Total SS contribution for each category
  const contributions = new Map<string | number, number>();

  for (const [categoryValue, values] of groups) {
    if (values.length === 0) continue;

    // Sum of squared deviations from OVERALL mean for this category
    const categorySS = values.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0);

    // Convert to percentage of total SS
    const contributionPct = (categorySS / ssTotal) * 100;
    contributions.set(categoryValue, contributionPct);
  }

  return {
    contributions,
    ssTotal,
  };
}

/**
 * Calculate how much each category within a factor contributes to TOTAL variation
 *
 * This provides insight into which specific category (e.g., Bed_3 vs Bed_1)
 * is responsible for the majority of the variation explained by the factor.
 *
 * Formula:
 * - Category contribution = n_i × (category_mean - overall_mean)²
 * - Category % of total = (category_contribution / SS_total) × 100
 *
 * Note: Sum of all category %s = factor η² (since SS_between = Σ category_contributions)
 *
 * @deprecated Use calculateCategoryTotalSS for boxplot tooltips, which captures both mean shift + spread
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @returns CategoryContributionResult with map of category -> % contribution
 *
 * @example
 * const result = calculateCategoryContributions(data, 'Drying_Bed', 'Moisture_pct');
 * // result.contributions.get('Bed_3') = 65 -> Bed_3 alone contributes 65% of total variation
 * // result.contributions.get('Bed_1') = 10 -> Bed_1 contributes 10% of total variation
 */
export function calculateCategoryContributions(
  data: DataRow[],
  factor: string,
  outcome: string
): CategoryContributionResult | null {
  if (data.length < 2) {
    return null;
  }

  // Calculate overall mean
  const outcomeValues = data
    .map(d => toNumericValue(d[outcome]))
    .filter((v): v is number => v !== undefined);

  if (outcomeValues.length < 2) {
    return null;
  }

  const overallMean = outcomeValues.reduce((a, b) => a + b, 0) / outcomeValues.length;

  // Calculate SS_total
  const ssTotal = outcomeValues.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0);

  if (ssTotal === 0) {
    return null;
  }

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

  // Calculate contribution for each category
  const contributions = new Map<string | number, number>();
  let ssBetween = 0;

  for (const [categoryValue, values] of groups) {
    if (values.length === 0) continue;

    const categoryMean = values.reduce((a, b) => a + b, 0) / values.length;
    const categoryContribution = values.length * Math.pow(categoryMean - overallMean, 2);

    // Convert to percentage of total variation
    const contributionPct = (categoryContribution / ssTotal) * 100;
    contributions.set(categoryValue, contributionPct);

    ssBetween += categoryContribution;
  }

  const factorEtaSquared = ssBetween / ssTotal;

  return {
    contributions,
    factorEtaSquared,
    ssTotal,
  };
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
 * Get detailed statistics for each category within a factor
 *
 * Returns mean, standard deviation, sample count, and contribution percentage
 * for each category. Used by the Process Improvement Simulator to show
 * WHERE variation comes from within a factor.
 *
 * Categories are sorted by contribution percentage (highest first),
 * making it easy to identify the "worst" performers.
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @returns Array of CategoryStats sorted by contribution (highest first), or null if insufficient data
 *
 * @example
 * const stats = getCategoryStats(data, 'Machine', 'Weight');
 * // [
 * //   { value: 'Machine C', count: 50, mean: 104.3, stdDev: 2.8, contributionPct: 40 },
 * //   { value: 'Machine B', count: 45, mean: 99.1,  stdDev: 1.3, contributionPct: 15 },
 * //   { value: 'Machine A', count: 55, mean: 98.2,  stdDev: 1.1, contributionPct: 12 },
 * // ]
 */
export function getCategoryStats(
  data: DataRow[],
  factor: string,
  outcome: string
): CategoryStats[] | null {
  if (data.length < 2) {
    return null;
  }

  // Calculate overall mean for contribution calculation
  const allOutcomeValues = data
    .map(d => toNumericValue(d[outcome]))
    .filter((v): v is number => v !== undefined);

  if (allOutcomeValues.length < 2) {
    return null;
  }

  const overallMean = allOutcomeValues.reduce((a, b) => a + b, 0) / allOutcomeValues.length;

  // Calculate SS_total for contribution percentages
  const ssTotal = allOutcomeValues.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0);

  if (ssTotal === 0) {
    return null;
  }

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

  if (groups.size === 0) {
    return null;
  }

  // Calculate stats for each category
  const categoryStats: CategoryStats[] = [];

  for (const [categoryValue, values] of groups) {
    if (values.length === 0) continue;

    const count = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / count;

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // Calculate contribution to total variation (between-group SS for this category)
    const categoryContribution = count * Math.pow(mean - overallMean, 2);
    const contributionPct = (categoryContribution / ssTotal) * 100;

    categoryStats.push({
      value: categoryValue,
      count,
      mean,
      stdDev,
      contributionPct,
    });
  }

  // Sort by contribution percentage (highest first)
  categoryStats.sort((a, b) => b.contributionPct - a.contributionPct);

  return categoryStats;
}

/**
 * Calculate projected statistics if certain categories were excluded
 *
 * This enables the "what-if" analysis: if we fixed/excluded the worst-performing
 * category, what would our stats look like? Shows potential improvement in
 * mean, standard deviation, and Cpk.
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @param excludedCategories - Set of category values to exclude from projection
 * @param specs - Optional spec limits for Cpk calculation
 * @param currentStats - Optional current stats for improvement percentage calculation
 * @returns ProjectedStats with projected mean, stdDev, Cpk, and improvement percentages
 *
 * @example
 * const projected = calculateProjectedStats(
 *   data,
 *   'Machine',
 *   'Weight',
 *   new Set(['Machine C']),  // Exclude worst performer
 *   { usl: 110, lsl: 90, target: 100 },
 *   { mean: 103.3, stdDev: 4.5, cpk: 0.50 }
 * );
 * // projected.cpkImprovementPct = 190 (Cpk improved from 0.50 to 1.45)
 */
export function calculateProjectedStats(
  data: DataRow[],
  factor: string,
  outcome: string,
  excludedCategories: Set<string | number>,
  specs?: { usl?: number; lsl?: number; target?: number },
  currentStats?: { mean: number; stdDev: number; cpk?: number }
): ProjectedStats | null {
  // Filter out excluded categories
  const filteredData = data.filter(row => {
    const factorValue = row[factor];
    if (factorValue === undefined || factorValue === null) return true;
    return !excludedCategories.has(factorValue as string | number);
  });

  // Extract numeric outcome values
  const values = filteredData
    .map(d => toNumericValue(d[outcome]))
    .filter((v): v is number => v !== undefined);

  // Need at least 2 values for meaningful stats
  if (values.length < 2) {
    return null;
  }

  // Calculate projected mean
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate projected standard deviation (population)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Build result object
  const result: ProjectedStats = {
    mean,
    stdDev,
    remainingCount: values.length,
  };

  // Calculate Cp and Cpk if specs provided
  if (specs && stdDev > 0) {
    const { usl, lsl } = specs;

    if (usl !== undefined && lsl !== undefined) {
      result.cp = (usl - lsl) / (6 * stdDev);
      const cpu = (usl - mean) / (3 * stdDev);
      const cpl = (mean - lsl) / (3 * stdDev);
      result.cpk = Math.min(cpu, cpl);
    } else if (usl !== undefined) {
      result.cpk = (usl - mean) / (3 * stdDev);
    } else if (lsl !== undefined) {
      result.cpk = (mean - lsl) / (3 * stdDev);
    }
  }

  // Calculate improvement percentages if current stats provided
  if (currentStats) {
    // Standard deviation reduction (negative = worse, positive = improvement)
    if (currentStats.stdDev > 0) {
      result.stdDevReductionPct = ((currentStats.stdDev - stdDev) / currentStats.stdDev) * 100;
    }

    // Mean centering improvement (how much closer to target or center of specs)
    if (specs) {
      const target =
        specs.target ??
        (specs.usl !== undefined && specs.lsl !== undefined
          ? (specs.usl + specs.lsl) / 2
          : undefined);

      if (target !== undefined) {
        const currentDeviation = Math.abs(currentStats.mean - target);
        const projectedDeviation = Math.abs(mean - target);

        if (currentDeviation > 0) {
          result.meanImprovementPct =
            ((currentDeviation - projectedDeviation) / currentDeviation) * 100;
        } else if (projectedDeviation === 0) {
          result.meanImprovementPct = 0; // Already at target
        }
      }
    }

    // Cpk improvement
    if (currentStats.cpk !== undefined && currentStats.cpk > 0 && result.cpk !== undefined) {
      result.cpkImprovementPct = ((result.cpk - currentStats.cpk) / currentStats.cpk) * 100;
    }
  }

  return result;
}

/**
 * Parameters for direct adjustment simulation (What-If Simulator)
 */
export interface DirectAdjustmentParams {
  /** Absolute mean shift (+/- from current mean toward target) */
  meanShift: number;
  /** Variation reduction as decimal (0.0-0.5, meaning 0-50% reduction) */
  variationReduction: number;
}

/**
 * Result of direct adjustment simulation
 */
export interface DirectAdjustmentResult {
  /** Projected mean after adjustment */
  projectedMean: number;
  /** Projected standard deviation after reduction */
  projectedStdDev: number;
  /** Projected Cpk (if specs provided) */
  projectedCpk?: number;
  /** Projected Cp (if both USL and LSL provided) */
  projectedCp?: number;
  /** Projected yield percentage (% in spec) */
  projectedYield?: number;
  /** Projected parts per million defective */
  projectedPPM?: number;
  /** Improvement metrics */
  improvements: {
    /** Percentage improvement in Cpk */
    cpkImprovementPct?: number;
    /** Absolute change in yield percentage */
    yieldImprovementPct?: number;
  };
}

/**
 * Error function approximation using Horner's method
 * Used for normal CDF calculation
 *
 * @param x - Input value
 * @returns Approximation of erf(x)
 */
function erf(x: number): number {
  // Constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Standard normal cumulative distribution function
 *
 * @param z - Z-score (standard deviations from mean)
 * @returns Probability P(Z <= z)
 */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Calculate yield (percentage in spec) from a normal distribution
 *
 * @param mean - Distribution mean
 * @param stdDev - Distribution standard deviation
 * @param specs - Specification limits
 * @returns Yield percentage (0-100), or undefined if no specs
 */
function calculateYieldFromDistribution(
  mean: number,
  stdDev: number,
  specs?: { usl?: number; lsl?: number }
): number | undefined {
  if (!specs || (specs.usl === undefined && specs.lsl === undefined)) {
    return undefined;
  }

  if (stdDev === 0) {
    // No variation - check if mean is within specs
    const withinUSL = specs.usl === undefined || mean <= specs.usl;
    const withinLSL = specs.lsl === undefined || mean >= specs.lsl;
    return withinUSL && withinLSL ? 100 : 0;
  }

  // Calculate probability of being within spec limits
  let yieldPct = 100;

  if (specs.usl !== undefined && specs.lsl !== undefined) {
    // Both limits: P(LSL <= X <= USL)
    const zUpper = (specs.usl - mean) / stdDev;
    const zLower = (specs.lsl - mean) / stdDev;
    yieldPct = (normalCDF(zUpper) - normalCDF(zLower)) * 100;
  } else if (specs.usl !== undefined) {
    // Only upper limit: P(X <= USL)
    const z = (specs.usl - mean) / stdDev;
    yieldPct = normalCDF(z) * 100;
  } else if (specs.lsl !== undefined) {
    // Only lower limit: P(X >= LSL) = 1 - P(X < LSL)
    const z = (specs.lsl - mean) / stdDev;
    yieldPct = (1 - normalCDF(z)) * 100;
  }

  return Math.max(0, Math.min(100, yieldPct));
}

/**
 * Simulate process improvement through direct mean shift and variation reduction
 *
 * This function enables "what-if" analysis for process improvement planning.
 * Users can adjust:
 * 1. Mean shift - moving the process center toward a target
 * 2. Variation reduction - reducing process spread (e.g., through better controls)
 *
 * The function calculates projected Cpk, yield, and PPM based on normal distribution
 * assumptions, showing potential improvement percentages.
 *
 * @param currentStats - Current process statistics (mean, stdDev, optionally cpk)
 * @param params - Adjustment parameters (meanShift, variationReduction)
 * @param specs - Optional specification limits for capability calculations
 * @returns DirectAdjustmentResult with projected stats and improvements
 *
 * @example
 * // Simulate shifting mean 2.5g closer to target and reducing variation by 30%
 * const result = simulateDirectAdjustment(
 *   { mean: 102.5, stdDev: 2.3, cpk: 0.82 },
 *   { meanShift: -2.5, variationReduction: 0.30 },
 *   { usl: 110, lsl: 90, target: 100 }
 * );
 * // result.projectedCpk ≈ 1.56
 * // result.improvements.cpkImprovementPct ≈ 90
 */
export function simulateDirectAdjustment(
  currentStats: { mean: number; stdDev: number; cpk?: number },
  params: DirectAdjustmentParams,
  specs?: { usl?: number; lsl?: number; target?: number }
): DirectAdjustmentResult {
  // Apply adjustments
  const projectedMean = currentStats.mean + params.meanShift;
  const projectedStdDev = currentStats.stdDev * (1 - params.variationReduction);

  // Build result
  const result: DirectAdjustmentResult = {
    projectedMean,
    projectedStdDev,
    improvements: {},
  };

  // Calculate Cp and Cpk if specs provided
  if (specs && projectedStdDev > 0) {
    const { usl, lsl } = specs;

    if (usl !== undefined && lsl !== undefined) {
      result.projectedCp = (usl - lsl) / (6 * projectedStdDev);
      const cpu = (usl - projectedMean) / (3 * projectedStdDev);
      const cpl = (projectedMean - lsl) / (3 * projectedStdDev);
      result.projectedCpk = Math.min(cpu, cpl);
    } else if (usl !== undefined) {
      result.projectedCpk = (usl - projectedMean) / (3 * projectedStdDev);
    } else if (lsl !== undefined) {
      result.projectedCpk = (projectedMean - lsl) / (3 * projectedStdDev);
    }
  }

  // Calculate yield and PPM
  const projectedYield = calculateYieldFromDistribution(projectedMean, projectedStdDev, specs);
  if (projectedYield !== undefined) {
    result.projectedYield = projectedYield;
    result.projectedPPM = Math.round((100 - projectedYield) * 10000); // Convert % to PPM
  }

  // Calculate improvement percentages
  if (currentStats.cpk !== undefined && currentStats.cpk > 0 && result.projectedCpk !== undefined) {
    result.improvements.cpkImprovementPct =
      ((result.projectedCpk - currentStats.cpk) / currentStats.cpk) * 100;
  }

  // Calculate current yield for comparison
  const currentYield = calculateYieldFromDistribution(
    currentStats.mean,
    currentStats.stdDev,
    specs
  );
  if (currentYield !== undefined && projectedYield !== undefined) {
    result.improvements.yieldImprovementPct = projectedYield - currentYield;
  }

  return result;
}
