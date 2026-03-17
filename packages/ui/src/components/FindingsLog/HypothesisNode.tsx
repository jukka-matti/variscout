import React, { useState, useCallback } from 'react';
import type {
  Hypothesis,
  HypothesisStatus,
  Finding,
  ImprovementIdea,
  IdeaImpact,
  IdeaEffort,
} from '@variscout/core';
import { HYPOTHESIS_STATUS_LABELS } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

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
  /** Add a sub-hypothesis */
  onAddChild?: (parentId: string) => void;
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
    updates: Partial<Pick<ImprovementIdea, 'text' | 'effort' | 'impactOverride' | 'notes'>>
  ) => void;
  /** Remove an improvement idea */
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  /** Toggle idea selected state */
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  /** Open What-If simulator pre-loaded for this idea */
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  /** Ask CoScout about improvement options */
  onAskCoScout?: (question: string) => void;
}

// ============================================================================
// Improvement Ideas Sub-Components
// ============================================================================

const IMPACT_COLORS: Record<IdeaImpact, string> = {
  high: 'bg-green-500/15 text-green-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-gray-500/15 text-gray-400',
};

const EFFORT_COLORS: Record<IdeaEffort, string> = {
  low: 'text-green-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

interface ImprovementIdeasSectionProps {
  hypothesisId: string;
  ideas: ImprovementIdea[];
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  onAddIdea?: (hypothesisId: string, text: string) => void;
  onUpdateIdea?: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'effort' | 'impactOverride' | 'notes'>>
  ) => void;
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  onAskCoScout?: (question: string) => void;
  hypothesisText: string;
}

const ImprovementIdeasSection: React.FC<ImprovementIdeasSectionProps> = ({
  hypothesisId,
  ideas,
  ideaImpacts,
  onAddIdea,
  onUpdateIdea,
  onRemoveIdea,
  onSelectIdea,
  onProjectIdea,
  onAskCoScout,
  hypothesisText,
}) => {
  const { formatStat } = useTranslation();
  const [isOpen, setIsOpen] = useState(ideas.length > 0);
  const [newIdeaText, setNewIdeaText] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = newIdeaText.trim();
    if (!trimmed || !onAddIdea) return;
    onAddIdea(hypothesisId, trimmed);
    setNewIdeaText('');
  }, [hypothesisId, newIdeaText, onAddIdea]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className="ml-6 mt-1.5" data-testid={`ideas-section-${hypothesisId}`}>
      <button
        className="text-[11px] text-content-muted hover:text-content flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[9px]">{isOpen ? '\u25BC' : '\u25B6'}</span>
        Improvement Ideas{ideas.length > 0 ? ` (${ideas.length})` : ''}
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1.5">
          {ideas.map(idea => {
            const impact = ideaImpacts?.[idea.id];
            return (
              <div
                key={idea.id}
                className="flex items-start gap-1.5 py-1 px-1.5 rounded text-xs group/idea"
                data-testid={`idea-${idea.id}`}
              >
                {/* Selected toggle */}
                <button
                  className="mt-0.5 flex-shrink-0 text-content-muted hover:text-content"
                  onClick={() => onSelectIdea?.(hypothesisId, idea.id, !idea.selected)}
                  title={idea.selected ? 'Deselect' : 'Select to try'}
                  aria-label={idea.selected ? 'Deselect idea' : 'Select idea'}
                >
                  {idea.selected ? '\u2605' : '\u25CB'}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className={`text-content ${idea.selected ? 'font-medium' : ''}`}>
                    {idea.text}
                  </span>

                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {/* Impact badge */}
                    {impact && (
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded ${IMPACT_COLORS[impact]}`}
                        data-testid={`idea-impact-${idea.id}`}
                      >
                        {impact.toUpperCase()} \u2191
                      </span>
                    )}

                    {/* Effort badge */}
                    {idea.effort && (
                      <span
                        className={`text-[10px] ${EFFORT_COLORS[idea.effort]}`}
                        data-testid={`idea-effort-${idea.id}`}
                      >
                        {idea.effort.toUpperCase()} effort
                      </span>
                    )}

                    {/* Projection summary */}
                    {idea.projection && (
                      <span className="text-[10px] text-content-muted">
                        Mean: {formatStat(idea.projection.baselineMean, 1)}&rarr;
                        {formatStat(idea.projection.projectedMean, 1)} &sigma;:{' '}
                        {formatStat(idea.projection.baselineSigma, 1)}&rarr;
                        {formatStat(idea.projection.projectedSigma, 1)}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {idea.notes && (
                    <p className="text-[10px] text-content-muted mt-0.5 italic">{idea.notes}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover/idea:opacity-100 touch-show transition-opacity flex-shrink-0">
                  {/* Effort cycle button */}
                  <button
                    className="text-[10px] text-content-muted hover:text-content"
                    onClick={() => {
                      const cycle: Array<IdeaEffort | undefined> = [
                        undefined,
                        'low',
                        'medium',
                        'high',
                      ];
                      const idx = cycle.indexOf(idea.effort);
                      const next = cycle[(idx + 1) % cycle.length];
                      onUpdateIdea?.(hypothesisId, idea.id, { effort: next });
                    }}
                    title="Set effort"
                    aria-label="Set effort level"
                  >
                    E
                  </button>
                  {/* Project button */}
                  {onProjectIdea && (
                    <button
                      className="text-[10px] text-content-muted hover:text-content"
                      onClick={() => onProjectIdea(hypothesisId, idea.id)}
                      title="Project with What-If"
                      aria-label="Project idea with What-If simulator"
                    >
                      P
                    </button>
                  )}
                  {/* Remove button */}
                  <button
                    className="text-[10px] text-content-muted hover:text-red-400"
                    onClick={() => onRemoveIdea?.(hypothesisId, idea.id)}
                    title="Remove idea"
                    aria-label="Remove idea"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add idea input */}
          {onAddIdea && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                className="flex-1 text-xs bg-transparent border-b border-edge text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 py-0.5"
                placeholder="Add improvement idea..."
                value={newIdeaText}
                onChange={e => setNewIdeaText(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid={`add-idea-input-${hypothesisId}`}
              />
              {newIdeaText.trim() && (
                <button className="text-xs text-blue-400 hover:text-blue-300" onClick={handleAdd}>
                  Add
                </button>
              )}
            </div>
          )}

          {/* Ask CoScout */}
          {onAskCoScout && (
            <button
              className="text-[11px] text-blue-400 hover:text-blue-300 mt-0.5"
              onClick={() =>
                onAskCoScout(`What improvement options could address "${hypothesisText}"?`)
              }
              data-testid={`ask-coscout-ideas-${hypothesisId}`}
            >
              Ask CoScout
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Validation Task Sub-Component (gemba/expert)
// ============================================================================

interface ValidationTaskSectionProps {
  hypothesisId: string;
  validationTask?: string;
  taskCompleted?: boolean;
  manualNote?: string;
  onSetValidationTask?: (id: string, task: string) => void;
  onCompleteTask?: (id: string) => void;
  onSetManualStatus?: (id: string, status: HypothesisStatus, note?: string) => void;
}

const ValidationTaskSection: React.FC<ValidationTaskSectionProps> = ({
  hypothesisId,
  validationTask,
  taskCompleted,
  manualNote,
  onSetValidationTask,
  onCompleteTask,
  onSetManualStatus,
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [noteInput, setNoteInput] = useState(manualNote ?? '');

  const handleTaskKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = taskInput.trim();
        if (trimmed && onSetValidationTask) {
          onSetValidationTask(hypothesisId, trimmed);
          setTaskInput('');
        }
      }
    },
    [hypothesisId, taskInput, onSetValidationTask]
  );

  // State 1: No task yet
  if (!validationTask) {
    return (
      <div className="ml-6 mt-1.5" data-testid={`validation-task-section-${hypothesisId}`}>
        <input
          type="text"
          className="w-full text-xs bg-transparent border-b border-edge text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 py-0.5"
          placeholder="What needs to be checked?"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onKeyDown={handleTaskKeyDown}
          data-testid={`validation-task-input-${hypothesisId}`}
        />
      </div>
    );
  }

  // State 2: Task exists but not completed
  if (!taskCompleted) {
    return (
      <div className="ml-6 mt-1.5" data-testid={`validation-task-section-${hypothesisId}`}>
        <label className="flex items-center gap-2 text-xs text-content cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-edge"
            onChange={() => onCompleteTask?.(hypothesisId)}
            data-testid={`validation-task-complete-${hypothesisId}`}
          />
          <span>{validationTask}</span>
        </label>
      </div>
    );
  }

  // State 3: Task completed — show strikethrough, note input, and status buttons
  return (
    <div
      className="ml-6 mt-1.5 space-y-1.5"
      data-testid={`validation-task-section-${hypothesisId}`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-400">&#10003;</span>
        <span className="text-content-muted line-through">{validationTask}</span>
      </div>
      <textarea
        className="w-full text-xs bg-transparent border border-edge rounded px-2 py-1 text-content placeholder:text-content-muted focus:outline-none focus:border-blue-400 resize-none"
        placeholder="What did you observe?"
        rows={2}
        value={noteInput}
        onChange={e => setNoteInput(e.target.value)}
        data-testid={`validation-task-note-${hypothesisId}`}
      />
      <div className="flex items-center gap-1.5">
        <button
          className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25"
          onClick={() => onSetManualStatus?.(hypothesisId, 'supported', noteInput || undefined)}
          data-testid={`validation-status-supported-${hypothesisId}`}
        >
          Supported
        </button>
        <button
          className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25"
          onClick={() => onSetManualStatus?.(hypothesisId, 'contradicted', noteInput || undefined)}
          data-testid={`validation-status-contradicted-${hypothesisId}`}
        >
          Contradicted
        </button>
        <button
          className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
          onClick={() => onSetManualStatus?.(hypothesisId, 'partial', noteInput || undefined)}
          data-testid={`validation-status-partial-${hypothesisId}`}
        >
          Partial
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// HypothesisNode Component
// ============================================================================

const HypothesisNode: React.FC<HypothesisNodeProps> = ({
  hypothesis,
  depth,
  children: childHypotheses,
  linkedFindings,
  isExpanded,
  onToggle,
  onSelect,
  onAddChild,
  childrenSummary,
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
}) => {
  const isContradicted = hypothesis.status === 'contradicted';
  const dimmed = isContradicted && !showContradicted;

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
          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[hypothesis.status]}`}
          title={HYPOTHESIS_STATUS_LABELS[hypothesis.status]}
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
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {hypothesis.factor}
                {hypothesis.level ? `=${hypothesis.level}` : ''}
              </span>
            )}

            {/* Validation type icon */}
            {hypothesis.validationType && (
              <span className="text-[10px]" title={`Validated by: ${hypothesis.validationType}`}>
                {VALIDATION_ICONS[hypothesis.validationType] || ''}
              </span>
            )}

            {/* Task status for gemba/expert */}
            {hypothesis.validationType &&
              hypothesis.validationType !== 'data' &&
              hypothesis.validationTask && (
                <span
                  className={`text-[10px] ${hypothesis.taskCompleted ? 'text-green-400' : 'text-amber-400'}`}
                >
                  {hypothesis.taskCompleted ? 'Done' : 'Pending'}
                </span>
              )}

            {/* Linked findings count */}
            {hypothesis.linkedFindingIds.length > 0 && (
              <span className="text-[10px] text-content-muted">
                {hypothesis.linkedFindingIds.length} finding
                {hypothesis.linkedFindingIds.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Children summary */}
            {childrenSummary && childrenSummary.total > 0 && (
              <span className="text-[10px] text-content-muted">
                {childrenSummary.supported}/{childrenSummary.total} supported
              </span>
            )}
          </div>
        </div>

        {/* Add child button */}
        {canAddChild && onAddChild && (
          <button
            className="opacity-0 group-hover:opacity-100 touch-show transition-opacity text-xs text-content-muted hover:text-content mt-0.5"
            onClick={e => {
              e.stopPropagation();
              onAddChild(hypothesis.id);
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
    </div>
  );
};

export default HypothesisNode;
