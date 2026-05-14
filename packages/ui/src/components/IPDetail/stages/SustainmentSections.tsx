import React from 'react';
import type { SustainmentRecord } from '@variscout/core';

interface SustainmentSectionsProps {
  record: SustainmentRecord;
  onOpenLegacy?: () => void;
}

const SustainmentSections: React.FC<SustainmentSectionsProps> = ({ record, onOpenLegacy }) => {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
        Sustainment record · {record.title}
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        The Sustainment authoring form (cadence picker, override toggle, latest review) is reachable
        today via the legacy Sustainment activeView. This Sections-mode embedding will inline the
        same form in a follow-up plan; for V1 we link out.
      </p>
      <button
        type="button"
        onClick={onOpenLegacy}
        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
        data-testid="sustainment-open-legacy"
      >
        Open legacy Sustainment panel
      </button>
    </div>
  );
};

export default SustainmentSections;
