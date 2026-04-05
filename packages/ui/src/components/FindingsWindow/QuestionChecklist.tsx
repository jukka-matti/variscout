import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';
import type { Question } from '@variscout/core';
import { computeCoverage } from '@variscout/core/stats';

export interface QuestionChecklistProps {
  /** Questions (Question objects with questionSource set) */
  questions: Question[];
  /** Current issue statement text */
  issueStatement?: string;
  /** Callback when issue statement is edited */
  onIssueStatementChange?: (text: string) => void;
  /** Callback when a question is clicked — should switch dashboard to show evidence */
  onQuestionClick?: (question: Question) => void;
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
  /** Factor to highlight and scroll to (from Evidence Map click) */
  highlightedFactor?: string | null;
}

const ISSUE_STATEMENT_MAX = 500;

/** Status dot color classes */
function statusDotClass(status: Question['status']): string {
  switch (status) {
    case 'answered':
      return 'bg-green-500';
    case 'ruled-out':
      return 'bg-red-400';
    case 'investigating':
      return 'bg-amber-500';
    default:
      return 'border border-content/30 bg-transparent';
  }
}

/** Sort questions: by R²adj descending, then untested last */
function sortByEvidence(a: Question, b: Question): number {
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
  highlightedFactor,
}) => {
  const [answeredExpanded, setAnsweredExpanded] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [localIssue, setLocalIssue] = useState(issueStatement ?? '');
  const [nextHighlightCleared, setNextHighlightCleared] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset dismissed state when a new suggestion arrives
  useEffect(() => {
    if (suggestedIssueStatement) {
      setSuggestionDismissed(false);
    }
  }, [suggestedIssueStatement]);

  // Scroll to highlighted factor's question when Evidence Map node is clicked
  const [flashFactor, setFlashFactor] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightedFactor || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-factor="${CSS.escape(highlightedFactor)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setFlashFactor(highlightedFactor);
      const timer = setTimeout(() => setFlashFactor(null), 600);
      return () => clearTimeout(timer);
    }
  }, [highlightedFactor]);

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

  // Split into open (open/investigating) and answered (answered/ruled-out)
  const openQuestions = questions
    .filter(q => q.status === 'open' || q.status === 'investigating')
    .sort(sortByEvidence);

  const answeredQuestions = questions
    .filter(q => q.status === 'answered' || q.status === 'ruled-out')
    .sort(sortByEvidence);

  // Aggregate coverage using computeCoverage from @variscout/core/stats
  const coverageSummary = useMemo(() => {
    if (questions.length === 0) return null;
    const result = computeCoverage(questions);
    return {
      checked: result.checked,
      total: result.total,
      explainedPct: result.exploredPercent > 0 ? Math.round(result.exploredPercent) : null,
    };
  }, [questions]);

  // Compute next question to highlight — reset when questions change
  const nextQuestionId = useMemo(() => {
    if (nextHighlightCleared) return null;

    const openQs = questions.filter(q => q.status === 'open' || q.status === 'investigating');
    if (openQs.length === 0) return null;

    // Priority 1: newly generated follow-ups (children of recently answered questions)
    const answeredIds = new Set(questions.filter(q => q.status === 'answered').map(q => q.id));
    const followUpChildren = openQs.filter(
      q => q.questionSource === 'factor-intel' && q.parentId && answeredIds.has(q.parentId)
    );
    if (followUpChildren.length > 0) return followUpChildren[0].id;

    // Priority 2: highest R²adj unanswered L1 question
    const l1Open = openQs
      .filter(q => q.status === 'open' && q.questionSource === 'factor-intel')
      .sort((a, b) => (b.evidence?.rSquaredAdj ?? 0) - (a.evidence?.rSquaredAdj ?? 0));
    if (l1Open.length > 0) return l1Open[0].id;

    // Priority 3: oldest open question (first in array, already sorted by creation)
    return openQs[0].id;
  }, [questions, nextHighlightCleared]);

  // Reset the cleared state when questions array changes (new answers/follow-ups)
  const prevQuestionsLenRef = useRef(questions.length);
  useEffect(() => {
    if (questions.length !== prevQuestionsLenRef.current) {
      setNextHighlightCleared(false);
      prevQuestionsLenRef.current = questions.length;
    }
  }, [questions.length]);

  return (
    <div ref={listRef} className="space-y-3">
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
        <div className="space-y-1" data-testid="coverage-summary">
          <div className="flex items-center justify-between text-[0.625rem] text-content-muted">
            <span className="tabular-nums">
              {coverageSummary.checked}/{coverageSummary.total} checked
              {coverageSummary.explainedPct != null &&
                ` · ${coverageSummary.explainedPct}% explored`}
            </span>
          </div>
          <div
            className="h-1 rounded-full bg-surface-tertiary overflow-hidden"
            title="This tracks factors in your data. Real-world causes may be outside your dataset."
          >
            <div
              className={`h-full rounded-full transition-all ${
                (coverageSummary.explainedPct ?? 0) >= 80
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-blue-500 to-green-500'
              }`}
              style={{
                width: `${coverageSummary.explainedPct ?? (coverageSummary.checked / coverageSummary.total) * 100}%`,
              }}
            />
          </div>
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
                isNext={q.id === nextQuestionId}
                isFlashing={flashFactor != null && q.factor === flashFactor}
                onQuestionClick={question => {
                  setNextHighlightCleared(true);
                  onQuestionClick?.(question);
                }}
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
                  isFlashing={flashFactor != null && q.factor === flashFactor}
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
  question: Question;
  isNext?: boolean;
  isFlashing?: boolean;
  onQuestionClick?: (question: Question) => void;
  onAnswerQuestion?: (questionId: string) => void;
  evidenceLabel?: string;
}> = ({ question, isNext, isFlashing, onQuestionClick, evidenceLabel }) => {
  const isRuledOut = question.status === 'ruled-out';
  const r2Pct =
    question.evidence?.rSquaredAdj != null ? Math.round(question.evidence.rSquaredAdj * 100) : null;
  const isAutoAnswered = isRuledOut && question.questionSource === 'factor-intel';

  return (
    <button
      onClick={() => onQuestionClick?.(question)}
      className={`w-full text-left flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface hover:bg-surface-tertiary transition-colors group ${
        isNext ? 'border-l-2 border-blue-500' : ''
      }${isFlashing ? ' ring-2 ring-blue-400 ring-opacity-75' : ''}`}
      data-testid={`question-${question.id}`}
      data-factor={question.factor ?? undefined}
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

      {/* Next question indicator */}
      {isNext && (
        <span
          className="flex-shrink-0 mt-0.5 text-xs text-blue-500 font-medium"
          data-testid="next-question-badge"
        >
          ← next
        </span>
      )}
    </button>
  );
};

export { QuestionChecklist };
