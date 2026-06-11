/**
 * Tests for useIChartData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { StatsResult } from '@variscout/core';
import { useIChartData } from '../useIChartData';

// Module-level constants for stable references (prevents re-render loops)
const EMPTY_DATA: Record<string, unknown>[] = [];

const SIMPLE_DATA: Record<string, unknown>[] = [
  { Temp: 22.1, Stage: 'warm-up', Time: '2026-01-01' },
  { Temp: 23.5, Stage: 'warm-up', Time: '2026-01-02' },
  { Temp: 21.8, Stage: 'run', Time: '2026-01-03' },
];

const NAN_DATA: Record<string, unknown>[] = [
  { Temp: 10 },
  { Temp: 'bad' },
  { Temp: 30 },
  { Temp: undefined },
  { Temp: 50 },
];

const STAGE_DATA: Record<string, unknown>[] = [
  { Measurement: 5.0, Phase: 'baseline' },
  { Measurement: 5.2, Phase: 'baseline' },
  { Measurement: 6.1, Phase: 'treatment' },
];

describe('useIChartData', () => {
  it('returns empty array when outcome is null', () => {
    const { result } = renderHook(() => useIChartData(SIMPLE_DATA, null, null, null));
    expect(result.current).toEqual([]);
  });

  it('returns empty array for empty data', () => {
    const { result } = renderHook(() => useIChartData(EMPTY_DATA, 'Temp', null, null));
    expect(result.current).toEqual([]);
  });

  it('maps data to sequential x coordinates with y values', () => {
    const { result } = renderHook(() => useIChartData(SIMPLE_DATA, 'Temp', null, null));

    expect(result.current).toHaveLength(3);
    expect(result.current[0].x).toBe(0);
    expect(result.current[0].y).toBeCloseTo(22.1, 5);
    expect(result.current[1].x).toBe(1);
    expect(result.current[1].y).toBeCloseTo(23.5, 5);
    expect(result.current[2].x).toBe(2);
    expect(result.current[2].y).toBeCloseTo(21.8, 5);
  });

  it('includes stage when stageColumn provided', () => {
    const { result } = renderHook(() => useIChartData(STAGE_DATA, 'Measurement', 'Phase', null));

    expect(result.current).toHaveLength(3);
    expect(result.current[0].stage).toBe('baseline');
    expect(result.current[1].stage).toBe('baseline');
    expect(result.current[2].stage).toBe('treatment');
  });

  it('keeps raw ISO timestamps separate from formatted time labels', () => {
    const { result } = renderHook(() => useIChartData(SIMPLE_DATA, 'Temp', null, 'Time'));

    expect(result.current[0].isoTimestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(result.current[0].timeValue).toContain('Jan 1, 2026');
    expect(result.current[0].timeValue).not.toBe(result.current[0].isoTimestamp);
  });

  it('filters out NaN y-values', () => {
    const { result } = renderHook(() => useIChartData(NAN_DATA, 'Temp', null, null));

    // "bad" and undefined produce NaN, should be filtered out
    expect(result.current).toHaveLength(3);
    expect(result.current.map(d => d.y)).toEqual([10, 30, 50]);
  });

  it('originalIndex matches source index', () => {
    const { result } = renderHook(() => useIChartData(NAN_DATA, 'Temp', null, null));

    // After filtering, remaining points should still carry their original indices
    expect(result.current[0].originalIndex).toBe(0); // Temp: 10 at index 0
    expect(result.current[1].originalIndex).toBe(2); // Temp: 30 at index 2
    expect(result.current[2].originalIndex).toBe(4); // Temp: 50 at index 4
  });

  describe('membership flag (ER-4 condition loop)', () => {
    it('leaves isMember undefined when no member set is supplied', () => {
      const { result } = renderHook(() => useIChartData(SIMPLE_DATA, 'Temp', null, null));

      expect(result.current.every(d => d.isMember === undefined)).toBe(true);
    });

    it('carries isMember per point keyed on display index', () => {
      const memberIndices = new Set<number>([0, 2]);
      const { result } = renderHook(() =>
        useIChartData(SIMPLE_DATA, 'Temp', null, null, undefined, null, undefined, memberIndices)
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].isMember).toBe(true);
      expect(result.current[1].isMember).toBe(false);
      expect(result.current[2].isMember).toBe(true);
    });

    it('keys membership on display index after NaN filtering (not source row index)', () => {
      // NAN_DATA has values [10, 'bad', 30, undefined, 50]; after filtering the
      // display series is [10, 30, 50] (display indices 0,1,2). Marking display
      // index 1 must mark the 30-point — NOT the dropped 'bad' source row.
      const memberIndices = new Set<number>([1]);
      const { result } = renderHook(() =>
        useIChartData(NAN_DATA, 'Temp', null, null, undefined, null, undefined, memberIndices)
      );

      expect(result.current.map(d => d.y)).toEqual([10, 30, 50]);
      expect(result.current.map(d => d.isMember)).toEqual([false, true, false]);
    });
  });
});

describe('useIChartData LTTB force-include', () => {
  // Large dataset that triggers decimation (length > chartWidth * 2).
  const CHART_WIDTH = 5;
  const BIG_DATA: Record<string, unknown>[] = Array.from({ length: 100 }, (_, i) => ({
    V: i === 50 ? 9999 : 10 + (i % 3), // index 50 is a far-out violation
  }));

  const STATS: StatsResult = {
    mean: 11,
    median: 11,
    stdDev: 1,
    sigmaWithin: 1,
    mrBar: 1.128,
    ucl: 14,
    lcl: 8,
    outOfSpecPercentage: 0,
    sampleSize: 100,
    min: 8,
    max: 9999,
  } as StatsResult;

  it('force-includes a control-limit violation point through decimation', () => {
    const { result } = renderHook(() =>
      useIChartData(BIG_DATA, 'V', null, null, CHART_WIDTH, STATS)
    );

    // Decimation kicks in (length 100 > chartWidth*2 = 10) but the violation survives.
    expect(result.current.length).toBeLessThan(BIG_DATA.length);
    expect(result.current.some(d => d.originalIndex === 50)).toBe(true);
  });

  it('force-includes condition members through decimation exactly like violations', () => {
    // A member that is NOT a violation (ordinary value) must still survive decimation.
    const memberIndices = new Set<number>([7]);
    const { result } = renderHook(() =>
      useIChartData(BIG_DATA, 'V', null, null, CHART_WIDTH, STATS, undefined, memberIndices)
    );

    expect(result.current.length).toBeLessThan(BIG_DATA.length);
    expect(result.current.some(d => d.originalIndex === 7)).toBe(true);
    // The member that survived is flagged.
    expect(result.current.find(d => d.originalIndex === 7)?.isMember).toBe(true);
  });
});
