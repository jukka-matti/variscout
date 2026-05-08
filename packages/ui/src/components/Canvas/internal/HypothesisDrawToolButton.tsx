import { Waypoints } from 'lucide-react';
import type { CanvasToolId } from '@variscout/hooks';

export interface HypothesisDrawToolButtonProps {
  activeTool: CanvasToolId;
  onChange: (next: CanvasToolId) => void;
  disabled?: boolean;
}

export function HypothesisDrawToolButton({
  activeTool,
  onChange,
  disabled,
}: HypothesisDrawToolButtonProps) {
  const isActive = activeTool === 'draw-hypothesis';
  const nextTool: CanvasToolId = isActive ? 'select' : 'draw-hypothesis';

  return (
    <button
      type="button"
      aria-label="Draw hypothesis"
      aria-pressed={isActive}
      title={isActive ? 'Exit hypothesis drawing' : 'Draw a hypothesis arrow'}
      disabled={disabled}
      data-testid="hypothesis-draw-tool-button"
      onClick={() => onChange(nextTool)}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
        isActive
          ? 'border-status-info bg-status-info-soft text-status-info'
          : 'border-edge bg-surface-primary text-content-secondary hover:bg-surface-secondary hover:text-content',
        'disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      <Waypoints aria-hidden="true" size={16} />
    </button>
  );
}
