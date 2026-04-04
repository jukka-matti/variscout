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

  const stagedData = useMemo(() => {
    if (!stageColumn || filteredData.length === 0) return filteredData;
    const stageValues = filteredData.map(row => String(row[stageColumn] ?? ''));
    const stageOrder = determineStageOrder(stageValues, stageOrderMode);
    return sortDataByStage(filteredData, stageColumn, stageOrder);
  }, [filteredData, stageColumn, stageOrderMode]);

  const stagedStats = useMemo(() => {
    if (!stageColumn || !outcome || filteredData.length === 0) return null;
    return calculateStatsByStage(filteredData, outcome, stageColumn, specs);
  }, [filteredData, outcome, stageColumn, specs]);

  return { stagedData, stagedStats };
}
