/**
 * useDashboardChartsBase - Shared composition hook for dashboard chart state
 *
 * Extracts common logic from PWA and Azure useDashboardCharts hooks:
 * - Factor state management (boxplot + pareto) with initialization
 * - useDashboardComputedData composition
 * - useChartCopy composition
 * - Pareto comparison toggle
 * - handleDrillDown
 *
 * App wrappers add: focus mode, embed mode, persistence, keyboard nav, chart titles.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { DataRow, AnovaResult, FilterAction, StatsWorkerAPI } from '@variscout/core';
import type { DisplayOptions } from './types';
import type { BoxplotGroupData } from '@variscout/core';
import { useDashboardComputedData } from './useDashboardComputedData';
import { useChartCopy, type UseChartCopyOptions, type UseChartCopyReturn } from './useChartCopy';
import type { UseFilterNavigationReturn } from './useFilterNavigation';
import { buildFactorList } from './factorListUtils';

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
  /**
   * G1 Task 4: derived categorical columns from the active ImprovementProject.
   * Keys are derived column names (e.g. `Order_Date.day-of-week`, `Reactor_temp_bin`).
   * When present, these columns are merged into the factor picker list (raw factors first,
   * then derived in column-name sort order, deduplicated by name) AND threaded into
   * `useDashboardComputedData` so the stats-summary boxplot data + ANOVA see populated
   * groups when the chosen factor is a derived column.
   *
   * ALIGNMENT INVARIANT (G1 Task 4 follow-up): values MUST be parallel to `filteredData`,
   * i.e. `categoricalValuesByColumn[col][i]` is the derived value for `filteredData[i]`.
   * The caller is responsible for projecting any rawData-aligned channel via
   * `filterCategoricalValuesByColumn` at the `useFilteredData` boundary before passing
   * it in. The picker list itself only reads `Object.keys`, so the projection is only
   * required by the row-augmentation paths — but the contract is filtered-aligned for
   * the whole prop to keep one mental model.
   *
   * Backward compat: absent or empty → identical factor list + identical stats to before.
   */
  categoricalValuesByColumn?: Record<string, (string | null)[]>;
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

  // Drill handler
  handleDrillDown: (factor: string, value: string) => void;
}

export function useDashboardChartsBase({
  rawData,
  filteredData,
  outcome,
  factors,
  displayOptions,
  filterNav,
  chartCopyOptions,
  initialBoxplotFactor,
  initialParetoFactor,
  workerApi,
  categoricalValuesByColumn,
}: UseDashboardChartsBaseOptions): UseDashboardChartsBaseResult {
  // ── Merged factor list (raw + derived) ────────────────────────────────
  // G1 Task 4: merge derived categorical columns from the active IP into
  // the factor picker list. Raw factors first, then derived in column-name
  // sort order, deduplicated by name.
  const allFactors = useMemo(
    () => buildFactorList(factors, categoricalValuesByColumn),
    [factors, categoricalValuesByColumn]
  );

  // ── Factor state ──────────────────────────────────────────────────────
  const [boxplotFactor, setBoxplotFactor] = useState<string>(initialBoxplotFactor ?? '');
  const [paretoFactor, setParetoFactor] = useState<string>(initialParetoFactor ?? '');

  // Sync factors when available factors change (initialization + invalid factor reset)
  useEffect(() => {
    if (allFactors.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing factor selection when available factors change (column mapping change)
      setBoxplotFactor(prev => (!prev || !allFactors.includes(prev) ? allFactors[0] : prev));

      setParetoFactor(prev =>
        !prev || !allFactors.includes(prev) ? allFactors[1] || allFactors[0] : prev
      );
    }
  }, [allFactors]);

  // ── Computed data ─────────────────────────────────────────────────────
  // G1 Task 4 follow-up: thread the (filtered-aligned) derived-column channel
  // into useDashboardComputedData so that ANOVA + boxplot stats see populated
  // groups when boxplotFactor is a derived column (e.g. Reactor_temp_bin).
  // Without this, the stats summary table / PI Panel / ANOVA showed empty
  // groups while the chart itself rendered correctly.
  const { availableOutcomes, availableStageColumns, anovaResult, boxplotData } =
    useDashboardComputedData({
      rawData,
      filteredData,
      outcome,
      boxplotFactor,
      boxplotSortBy: displayOptions.boxplotSortBy,
      boxplotSortDirection: displayOptions.boxplotSortDirection,
      workerApi,
      categoricalValuesByColumn,
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
    (factor: string, value: string): void => {
      filterNav.applyFilter({
        type: 'filter',
        source: 'boxplot',
        factor,
        values: [value],
      });

      // Keep the same factor after drill (no auto-advance without variation data)
      setBoxplotFactor(factor);
      setParetoFactor(factor);
    },
    [filterNav]
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
    handleDrillDown,
  };
}
