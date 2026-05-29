import { useEffect } from 'react';

export interface UseCanvasKeyboardArgs {
  onUndo: () => void;
  onRedo: () => void;
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

/**
 * Canvas-scoped keyboard shortcuts. PR-LV1-C retired the `onToggleMode`
 * (`E`) + `onExitAuthorMode` (`Escape`) shortcuts when the State/Edit
 * binary disappeared — canvas is always directly editable, so there is
 * no mode to toggle.
 */
export function useCanvasKeyboard({ onUndo, onRedo }: UseCanvasKeyboardArgs): void {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRedo, onUndo]);
}
