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
import { useData } from '../context/DataContext';
import { useStatsWorker } from '../workers/useStatsWorker';
import type { AnovaResult } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';
import { useFilterNavigation, type UseFilterNavigationReturn } from './useFilterNavigation';
import {
  useDashboardChartsBase,
  useVariationTracking,
  type FilterChipData,
} from '@variscout/hooks';
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
  breadcrumbItems: ReturnType<typeof useVariationTracking>['breadcrumbsWithVariation'];
  cumulativeVariationPct: number | null;
  factorVariations: Map<string, number>;
  categoryContributions: Map<string, Map<string | number, number>> | undefined;
  filterChipData: FilterChipData[];
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
  const workerApi = useStatsWorker();

  // Filter navigation — use external if provided, otherwise create local
  const localFilterNav = useFilterNavigation({
    enableHistory: true,
    enableUrlSync: true,
  });
  const filterNav = externalFilterNav ?? localFilterNav;
  const { filterStack, applyFilter, navigateTo, clearFilters, updateFilterValues, removeFilter } =
    filterNav;

  // Breadcrumbs (variation tracking provides these — base hook doesn't expose them)
  const { breadcrumbsWithVariation: breadcrumbItems } = useVariationTracking(
    rawData,
    filterStack,
    outcome,
    factors
  );

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

  // Focus mode + keyboard navigation
  const { focusedChart, setFocusedChart, handleNextChart, handlePrevChart } = useFocusMode();

  // PWA-specific panel states
  const [showParetoPanel, setShowParetoPanel] = useState(true);
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

  // Wrap drill-down to discard return value (PWA doesn't use lastAdvancedFactor)
  const handleDrillDown = useCallback(
    (factor: string, value: string) => {
      base.handleDrillDown(factor, value);
    },
    [base.handleDrillDown]
  );

  return {
    ...base,
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
    breadcrumbItems,
    handleDrillDown,
  };
}

export default useDashboardCharts;
