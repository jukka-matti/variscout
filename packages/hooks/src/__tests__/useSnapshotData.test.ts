import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSnapshotData } from '../useSnapshotData';
import type { SpecLimits } from '@variscout/core';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const testData = [
  { Machine: 'A', Weight: 10 },
  { Machine: 'B', Weight: 20 },
  { Machine: 'A', Weight: 15 },
  { Machine: 'B', Weight: 25 },
];

const emptySpecs: SpecLimits = {};
const specsWithLimits: SpecLimits = { usl: 30, lsl: 5 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSnapshotData — filtering', () => {
  it('returns all rows when activeFilters is empty', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: {},
      })
    );
    expect(result.current.filteredData).toHaveLength(4);
  });

  it('filters rows by a single column', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: { Machine: ['A'] },
      })
    );
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.every(r => r.Machine === 'A')).toBe(true);
  });

  it('filters rows allowing multiple values for the same column', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: { Machine: ['A', 'B'] },
      })
    );
    // All rows match since both values are allowed
    expect(result.current.filteredData).toHaveLength(4);
  });

  it('returns empty filteredData when no rows match', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: { Machine: ['C'] },
      })
    );
    expect(result.current.filteredData).toHaveLength(0);
  });
});

describe('useSnapshotData — values extraction', () => {
  it('extracts numeric values from the outcome column', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: { Machine: ['A'] },
      })
    );
    // Rows for Machine A: weights 10 and 15
    expect(result.current.values).toEqual(expect.arrayContaining([10, 15]));
    expect(result.current.values).toHaveLength(2);
  });

  it('handles string-to-number conversion in the outcome column', () => {
    const stringData = [
      { Machine: 'A', Weight: '12.5' },
      { Machine: 'A', Weight: '14' },
    ];
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: stringData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: {},
      })
    );
    expect(result.current.values).toEqual(expect.arrayContaining([12.5, 14]));
    expect(result.current.values).toHaveLength(2);
  });

  it('skips non-numeric and invalid values', () => {
    const mixedData = [
      { Machine: 'A', Weight: 10 },
      { Machine: 'A', Weight: 'N/A' },
      { Machine: 'A', Weight: null },
      { Machine: 'A', Weight: undefined },
    ];
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: mixedData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: {},
      })
    );
    expect(result.current.values).toEqual([10]);
  });
});

describe('useSnapshotData — stats', () => {
  it('computes stats for filtered values', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: { Machine: ['A'] },
      })
    );
    // Machine A weights: 10, 15 → mean = 12.5
    expect(result.current.stats.mean).toBeCloseTo(12.5);
  });

  it('returns stats with cpk when specs are provided', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: specsWithLimits,
        activeFilters: {},
      })
    );
    // Cpk should be defined when specs have usl/lsl
    expect(result.current.stats.cpk).toBeDefined();
  });

  it('handles empty filteredData gracefully (zero values)', () => {
    const { result } = renderHook(() =>
      useSnapshotData({
        rawData: testData,
        outcome: 'Weight',
        specs: emptySpecs,
        activeFilters: { Machine: ['Z'] },
      })
    );
    expect(result.current.filteredData).toHaveLength(0);
    expect(result.current.values).toHaveLength(0);
    // stats should still be returned (calculateStats handles empty arrays)
    expect(result.current.stats).toBeDefined();
  });
});
