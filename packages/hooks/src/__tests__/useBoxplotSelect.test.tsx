import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoxplotSelect } from '../useBoxplotSelect';

function makePointerEvent(category: string): ReactPointerEvent<SVGElement> {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  el.setAttribute('data-testid', `mini-boxplot-box-${category}`);
  return {
    currentTarget: el,
    preventDefault: vi.fn(),
  } as unknown as ReactPointerEvent<SVGElement>;
}

describe('useBoxplotSelect', () => {
  it('calls onCommit with the tapped category', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBoxplotSelect({ onCommit }));

    act(() => {
      result.current.getCategoryHandlers('Supplier A').onPointerUp(makePointerEvent('Supplier A'));
    });

    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith('Supplier A');
  });

  it('sets selectedCategory on selection', () => {
    const { result } = renderHook(() => useBoxplotSelect({ onCommit: undefined }));

    expect(result.current.selectedCategory).toBeNull();

    act(() => {
      result.current.getCategoryHandlers('B').onPointerUp(makePointerEvent('B'));
    });

    expect(result.current.selectedCategory).toBe('B');
  });

  it('updates selectedCategory when a subsequent selection is made', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useBoxplotSelect({ onCommit }));

    act(() => {
      result.current.getCategoryHandlers('A').onPointerUp(makePointerEvent('A'));
    });
    expect(result.current.selectedCategory).toBe('A');

    act(() => {
      result.current.getCategoryHandlers('B').onPointerUp(makePointerEvent('B'));
    });
    expect(result.current.selectedCategory).toBe('B');
    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenLastCalledWith('B');
  });

  it('returns cursor:pointer style from getCategoryHandlers', () => {
    const { result } = renderHook(() => useBoxplotSelect({ onCommit: undefined }));
    const handlers = result.current.getCategoryHandlers('X');
    expect(handlers.style.cursor).toBe('pointer');
  });
});
