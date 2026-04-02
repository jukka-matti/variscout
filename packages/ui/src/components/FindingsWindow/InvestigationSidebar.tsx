import React, { useState, useCallback } from 'react';
import { Copy, Check, PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { Question, InvestigationPhase } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { InvestigationPhaseBadge } from '../InvestigationPhaseBadge';
import { QuestionChecklist } from './QuestionChecklist';
import { InvestigationConclusion } from './InvestigationConclusion';

export interface InvestigationSidebarProps {
  phase?: InvestigationPhase;
  treeQuestions?: Question[];
  factorRoles?: Record<string, string>;
  suggestedQuestions?: string[];
  collapsed: boolean;
  onToggle: () => void;
  /** When true and phase is 'improving', shows a verification checklist */
  hasStagedData?: boolean;
  /** Factor Intelligence questions (Question objects with questionSource set) */
  questions?: Question[];
  /** Current issue statement text */
  issueStatement?: string;
  /** Callback when issue statement is edited */
  onIssueStatementChange?: (text: string) => void;
  /** Callback when a question is clicked — should switch dashboard to show evidence */
  onQuestionClick?: (question: Question) => void;
  /** CoScout-suggested sharpened issue statement */
  suggestedIssueStatement?: string;
  /** Callback when user accepts the suggested sharpening */
  onAcceptSuggestion?: () => void;
  /** Callback when user dismisses the suggestion */
  onDismissSuggestion?: () => void;
  /** Formulated problem statement */
  problemStatement?: string;
  /** Whether problem statement is complete */
  isProblemStatementComplete?: boolean;
}

const phaseDescriptionKeys: Record<string, keyof import('@variscout/core').MessageCatalog> = {
  initial: 'investigation.phaseInitial',
  diverging: 'investigation.phaseDiverging',
  validating: 'investigation.phaseValidating',
  converging: 'investigation.phaseConverging',
  improving: 'investigation.phaseImproving',
};

/**
 * Read-only investigation sidebar for the FindingsWindow popout.
 * No API calls — "Ask CoScout" copies question to clipboard.
 */
const VERIFICATION_CHECKLIST_KEYS: Array<keyof import('@variscout/core').MessageCatalog> = [
  'investigation.verifyChart',
  'investigation.verifyStats',
  'investigation.verifyBoxplot',
  'investigation.verifySideEffects',
  'investigation.verifyOutcome',
];

const InvestigationSidebar: React.FC<InvestigationSidebarProps> = ({
  phase,
  treeQuestions,
  factorRoles,
  suggestedQuestions,
  collapsed,
  onToggle,
  hasStagedData,
  questions,
  issueStatement,
  onIssueStatementChange,
  onQuestionClick,
  suggestedIssueStatement,
  onAcceptSuggestion,
  onDismissSuggestion,
  problemStatement,
  isProblemStatementComplete,
}) => {
  const { t } = useTranslation();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyQuestion = useCallback((question: string, index: number) => {
    navigator.clipboard.writeText(question).catch(() => {});
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Find uncovered factor roles (roles with no question linked)
  const uncoveredRoles = React.useMemo(() => {
    if (!factorRoles) return [];
    const coveredFactors = new Set((treeQuestions ?? []).filter(h => h.factor).map(h => h.factor!));
    return Object.entries(factorRoles)
      .filter(([factor]) => !coveredFactors.has(factor))
      .map(([factor, role]) => ({ factor, role }));
  }, [factorRoles, treeQuestions]);

  // Compute conclusion data from questions (must be before early return)
  const suspectedCauses = React.useMemo(
    () => (questions ?? []).filter(q => q.causeRole === 'suspected-cause'),
    [questions]
  );
  const ruledOut = React.useMemo(
    () =>
      (questions ?? []).filter(
        q =>
          q.causeRole === 'ruled-out' ||
          (q.status === 'ruled-out' && q.questionSource === 'factor-intel')
      ),
    [questions]
  );
  const contributing = React.useMemo(
    () => (questions ?? []).filter(q => q.causeRole === 'contributing'),
    [questions]
  );
  const hasConclusionData = suspectedCauses.length > 0 || ruledOut.length > 0;
  const hasQuestions = questions && questions.length > 0;

  // Toggle button (always visible)
  const toggleButton = (
    <button
      onClick={onToggle}
      className="absolute -left-8 top-3 p-1.5 rounded-l-lg bg-surface-secondary border border-r-0 border-edge text-content-muted hover:text-content transition-colors z-10"
      title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
      aria-label={collapsed ? 'Show investigation sidebar' : 'Hide investigation sidebar'}
      data-testid="sidebar-toggle"
    >
      {collapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
    </button>
  );

  if (collapsed) {
    return (
      <div className="relative flex-shrink-0" data-testid="investigation-sidebar">
        {toggleButton}
      </div>
    );
  }

  const hasContent =
    phase ||
    uncoveredRoles.length > 0 ||
    hasQuestions ||
    hasConclusionData ||
    (suggestedQuestions && suggestedQuestions.length > 0) ||
    (phase === 'improving' && hasStagedData);

  return (
    <div
      className="relative w-[280px] flex-shrink-0 border-l border-edge bg-surface-secondary overflow-y-auto hidden sm:block"
      data-testid="investigation-sidebar"
    >
      {toggleButton}

      <div className="p-3 space-y-4">
        {/* Phase section */}
        {phase && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium">
                Phase
              </span>
              <InvestigationPhaseBadge phase={phase} />
            </div>
            <p className="text-[0.6875rem] text-content-secondary leading-relaxed">
              {t(phaseDescriptionKeys[phase])}
            </p>
          </div>
        )}

        {/* Verification checklist — shown when improving phase + staged data */}
        {phase === 'improving' && hasStagedData && (
          <div data-testid="verification-checklist">
            <div className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium mb-1.5">
              {t('investigation.pdcaTitle')}
            </div>
            <ul className="space-y-1">
              {VERIFICATION_CHECKLIST_KEYS.map((key, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[0.6875rem] text-content-secondary leading-relaxed"
                >
                  <span className="text-content-muted mt-0.5">&#9744;</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Uncovered factor roles */}
        {uncoveredRoles.length > 0 && (
          <div>
            <div className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium mb-1.5">
              {t('investigation.uninvestigated')}
            </div>
            <div className="space-y-1">
              {uncoveredRoles.map(({ factor, role }) => (
                <div
                  key={factor}
                  className="flex items-center gap-1.5 text-[0.6875rem]"
                  data-testid={`uncovered-factor-${factor}`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[0.625rem] font-medium">
                    {role}
                  </span>
                  <span className="text-content-secondary">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Factor Intelligence question checklist */}
        {hasQuestions && (
          <QuestionChecklist
            questions={questions!}
            issueStatement={issueStatement}
            onIssueStatementChange={onIssueStatementChange}
            onQuestionClick={onQuestionClick}
            suggestedIssueStatement={suggestedIssueStatement}
            onAcceptSuggestion={onAcceptSuggestion}
            onDismissSuggestion={onDismissSuggestion}
            problemStatement={problemStatement}
            isProblemStatementComplete={isProblemStatementComplete}
          />
        )}

        {/* Investigation conclusions (suspected causes, ruled out) */}
        {hasConclusionData && (
          <InvestigationConclusion
            suspectedCauses={suspectedCauses}
            ruledOut={ruledOut}
            contributing={contributing}
            problemStatement={problemStatement}
            hasConclusions={hasConclusionData}
          />
        )}

        {/* Suggested questions — fallback when no Factor Intelligence questions */}
        {!hasQuestions && suggestedQuestions && suggestedQuestions.length > 0 && (
          <div>
            <div className="text-[0.625rem] uppercase tracking-wider text-content-muted font-medium mb-1.5">
              Ask CoScout
            </div>
            <div className="space-y-1">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleCopyQuestion(q, i)}
                  className="w-full text-left flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-surface text-[0.6875rem] text-content-secondary hover:bg-surface-tertiary hover:text-content transition-colors group"
                  title="Copy to clipboard — paste in main window CoScout"
                  data-testid={`sidebar-question-${i}`}
                >
                  <span className="flex-1 leading-relaxed">{q}</span>
                  {copiedIndex === i ? (
                    <Check size={10} className="flex-shrink-0 mt-0.5 text-green-400" />
                  ) : (
                    <Copy
                      size={10}
                      className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-50 transition-opacity"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasContent && (
          <p className="text-[0.6875rem] text-content-muted italic">
            Investigation context will appear here when AI features are active.
          </p>
        )}
      </div>
    </div>
  );
};

export { InvestigationSidebar };
