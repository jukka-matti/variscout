import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ProcessHubInvestigation, ProcessHubInvestigationMetadata } from '@variscout/core';
import { useCanvasFilters } from '../useCanvasFilters';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const inv = (
  id: string,
  metadata?: ProcessHubInvestigationMetadata
): Pick<ProcessHubInvestigation, 'id' | 'metadata'> => ({ id, metadata });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCanvasFilters', () => {
  // 1. Default values
  it('returns cumulative default when investigation has no metadata', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-1'), onChange })
    );
    expect(result.current.timelineWindow).toEqual({ kind: 'cumulative' });
    expect(result.current.scopeFilter).toBeUndefined();
    expect(result.current.paretoGroupBy).toBeUndefined();
  });

  // 2. Reads existing metadata
  it('reflects all three filter fields when metadata is fully populated', () => {
    const onChange = vi.fn();
    const metadata: ProcessHubInvestigationMetadata = {
      timelineWindow: { kind: 'rolling', windowDays: 14 },
      scopeFilter: { factor: 'Operator', values: ['A', 'B'] },
      paretoGroupBy: 'ShiftGroup',
    };
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-2', metadata), onChange })
    );
    expect(result.current.timelineWindow).toEqual({ kind: 'rolling', windowDays: 14 });
    expect(result.current.scopeFilter).toEqual({ factor: 'Operator', values: ['A', 'B'] });
    expect(result.current.paretoGroupBy).toBe('ShiftGroup');
  });

  // 3. setTimelineWindow delegates correctly
  it('setTimelineWindow calls onChange with investigationId and timelineWindow patch', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-3'), onChange })
    );
    act(() => result.current.setTimelineWindow({ kind: 'rolling', windowDays: 30 }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('inv-3', {
      timelineWindow: { kind: 'rolling', windowDays: 30 },
    });
  });

  // 4. setScopeFilter with value
  it('setScopeFilter calls onChange with investigationId and scopeFilter patch', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-4'), onChange })
    );
    const filter = { factor: 'Line', values: ['Line1'] };
    act(() => result.current.setScopeFilter(filter));
    expect(onChange).toHaveBeenCalledWith('inv-4', { scopeFilter: filter });
  });

  // 5. setScopeFilter(undefined) — clear
  it('setScopeFilter(undefined) calls onChange with scopeFilter: undefined', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-5'), onChange })
    );
    act(() => result.current.setScopeFilter(undefined));
    expect(onChange).toHaveBeenCalledWith('inv-5', { scopeFilter: undefined });
  });

  // 6. setParetoGroupBy with value
  it('setParetoGroupBy calls onChange with investigationId and paretoGroupBy patch', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-6'), onChange })
    );
    act(() => result.current.setParetoGroupBy('Machine'));
    expect(onChange).toHaveBeenCalledWith('inv-6', { paretoGroupBy: 'Machine' });
  });

  // 7. setParetoGroupBy(undefined) — clear
  it('setParetoGroupBy(undefined) calls onChange with paretoGroupBy: undefined', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useCanvasFilters({ investigation: inv('inv-7'), onChange })
    );
    act(() => result.current.setParetoGroupBy(undefined));
    expect(onChange).toHaveBeenCalledWith('inv-7', { paretoGroupBy: undefined });
  });

  // 8. Reference stability of setters across re-renders
  it('setter references are stable across re-renders (useCallback)', () => {
    const onChange = vi.fn();
    const investigation = inv('inv-8');
    const { result, rerender } = renderHook(() => useCanvasFilters({ investigation, onChange }));
    const { setTimelineWindow, setScopeFilter, setParetoGroupBy } = result.current;

    rerender();

    expect(result.current.setTimelineWindow).toBe(setTimelineWindow);
    expect(result.current.setScopeFilter).toBe(setScopeFilter);
    expect(result.current.setParetoGroupBy).toBe(setParetoGroupBy);
  });

  // 9. Memo thrash protection — same metadata object → same timelineWindow reference
  it('timelineWindow reference is stable when re-rendering with the same metadata object', () => {
    const onChange = vi.fn();
    const metadata: ProcessHubInvestigationMetadata = {
      timelineWindow: { kind: 'rolling', windowDays: 7 },
    };
    const investigation = inv('inv-9', metadata);

    const { result, rerender } = renderHook(() => useCanvasFilters({ investigation, onChange }));
    const firstWindow = result.current.timelineWindow;

    rerender();

    expect(result.current.timelineWindow).toBe(firstWindow);
  });
});
