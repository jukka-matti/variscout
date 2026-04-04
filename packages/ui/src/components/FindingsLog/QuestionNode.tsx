import React, { useState, useCallback } from 'react';
import type {
  Question,
  QuestionStatus,
  Finding,
  ImprovementIdea,
  IdeaImpact,
} from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import ImprovementIdeasSection from './ImprovementIdeasSection';
import { ValidationTaskSection, buildStatusTooltip } from './QuestionValidation';

/** Status dot colors matching question answer states */
const STATUS_COLORS: Record<QuestionStatus, string> = {
  open: 'border-2 border-gray-400 bg-transparent',
  answered: 'bg-green-500',
  'ruled-out': 'bg-red-400',
  investigating: 'bg-amber-500',
};

/** Validation type icons */
const VALIDATION_ICONS: Record<string, string> = {
  data: '\u{1F52C}', // microscope
  gemba: '\u{1F463}', // footprints
  expert: '\u{1F464}', // bust in silhouette
};

export interface QuestionNodeProps {
  question: Question;
  depth: number;
  children: Question[];
  linkedFindings: Finding[];
  /** Whether this node is expanded */
  isExpanded: boolean;
  /** Toggle expand/collapse */
  onToggle: (id: string) => void;
  /** Click to filter dashboard to this question's factor+level */
  onSelect?: (question: Question) => void;
  /** Add a sub-question with text, optional factor, and validation type */
  onAddChild?: (
    parentId: string,
    text: string,
    factor?: string,
    validationType?: 'data' | 'gemba' | 'expert'
  ) => void;
  /** Available factor columns for sub-question factor picker */
  factors?: string[];
  /** ANOVA evidence for this question's factor (for hover tooltip) */
  anovaEvidence?: {
    etaSquared: number;
    pValue: number;
    totalN: number;
    groupCount: number;
    evidenceLevel: string;
  };
  /** Children summary for display */
  childrenSummary?: {
    answered: number;
    'ruled-out': number;
    open: number;
    investigating: number;
    total: number;
  };
  /** Whether adding children is allowed (depth/count constraints) */
  canAddChild: boolean;
  /** Whether this question is ruled-out (dims the node) */
  showContradicted: boolean;
  // --- Validation Task (gemba/expert) ---
  /** Set a validation task description */
  onSetValidationTask?: (id: string, task: string) => void;
  /** Mark a validation task as complete */
  onCompleteTask?: (id: string) => void;
  /** Manually set question status with optional note */
  onSetManualStatus?: (id: string, status: QuestionStatus, note?: string) => void;
  // --- Improvement Ideas ---
  /** Computed impact for each idea (keyed by idea.id) */
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  /** Add an improvement idea */
  onAddIdea?: (questionId: string, text: string) => void;
  /** Update an improvement idea */
  onUpdateIdea?: (
    questionId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  /** Remove an improvement idea */
  onRemoveIdea?: (questionId: string, ideaId: string) => void;
  /** Toggle idea selected state */
  onSelectIdea?: (questionId: string, ideaId: string, selected: boolean) => void;
  /** Open What-If simulator pre-loaded for this idea */
  onProjectIdea?: (questionId: string, ideaId: string) => void;
  /** Ask CoScout about improvement options */
  onAskCoScout?: (question: string) => void;
  /** Set cause role on a question */
  onSetCauseRole?: (
    questionId: string,
    role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined
  ) => void;
}

const QuestionNode: React.FC<QuestionNodeProps> = ({
  question,
  depth,
  children: childQuestions,
  linkedFindings,
  isExpanded,
  onToggle,
  onSelect,
  onAddChild,
  factors,
  childrenSummary,
  anovaEvidence,
  canAddChild,
  showContradicted,
  onSetValidationTask,
  onCompleteTask,
  onSetManualStatus,
  ideaImpacts,
  onAddIdea,
  onUpdateIdea,
  onRemoveIdea,
  onSelectIdea,
  onProjectIdea,
  onAskCoScout,
  onSetCauseRole,
}) => {
  const { formatStat } = useTranslation();
  const isRuledOut = question.status === 'ruled-out';
  const isCauseRuledOut = question.causeRole === 'ruled-out';
  // Dim ruled-out questions (when shown)
  const dimmed = isCauseRuledOut || (isRuledOut && !showContradicted);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childText, setChildText] = useState('');
  const [childFactor, setChildFactor] = useState('');
  const [childValidationType, setChildValidationType] = useState<'data' | 'gemba' | 'expert'>(
    'data'
  );

  const handleAddChildSubmit = useCallback(() => {
    const trimmed = childText.trim();
    if (!trimmed || !onAddChild) return;
    onAddChild(question.id, trimmed, childFactor || undefined, childValidationType);
    setChildText('');
    setChildFactor('');
    setChildValidationType('data');
    setShowAddChild(false);
  }, [question.id, childText, childFactor, childValidationType, onAddChild]);

  const handleCycleCauseRole = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onSetCauseRole) return;
      const cycle: Array<'suspected-cause' | 'contributing' | 'ruled-out' | undefined> = [
        'suspected-cause',
        'contributing',
        'ruled-out',
        undefined,
      ];
      const idx = cycle.indexOf(question.causeRole);
      const next = cycle[(idx + 1) % cycle.length];
      onSetCauseRole(question.id, next);
    },
    [question.id, question.causeRole, onSetCauseRole]
  );

  return (
    <div
      className={`${dimmed ? 'opacity-50' : ''}`}
      style={{ marginLeft: depth * 20 }}
      data-testid={`question-node-${question.id}`}
    >
      <div
        className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-surface-secondary cursor-pointer group"
        onClick={() => onSelect?.(question)}
        role="treeitem"
        aria-expanded={childQuestions.length > 0 ? isExpanded : undefined}
      >
        {/* Expand/collapse toggle */}
        {childQuestions.length > 0 ? (
          <button
            className="mt-0.5 text-content-muted hover:text-content text-xs flex-shrink-0 w-4"
            onClick={e => {
              e.stopPropagation();
              onToggle(question.id);
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : (
          <span className="mt-0.5 w-4 flex-shrink-0" />
        )}

        {/* Status dot */}
        <span
          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[question.status]}${anovaEvidence ? ' cursor-help' : ''}`}
          title={buildStatusTooltip(question.status, anovaEvidence, formatStat)}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm text-content ${isRuledOut ? 'line-through' : ''}`}>
            {question.text}
          </span>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {/* Factor badge */}
            {question.factor && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {question.factor}
                {question.level ? `=${question.level}` : ''}
              </span>
            )}

            {/* Validation type icon */}
            {question.validationType && (
              <span className="text-[0.625rem]" title={`Validated by: ${question.validationType}`}>
                {VALIDATION_ICONS[question.validationType] || ''}
              </span>
            )}

            {/* Task status for gemba/expert */}
            {question.validationType &&
              question.validationType !== 'data' &&
              question.validationTask && (
                <span
                  className={`text-[0.625rem] ${question.taskCompleted ? 'text-green-400' : 'text-amber-400'}`}
                >
                  {question.taskCompleted ? 'Done' : 'Pending'}
                </span>
              )}

            {/* Linked findings count */}
            {question.linkedFindingIds.length > 0 && (
              <span className="text-[0.625rem] text-content-muted">
                {question.linkedFindingIds.length} finding
                {question.linkedFindingIds.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Cause role badge */}
            {question.causeRole === 'suspected-cause' && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                SUSPECT
              </span>
            )}
            {question.causeRole === 'contributing' && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                CONTRIBUTING
              </span>
            )}
            {question.causeRole === 'ruled-out' && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-medium">
                RULED OUT
              </span>
            )}

            {/* Evidence R-squared-adj badge */}
            {question.evidence?.rSquaredAdj != null && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                R²adj: {Math.round(question.evidence.rSquaredAdj * 100)}%
              </span>
            )}

            {/* Factor Intelligence source indicator */}
            {question.questionSource === 'factor-intel' && !question.parentId && (
              <span
                className="text-[0.5625rem] px-1 py-0.5 rounded bg-surface-secondary text-content-muted"
                title="Auto-generated from Factor Intelligence"
              >
                FI
              </span>
            )}

            {/* Follow-up badge for child questions from Factor Intelligence */}
            {question.questionSource === 'factor-intel' && question.parentId && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
                follow-up
              </span>
            )}

            {/* Children summary */}
            {childrenSummary && childrenSummary.total > 0 && (
              <span className="text-[0.625rem] text-content-muted">
                {childrenSummary.answered}/{childrenSummary.total} answered
              </span>
            )}
          </div>
        </div>

        {/* Cause role button (visible for answered/investigating questions) */}
        {onSetCauseRole &&
          (question.status === 'answered' || question.status === 'investigating') && (
            <button
              className={`opacity-0 group-hover:opacity-100 touch-show transition-opacity text-xs mt-0.5 flex-shrink-0 ${
                question.causeRole === 'suspected-cause'
                  ? 'text-amber-400 opacity-100'
                  : question.causeRole === 'contributing'
                    ? 'text-blue-400 opacity-100'
                    : question.causeRole === 'ruled-out'
                      ? 'text-slate-400 opacity-100'
                      : 'text-content-muted hover:text-content'
              }`}
              onClick={handleCycleCauseRole}
              title={
                question.causeRole === 'suspected-cause'
                  ? 'Suspected cause (click to change)'
                  : question.causeRole === 'contributing'
                    ? 'Contributing factor (click to change)'
                    : question.causeRole === 'ruled-out'
                      ? 'Ruled out (click to change)'
                      : 'Mark as cause'
              }
              aria-label="Set cause role"
              data-testid={`cause-role-${question.id}`}
            >
              {question.causeRole === 'suspected-cause'
                ? '\u{1F3AF}'
                : question.causeRole === 'contributing'
                  ? '\u25C7'
                  : question.causeRole === 'ruled-out'
                    ? '\u2717'
                    : '\u{1F3AF}'}
            </button>
          )}

        {/* Add child button */}
        {canAddChild && onAddChild && (
          <button
            className="opacity-0 group-hover:opacity-100 touch-show transition-opacity text-xs text-content-muted hover:text-content mt-0.5"
            onClick={e => {
              e.stopPropagation();
              setShowAddChild(true);
            }}
            title="Add sub-question"
            aria-label="Add sub-question"
          >
            +
          </button>
        )}
      </div>

      {/* Linked findings (compact) */}
      {isExpanded && linkedFindings.length > 0 && (
        <div className="ml-6 mt-1 space-y-1">
          {linkedFindings.map(f => (
            <div
              key={f.id}
              className="text-xs text-content-muted pl-2 border-l-2 border-edge py-0.5"
            >
              {f.text || 'Unnamed finding'}
            </div>
          ))}
        </div>
      )}

      {/* Validation task section — for gemba/expert questions */}
      {isExpanded && question.validationType && question.validationType !== 'data' && (
        <ValidationTaskSection
          questionId={question.id}
          validationTask={question.validationTask}
          taskCompleted={question.taskCompleted}
          manualNote={question.manualNote}
          onSetValidationTask={onSetValidationTask}
          onCompleteTask={onCompleteTask}
          onSetManualStatus={onSetManualStatus}
        />
      )}

      {/* Improvement Ideas section — visible for answered/investigating questions */}
      {isExpanded && (question.status === 'answered' || question.status === 'investigating') && (
        <ImprovementIdeasSection
          questionId={question.id}
          ideas={question.ideas ?? []}
          ideaImpacts={ideaImpacts}
          onAddIdea={onAddIdea}
          onUpdateIdea={onUpdateIdea}
          onRemoveIdea={onRemoveIdea}
          onSelectIdea={onSelectIdea}
          onProjectIdea={onProjectIdea}
          onAskCoScout={onAskCoScout}
          questionText={question.text}
        />
      )}

      {/* Inline sub-question form */}
      {showAddChild && (
        <div
          className="ml-6 mt-1.5 p-2 rounded border border-edge bg-surface-secondary space-y-1.5 min-w-0"
          onClick={e => e.stopPropagation()}
          data-testid={`add-child-form-${question.id}`}
        >
          <input
            type="text"
            className="w-full min-w-0 text-xs bg-transparent border-b border-edge text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 py-0.5"
            placeholder="What might cause this?"
            value={childText}
            onChange={e => setChildText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && childText.trim()) {
                e.preventDefault();
                handleAddChildSubmit();
              }
              if (e.key === 'Escape') {
                setShowAddChild(false);
                setChildText('');
              }
            }}
            autoFocus
            data-testid={`add-child-text-${question.id}`}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {factors && factors.length > 0 && (
              <select
                className="text-[0.6875rem] bg-transparent border border-edge rounded px-1.5 py-0.5 text-content focus:outline-none focus:border-blue-400"
                value={childFactor}
                onChange={e => setChildFactor(e.target.value)}
                data-testid={`add-child-factor-${question.id}`}
              >
                <option value="">Factor (optional)</option>
                {factors.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1.5 text-[0.625rem]">
              {(['data', 'gemba', 'expert'] as const).map(vt => (
                <label
                  key={vt}
                  className="flex items-center gap-0.5 text-content-secondary cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`vtype-${question.id}`}
                    value={vt}
                    checked={childValidationType === vt}
                    onChange={() => setChildValidationType(vt)}
                    className="w-3 h-3"
                  />
                  <span className="capitalize">{vt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <button
              className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-50"
              onClick={handleAddChildSubmit}
              disabled={!childText.trim()}
              data-testid={`add-child-submit-${question.id}`}
            >
              Add
            </button>
            <button
              className="text-xs text-content-muted hover:text-content"
              onClick={() => {
                setShowAddChild(false);
                setChildText('');
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionNode;
