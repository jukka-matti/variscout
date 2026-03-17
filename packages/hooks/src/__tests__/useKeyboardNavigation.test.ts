/**
 * Tests for useKeyboardNavigation hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

function fireKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

describe('useKeyboardNavigation', () => {
  let onNext: () => void;
  let onPrev: () => void;
  let onEscape: () => void;

  beforeEach(() => {
    onNext = vi.fn() as unknown as () => void;
    onPrev = vi.fn() as unknown as () => void;
    onEscape = vi.fn() as unknown as () => void;
  });

  it('does not fire callbacks when focusedItem is null', () => {
    renderHook(() =>
      useKeyboardNavigation({
        focusedItem: null,
        onNext,
        onPrev,
        onEscape,
      })
    );

    fireKey('ArrowRight');
    fireKey('ArrowLeft');
    fireKey('Escape');

    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('ArrowRight calls onNext when focused', () => {
    renderHook(() =>
      useKeyboardNavigation({
        focusedItem: 'chart-1',
        onNext,
        onPrev,
        onEscape,
      })
    );

    fireKey('ArrowRight');

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('ArrowLeft calls onPrev when focused', () => {
    renderHook(() =>
      useKeyboardNavigation({
        focusedItem: 'chart-1',
        onNext,
        onPrev,
        onEscape,
      })
    );

    fireKey('ArrowLeft');

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('Escape calls onEscape when focused', () => {
    renderHook(() =>
      useKeyboardNavigation({
        focusedItem: 'chart-1',
        onNext,
        onPrev,
        onEscape,
      })
    );

    fireKey('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    renderHook(() =>
      useKeyboardNavigation({
        focusedItem: 'chart-1',
        onNext,
        onPrev,
        onEscape,
      })
    );

    fireKey('Enter');
    fireKey('Tab');
    fireKey('a');
    fireKey(' ');

    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('enabled=false disables all callbacks', () => {
    renderHook(() =>
      useKeyboardNavigation({
        focusedItem: 'chart-1',
        onNext,
        onPrev,
        onEscape,
        enabled: false,
      })
    );

    fireKey('ArrowRight');
    fireKey('ArrowLeft');
    fireKey('Escape');

    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() =>
      useKeyboardNavigation({
        focusedItem: 'chart-1',
        onNext,
        onPrev,
        onEscape,
      })
    );

    // Verify callbacks work before unmount
    fireKey('ArrowRight');
    expect(onNext).toHaveBeenCalledTimes(1);

    unmount();

    // After unmount, callbacks should not fire
    fireKey('ArrowRight');
    expect(onNext).toHaveBeenCalledTimes(1); // Still 1, not 2
  });
});
