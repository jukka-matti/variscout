/**
 * Tests for useIChartWrapperData hook
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIChartWrapperData } from '../useIChartWrapperData';
import type { StatsResult, Finding } from '@variscout/core';

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

const ICHART_FINDING: Finding = {
  id: 'f1',
  text: 'Test note',
  status: 'observed',
  context: { activeFilters: {}, cumulativeScope: null },
  createdAt: new Date().toISOString(),
  comments: [],
  source: { chart: 'ichart', anchorX: 0.5, anchorY: 0.3 },
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
      })
    );

    expect(result.current.effectiveStats).toBe(MOCK_STATS);
  });

  it('computes pixel positions from finding source anchors', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        ichartFindings: [ICHART_FINDING],
      })
    );

    expect(result.current.categoryPositions.size).toBe(1);
    const pos = result.current.categoryPositions.get('f1')!;
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
        ichartFindings: [ICHART_FINDING],
      })
    );

    expect(result.current.categoryPositions.size).toBe(0);
  });

  it('handleContextMenu calls onCreateObservation with % positions', () => {
    const onCreateObservation = vi.fn();

    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
        onCreateObservation,
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
    expect(onCreateObservation).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    // Values should be between 0 and 1 (percentage positions)
    const [anchorX, anchorY] = onCreateObservation.mock.calls[0];
    expect(anchorX).toBeGreaterThan(0);
    expect(anchorX).toBeLessThanOrEqual(1);
    expect(anchorY).toBeGreaterThan(0);
    expect(anchorY).toBeLessThanOrEqual(1);
  });

  it('handleContextMenu is a no-op without onCreateObservation', () => {
    const { result } = renderHook(() =>
      useIChartWrapperData({
        parentWidth: 800,
        parentHeight: 400,
        stats: MOCK_STATS,
        stagedStats: null,
        displayOptions: {},
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
