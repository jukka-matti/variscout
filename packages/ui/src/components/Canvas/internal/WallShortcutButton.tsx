import { ExternalLink } from 'lucide-react';

export interface WallShortcutButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function WallShortcutButton({ onClick, disabled }: WallShortcutButtonProps) {
  return (
    <button
      type="button"
      aria-label="Open Wall"
      title="Open the Investigation Wall"
      disabled={disabled}
      data-testid="canvas-wall-shortcut-button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface-primary px-2 py-1 text-xs font-medium text-content-secondary hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ExternalLink aria-hidden="true" data-testid="canvas-wall-shortcut-icon" size={13} />
      <span>Open Wall</span>
    </button>
  );
}
