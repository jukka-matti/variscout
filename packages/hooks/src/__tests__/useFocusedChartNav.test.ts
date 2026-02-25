/**
 * Tests for useFocusedChartNav hook
 *
 * Validates chart focus navigation: setting, cycling forward/backward,
 * and wraparound behavior.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusedChartNav } from '../useFocusedChartNav';

const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;

describe('useFocusedChartNav', () => {
  it('initial focusedChart is null', () => {
    const { result } = renderHook(() => useFocusedChartNav(CHART_ORDER));
    expect(result.current.focusedChart).toBeNull();
  });

  it('setFocusedChart sets the chart', () => {
    const { result } = renderHook(() => useFocusedChartNav(CHART_ORDER));

    act(() => {
      result.current.setFocusedChart('boxplot');
    });

    expect(result.current.focusedChart).toBe('boxplot');
  });

  it('handleNextChart cycles forward through chart order', () => {
    const { result } = renderHook(() => useFocusedChartNav(CHART_ORDER));

    act(() => {
      result.current.setFocusedChart('ichart');
    });
    expect(result.current.focusedChart).toBe('ichart');

    act(() => {
      result.current.handleNextChart();
    });
    expect(result.current.focusedChart).toBe('boxplot');

    act(() => {
      result.current.handleNextChart();
    });
    expect(result.current.focusedChart).toBe('pareto');
  });

  it('handlePrevChart cycles backward through chart order', () => {
    const { result } = renderHook(() => useFocusedChartNav(CHART_ORDER));

    act(() => {
      result.current.setFocusedChart('pareto');
    });
    expect(result.current.focusedChart).toBe('pareto');

    act(() => {
      result.current.handlePrevChart();
    });
    expect(result.current.focusedChart).toBe('boxplot');

    act(() => {
      result.current.handlePrevChart();
    });
    expect(result.current.focusedChart).toBe('ichart');
  });

  it('handleNextChart wraps around from last to first', () => {
    const { result } = renderHook(() => useFocusedChartNav(CHART_ORDER));

    act(() => {
      result.current.setFocusedChart('pareto');
    });

    act(() => {
      result.current.handleNextChart();
    });
    expect(result.current.focusedChart).toBe('ichart');
  });

  it('handlePrevChart wraps around from first to last', () => {
    const { result } = renderHook(() => useFocusedChartNav(CHART_ORDER));

    act(() => {
      result.current.setFocusedChart('ichart');
    });

    act(() => {
      result.current.handlePrevChart();
    });
    expect(result.current.focusedChart).toBe('pareto');
  });
});
