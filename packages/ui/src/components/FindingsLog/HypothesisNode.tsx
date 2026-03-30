import React, { useState, useCallback } from 'react';
import type {
  Hypothesis,
  HypothesisStatus,
  Finding,
  ImprovementIdea,
  IdeaImpact,
} from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import ImprovementIdeasSection from './HypothesisIdeas';
import { ValidationTaskSection, buildStatusTooltip } from './HypothesisValidation';

/** Status dot colors matching hypothesis statuses */
const STATUS_COLORS: Record<HypothesisStatus, string> = {
  untested: 'bg-gray-400',
  supported: 'bg-green-500',
  contradicted: 'bg-red-400',
  partial: 'bg-amber-500',
};

/** Validation type icons */
const VALIDATION_ICONS: Record<string, string> = {
  data: '\u{1F52C}', // microscope
  gemba: '\u{1F463}', // footprints
  expert: '\u{1F464}', // bust in silhouette
};

export interface HypothesisNodeProps {
  hypothesis: Hypothesis;
  depth: number;
  children: Hypothesis[];
  linkedFindings: Finding[];
  /** Whether this node is expanded */
  isExpanded: boolean;
  /** Toggle expand/collapse */
  onToggle: (id: string) => void;
  /** Click to filter dashboard to this hypothesis's factor+level */
  onSelect?: (hypothesis: Hypothesis) => void;
  /** Add a sub-hypothesis with text, optional factor, and validation type */
  onAddChild?: (
    parentId: string,
    text: string,
    factor?: string,
    validationType?: 'data' | 'gemba' | 'expert'
  ) => void;
  /** Available factor columns for sub-hypothesis factor picker */
  factors?: string[];
  /** ANOVA evidence for this hypothesis's factor (for hover tooltip) */
  anovaEvidence?: {
    etaSquared: number;
    pValue: number;
    totalN: number;
    groupCount: number;
    evidenceLevel: string;
  };
  /** Children summary for display */
  childrenSummary?: {
    supported: number;
    contradicted: number;
    untested: number;
    partial: number;
    total: number;
  };
  /** Whether adding children is allowed (depth/count constraints) */
  canAddChild: boolean;
  /** Whether this hypothesis is contradicted (dims the node) */
  showContradicted: boolean;
  // --- Validation Task (gemba/expert) ---
  /** Set a validation task description */
  onSetValidationTask?: (id: string, task: string) => void;
  /** Mark a validation task as complete */
  onCompleteTask?: (id: string) => void;
  /** Manually set hypothesis status with optional note */
  onSetManualStatus?: (id: string, status: HypothesisStatus, note?: string) => void;
  // --- Improvement Ideas ---
  /** Computed impact for each idea (keyed by idea.id) */
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  /** Add an improvement idea */
  onAddIdea?: (hypothesisId: string, text: string) => void;
  /** Update an improvement idea */
  onUpdateIdea?: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  /** Remove an improvement idea */
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  /** Toggle idea selected state */
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  /** Open What-If simulator pre-loaded for this idea */
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  /** Ask CoScout about improvement options */
  onAskCoScout?: (question: string) => void;
  /** Set cause role on a hypothesis */
  onSetCauseRole?: (
    hypothesisId: string,
    role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined
  ) => void;
}

const HypothesisNode: React.FC<HypothesisNodeProps> = ({
  hypothesis,
  depth,
  children: childHypotheses,
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
  const isContradicted = hypothesis.status === 'contradicted';
  const dimmed = isContradicted && !showContradicted;
  const [showAddChild, setShowAddChild] = useState(false);
  const [childText, setChildText] = useState('');
  const [childFactor, setChildFactor] = useState('');
  const [childValidationType, setChildValidationType] = useState<'data' | 'gemba' | 'expert'>(
    'data'
  );

  const handleAddChildSubmit = useCallback(() => {
    const trimmed = childText.trim();
    if (!trimmed || !onAddChild) return;
    onAddChild(hypothesis.id, trimmed, childFactor || undefined, childValidationType);
    setChildText('');
    setChildFactor('');
    setChildValidationType('data');
    setShowAddChild(false);
  }, [hypothesis.id, childText, childFactor, childValidationType, onAddChild]);

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
      const idx = cycle.indexOf(hypothesis.causeRole);
      const next = cycle[(idx + 1) % cycle.length];
      onSetCauseRole(hypothesis.id, next);
    },
    [hypothesis.id, hypothesis.causeRole, onSetCauseRole]
  );

  return (
    <div
      className={`${dimmed ? 'opacity-50' : ''}`}
      style={{ marginLeft: depth * 20 }}
      data-testid={`hypothesis-node-${hypothesis.id}`}
    >
      <div
        className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-surface-secondary cursor-pointer group"
        onClick={() => onSelect?.(hypothesis)}
        role="treeitem"
        aria-expanded={childHypotheses.length > 0 ? isExpanded : undefined}
      >
        {/* Expand/collapse toggle */}
        {childHypotheses.length > 0 ? (
          <button
            className="mt-0.5 text-content-muted hover:text-content text-xs flex-shrink-0 w-4"
            onClick={e => {
              e.stopPropagation();
              onToggle(hypothesis.id);
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
          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[hypothesis.status]}${anovaEvidence ? ' cursor-help' : ''}`}
          title={buildStatusTooltip(hypothesis.status, anovaEvidence, formatStat)}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm text-content ${isContradicted ? 'line-through' : ''}`}>
            {hypothesis.text}
          </span>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {/* Factor badge */}
            {hypothesis.factor && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {hypothesis.factor}
                {hypothesis.level ? `=${hypothesis.level}` : ''}
              </span>
            )}

            {/* Validation type icon */}
            {hypothesis.validationType && (
              <span
                className="text-[0.625rem]"
                title={`Validated by: ${hypothesis.validationType}`}
              >
                {VALIDATION_ICONS[hypothesis.validationType] || ''}
              </span>
            )}

            {/* Task status for gemba/expert */}
            {hypothesis.validationType &&
              hypothesis.validationType !== 'data' &&
              hypothesis.validationTask && (
                <span
                  className={`text-[0.625rem] ${hypothesis.taskCompleted ? 'text-green-400' : 'text-amber-400'}`}
                >
                  {hypothesis.taskCompleted ? 'Done' : 'Pending'}
                </span>
              )}

            {/* Linked findings count */}
            {hypothesis.linkedFindingIds.length > 0 && (
              <span className="text-[0.625rem] text-content-muted">
                {hypothesis.linkedFindingIds.length} finding
                {hypothesis.linkedFindingIds.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Cause role badge */}
            {hypothesis.causeRole === 'suspected-cause' && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                SUSPECTED
              </span>
            )}
            {hypothesis.causeRole === 'contributing' && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                CONTRIBUTING
              </span>
            )}
            {hypothesis.causeRole === 'ruled-out' && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-medium">
                RULED OUT
              </span>
            )}

            {/* Children summary */}
            {childrenSummary && childrenSummary.total > 0 && (
              <span className="text-[0.625rem] text-content-muted">
                {childrenSummary.supported}/{childrenSummary.total} supported
              </span>
            )}
          </div>
        </div>

        {/* Cause role button (visible for supported/partial hypotheses) */}
        {onSetCauseRole &&
          (hypothesis.status === 'supported' || hypothesis.status === 'partial') && (
            <button
              className={`opacity-0 group-hover:opacity-100 touch-show transition-opacity text-xs mt-0.5 flex-shrink-0 ${
                hypothesis.causeRole === 'suspected-cause'
                  ? 'text-red-400 opacity-100'
                  : hypothesis.causeRole === 'contributing'
                    ? 'text-amber-400 opacity-100'
                    : hypothesis.causeRole === 'ruled-out'
                      ? 'text-slate-400 opacity-100'
                      : 'text-content-muted hover:text-content'
              }`}
              onClick={handleCycleCauseRole}
              title={
                hypothesis.causeRole === 'suspected-cause'
                  ? 'Suspected cause (click to change)'
                  : hypothesis.causeRole === 'contributing'
                    ? 'Contributing factor (click to change)'
                    : hypothesis.causeRole === 'ruled-out'
                      ? 'Ruled out (click to change)'
                      : 'Mark as cause'
              }
              aria-label="Set cause role"
              data-testid={`cause-role-${hypothesis.id}`}
            >
              {hypothesis.causeRole === 'suspected-cause'
                ? '\u{1F3AF}'
                : hypothesis.causeRole === 'contributing'
                  ? '\u25C7'
                  : hypothesis.causeRole === 'ruled-out'
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
            title="Add sub-hypothesis"
            aria-label="Add sub-hypothesis"
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

      {/* Validation task section — for gemba/expert hypotheses */}
      {isExpanded && hypothesis.validationType && hypothesis.validationType !== 'data' && (
        <ValidationTaskSection
          hypothesisId={hypothesis.id}
          validationTask={hypothesis.validationTask}
          taskCompleted={hypothesis.taskCompleted}
          manualNote={hypothesis.manualNote}
          onSetValidationTask={onSetValidationTask}
          onCompleteTask={onCompleteTask}
          onSetManualStatus={onSetManualStatus}
        />
      )}

      {/* Improvement Ideas section — visible for supported/partial hypotheses */}
      {isExpanded && (hypothesis.status === 'supported' || hypothesis.status === 'partial') && (
        <ImprovementIdeasSection
          hypothesisId={hypothesis.id}
          ideas={hypothesis.ideas ?? []}
          ideaImpacts={ideaImpacts}
          onAddIdea={onAddIdea}
          onUpdateIdea={onUpdateIdea}
          onRemoveIdea={onRemoveIdea}
          onSelectIdea={onSelectIdea}
          onProjectIdea={onProjectIdea}
          onAskCoScout={onAskCoScout}
          hypothesisText={hypothesis.text}
        />
      )}

      {/* Inline sub-hypothesis form */}
      {showAddChild && (
        <div
          className="ml-6 mt-1.5 p-2 rounded border border-edge bg-surface-secondary space-y-1.5 min-w-0"
          onClick={e => e.stopPropagation()}
          data-testid={`add-child-form-${hypothesis.id}`}
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
            data-testid={`add-child-text-${hypothesis.id}`}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {factors && factors.length > 0 && (
              <select
                className="text-[0.6875rem] bg-transparent border border-edge rounded px-1.5 py-0.5 text-content focus:outline-none focus:border-blue-400"
                value={childFactor}
                onChange={e => setChildFactor(e.target.value)}
                data-testid={`add-child-factor-${hypothesis.id}`}
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
                    name={`vtype-${hypothesis.id}`}
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
              data-testid={`add-child-submit-${hypothesis.id}`}
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

export default HypothesisNode;
