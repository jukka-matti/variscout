import React, { useState } from 'react';
import type { Hypothesis, Finding } from '@variscout/core/findings';
import { FINDING_STATUS_LABELS } from '@variscout/core/findings';

export interface QuestionRowExpandedProps {
  question: Hypothesis;
  findings: Finding[];
  projectedCpk?: number;
  currentCpk?: number;
  onAddNote?: (findingId: string, text: string) => void;
}

/** Status dot colors for finding statuses */
const FINDING_STATUS_DOT: Record<string, string> = {
  observed: 'bg-amber-500',
  investigating: 'bg-blue-500',
  analyzed: 'bg-purple-500',
  improving: 'bg-green-500',
  resolved: 'bg-slate-400',
};

/**
 * QuestionRowExpanded — expanded content beneath a QuestionRow.
 *
 * Shows nested finding cards, an inline note input, and an optional Cpk
 * projection card when `projectedCpk` is provided.
 */
const QuestionRowExpanded: React.FC<QuestionRowExpandedProps> = ({
  question,
  findings,
  projectedCpk,
  currentCpk,
  onAddNote,
}) => {
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const handleNoteChange = (findingId: string, value: string): void => {
    setNoteInputs(prev => ({ ...prev, [findingId]: value }));
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, findingId: string): void => {
    if (e.key === 'Enter') {
      const text = noteInputs[findingId]?.trim();
      if (text) {
        onAddNote?.(findingId, text);
        setNoteInputs(prev => ({ ...prev, [findingId]: '' }));
      }
    }
  };

  const cpkImprovement =
    projectedCpk !== undefined && currentCpk !== undefined
      ? Math.round(((projectedCpk - currentCpk) / Math.abs(currentCpk)) * 100)
      : null;

  return (
    <div
      className="ml-3.5 border-l border-edge/50 pl-2 pb-1 flex flex-col gap-1"
      data-testid={`question-row-expanded-${question.id}`}
    >
      {/* Finding cards */}
      {findings.map(finding => {
        const dotColor = FINDING_STATUS_DOT[finding.status] ?? 'bg-slate-400';
        const statusLabel = FINDING_STATUS_LABELS[finding.status];
        const commentCount = finding.comments.length;

        return (
          <div
            key={finding.id}
            className="border-l-2 border-l-purple-500/60 bg-surface-secondary rounded-r px-2 py-1 flex flex-col gap-1"
            data-testid={`expanded-finding-${finding.id}`}
          >
            {/* Finding header */}
            <div className="flex items-start gap-1.5">
              <span
                className={`mt-1 inline-block w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}
                aria-label={statusLabel}
              />
              <span className="text-xs text-content leading-tight flex-1 line-clamp-2">
                {finding.text}
              </span>
              {commentCount > 0 && (
                <span
                  className="text-[0.5625rem] text-content-muted shrink-0"
                  aria-label={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
                >
                  {commentCount}💬
                </span>
              )}
            </div>

            {/* Inline note input */}
            {onAddNote && (
              <input
                type="text"
                placeholder="Add a note..."
                value={noteInputs[finding.id] ?? ''}
                onChange={e => handleNoteChange(finding.id, e.target.value)}
                onKeyDown={e => handleNoteKeyDown(e, finding.id)}
                aria-label="Add a note to this finding"
                className="w-full bg-transparent border-b border-edge/40 text-[0.6875rem] text-content placeholder:text-content-muted focus:outline-none focus:border-blue-500/60 py-0.5 transition-colors"
                data-testid={`note-input-${finding.id}`}
              />
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {findings.length === 0 && (
        <div className="text-[0.6875rem] text-content-muted italic py-0.5">No findings yet.</div>
      )}

      {/* Cpk projection card */}
      {projectedCpk !== undefined && (
        <div
          className="border border-dashed border-edge/60 rounded px-2 py-1.5 mt-0.5"
          data-testid={`projection-card-${question.id}`}
        >
          <div className="text-[0.6875rem] text-content-secondary leading-snug">
            If <span className="font-medium text-content">{question.factor ?? 'this factor'}</span>{' '}
            is fixed →{' '}
            <span className="font-mono text-green-400">Cpk {projectedCpk.toFixed(2)}</span>
            {cpkImprovement !== null && cpkImprovement > 0 && (
              <span className="text-green-500 ml-1">(+{cpkImprovement}%)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionRowExpanded;
