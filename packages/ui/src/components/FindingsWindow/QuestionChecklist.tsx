import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';
import type { Hypothesis } from '@variscout/core';

export interface QuestionChecklistProps {
  /** Questions (Hypothesis objects with questionSource set) */
  questions: Hypothesis[];
  /** Current issue statement text */
  issueStatement?: string;
  /** Callback when issue statement is edited */
  onIssueStatementChange?: (text: string) => void;
  /** Callback when a question is clicked — should switch dashboard to show evidence */
  onQuestionClick?: (question: Hypothesis) => void;
  /** Callback to answer a question (link finding) */
  onAnswerQuestion?: (questionId: string) => void;
  /** CoScout-suggested sharpened issue statement (shown when available) */
  suggestedIssueStatement?: string;
  /** Callback when user accepts the suggested sharpening */
  onAcceptSuggestion?: () => void;
  /** Callback when user dismisses the suggestion */
  onDismissSuggestion?: () => void;
  /** Formulated problem statement (shown when enough questions answered) */
  problemStatement?: string;
  /** Whether the problem statement is complete (Watson's 3 questions answered) */
  isProblemStatementComplete?: boolean;
  /** Mode-specific evidence label (e.g., "R²adj", "Cpk impact", "Waste %") */
  evidenceLabel?: string;
}

const ISSUE_STATEMENT_MAX = 500;

/** Status dot color classes */
function statusDotClass(status: Hypothesis['status']): string {
  switch (status) {
    case 'supported':
      return 'bg-green-500';
    case 'contradicted':
      return 'bg-red-400';
    case 'partial':
      return 'bg-amber-500';
    default:
      return 'border border-content/30 bg-transparent';
  }
}

/** Sort questions: by R²adj descending, then untested last */
function sortByEvidence(a: Hypothesis, b: Hypothesis): number {
  const aR2 = a.evidence?.rSquaredAdj ?? -1;
  const bR2 = b.evidence?.rSquaredAdj ?? -1;
  return bR2 - aR2;
}

const QuestionChecklist: React.FC<QuestionChecklistProps> = ({
  questions,
  issueStatement,
  onIssueStatementChange,
  onQuestionClick,
  onAnswerQuestion,
  suggestedIssueStatement,
  onAcceptSuggestion,
  onDismissSuggestion,
  problemStatement,
  isProblemStatementComplete,
  evidenceLabel,
}) => {
  const [answeredExpanded, setAnsweredExpanded] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [localIssue, setLocalIssue] = useState(issueStatement ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset dismissed state when a new suggestion arrives
  useEffect(() => {
    if (suggestedIssueStatement) {
      setSuggestionDismissed(false);
    }
  }, [suggestedIssueStatement]);

  const handleAcceptSuggestion = useCallback(() => {
    onAcceptSuggestion?.();
    setSuggestionDismissed(true);
  }, [onAcceptSuggestion]);

  const handleDismissSuggestion = useCallback(() => {
    onDismissSuggestion?.();
    setSuggestionDismissed(true);
  }, [onDismissSuggestion]);

  const handleIssueBlur = useCallback(() => {
    const trimmed = localIssue.trim();
    if (trimmed !== (issueStatement ?? '').trim()) {
      onIssueStatementChange?.(trimmed);
    }
  }, [localIssue, issueStatement, onIssueStatementChange]);

  // Split into open (untested/partial) and answered (supported/contradicted)
  const openQuestions = questions
    .filter(q => q.status === 'untested' || q.status === 'partial')
    .sort(sortByEvidence);

  const answeredQuestions = questions
    .filter(q => q.status === 'supported' || q.status === 'contradicted')
    .sort(sortByEvidence);

  // Aggregate coverage: sum R²adj of answered/auto-answered questions
  const coverageSummary = React.useMemo(() => {
    if (questions.length === 0) return null;
    const checked = questions.filter(q => q.status === 'supported' || q.status === 'contradicted');
    const totalR2 = questions.reduce((sum, q) => sum + (q.evidence?.rSquaredAdj ?? 0), 0);
    const checkedR2 = checked.reduce((sum, q) => sum + (q.evidence?.rSquaredAdj ?? 0), 0);
    return {
      checked: checked.length,
      total: questions.length,
      explainedPct: totalR2 > 0 ? Math.round((checkedR2 / totalR2) * 100) : null,
    };
  }, [questions]);

  return (
    <div className="space-y-3">
      {/* Issue Statement */}
      {onIssueStatementChange && (
        <div>
          <div className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium mb-1">
            Issue Statement
          </div>
          <textarea
            ref={textareaRef}
            value={localIssue}
            onChange={e => setLocalIssue(e.target.value.slice(0, ISSUE_STATEMENT_MAX))}
            onBlur={handleIssueBlur}
            placeholder="What variation problem are we investigating?"
            maxLength={ISSUE_STATEMENT_MAX}
            rows={2}
            className="w-full text-[0.6875rem] leading-relaxed px-2 py-1.5 rounded-lg bg-surface border border-edge text-content placeholder:text-content-muted/50 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            data-testid="issue-statement"
          />
          <div className="text-[0.5625rem] text-content-muted text-right">
            {localIssue.length}/{ISSUE_STATEMENT_MAX}
          </div>

          {/* Suggested sharpening */}
          {suggestedIssueStatement && !suggestionDismissed && (
            <div
              className="mt-1.5 bg-amber-500/5 border-l-2 border-amber-500/30 rounded-r-lg px-2.5 py-2"
              data-testid="suggested-sharpening"
            >
              <div className="text-[0.5625rem] uppercase tracking-wider text-content-muted font-medium mb-1">
                Suggested update
              </div>
              <p className="text-[0.6875rem] leading-relaxed text-content-secondary italic mb-2">
                {suggestedIssueStatement}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptSuggestion}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                  data-testid="accept-suggestion"
                >
                  <Check size={10} />
                  Accept
                </button>
                <button
                  onClick={handleDismissSuggestion}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-medium bg-surface-secondary text-content-muted hover:text-content-secondary transition-colors"
                  data-testid="dismiss-suggestion"
                >
                  <X size={10} />
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coverage summary */}
      {coverageSummary && coverageSummary.total > 0 && (
        <div
          className="flex items-center gap-2 text-[0.625rem] text-content-muted"
          data-testid="coverage-summary"
        >
          <div className="flex-1 h-1 rounded-full bg-surface-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500/60 transition-all"
              style={{
                width: `${(coverageSummary.checked / coverageSummary.total) * 100}%`,
              }}
            />
          </div>
          <span className="shrink-0 tabular-nums">
            {coverageSummary.checked}/{coverageSummary.total} checked
            {coverageSummary.explainedPct != null && ` · ${coverageSummary.explainedPct}% explored`}
          </span>
        </div>
      )}

      {/* Open questions */}
      {openQuestions.length > 0 && (
        <div>
          <div className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium mb-1.5">
            Open questions ({openQuestions.length})
          </div>
          <div className="space-y-0.5">
            {openQuestions.map(q => (
              <QuestionRow
                key={q.id}
                question={q}
                onQuestionClick={onQuestionClick}
                onAnswerQuestion={onAnswerQuestion}
                evidenceLabel={evidenceLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Answered questions (collapsed by default) */}
      {answeredQuestions.length > 0 && (
        <div>
          <button
            onClick={() => setAnsweredExpanded(!answeredExpanded)}
            className="flex items-center gap-1 text-[0.625rem] uppercase tracking-wider text-content-muted font-medium mb-1.5 hover:text-content transition-colors"
            data-testid="answered-toggle"
          >
            {answeredExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Answered ({answeredQuestions.length})
          </button>
          {answeredExpanded && (
            <div className="space-y-0.5">
              {answeredQuestions.map(q => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  onQuestionClick={onQuestionClick}
                  onAnswerQuestion={onAnswerQuestion}
                  evidenceLabel={evidenceLabel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {questions.length === 0 && (
        <p className="text-[0.6875rem] text-content-muted italic">
          No investigation questions yet.
        </p>
      )}

      {/* Problem Statement */}
      {problemStatement && (
        <div
          className={`border-l-2 rounded-r-lg px-2.5 py-2 ${
            isProblemStatementComplete
              ? 'border-green-500/40 bg-green-500/5'
              : 'border-amber-500/30 bg-amber-500/5'
          }`}
          data-testid="problem-statement"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[0.625rem] uppercase tracking-wider text-content font-bold">
              Problem Statement
            </span>
            {isProblemStatementComplete ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[0.5625rem] font-medium">
                <Check size={8} />
                Complete
              </span>
            ) : (
              <span className="text-[0.5625rem] text-content-muted italic">
                Emerging — answer more questions to refine
              </span>
            )}
          </div>
          <p className="text-[0.6875rem] leading-relaxed text-content-secondary">
            {problemStatement}
          </p>
        </div>
      )}
    </div>
  );
};

/** Single question row */
const QuestionRow: React.FC<{
  question: Hypothesis;
  onQuestionClick?: (question: Hypothesis) => void;
  onAnswerQuestion?: (questionId: string) => void;
  evidenceLabel?: string;
}> = ({ question, onQuestionClick, evidenceLabel }) => {
  const isRuledOut = question.status === 'contradicted';
  const r2Pct =
    question.evidence?.rSquaredAdj != null ? Math.round(question.evidence.rSquaredAdj * 100) : null;
  const isAutoAnswered = isRuledOut && question.questionSource === 'factor-intel';

  return (
    <button
      onClick={() => onQuestionClick?.(question)}
      className="w-full text-left flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface hover:bg-surface-tertiary transition-colors group"
      data-testid={`question-${question.id}`}
    >
      {/* Status dot */}
      <span
        className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${statusDotClass(question.status)}`}
        title={question.status}
      />

      {/* Question text */}
      <span
        className={`flex-1 text-[0.6875rem] leading-relaxed ${
          isRuledOut
            ? 'opacity-50 text-content-secondary'
            : 'text-content-secondary group-hover:text-content'
        }`}
      >
        {question.text}
        {isAutoAnswered && <span className="ml-1 text-[0.5625rem] text-content-muted">(auto)</span>}
      </span>

      {/* Evidence badge */}
      {r2Pct != null && (
        <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full bg-surface-secondary text-[0.5625rem] text-content-muted font-medium">
          {r2Pct}%{evidenceLabel && evidenceLabel !== 'R²adj' ? ` ${evidenceLabel}` : ''}
        </span>
      )}
    </button>
  );
};

export { QuestionChecklist };
