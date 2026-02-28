/**
 * useDashboardCharts - Hook for Azure Dashboard chart state management
 *
 * Extracts chart-related state and handlers from Dashboard.tsx to reduce
 * component complexity and improve testability.
 *
 * Manages:
 * - Factor selection for Boxplot and Pareto charts
 * - Focused chart mode navigation
 * - Pareto comparison toggle
 * - Copy-to-clipboard feedback
 * - Filter navigation (local or external)
 * - Variation tracking
 * - Derived: availableOutcomes, availableStageColumns, ANOVA, boxplot data
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { type AnovaResult, getNextDrillFactor } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';
import { useChartCopy, useKeyboardNavigation, useDashboardComputedData } from '@variscout/hooks';
import { useFilterNavigation, useVariationTracking } from '../hooks';
import type { UseFilterNavigationReturn, FilterChipData } from '../hooks';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;
export type FocusedChart = (typeof CHART_ORDER)[number] | null;

export interface UseDashboardChartsProps {
  externalFilterNav?: UseFilterNavigationReturn;
  /** Initial boxplot factor from persisted view state */
  initialBoxplotFactor?: string;
  /** Initial pareto factor from persisted view state */
  initialParetoFactor?: string;
  /** Report boxplot factor changes for persistence */
  onBoxplotFactorChange?: (factor: string) => void;
  /** Report pareto factor changes for persistence */
  onParetoFactorChange?: (factor: string) => void;
}

export interface UseDashboardChartsResult {
  // Factor selection
  boxplotFactor: string;
  setBoxplotFactor: (f: string) => void;
  paretoFactor: string;
  setParetoFactor: (f: string) => void;

  // Focus mode
  focusedChart: FocusedChart;
  setFocusedChart: (c: FocusedChart) => void;
  handleNextChart: () => void;
  handlePrevChart: () => void;

  // Pareto comparison toggle
  showParetoComparison: boolean;
  setShowParetoComparison: (v: boolean) => void;

  // Chart export
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadSvg: (containerId: string, chartName: string) => void;

  // Derived data
  availableOutcomes: string[];
  availableStageColumns: string[];
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];

  // Variation tracking
  cumulativeVariationPct: number;
  filterChipData: FilterChipData[];
  factorVariations: Map<string, number>;
  categoryContributions: Map<string, Map<string | number, number>>;

  // Filter navigation (resolved — external or internal)
  filterStack: UseFilterNavigationReturn['filterStack'];
  applyFilter: UseFilterNavigationReturn['applyFilter'];
  clearFilters: UseFilterNavigationReturn['clearFilters'];
  updateFilterValues: UseFilterNavigationReturn['updateFilterValues'];
  removeFilter: UseFilterNavigationReturn['removeFilter'];

  // Visual feedback
  lastAdvancedFactor: string | null;

  // Handlers
  handleDrillDown: (factor: string, value: string) => void;
  handleChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;
}

export function useDashboardCharts(props?: UseDashboardChartsProps): UseDashboardChartsResult {
  const { outcome, factors, rawData, filteredData, chartTitles, setChartTitles, displayOptions } =
    useData();

  // Filter navigation — use external if provided, otherwise create local
  const localFilterNav = useFilterNavigation({
    enableHistory: false,
    enableUrlSync: false,
  });
  const { filterStack, applyFilter, clearFilters, updateFilterValues, removeFilter } =
    props?.externalFilterNav ?? localFilterNav;

  const { initialBoxplotFactor, initialParetoFactor, onBoxplotFactorChange, onParetoFactorChange } =
    props ?? {};

  // Variation tracking
  const {
    cumulativeVariationPct: rawCumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,
  } = useVariationTracking(rawData, filterStack, outcome, factors);
  const cumulativeVariationPct = rawCumulativeVariationPct ?? 0;

  // Chart export (theme-aware background)
  const { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg } = useChartCopy({
    getBackgroundColor: () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      return isDark ? '#0f172a' : '#ffffff';
    },
  });

  // Local state — initialize from persisted view state if available
  const [boxplotFactor, setBoxplotFactorRaw] = useState<string>(initialBoxplotFactor ?? '');
  const [paretoFactor, setParetoFactorRaw] = useState<string>(initialParetoFactor ?? '');

  // Wrap setters to report changes for persistence
  const setBoxplotFactor = useCallback(
    (f: string) => {
      setBoxplotFactorRaw(f);
      onBoxplotFactorChange?.(f);
    },
    [onBoxplotFactorChange]
  );
  const setParetoFactor = useCallback(
    (f: string) => {
      setParetoFactorRaw(f);
      onParetoFactorChange?.(f);
    },
    [onParetoFactorChange]
  );

  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);
  const [showParetoComparison, setShowParetoComparison] = useState(false);
  const [lastAdvancedFactor, setLastAdvancedFactor] = useState<string | null>(null);
  const advancedFactorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize/update factor defaults when factors list changes
  useEffect(() => {
    if (factors.length > 0) {
      if (!boxplotFactor || !factors.includes(boxplotFactor)) {
        const fallback = factors[0];
        setBoxplotFactorRaw(fallback);
        onBoxplotFactorChange?.(fallback);
      }
      if (!paretoFactor || !factors.includes(paretoFactor)) {
        const fallback = factors[1] || factors[0];
        setParetoFactorRaw(fallback);
        onParetoFactorChange?.(fallback);
      }
    }
  }, [factors, boxplotFactor, paretoFactor, onBoxplotFactorChange, onParetoFactorChange]);

  // Keyboard navigation for focused chart mode
  const handleNextChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current);
      return CHART_ORDER[(index + 1) % CHART_ORDER.length];
    });
  }, []);

  const handlePrevChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current);
      return CHART_ORDER[(index - 1 + CHART_ORDER.length) % CHART_ORDER.length];
    });
  }, []);

  // Keyboard navigation for focused chart mode (shared hook)
  useKeyboardNavigation({
    focusedItem: focusedChart,
    onNext: handleNextChart,
    onPrev: handlePrevChart,
    onEscape: () => setFocusedChart(null),
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (advancedFactorTimeoutRef.current) {
        clearTimeout(advancedFactorTimeoutRef.current);
      }
    };
  }, []);

  // Shared computed data (availableOutcomes, availableStageColumns, ANOVA, boxplotData)
  const { availableOutcomes, availableStageColumns, anovaResult, boxplotData } =
    useDashboardComputedData({
      rawData,
      filteredData,
      outcome,
      boxplotFactor,
      boxplotSortBy: displayOptions.boxplotSortBy,
      boxplotSortDirection: displayOptions.boxplotSortDirection,
    });

  // Update persisted chart title in DataContext
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...chartTitles, [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  // Drill down into a factor value and advance to the next highest-variation factor
  const handleDrillDown = useCallback(
    (factor: string, value: string) => {
      applyFilter({
        type: 'filter',
        source: 'boxplot',
        factor,
        values: [value],
      });
      const nextFactor = getNextDrillFactor(factorVariations, factor);
      if (nextFactor) {
        setBoxplotFactor(nextFactor);
        setParetoFactor(nextFactor);
        // Brief visual feedback that factor changed
        setLastAdvancedFactor(nextFactor);
        if (advancedFactorTimeoutRef.current) {
          clearTimeout(advancedFactorTimeoutRef.current);
        }
        advancedFactorTimeoutRef.current = setTimeout(() => setLastAdvancedFactor(null), 2000);
      } else {
        setBoxplotFactor(factor);
        setParetoFactor(factor);
      }
    },
    [applyFilter, factorVariations, setBoxplotFactor, setParetoFactor]
  );

  return {
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    showParetoComparison,
    setShowParetoComparison,
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    cumulativeVariationPct,
    filterChipData,
    factorVariations,
    categoryContributions,
    lastAdvancedFactor,
    filterStack,
    applyFilter,
    clearFilters,
    updateFilterValues,
    removeFilter,
    handleDrillDown,
    handleChartTitleChange,
  };
}

export default useDashboardCharts;
