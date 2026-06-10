/**
 * useStagedAnalysis — Derived hook: computes staged data and per-stage stats.
 *
 * Active when stageColumn is set. Sorts filteredData by stage order and
 * computes per-stage stats (mean/sigma/n per stage value).
 */

import { useMemo } from 'react';
import {
  calculateStatsByStage,
  sortDataByStage,
  determineStageOrder,
  type DataRow,
  type StagedStatsResult,
} from '@variscout/core';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData } from './useFilteredData';

export interface StagedAnalysisResult {
  stagedData: DataRow[];
  stagedStats: StagedStatsResult | null;
}

export function useStagedAnalysis(): StagedAnalysisResult {
  const { filteredData } = useFilteredData();
  const outcome = useProjectStore(s => s.outcome);
  const stageColumn = useProjectStore(s => s.stageColumn);
  const stageOrderMode = useProjectStore(s => s.stageOrderMode);
  const specs = useProjectStore(s => s.specs);

  // Hoist stage resolution so both memos share the same computed order.
  const resolvedStageOrder = useMemo(() => {
    if (!stageColumn || filteredData.length === 0) return [];
    const stageValues = filteredData.map(row => String(row[stageColumn] ?? ''));
    return determineStageOrder(stageValues, stageOrderMode);
  }, [filteredData, stageColumn, stageOrderMode]);

  const stagedData = useMemo(() => {
    if (!stageColumn || filteredData.length === 0) return filteredData;
    return sortDataByStage(filteredData, stageColumn, resolvedStageOrder);
  }, [filteredData, stageColumn, resolvedStageOrder]);

  const stagedStats = useMemo(() => {
    if (!stageColumn || !outcome || filteredData.length === 0) return null;
    // Pass the mode-aware resolved stage order so calculateStatsByStage uses the
    // same order as stagedData (rather than re-deriving with default 'auto').
    return calculateStatsByStage(filteredData, outcome, stageColumn, specs, resolvedStageOrder);
  }, [filteredData, outcome, stageColumn, specs, resolvedStageOrder]);

  return { stagedData, stagedStats };
}
