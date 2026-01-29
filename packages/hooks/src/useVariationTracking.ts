import { useMemo } from 'react';
import {
  type FilterAction,
  type BreadcrumbItem,
  filterStackToFilters,
  calculateDrillVariation,
  calculateFactorVariations,
  calculateCategoryTotalSS,
  applyFilters,
} from '@variscout/core';

/**
 * Data for a single filter chip in the UI
 */
export interface FilterChipData {
  /** The factor/column name being filtered */
  factor: string;
  /** Currently selected value(s) */
  values: (string | number)[];
  /** Combined contribution % of selected values to total variation */
  contributionPct: number;
  /** All available values for the dropdown with their individual contributions */
  availableValues: {
    value: string | number;
    contributionPct: number;
    isSelected: boolean;
  }[];
}

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

  /**
   * Map of factor -> category Total SS contributions
   * For each factor, shows each category's Total Sum of Squares contribution
   * This captures both mean shift AND spread (within-group variation)
   * Sum of all categories = 100% (total variation fully partitioned)
   * Used to show "Impact: X% of total variation" in boxplot tooltips
   */
  categoryContributions: Map<string, Map<string | number, number>>;

  /**
   * Filter chip data for the enhanced breadcrumb UI
   * Includes contribution % and available values for multi-select
   */
  filterChipData: FilterChipData[];
}

/**
 * React hook for variation tracking in filter navigation
 *
 * Wraps the pure functions from @variscout/core with React memoization.
 * At each filter level, calculates:
 * 1. Local η² - how much variation the factor explains at that level
 * 2. Cumulative η² - product of all local η² values
 *
 * This enables the "variation funnel" insight: filtering 3 levels deep
 * to isolate e.g. 46% of total variation into one specific condition.
 *
 * @param rawData - Original unfiltered data
 * @param filterStack - Current filter navigation stack
 * @param outcome - The outcome column name
 * @param factors - Available factor columns
 * @returns Enhanced breadcrumbs with variation data and insights
 *
 * @example
 * ```tsx
 * const { filters, setFilters, columnAliases } = useData();
 * const { filterStack } = useFilterNavigation({ filters, setFilters, columnAliases });
 *
 * const {
 *   breadcrumbsWithVariation,
 *   cumulativeVariationPct,
 *   factorVariations,
 * } = useVariationTracking(rawData, filterStack, outcome, factors);
 *
 * // Use factorVariations to highlight high-impact factors in charts
 * const machineVariation = factorVariations.get('Machine'); // e.g., 0.67 (67%)
 * ```
 */
export function useVariationTracking(
  rawData: any[],
  filterStack: FilterAction[],
  outcome: string | null,
  factors: string[]
): VariationTrackingResult {
  // Calculate factor variations for the current data level (for filter suggestions)
  const factorVariations = useMemo(() => {
    if (!outcome || rawData.length < 2) {
      return new Map<string, number>();
    }

    // Get the current filtered data based on filter stack
    const currentFilters = filterStackToFilters(filterStack);
    const filteredData = applyFilters(rawData, currentFilters);

    if (filteredData.length < 2) {
      return new Map<string, number>();
    }

    // Get factors that are already filtered (to exclude)
    const filteredFactors = filterStack
      .filter(a => a.type === 'filter' && a.factor)
      .map(a => a.factor!);

    // Use shared calculation function
    return calculateFactorVariations(filteredData, factors, outcome, filteredFactors);
  }, [rawData, filterStack, outcome, factors]);

  // Calculate category Total SS contributions for each factor
  // Uses calculateCategoryTotalSS which captures both mean shift AND spread
  const categoryContributions = useMemo(() => {
    const contributions = new Map<string, Map<string | number, number>>();

    if (!outcome || rawData.length < 2) {
      return contributions;
    }

    // Get the current filtered data based on filter stack
    const currentFilters = filterStackToFilters(filterStack);
    const filteredData = applyFilters(rawData, currentFilters);

    if (filteredData.length < 2) {
      return contributions;
    }

    // Calculate Total SS contributions for each factor
    // This captures both mean shift + spread (not just between-group variance)
    for (const factor of factors) {
      const result = calculateCategoryTotalSS(filteredData, factor, outcome);
      if (result) {
        contributions.set(factor, result.contributions);
      }
    }

    return contributions;
  }, [rawData, filterStack, outcome, factors]);

  // Calculate filter chip data for the enhanced breadcrumb UI
  const filterChipData = useMemo((): FilterChipData[] => {
    if (filterStack.length === 0 || !outcome || rawData.length < 2) {
      return [];
    }

    // Get category contributions from ORIGINAL (unfiltered) data
    // This ensures we show % of TOTAL variation, not local variation
    const originalContributions = new Map<string, Map<string | number, number>>();
    for (const factor of factors) {
      const result = calculateCategoryTotalSS(rawData, factor, outcome);
      if (result) {
        originalContributions.set(factor, result.contributions);
      }
    }

    // Build chip data for each active filter
    const chips: FilterChipData[] = [];

    for (const action of filterStack) {
      if (action.type !== 'filter' || !action.factor) continue;

      const factor = action.factor;
      const selectedValues = action.values;
      const factorContributions = originalContributions.get(factor);

      // Get all unique values for this factor from raw data
      const allValues = new Set<string | number>();
      for (const row of rawData) {
        const val = row[factor];
        if (val !== undefined && val !== null && val !== '') {
          allValues.add(typeof val === 'number' ? val : String(val));
        }
      }

      // Calculate combined contribution of selected values
      let combinedContribution = 0;
      const availableValues: FilterChipData['availableValues'] = [];

      for (const value of allValues) {
        const contribution = factorContributions?.get(value) ?? 0;
        const isSelected = selectedValues.some(sv => String(sv) === String(value));

        if (isSelected) {
          combinedContribution += contribution;
        }

        availableValues.push({
          value,
          contributionPct: contribution,
          isSelected,
        });
      }

      // Sort available values by contribution (highest first)
      availableValues.sort((a, b) => b.contributionPct - a.contributionPct);

      chips.push({
        factor,
        values: selectedValues,
        contributionPct: combinedContribution,
        availableValues,
      });
    }

    return chips;
  }, [filterStack, outcome, factors, rawData]);

  // Calculate breadcrumbs with variation percentages
  const result = useMemo((): Omit<
    VariationTrackingResult,
    'factorVariations' | 'categoryContributions' | 'filterChipData'
  > => {
    const emptyRoot: BreadcrumbItem = {
      id: 'root',
      label: 'All Data',
      isActive: filterStack.length === 0,
      source: 'ichart',
      localVariationPct: undefined,
      cumulativeVariationPct: undefined,
    };

    if (!outcome || rawData.length < 2 || filterStack.length === 0) {
      return {
        breadcrumbsWithVariation: [emptyRoot],
        cumulativeVariationPct: null,
        impactLevel: null,
        insightText: null,
      };
    }

    // Convert filter stack to filters for calculation
    const filters = filterStackToFilters(filterStack);

    // Use shared calculation function
    const variationResult = calculateDrillVariation(rawData, filters, outcome);

    if (!variationResult) {
      return {
        breadcrumbsWithVariation: [emptyRoot],
        cumulativeVariationPct: null,
        impactLevel: null,
        insightText: null,
      };
    }

    // Build breadcrumbs from variation result
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

    // Map filter levels to filter stack actions
    for (let i = 0; i < filterStack.length; i++) {
      const action = filterStack[i];
      const level = variationResult.levels[i + 1]; // +1 because levels[0] is root
      const isLast = i === filterStack.length - 1;

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
      cumulativeVariationPct: variationResult.cumulativeVariationPct,
      impactLevel: variationResult.impactLevel,
      insightText: variationResult.insightText,
    };
  }, [rawData, filterStack, outcome]);

  return {
    ...result,
    factorVariations,
    categoryContributions,
    filterChipData,
  };
}

export default useVariationTracking;
