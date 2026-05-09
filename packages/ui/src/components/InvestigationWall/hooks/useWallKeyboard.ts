import { useEffect } from 'react';

export interface UseWallKeyboardOptions {
  onNewHypothesis?: () => void;
  onNewQuestion?: () => void;
  onRunAndCheck?: () => void;
  onFit?: () => void;
  onSnapRiver?: () => void;
  onToggleRail?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
}

export function useWallKeyboard(options: UseWallKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === '/') {
        e.preventDefault();
        options.onToggleRail?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        options.onSearch?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        options.onRedo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        options.onUndo?.();
        return;
      }
      // Cmd/Ctrl + Y — Windows-style redo shortcut, equivalent to Cmd+Shift+Z.
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        options.onRedo?.();
        return;
      }

      if (e.key === 'Escape') {
        options.onEscape?.();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        options.onDelete?.();
        return;
      }

      // Unmodified single-letter shortcuts
      switch (e.key.toLowerCase()) {
        case 'n':
          options.onNewHypothesis?.();
          return;
        case 'q':
          options.onNewQuestion?.();
          return;
        case 'r':
          options.onRunAndCheck?.();
          return;
        case 'f':
          options.onFit?.();
          return;
        case 's':
          options.onSnapRiver?.();
          return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options]);
}
