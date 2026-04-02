import React from 'react';
import { ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import type { Question, Finding } from '@variscout/core/findings';
import { QUESTION_STATUS_COLORS } from '@variscout/core/findings';

export interface QuestionRowProps {
  question: Question;
  findings: Finding[];
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: (question: Question) => void;
  onToggleExpand?: (questionId: string) => void;
  /** Mode-aware evidence label (default: R²adj) */
  evidenceLabel?: string;
}

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
}) => {
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

  return (
    <div
      data-testid={`question-row-${question.id}`}
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
  );
};

export default QuestionRow;
