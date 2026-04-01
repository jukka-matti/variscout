import React from 'react';
import type { JournalEntry } from '@variscout/hooks';

export interface JournalEntryRowProps {
  entry: JournalEntry;
  onClick?: (entry: JournalEntry) => void;
}

function getDotClass(type: JournalEntry['type']): string {
  switch (type) {
    case 'finding-created':
      return 'bg-purple-500';
    case 'question-answered':
      return 'bg-green-500';
    case 'question-ruled-out':
      return 'bg-red-400';
    case 'note-added':
      return 'bg-slate-400';
    case 'gemba-observation':
      return 'bg-amber-500';
    case 'observation-linked':
      return 'bg-slate-400';
    case 'problem-statement':
      return 'bg-purple-700 ring-2 ring-purple-400/40';
    default:
      return 'bg-slate-400';
  }
}

const JournalEntryRow: React.FC<JournalEntryRowProps> = ({ entry, onClick }) => {
  const timeString = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dotClass = getDotClass(entry.type);

  const handleClick = onClick ? () => onClick(entry) : undefined;

  return (
    <div
      className={`relative flex gap-3 pb-4 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(entry);
            }
          : undefined
      }
      data-testid="journal-entry-row"
    >
      {/* Dot on the timeline line */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-content leading-snug flex-1 min-w-0 truncate">
            {entry.text}
          </span>
          <span className="text-[0.625rem] text-content-muted flex-shrink-0 tabular-nums">
            {timeString}
          </span>
        </div>
        {entry.detail && (
          <div className="text-[0.6875rem] text-content-secondary mt-0.5 leading-snug">
            {entry.detail}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntryRow;
