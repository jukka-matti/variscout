/**
 * ReportQuestionSummary — Read-only compact question tree for report context.
 *
 * Renders a flattened view of the question tree showing:
 * - Question text with validation status dot
 * - Cause role badge (primary / contributing)
 * - Factor link if available
 * - Indented sub-questions
 */

import React from 'react';
import { useTranslation } from '@variscout/hooks';
import type { Question, QuestionStatus, MessageCatalog } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export interface ReportQuestionSummaryProps {
  questions: Question[];
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_DOT_COLORS: Record<QuestionStatus, string> = {
  answered: 'bg-green-500',
  investigating: 'bg-amber-500',
  'ruled-out': 'bg-red-500',
  open: 'bg-slate-400 dark:bg-slate-500',
};

const STATUS_I18N_KEYS: Record<QuestionStatus, keyof MessageCatalog> = {
  answered: 'report.question.answered',
  investigating: 'report.question.investigating',
  'ruled-out': 'report.question.ruledOut',
  open: 'report.question.open',
};

const CAUSE_ROLE_COLORS: Record<string, string> = {
  primary: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  contributing: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
};

/** Build a tree structure from flat question array. */
function buildTree(questions: Question[]): Array<{ question: Question; children: Question[] }> {
  const roots = questions.filter(h => !h.parentId);
  const childMap = new Map<string, Question[]>();

  for (const h of questions) {
    if (h.parentId) {
      const children = childMap.get(h.parentId) ?? [];
      children.push(h);
      childMap.set(h.parentId, children);
    }
  }

  return roots.map(root => ({
    question: root,
    children: childMap.get(root.id) ?? [],
  }));
}

// ============================================================================
// Component
// ============================================================================

const QuestionRow: React.FC<{
  question: Question;
  indent?: boolean;
}> = ({ question, indent }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex items-start gap-2 py-1 ${indent ? 'ml-6' : ''}`}>
      {/* Status dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT_COLORS[question.status]}`}
        title={t(STATUS_I18N_KEYS[question.status])}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-800 dark:text-slate-200">{question.text}</span>

          {/* Cause role badge */}
          {question.causeRole && (
            <span
              className={`px-1.5 py-0.5 rounded text-[0.625rem] font-medium ${CAUSE_ROLE_COLORS[question.causeRole]}`}
            >
              {question.causeRole}
            </span>
          )}

          {/* Factor link */}
          {question.factor && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({question.factor}
              {question.level ? `: ${question.level}` : ''})
            </span>
          )}

          {/* Status label */}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {t(STATUS_I18N_KEYS[question.status])}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ReportQuestionSummary: React.FC<ReportQuestionSummaryProps> = ({ questions }) => {
  const { t } = useTranslation();
  if (questions.length === 0) return null;

  const tree = buildTree(questions);

  return (
    <div
      data-testid="report-question-summary"
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {t('report.questionTree')}
      </p>
      <div className="space-y-0.5">
        {tree.map(({ question, children }) => (
          <div key={question.id}>
            <QuestionRow question={question} />
            {children.map(child => (
              <QuestionRow key={child.id} question={child} indent />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
