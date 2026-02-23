/**
 * Tests for useIChartData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
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
});
