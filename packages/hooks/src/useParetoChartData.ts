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
import { getResponsiveMargins } from '@variscout/core';
import type { ParetoDataPoint } from '@variscout/core';
import type { DataRow, DataCellValue, ParetoRow } from '@variscout/core';

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
}: UseParetoChartDataOptions): UseParetoChartDataResult {
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
  const { data, totalCount } = useMemo(() => {
    let sorted: { key: string; value: number }[];

    if (usingSeparateData && separateParetoData) {
      sorted = separateParetoData
        .map(row => ({
          key: row.category,
          value: aggregation === 'value' && row.value !== undefined ? row.value : row.count,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (aggregation === 'value' && outcome) {
      const sums = rollup(
        filteredData,
        (rows: DataRow[]) => sum(rows, (d: DataRow) => Number(d[outcome]) || 0),
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(sums, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      })).sort((a, b) => b.value - a.value);
    } else {
      const counts = rollup(
        filteredData,
        (v: DataRow[]) => v.length,
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(counts, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      })).sort((a, b) => b.value - a.value);
    }

    const total = sum(sorted, d => d.value);
    let cumulative = 0;
    const withCumulative: ParetoDataPoint[] = sorted.map(d => {
      cumulative += d.value;
      return { ...d, cumulative, cumulativePercentage: (cumulative / total) * 100 };
    });

    return { data: withCumulative, totalCount: total };
  }, [filteredData, factor, aggregation, outcome, usingSeparateData, separateParetoData]);

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
  };
}
