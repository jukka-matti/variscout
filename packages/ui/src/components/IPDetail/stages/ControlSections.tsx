import React from 'react';
import type { ControlRecord, ControlHandoff } from '@variscout/core';

interface SustainmentSectionsProps {
  record: ControlRecord;
  onOpenLegacy?: () => void;
  /** Optional ControlHandoff entity when closure is in progress. */
  controlHandoff?: ControlHandoff;
  /** Called when user clicks "Open legacy Handoff panel" from closure section. */
  onOpenLegacyHandoff?: () => void;
}

const ControlSections: React.FC<SustainmentSectionsProps> = ({
  record,
  onOpenLegacy,
  controlHandoff,
  onOpenLegacyHandoff,
}) => {
  const handoffTitle = controlHandoff
    ? ((controlHandoff as { title?: string }).title ?? 'Control handoff')
    : null;

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
        Control record · {record.title}
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        The Control authoring form (cadence picker, override toggle, latest review) is reachable
        today via the legacy Control activeView. This Sections-mode embedding will inline the same
        form in a follow-up plan; for V1 we link out.
      </p>
      <button
        type="button"
        onClick={onOpenLegacy}
        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
        data-testid="sustainment-open-legacy"
      >
        Open legacy Control panel
      </button>

      {controlHandoff && (
        <div className="space-y-3 border-t border-edge pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
            Control handoff · {handoffTitle}
          </div>
          <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
            The Handoff authoring form (control plan text, owner FK, training FK, acknowledgment
            toggle) is reachable today via the legacy Handoff activeView. This Sections-mode
            embedding will inline the same form in a follow-up plan; for V1 we link out.
          </p>
          <button
            type="button"
            onClick={onOpenLegacyHandoff}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
            data-testid="sustainment-closure-open-legacy"
          >
            Open legacy Handoff panel
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlSections;
