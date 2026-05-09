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

  // ── Undo / redo bindings (Phase 7.3) ──────────────────────────────────────

  it('calls onUndo for cmd+z', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useWallKeyboard({ onUndo, onRedo }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('calls onUndo for ctrl+z (Windows)', () => {
    const onUndo = vi.fn();
    renderHook(() => useWallKeyboard({ onUndo }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onRedo for cmd+shift+z', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useWallKeyboard({ onUndo, onRedo }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, shiftKey: true }));
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('calls onRedo for cmd+y (Windows-style redo)', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useWallKeyboard({ onUndo, onRedo }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', metaKey: true }));
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('does not fire undo/redo while typing in an input', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useWallKeyboard({ onUndo, onRedo }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', metaKey: true, bubbles: true }));
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
    input.remove();
  });
});
