import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHighlightFade } from '../useHighlightFade';

describe('useHighlightFade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with null highlight', () => {
    const { result } = renderHook(() => useHighlightFade(null));
    expect(result.current.highlightedRow).toBeNull();
  });

  it('sets highlightedRow when externalIndex changes to non-null', () => {
    const { result, rerender } = renderHook(
      ({ index }: { index: number | null }) => useHighlightFade(index),
      { initialProps: { index: null } }
    );

    expect(result.current.highlightedRow).toBeNull();

    act(() => rerender({ index: 5 }));
    expect(result.current.highlightedRow).toBe(5);
  });

  it('clears highlight after default delay (3000ms)', () => {
    const { result } = renderHook(() => useHighlightFade(3));
    expect(result.current.highlightedRow).toBe(3);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.highlightedRow).toBeNull();
  });

  it('clears highlight after custom delay', () => {
    const { result } = renderHook(() => useHighlightFade(7, 1500));
    expect(result.current.highlightedRow).toBe(7);

    act(() => vi.advanceTimersByTime(1499));
    expect(result.current.highlightedRow).toBe(7);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.highlightedRow).toBeNull();
  });

  it('allows manual override via setHighlightedRow', () => {
    const { result } = renderHook(() => useHighlightFade(null));

    act(() => result.current.setHighlightedRow(10));
    expect(result.current.highlightedRow).toBe(10);
  });

  it('resets when externalIndex changes again', () => {
    const { result, rerender } = renderHook(
      ({ index }: { index: number | null }) => useHighlightFade(index),
      { initialProps: { index: 2 } }
    );

    expect(result.current.highlightedRow).toBe(2);

    act(() => rerender({ index: 8 }));
    expect(result.current.highlightedRow).toBe(8);
  });
});
