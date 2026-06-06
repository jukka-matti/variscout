import React, { useEffect, useRef } from 'react';
import type { CaptureDraft } from '@variscout/hooks';

type EditableDraftFields = Pick<CaptureDraft, 'note' | 'proposedFactorName'>;

export interface CaptureCardProps {
  draft: CaptureDraft;
  variant?: 'popover' | 'bottom-sheet';
  onDraftChange: (patch: Partial<EditableDraftFields>) => void;
  onCapture: () => void;
  onFactorOnly?: () => void;
  onCancel: () => void;
  showCapture?: boolean;
}

export function CaptureCard({
  draft,
  variant = 'popover',
  onDraftChange,
  onCapture,
  onFactorOnly,
  onCancel,
  showCapture = true,
}: CaptureCardProps): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const canSaveFactor = onFactorOnly !== undefined;

  useEffect(() => {
    cardRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const shellClassName =
    variant === 'bottom-sheet'
      ? 'fixed inset-x-0 bottom-0 z-50 px-4 pb-4'
      : 'absolute right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))]';

  return (
    <div data-testid="capture-card-shell" className={shellClassName}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="capture-card-title"
        tabIndex={-1}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
      >
        <h2 id="capture-card-title" className="text-base font-semibold text-slate-950">
          New Finding
        </h2>

        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-600">Condition</dt>
            <dd className="mt-1 text-slate-950">{draft.conditionLabel}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Evidence</dt>
            <dd className="mt-1 text-slate-950">{draft.evidenceLabel}</dd>
          </div>
        </dl>

        {draft.proposedFactorName !== undefined ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Factor name
            <input
              value={draft.proposedFactorName}
              onChange={event => onDraftChange({ proposedFactorName: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm"
            />
          </label>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Note
          <textarea
            value={draft.note ?? ''}
            onChange={event => onDraftChange({ note: event.target.value })}
            rows={3}
            className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm"
          />
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          {canSaveFactor ? (
            <button
              type="button"
              onClick={onFactorOnly}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Factor only
            </button>
          ) : null}
          {showCapture ? (
            <button
              type="button"
              onClick={onCapture}
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
            >
              Capture
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
