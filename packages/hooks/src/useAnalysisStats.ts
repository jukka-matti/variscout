/**
 * useAnalysisStats — Derived hook: computes stats from filtered data via Web Worker.
 *
 * Reads filteredData from useFilteredData, outcome + specs from projectStore,
 * delegates heavy computation to useAsyncStats (Web Worker with sync fallback).
 */

import { useMemo } from 'react';
import type { StatsResult, StatsWorkerAPI } from '@variscout/core';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from './useFilteredData';
import { useAsyncStats } from './useAsyncStats';

export interface AnalysisStatsResult {
  stats: StatsResult | null;
  kde: { value: number; count: number }[] | null;
  isComputing: boolean;
}

export function useAnalysisStats(workerApi?: StatsWorkerAPI | null): AnalysisStatsResult {
  const { filteredData } = useFilteredData();
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);

  // Extract numeric values (memoized to prevent unnecessary Worker calls)
  const values = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData
      .map(d => {
        const v = d[outcome];
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v));
  }, [filteredData, outcome]);

  return useAsyncStats({
    values,
    specs,
    workerApi: workerApi ?? null,
  });
}
