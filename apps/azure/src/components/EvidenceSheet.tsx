import React from 'react';
import { X } from 'lucide-react';
import type { Finding, ProcessStateItem } from '@variscout/core';

export interface EvidenceSheetProps {
  /** When null, sheet is hidden. */
  item: ProcessStateItem | null;
  /** Null while loading; empty array when no findings. */
  findings: readonly Finding[] | null;
  onSelectFinding: (finding: Finding) => void;
  onClose: () => void;
}

const STATUS_LABELS: Record<Finding['status'], string> = {
  observed: 'Observed',
  investigating: 'Investigating',
  analyzed: 'Analyzed',
  improving: 'Improving',
  resolved: 'Resolved',
};

const EvidenceSheet: React.FC<EvidenceSheetProps> = ({
  item,
  findings,
  onSelectFinding,
  onClose,
}) => {
  React.useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden />
      <div
        data-testid="evidence-sheet"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-lg border-t border-edge bg-surface p-4 shadow-lg"
        role="dialog"
        aria-label="Findings linked to state item"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content">{item.label}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-content-secondary hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        {findings === null ? (
          <p className="py-6 text-center text-sm text-content-secondary">Loading findings…</p>
        ) : findings.length === 0 ? (
          <p className="py-6 text-center text-sm text-content-secondary">
            No findings recorded for this item yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {findings.map(finding => (
              <li
                key={finding.id}
                className="cursor-pointer rounded-md border border-edge p-2 hover:bg-surface-hover"
                onClick={() => onSelectFinding(finding)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-content">{finding.text}</span>
                  <span className="rounded-sm border border-current px-2 py-0.5 text-xs font-medium text-content-secondary">
                    {STATUS_LABELS[finding.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default EvidenceSheet;
