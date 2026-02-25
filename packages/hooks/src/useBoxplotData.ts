import { useMemo } from 'react';
import { group, quantile, ascending, mean } from 'd3-array';
import type { BoxplotGroupData } from '@variscout/charts';

/**
 * Shared hook to compute BoxplotGroupData[] from filtered data.
 * Used by both PWA and Azure Boxplot wrappers.
 */
export function useBoxplotData(
  filteredData: Record<string, unknown>[],
  factor: string,
  outcome: string | null
): BoxplotGroupData[] {
  return useMemo(() => {
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
}
