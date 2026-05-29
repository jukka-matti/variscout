import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCanvasKeyboard } from '../useCanvasKeyboard';

interface KeydownInit {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

function keydown(init: KeydownInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
}

describe('useCanvasKeyboard', () => {
  it('maps Cmd/Ctrl+Z to undo and redo variants to redo', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    renderHook(() => useCanvasKeyboard({ onUndo, onRedo }));

    keydown({ key: 'z', metaKey: true });
    keydown({ key: 'z', ctrlKey: true });
    keydown({ key: 'z', metaKey: true, shiftKey: true });
    keydown({ key: 'y', ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(2);
    expect(onRedo).toHaveBeenCalledTimes(2);
  });

  it('removes the listener on cleanup', () => {
    const onUndo = vi.fn();
    const { unmount } = renderHook(() =>
      useCanvasKeyboard({
        onUndo,
        onRedo: vi.fn(),
      })
    );

    unmount();
    keydown({ key: 'z', metaKey: true });

    expect(onUndo).not.toHaveBeenCalled();
  });
});
