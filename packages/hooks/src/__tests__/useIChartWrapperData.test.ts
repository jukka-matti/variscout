/**
 * Tests for useIChartWrapperData hook
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIChartWrapperData } from '../useIChartWrapperData';
import type { StatsResult } from '@variscout/core';
import type { ChartAnnotation } from '../types';

const MOCK_STATS: StatsResult = {
  mean: 50,
  stdDev: 5,
  ucl: 65,
  lcl: 35,
  samples: 30,
  movingRange: 6,
  expectedRange: 6.26,
  sigma: 5.56,
  cp: null,
  cpk: null,
  passRate: null,
  median: 50,
};

const ANNOTATION: ChartAnnotation = {
  id: 'a1',
  anchorCategory: '',
  text: 'Test note',
  offsetX: 0,
  offsetY: 0,
  width: 120,
  color: 'neutral',
  anchorX: 0.5,
  anchorY: 0.3,
};

describe('useIChartWrapperData', () => {
  it('returns null effectiveStats when showControlLimits is false', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: { showControlLimits: false },
        ichartAnnotations: [],
      })
    );

    expect(result.current.effectiveStats).toBeNull();
    expect(result.current.effectiveStagedStats).toBeUndefined();
  });

  it('returns stats when showControlLimits is true', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: { showControlLimits: true },
        ichartAnnotations: [],
      })
    );

    expect(result.current.effectiveStats).toBe(MOCK_STATS);
  });

  it('returns stats when showControlLimits is undefined (default true)', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        ichartAnnotations: [],
      })
    );

    expect(result.current.effectiveStats).toBe(MOCK_STATS);
  });

  it('computes pixel positions from annotation percentage anchors', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        ichartAnnotations: [ANNOTATION],
      })
    );

    expect(result.current.categoryPositions.size).toBe(1);
    const pos = result.current.categoryPositions.get('a1')!;
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.y).toBeGreaterThan(0);
  });

  it('returns empty categoryPositions when parentWidth is 0', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 0,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        ichartAnnotations: [ANNOTATION],
      })
    );

    expect(result.current.categoryPositions.size).toBe(0);
  });

  it('handleContextMenu calls onCreateAnnotation with % positions', () => {
    const onCreateAnnotation = vi.fn();

    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        ichartAnnotations: [],
        onCreateAnnotation,
      })
    );

    // Simulate a right-click in the middle of the chart
    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 400,
      clientY: 200,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400 }),
      },
    } as unknown as React.MouseEvent<HTMLDivElement>;

    act(() => {
      result.current.handleContextMenu(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onCreateAnnotation).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    // Values should be between 0 and 1 (percentage positions)
    const [anchorX, anchorY] = onCreateAnnotation.mock.calls[0];
    expect(anchorX).toBeGreaterThan(0);
    expect(anchorX).toBeLessThanOrEqual(1);
    expect(anchorY).toBeGreaterThan(0);
    expect(anchorY).toBeLessThanOrEqual(1);
  });

  it('handleContextMenu is a no-op without onCreateAnnotation', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        ichartAnnotations: [],
        // No onCreateAnnotation
      })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 400,
      clientY: 200,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400 }),
      },
    } as unknown as React.MouseEvent<HTMLDivElement>;

    act(() => {
      result.current.handleContextMenu(mockEvent);
    });

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});
