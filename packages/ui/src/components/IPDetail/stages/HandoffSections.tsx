import React from 'react';
import type { ControlHandoff } from '@variscout/core';

interface HandoffSectionsProps {
  handoff: ControlHandoff;
  onOpenLegacy?: () => void;
}

const HandoffSections: React.FC<HandoffSectionsProps> = ({ handoff, onOpenLegacy }) => {
  const title = (handoff as { title?: string }).title ?? 'Control handoff';
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
        Control handoff · {title}
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        The Handoff authoring form (control plan text, owner FK, training FK, acknowledgment toggle)
        is reachable today via the legacy Handoff activeView. This Sections-mode embedding will
        inline the same form in a follow-up plan; for V1 we link out.
      </p>
      <button
        type="button"
        onClick={onOpenLegacy}
        className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100"
        data-testid="handoff-open-legacy"
      >
        Open legacy Handoff panel
      </button>
    </div>
  );
};

export default HandoffSections;
