import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProbabilityPlotData } from '../useProbabilityPlotData';

describe('useProbabilityPlotData', () => {
  it('returns single "All" series when no factor', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { result } = renderHook(() => useProbabilityPlotData({ values }));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe('All');
    expect(result.current[0].n).toBe(10);
    expect(result.current[0].points).toHaveLength(10);
    expect(result.current[0].originalIndices).toHaveLength(10);
    expect(result.current[0].adTestPValue).toBeGreaterThan(0);
  });

  it('returns empty array for empty values', () => {
    const { result } = renderHook(() => useProbabilityPlotData({ values: [] }));
    expect(result.current).toHaveLength(0);
  });

  it('groups by factor column', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    const rows = [
      { value: 1, shift: 'A' },
      { value: 2, shift: 'A' },
      { value: 3, shift: 'A' },
      { value: 4, shift: 'A' },
      { value: 5, shift: 'B' },
      { value: 6, shift: 'B' },
      { value: 7, shift: 'B' },
      { value: 8, shift: 'B' },
    ];

    const { result } = renderHook(() =>
      useProbabilityPlotData({ values, factorColumn: 'shift', rows })
    );

    expect(result.current).toHaveLength(2);
    const seriesA = result.current.find(s => s.key === 'A');
    const seriesB = result.current.find(s => s.key === 'B');
    expect(seriesA).toBeDefined();
    expect(seriesB).toBeDefined();
    expect(seriesA!.n).toBe(4);
    expect(seriesB!.n).toBe(4);
    expect(seriesA!.points).toHaveLength(4);
    expect(seriesB!.points).toHaveLength(4);
  });

  it('preserves original indices for brush highlighting', () => {
    const values = [10, 20, 30, 40, 50, 60];
    const rows = [
      { value: 10, machine: 'X' },
      { value: 20, machine: 'Y' },
      { value: 30, machine: 'X' },
      { value: 40, machine: 'Y' },
      { value: 50, machine: 'X' },
      { value: 60, machine: 'Y' },
    ];

    const { result } = renderHook(() =>
      useProbabilityPlotData({ values, factorColumn: 'machine', rows })
    );

    const seriesX = result.current.find(s => s.key === 'X');
    const seriesY = result.current.find(s => s.key === 'Y');
    expect(seriesX!.originalIndices).toEqual([0, 2, 4]);
    expect(seriesY!.originalIndices).toEqual([1, 3, 5]);
  });

  it('returns null adTestPValue when n < 7', () => {
    const values = [1, 2, 3, 4, 5];
    const { result } = renderHook(() => useProbabilityPlotData({ values }));

    expect(result.current[0].adTestPValue).toBeNull();
  });

  it('computes AD p-value when n >= 7', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { result } = renderHook(() => useProbabilityPlotData({ values }));

    expect(result.current[0].adTestPValue).not.toBeNull();
    expect(result.current[0].adTestPValue).toBeGreaterThanOrEqual(0);
    expect(result.current[0].adTestPValue).toBeLessThanOrEqual(1);
  });

  it('skips groups with fewer than 2 values', () => {
    const values = [1, 2, 3, 4, 5];
    const rows = [
      { value: 1, group: 'A' },
      { value: 2, group: 'A' },
      { value: 3, group: 'A' },
      { value: 4, group: 'A' },
      { value: 5, group: 'B' }, // only 1 in group B
    ];

    const { result } = renderHook(() =>
      useProbabilityPlotData({ values, factorColumn: 'group', rows })
    );

    // Only group A (4 values), group B skipped (1 value)
    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe('A');
  });

  it('computes correct mean and stdDev per group', () => {
    const values = [10, 20, 30, 100, 200, 300];
    const rows = [
      { value: 10, grp: 'Low' },
      { value: 20, grp: 'Low' },
      { value: 30, grp: 'Low' },
      { value: 100, grp: 'High' },
      { value: 200, grp: 'High' },
      { value: 300, grp: 'High' },
    ];

    const { result } = renderHook(() =>
      useProbabilityPlotData({ values, factorColumn: 'grp', rows })
    );

    const low = result.current.find(s => s.key === 'Low')!;
    const high = result.current.find(s => s.key === 'High')!;

    expect(low.mean).toBeCloseTo(20, 1);
    expect(high.mean).toBeCloseTo(200, 1);
    expect(low.stdDev).toBeGreaterThan(0);
    expect(high.stdDev).toBeGreaterThan(0);
  });
});
