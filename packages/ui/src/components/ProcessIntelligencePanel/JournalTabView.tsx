import React from 'react';
import type { JournalEntry } from '@variscout/hooks';
import JournalEntryRow from './JournalEntryRow';

export interface JournalTabViewProps {
  entries: JournalEntry[];
  onEntryClick?: (entry: JournalEntry) => void;
  onIncludeInReport?: () => void;
}

const JournalTabView: React.FC<JournalTabViewProps> = ({
  entries,
  onEntryClick,
  onIncludeInReport,
}) => {
  return (
    <div className="flex flex-col h-full" data-testid="journal-tab-view">
      {/* Subtitle */}
      <p className="text-[0.6875rem] text-content-muted mb-3 leading-snug">
        Investigation timeline — every analytical step recorded
      </p>

      {/* Timeline */}
      <div className="flex-1 overflow-auto min-h-0">
        {entries.length === 0 ? (
          <div
            className="flex items-center justify-center h-24 text-content-muted italic text-sm"
            data-testid="journal-empty-state"
          >
            No investigation activity yet
          </div>
        ) : (
          <div className="relative pl-4 border-l-2 border-edge" data-testid="journal-timeline">
            {entries.map(entry => (
              <JournalEntryRow key={entry.id} entry={entry} onClick={onEntryClick} />
            ))}
          </div>
        )}
      </div>

      {/* Footer action */}
      {onIncludeInReport && entries.length > 0 && (
        <div className="pt-3 border-t border-edge mt-3">
          <button
            type="button"
            onClick={onIncludeInReport}
            className="w-full text-xs text-content-secondary hover:text-content border border-edge rounded-lg px-3 py-1.5 transition-colors"
            data-testid="journal-include-in-report"
          >
            Include in Report
          </button>
        </div>
      )}
    </div>
  );
};

export default JournalTabView;
