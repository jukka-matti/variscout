import { useEffect } from 'react';

export interface AutoStepCreatePromptPosition {
  x: number;
  y: number;
}

export interface AutoStepCreatePromptProps {
  chipLabel: string;
  position: AutoStepCreatePromptPosition;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AutoStepCreatePrompt({
  chipLabel,
  position,
  onConfirm,
  onCancel,
}: AutoStepCreatePromptProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`Create step for ${chipLabel}`}
      tabIndex={-1}
      className="z-20 w-64 rounded-md border border-edge bg-surface-primary p-3 text-sm text-content shadow-lg"
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      <div className="mb-3">
        <p className="text-xs font-medium uppercase text-content-muted">Unassigned column</p>
        <p className="mt-1 truncate font-semibold text-content">{chipLabel}</p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-edge bg-surface-secondary px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          Create step
        </button>
      </div>
    </div>
  );
}
