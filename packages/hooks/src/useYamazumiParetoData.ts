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

/** Row fields needed by category extractors. */
interface RowContext {
  step: string;
  activityType: ReturnType<typeof classifyActivityType>;
  rawType: string;
  activity: string;
  reason: string;
}

/** Mode-dispatched category extractors (ADR-047 pattern). */
const categoryExtractors: Record<YamazumiParetoMode, (ctx: RowContext) => string | null> = {
  'steps-total': ctx => ctx.step || null,
  'steps-waste': ctx => (ctx.step && ctx.activityType === 'waste' ? ctx.step : null),
  'steps-nva': ctx => (ctx.step && ctx.activityType === 'nva-required' ? ctx.step : null),
  activities: ctx => ctx.activity || null,
  reasons: ctx => (ctx.activityType === 'waste' && ctx.reason ? ctx.reason : null),
};

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

    // Aggregate by category based on mode (dispatch resolved once before loop)
    const aggregated = new Map<string, number>();
    const extract = categoryExtractors[mode];

    for (const row of filteredData) {
      const time = toNumericValue(row[cycleTimeColumn]);
      if (time === undefined || time < 0) continue;

      const rawType = String(row[activityTypeColumn] ?? '');
      const activityType = classifyActivityType(rawType);
      const step = String(row[stepColumn] ?? '');
      const activity = activityColumn ? String(row[activityColumn] ?? '') : rawType;
      const reason = reasonColumn ? String(row[reasonColumn] ?? '') : '';

      const key = extract({ step, activityType, rawType, activity, reason });
      if (key) {
        aggregated.set(key, (aggregated.get(key) ?? 0) + time);
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
