/**
 * useDashboardCharts - PWA Dashboard chart state management
 *
 * Wraps useDashboardChartsBase with PWA-specific features:
 * - Focus mode (useFocusedChartNav)
 * - Embed mode helpers (highlight class, chart click)
 * - Spec editor + Pareto panel toggles
 * - Variation breadcrumbs
 */

import { useState, useCallback, useEffect } from 'react';
import { useProjectStore, useAnalysisScopeStore } from '@variscout/stores';
import { useFilteredData } from '@variscout/hooks';
import { useStatsWorker } from '../workers/useStatsWorker';
import type { AnovaResult } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';
import { useFilterNavigation, type UseFilterNavigationReturn } from './useFilterNavigation';
import { useDashboardChartsBase } from '@variscout/hooks';
import { useFocusMode } from './useFocusMode';
import type { ChartId } from '@variscout/ui';

export interface UseDashboardChartsProps {
  externalFilterNav?: UseFilterNavigationReturn;
  openSpecEditorRequested?: boolean;
  onSpecEditorOpened?: () => void;
  highlightedChart?: ChartId | null;
  highlightIntensity?: 'pulse' | 'glow' | 'border';
  onChartClick?: (chartId: ChartId) => void;
}

export interface UseDashboardChartsResult {
  boxplotFactor: string;
  setBoxplotFactor: (factor: string) => void;
  paretoFactor: string;
  setParetoFactor: (factor: string) => void;
  /**
   * ER-2: merged candidate factor columns (framing-selected + every other
   * derived/raw column) from useDashboardChartsBase — fed to useFactorStripModel.
   * Re-exposed here (the wrapper spreads `...base`, but the interface must
   * declare it for tsc).
   */
  allFactors: string[];
  focusedChart: ReturnType<typeof useFocusMode>['focusedChart'];
  setFocusedChart: ReturnType<typeof useFocusMode>['setFocusedChart'];
  handleNextChart: () => void;
  handlePrevChart: () => void;
  showParetoPanel: boolean;
  setShowParetoPanel: (show: boolean) => void;
  showParetoComparison: boolean;
  toggleParetoComparison: () => void;
  showSpecEditor: boolean;
  setShowSpecEditor: (show: boolean) => void;
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  handleDownloadSvg: (containerId: string, chartName: string) => void;
  getHighlightClass: (chartId: ChartId) => string;
  handleChartWrapperClick: (chartId: ChartId) => void;
  availableOutcomes: string[];
  availableStageColumns: string[];
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];
  filterStack: UseFilterNavigationReturn['filterStack'];
  applyFilter: UseFilterNavigationReturn['applyFilter'];
  navigateTo: UseFilterNavigationReturn['navigateTo'];
  clearFilters: UseFilterNavigationReturn['clearFilters'];
  updateFilterValues: UseFilterNavigationReturn['updateFilterValues'];
  removeFilter: UseFilterNavigationReturn['removeFilter'];
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
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const rawData = useProjectStore(s => s.rawData);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const { filteredData } = useFilteredData();
  const workerApi = useStatsWorker();

  // Filter navigation — use external if provided, otherwise create local
  const localFilterNav = useFilterNavigation({
    enableHistory: true,
    enableUrlSync: true,
  });
  const filterNav = externalFilterNav ?? localFilterNav;
  const { filterStack, applyFilter, navigateTo, clearFilters, updateFilterValues, removeFilter } =
    filterNav;

  // Base hook — shared composition
  const base = useDashboardChartsBase({
    rawData,
    filteredData,
    outcome,
    factors,
    filterStack,
    displayOptions,
    filterNav,
    workerApi,
  });

  // Mirror the selected boxplot factor into the View-layer analysisScopeStore so
  // downstream surfaces (e.g. What-If) bind to the actually-analyzed factor rather
  // than factors[0]. The base setter owns the local picker state; the PWA has no
  // projectStore.viewState, so this is the only writer (mirrors Azure's viewState
  // write pattern in apps/azure/src/hooks/useDashboardCharts.ts).
  const setBoxplotFactor = useCallback(
    (f: string) => {
      base.setBoxplotFactor(f);
      useAnalysisScopeStore.getState().setBoxplotFactor(f);
    },
    [base.setBoxplotFactor]
  );

  // Focus mode + keyboard navigation
  const { focusedChart, setFocusedChart, handleNextChart, handlePrevChart } = useFocusMode();

  // PWA-specific panel states
  const [showParetoPanel, setShowParetoPanel] = useState(true);
  const [showSpecEditor, setShowSpecEditor] = useState(false);

  // Reset Pareto panel on data change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting panel visibility when data/factors change
    setShowParetoPanel(true);
  }, [rawData, factors]);

  // Open spec editor when requested from header controls
  useEffect(() => {
    if (openSpecEditorRequested) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to external request from header controls
      setShowSpecEditor(true);
      onSpecEditorOpened?.();
    }
  }, [openSpecEditorRequested, onSpecEditorOpened]);

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
      if (onChartClick) onChartClick(chartId);
    },
    [onChartClick]
  );

  return {
    ...base,
    setBoxplotFactor,
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    showParetoPanel,
    setShowParetoPanel,
    showSpecEditor,
    setShowSpecEditor,
    getHighlightClass,
    handleChartWrapperClick,
    filterStack,
    applyFilter,
    navigateTo,
    clearFilters,
    updateFilterValues,
    removeFilter,
  };
}

export default useDashboardCharts;
