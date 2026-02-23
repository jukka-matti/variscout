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

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  calculateAnova,
  type AnovaResult,
  getNextDrillFactor,
  sortBoxplotData,
} from '@variscout/core';
import { calculateBoxplotStats, type BoxplotGroupData } from '@variscout/charts';
import { useChartCopy } from '@variscout/hooks';
import { useFilterNavigation, useVariationTracking } from '../hooks';
import type { UseFilterNavigationReturn, FilterChipData } from '../hooks';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;
export type FocusedChart = (typeof CHART_ORDER)[number] | null;

export interface UseDashboardChartsProps {
  externalFilterNav?: UseFilterNavigationReturn;
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

  // Local state
  const [boxplotFactor, setBoxplotFactor] = useState<string>('');
  const [paretoFactor, setParetoFactor] = useState<string>('');
  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);
  const [showParetoComparison, setShowParetoComparison] = useState(false);
  const [lastAdvancedFactor, setLastAdvancedFactor] = useState<string | null>(null);
  const advancedFactorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize/update factor defaults when factors list changes
  useEffect(() => {
    if (factors.length > 0) {
      if (!boxplotFactor || !factors.includes(boxplotFactor)) {
        setBoxplotFactor(factors[0]);
      }
      if (!paretoFactor || !factors.includes(paretoFactor)) {
        setParetoFactor(factors[1] || factors[0]);
      }
    }
  }, [factors, boxplotFactor, paretoFactor]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedChart) {
        if (e.key === 'ArrowRight') handleNextChart();
        if (e.key === 'ArrowLeft') handlePrevChart();
        if (e.key === 'Escape') setFocusedChart(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedChart, handleNextChart, handlePrevChart]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (advancedFactorTimeoutRef.current) {
        clearTimeout(advancedFactorTimeoutRef.current);
      }
    };
  }, []);

  // Derived: numeric outcome columns
  const availableOutcomes = useMemo(() => {
    if (rawData.length === 0) return [];
    const row = rawData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [rawData]);

  // Derived: columns suitable as stage groupings (2–10 unique values)
  const availableStageColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    const columns = Object.keys(rawData[0]);
    return columns.filter(col => {
      if (col === outcome) return false;
      const uniqueValues = new Set(rawData.map(row => row[col]));
      return uniqueValues.size >= 2 && uniqueValues.size <= 10;
    });
  }, [rawData, outcome]);

  // Derived: ANOVA result for boxplot factor
  const anovaResult: AnovaResult | null = useMemo(() => {
    if (!outcome || !boxplotFactor || filteredData.length === 0) return null;
    return calculateAnova(filteredData, outcome, boxplotFactor);
  }, [filteredData, outcome, boxplotFactor]);

  // Derived: boxplot group data (for stats table in focused mode)
  const boxplotData: BoxplotGroupData[] = useMemo(() => {
    if (!outcome || !boxplotFactor || filteredData.length === 0) return [];
    const groups = new Map<string, number[]>();
    for (const row of filteredData) {
      const key = String(row[boxplotFactor] ?? '');
      const value = Number(row[outcome]);
      if (!isNaN(value)) {
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(value);
      }
    }
    const unsorted = Array.from(groups.entries()).map(([group, values]) =>
      calculateBoxplotStats({ group, values })
    );
    return sortBoxplotData(
      unsorted,
      displayOptions.boxplotSortBy,
      displayOptions.boxplotSortDirection
    );
  }, [
    filteredData,
    outcome,
    boxplotFactor,
    displayOptions.boxplotSortBy,
    displayOptions.boxplotSortDirection,
  ]);

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
    [applyFilter, factorVariations]
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
