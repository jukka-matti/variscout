import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  MessageCircle,
  Pencil,
  Share2,
  Target,
  TrendingDown,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type {
  Finding,
  FindingProjection,
  FindingSource,
  FindingStatus,
  FindingTag,
} from '@variscout/core';
import { getFindingStatus } from '@variscout/core';
import FindingEditor from './FindingEditor';
import FindingStatusBadge from './FindingStatusBadge';
import FindingTagBadge from './FindingTagBadge';
import FindingComments from './FindingComments';

export interface FindingCardProps {
  finding: Finding;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  columnAliases?: Record<string, string>;
  /** Whether this finding matches the current active filters */
  isActive?: boolean;
  /** Callback to change investigation status */
  onSetStatus?: (id: string, status: FindingStatus) => void;
  /** Callback to set a finding's classification tag */
  onSetTag?: (id: string, tag: FindingTag | null) => void;
  /** Callback to add a comment */
  onAddComment?: (id: string, text: string) => void;
  /** Callback to edit a comment */
  onEditComment?: (findingId: string, commentId: string, text: string) => void;
  /** Callback to delete a comment */
  onDeleteComment?: (findingId: string, commentId: string) => void;
  /** Callback when a photo is attached to a comment */
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  /** Callback to capture photo via Teams SDK */
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  /** Show author names on comments */
  showAuthors?: boolean;
  /** Callback to share this finding (deep link). Hidden when not provided. */
  onShare?: (findingId: string) => void;
  /** Navigate to the chart that sourced this finding */
  onNavigateToChart?: (source: FindingSource) => void;
  /** Callback to assign someone to this finding */
  onAssign?: (findingId: string) => void;
  /** Optional slot for inline assignment UI (e.g., PeoplePicker rendered by Azure) */
  renderAssignSlot?: React.ReactNode;
  /** Maximum number of statuses to show in status badge dropdown (PWA=3, Azure=5). Default: all. */
  maxStatuses?: number;
  /** Callback to link a hypothesis to a finding */
  onLinkHypothesis?: (findingId: string, hypothesisId: string) => void;
  /** Callback to create a new hypothesis and link to a finding */
  onCreateHypothesis?: (findingId: string, text: string, factor?: string, level?: string) => void;
  /** Map of hypothesis IDs to hypothesis objects for display */
  hypothesesMap?: Record<string, { text: string; status: string; factor?: string; level?: string }>;
  /** Callback to add an action item */
  onAddAction?: (id: string, text: string, assignee?: string, dueDate?: string) => void;
  /** Callback to complete an action item */
  onCompleteAction?: (id: string, actionId: string) => void;
  /** Callback to delete an action item */
  onDeleteAction?: (id: string, actionId: string) => void;
  /** Callback to set outcome */
  onSetOutcome?: (
    id: string,
    outcome: {
      effective: 'yes' | 'no' | 'partial';
      cpkAfter?: number;
      notes?: string;
      verifiedAt: number;
    }
  ) => void;
  /** Callback to open What-If simulator pre-loaded for this finding */
  onProjectImprovement?: (findingId: string) => void;
  /** Whether the finding has spec limits (affects projection display) */
  hasSpecs?: boolean;
  /** Callback to ask CoScout about this finding. When provided, shows "Ask CoScout" button. */
  onAskCoScout?: (focusContext: {
    finding: { text: string; status: string; hypothesis?: string };
  }) => void;
}

// ============================================================================
// Progressive Sections (5-status investigation workflow)
// ============================================================================

interface HypothesisSectionProps {
  findingId: string;
  hypothesisId?: string;
  hypothesesMap?: Record<string, { text: string; status: string; factor?: string; level?: string }>;
  onCreateHypothesis?: (findingId: string, text: string, factor?: string, level?: string) => void;
  readOnly?: boolean;
}

const HYPOTHESIS_STATUS_COLORS: Record<string, string> = {
  untested: 'text-content-muted',
  supported: 'text-green-400',
  contradicted: 'text-red-400',
  partial: 'text-amber-400',
};

const HypothesisSection: React.FC<HypothesisSectionProps> = ({
  findingId,
  hypothesisId,
  hypothesesMap,
  onCreateHypothesis,
  readOnly,
}) => {
  const hypothesis = hypothesisId ? hypothesesMap?.[hypothesisId] : undefined;
  const [isOpen, setIsOpen] = useState(!!hypothesis);
  const [draft, setDraft] = useState('');

  return (
    <div className="mt-2 border-t border-edge/50 pt-2">
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Target size={10} />
        <span>Hypothesis</span>
        {hypothesis && !isOpen && (
          <span
            className={`ml-1 truncate flex-1 ${HYPOTHESIS_STATUS_COLORS[hypothesis.status] ?? 'text-content-secondary'}`}
          >
            &mdash; {hypothesis.text}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="mt-1">
          {hypothesis ? (
            <div className="text-[11px] space-y-1" onClick={e => e.stopPropagation()}>
              <p className="text-content-secondary italic">&ldquo;{hypothesis.text}&rdquo;</p>
              <div className="flex items-center gap-2 text-[10px]">
                <span
                  className={HYPOTHESIS_STATUS_COLORS[hypothesis.status] ?? 'text-content-muted'}
                >
                  {hypothesis.status.charAt(0).toUpperCase() + hypothesis.status.slice(1)}
                </span>
                {hypothesis.factor && (
                  <span className="text-content-muted">
                    {hypothesis.factor}
                    {hypothesis.level ? `=${hypothesis.level}` : ''}
                  </span>
                )}
              </div>
            </div>
          ) : (
            !readOnly &&
            onCreateHypothesis && (
              <div onClick={e => e.stopPropagation()}>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && draft.trim()) {
                      e.preventDefault();
                      onCreateHypothesis(findingId, draft.trim());
                      setDraft('');
                    }
                  }}
                  placeholder="What do you think is causing this? (Enter to create)"
                  className="w-full text-[11px] bg-surface-tertiary/50 border border-edge/50 rounded px-2 py-1.5 text-content placeholder:text-content-muted resize-none focus:outline-none focus:border-blue-500/50"
                  rows={2}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

interface ActionItemsSectionProps {
  findingId: string;
  actions: Array<{
    id: string;
    text: string;
    assignee?: string;
    dueDate?: string;
    completedAt?: number;
    createdAt: number;
  }>;
  onAddAction: (id: string, text: string, assignee?: string, dueDate?: string) => void;
  onCompleteAction?: (id: string, actionId: string) => void;
  onDeleteAction?: (id: string, actionId: string) => void;
  readOnly?: boolean;
}

const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({
  findingId,
  actions,
  onAddAction,
  onCompleteAction,
  onDeleteAction,
  readOnly,
}) => {
  const [isOpen, setIsOpen] = useState(actions.length > 0);
  const [newActionText, setNewActionText] = useState('');

  const overdue = actions.filter(
    a => a.dueDate && !a.completedAt && new Date(a.dueDate) < new Date()
  );
  const completed = actions.filter(a => a.completedAt);

  return (
    <div className="mt-2 border-t border-edge/50 pt-2">
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <CheckCircle2 size={10} />
        <span>
          Actions ({completed.length}/{actions.length})
        </span>
        {overdue.length > 0 && (
          <span className="ml-1 text-red-400 text-[9px]">{overdue.length} overdue</span>
        )}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1">
          {actions.map(action => (
            <div
              key={action.id}
              className="flex items-start gap-1.5 group/action"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (!action.completedAt && onCompleteAction)
                    onCompleteAction(findingId, action.id);
                }}
                className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  action.completedAt
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-edge hover:border-blue-500/50'
                }`}
                disabled={readOnly || !!action.completedAt}
                title={action.completedAt ? 'Completed' : 'Mark complete'}
              >
                {action.completedAt && <CheckCircle2 size={8} />}
              </button>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-[11px] ${action.completedAt ? 'line-through text-content-muted' : 'text-content-secondary'}`}
                >
                  {action.text}
                </span>
                {(action.assignee || action.dueDate) && (
                  <div className="flex items-center gap-2 text-[9px] text-content-muted mt-0.5">
                    {action.assignee && <span>{action.assignee}</span>}
                    {action.dueDate && (
                      <span
                        className={`flex items-center gap-0.5 ${
                          !action.completedAt && new Date(action.dueDate) < new Date()
                            ? 'text-red-400'
                            : ''
                        }`}
                      >
                        <Clock size={8} />
                        {action.dueDate}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!readOnly && onDeleteAction && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteAction(findingId, action.id);
                  }}
                  className="p-0.5 rounded text-content-muted hover:text-red-400 opacity-0 group-hover/action:opacity-100 transition-opacity"
                  title="Delete action"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <div className="flex gap-1 mt-1" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={newActionText}
                onChange={e => setNewActionText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newActionText.trim()) {
                    onAddAction(findingId, newActionText.trim());
                    setNewActionText('');
                  }
                }}
                placeholder="Add action..."
                className="flex-1 text-[11px] bg-surface-tertiary/50 border border-edge/50 rounded px-2 py-1 text-content placeholder:text-content-muted focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface OutcomeSectionProps {
  findingId: string;
  outcome?: {
    effective: 'yes' | 'no' | 'partial';
    cpkAfter?: number;
    notes?: string;
    verifiedAt: number;
  };
  onSetOutcome: (
    id: string,
    outcome: {
      effective: 'yes' | 'no' | 'partial';
      cpkAfter?: number;
      notes?: string;
      verifiedAt: number;
    }
  ) => void;
  readOnly?: boolean;
}

const OutcomeSection: React.FC<OutcomeSectionProps> = ({
  findingId,
  outcome,
  onSetOutcome,
  readOnly,
}) => {
  const [isOpen, setIsOpen] = useState(!!outcome);

  const effectiveLabels = { yes: 'Effective', no: 'Not Effective', partial: 'Partially Effective' };
  const effectiveColors = { yes: 'text-green-400', no: 'text-red-400', partial: 'text-amber-400' };

  return (
    <div className="mt-2 border-t border-edge/50 pt-2">
      <button
        onClick={e => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Activity size={10} />
        <span>Outcome</span>
        {outcome && !isOpen && (
          <span className={`ml-1 ${effectiveColors[outcome.effective]}`}>
            &mdash; {effectiveLabels[outcome.effective]}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1.5" onClick={e => e.stopPropagation()}>
          {!readOnly && !outcome && (
            <div className="flex gap-1.5">
              {(['yes', 'no', 'partial'] as const).map(eff => (
                <button
                  key={eff}
                  onClick={() =>
                    onSetOutcome(findingId, { effective: eff, verifiedAt: Date.now() })
                  }
                  className={`px-2 py-1 text-[10px] rounded border border-edge/50 hover:border-blue-500/50 transition-colors ${effectiveColors[eff]}`}
                >
                  {effectiveLabels[eff]}
                </button>
              ))}
            </div>
          )}
          {outcome && (
            <div className="text-[11px]">
              <span className={effectiveColors[outcome.effective]}>
                {effectiveLabels[outcome.effective]}
              </span>
              {outcome.cpkAfter !== undefined && (
                <span className="ml-2 text-content-muted">
                  Cpk after: {outcome.cpkAfter.toFixed(2)}
                </span>
              )}
              {outcome.notes && (
                <p className="text-content-secondary mt-0.5 italic">{outcome.notes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Projection Section (What-If improvement projection)
// ============================================================================

interface ProjectionSectionProps {
  projection: FindingProjection;
  hasSpecs: boolean;
}

/** Format a numeric delta with arrow and sign */
function formatDelta(from: number, to: number, decimals: number = 1): string {
  return `${from.toFixed(decimals)}\u2192${to.toFixed(decimals)}`;
}

const ProjectionSection: React.FC<ProjectionSectionProps> = ({ projection, hasSpecs }) => {
  const age = Math.round((Date.now() - new Date(projection.createdAt).getTime()) / 86400000);
  const ageText = age === 0 ? 'today' : age === 1 ? '1 day ago' : `${age} days ago`;

  return (
    <div className="mt-2 border-t border-edge/50 pt-2" data-testid="projection-section">
      <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
        <TrendingDown size={10} />
        <span>Projected improvement</span>
        <span className="ml-auto text-[9px]">{ageText}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
        <span className="text-content-secondary">
          Mean:{' '}
          <span className="text-green-400">
            {formatDelta(projection.baselineMean, projection.projectedMean)}
          </span>
        </span>
        <span className="text-content-secondary">
          \u03C3:{' '}
          <span className="text-green-400">
            {formatDelta(projection.baselineSigma, projection.projectedSigma, 2)}
          </span>
        </span>
        {hasSpecs &&
          projection.projectedCpk !== undefined &&
          projection.baselineCpk !== undefined && (
            <span className="text-content-secondary">
              Cpk:{' '}
              <span className="text-green-400">
                {formatDelta(projection.baselineCpk, projection.projectedCpk, 2)}
              </span>
            </span>
          )}
      </div>
    </div>
  );
};

/**
 * Individual finding card showing filter chips, stats, and analyst note.
 * Click the card body to restore its filter state.
 */
const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onEdit,
  onDelete,
  onRestore,
  columnAliases = {},
  isActive = false,
  onSetStatus,
  onSetTag,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddPhoto,
  onCaptureFromTeams,
  showAuthors,
  onShare,
  onNavigateToChart,
  onAssign,
  renderAssignSlot,
  maxStatuses,
  onLinkHypothesis: _onLinkHypothesis,
  onCreateHypothesis,
  hypothesesMap,
  onAddAction,
  onCompleteAction,
  onDeleteAction,
  onSetOutcome,
  onProjectImprovement,
  hasSpecs = false,
  onAskCoScout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { context } = finding;
  const status = getFindingStatus(finding);
  const comments = finding.comments;

  const filterEntries = Object.entries(context.activeFilters);

  const handleSave = (text: string) => {
    onEdit(finding.id, text);
    setIsEditing(false);
  };

  return (
    <div
      className={`group rounded-lg border transition-colors ${
        isActive
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-edge hover:border-edge-hover bg-surface-secondary'
      }`}
    >
      {/* Clickable header — restores filters */}
      <button
        onClick={() => onRestore(finding.id)}
        className="w-full text-left px-3 pt-2.5 pb-1.5"
        title="Click to restore these filters"
        aria-label={`Restore finding: ${finding.text || 'No note'}`}
      >
        {/* Status badge + filter chips row */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <div className="flex flex-wrap gap-1 flex-1">
            {finding.source && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onNavigateToChart?.(finding.source!);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-[10px] text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
                title={`Go to ${finding.source.chart} chart`}
              >
                {finding.source.chart === 'ichart' && <Activity size={9} />}
                {finding.source.chart === 'boxplot' && <BarChart3 size={9} />}
                {finding.source.chart === 'pareto' && <Layers size={9} />}
                <span>
                  {finding.source.chart === 'ichart' ? 'I-Chart' : finding.source.category}
                </span>
              </button>
            )}
            {filterEntries.map(([factor, values]) => {
              const label = columnAliases[factor] || factor;
              const valStr =
                values.length <= 2
                  ? values.map(String).join(', ')
                  : `${values[0]} +${values.length - 1}`;
              return (
                <span
                  key={factor}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface-tertiary/50 text-[10px] text-content-secondary rounded"
                >
                  <span className="font-medium">{label}</span>
                  <span className="text-content-muted">=</span>
                  <span>{valStr}</span>
                </span>
              );
            })}
            {filterEntries.length === 0 && (
              <span className="text-[10px] text-content-muted italic">No filters</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <FindingStatusBadge
              status={status}
              onStatusChange={onSetStatus ? s => onSetStatus(finding.id, s) : undefined}
              maxStatuses={maxStatuses}
            />
            {status === 'analyzed' && (
              <FindingTagBadge
                tag={finding.tag}
                onTagChange={onSetTag ? t => onSetTag(finding.id, t) : undefined}
              />
            )}
          </div>
        </div>

        {/* Stats line */}
        <div className="flex items-center gap-2 text-[10px] text-content-muted">
          {context.stats?.cpk !== undefined && (
            <span>
              Cpk{' '}
              <span className={context.stats.cpk < 1 ? 'text-red-400' : 'text-green-400'}>
                {context.stats.cpk.toFixed(1)}
              </span>
            </span>
          )}
          {context.stats?.samples !== undefined && <span>n={context.stats.samples}</span>}
          {context.cumulativeScope !== null && context.cumulativeScope !== undefined && (
            <span>{Math.round(context.cumulativeScope)}% in focus</span>
          )}
        </div>
      </button>

      {/* Note + actions */}
      <div className="px-3 pb-2.5">
        {isEditing ? (
          <FindingEditor
            initialText={finding.text}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="flex items-start gap-1">
            {finding.text ? (
              <p className="flex-1 text-xs text-content italic leading-relaxed mt-0.5">
                &ldquo;{finding.text}&rdquo;
              </p>
            ) : (
              <p className="flex-1 text-xs text-content-muted italic leading-relaxed mt-0.5">
                No note
              </p>
            )}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {onAssign && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onAssign(finding.id);
                  }}
                  className="p-1 rounded text-content-muted hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
                  title="Assign finding"
                  aria-label="Assign finding"
                >
                  <UserPlus size={12} />
                </button>
              )}
              {onShare && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onShare(finding.id);
                  }}
                  className="p-1 rounded text-content-muted hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                  title="Share finding"
                  aria-label="Share finding"
                >
                  <Share2 size={12} />
                </button>
              )}
              {onAskCoScout && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const hypothesis = finding.hypothesisId
                      ? hypothesesMap?.[finding.hypothesisId]?.text
                      : undefined;
                    onAskCoScout({
                      finding: {
                        text: finding.text || 'Untitled finding',
                        status,
                        hypothesis,
                      },
                    });
                  }}
                  className="p-1 rounded text-content-muted hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                  title="Ask CoScout about this finding"
                  aria-label="Ask CoScout about this finding"
                  data-testid="ask-coscout-finding"
                >
                  <MessageCircle size={12} />
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 rounded text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
                title={finding.text ? 'Edit note' : 'Add note'}
                aria-label={finding.text ? 'Edit finding note' : 'Add note'}
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(finding.id);
                }}
                className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete finding"
                aria-label="Delete finding"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Assignee chip */}
        {finding.assignee && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-[10px] text-purple-400 rounded-full">
              <UserPlus size={9} />
              {finding.assignee.displayName}
            </span>
          </div>
        )}

        {/* Inline assign slot (e.g., PeoplePicker) */}
        {renderAssignSlot}

        {/* Hypothesis (visible from 'investigating' onward) */}
        {(onCreateHypothesis || finding.hypothesisId) &&
          ['investigating', 'analyzed', 'improving', 'resolved'].includes(status) && (
            <HypothesisSection
              findingId={finding.id}
              hypothesisId={finding.hypothesisId}
              hypothesesMap={hypothesesMap}
              onCreateHypothesis={onCreateHypothesis}
              readOnly={status === 'resolved'}
            />
          )}

        {/* Projection display (visible when projection exists) */}
        {finding.projection && (
          <ProjectionSection projection={finding.projection} hasSpecs={hasSpecs} />
        )}

        {/* "Project improvement" button (key-driver findings without projection) */}
        {onProjectImprovement &&
          finding.tag === 'key-driver' &&
          !finding.projection &&
          ['analyzed', 'improving'].includes(status) && (
            <div className="mt-2 border-t border-edge/50 pt-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onProjectImprovement(finding.id);
                }}
                className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                data-testid="project-improvement-btn"
              >
                <TrendingDown size={10} />
                <span>Project improvement</span>
              </button>
            </div>
          )}

        {/* Action Items (visible from 'analyzed' onward) */}
        {onAddAction && ['analyzed', 'improving', 'resolved'].includes(status) && (
          <ActionItemsSection
            findingId={finding.id}
            actions={finding.actions ?? []}
            onAddAction={onAddAction}
            onCompleteAction={onCompleteAction}
            onDeleteAction={onDeleteAction}
            readOnly={status === 'resolved'}
          />
        )}

        {/* Outcome (visible for 'improving' and 'resolved') */}
        {onSetOutcome && ['improving', 'resolved'].includes(status) && (
          <OutcomeSection
            findingId={finding.id}
            outcome={finding.outcome}
            onSetOutcome={onSetOutcome}
            readOnly={status === 'resolved'}
          />
        )}

        {/* Comments section */}
        {onAddComment && (
          <FindingComments
            comments={comments}
            findingId={finding.id}
            onAdd={onAddComment}
            onEdit={onEditComment ?? (() => {})}
            onDelete={onDeleteComment ?? (() => {})}
            onAddPhoto={onAddPhoto}
            onCaptureFromTeams={onCaptureFromTeams}
            showAuthors={showAuthors}
          />
        )}
      </div>
    </div>
  );
};

export default FindingCard;
