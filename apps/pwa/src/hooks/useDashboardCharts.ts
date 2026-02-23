/**
 * useDashboardCharts - Composition hook for Dashboard chart state management
 *
 * Composes focused sub-hooks:
 * - useFocusMode: focused chart navigation + keyboard
 * - useChartCopy: clipboard copy + feedback
 * - useChartFactors: boxplot/pareto factor selection
 * - useFilterNavigation: filter stack management
 * - useVariationTracking: η² tracking
 *
 * Derived data: availableOutcomes, availableStageColumns, anovaResult, boxplotData
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  calculateAnova,
  type AnovaResult,
  getNextDrillFactor,
  sortBoxplotData,
} from '@variscout/core';
import { calculateBoxplotStats, type BoxplotGroupData } from '@variscout/charts';
import { useFilterNavigation, type UseFilterNavigationReturn } from './useFilterNavigation';
import { useVariationTracking } from '@variscout/hooks';
import { useFocusMode } from './useFocusMode';
import { useChartCopy } from './useChartCopy';
import { useChartFactors } from './useChartFactors';
import type { ChartId } from '@variscout/ui';

export interface UseDashboardChartsProps {
  /** External filter navigation (lifted to parent for shared state with mindmap) */
  externalFilterNav?: UseFilterNavigationReturn;
  /** External trigger to open spec editor (from MobileMenu) */
  openSpecEditorRequested?: boolean;
  /** Callback when spec editor is opened */
  onSpecEditorOpened?: () => void;
  /** Highlighted chart for embed mode */
  highlightedChart?: ChartId | null;
  /** Highlight intensity for embed mode */
  highlightIntensity?: 'pulse' | 'glow' | 'border';
  /** Chart click handler for embed mode */
  onChartClick?: (chartId: ChartId) => void;
}

export interface UseDashboardChartsResult {
  // Factor selection
  boxplotFactor: string;
  setBoxplotFactor: (factor: string) => void;
  paretoFactor: string;
  setParetoFactor: (factor: string) => void;

  // Focus mode
  focusedChart: ReturnType<typeof useFocusMode>['focusedChart'];
  setFocusedChart: ReturnType<typeof useFocusMode>['setFocusedChart'];
  handleNextChart: () => void;
  handlePrevChart: () => void;

  // Panel toggles
  showParetoPanel: boolean;
  setShowParetoPanel: (show: boolean) => void;
  showParetoComparison: boolean;
  toggleParetoComparison: () => void;
  showSpecEditor: boolean;
  setShowSpecEditor: (show: boolean) => void;

  // Chart export
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadSvg: (containerId: string, chartName: string) => void;

  // Pareto factor selector ref (for focus from empty state)
  paretoFactorSelectorRef: React.RefObject<HTMLSelectElement>;

  // Embed mode helpers
  getHighlightClass: (chartId: ChartId) => string;
  handleChartWrapperClick: (chartId: ChartId) => void;

  // Computed data
  availableOutcomes: string[];
  availableStageColumns: string[];
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];

  // Filter navigation state
  filterStack: ReturnType<typeof useFilterNavigation>['filterStack'];
  applyFilter: ReturnType<typeof useFilterNavigation>['applyFilter'];
  navigateTo: ReturnType<typeof useFilterNavigation>['navigateTo'];
  clearFilters: ReturnType<typeof useFilterNavigation>['clearFilters'];
  updateFilterValues: ReturnType<typeof useFilterNavigation>['updateFilterValues'];
  removeFilter: ReturnType<typeof useFilterNavigation>['removeFilter'];

  // Variation tracking
  breadcrumbItems: ReturnType<typeof useVariationTracking>['breadcrumbsWithVariation'];
  cumulativeVariationPct: number | null;
  factorVariations: Map<string, number>;
  categoryContributions: Map<string, Map<string | number, number>> | undefined;
  filterChipData: ReturnType<typeof useVariationTracking>['filterChipData'];

  // Drill handler
  handleDrillDown: (factor: string, value: string) => void;
}

export function useDashboardCharts({
  externalFilterNav,
  openSpecEditorRequested,
  onSpecEditorOpened,
  highlightedChart,
  highlightIntensity = 'pulse',
  onChartClick,
}: UseDashboardChartsProps = {}): UseDashboardChartsResult {
  const { outcome, factors, rawData, filteredData, displayOptions } = useData();

  // Filter navigation — use external if provided, otherwise create local
  const localFilterNav = useFilterNavigation({
    enableHistory: true,
    enableUrlSync: true,
  });
  const { filterStack, applyFilter, navigateTo, clearFilters, updateFilterValues, removeFilter } =
    externalFilterNav ?? localFilterNav;

  // Variation tracking
  const {
    breadcrumbsWithVariation: breadcrumbItems,
    cumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,
  } = useVariationTracking(rawData, filterStack, outcome, factors);

  // Focus mode + keyboard navigation
  const { focusedChart, setFocusedChart, handleNextChart, handlePrevChart } = useFocusMode();

  // Chart export (clipboard copy + download)
  const { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg } = useChartCopy();

  // Factor selection (boxplot + pareto)
  const {
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    paretoFactorSelectorRef,
  } = useChartFactors(factors);

  // Panel toggle states
  const [showParetoPanel, setShowParetoPanel] = useState(true);
  const [showParetoComparison, setShowParetoComparison] = useState(false);
  const [showSpecEditor, setShowSpecEditor] = useState(false);

  // Reset Pareto panel on data change
  useEffect(() => {
    setShowParetoPanel(true);
  }, [rawData, factors]);

  // Open spec editor when requested from MobileMenu
  useEffect(() => {
    if (openSpecEditorRequested) {
      setShowSpecEditor(true);
      onSpecEditorOpened?.();
    }
  }, [openSpecEditorRequested, onSpecEditorOpened]);

  // Toggle handlers
  const toggleParetoComparison = useCallback(() => {
    setShowParetoComparison(prev => !prev);
  }, []);

  // Embed mode helpers
  const getHighlightClass = useCallback(
    (chartId: ChartId): string => {
      if (highlightedChart !== chartId) return '';
      return `chart-highlight-${highlightIntensity}`;
    },
    [highlightedChart, highlightIntensity]
  );

  const handleChartWrapperClick = useCallback(
    (chartId: ChartId) => {
      if (onChartClick) {
        onChartClick(chartId);
      }
    },
    [onChartClick]
  );

  // Filter handler with auto-switch to highest variation factor
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
      } else {
        setBoxplotFactor(factor);
        setParetoFactor(factor);
      }
    },
    [applyFilter, factorVariations, setBoxplotFactor, setParetoFactor]
  );

  // Computed: available outcome columns
  const availableOutcomes = useMemo(() => {
    if (rawData.length === 0) return [];
    const row = rawData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [rawData]);

  // Computed: available stage columns
  const availableStageColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    const candidates: string[] = [];
    const columns = Object.keys(rawData[0] || {});

    for (const col of columns) {
      if (col === outcome) continue;

      const uniqueValues = new Set<string>();
      for (const row of rawData) {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          uniqueValues.add(String(val));
        }
        if (uniqueValues.size > 10) break;
      }

      if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
        candidates.push(col);
      }
    }

    return candidates;
  }, [rawData, outcome]);

  // Computed: ANOVA result
  const anovaResult: AnovaResult | null = useMemo(() => {
    if (!outcome || !boxplotFactor || filteredData.length === 0) return null;
    return calculateAnova(filteredData, outcome, boxplotFactor);
  }, [filteredData, outcome, boxplotFactor]);

  // Computed: boxplot data
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

  return {
    // Factor selection
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,

    // Focus mode
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,

    // Panel toggles
    showParetoPanel,
    setShowParetoPanel,
    showParetoComparison,
    toggleParetoComparison,
    showSpecEditor,
    setShowSpecEditor,

    // Chart export
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,

    // Pareto factor selector ref
    paretoFactorSelectorRef,

    // Embed mode helpers
    getHighlightClass,
    handleChartWrapperClick,

    // Computed data
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,

    // Filter navigation state
    filterStack,
    applyFilter,
    navigateTo,
    clearFilters,
    updateFilterValues,
    removeFilter,

    // Variation tracking
    breadcrumbItems,
    cumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,

    // Filter handler
    handleDrillDown,
  };
}

export default useDashboardCharts;
