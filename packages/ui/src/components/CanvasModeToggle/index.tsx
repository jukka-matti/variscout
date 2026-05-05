import { Lock, Unlock } from 'lucide-react';
import type { CanvasAuthoringMode } from '../Canvas';

export interface CanvasModeToggleProps {
  mode: CanvasAuthoringMode;
  onChange: (next: CanvasAuthoringMode) => void;
  disabled?: boolean;
}

export function CanvasModeToggle({ mode, onChange, disabled }: CanvasModeToggleProps) {
  const isAuthor = mode === 'author';
  const Icon = isAuthor ? Unlock : Lock;
  const nextMode: CanvasAuthoringMode = isAuthor ? 'read' : 'author';
  const label = isAuthor ? 'Lock canvas' : 'Edit canvas';
  const announcement = isAuthor
    ? 'Canvas authoring affordances visible'
    : 'Canvas authoring affordances hidden';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={label}
        aria-pressed={isAuthor}
        disabled={disabled}
        onClick={() => onChange(nextMode)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-edge bg-surface-primary text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon aria-hidden="true" size={16} />
      </button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
