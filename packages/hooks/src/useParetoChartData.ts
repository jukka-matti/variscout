/**
 * useParetoChartData - Shared data pipeline for ParetoChart wrappers
 *
 * Extracts the identical ~120-line data pipeline from both PWA and Azure
 * ParetoChart wrappers:
 * - hasActiveFilters: check if any filters are active
 * - comparisonData: full population percentages for ghost bars
 * - { data, totalCount }: Pareto data from filtered data or separate file
 * - ghostBarData: comparison percentages converted to expected values
 * - categoryPositions: pixel positions for annotation layer
 */
import { useMemo } from 'react';
import { rollup, sum } from 'd3-array';
import { getResponsiveMargins, applyTimeLens } from '@variscout/core';
import type { ParetoDataPoint } from '@variscout/core';
import type { DataRow, DataCellValue, ParetoRow } from '@variscout/core';
import type { ParetoYMetricId, ComputeParetoYContext } from '@variscout/core/pareto';
import { computeParetoY, PARETO_Y_METRICS } from '@variscout/core/pareto';
import { usePreferencesStore } from '@variscout/stores';

/** Maximum categories before aggregating remaining into "Others" */
export const PARETO_MAX_CATEGORIES = 20;

export interface UseParetoChartDataOptions {
  /** Full unfiltered data (for comparison ghost bars) */
  rawData: DataRow[];
  /** Currently filtered data */
  filteredData: DataRow[];
  /** Factor column name */
  factor: string;
  /** Outcome column name */
  outcome: string | null;
  /** Aggregation mode: count occurrences or sum values */
  aggregation: 'count' | 'value';
  /** Whether to show ghost bar comparison */
  showComparison: boolean;
  /** Pareto data mode: 'derived' from main data or 'separate' file */
  paretoMode: string | null;
  /** Separately uploaded Pareto data */
  separateParetoData: ParetoRow[] | null;
  /** Active filters record */
  filters: Record<string, (string | number)[]>;
  /** Chart container width in pixels */
  parentWidth: number;
  /** Maximum categories before aggregating into "Others" (default: 20) */
  maxCategories?: number;
  /**
   * Optional Y-axis metric id. When provided AND not `'count'`, the hook
   * groups `filteredData` by `factor` and computes the Y value per group via
   * `computeParetoY(yMetric, rowsForGroup, yMetricContext)`. When omitted or
   * set to `'count'`, the legacy `aggregation` field controls behavior.
   *
   * Caller is responsible for supplying `yMetricContext` with the columns / spec
   * required by the chosen metric. See `ComputeParetoYContext`.
   *
   * If `computeParetoY` throws (e.g., metric requires a column not provided in
   * context), the error propagates — failing loud surfaces misconfiguration in dev.
   *
   * **`yMetricContext` is an object** — callers MUST provide a stable reference
   * (memoize with `useMemo` upstream). The hook adds it directly to the
   * dependency array without deep comparison.
   *
   * Note: when `usingSeparateData` is true, `yMetric` is ignored. The separate
   * Pareto file already encodes its own values (`row.value`/`row.count`); the
   * dispatch path is for `filteredData` only.
   */
  yMetric?: ParetoYMetricId;
  /**
   * Context fields required by `computeParetoY` for non-`count` metrics.
   * Caller assembles this from the active mode strategy + Hub config.
   * Ignored when `yMetric` is undefined or `'count'`, or when using separate
   * Pareto data.
   */
  yMetricContext?: ComputeParetoYContext;
}

export interface UseParetoChartDataResult {
  /** Whether separate Pareto data is being used */
  usingSeparateData: boolean;
  /** Whether any filters are currently active */
  hasActiveFilters: boolean;
  /** Sorted Pareto data with cumulative percentages */
  data: ParetoDataPoint[];
  /** Total count/sum across all categories */
  totalCount: number;
  /** Full population percentages for comparison (ghost bars) */
  comparisonData: Map<string, number> | undefined;
  /** Expected values at filtered scale (for ghost bar rendering) */
  ghostBarData: Map<string, number> | undefined;
  /** Pixel positions for annotation layer anchoring */
  categoryPositions: Map<string, { x: number; y: number }>;
  /** True when every category has exactly 1 row (pre-aggregated data signal) */
  allSingleRow: boolean;
  /** True when data was truncated and "Others" bucket was added */
  hasOthers: boolean;
  /** Original category count before truncation */
  originalCategoryCount: number;
}

export function useParetoChartData({
  rawData,
  filteredData,
  factor,
  outcome,
  aggregation,
  showComparison,
  paretoMode,
  separateParetoData,
  filters,
  parentWidth,
  maxCategories = PARETO_MAX_CATEGORIES,
  yMetric,
  yMetricContext,
}: UseParetoChartDataOptions): UseParetoChartDataResult {
  const timeLens = usePreferencesStore(s => s.timeLens);

  // Apply lens to filteredData only — rawData stays as the full comparison baseline.
  const lensedFilteredData = useMemo(
    // timeColumn unused in current applyTimeLens (rows pre-sorted upstream); see Task 2 docstring.
    () => applyTimeLens(filteredData, timeLens, ''),
    [filteredData, timeLens]
  );

  // Determine if using separate Pareto data
  const usingSeparateData =
    paretoMode === 'separate' && !!separateParetoData && separateParetoData.length > 0;

  // Check if any filters are active (for comparison feature)
  const hasActiveFilters = useMemo(() => {
    if (!filters) return false;
    return Object.values(filters).some(values => values && values.length > 0);
  }, [filters]);

  // Calculate full population data for ghost bars comparison
  const comparisonData = useMemo(() => {
    if (!showComparison || !hasActiveFilters || usingSeparateData || rawData.length === 0) {
      return undefined;
    }

    const fullCounts = rollup(
      rawData,
      (v: DataRow[]) => v.length,
      (d: DataRow) => d[factor]
    );
    const fullTotal = rawData.length;

    const percentageMap = new Map<string, number>();
    for (const [key, count] of fullCounts) {
      percentageMap.set(key as string, ((count as number) / fullTotal) * 100);
    }
    return percentageMap;
  }, [showComparison, hasActiveFilters, usingSeparateData, rawData, factor]);

  // Compute Pareto data from filtered data or separate file
  const { data, totalCount, originalCount } = useMemo(() => {
    let sorted: { key: string; value: number }[];

    if (usingSeparateData && separateParetoData) {
      // Separate Pareto file already encodes its own values — ignore yMetric here.
      sorted = separateParetoData
        .map(row => ({
          key: row.category,
          value: aggregation === 'value' && row.value !== undefined ? row.value : row.count,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (!usingSeparateData && yMetric !== undefined && yMetric !== 'count') {
      // yMetric dispatch path: group filteredData by factor, compute Y per group
      // via computeParetoY. Errors propagate (failing loud surfaces misconfiguration).
      const grouped = rollup(
        lensedFilteredData,
        (rows: DataRow[]) => computeParetoY(yMetric, rows, yMetricContext ?? {}),
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(grouped, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      }));

      // Honor smallerIsWorse: ascending sort puts worst (smallest) first so the
      // biggest capability gap / most critical group appears at the left of the chart.
      const metric = PARETO_Y_METRICS[yMetric];
      if (metric.smallerIsWorse) {
        sorted.sort((a, b) => a.value - b.value);
      } else {
        sorted.sort((a, b) => b.value - a.value);
      }
    } else if (aggregation === 'value' && outcome) {
      const sums = rollup(
        lensedFilteredData,
        (rows: DataRow[]) => sum(rows, (d: DataRow) => Number(d[outcome]) || 0),
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(sums, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      })).sort((a, b) => b.value - a.value);
    } else {
      const counts = rollup(
        lensedFilteredData,
        (v: DataRow[]) => v.length,
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(counts, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      })).sort((a, b) => b.value - a.value);
    }

    // Aggregate into "Others" if too many categories
    const originalCount = sorted.length;
    let truncated = sorted;
    if (sorted.length > maxCategories) {
      const top = sorted.slice(0, maxCategories);
      const othersValue = sum(sorted.slice(maxCategories), d => d.value);
      truncated = [...top, { key: 'Others', value: othersValue }];
    }

    const total = sum(truncated, d => d.value);
    // Build cumulative sums via reduce (immutable — avoids react-hooks/immutability warning)
    const withCumulative: ParetoDataPoint[] = truncated.reduce<ParetoDataPoint[]>((acc, d) => {
      const cumulative = (acc.length > 0 ? acc[acc.length - 1].cumulative : 0) + d.value;
      acc.push({ ...d, cumulative, cumulativePercentage: (cumulative / total) * 100 });
      return acc;
    }, []);

    return { data: withCumulative, totalCount: total, originalCount };
  }, [
    lensedFilteredData,
    factor,
    aggregation,
    outcome,
    usingSeparateData,
    separateParetoData,
    maxCategories,
    yMetric,
    yMetricContext,
  ]);

  // Convert comparison percentages to expected values (same scale as bars)
  const ghostBarData = useMemo(() => {
    if (!comparisonData || totalCount === 0) return undefined;
    const expectedValues = new Map<string, number>();
    for (const [key, pct] of comparisonData) {
      expectedValues.set(key, (totalCount * pct) / 100);
    }
    return expectedValues;
  }, [comparisonData, totalCount]);

  // Compute category positions for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (data.length === 0 || parentWidth === 0) return positions;

    const margin = getResponsiveMargins(parentWidth, 'pareto');
    const chartWidth = parentWidth - margin.left - margin.right;
    const padding = 0.2;
    const step = chartWidth / data.length;
    const bandwidth = step * (1 - padding);
    const offset = (step * padding) / 2;

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const x = margin.left + i * step + offset + bandwidth / 2;
      const y = margin.top;
      positions.set(d.key, { x, y });
    }
    return positions;
  }, [data, parentWidth]);

  // Detect pre-aggregated data: every category has exactly 1 row in count mode
  const allSingleRow = useMemo(() => {
    if (usingSeparateData || aggregation !== 'count' || data.length < 2) return false;
    return data.every(d => d.value === 1);
  }, [usingSeparateData, aggregation, data]);

  return {
    usingSeparateData,
    hasActiveFilters,
    data,
    totalCount,
    comparisonData,
    ghostBarData,
    categoryPositions,
    allSingleRow,
    hasOthers: originalCount > maxCategories,
    originalCategoryCount: originalCount,
  };
}
