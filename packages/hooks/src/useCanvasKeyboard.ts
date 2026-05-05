import { useEffect } from 'react';

export interface UseCanvasKeyboardArgs {
  onUndo: () => void;
  onRedo: () => void;
  onToggleMode: () => void;
  onExitAuthorMode: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export function useCanvasKeyboard({
  onUndo,
  onRedo,
  onToggleMode,
  onExitAuthorMode,
}: UseCanvasKeyboardArgs): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const command = event.metaKey || event.ctrlKey;

      if (command && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if (event.ctrlKey && key === 'y') {
        event.preventDefault();
        onRedo();
        return;
      }

      if (!command && !event.altKey && !event.shiftKey && key === 'e') {
        event.preventDefault();
        onToggleMode();
        return;
      }

      if (event.key === 'Escape') {
        onExitAuthorMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitAuthorMode, onRedo, onToggleMode, onUndo]);
}
