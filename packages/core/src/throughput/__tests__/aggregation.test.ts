import { describe, it, expect } from 'vitest';
import { computeOutputRate, computeBottleneck } from '../aggregation';
import type { DataRow } from '../../types';

describe('computeOutputRate', () => {
  it('counts rows per bucket and computes rate-per-hour', () => {
    const rows: DataRow[] = [
      { timestamp: '2026-04-29T08:00:00Z', step: 'roast' },
      { timestamp: '2026-04-29T08:30:00Z', step: 'roast' },
      { timestamp: '2026-04-29T09:00:00Z', step: 'roast' },
      { timestamp: '2026-04-29T09:30:00Z', step: 'roast' },
    ];
    const result = computeOutputRate(
      rows,
      'timestamp',
      { nodeId: 'roast', stepColumn: 'step' },
      'hour'
    );
    expect(result.totalCount).toBe(4);
    expect(result.buckets.length).toBe(2);
    expect(result.buckets[0].ratePerHour).toBe(2);
    expect(result.buckets[1].ratePerHour).toBe(2);
    expect(result.averageRatePerHour).toBe(2);
  });

  it('returns zero rate for empty input', () => {
    const result = computeOutputRate(
      [],
      'timestamp',
      { nodeId: 'roast', stepColumn: 'step' },
      'hour'
    );
    expect(result.totalCount).toBe(0);
    expect(result.averageRatePerHour).toBe(0);
  });
});

describe('computeBottleneck', () => {
  it('identifies the lowest rate as the bottleneck', () => {
    const rates: ReadonlyArray<{ nodeId: string; averageRatePerHour: number }> = [
      { nodeId: 'roast', averageRatePerHour: 60 },
      { nodeId: 'grind', averageRatePerHour: 30 },
      { nodeId: 'pack', averageRatePerHour: 80 },
    ];
    const result = computeBottleneck(rates);
    expect(result.find(r => r.nodeId === 'grind')!.isBottleneck).toBe(true);
    expect(result.find(r => r.nodeId === 'roast')!.isBottleneck).toBe(false);
  });
});
