/**
 * useProcessProjection — orchestrates projection computation for ProcessHealthBar.
 *
 * Computes complement data from raw vs filtered, then calls projection functions
 * to determine what to display in the toolbar. Adapts by journey phase:
 *   SCOUT: drill projection / centering / spec suggestion
 *   INVESTIGATE: cumulative from scoped findings
 *   IMPROVE: aggregate from idea What-If projections
 *   Resolved: actual measured Cpk from finding outcomes
 */

import { useMemo } from 'react';
import type { DataRow, StatsResult, SpecLimits, Finding, BenchmarkStats } from '@variscout/core';
import { toNumericValue } from '@variscout/core';
import {
  computeDrillProjection,
  computeCenteringOpportunity,
  computeSpecSuggestion,
  computeCumulativeProjection,
  computeBenchmarkProjection,
} from '@variscout/core/variation';
import type {
  ProcessProjection,
  CenteringOpportunity,
  SpecSuggestion,
} from '@variscout/core/variation';
import type { FilterChipData } from './useVariationTracking';

export type { ProcessProjection, CenteringOpportunity, SpecSuggestion };

export type JourneyPhase = 'frame' | 'scout' | 'investigate' | 'improve';

export interface UseProcessProjectionOptions {
  /** Full unfiltered dataset */
  rawData: DataRow[];
  /** Currently filtered dataset (subset during drill) */
  filteredData: DataRow[];
  /** Numeric outcome column name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Current computed stats (for filtered data) */
  stats: StatsResult | null;
  /** Filter chip data (presence indicates drilling) */
  filterChipData: FilterChipData[];
  /** Scoped findings for cumulative projection (optional, Azure only) */
  scopedFindings?: Finding[];
  /** Benchmark stats + label (Phase 3) */
  benchmark?: { stats: BenchmarkStats; label: string } | null;
  /** Current journey phase (Phase 4) */
  journeyPhase?: JourneyPhase;
  /** Aggregate projected Cpk from improvement ideas (Phase 4, from projectedCpkMap) */
  improvementProjectedCpk?: number | null;
  /** Label for improvement projection (e.g. "3 scoped") */
  improvementLabel?: string;
}

export interface UseProcessProjectionReturn {
  /** Auto-projection from complement data during drill */
  drillProjection: ProcessProjection | null;
  /** Benchmark projection when benchmark is set */
  benchmarkProjection: ProcessProjection | null;
  /** Centering opportunity (Cp vs Cpk gap) */
  centeringOpportunity: CenteringOpportunity | null;
  /** Spec suggestion when no specs set */
  specSuggestion: SpecSuggestion | null;
  /** Cumulative projection from multiple findings */
  cumulativeProjection: ProcessProjection | null;
  /** Improvement phase projection from ideas */
  improvementProjection: ProcessProjection | null;
  /** Actual measured projection from resolved findings */
  resolvedProjection: ProcessProjection | null;
  /** The highest-priority projection to display */
  activeProjection: ProcessProjection | null;
}

interface ComplementStats {
  mean: number;
  stdDev: number;
  count: number;
}

function computeComplement(
  rawData: DataRow[],
  filteredData: DataRow[],
  outcome: string
): ComplementStats | null {
  if (filteredData.length >= rawData.length) return null;

  const filteredSet = new Set(filteredData);
  const complementRows = rawData.filter(row => !filteredSet.has(row));

  const values = complementRows
    .map(r => toNumericValue(r[outcome]))
    .filter((v): v is number => v !== undefined);

  if (values.length < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

  return { mean, stdDev: Math.sqrt(variance), count: values.length };
}

export function useProcessProjection(
  options: UseProcessProjectionOptions
): UseProcessProjectionReturn {
  const {
    rawData,
    filteredData,
    outcome,
    specs,
    stats,
    filterChipData,
    scopedFindings,
    benchmark,
    journeyPhase,
    improvementProjectedCpk,
    improvementLabel,
  } = options;

  const isDrilling = filterChipData.length > 0;
  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;

  // Complement stats (everything NOT in the current filter selection)
  const complementStats = useMemo(() => {
    if (!isDrilling || !outcome) return null;
    return computeComplement(rawData, filteredData, outcome);
  }, [rawData, filteredData, outcome, isDrilling]);

  // Subset stats (current filtered data)
  const subsetStats = useMemo(() => {
    if (!isDrilling || !stats) return null;
    return { mean: stats.mean, stdDev: stats.stdDev, count: filteredData.length };
  }, [isDrilling, stats, filteredData.length]);

  // SCOUT: Drill projection ("if fixed")
  const drillProjection = useMemo(() => {
    if (!isDrilling || !hasSpecs || !subsetStats || !complementStats) return null;
    return computeDrillProjection(subsetStats, complementStats, specs);
  }, [isDrilling, hasSpecs, subsetStats, complementStats, specs]);

  // SCOUT: Benchmark projection ("benchmark: Bed A, AM")
  const benchmarkProjection = useMemo(() => {
    if (!benchmark || !isDrilling || !hasSpecs || !subsetStats || !complementStats) return null;
    return computeBenchmarkProjection(
      subsetStats,
      benchmark.stats,
      complementStats,
      specs,
      benchmark.label
    );
  }, [benchmark, isDrilling, hasSpecs, subsetStats, complementStats, specs]);

  // SCOUT: Centering opportunity (Cp vs Cpk gap)
  const centeringOpportunity = useMemo(() => {
    if (isDrilling || !hasSpecs || !stats) return null;
    return computeCenteringOpportunity(stats);
  }, [isDrilling, hasSpecs, stats]);

  // SCOUT: Spec suggestion (no specs, drilling)
  const specSuggestion = useMemo(() => {
    if (!isDrilling || hasSpecs || !complementStats) return null;
    return computeSpecSuggestion(complementStats);
  }, [isDrilling, hasSpecs, complementStats]);

  // INVESTIGATE: Cumulative projection from multiple scoped findings
  const cumulativeProjection = useMemo(() => {
    if (!scopedFindings || scopedFindings.length < 2 || !outcome || !hasSpecs) return null;
    const findingFilters = scopedFindings
      .filter(f => f.context?.activeFilters && Object.keys(f.context.activeFilters).length > 0)
      .map(f => ({ activeFilters: f.context.activeFilters }));
    if (findingFilters.length < 2) return null;
    return computeCumulativeProjection(findingFilters, rawData, outcome, specs);
  }, [scopedFindings, rawData, outcome, hasSpecs, specs]);

  // IMPROVE: Aggregate projection from idea What-If results
  const improvementProjection = useMemo((): ProcessProjection | null => {
    if (journeyPhase !== 'improve') return null;
    if (improvementProjectedCpk == null || !hasSpecs || !stats?.cpk) return null;
    return {
      currentCpk: stats.cpk,
      projectedCpk: improvementProjectedCpk,
      label: improvementLabel ?? 'from ideas',
      findingCount: 0,
    };
  }, [journeyPhase, improvementProjectedCpk, improvementLabel, hasSpecs, stats]);

  // RESOLVED: Actual measured Cpk from finding outcomes
  const resolvedProjection = useMemo((): ProcessProjection | null => {
    if (!scopedFindings || !stats?.cpk) return null;
    const resolved = scopedFindings.filter(f => f.outcome?.cpkAfter != null);
    if (resolved.length === 0) return null;
    // Use the latest resolved finding's actual Cpk
    const latestCpk = resolved[resolved.length - 1].outcome!.cpkAfter!;
    return {
      currentCpk: stats.cpk,
      projectedCpk: latestCpk,
      label: `actual (${resolved.length} resolved)`,
      findingCount: resolved.length,
    };
  }, [scopedFindings, stats]);

  // Active projection: highest priority
  // 1. resolved (actual measurements trump all projections)
  // 2. improvement (IMPROVE phase, ideas have projections)
  // 3. cumulative (2+ scoped findings, INVESTIGATE)
  // 4. benchmark (benchmark pinned, drilling)
  // 5. drill complement ("if fixed")
  // 6. null → centering shown separately
  const activeProjection = useMemo(() => {
    if (resolvedProjection) return resolvedProjection;
    if (improvementProjection) return improvementProjection;
    if (cumulativeProjection) return cumulativeProjection;
    if (benchmarkProjection) return benchmarkProjection;
    if (drillProjection) return drillProjection;
    return null;
  }, [
    resolvedProjection,
    improvementProjection,
    cumulativeProjection,
    benchmarkProjection,
    drillProjection,
  ]);

  return {
    drillProjection,
    benchmarkProjection,
    centeringOpportunity,
    specSuggestion,
    cumulativeProjection,
    improvementProjection,
    resolvedProjection,
    activeProjection,
  };
}
