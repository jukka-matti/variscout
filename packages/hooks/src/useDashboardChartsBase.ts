/**
 * useDashboardChartsBase - Shared composition hook for dashboard chart state
 *
 * Extracts common logic from PWA and Azure useDashboardCharts hooks:
 * - Factor state management (boxplot + pareto) with initialization
 * - useVariationTracking composition
 * - useDashboardComputedData composition
 * - useChartCopy composition
 * - Pareto comparison toggle
 * - handleDrillDown with auto-advance to highest-variation factor
 *
 * App wrappers add: focus mode, embed mode, persistence, keyboard nav, chart titles.
 */

import { useState, useCallback, useEffect } from 'react';
import type { DataRow, AnovaResult, FilterAction, StatsWorkerAPI } from '@variscout/core';
import { getNextDrillFactor } from '@variscout/core';
import type { DisplayOptions } from './types';
import type { BoxplotGroupData } from '@variscout/core';
import { useVariationTracking, type FilterChipData } from './useVariationTracking';
import { useDashboardComputedData } from './useDashboardComputedData';
import { useChartCopy, type UseChartCopyOptions, type UseChartCopyReturn } from './useChartCopy';
import type { UseFilterNavigationReturn } from './useFilterNavigation';

export interface UseDashboardChartsBaseOptions {
  /** Raw (unfiltered) data rows */
  rawData: DataRow[];
  /** Currently filtered data rows */
  filteredData: DataRow[];
  /** Selected outcome column name */
  outcome: string | null;
  /** Available factor column names */
  factors: string[];
  /** Current filter stack */
  filterStack: FilterAction[];
  /** Display options (for boxplot sort settings) */
  displayOptions: DisplayOptions;
  /** Filter navigation methods (resolved by app — external or local) */
  filterNav: Pick<UseFilterNavigationReturn, 'applyFilter'>;
  /** Chart copy options (e.g. theme-aware background color) */
  chartCopyOptions?: UseChartCopyOptions;
  /** Initial boxplot factor (from persisted view state) */
  initialBoxplotFactor?: string;
  /** Initial pareto factor (from persisted view state) */
  initialParetoFactor?: string;
  /** Worker API for off-thread ANOVA computation */
  workerApi?: StatsWorkerAPI | null;
}

export interface UseDashboardChartsBaseResult {
  // Factor selection
  boxplotFactor: string;
  setBoxplotFactor: (f: string) => void;
  paretoFactor: string;
  setParetoFactor: (f: string) => void;

  // Pareto comparison
  showParetoComparison: boolean;
  setShowParetoComparison: (v: boolean) => void;
  toggleParetoComparison: () => void;

  // Chart export
  copyFeedback: UseChartCopyReturn['copyFeedback'];
  handleCopyChart: UseChartCopyReturn['handleCopyChart'];
  handleDownloadPng: UseChartCopyReturn['handleDownloadPng'];
  handleDownloadSvg: UseChartCopyReturn['handleDownloadSvg'];

  // Computed data
  availableOutcomes: string[];
  availableStageColumns: string[];
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];

  // Variation tracking
  cumulativeVariationPct: number | null;
  factorVariations: Map<string, number>;
  categoryContributions: Map<string, Map<string | number, number>> | undefined;
  filterChipData: FilterChipData[];

  // Drill handler — returns the next advanced factor name (or null)
  handleDrillDown: (factor: string, value: string) => string | null;
}

export function useDashboardChartsBase({
  rawData,
  filteredData,
  outcome,
  factors,
  filterStack,
  displayOptions,
  filterNav,
  chartCopyOptions,
  initialBoxplotFactor,
  initialParetoFactor,
  workerApi,
}: UseDashboardChartsBaseOptions): UseDashboardChartsBaseResult {
  // ── Factor state ──────────────────────────────────────────────────────
  const [boxplotFactor, setBoxplotFactor] = useState<string>(initialBoxplotFactor ?? '');
  const [paretoFactor, setParetoFactor] = useState<string>(initialParetoFactor ?? '');

  // Sync factors when available factors change (initialization + invalid factor reset)
  useEffect(() => {
    if (factors.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing factor selection when available factors change (column mapping change)
      setBoxplotFactor(prev => (!prev || !factors.includes(prev) ? factors[0] : prev));

      setParetoFactor(prev => (!prev || !factors.includes(prev) ? factors[1] || factors[0] : prev));
    }
  }, [factors]);

  // ── Variation tracking ────────────────────────────────────────────────
  const { cumulativeVariationPct, factorVariations, categoryContributions, filterChipData } =
    useVariationTracking(rawData, filterStack, outcome, factors);

  // ── Computed data ─────────────────────────────────────────────────────
  const { availableOutcomes, availableStageColumns, anovaResult, boxplotData } =
    useDashboardComputedData({
      rawData,
      filteredData,
      outcome,
      boxplotFactor,
      boxplotSortBy: displayOptions.boxplotSortBy,
      boxplotSortDirection: displayOptions.boxplotSortDirection,
      workerApi,
    });

  // ── Chart export ──────────────────────────────────────────────────────
  const { copyFeedback, handleCopyChart, handleDownloadPng, handleDownloadSvg } =
    useChartCopy(chartCopyOptions);

  // ── Pareto comparison ─────────────────────────────────────────────────
  const [showParetoComparison, setShowParetoComparison] = useState(false);
  const toggleParetoComparison = useCallback(() => {
    setShowParetoComparison(prev => !prev);
  }, []);

  // ── Drill-down handler ────────────────────────────────────────────────
  const handleDrillDown = useCallback(
    (factor: string, value: string): string | null => {
      filterNav.applyFilter({
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
      return nextFactor;
    },
    [filterNav, factorVariations]
  );

  return {
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    showParetoComparison,
    setShowParetoComparison,
    toggleParetoComparison,
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    cumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,
    handleDrillDown,
  };
}
