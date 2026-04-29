import type { DataRow } from '../types';
import { parseTimeValue } from '../time';
import type { OutputRateResult, OutputRateBucket, BottleneckResult } from './types';

export interface OutputRateInput {
  nodeId: string;
  stepColumn: string; // column in DataRow that names the step
}

const MS_PER_HOUR = 60 * 60 * 1000;
const GRANULARITY_MS: Record<string, number> = {
  minute: 60 * 1000,
  hour: MS_PER_HOUR,
  day: 24 * MS_PER_HOUR,
  week: 7 * 24 * MS_PER_HOUR,
};

export function computeOutputRate(
  rows: DataRow[],
  timeColumn: string,
  input: OutputRateInput,
  granularity: 'minute' | 'hour' | 'day' | 'week'
): OutputRateResult {
  const stepRows = rows.filter(r => String(r[input.stepColumn]) === input.nodeId);
  const bucketMs = GRANULARITY_MS[granularity];

  const bucketMap = new Map<number, number>();
  for (const r of stepRows) {
    const t = parseTimeValue(r[timeColumn]);
    if (!t) continue;
    const bucketStart = Math.floor(t.getTime() / bucketMs) * bucketMs;
    bucketMap.set(bucketStart, (bucketMap.get(bucketStart) ?? 0) + 1);
  }

  const buckets: OutputRateBucket[] = [...bucketMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startMs, count]) => ({
      bucketStartISO: new Date(startMs).toISOString(),
      bucketEndISO: new Date(startMs + bucketMs).toISOString(),
      count,
      ratePerHour: (count * MS_PER_HOUR) / bucketMs,
    }));

  const totalCount = stepRows.length;
  const averageRatePerHour =
    buckets.length === 0 ? 0 : buckets.reduce((s, b) => s + b.ratePerHour, 0) / buckets.length;

  return {
    nodeId: input.nodeId,
    granularity,
    buckets,
    totalCount,
    averageRatePerHour,
  };
}

export function computeBottleneck(
  rates: ReadonlyArray<{ nodeId: string; averageRatePerHour: number }>
): BottleneckResult[] {
  const sorted = [...rates].sort((a, b) => a.averageRatePerHour - b.averageRatePerHour);
  const bottleneckNodeId = sorted[0]?.nodeId;
  return rates
    .map(r => ({
      nodeId: r.nodeId,
      averageRatePerHour: r.averageRatePerHour,
      rank: sorted.findIndex(s => s.nodeId === r.nodeId) + 1,
      isBottleneck: r.nodeId === bottleneckNodeId,
    }))
    .sort((a, b) => a.rank - b.rank);
}
