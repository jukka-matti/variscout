import type { ProcessMapArrow } from '@variscout/core/frame';

export interface StepArrowProps {
  arrow: ProcessMapArrow;
  fromLabel: string;
  toLabel: string;
  onDisconnect?: (fromStepId: string, toStepId: string) => void;
}

export function StepArrow({ arrow, fromLabel, toLabel, onDisconnect }: StepArrowProps) {
  return (
    <div
      data-testid={`process-map-explicit-arrow-${arrow.id}`}
      className="flex items-center gap-1 text-content-secondary"
      aria-label={`Connection from ${fromLabel} to ${toLabel}`}
    >
      <svg width="40" height="12" viewBox="0 0 40 12" aria-hidden="true" className="shrink-0">
        <path d="M1 6H34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M29 2L35 6L29 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {onDisconnect ? (
        <button
          type="button"
          aria-label={`Disconnect ${fromLabel} to ${toLabel}`}
          onClick={() => onDisconnect(arrow.fromStepId, arrow.toStepId)}
          className="rounded px-1 text-xs text-content-secondary hover:bg-surface-tertiary hover:text-content"
        >
          x
        </button>
      ) : null}
    </div>
  );
}
