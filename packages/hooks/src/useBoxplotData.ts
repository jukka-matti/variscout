import { useMemo } from 'react';
import { group, quantile, ascending, mean, deviation } from 'd3-array';
import { calculateKDE } from '@variscout/core';
import type { BoxplotGroupData } from '@variscout/charts';

/** Pre-computed KDE density data keyed by category */
export type ViolinDataMap = Map<string, Array<{ value: number; count: number }>>;

/** Stage grouping metadata returned when stageColumn is active */
export interface StageInfo {
  /** Ordered unique stage keys (e.g., ['Before', 'After']) */
  stageKeys: string[];
  /** Number of boxes per logical group (= stageKeys.length) */
  groupSize: number;
}

/** Separator between category and stage in composite keys */
export const STAGE_SEPARATOR = ' · ';

export interface UseBoxplotDataResult {
  data: BoxplotGroupData[];
  violinData: ViolinDataMap;
  /** Present when stageColumn is provided */
  stageInfo?: StageInfo;
}

/** Compute boxplot stats for an array of numeric values */
function computeBoxplotGroup(key: string, values: number[]): BoxplotGroupData | null {
  const v = values.filter((val: number) => !isNaN(val)).sort(ascending);
  if (v.length === 0) return null;
  const q1 = quantile(v, 0.25) || 0;
  const med = quantile(v, 0.5) || 0;
  const q3 = quantile(v, 0.75) || 0;
  const iqr = q3 - q1;
  const whiskerMin = Math.max(v[0], q1 - 1.5 * iqr);
  const whiskerMax = Math.min(v[v.length - 1], q3 + 1.5 * iqr);
  const avg = mean(v) || 0;
  const sd = deviation(v) || 0;
  return {
    key,
    q1,
    median: med,
    q3,
    min: whiskerMin,
    max: whiskerMax,
    mean: avg,
    stdDev: sd,
    outliers: v.filter((x: number) => x < whiskerMin || x > whiskerMax),
    values: v,
  };
}

/**
 * Shared hook to compute BoxplotGroupData[] from filtered data.
 * Used by both PWA and Azure Boxplot wrappers.
 *
 * When showViolin is true, also pre-computes KDE density data
 * so the chart component doesn't need to recompute on every render.
 *
 * When stageColumn is provided, creates composite keys like "Station 2 · Before"
 * with interleaved ordering per category.
 */
export function useBoxplotData(
  filteredData: Record<string, unknown>[],
  factor: string,
  outcome: string | null,
  showViolin: boolean = false,
  stageColumn?: string,
  stageOrder?: string[]
): UseBoxplotDataResult {
  const data = useMemo(() => {
    if (!outcome) return [];

    if (stageColumn) {
      // Two-level grouping: factor → stage
      const factorGroups = group(
        filteredData,
        (d: Record<string, unknown>) => d[factor],
        (d: Record<string, unknown>) => d[stageColumn]
      );

      // Determine stage order
      let orderedStages: string[];
      if (stageOrder && stageOrder.length > 0) {
        orderedStages = stageOrder;
      } else {
        // Discover stages in data order
        const stageSet = new Set<string>();
        for (const row of filteredData) {
          const sv = String(row[stageColumn] ?? '');
          if (sv) stageSet.add(sv);
        }
        orderedStages = Array.from(stageSet);
      }

      const result: BoxplotGroupData[] = [];
      const categoryKeys = Array.from(factorGroups.keys());

      for (const catKey of categoryKeys) {
        const stageMap = factorGroups.get(catKey);
        if (!stageMap) continue;

        for (const stage of orderedStages) {
          const rows = stageMap.get(stage);
          if (!rows || rows.length === 0) continue;
          const values = rows.map((d: Record<string, unknown>) => Number(d[outcome]));
          const compositeKey = `${String(catKey)}${STAGE_SEPARATOR}${stage}`;
          const group = computeBoxplotGroup(compositeKey, values);
          if (group) result.push(group);
        }
      }
      return result;
    }

    // Standard single-level grouping
    const groups = group(filteredData, (d: Record<string, unknown>) => d[factor]);
    return Array.from(groups, ([key, groupValues]) => {
      const values = groupValues.map((d: Record<string, unknown>) => Number(d[outcome]));
      return computeBoxplotGroup(String(key), values);
    }).filter((d): d is BoxplotGroupData => d !== null);
  }, [filteredData, factor, outcome, stageColumn, stageOrder]);

  const stageInfo = useMemo((): StageInfo | undefined => {
    if (!stageColumn) return undefined;
    const stageSet = new Set<string>();
    for (const row of filteredData) {
      const sv = String(row[stageColumn] ?? '');
      if (sv) stageSet.add(sv);
    }
    const stageKeys = stageOrder && stageOrder.length > 0 ? stageOrder : Array.from(stageSet);
    return { stageKeys, groupSize: stageKeys.length };
  }, [filteredData, stageColumn, stageOrder]);

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

  return { data, violinData, stageInfo };
}
