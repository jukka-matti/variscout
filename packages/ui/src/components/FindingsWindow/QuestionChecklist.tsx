import React, { useState, useCallback, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
}) => {
  const [answeredExpanded, setAnsweredExpanded] = useState(false);
  const [localIssue, setLocalIssue] = useState(issueStatement ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    </div>
  );
};

/** Single question row */
const QuestionRow: React.FC<{
  question: Hypothesis;
  onQuestionClick?: (question: Hypothesis) => void;
  onAnswerQuestion?: (questionId: string) => void;
}> = ({ question, onQuestionClick }) => {
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
          {r2Pct}%
        </span>
      )}
    </button>
  );
};

export { QuestionChecklist };
