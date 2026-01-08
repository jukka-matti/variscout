import { useMemo } from 'react';
import {
  type DrillAction,
  type BreadcrumbItem,
  drillStackToFilters,
  getVariationImpactLevel,
  getVariationInsight,
  calculateDrillVariation,
  calculateFactorVariations,
  applyFilters,
} from '@variscout/core';

export interface VariationTrackingResult {
  /**
   * Breadcrumb items enhanced with variation percentages
   */
  breadcrumbsWithVariation: BreadcrumbItem[];

  /**
   * Final cumulative variation percentage (product of all η²)
   * This is the total % of original variation isolated to current path
   */
  cumulativeVariationPct: number | null;

  /**
   * Impact level based on cumulative variation
   */
  impactLevel: 'high' | 'moderate' | 'low' | null;

  /**
   * Insight text for the current cumulative variation
   */
  insightText: string | null;

  /**
   * Map of factor -> η² for recommending drill targets
   * Factors with > 50% variation should be highlighted in charts
   */
  factorVariations: Map<string, number>;
}

/**
 * React hook for variation tracking in drill-down navigation
 *
 * Wraps the pure functions from @variscout/core with React memoization.
 * At each drill level, calculates:
 * 1. Local η² - how much variation the factor explains at that level
 * 2. Cumulative η² - product of all local η² values
 *
 * This enables the "variation funnel" insight: drilling 3 levels deep
 * to isolate e.g. 46% of total variation into one specific condition.
 *
 * @param rawData - Original unfiltered data
 * @param drillStack - Current drill navigation stack
 * @param outcome - The outcome column name
 * @param factors - Available factor columns
 * @returns Enhanced breadcrumbs with variation data and insights
 */
export function useVariationTracking(
  rawData: any[],
  drillStack: DrillAction[],
  outcome: string | null,
  factors: string[]
): VariationTrackingResult {
  // Calculate factor variations for the current data level (for drill suggestions)
  const factorVariations = useMemo(() => {
    if (!outcome || rawData.length < 2) {
      return new Map<string, number>();
    }

    // Get the current filtered data based on drill stack
    const currentFilters = drillStackToFilters(drillStack);
    const filteredData = applyFilters(rawData, currentFilters);

    if (filteredData.length < 2) {
      return new Map<string, number>();
    }

    // Get factors that are already drilled (to exclude)
    const drilledFactors = drillStack
      .filter(a => a.type === 'filter' && a.factor)
      .map(a => a.factor!);

    // Use shared calculation function
    return calculateFactorVariations(filteredData, factors, outcome, drilledFactors);
  }, [rawData, drillStack, outcome, factors]);

  // Calculate breadcrumbs with variation percentages
  const result = useMemo((): Omit<VariationTrackingResult, 'factorVariations'> => {
    const emptyRoot: BreadcrumbItem = {
      id: 'root',
      label: 'All Data',
      isActive: drillStack.length === 0,
      source: 'ichart',
      localVariationPct: undefined,
      cumulativeVariationPct: undefined,
    };

    if (!outcome || rawData.length < 2 || drillStack.length === 0) {
      return {
        breadcrumbsWithVariation: [emptyRoot],
        cumulativeVariationPct: null,
        impactLevel: null,
        insightText: null,
      };
    }

    // Convert drill stack to filters for calculation
    const filters = drillStackToFilters(drillStack);

    // Use shared calculation function
    const drillResult = calculateDrillVariation(rawData, filters, outcome);

    if (!drillResult) {
      return {
        breadcrumbsWithVariation: [emptyRoot],
        cumulativeVariationPct: null,
        impactLevel: null,
        insightText: null,
      };
    }

    // Build breadcrumbs from drill result
    const breadcrumbs: BreadcrumbItem[] = [
      {
        id: 'root',
        label: 'All Data',
        isActive: false,
        source: 'ichart',
        localVariationPct: 100,
        cumulativeVariationPct: 100,
      },
    ];

    // Map drill levels to drill stack actions
    for (let i = 0; i < drillStack.length; i++) {
      const action = drillStack[i];
      const level = drillResult.levels[i + 1]; // +1 because levels[0] is root
      const isLast = i === drillStack.length - 1;

      breadcrumbs.push({
        id: action.id,
        label: action.label,
        isActive: isLast,
        source: action.source,
        localVariationPct: level?.localVariationPct,
        cumulativeVariationPct: level?.cumulativeVariationPct,
      });
    }

    return {
      breadcrumbsWithVariation: breadcrumbs,
      cumulativeVariationPct: drillResult.cumulativeVariationPct,
      impactLevel: drillResult.impactLevel,
      insightText: drillResult.insightText,
    };
  }, [rawData, drillStack, outcome]);

  return {
    ...result,
    factorVariations,
  };
}

export default useVariationTracking;
