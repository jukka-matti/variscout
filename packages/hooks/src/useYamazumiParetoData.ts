/**
 * useYamazumiParetoData - Compute Pareto data for Yamazumi mode
 *
 * Supports 5 modes: steps-total, steps-waste, steps-nva, activities, reasons.
 * Produces ParetoDataPoint[] for the existing ParetoChart component.
 */
import { useMemo } from 'react';
import type {
  DataRow,
  ParetoDataPoint,
  YamazumiColumnMapping,
  YamazumiParetoMode,
} from '@variscout/core';
import { toNumericValue, classifyActivityType } from '@variscout/core';

export interface UseYamazumiParetoDataOptions {
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Column role mapping */
  mapping: YamazumiColumnMapping | null;
  /** Pareto ranking mode */
  mode: YamazumiParetoMode;
}

export interface UseYamazumiParetoDataReturn {
  /** Sorted Pareto data with cumulative percentages */
  data: ParetoDataPoint[];
  /** Total value across all categories */
  totalCount: number;
}

/**
 * Compute Pareto data for Yamazumi mode.
 * Each mode aggregates differently but produces the same ParetoDataPoint[] format.
 */
export function useYamazumiParetoData({
  filteredData,
  mapping,
  mode,
}: UseYamazumiParetoDataOptions): UseYamazumiParetoDataReturn {
  return useMemo(() => {
    if (!mapping) return { data: [], totalCount: 0 };

    const { stepColumn, activityTypeColumn, cycleTimeColumn, activityColumn, reasonColumn } =
      mapping;

    // Aggregate by category based on mode
    const aggregated = new Map<string, number>();

    for (const row of filteredData) {
      const time = toNumericValue(row[cycleTimeColumn]);
      if (time === undefined || time < 0) continue;

      const rawType = String(row[activityTypeColumn] ?? '');
      const activityType = classifyActivityType(rawType);
      const step = String(row[stepColumn] ?? '');

      switch (mode) {
        case 'steps-total': {
          if (!step) break;
          aggregated.set(step, (aggregated.get(step) ?? 0) + time);
          break;
        }
        case 'steps-waste': {
          if (!step || activityType !== 'waste') break;
          aggregated.set(step, (aggregated.get(step) ?? 0) + time);
          break;
        }
        case 'steps-nva': {
          if (!step || activityType !== 'nva-required') break;
          aggregated.set(step, (aggregated.get(step) ?? 0) + time);
          break;
        }
        case 'activities': {
          const activity = activityColumn ? String(row[activityColumn] ?? '') : rawType;
          if (!activity) break;
          aggregated.set(activity, (aggregated.get(activity) ?? 0) + time);
          break;
        }
        case 'reasons': {
          if (activityType !== 'waste') break;
          const reason = reasonColumn ? String(row[reasonColumn] ?? '') : '';
          if (!reason) break;
          aggregated.set(reason, (aggregated.get(reason) ?? 0) + time);
          break;
        }
      }
    }

    // Sort descending by value
    const sorted = Array.from(aggregated.entries()).sort((a, b) => b[1] - a[1]);

    const totalCount = sorted.reduce((sum, [, v]) => sum + v, 0);

    // Build ParetoDataPoint[] with cumulative percentages
    let cumulative = 0;
    const data: ParetoDataPoint[] = sorted.map(([key, value]) => {
      cumulative += value;
      return {
        key,
        value,
        cumulative,
        cumulativePercentage: totalCount > 0 ? (cumulative / totalCount) * 100 : 0,
      };
    });

    return { data, totalCount };
  }, [filteredData, mapping, mode]);
}
