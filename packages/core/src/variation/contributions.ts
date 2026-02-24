/**
 * Category contribution calculations — Total SS and between-group contributions
 */

import type { DataRow } from '../types';
import { toNumericValue } from '../types';
import type { CategoryTotalSSResult, CategoryStats } from './types';

export type { CategoryTotalSSResult, CategoryStats };

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
 * - Category Total SS = sum of (x_ij - overall_mean)^2 for all values in category
 * - Category % = (Category Total SS / Total SS) * 100
 *
 * Note: Sum of all category %s = 100% (total variation is fully partitioned)
 *
 * @param data - Array of data rows
 * @param factor - Column name for the grouping variable
 * @param outcome - Column name for the numeric outcome variable
 * @returns CategoryTotalSSResult with map of category -> % of total SS
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
