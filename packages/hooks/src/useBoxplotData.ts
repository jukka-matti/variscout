import { useMemo } from 'react';
import { group, quantile, ascending, mean } from 'd3-array';
import { calculateKDE } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';

/** Pre-computed KDE density data keyed by category */
export type ViolinDataMap = Map<string, Array<{ value: number; count: number }>>;

export interface UseBoxplotDataResult {
  data: BoxplotGroupData[];
  violinData: ViolinDataMap;
}

/**
 * Shared hook to compute BoxplotGroupData[] from filtered data.
 * Used by both PWA and Azure Boxplot wrappers.
 *
 * When showViolin is true, also pre-computes KDE density data
 * so the chart component doesn't need to recompute on every render.
 */
export function useBoxplotData(
  filteredData: Record<string, unknown>[],
  factor: string,
  outcome: string | null,
  showViolin: boolean = false
): UseBoxplotDataResult {
  const data = useMemo(() => {
    if (!outcome) return [];
    const groups = group(filteredData, (d: Record<string, unknown>) => d[factor]);
    return Array.from(groups, ([key, groupValues]) => {
      const v = groupValues
        .map((d: Record<string, unknown>) => Number(d[outcome]))
        .filter((val: number) => !isNaN(val))
        .sort(ascending);
      if (v.length === 0) return null;
      const q1 = quantile(v, 0.25) || 0;
      const median = quantile(v, 0.5) || 0;
      const q3 = quantile(v, 0.75) || 0;
      const iqr = q3 - q1;
      const whiskerMin = Math.max(v[0], q1 - 1.5 * iqr);
      const whiskerMax = Math.min(v[v.length - 1], q3 + 1.5 * iqr);
      const avg = mean(v) || 0;
      return {
        key: String(key),
        q1,
        median,
        q3,
        min: whiskerMin,
        max: whiskerMax,
        mean: avg,
        outliers: v.filter((x: number) => x < whiskerMin || x > whiskerMax),
        values: v,
      };
    }).filter((d): d is BoxplotGroupData => d !== null);
  }, [filteredData, factor, outcome]);

  const violinData = useMemo(() => {
    if (!showViolin || data.length === 0) {
      return new Map<string, Array<{ value: number; count: number }>>();
    }
    const map = new Map<string, Array<{ value: number; count: number }>>();
    for (const d of data) {
      if (d.values.length >= 2) {
        map.set(d.key, calculateKDE(d.values));
      }
    }
    return map;
  }, [data, showViolin]);

  return { data, violinData };
}
