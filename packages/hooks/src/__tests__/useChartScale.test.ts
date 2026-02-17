/**
 * Tests for useChartScale hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChartScale } from '../useChartScale';
import type { ChartScaleContext } from '../types';

function makeContext(overrides: Partial<ChartScaleContext> = {}): ChartScaleContext {
  return {
    filteredData: [{ value: 10 }, { value: 20 }, { value: 30 }],
    outcome: 'value',
    specs: {},
    axisSettings: {},
    ...overrides,
  };
}

describe('useChartScale', () => {
  it('returns default fallback when no outcome', () => {
    const ctx = makeContext({ outcome: null });
    const { result } = renderHook(() => useChartScale(ctx));
    expect(result.current).toEqual({ min: 0, max: 100 });
  });

  it('returns default fallback when data is empty', () => {
    const ctx = makeContext({ filteredData: [] });
    const { result } = renderHook(() => useChartScale(ctx));
    expect(result.current).toEqual({ min: 0, max: 100 });
  });

  it('calculates auto scale with padding', () => {
    const ctx = makeContext();
    const { result } = renderHook(() => useChartScale(ctx));
    // Data range: 10-30, padding = (30-10)*0.1 = 2
    expect(result.current.min).toBe(8); // 10 - 2
    expect(result.current.max).toBe(32); // 30 + 2
  });

  it('extends range to include USL', () => {
    const ctx = makeContext({ specs: { usl: 50 } });
    const { result } = renderHook(() => useChartScale(ctx));
    // With USL 50, range becomes 10-50, padding = 4
    expect(result.current.min).toBe(6); // 10 - 4
    expect(result.current.max).toBe(54); // 50 + 4
  });

  it('extends range to include LSL', () => {
    const ctx = makeContext({ specs: { lsl: 0 } });
    const { result } = renderHook(() => useChartScale(ctx));
    // With LSL 0, range becomes 0-30, padding = 3
    expect(result.current.min).toBe(-3); // 0 - 3
    expect(result.current.max).toBe(33); // 30 + 3
  });

  it('handles clampZero scale mode', () => {
    const ctx = makeContext({ axisSettings: { scaleMode: 'clampZero' } });
    const { result } = renderHook(() => useChartScale(ctx));
    expect(result.current.min).toBe(0);
    expect(result.current.max).toBeGreaterThan(30);
  });

  it('handles manual scale mode', () => {
    const ctx = makeContext({
      axisSettings: { scaleMode: 'manual', min: 5, max: 35 },
    });
    const { result } = renderHook(() => useChartScale(ctx));
    expect(result.current).toEqual({ min: 5, max: 35 });
  });

  it('falls back to auto if manual mode has incomplete values', () => {
    const ctx = makeContext({
      axisSettings: { scaleMode: 'manual', min: 5 },
    });
    const { result } = renderHook(() => useChartScale(ctx));
    // Falls through to auto with min override
    expect(result.current.min).toBe(5);
    expect(result.current.max).toBe(32);
  });

  it('handles single data point', () => {
    const ctx = makeContext({
      filteredData: [{ value: 42 }],
    });
    const { result } = renderHook(() => useChartScale(ctx));
    // Range is 42-42, padding = 0 || 1 = 1
    expect(result.current.min).toBe(41);
    expect(result.current.max).toBe(43);
  });

  it('handles all same values', () => {
    const ctx = makeContext({
      filteredData: [{ value: 10 }, { value: 10 }, { value: 10 }],
    });
    const { result } = renderHook(() => useChartScale(ctx));
    // Range is 10-10, padding = 0 || 1 = 1
    expect(result.current.min).toBe(9);
    expect(result.current.max).toBe(11);
  });

  it('respects partial axisSettings.min override in auto mode', () => {
    const ctx = makeContext({
      axisSettings: { min: 0 },
    });
    const { result } = renderHook(() => useChartScale(ctx));
    expect(result.current.min).toBe(0);
    expect(result.current.max).toBe(32);
  });
});
