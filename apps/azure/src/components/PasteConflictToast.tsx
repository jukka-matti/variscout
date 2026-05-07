// PasteConflictToast.tsx
// Subscribes to the paste-conflict event channel and renders a blocking modal
// when ETag-conditional snapshot catalog writes are exhausted after all retries
// (F3.6-β P5.1 — Option A, modal-only).
//
// UX decision (Option A): The `updateBlobEvidenceSnapshotsConditional` wrapper
// retries internally (3×, 100/200/400 ms backoff) before emitting a
// `concurrency-exhausted` event. There is no event for "retry in progress",
// so a non-blocking toast as originally specced would never fire. We ship only
// the blocking modal on exhaustion — cleaner UX for a rare edge case.
//
// i18n decision: English literals are used directly. The paste-conflict surface
// is narrow (one rare concurrency scenario) and adding catalog keys adds setup
// cost disproportionate to scope. Backfill via `adding-i18n-messages` skill if
// the message catalog is extended to cover azure-sync strings.
//
// "Try again" action: clears the modal. Re-dispatching the paste is not
// implemented here — the user's next paste or sync cycle naturally succeeds,
// and re-queueing old snapshot data risks partial duplicate writes. A future
// enhancement could integrate with the action layer (P5.2 / F4 scope).

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { subscribePasteConflict } from '../services/cloudSync';
import type { PasteConflictEvent } from '../services/cloudSync';

export const PasteConflictToast: React.FC = () => {
  const [latestEvent, setLatestEvent] = useState<PasteConflictEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePasteConflict(event => {
      // Latest-wins: a newer conflict replaces any earlier one still shown.
      setLatestEvent(event);
    });
    return unsubscribe;
  }, []);

  const dismiss = () => setLatestEvent(null);

  if (latestEvent === null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-conflict-title"
      aria-describedby="paste-conflict-body"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      data-testid="paste-conflict-modal"
    >
      <div className="bg-surface flex flex-col w-full max-w-sm rounded-lg shadow-xl border border-edge overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <h2
            id="paste-conflict-title"
            className="font-semibold text-content text-base leading-snug"
          >
            Multiple teammates are updating this hub
          </h2>
        </div>

        {/* Body */}
        <p id="paste-conflict-body" className="px-4 pb-4 text-sm text-content/70 leading-relaxed">
          Pausing your paste — please retry in a moment.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-edge">
          <button
            onClick={dismiss}
            className="text-sm px-3 py-1.5 rounded-lg border border-edge bg-surface-secondary text-content/70 hover:text-content transition-colors"
            data-testid="paste-conflict-dismiss"
          >
            Dismiss
          </button>
          <button
            onClick={dismiss}
            className="text-sm px-4 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            data-testid="paste-conflict-try-again"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};
