/**
 * useYamazumiIChartData - Transform raw data into I-Chart data points for Yamazumi mode
 *
 * Groups rows by unit/product, sums selected metric's time per unit,
 * and produces IChartDataPoint[] for the existing IChart component.
 */
import { useMemo } from 'react';
import type {
  DataRow,
  IChartDataPoint,
  YamazumiColumnMapping,
  YamazumiIChartMetric,
} from '@variscout/core';
import { toNumericValue, classifyActivityType } from '@variscout/core';

export interface UseYamazumiIChartDataOptions {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Column role mapping */
  mapping: YamazumiColumnMapping | null;
  /** Which metric to display on the I-Chart */
  metric: YamazumiIChartMetric;
}

/**
 * Map YamazumiIChartMetric to the activity types to include.
 * 'total' includes all types.
 */
function getIncludedTypes(metric: YamazumiIChartMetric): Set<string> | null {
  switch (metric) {
    case 'total':
      return null; // include all
    case 'va':
      return new Set(['va']);
    case 'nva':
      return new Set(['nva-required']);
    case 'waste':
      return new Set(['waste']);
    case 'wait':
      return new Set(['wait']);
  }
}

/**
 * Compute I-Chart data points for Yamazumi mode.
 *
 * Groups rows by step, sums time for the selected metric,
 * and returns one data point per step (ordered by first appearance).
 */
export function useYamazumiIChartData({
  filteredData,
  mapping,
  metric,
}: UseYamazumiIChartDataOptions): IChartDataPoint[] {
  return useMemo(() => {
    if (!mapping) return [];

    const { stepColumn, activityTypeColumn, cycleTimeColumn } = mapping;
    const includedTypes = getIncludedTypes(metric);

    // Group by step, preserving order
    const stepTotals = new Map<string, number>();

    for (const row of filteredData) {
      const step = String(row[stepColumn] ?? '');
      if (!step) continue;

      const time = toNumericValue(row[cycleTimeColumn]);
      if (time === undefined || time < 0) continue;

      const rawType = String(row[activityTypeColumn] ?? '');
      const activityType = classifyActivityType(rawType);

      // Filter by metric
      if (includedTypes && !includedTypes.has(activityType)) continue;

      const current = stepTotals.get(step) ?? 0;
      stepTotals.set(step, current + time);
    }

    // Convert to IChartDataPoint[]
    const points: IChartDataPoint[] = [];
    let index = 0;
    for (const [step, total] of stepTotals) {
      points.push({
        x: index,
        y: total,
        originalIndex: index,
        stage: step,
      });
      index++;
    }

    return points;
  }, [filteredData, mapping, metric]);
}
