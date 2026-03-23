/**
 * useDataComputation - Derived data computations for VariScout data contexts
 *
 * Extracts all useMemo computation blocks from useDataState into a focused hook:
 * stats, fullDataYDomain, yDomainForCharts, stagedData, stagedStats,
 * performanceResult, and getSpecsForMeasure.
 *
 * Internal to useDataState -- not exported from the package.
 */

import { useMemo, useCallback } from 'react';
import {
  calculateStatsByStage,
  sortDataByStage,
  determineStageOrder,
  calculateChannelPerformance,
  type DataRow,
  type SpecLimits,
  type StatsResult,
  type StagedStatsResult,
  type StageOrderMode,
  type ChannelPerformanceData,
  type AnalysisMode,
  safeMin,
  safeMax,
} from '@variscout/core';
import type { StatsWorkerAPI } from '@variscout/core';
import type { DisplayOptions } from './types';
import { useAsyncStats } from './useAsyncStats';

// ============================================================================
// Types
// ============================================================================

export interface DataComputationInputs {
  rawData: DataRow[];
  filteredData: DataRow[];
  outcome: string | null;
  specs: SpecLimits;
  measureSpecs: Record<string, SpecLimits>;
  stageColumn: string | null;
  stageOrderMode: StageOrderMode;
  displayOptions: DisplayOptions;
  analysisMode: AnalysisMode;
  measureColumns: string[];
  /** Stats Worker API (null = sync fallback) */
  workerApi?: StatsWorkerAPI | null;
}

export interface DataComputationResult {
  stats: StatsResult | null;
  fullDataYDomain: { min: number; max: number } | null;
  yDomainForCharts: { min: number; max: number } | undefined;
  stagedData: DataRow[];
  stagedStats: StagedStatsResult | null;
  performanceResult: ChannelPerformanceData | null;
  getSpecsForMeasure: (measureId: string) => SpecLimits;
  /** True while async stats computation is in progress */
  isComputing: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDataComputation(inputs: DataComputationInputs): DataComputationResult {
  const {
    rawData,
    filteredData,
    outcome,
    specs,
    measureSpecs,
    stageColumn,
    stageOrderMode,
    displayOptions,
    analysisMode,
    measureColumns,
  } = inputs;

  // Extract numeric values for Worker (memoized to prevent unnecessary Worker calls)
  const values = useMemo(() => {
    if (!outcome || filteredData.length === 0) return [];
    return filteredData
      .map(d => {
        const v = d[outcome];
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v));
  }, [filteredData, outcome]);

  // Async stats via Worker (with sync fallback)
  const { stats, isComputing } = useAsyncStats({
    values,
    specs,
    workerApi: inputs.workerApi ?? null,
  });

  // Full dataset Y domain (for Y-axis lock feature)
  const fullDataYDomain = useMemo(() => {
    if (!outcome || rawData.length === 0) return null;
    const values = rawData
      .map(d => {
        const v = d[outcome];
        return typeof v === 'number' ? v : Number(v);
      })
      .filter(v => !isNaN(v));
    if (values.length === 0) return null;

    let minVal = safeMin(values);
    let maxVal = safeMax(values);

    // Include spec limits in domain
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    // Add 10% padding
    const padding = (maxVal - minVal) * 0.1 || 1;
    return { min: minVal - padding, max: maxVal + padding };
  }, [rawData, outcome, specs]);

  // Y domain to pass to charts (either full data domain or undefined for auto)
  const yDomainForCharts = useMemo(() => {
    if (displayOptions.lockYAxisToFullData && fullDataYDomain) {
      return fullDataYDomain;
    }
    return undefined;
  }, [displayOptions.lockYAxisToFullData, fullDataYDomain]);

  // Staged data - sorted by stage when stageColumn is active
  const stagedData = useMemo(() => {
    if (!stageColumn || filteredData.length === 0) return filteredData;

    const stageValues = filteredData.map(row => String(row[stageColumn] ?? ''));
    const stageOrder = determineStageOrder(stageValues, stageOrderMode);

    return sortDataByStage(filteredData, stageColumn, stageOrder);
  }, [filteredData, stageColumn, stageOrderMode]);

  // Staged stats - calculated separately for each stage
  const stagedStats = useMemo(() => {
    if (!stageColumn || !outcome || filteredData.length === 0) return null;

    return calculateStatsByStage(filteredData, outcome, stageColumn, specs);
  }, [filteredData, outcome, stageColumn, specs]);

  // Performance result - calculated for all measures in performance mode
  const performanceResult = useMemo(() => {
    if (analysisMode !== 'performance' || measureColumns.length === 0 || rawData.length === 0) {
      return null;
    }
    // Only calculate if specs are defined (need at least one spec for Cpk)
    if (specs.usl === undefined && specs.lsl === undefined) {
      return null;
    }
    return calculateChannelPerformance(rawData, measureColumns, specs);
  }, [analysisMode, rawData, measureColumns, specs]);

  /**
   * Get the effective specs for a measure in Performance Mode.
   * Returns per-measure override if defined, otherwise global specs.
   */
  const getSpecsForMeasure = useCallback(
    (measureId: string): SpecLimits => {
      return measureSpecs[measureId] ?? specs;
    },
    [measureSpecs, specs]
  );

  return {
    stats,
    fullDataYDomain,
    yDomainForCharts,
    stagedData,
    stagedStats,
    performanceResult,
    getSpecsForMeasure,
    isComputing,
  };
}
