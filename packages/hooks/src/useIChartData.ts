import { useMemo } from 'react';
import type {
  IChartDataPoint,
  NelsonRule2Sequence,
  NelsonRule3Sequence,
  SpecLimits,
  StatsResult,
  StagedStatsResult,
} from '@variscout/core';
import {
  formatTimeValue,
  lttb,
  type DataCellValue,
  applyTimeLens,
  parseTimeValue,
  getNelsonRule2ViolationPoints,
  getNelsonRule2Sequences,
  getNelsonRule3ViolationPoints,
  getNelsonRule3Sequences,
} from '@variscout/core';
import { usePreferencesStore } from '@variscout/stores';

function toISOTimestamp(value: DataCellValue): string | null {
  const parsed = parseTimeValue(value);
  return parsed ? parsed.toISOString() : null;
}

function markerAwareThreshold(fullCount: number, chartWidth?: number): number | undefined {
  if (!chartWidth || chartWidth <= 0) return undefined;
  const multiplier = fullCount >= 800 ? 0.75 : 2;
  return Math.max(3, Math.floor(chartWidth * multiplier));
}

function buildIChartPoints({
  sourceData,
  outcome,
  stageColumn,
  timeColumn,
  factors,
  conditionMemberIndices,
}: {
  sourceData: Record<string, unknown>[];
  outcome: string | null;
  stageColumn: string | null;
  timeColumn: string | null;
  factors?: string[];
  conditionMemberIndices?: Set<number>;
}): IChartDataPoint[] {
  if (!outcome) return [];
  return sourceData
    .map(
      (d, i): IChartDataPoint => ({
        x: i,
        y: Number(d[outcome]),
        stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
        timeValue: timeColumn ? formatTimeValue(d[timeColumn] as DataCellValue) : undefined,
        isoTimestamp: timeColumn ? toISOTimestamp(d[timeColumn] as DataCellValue) : undefined,
        originalIndex: i,
        factorValues:
          factors && factors.length > 0
            ? Object.fromEntries(factors.map(f => [f, d[f] != null ? String(d[f]) : '']))
            : undefined,
      })
    )
    .filter(d => Number.isFinite(d.y))
    .map(
      (d, displayIndex): IChartDataPoint =>
        conditionMemberIndices ? { ...d, isMember: conditionMemberIndices.has(displayIndex) } : d
    );
}

function setFromDisplayIndices(
  points: IChartDataPoint[],
  displayIndices: Set<number>
): Set<number> {
  const result = new Set<number>();
  displayIndices.forEach(displayIndex => {
    const originalIndex = points[displayIndex]?.originalIndex;
    if (originalIndex !== undefined) result.add(originalIndex);
  });
  return result;
}

function sequencesFromDisplayIndices<T extends NelsonRule2Sequence | NelsonRule3Sequence>(
  points: IChartDataPoint[],
  sequences: T[]
): T[] {
  return sequences
    .map(seq => {
      const startIndex = points[seq.startIndex]?.originalIndex;
      const endIndex = points[seq.endIndex]?.originalIndex;
      if (startIndex === undefined || endIndex === undefined) return null;
      return { ...seq, startIndex, endIndex } as T;
    })
    .filter((seq): seq is T => seq !== null);
}

function computeNelsonSignals(
  fullData: IChartDataPoint[],
  stats?: StatsResult | null,
  stagedStats?: StagedStatsResult | null
) {
  if (fullData.length === 0) {
    return {
      nelsonRule2Violations: new Set<number>(),
      nelsonRule2Sequences: [] as NelsonRule2Sequence[],
      nelsonRule3Violations: new Set<number>(),
      nelsonRule3Sequences: [] as NelsonRule3Sequence[],
    };
  }

  const rule2Violations = new Set<number>();
  const rule2Sequences: NelsonRule2Sequence[] = [];
  const rule3Violations = new Set<number>();
  const rule3Sequences: NelsonRule3Sequence[] = [];

  const computeForPoints = (points: IChartDataPoint[], mean?: number) => {
    const values = points.map(d => d.y);
    if (mean !== undefined) {
      setFromDisplayIndices(points, getNelsonRule2ViolationPoints(values, mean)).forEach(idx =>
        rule2Violations.add(idx)
      );
      rule2Sequences.push(
        ...sequencesFromDisplayIndices(points, getNelsonRule2Sequences(values, mean))
      );
    }
    setFromDisplayIndices(points, getNelsonRule3ViolationPoints(values)).forEach(idx =>
      rule3Violations.add(idx)
    );
    rule3Sequences.push(...sequencesFromDisplayIndices(points, getNelsonRule3Sequences(values)));
  };

  if (stagedStats?.stages.size) {
    const stageOrder = stagedStats.stageOrder ?? Array.from(stagedStats.stages.keys());
    stageOrder.forEach(stage => {
      const stagePoints = fullData.filter(d => d.stage === stage);
      computeForPoints(stagePoints, stagedStats.stages.get(stage)?.mean);
    });
  } else {
    computeForPoints(fullData, stats?.mean);
  }

  return {
    nelsonRule2Violations: rule2Violations,
    nelsonRule2Sequences: rule2Sequences,
    nelsonRule3Violations: rule3Violations,
    nelsonRule3Sequences: rule3Sequences,
  };
}

function decimateIChartData({
  fullData,
  chartWidth,
  stats,
  specs,
  forceIncludeIndices,
}: {
  fullData: IChartDataPoint[];
  chartWidth?: number;
  stats?: StatsResult | null;
  specs?: SpecLimits;
  forceIncludeIndices?: Set<number>;
}): IChartDataPoint[] {
  const threshold = markerAwareThreshold(fullData.length, chartWidth);
  if (!threshold || fullData.length <= threshold) return fullData;

  const forceInclude = new Set<number>(forceIncludeIndices);
  fullData.forEach(p => {
    const originalIndex = p.originalIndex;
    if (originalIndex === undefined) return;
    if (stats && (p.y > stats.ucl || p.y < stats.lcl)) forceInclude.add(originalIndex);
    if (specs?.usl !== undefined && p.y > specs.usl) forceInclude.add(originalIndex);
    if (specs?.lsl !== undefined && p.y < specs.lsl) forceInclude.add(originalIndex);
    if (p.isMember) forceInclude.add(originalIndex);
  });

  return lttb(fullData, threshold, forceInclude.size > 0 ? forceInclude : undefined);
}

export interface UseIChartModelOptions {
  sourceData: Record<string, unknown>[];
  outcome: string | null;
  stageColumn: string | null;
  timeColumn: string | null;
  chartWidth?: number;
  stats?: StatsResult | null;
  stagedStats?: StagedStatsResult | null;
  specs?: SpecLimits;
  factors?: string[];
  conditionMemberIndices?: Set<number>;
}

export interface UseIChartModelResult {
  fullData: IChartDataPoint[];
  renderData: IChartDataPoint[];
  fullPointCount: number;
  nelsonRule2Violations: Set<number>;
  nelsonRule2Sequences: NelsonRule2Sequence[];
  nelsonRule3Violations: Set<number>;
  nelsonRule3Sequences: NelsonRule3Sequence[];
}

export function useIChartModel({
  sourceData,
  outcome,
  stageColumn,
  timeColumn,
  chartWidth,
  stats,
  stagedStats,
  specs,
  factors,
  conditionMemberIndices,
}: UseIChartModelOptions): UseIChartModelResult {
  const timeLens = usePreferencesStore(s => s.timeLens);
  const lensedData = useMemo(
    () => applyTimeLens(sourceData, timeLens, timeColumn ?? ''),
    [sourceData, timeLens, timeColumn]
  );

  const fullData = useMemo(
    () =>
      buildIChartPoints({
        sourceData: lensedData,
        outcome,
        stageColumn,
        timeColumn,
        factors,
        conditionMemberIndices,
      }),
    [lensedData, outcome, stageColumn, timeColumn, factors, conditionMemberIndices]
  );

  const signals = useMemo(
    () => computeNelsonSignals(fullData, stats, stagedStats),
    [fullData, stats, stagedStats]
  );

  const renderData = useMemo(() => {
    const forceInclude = new Set<number>([
      ...signals.nelsonRule2Violations,
      ...signals.nelsonRule3Violations,
    ]);
    return decimateIChartData({
      fullData,
      chartWidth,
      stats,
      specs,
      forceIncludeIndices: forceInclude,
    });
  }, [fullData, chartWidth, stats, specs, signals]);

  return {
    fullData,
    renderData,
    fullPointCount: fullData.length,
    ...signals,
  };
}

/**
 * Shared hook to transform source data into IChartDataPoint[].
 * Applies LTTB decimation for large datasets when chartWidth is provided.
 *
 * Reads `timeLens` from `usePreferencesStore` and filters `sourceData` through
 * `applyTimeLens` before computing chart points.
 */
export function useIChartData(
  sourceData: Record<string, unknown>[],
  outcome: string | null,
  stageColumn: string | null,
  timeColumn: string | null,
  /** Chart container width for LTTB threshold. If provided, decimates large datasets. */
  chartWidth?: number,
  /** Stats with control limits — used to force-include violation points in decimation */
  stats?: StatsResult | null,
  /** Factor column names — values included in tooltip display */
  factors?: string[],
  /**
   * Condition-membership set in DISPLAY-index space (post-NaN-filter), the same index
   * space `selectedPoints`/brush uses. When supplied, each point carries an `isMember`
   * flag and members are force-included through LTTB exactly like violations (ER-4 /
   * ER-10). Pass `undefined` to leave behavior identical to today.
   */
  conditionMemberIndices?: Set<number>
): IChartDataPoint[] {
  return useIChartModel({
    sourceData,
    outcome,
    stageColumn,
    timeColumn,
    chartWidth,
    stats,
    factors,
    conditionMemberIndices,
  }).renderData;
}
