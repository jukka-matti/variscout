/**
 * useDashboardCharts - Azure Dashboard chart state management
 *
 * Wraps useDashboardChartsBase with Azure-specific features:
 * - Persistence callbacks for factor changes
 * - Keyboard navigation for focused chart mode
 * - Chart title persistence via DataContext
 * - lastAdvancedFactor visual feedback
 */

import { useState, useCallback, useEffect } from 'react';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from '@variscout/hooks';
import { useStatsWorker } from '../workers/useStatsWorker';
import type { AnovaResult } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';
import { useDashboardChartsBase, useKeyboardNavigation } from '@variscout/hooks';
import type { ViewState } from '@variscout/hooks';
import { useFilterNavigation } from '../hooks';
import type { UseFilterNavigationReturn } from '../hooks';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto', 'histogram', 'probability-plot'] as const;
export type FocusedChart = (typeof CHART_ORDER)[number] | null;

export interface UseDashboardChartsProps {
  externalFilterNav?: UseFilterNavigationReturn;
  initialBoxplotFactor?: string;
  initialParetoFactor?: string;
  /** Report view state changes for persistence (replaces individual factor callbacks) */
  onViewStateChange?: (partial: Partial<ViewState>) => void;
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
  showParetoPanel: boolean;
  setShowParetoPanel: (show: boolean) => void;
  filterStack: UseFilterNavigationReturn['filterStack'];
  applyFilter: UseFilterNavigationReturn['applyFilter'];
  clearFilters: UseFilterNavigationReturn['clearFilters'];
  updateFilterValues: UseFilterNavigationReturn['updateFilterValues'];
  removeFilter: UseFilterNavigationReturn['removeFilter'];
  handleDrillDown: (factor: string, value: string) => void;
  handleChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;
}

export function useDashboardCharts(props?: UseDashboardChartsProps): UseDashboardChartsResult {
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const rawData = useProjectStore(s => s.rawData);
  const chartTitles = useProjectStore(s => s.chartTitles);
  const setChartTitles = useProjectStore(s => s.setChartTitles);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const { filteredData } = useFilteredData();
  const workerApi = useStatsWorker();

  const { initialBoxplotFactor, initialParetoFactor, onViewStateChange } = props ?? {};

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
    workerApi,
  });

  // Wrap factor setters to report changes for persistence
  const setBoxplotFactor = (f: string) => {
    base.setBoxplotFactor(f);
    onViewStateChange?.({ boxplotFactor: f });
  };
  const setParetoFactor = (f: string) => {
    base.setParetoFactor(f);
    onViewStateChange?.({ paretoFactor: f });
  };

  // Pareto panel visibility (reset on data/factor changes)
  const [showParetoPanel, setShowParetoPanel] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting panel visibility when data/factors change
    setShowParetoPanel(true);
  }, [rawData, factors]);

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

  // Chart titles
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...(chartTitles || {}), [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  // Drill-down with visual feedback
  const handleDrillDown = (factor: string, value: string) => {
    base.handleDrillDown(factor, value);
    onViewStateChange?.({ boxplotFactor: factor, paretoFactor: factor });
  };

  return {
    boxplotFactor: base.boxplotFactor,
    setBoxplotFactor,
    paretoFactor: base.paretoFactor,
    setParetoFactor,
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    showParetoPanel,
    setShowParetoPanel,
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
