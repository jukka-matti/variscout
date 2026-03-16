/**
 * Tests for useBoxplotData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBoxplotData } from '../useBoxplotData';

// Module-level constants for stable references (prevents re-render loops)
const EMPTY_DATA: Record<string, unknown>[] = [];

const TWO_GROUP_DATA: Record<string, unknown>[] = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 20 },
  { Machine: 'A', Weight: 30 },
  { Machine: 'B', Weight: 40 },
  { Machine: 'B', Weight: 50 },
  { Machine: 'B', Weight: 60 },
];

const SINGLE_GROUP_DATA: Record<string, unknown>[] = [
  { Machine: 'X', Weight: 5 },
  { Machine: 'X', Weight: 15 },
  { Machine: 'X', Weight: 25 },
  { Machine: 'X', Weight: 35 },
  { Machine: 'X', Weight: 45 },
];

const NAN_DATA: Record<string, unknown>[] = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'A', Weight: 'bad' },
  { Machine: 'A', Weight: 30 },
  { Machine: 'A', Weight: undefined },
  { Machine: 'A', Weight: 50 },
];

// Larger dataset for accurate quartile verification (7 values per group)
const QUARTILE_DATA: Record<string, unknown>[] = [
  { Line: 'P', Thickness: 1 },
  { Line: 'P', Thickness: 2 },
  { Line: 'P', Thickness: 3 },
  { Line: 'P', Thickness: 4 },
  { Line: 'P', Thickness: 5 },
  { Line: 'P', Thickness: 6 },
  { Line: 'P', Thickness: 7 },
];

describe('useBoxplotData', () => {
  it('returns empty array when outcome is null', () => {
    const { result } = renderHook(() => useBoxplotData(TWO_GROUP_DATA, 'Machine', null));
    expect(result.current.data).toEqual([]);
  });

  it('returns empty array for empty data', () => {
    const { result } = renderHook(() => useBoxplotData(EMPTY_DATA, 'Machine', 'Weight'));
    expect(result.current.data).toEqual([]);
  });

  it('computes correct groups for simple data (2 groups, 3 values each)', () => {
    const { result } = renderHook(() => useBoxplotData(TWO_GROUP_DATA, 'Machine', 'Weight'));

    expect(result.current.data).toHaveLength(2);

    const groupA = result.current.data.find(g => g.key === 'A');
    const groupB = result.current.data.find(g => g.key === 'B');

    expect(groupA).toBeDefined();
    expect(groupB).toBeDefined();

    // Group A: values [10, 20, 30]
    expect(groupA!.values).toEqual([10, 20, 30]);
    expect(groupA!.mean).toBeCloseTo(20, 5);

    // Group B: values [40, 50, 60]
    expect(groupB!.values).toEqual([40, 50, 60]);
    expect(groupB!.mean).toBeCloseTo(50, 5);
  });

  it('handles single group', () => {
    const { result } = renderHook(() => useBoxplotData(SINGLE_GROUP_DATA, 'Machine', 'Weight'));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].key).toBe('X');
    expect(result.current.data[0].values).toEqual([5, 15, 25, 35, 45]);
    expect(result.current.data[0].mean).toBeCloseTo(25, 5);
  });

  it('filters out NaN values', () => {
    const { result } = renderHook(() => useBoxplotData(NAN_DATA, 'Machine', 'Weight'));

    expect(result.current.data).toHaveLength(1);
    // "bad" and undefined are filtered out, leaving [10, 30, 50]
    expect(result.current.data[0].values).toEqual([10, 30, 50]);
    expect(result.current.data[0].mean).toBeCloseTo(30, 5);
  });

  it('computes correct quartile values', () => {
    const { result } = renderHook(() => useBoxplotData(QUARTILE_DATA, 'Line', 'Thickness'));

    expect(result.current.data).toHaveLength(1);
    const group = result.current.data[0];

    // d3.quantile on sorted [1,2,3,4,5,6,7]:
    // q1 (0.25) = 2.5, median (0.5) = 4, q3 (0.75) = 5.5
    expect(group.q1).toBeCloseTo(2.5, 5);
    expect(group.median).toBeCloseTo(4, 5);
    expect(group.q3).toBeCloseTo(5.5, 5);
    expect(group.mean).toBeCloseTo(4, 5);

    // IQR = 5.5 - 2.5 = 3, whiskerMin = max(1, 2.5 - 4.5) = 1, whiskerMax = min(7, 5.5 + 4.5) = 7
    expect(group.min).toBeCloseTo(1, 5);
    expect(group.max).toBeCloseTo(7, 5);
    expect(group.outliers).toEqual([]);
  });

  it('returns empty violinData when showViolin is false', () => {
    const { result } = renderHook(() => useBoxplotData(TWO_GROUP_DATA, 'Machine', 'Weight'));
    expect(result.current.violinData.size).toBe(0);
  });

  it('returns empty violinData when showViolin is false explicitly', () => {
    const { result } = renderHook(() => useBoxplotData(TWO_GROUP_DATA, 'Machine', 'Weight', false));
    expect(result.current.violinData.size).toBe(0);
  });

  it('computes violinData when showViolin is true', () => {
    const { result } = renderHook(() => useBoxplotData(TWO_GROUP_DATA, 'Machine', 'Weight', true));

    expect(result.current.violinData.size).toBe(2);
    expect(result.current.violinData.has('A')).toBe(true);
    expect(result.current.violinData.has('B')).toBe(true);

    // Each KDE result should have { value, count } entries
    const kdeA = result.current.violinData.get('A')!;
    expect(kdeA.length).toBeGreaterThan(0);
    expect(kdeA[0]).toHaveProperty('value');
    expect(kdeA[0]).toHaveProperty('count');
  });

  it('skips violinData for groups with fewer than 2 values', () => {
    const singleValueData: Record<string, unknown>[] = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'B', Weight: 20 },
      { Machine: 'B', Weight: 30 },
    ];
    const { result } = renderHook(() => useBoxplotData(singleValueData, 'Machine', 'Weight', true));

    // Group A has only 1 value, so no KDE
    expect(result.current.violinData.has('A')).toBe(false);
    // Group B has 2 values, so KDE is computed
    expect(result.current.violinData.has('B')).toBe(true);
  });
});
