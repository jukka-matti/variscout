import React, { useState, useEffect, useRef } from 'react';
import { Camera, Link2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { Question, Finding } from '@variscout/core/findings';
import type { QuestionStatus } from '@variscout/core/findings';
import type { BestSubsetResult } from '@variscout/core/stats';
import type {
  SuspectedCause as SuspectedCauseHub,
  SuspectedCauseEvidence,
  HubProjection,
} from '@variscout/core';
import QuestionRow from './QuestionRow';
import ConclusionCard from './ConclusionCard';
import type { SuspectedCause } from './ConclusionCard';
import EquationDisplay from './EquationDisplay';
import { QuestionInputModal } from './QuestionInputModal';
import { QuestionLinkModal } from './QuestionLinkModal';

// Re-export SuspectedCause so consumers can import it from this module
export type { SuspectedCause };

export interface QuestionsTabViewProps {
  questions: Question[];
  findings: Finding[];
  issueStatement?: string;
  currentCpk?: number;
  targetCpk?: number;
  phaseBadge?: string;
  activeQuestionId?: string | null;
  suspectedCauses?: SuspectedCause[];
  combinedProjectedCpk?: number;
  /** Record of question id → projected Cpk value (for expanded QuestionRow detail) */
  projectedCpkMap?: Record<string, number>;
  /** Best subset result for equation display */
  bestSubset?: BestSubsetResult;
  /** Grand mean of the outcome (for equation display) */
  grandMean?: number;
  /** Outcome column name (for equation display) */
  outcomeLabel?: string;
  /** Whether interaction was detected (for equation display warning) */
  interactionDetected?: boolean;
  /** Mode-aware evidence label (default: R²adj) */
  evidenceLabel?: string;
  /**
   * The evidence field used for sorting questions within each group.
   * All question generators store their mode-specific evidence value in rSquaredAdj
   * (the universal evidence carrier): R²adj for standard, Cpk for capability/performance,
   * waste% for yamazumi. Default: 'rSquaredAdj'.
   */
  evidenceMetric?: string;
  onQuestionClick?: (question: Question) => void;
  onAddNote?: (findingId: string, text: string) => void;
  onAddQuestion?: (text: string) => void;
  onAddObservation?: (text: string) => void;
  onLinkObservation?: (findingId: string, questionId: string) => void;
  /** Hub-based suspected causes (new model) — passed to ConclusionCard */
  hubs?: SuspectedCauseHub[];
  /** Hub evidence map — passed to ConclusionCard */
  hubEvidences?: Map<string, SuspectedCauseEvidence>;
  /** Hub model projections — passed to ConclusionCard */
  hubProjections?: Map<string, HubProjection>;
  /** Navigate to the Investigation workspace (passed to ConclusionCard) */
  onNavigateToInvestigation?: () => void;
  /** Factor name to scroll-to and highlight (from Evidence Map node click) */
  highlightedFactor?: string | null;
  /** Called after the 2-second highlight fades */
  onClearHighlight?: () => void;
}

/** Display order for question groups */
const GROUP_ORDER: QuestionStatus[] = ['answered', 'investigating', 'open', 'ruled-out'];

/** Human-readable group labels */
const GROUP_LABELS: Record<QuestionStatus, string> = {
  answered: 'Answered',
  investigating: 'Investigating',
  open: 'Open',
  'ruled-out': 'Ruled out',
};

/**
 * QuestionsTabView — scrollable content for the Questions tab in the PI panel.
 *
 * Renders vitals bar, issue statement, progress bar, grouped question rows,
 * add-question button, observations section, and conclusion card.
 */
const QuestionsTabView: React.FC<QuestionsTabViewProps> = ({
  questions,
  findings,
  issueStatement,
  currentCpk,
  targetCpk,
  phaseBadge,
  activeQuestionId = null,
  suspectedCauses = [],
  combinedProjectedCpk,
  projectedCpkMap = {},
  bestSubset,
  grandMean,
  outcomeLabel,
  interactionDetected,
  evidenceLabel = 'R²adj',
  evidenceMetric: _evidenceMetric = 'rSquaredAdj',
  onQuestionClick,
  onAddNote,
  onAddQuestion,
  onAddObservation,
  onLinkObservation,
  hubs,
  hubEvidences,
  hubProjections,
  onNavigateToInvestigation,
  highlightedFactor,
  onClearHighlight,
}) => {
  // Ref for the scrollable container — used for scroll-to-factor behavior
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to and ring-highlight the first question row matching highlightedFactor
  useEffect(() => {
    if (!highlightedFactor) return;

    const container = containerRef.current;
    if (!container) return;

    // CSS.escape guards against special chars in factor names
    const selector = `[data-factor="${CSS.escape(highlightedFactor)}"]`;
    const el = container.querySelector<HTMLElement>(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('ring-2', 'ring-blue-400', 'ring-inset', 'rounded');

    const timer = setTimeout(() => {
      el.classList.remove('ring-2', 'ring-blue-400', 'ring-inset', 'rounded');
      onClearHighlight?.();
    }, 2000);

    return () => {
      clearTimeout(timer);
      el.classList.remove('ring-2', 'ring-blue-400', 'ring-inset', 'rounded');
    };
  }, [highlightedFactor, onClearHighlight]);

  // Track which questions are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeQuestionId) initial.add(activeQuestionId);
    return initial;
  });

  // Ruled-out group is collapsed by default
  const [showRuledOut, setShowRuledOut] = useState(false);

  // Modal state for inline dialogs (replaces window.prompt)
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [addObservationOpen, setAddObservationOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<string | null>(null);

  const handleToggleExpand = (questionId: string): void => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Group questions by display status, sorted by R²adj descending within each group
  const grouped: Record<QuestionStatus, Question[]> = {
    answered: [],
    investigating: [],
    open: [],
    'ruled-out': [],
  };

  for (const q of questions) {
    const ds = q.status;
    grouped[ds].push(q);
  }

  // Sort each group by R²adj descending.
  // All question generators store their mode-specific evidence value in rSquaredAdj
  // (the universal evidence carrier): R²adj for standard, Cpk for capability/performance,
  // waste% for yamazumi. See channelQuestions.ts and yamazumi/questions.ts.
  for (const group of GROUP_ORDER) {
    grouped[group].sort((a, b) => {
      const aR = a.evidence?.rSquaredAdj ?? -1;
      const bR = b.evidence?.rSquaredAdj ?? -1;
      return bR - aR;
    });
  }

  // Build finding lookup keyed by finding id
  const findingById = new Map(findings.map(f => [f.id, f]));

  // Compute linked finding id set across all questions
  const allLinkedFindingIds = new Set(questions.flatMap(q => q.linkedFindingIds));

  // Unlinked findings = findings NOT referenced by any question
  const unlinkedFindings = findings.filter(f => !allLinkedFindingIds.has(f.id));

  // Progress counts
  const answeredCount = grouped['answered'].length;
  const investigatingCount = grouped['investigating'].length;
  const ruledOutCount = grouped['ruled-out'].length;
  const exploredCount = answeredCount + investigatingCount + ruledOutCount;
  const totalCount = questions.length;

  // Finding count (for progress display)
  const findingCount = findings.length;

  // Helper: get findings linked to a question
  const getLinkedFindings = (q: Question): Finding[] =>
    q.linkedFindingIds.map(id => findingById.get(id)).filter((f): f is Finding => f !== undefined);

  const hasQuestions = questions.length > 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-0 overflow-y-auto min-h-0"
      data-testid="questions-tab-view"
    >
      {/* Vitals bar */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 border-b border-edge/60 bg-surface-secondary"
        data-testid="vitals-bar"
      >
        {/* Cpk display */}
        {currentCpk !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-[0.5625rem] text-content-muted uppercase tracking-wide">Cpk</span>
            <span
              className={`text-xs font-mono font-semibold ${
                currentCpk >= (targetCpk ?? 1.33)
                  ? 'text-green-500'
                  : currentCpk >= 1.0
                    ? 'text-amber-500'
                    : 'text-red-400'
              }`}
              data-testid="vitals-cpk"
            >
              {currentCpk.toFixed(2)}
            </span>
          </div>
        )}

        {/* Target */}
        {targetCpk !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-[0.5625rem] text-content-muted">tgt</span>
            <span className="text-xs font-mono text-content-secondary" data-testid="vitals-target">
              {targetCpk.toFixed(2)}
            </span>
          </div>
        )}

        {/* Phase badge */}
        {phaseBadge && (
          <span
            className="ml-auto text-[0.5625rem] bg-blue-500/15 text-blue-400 rounded px-1.5 py-0.5 uppercase tracking-wide"
            data-testid="vitals-phase-badge"
          >
            {phaseBadge}
          </span>
        )}
      </div>

      {/* Issue statement */}
      {issueStatement && (
        <div
          className="mx-2 mt-2 rounded bg-surface-secondary px-2 py-1.5"
          data-testid="issue-statement"
        >
          <div className="text-[0.5625rem] font-semibold text-content-muted uppercase tracking-wide mb-0.5">
            Issue statement
          </div>
          <p className="text-xs text-content leading-snug">{issueStatement}</p>
        </div>
      )}

      {/* Progress bar */}
      {hasQuestions && (
        <div className="mx-2 mt-2 flex flex-col gap-0.5" data-testid="progress-bar">
          <div className="flex items-center justify-between text-[0.5625rem] text-content-muted">
            <span data-testid="progress-explored">
              {exploredCount}/{totalCount} explored
            </span>
            <span data-testid="progress-findings">
              {findingCount} finding{findingCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-1 rounded-full bg-surface-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: totalCount > 0 ? `${(exploredCount / totalCount) * 100}%` : '0%' }}
              aria-label={`${exploredCount} of ${totalCount} questions explored`}
              data-testid="progress-fill"
            />
          </div>
        </div>
      )}

      {/* Question groups */}
      <div className="flex flex-col mt-1.5">
        {hasQuestions ? (
          GROUP_ORDER.map(group => {
            const groupQuestions = grouped[group];
            if (groupQuestions.length === 0) return null;

            const isRuledOut = group === 'ruled-out';
            const isCollapsed = isRuledOut && !showRuledOut;

            return (
              <div key={group} data-testid={`question-group-${group}`}>
                {/* Group header (only for ruled-out — it has a toggle) */}
                {isRuledOut && (
                  <button
                    type="button"
                    onClick={() => setShowRuledOut(v => !v)}
                    className="flex items-center gap-1 w-full px-2 py-0.5 text-[0.5625rem] text-content-muted hover:text-content transition-colors"
                    data-testid="ruled-out-toggle"
                    aria-expanded={showRuledOut}
                  >
                    {showRuledOut ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span className="uppercase tracking-wide">
                      {GROUP_LABELS[group]} ({groupQuestions.length})
                    </span>
                  </button>
                )}

                {/* Question rows */}
                {!isCollapsed &&
                  groupQuestions.map(q => {
                    const linkedFindings = getLinkedFindings(q);
                    const isActive = q.id === activeQuestionId;
                    const isExpanded = expandedIds.has(q.id);

                    return (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        findings={linkedFindings}
                        isActive={isActive}
                        isExpanded={isExpanded}
                        evidenceLabel={evidenceLabel}
                        onClick={onQuestionClick}
                        onToggleExpand={handleToggleExpand}
                        projectedCpk={projectedCpkMap[q.id]}
                        currentCpk={currentCpk}
                        onAddNote={onAddNote}
                      />
                    );
                  })}
              </div>
            );
          })
        ) : (
          <div
            className="px-3 py-4 text-center text-xs text-content-muted"
            data-testid="questions-empty-state"
          >
            Select factors to generate questions
          </div>
        )}
      </div>

      {/* Add question button */}
      {onAddQuestion && (
        <button
          type="button"
          onClick={() => setAddQuestionOpen(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-content-muted hover:text-content transition-colors"
          data-testid="add-question-button"
        >
          <Plus size={11} aria-hidden="true" />
          Add question
        </button>
      )}

      {/* Observations section (inlined) */}
      {(unlinkedFindings.length > 0 || onAddObservation) && (
        <div
          className="border-t border-edge/60 pt-2 flex flex-col gap-1"
          data-testid="observations-section"
        >
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[0.625rem] font-semibold text-content-muted uppercase tracking-wide">
              Observations
            </span>
            {unlinkedFindings.length > 0 && (
              <span
                className="text-[0.5625rem] bg-amber-500/15 text-amber-400 rounded px-1 leading-4"
                aria-label={`${unlinkedFindings.length} unlinked observation${unlinkedFindings.length !== 1 ? 's' : ''}`}
                data-testid="observations-count"
              >
                {unlinkedFindings.length}
              </span>
            )}
          </div>
          {unlinkedFindings.map(finding => (
            <div
              key={finding.id}
              className="flex items-start gap-1.5 px-2 py-1"
              data-testid={`observation-${finding.id}`}
            >
              <Camera size={12} className="mt-0.5 text-amber-500 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-xs text-content leading-snug line-clamp-2">
                {finding.text}
              </span>
              {onLinkObservation && (
                <button
                  type="button"
                  onClick={() => setLinkTarget(finding.id)}
                  aria-label="Link observation to a question"
                  className="shrink-0 p-0.5 rounded text-content-muted hover:text-blue-400 transition-colors"
                  data-testid={`link-observation-${finding.id}`}
                >
                  <Link2 size={11} />
                </button>
              )}
            </div>
          ))}
          {onAddObservation && (
            <button
              type="button"
              onClick={() => setAddObservationOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-content-muted hover:text-content transition-colors"
              data-testid="add-observation-button"
            >
              <Plus size={11} aria-hidden="true" />
              Add observation
            </button>
          )}
        </div>
      )}

      {/* Conclusion card */}
      <ConclusionCard
        suspectedCauses={suspectedCauses}
        currentCpk={currentCpk}
        combinedProjectedCpk={combinedProjectedCpk}
        targetCpk={targetCpk}
        hubs={hubs}
        hubEvidences={hubEvidences}
        hubProjections={hubProjections}
        onNavigateToInvestigation={onNavigateToInvestigation}
      />

      {/* Equation display — shown when best subset model is available */}
      {bestSubset && grandMean !== undefined && outcomeLabel && (
        <div className="mx-2 mb-2">
          <EquationDisplay
            bestSubset={bestSubset}
            grandMean={grandMean}
            outcome={outcomeLabel}
            interactionDetected={interactionDetected}
          />
        </div>
      )}

      {/* Modals (replaces window.prompt) */}
      <QuestionInputModal
        isOpen={addQuestionOpen}
        onClose={() => setAddQuestionOpen(false)}
        onSubmit={text => {
          onAddQuestion?.(text);
          setAddQuestionOpen(false);
        }}
        title="Add Question"
        placeholder="What do you want to investigate?"
      />
      <QuestionInputModal
        isOpen={addObservationOpen}
        onClose={() => setAddObservationOpen(false)}
        onSubmit={text => {
          onAddObservation?.(text);
          setAddObservationOpen(false);
        }}
        title="Add Observation"
        placeholder="Describe what you observed..."
      />
      <QuestionLinkModal
        isOpen={linkTarget !== null}
        onClose={() => setLinkTarget(null)}
        onLink={questionId => {
          if (linkTarget) {
            onLinkObservation?.(linkTarget, questionId);
          }
          setLinkTarget(null);
        }}
        questions={questions
          .filter(q => q.factor)
          .map(q => ({ id: q.id, factor: q.factor, text: q.text }))}
      />
    </div>
  );
};

export default QuestionsTabView;
