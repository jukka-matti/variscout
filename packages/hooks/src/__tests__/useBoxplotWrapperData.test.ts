/**
 * Tests for useBoxplotWrapperData hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBoxplotWrapperData } from '../useBoxplotWrapperData';
import type { BoxplotGroupData } from '@variscout/core';
import type { HighlightColor } from '../types';

const makeGroup = (key: string, mean: number): BoxplotGroupData => ({
  key,
  values: [mean - 5, mean, mean + 5],
  mean,
  median: mean,
  q1: mean - 3,
  q3: mean + 3,
  min: mean - 5,
  max: mean + 5,
  outliers: [],
  stdDev: 5,
});

const TWO_GROUPS: BoxplotGroupData[] = [makeGroup('A', 20), makeGroup('B', 50)];

const SPECS_NOMINAL = { usl: 60, lsl: 10, target: 35 };

describe('useBoxplotWrapperData', () => {
  it('returns empty categoryPositions for empty data', () => {
    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: [],
        specs: SPECS_NOMINAL,
        displayOptions: {},
        parentWidth: 800,
      })
    );

    expect(result.current.categoryPositions.size).toBe(0);
    expect(result.current.effectiveHighlights).toBeUndefined();
  });

  it('returns empty categoryPositions when parentWidth is 0', () => {
    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: TWO_GROUPS,
        specs: SPECS_NOMINAL,
        displayOptions: {},
        parentWidth: 0,
      })
    );

    expect(result.current.categoryPositions.size).toBe(0);
  });

  it('computes categoryPositions for each group', () => {
    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: TWO_GROUPS,
        specs: SPECS_NOMINAL,
        displayOptions: {},
        parentWidth: 800,
      })
    );

    expect(result.current.categoryPositions.size).toBe(2);
    expect(result.current.categoryPositions.has('A')).toBe(true);
    expect(result.current.categoryPositions.has('B')).toBe(true);

    const posA = result.current.categoryPositions.get('A')!;
    const posB = result.current.categoryPositions.get('B')!;

    // Positions should be different
    expect(posA.x).not.toBe(posB.x);
    // A should be to the left of B
    expect(posA.x).toBeLessThan(posB.x);
  });

  it('returns effectiveHighlights when specs are visible', () => {
    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: TWO_GROUPS,
        specs: SPECS_NOMINAL,
        displayOptions: { showSpecs: true },
        parentWidth: 800,
      })
    );

    // computeCategoryDirectionColors should produce auto-colors
    // The exact colors depend on mean vs target, but highlights should exist
    expect(result.current.effectiveHighlights).toBeDefined();
  });

  it('returns no auto-colors when showSpecs is false', () => {
    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: TWO_GROUPS,
        specs: SPECS_NOMINAL,
        displayOptions: { showSpecs: false },
        parentWidth: 800,
      })
    );

    // No auto-colors, no manual highlights → undefined
    expect(result.current.effectiveHighlights).toBeUndefined();
  });

  it('manual highlights override auto-colors', () => {
    const manualHighlights: Record<string, HighlightColor> = { A: 'red' };

    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: TWO_GROUPS,
        specs: SPECS_NOMINAL,
        displayOptions: { showSpecs: true },
        parentWidth: 800,
        highlightedCategories: manualHighlights,
      })
    );

    expect(result.current.effectiveHighlights).toBeDefined();
    expect(result.current.effectiveHighlights!.A).toBe('red');
  });

  it('returns manual highlights when specs are null', () => {
    const manualHighlights: Record<string, HighlightColor> = { A: 'green' };

    const { result } = renderHook(() =>
      useBoxplotWrapperData({
        data: TWO_GROUPS,
        specs: null,
        displayOptions: {},
        parentWidth: 800,
        highlightedCategories: manualHighlights,
      })
    );

    expect(result.current.effectiveHighlights).toEqual({ A: 'green' });
  });
});
