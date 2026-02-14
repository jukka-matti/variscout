/**
 * Tests for useDrillPath hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDrillPath } from '../useDrillPath';
import { createFilterAction, type FilterAction } from '@variscout/core';

// Small dataset with known factor structure:
// Machine: A (lower mean ~10), B (higher mean ~20) → high η²
// Shift: Morning (similar), Afternoon (similar) → low η²
const testData = [
  { Machine: 'A', Shift: 'Morning', Value: 10 },
  { Machine: 'A', Shift: 'Morning', Value: 11 },
  { Machine: 'A', Shift: 'Afternoon', Value: 9 },
  { Machine: 'A', Shift: 'Afternoon', Value: 12 },
  { Machine: 'B', Shift: 'Morning', Value: 20 },
  { Machine: 'B', Shift: 'Morning', Value: 19 },
  { Machine: 'B', Shift: 'Afternoon', Value: 21 },
  { Machine: 'B', Shift: 'Afternoon', Value: 18 },
];

function makeFilterAction(factor: string, values: (string | number)[]): FilterAction {
  return createFilterAction({
    type: 'filter',
    source: 'mindmap',
    factor,
    values,
  });
}

describe('useDrillPath', () => {
  it('returns empty drillPath when filterStack is empty', () => {
    const { result } = renderHook(() => useDrillPath(testData, [], 'Value', { usl: 25, lsl: 5 }));

    expect(result.current.drillPath).toEqual([]);
    expect(result.current.cumulativeVariationPct).toBeNull();
  });

  it('returns empty drillPath when outcome is null', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useDrillPath(testData, stack, null, undefined));

    expect(result.current.drillPath).toEqual([]);
    expect(result.current.cumulativeVariationPct).toBeNull();
  });

  it('returns empty drillPath when rawData has fewer than 2 rows', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useDrillPath([testData[0]], stack, 'Value', undefined));

    expect(result.current.drillPath).toEqual([]);
    expect(result.current.cumulativeVariationPct).toBeNull();
  });

  it('computes a single drill step correctly', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() =>
      useDrillPath(testData, stack, 'Value', { usl: 25, lsl: 5 })
    );

    expect(result.current.drillPath).toHaveLength(1);

    const step = result.current.drillPath[0];
    expect(step.factor).toBe('Machine');
    expect(step.values).toEqual(['A']);

    // Machine has high η² (A mean ~10.5, B mean ~19.5, grand mean ~15)
    expect(step.etaSquared).toBeGreaterThan(0.7);

    // Cumulative η² should equal the single step's η²
    expect(step.cumulativeEtaSquared).toBeCloseTo(step.etaSquared, 5);

    // Before: all 8 rows, mean ~15
    expect(step.countBefore).toBe(8);
    expect(step.meanBefore).toBeCloseTo(15, 0);

    // After: only Machine A rows (4 rows), mean ~10.5
    expect(step.countAfter).toBe(4);
    expect(step.meanAfter).toBeCloseTo(10.5, 0);

    // Cpk should be defined (specs provided)
    expect(step.cpkBefore).toBeDefined();
    expect(step.cpkAfter).toBeDefined();

    // cumulativeVariationPct should be step.cumulativeEtaSquared * 100
    expect(result.current.cumulativeVariationPct).toBeCloseTo(step.cumulativeEtaSquared * 100, 5);
  });

  it('computes two drill steps with cumulative η²', () => {
    const stack = [makeFilterAction('Machine', ['A']), makeFilterAction('Shift', ['Morning'])];
    const { result } = renderHook(() => useDrillPath(testData, stack, 'Value', undefined));

    expect(result.current.drillPath).toHaveLength(2);

    const step1 = result.current.drillPath[0];
    const step2 = result.current.drillPath[1];

    expect(step1.factor).toBe('Machine');
    expect(step2.factor).toBe('Shift');

    // Step 2 cumulative should be product of both η² values
    expect(step2.cumulativeEtaSquared).toBeCloseTo(step1.etaSquared * step2.etaSquared, 5);

    // Step 2 operates on Machine A data only (4 rows → 2 rows)
    expect(step2.countBefore).toBe(4);
    expect(step2.countAfter).toBe(2);

    // cumulativeVariationPct tracks the final cumulative η²
    expect(result.current.cumulativeVariationPct).toBeCloseTo(step2.cumulativeEtaSquared * 100, 5);
  });

  it('skips highlight-type actions in filterStack', () => {
    const filterAction = makeFilterAction('Machine', ['A']);
    const highlightAction: FilterAction = {
      id: 'h1',
      type: 'highlight',
      source: 'ichart',
      values: [15],
      rowIndex: 0,
      timestamp: Date.now(),
      label: 'Point #1',
    };

    const stack = [highlightAction, filterAction];
    const { result } = renderHook(() => useDrillPath(testData, stack, 'Value', undefined));

    // Should only have 1 drill step (the filter, not the highlight)
    expect(result.current.drillPath).toHaveLength(1);
    expect(result.current.drillPath[0].factor).toBe('Machine');
  });

  it('returns no Cpk when specs are not provided', () => {
    const stack = [makeFilterAction('Machine', ['A'])];
    const { result } = renderHook(() => useDrillPath(testData, stack, 'Value', undefined));

    const step = result.current.drillPath[0];
    // Cpk requires both USL and LSL, or at least one
    // With no specs at all, cpk is undefined
    expect(step.cpkBefore).toBeUndefined();
    expect(step.cpkAfter).toBeUndefined();
  });

  it('does not produce NaN values', () => {
    const stack = [makeFilterAction('Machine', ['A']), makeFilterAction('Shift', ['Morning'])];
    const { result } = renderHook(() =>
      useDrillPath(testData, stack, 'Value', { usl: 25, lsl: 5 })
    );

    for (const step of result.current.drillPath) {
      expect(step.etaSquared).not.toBeNaN();
      expect(step.cumulativeEtaSquared).not.toBeNaN();
      expect(step.meanBefore).not.toBeNaN();
      expect(step.meanAfter).not.toBeNaN();
      expect(step.countBefore).toBeGreaterThan(0);
      expect(step.countAfter).toBeGreaterThan(0);
    }
  });
});
