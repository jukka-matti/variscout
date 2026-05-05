import React from 'react';
import { formatStatistic } from '@variscout/core/i18n';
import type { CanvasStepCardModel } from '@variscout/hooks';

interface CanvasStepOverlayProps {
  card: CanvasStepCardModel;
  onClose: () => void;
  onQuickAction?: (stepId: string) => void;
  onFocusedInvestigation?: (stepId: string) => void;
}

export const CanvasStepOverlay: React.FC<CanvasStepOverlayProps> = ({
  card,
  onClose,
  onQuickAction,
  onFocusedInvestigation,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" data-testid="canvas-step-overlay-root">
      <button
        type="button"
        aria-label="Close step overlay"
        className="absolute inset-0 h-full w-full bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${card.stepName} drill-down`}
        className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-auto rounded-t-lg border border-edge bg-surface-primary p-4 shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-24 md:w-[440px] md:-translate-x-1/2 md:rounded-lg"
        data-testid="canvas-step-overlay"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-content">{card.stepName}</h3>
            <p className="text-sm text-content-secondary">
              {card.metricColumn ?? 'No metric selected'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-content-secondary hover:bg-surface-secondary hover:text-content"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-md bg-surface-secondary p-3">
            <h4 className="text-xs font-semibold uppercase text-content-muted">Step analysis</h4>
            <p className="mt-1 text-content-secondary">
              {card.metricKind === 'numeric' && card.stats
                ? `Mean ${formatStatistic(card.stats.mean, 'en', 2)}; sigma ${formatStatistic(card.stats.stdDev, 'en', 2)}; n=${card.capability.n}`
                : card.metricKind === 'categorical'
                  ? `${card.distribution.length} observed categories`
                  : 'No metric is mapped to this step yet.'}
            </p>
          </div>

          <div className="rounded-md bg-surface-secondary p-3">
            <h4 className="text-xs font-semibold uppercase text-content-muted">Assigned columns</h4>
            <p className="mt-1 text-content-secondary">
              {card.assignedColumns.length > 0 ? card.assignedColumns.join(', ') : 'None'}
            </p>
          </div>

          <div className="rounded-md bg-surface-secondary p-3">
            <h4 className="text-xs font-semibold uppercase text-content-muted">
              Linked investigations
            </h4>
            <p className="mt-1 text-content-secondary">No linked investigations in PR5.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onQuickAction?.(card.stepId)}
            className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content hover:bg-surface-tertiary"
          >
            Quick action
          </button>
          <button
            type="button"
            onClick={() => onFocusedInvestigation?.(card.stepId)}
            className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content hover:bg-surface-tertiary"
          >
            Focused investigation
          </button>
          <button
            type="button"
            disabled
            className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content-muted opacity-60"
          >
            Charter
          </button>
          <button
            type="button"
            disabled
            className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content-muted opacity-60"
          >
            Sustainment
          </button>
          <button
            type="button"
            disabled
            className="rounded-md border border-edge bg-surface-secondary px-3 py-2 text-sm font-medium text-content-muted opacity-60 sm:col-span-2"
          >
            Handoff
          </button>
        </div>
      </section>
    </div>
  );
};
