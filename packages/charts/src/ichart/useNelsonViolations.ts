/**
 * Nelson Rule 2 violation detection for I-Chart
 *
 * Computes violation points and sequences for both staged and non-staged modes.
 */

import { useMemo } from 'react';
import {
  getNelsonRule2ViolationPoints,
  getNelsonRule2Sequences,
  type StatsResult,
  type NelsonRule2Sequence,
  type StagedStatsResult,
} from '@variscout/core';
import type { StageBoundary } from '../types';

interface IChartDataPoint {
  x: number;
  y: number;
  stage?: string;
  originalIndex?: number;
}

interface UseNelsonViolationsParams {
  data: IChartDataPoint[];
  stats: StatsResult | null | undefined;
  isStaged: boolean;
  stagedStats: StagedStatsResult | null | undefined;
  stageBoundaries: StageBoundary[];
}

interface UseNelsonViolationsResult {
  /** Set of global data indices that are part of Nelson Rule 2 violations */
  nelsonRule2Violations: Set<number>;
  /** Sequences with start/end indices and side (above/below mean) */
  nelsonRule2Sequences: NelsonRule2Sequence[];
}

/**
 * Hook to compute Nelson Rule 2 violations (9+ consecutive points on same side of mean).
 * Handles both staged and non-staged modes by mapping stage-local indices to global indices.
 */
export function useNelsonViolations({
  data,
  stats,
  isStaged,
  stagedStats,
  stageBoundaries,
}: UseNelsonViolationsParams): UseNelsonViolationsResult {
  const nelsonRule2Violations = useMemo(() => {
    if (isStaged && stagedStats) {
      // For staged mode, compute violations per stage
      const allViolations = new Set<number>();
      let dataIndex = 0;

      stageBoundaries.forEach(boundary => {
        const stageData = data.filter(d => d.stage === boundary.name);
        const stageValues = stageData.map(d => d.y);
        const stageViolations = getNelsonRule2ViolationPoints(stageValues, boundary.stats.mean);

        // Map stage-local indices to global indices
        stageViolations.forEach(localIdx => {
          const globalIdx = data.findIndex(
            (d, i) =>
              i >= dataIndex && d.stage === boundary.name && stageData.indexOf(d) === localIdx
          );
          if (globalIdx !== -1) {
            allViolations.add(globalIdx);
          }
        });
        dataIndex += stageData.length;
      });
      return allViolations;
    }

    if (stats) {
      const values = data.map(d => d.y);
      return getNelsonRule2ViolationPoints(values, stats.mean);
    }

    return new Set<number>();
  }, [data, stats, isStaged, stagedStats, stageBoundaries]);

  const nelsonRule2Sequences = useMemo(() => {
    if (isStaged && stagedStats) {
      // For staged mode, compute sequences per stage
      const allSequences: NelsonRule2Sequence[] = [];
      let dataIndex = 0;

      stageBoundaries.forEach(boundary => {
        const stageData = data.filter(d => d.stage === boundary.name);
        const stageValues = stageData.map(d => d.y);
        const stageSequences = getNelsonRule2Sequences(stageValues, boundary.stats.mean);

        // Map stage-local indices to global indices
        stageSequences.forEach(seq => {
          const globalStartIdx = data.findIndex(
            (d, i) =>
              i >= dataIndex && d.stage === boundary.name && stageData.indexOf(d) === seq.startIndex
          );
          const globalEndIdx = data.findIndex(
            (d, i) =>
              i >= dataIndex && d.stage === boundary.name && stageData.indexOf(d) === seq.endIndex
          );

          if (globalStartIdx !== -1 && globalEndIdx !== -1) {
            allSequences.push({
              startIndex: globalStartIdx,
              endIndex: globalEndIdx,
              side: seq.side,
            });
          }
        });
        dataIndex += stageData.length;
      });
      return allSequences;
    }

    if (stats) {
      const values = data.map(d => d.y);
      return getNelsonRule2Sequences(values, stats.mean);
    }

    return [];
  }, [data, stats, isStaged, stagedStats, stageBoundaries]);

  return { nelsonRule2Violations, nelsonRule2Sequences };
}
