import React from 'react';
import { ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import type { Hypothesis, Finding } from '@variscout/core/findings';
import { getQuestionDisplayStatus, QUESTION_STATUS_COLORS } from '@variscout/core/findings';

export interface QuestionRowProps {
  question: Hypothesis;
  findings: Finding[];
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: (question: Hypothesis) => void;
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
  const displayStatus = getQuestionDisplayStatus(question.status);
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
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-expanded={isExpanded}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`question-row-${question.id}`}
      className={[
        'flex items-center gap-1.5 px-2 py-1 border-l-2 cursor-pointer',
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

      {/* Factor label */}
      <span
        className={[
          'flex-1 truncate text-content',
          isRuledOut ? 'line-through' : '',
          isActive ? 'font-medium' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title={factorLabel}
      >
        {factorLabel}
      </span>

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

      {/* Expand/collapse chevron */}
      <button
        type="button"
        onClick={handleExpandClick}
        aria-label={isExpanded ? 'Collapse findings' : 'Expand findings'}
        className="shrink-0 text-content-muted hover:text-content transition-colors p-0.5 rounded"
        tabIndex={-1}
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
    </div>
  );
};

export default QuestionRow;
