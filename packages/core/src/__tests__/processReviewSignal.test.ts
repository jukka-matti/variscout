import { describe, expect, it } from 'vitest';
import { buildHubReviewSignal } from '../processReviewSignal';
import type { DataRow } from '../types';

describe('buildHubReviewSignal', () => {
  it('returns null when there is no usable outcome data', () => {
    expect(
      buildHubReviewSignal({
        rawData: [],
        outcome: 'Weight',
        factors: ['Machine'],
        computedAt: '2026-04-26T00:00:00.000Z',
      })
    ).toBeNull();

    expect(
      buildHubReviewSignal({
        rawData: [{ Machine: 'A', Weight: 'not numeric' }],
        outcome: 'Weight',
        factors: ['Machine'],
        computedAt: '2026-04-26T00:00:00.000Z',
      })
    ).toBeNull();
  });

  it('summarizes the top variation focus for the hub review', () => {
    const rawData: DataRow[] = [
      { Machine: 'A', Shift: 'Day', Weight: 10 },
      { Machine: 'A', Shift: 'Night', Weight: 11 },
      { Machine: 'B', Shift: 'Day', Weight: 20 },
      { Machine: 'B', Shift: 'Night', Weight: 21 },
    ];

    const signal = buildHubReviewSignal({
      rawData,
      outcome: 'Weight',
      factors: ['Machine', 'Shift'],
      dataFilename: 'line-4.csv',
      computedAt: '2026-04-26T00:00:00.000Z',
    });

    expect(signal).toMatchObject({
      rowCount: 4,
      outcome: 'Weight',
      dataFilename: 'line-4.csv',
      computedAt: '2026-04-26T00:00:00.000Z',
      topFocus: {
        factor: 'Machine',
        value: 'B',
      },
    });
    expect(signal?.topFocus?.variationPct).toBeGreaterThan(90);
  });

  it('includes capability and change-signal summaries when the data supports them', () => {
    const rawData: DataRow[] = [
      { Batch: 'A', Timestamp: '2026-04-26T01:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T02:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T03:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T04:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T05:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T06:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T07:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T08:00:00Z', Weight: 10 },
      { Batch: 'A', Timestamp: '2026-04-26T09:00:00Z', Weight: 10 },
      { Batch: 'B', Timestamp: '2026-04-26T10:00:00Z', Weight: 30 },
    ];

    const signal = buildHubReviewSignal({
      rawData,
      outcome: 'Weight',
      factors: ['Batch'],
      specs: { lsl: 9, usl: 15 },
      cpkTarget: 1.33,
      timeColumn: 'Timestamp',
      computedAt: '2026-04-26T11:00:00.000Z',
    });

    expect(signal?.capability).toMatchObject({
      cpkTarget: 1.33,
      outOfSpecPercentage: 10,
    });
    expect(signal?.capability?.cpk).toBeDefined();
    expect(signal?.changeSignals).toEqual({
      total: 2,
      outOfControlCount: 1,
      nelsonRule2Count: 1,
      nelsonRule3Count: 0,
    });
    expect(signal?.latestTimeValue).toBe('2026-04-26T10:00:00Z');
  });
});
