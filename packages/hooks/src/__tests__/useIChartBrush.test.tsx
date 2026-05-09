import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIChartBrush } from '../useIChartBrush';

// jsdom does not implement setPointerCapture — polyfill per task spec
function polyfillPointerCapture(element: Element) {
  (element as unknown as Record<string, unknown>)['setPointerCapture'] = vi.fn();
  (element as unknown as Record<string, unknown>)['releasePointerCapture'] = vi.fn();
}

/** Build a minimal PointerEvent-like object for the SVGElement handlers. */
function makePointerEvent(
  clientX: number,
  boundingLeft = 0,
  pointerId = 1
): ReactPointerEvent<SVGElement> {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  polyfillPointerCapture(el);
  el.getBoundingClientRect = () =>
    ({ left: boundingLeft, top: 0, right: 300, bottom: 80, width: 300, height: 80 }) as DOMRect;

  return {
    clientX,
    pointerId,
    currentTarget: el,
    preventDefault: vi.fn(),
  } as unknown as ReactPointerEvent<SVGElement>;
}

describe('useIChartBrush', () => {
  it('commits a normalized range on pointer-up', () => {
    const onCommit = vi.fn();
    // width=200, valuesLength=11 → idx = round((px/200) * 10)
    const { result } = renderHook(() => useIChartBrush({ valuesLength: 11, width: 200, onCommit }));

    act(() => {
      result.current.handlers.onPointerDown(makePointerEvent(40)); // idx=2
    });
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent(120)); // idx=6
    });
    act(() => {
      result.current.handlers.onPointerUp(makePointerEvent(120)); // idx=6
    });

    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith({ startIdx: 2, endIdx: 6 });
    // State cleared after commit
    expect(result.current.currentBrush).toBeNull();
  });

  it('normalizes range so startIdx <= endIdx when dragging left', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useIChartBrush({ valuesLength: 11, width: 200, onCommit }));

    act(() => result.current.handlers.onPointerDown(makePointerEvent(160))); // idx=8
    act(() => result.current.handlers.onPointerUp(makePointerEvent(40))); // idx=2

    expect(onCommit).toHaveBeenCalledWith({ startIdx: 2, endIdx: 8 });
  });

  it('does NOT commit when startIdx === endIdx (zero-width drag / click)', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useIChartBrush({ valuesLength: 11, width: 200, onCommit }));

    act(() => result.current.handlers.onPointerDown(makePointerEvent(40))); // idx=2
    act(() => result.current.handlers.onPointerUp(makePointerEvent(40))); // idx=2

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does NOT commit on pointer-cancel', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useIChartBrush({ valuesLength: 11, width: 200, onCommit }));

    act(() => result.current.handlers.onPointerDown(makePointerEvent(40)));
    act(() => result.current.handlers.onPointerMove(makePointerEvent(120)));
    act(() => result.current.handlers.onPointerCancel(makePointerEvent(0)));

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.currentBrush).toBeNull();
  });

  it('exposes currentBrush while pointer is down', () => {
    const { result } = renderHook(() =>
      useIChartBrush({ valuesLength: 11, width: 200, onCommit: undefined })
    );

    expect(result.current.currentBrush).toBeNull();

    act(() => result.current.handlers.onPointerDown(makePointerEvent(40)));
    expect(result.current.currentBrush).toEqual({ startIdx: 2, endIdx: 2 });

    act(() => result.current.handlers.onPointerMove(makePointerEvent(120)));
    expect(result.current.currentBrush).toEqual({ startIdx: 2, endIdx: 6 });
  });

  it('clamps idx to valid range [0, valuesLength-1]', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useIChartBrush({ valuesLength: 5, width: 100, onCommit }));

    act(() => result.current.handlers.onPointerDown(makePointerEvent(-50))); // should clamp to 0
    act(() => result.current.handlers.onPointerUp(makePointerEvent(9999))); // should clamp to 4

    expect(onCommit).toHaveBeenCalledWith({ startIdx: 0, endIdx: 4 });
  });
});
