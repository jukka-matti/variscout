import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSessionCanvasFilters } from '../useSessionCanvasFilters';

describe('useSessionCanvasFilters', () => {
  it('starts with cumulative timeline and no scope or Pareto filter', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());

    expect(result.current.timelineWindow).toEqual({ kind: 'cumulative' });
    expect(result.current.scopeFilter).toBeUndefined();
    expect(result.current.paretoGroupBy).toBeUndefined();
    expect(result.current.activeCanvasLens).toBe('default');
  });

  it('updates all filter values in session-local React state', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());

    act(() => {
      result.current.setTimelineWindow({ kind: 'rolling', windowDays: 14 });
      result.current.setScopeFilter({ factor: 'Line', values: ['A'] });
      result.current.setParetoGroupBy('Shift');
      result.current.setActiveCanvasLens('capability');
    });

    expect(result.current.timelineWindow).toEqual({ kind: 'rolling', windowDays: 14 });
    expect(result.current.scopeFilter).toEqual({ factor: 'Line', values: ['A'] });
    expect(result.current.paretoGroupBy).toBe('Shift');
    expect(result.current.activeCanvasLens).toBe('capability');
  });

  it('clears optional filters with undefined', () => {
    const { result } = renderHook(() => useSessionCanvasFilters());

    act(() => {
      result.current.setScopeFilter({ factor: 'Line', values: ['A'] });
      result.current.setParetoGroupBy('Shift');
    });
    act(() => {
      result.current.setScopeFilter(undefined);
      result.current.setParetoGroupBy(undefined);
    });

    expect(result.current.scopeFilter).toBeUndefined();
    expect(result.current.paretoGroupBy).toBeUndefined();
  });

  it('retains state across rerenders without persistence callbacks', () => {
    const persistenceSpy = vi.fn();
    const { result, rerender } = renderHook(() => useSessionCanvasFilters());

    act(() => result.current.setTimelineWindow({ kind: 'rolling', windowDays: 30 }));
    act(() => result.current.setActiveCanvasLens('defect'));
    const { setTimelineWindow, setScopeFilter, setParetoGroupBy, setActiveCanvasLens } =
      result.current;

    rerender();

    expect(result.current.timelineWindow).toEqual({ kind: 'rolling', windowDays: 30 });
    expect(result.current.activeCanvasLens).toBe('defect');
    expect(result.current.setTimelineWindow).toBe(setTimelineWindow);
    expect(result.current.setScopeFilter).toBe(setScopeFilter);
    expect(result.current.setParetoGroupBy).toBe(setParetoGroupBy);
    expect(result.current.setActiveCanvasLens).toBe(setActiveCanvasLens);
    expect(persistenceSpy).not.toHaveBeenCalled();
  });
});
