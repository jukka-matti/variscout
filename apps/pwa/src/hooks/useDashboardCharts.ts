/**
 * useDashboardCharts - Hook for Dashboard chart state management
 *
 * This hook extracts chart-related state and handlers from Dashboard.tsx
 * to reduce the component's complexity and improve testability.
 *
 * Manages:
 * - Factor selection for Boxplot and Pareto charts
 * - Focused chart mode navigation
 * - Pareto panel visibility and comparison toggle
 * - Copy-to-clipboard feedback
 * - Spec editor visibility
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { toBlob } from 'html-to-image';
import { useData } from '../context/DataContext';
import { calculateAnova, type AnovaResult, getNextDrillFactor } from '@variscout/core';
import { calculateBoxplotStats, type BoxplotGroupData } from '@variscout/charts';
import { useFilterNavigation } from './useFilterNavigation';
import { useVariationTracking } from './useVariationTracking';
import type { ChartId } from '@variscout/ui';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;
type FocusedChart = (typeof CHART_ORDER)[number] | null;

export interface UseDashboardChartsProps {
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
  focusedChart: FocusedChart;
  setFocusedChart: (chart: FocusedChart) => void;
  handleNextChart: () => void;
  handlePrevChart: () => void;

  // Panel toggles
  showParetoPanel: boolean;
  setShowParetoPanel: (show: boolean) => void;
  showParetoComparison: boolean;
  toggleParetoComparison: () => void;
  showSpecEditor: boolean;
  setShowSpecEditor: (show: boolean) => void;

  // Copy feedback
  copyFeedback: string | null;
  handleCopyChart: (containerId: string, chartName: string) => Promise<void>;

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
  openSpecEditorRequested,
  onSpecEditorOpened,
  highlightedChart,
  highlightIntensity = 'pulse',
  onChartClick,
}: UseDashboardChartsProps = {}): UseDashboardChartsResult {
  const { outcome, factors, rawData, filteredData } = useData();

  // Filter navigation
  const { filterStack, applyFilter, navigateTo, clearFilters, updateFilterValues, removeFilter } =
    useFilterNavigation({
      enableHistory: true,
      enableUrlSync: true,
    });

  // Variation tracking
  const {
    breadcrumbsWithVariation: breadcrumbItems,
    cumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,
  } = useVariationTracking(rawData, filterStack, outcome, factors);

  // Factor selection state
  const [boxplotFactor, setBoxplotFactor] = useState<string>('');
  const [paretoFactor, setParetoFactor] = useState<string>('');

  // Focus mode state
  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);

  // Panel toggle states
  const [showParetoPanel, setShowParetoPanel] = useState(true);
  const [showParetoComparison, setShowParetoComparison] = useState(false);
  const [showSpecEditor, setShowSpecEditor] = useState(false);

  // Copy feedback state
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pareto factor selector ref
  const paretoFactorSelectorRef = useRef<HTMLSelectElement>(null);

  // Initialize factors when they change
  useEffect(() => {
    if (factors.length > 0) {
      setBoxplotFactor(prev => (!prev || !factors.includes(prev) ? factors[0] : prev));
      setParetoFactor(prev => (!prev || !factors.includes(prev) ? factors[1] || factors[0] : prev));
    }
  }, [factors]);

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

  // Cleanup copy feedback timeout
  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  // Chart navigation handlers
  const handleNextChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current);
      const nextIndex = (index + 1) % CHART_ORDER.length;
      return CHART_ORDER[nextIndex];
    });
  }, []);

  const handlePrevChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current);
      const prevIndex = (index - 1 + CHART_ORDER.length) % CHART_ORDER.length;
      return CHART_ORDER[prevIndex];
    });
  }, []);

  // Toggle handlers
  const toggleParetoComparison = useCallback(() => {
    setShowParetoComparison(prev => !prev);
  }, []);

  // Copy chart to clipboard
  const handleCopyChart = useCallback(async (containerId: string, chartName: string) => {
    const node = document.getElementById(containerId);
    if (!node) return;

    try {
      const blob = await toBlob(node, {
        cacheBust: true,
        backgroundColor: '#0f172a',
      });
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopyFeedback(chartName);
        if (copyFeedbackTimeoutRef.current) {
          clearTimeout(copyFeedbackTimeoutRef.current);
        }
        copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy chart', err);
    }
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
    [applyFilter, factorVariations]
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

    return Array.from(groups.entries())
      .map(([group, values]) => calculateBoxplotStats({ group, values }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredData, outcome, boxplotFactor]);

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

    // Copy feedback
    copyFeedback,
    handleCopyChart,

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
