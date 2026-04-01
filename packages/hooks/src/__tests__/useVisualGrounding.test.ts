import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useVisualGrounding,
  resolveHighlightTarget,
  GLOW_DURATION_MS,
  SETTLED_DURATION_MS,
} from '../useVisualGrounding';

describe('resolveHighlightTarget', () => {
  it('maps boxplot with id to highlightCategories', () => {
    const result = resolveHighlightTarget('boxplot', 'Machine A');
    expect(result).toEqual({
      action: 'highlightCategories',
      categories: ['Machine A'],
      chartFocus: 'boxplot',
    });
  });

  it('maps stats with id to highlightStat', () => {
    const result = resolveHighlightTarget('stats', 'cpk');
    expect(result).toEqual({ action: 'highlightStat', statKey: 'cpk' });
  });

  it('maps ichart to focusChart', () => {
    const result = resolveHighlightTarget('ichart');
    expect(result).toEqual({ action: 'focusChart', chartFocus: 'ichart' });
  });

  it('maps finding with id to expandPanel', () => {
    const result = resolveHighlightTarget('finding', 'f-123');
    expect(result).toEqual({ action: 'expandPanel', panelId: 'finding', categories: ['f-123'] });
  });

  it('returns null for unknown type', () => {
    expect(resolveHighlightTarget('unknown')).toBeNull();
  });
});

describe('useVisualGrounding', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onHighlightCategories with glow phase on highlight', () => {
    const onHighlightCategories = vi.fn();
    const { result } = renderHook(() => useVisualGrounding({ onHighlightCategories }));
    act(() => result.current.highlight('boxplot', 'Machine A'));
    expect(onHighlightCategories).toHaveBeenCalledWith(['Machine A'], 'glow');
  });

  it('transitions to settled phase after glow duration', () => {
    const onHighlightCategories = vi.fn();
    const { result } = renderHook(() => useVisualGrounding({ onHighlightCategories }));
    act(() => result.current.highlight('boxplot', 'Machine A'));
    act(() => {
      vi.advanceTimersByTime(GLOW_DURATION_MS);
    });
    expect(onHighlightCategories).toHaveBeenCalledWith(['Machine A'], 'settled');
  });

  it('clears highlights after settled duration', () => {
    const onClearHighlights = vi.fn();
    const { result } = renderHook(() => useVisualGrounding({ onClearHighlights }));
    act(() => result.current.highlight('boxplot', 'Machine A'));
    act(() => {
      vi.advanceTimersByTime(GLOW_DURATION_MS + SETTLED_DURATION_MS);
    });
    expect(onClearHighlights).toHaveBeenCalled();
  });

  it('resets timers on re-highlight', () => {
    const onClearHighlights = vi.fn();
    const onHighlightCategories = vi.fn();
    const { result } = renderHook(() =>
      useVisualGrounding({ onHighlightCategories, onClearHighlights })
    );
    act(() => result.current.highlight('boxplot', 'A'));
    act(() => {
      vi.advanceTimersByTime(2000);
    }); // partial glow
    act(() => result.current.highlight('boxplot', 'B')); // re-highlight
    expect(onHighlightCategories).toHaveBeenLastCalledWith(['B'], 'glow');
  });

  it('clearAll stops timers and clears', () => {
    const onClearHighlights = vi.fn();
    const { result } = renderHook(() => useVisualGrounding({ onClearHighlights }));
    act(() => result.current.highlight('boxplot', 'A'));
    act(() => result.current.clearAll());
    expect(onClearHighlights).toHaveBeenCalled();
  });
});
