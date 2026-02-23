/**
 * Drill variation calculation — cumulative Total SS scope through drill paths
 */

import type { DataRow } from '../types';
import { getVariationImpactLevel, getVariationInsight } from '../navigation';
import { calculateCategoryTotalSS } from './contributions';
import type { DrillVariationResult, DrillLevelVariation } from './types';

export type { DrillVariationResult, DrillLevelVariation };

/**
 * Calculate cumulative Total SS scope through a drill path
 *
 * At each drill level, calculates:
 * 1. Local scope — what fraction of the current level's Total SS the selected categories account for
 * 2. Cumulative scope — product of all local scope values
 *
 * This enables the "investigation scope" insight: drilling 3 levels deep
 * narrows focus to e.g. 25% of total variation — a concentrated slice.
 *
 * @param rawData - Original unfiltered data
 * @param filters - Current filters as Record<factor, values[]>
 * @param outcome - The outcome column name
 * @returns Drill variation result with levels, cumulative %, and insights
 *
 * @example
 * const result = calculateDrillVariation(data, { Shift: ['Night'], Machine: ['C'] }, 'Weight');
 * // result.cumulativeVariationPct = 24.7
 * // result.insightText = "Significant slice of variation in focus."
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
    // Calculate Total SS contributions for this factor on the current data
    const totalSSResult = calculateCategoryTotalSS(currentData, factor, outcome);
    if (!totalSSResult) break;

    // Sum contributions of the selected categories
    let selectedPct = 0;
    for (const value of values) {
      selectedPct += totalSSResult.contributions.get(value) ?? 0;
    }

    // Update cumulative scope (multiply, not add)
    cumulativePct = (cumulativePct * selectedPct) / 100;

    levels.push({
      factor,
      values,
      localVariationPct: selectedPct,
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
