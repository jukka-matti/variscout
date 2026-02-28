/**
 * useDashboardCharts - Azure Dashboard chart state management
 *
 * Wraps useDashboardChartsBase with Azure-specific features:
 * - Persistence callbacks for factor changes
 * - Keyboard navigation for focused chart mode
 * - Chart title persistence via DataContext
 * - lastAdvancedFactor visual feedback
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import type { AnovaResult } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';
import { useDashboardChartsBase, useKeyboardNavigation } from '@variscout/hooks';
import { useFilterNavigation } from '../hooks';
import type { UseFilterNavigationReturn, FilterChipData } from '../hooks';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;
export type FocusedChart = (typeof CHART_ORDER)[number] | null;

export interface UseDashboardChartsProps {
  externalFilterNav?: UseFilterNavigationReturn;
  initialBoxplotFactor?: string;
  initialParetoFactor?: string;
  onBoxplotFactorChange?: (factor: string) => void;
  onParetoFactorChange?: (factor: string) => void;
}

export interface UseDashboardChartsResult {
  boxplotFactor: string;
  setBoxplotFactor: (f: string) => void;
  paretoFactor: string;
  setParetoFactor: (f: string) => void;
  focusedChart: FocusedChart;
  setFocusedChart: (c: FocusedChart) => void;
  handleNextChart: () => void;
  handlePrevChart: () => void;
  showParetoComparison: boolean;
  setShowParetoComparison: (v: boolean) => void;
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadSvg: (containerId: string, chartName: string) => void;
  availableOutcomes: string[];
  availableStageColumns: string[];
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];
  cumulativeVariationPct: number;
  filterChipData: FilterChipData[];
  factorVariations: Map<string, number>;
  categoryContributions: Map<string, Map<string | number, number>>;
  lastAdvancedFactor: string | null;
  filterStack: UseFilterNavigationReturn['filterStack'];
  applyFilter: UseFilterNavigationReturn['applyFilter'];
  clearFilters: UseFilterNavigationReturn['clearFilters'];
  updateFilterValues: UseFilterNavigationReturn['updateFilterValues'];
  removeFilter: UseFilterNavigationReturn['removeFilter'];
  handleDrillDown: (factor: string, value: string) => void;
  handleChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;
}

export function useDashboardCharts(props?: UseDashboardChartsProps): UseDashboardChartsResult {
  const { outcome, factors, rawData, filteredData, chartTitles, setChartTitles, displayOptions } =
    useData();

  const { initialBoxplotFactor, initialParetoFactor, onBoxplotFactorChange, onParetoFactorChange } =
    props ?? {};

  // Filter navigation — use external if provided, otherwise create local
  const localFilterNav = useFilterNavigation({
    enableHistory: false,
    enableUrlSync: false,
  });
  const filterNav = props?.externalFilterNav ?? localFilterNav;
  const { filterStack, applyFilter, clearFilters, updateFilterValues, removeFilter } = filterNav;

  // Base hook — shared composition
  const base = useDashboardChartsBase({
    rawData,
    filteredData,
    outcome,
    factors,
    filterStack,
    displayOptions,
    filterNav,
    chartCopyOptions: {
      getBackgroundColor: () => {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return isDark ? '#0f172a' : '#ffffff';
      },
    },
    initialBoxplotFactor,
    initialParetoFactor,
  });

  // Wrap factor setters to report changes for persistence
  const setBoxplotFactor = useCallback(
    (f: string) => {
      base.setBoxplotFactor(f);
      onBoxplotFactorChange?.(f);
    },
    [base.setBoxplotFactor, onBoxplotFactorChange]
  );
  const setParetoFactor = useCallback(
    (f: string) => {
      base.setParetoFactor(f);
      onParetoFactorChange?.(f);
    },
    [base.setParetoFactor, onParetoFactorChange]
  );

  // Focus mode
  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);

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

  useKeyboardNavigation({
    focusedItem: focusedChart,
    onNext: handleNextChart,
    onPrev: handlePrevChart,
    onEscape: () => setFocusedChart(null),
  });

  // lastAdvancedFactor visual feedback
  const [lastAdvancedFactor, setLastAdvancedFactor] = useState<string | null>(null);
  const advancedFactorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advancedFactorTimeoutRef.current) clearTimeout(advancedFactorTimeoutRef.current);
    };
  }, []);

  // Chart titles
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...(chartTitles || {}), [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  // Drill-down with visual feedback
  const handleDrillDown = useCallback(
    (factor: string, value: string) => {
      const nextFactor = base.handleDrillDown(factor, value);
      if (nextFactor) {
        onBoxplotFactorChange?.(nextFactor);
        onParetoFactorChange?.(nextFactor);
        setLastAdvancedFactor(nextFactor);
        if (advancedFactorTimeoutRef.current) clearTimeout(advancedFactorTimeoutRef.current);
        advancedFactorTimeoutRef.current = setTimeout(() => setLastAdvancedFactor(null), 2000);
      } else {
        onBoxplotFactorChange?.(factor);
        onParetoFactorChange?.(factor);
      }
    },
    [base.handleDrillDown, onBoxplotFactorChange, onParetoFactorChange]
  );

  // Coerce nulls to match Azure's stricter types
  const cumulativeVariationPct = base.cumulativeVariationPct ?? 0;
  const categoryContributions =
    base.categoryContributions ?? new Map<string, Map<string | number, number>>();

  return {
    boxplotFactor: base.boxplotFactor,
    setBoxplotFactor,
    paretoFactor: base.paretoFactor,
    setParetoFactor,
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    showParetoComparison: base.showParetoComparison,
    setShowParetoComparison: base.setShowParetoComparison,
    copyFeedback: base.copyFeedback,
    handleCopyChart: base.handleCopyChart,
    handleDownloadPng: base.handleDownloadPng,
    handleDownloadSvg: base.handleDownloadSvg,
    availableOutcomes: base.availableOutcomes,
    availableStageColumns: base.availableStageColumns,
    anovaResult: base.anovaResult,
    boxplotData: base.boxplotData,
    cumulativeVariationPct,
    filterChipData: base.filterChipData,
    factorVariations: base.factorVariations,
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
