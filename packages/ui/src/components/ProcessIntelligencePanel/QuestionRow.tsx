import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Check, X, MessageCircle } from 'lucide-react';
import type { Question, Finding } from '@variscout/core/findings';
import { QUESTION_STATUS_COLORS, FINDING_STATUS_LABELS } from '@variscout/core/findings';

export interface QuestionRowProps {
  question: Question;
  findings: Finding[];
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: (question: Question) => void;
  onToggleExpand?: (questionId: string) => void;
  /** Mode-aware evidence label (default: R²adj) */
  evidenceLabel?: string;
  /** Projected Cpk if this question's factor is resolved (for expanded detail) */
  projectedCpk?: number;
  /** Current process Cpk (for expanded improvement %) */
  currentCpk?: number;
  /** Called when a note is added to a finding */
  onAddNote?: (findingId: string, text: string) => void;
}

/** Status dot colors for finding statuses (used in expanded section) */
const FINDING_STATUS_DOT: Record<string, string> = {
  observed: 'bg-amber-500',
  investigating: 'bg-blue-500',
  analyzed: 'bg-purple-500',
  improving: 'bg-green-500',
  resolved: 'bg-slate-400',
};

/** Left border color per question display status */
const STATUS_BORDER: Record<string, string> = {
  answered: 'border-l-green-500',
  investigating: 'border-l-blue-500',
  open: 'border-l-amber-500',
  'ruled-out': 'border-l-slate-500',
};

/** Status icon per question display status */
function StatusIcon({ status }: { status: string }): React.ReactElement {
  if (status === 'answered') {
    return <Check size={10} className="text-green-500 shrink-0" aria-hidden="true" />;
  }
  if (status === 'ruled-out') {
    return <X size={10} className="text-slate-400 shrink-0" aria-hidden="true" />;
  }
  // open / investigating — colored dot
  const dotColor = status === 'investigating' ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
  );
}

/**
 * QuestionRow — a single row in the Questions tab of the PI panel.
 *
 * Shows: status indicator, factor name + "?", evidence %, finding count,
 * expand chevron, and an active indicator when the user is drilling this factor.
 */
const QuestionRow: React.FC<QuestionRowProps> = ({
  question,
  findings,
  isActive = false,
  isExpanded = false,
  onClick,
  onToggleExpand,
  evidenceLabel = 'R²adj',
  projectedCpk,
  currentCpk,
  onAddNote,
}) => {
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const displayStatus = question.status;
  const statusColor = QUESTION_STATUS_COLORS[displayStatus];
  const borderColor = STATUS_BORDER[displayStatus] ?? 'border-l-slate-500';
  const isRuledOut = displayStatus === 'ruled-out';

  const evidencePct =
    question.evidence?.rSquaredAdj !== undefined
      ? Math.round(question.evidence.rSquaredAdj * 100)
      : null;

  const factorLabel = question.factor ? `${question.factor}?` : question.text;

  const handleClick = (): void => {
    onClick?.(question);
  };

  const handleExpandClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onToggleExpand?.(question.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(question);
    }
  };

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
    <>
      <div
        data-testid={`question-row-${question.id}`}
        data-factor={question.factor ?? undefined}
        className={[
          'relative flex items-center gap-1.5 px-2 py-1 border-l-2',
          'text-xs select-none transition-colors',
          borderColor,
          isActive ? 'bg-surface-tertiary' : 'hover:bg-surface-secondary',
          isRuledOut ? 'opacity-40' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Status icon */}
        <StatusIcon status={displayStatus} />

        {/* Primary click target: factor label with ::after overlay */}
        <button
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-pressed={isActive}
          className={[
            'flex-1 truncate text-content text-left bg-transparent border-none p-0 cursor-pointer',
            'after:absolute after:inset-0',
            isRuledOut ? 'line-through' : '',
            isActive ? 'font-medium' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={factorLabel}
        >
          {factorLabel}
        </button>

        {/* Evidence % */}
        {evidencePct !== null && (
          <span
            className={`font-mono shrink-0 ${statusColor}`}
            aria-label={`${evidenceLabel} ${evidencePct}%`}
          >
            {evidencePct}%
          </span>
        )}

        {/* Finding count badge */}
        {findings.length > 0 && (
          <span
            className="shrink-0 text-[0.5625rem] bg-purple-500/15 text-purple-400 rounded px-1 leading-4"
            aria-label={`${findings.length} finding${findings.length !== 1 ? 's' : ''}`}
          >
            {findings.length}
          </span>
        )}

        {/* Active indicator */}
        {isActive && (
          <span className="shrink-0 text-blue-400 text-[0.625rem]" aria-hidden="true">
            ◀
          </span>
        )}

        {/* Expand/collapse chevron — z-10 to sit above ::after overlay */}
        <button
          type="button"
          onClick={handleExpandClick}
          aria-label={isExpanded ? 'Collapse findings' : 'Expand findings'}
          className="relative z-10 shrink-0 text-content-muted hover:text-content transition-colors p-0.5 rounded"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* Expanded detail section */}
      {isExpanded && (
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
                      className="text-[0.5625rem] text-content-muted shrink-0 flex items-center"
                      aria-label={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
                    >
                      <MessageCircle size={10} className="inline" />
                      <span className="ml-0.5">{commentCount}</span>
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
            <div className="text-[0.6875rem] text-content-muted italic py-0.5">
              No findings yet.
            </div>
          )}

          {/* Cpk projection card */}
          {projectedCpk !== undefined && (
            <div
              className="border border-dashed border-edge/60 rounded px-2 py-1.5 mt-0.5"
              data-testid={`projection-card-${question.id}`}
            >
              <div className="text-[0.6875rem] text-content-secondary leading-snug">
                If{' '}
                <span className="font-medium text-content">{question.factor ?? 'this factor'}</span>{' '}
                is fixed →{' '}
                <span className="font-mono text-green-400">Cpk {projectedCpk.toFixed(2)}</span>
                {cpkImprovement !== null && cpkImprovement > 0 && (
                  <span className="text-green-500 ml-1">(+{cpkImprovement}%)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default QuestionRow;
