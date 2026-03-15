import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAIContext } from '../useAIContext';
import type { StatsResult } from '@variscout/core';

/** Minimal StatsResult for testing */
const makeStats = (overrides?: Partial<StatsResult>): StatsResult => ({
  mean: 10,
  median: 10,
  stdDev: 0.5,
  sigmaWithin: 0.4,
  mrBar: 0.45,
  ucl: 11.2,
  lcl: 8.8,
  outOfSpecPercentage: 2,
  ...overrides,
});

describe('useAIContext', () => {
  it('returns null when disabled', () => {
    const { result } = renderHook(() => useAIContext({ enabled: false }));
    expect(result.current.context).toBeNull();
  });

  it('returns context when enabled with no optional inputs', () => {
    const { result } = renderHook(() => useAIContext({ enabled: true }));
    expect(result.current.context).not.toBeNull();
    expect(result.current.context!.filters).toEqual([]);
  });

  it('maps StatsResult to AI context stats', () => {
    const { result } = renderHook(() =>
      useAIContext({
        enabled: true,
        stats: makeStats({ mean: 10, stdDev: 0.5, cp: 1.33, cpk: 1.2 }),
        sampleCount: 50,
      })
    );
    expect(result.current.context).not.toBeNull();
    expect(result.current.context!.stats).toEqual({
      mean: 10,
      stdDev: 0.5,
      samples: 50,
      cp: 1.33,
      cpk: 1.2,
      passRate: 98,
    });
  });

  it('maps filters with categories', () => {
    const { result } = renderHook(() =>
      useAIContext({
        enabled: true,
        filters: { Machine: ['A', 'B'] },
        categories: [{ id: 'c1', name: 'Equipment', factorNames: ['Machine'] }],
      })
    );
    expect(result.current.context!.filters).toHaveLength(1);
    expect(result.current.context!.filters[0]).toEqual({
      factor: 'Machine',
      values: ['A', 'B'],
      category: 'Equipment',
    });
  });

  it('includes process context', () => {
    const { result } = renderHook(() =>
      useAIContext({
        enabled: true,
        process: { description: 'Fill weight on Line 3' },
      })
    );
    expect(result.current.context!.process.description).toBe('Fill weight on Line 3');
  });

  it('includes violations', () => {
    const { result } = renderHook(() =>
      useAIContext({
        enabled: true,
        violations: { outOfControl: 3, aboveUSL: 1, belowLSL: 0 },
      })
    );
    expect(result.current.context!.violations).toEqual({
      outOfControl: 3,
      aboveUSL: 1,
      belowLSL: 0,
    });
  });

  it('includes Nelson rule counts in violations', () => {
    const { result } = renderHook(() =>
      useAIContext({
        enabled: true,
        violations: {
          outOfControl: 1,
          aboveUSL: 0,
          belowLSL: 2,
          nelsonRule2Count: 2,
          nelsonRule3Count: 1,
        },
      })
    );
    expect(result.current.context!.violations).toEqual({
      outOfControl: 1,
      aboveUSL: 0,
      belowLSL: 2,
      nelsonRule2Count: 2,
      nelsonRule3Count: 1,
    });
  });

  it('memoizes context when inputs unchanged', () => {
    const { result, rerender } = renderHook(() => useAIContext({ enabled: true }));
    const first = result.current.context;
    rerender();
    expect(result.current.context).toBe(first);
  });
});
