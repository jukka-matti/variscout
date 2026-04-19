import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWallKeyboard } from '../hooks/useWallKeyboard';

describe('useWallKeyboard', () => {
  it('calls onNewHypothesis for N', () => {
    const onNewHypothesis = vi.fn();
    renderHook(() => useWallKeyboard({ onNewHypothesis }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(onNewHypothesis).toHaveBeenCalled();
  });

  it('calls onRunAndCheck for R', () => {
    const onRunAndCheck = vi.fn();
    renderHook(() => useWallKeyboard({ onRunAndCheck }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(onRunAndCheck).toHaveBeenCalled();
  });

  it('calls onToggleRail for cmd+/', () => {
    const onToggleRail = vi.fn();
    renderHook(() => useWallKeyboard({ onToggleRail }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', metaKey: true }));
    expect(onToggleRail).toHaveBeenCalled();
  });

  it('ignores keys while typing in inputs', () => {
    const onNewHypothesis = vi.fn();
    renderHook(() => useWallKeyboard({ onNewHypothesis }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    // Dispatch on the input so target is the input element
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
    expect(onNewHypothesis).not.toHaveBeenCalled();
    input.remove();
  });
});
