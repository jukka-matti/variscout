import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Layers,
  MessageCircle,
  Pencil,
  Share2,
  TrendingDown,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type {
  Finding,
  FindingAssignee,
  FindingSource,
  FindingStatus,
  FindingTag,
} from '@variscout/core';
import { getFindingStatus } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import FindingEditor from './FindingEditor';
import FindingStatusBadge from './FindingStatusBadge';
import FindingTagBadge from './FindingTagBadge';
import FindingComments from './FindingComments';
import ActionItemsSection from './FindingCardActions';
import ProjectionSection from './FindingCardProjection';
import { HypothesisSection, SuspectedCauseSection, OutcomeSection } from './FindingCardExpanded';

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
  /** Callback to add a comment, with optional file attachment */
  onAddComment?: (id: string, text: string, attachment?: File) => void;
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
  hypothesesMap?: Record<
    string,
    {
      text: string;
      status: string;
      factor?: string;
      level?: string;
      ideas?: Array<{ text: string; selected?: boolean }>;
      causeRole?: 'primary' | 'contributing';
    }
  >;
  /** Callback to add an action item */
  onAddAction?: (id: string, text: string, assignee?: FindingAssignee, dueDate?: string) => void;
  /** Optional slot to render an assignee picker for action items (e.g., PeoplePicker in Azure) */
  renderActionAssigneePicker?: (onSelect: (a: FindingAssignee) => void) => React.ReactNode;
  /** Callback to complete an action item */
  onCompleteAction?: (id: string, actionId: string) => void;
  /** Callback to delete an action item */
  onDeleteAction?: (id: string, actionId: string) => void;
  /** Projected Cpk from the linked improvement idea (for projected vs actual comparison) */
  projectedCpk?: number;
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
    finding: {
      text: string;
      status: string;
      hypothesis?: string;
      ideas?: Array<{ text: string; selected?: boolean }>;
    };
  }) => void;
  /** Callback to send a direct question to CoScout (used by per-action "Ask" buttons) */
  onAskCoScoutQuestion?: (question: string) => void;
}

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
  projectedCpk,
  onSetOutcome,
  onProjectImprovement,
  hasSpecs = false,
  onAskCoScout,
  onAskCoScoutQuestion,
  renderActionAssigneePicker,
}) => {
  const { t, formatStat } = useTranslation();
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
                  {finding.source.chart === 'ichart' || finding.source.chart === 'coscout'
                    ? finding.source.chart === 'ichart'
                      ? 'I-Chart'
                      : 'CoScout'
                    : finding.source.category}
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
                {formatStat(context.stats.cpk, 1)}
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
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 touch-show transition-opacity flex-shrink-0">
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
                    const hyp = finding.hypothesisId
                      ? hypothesesMap?.[finding.hypothesisId]
                      : undefined;
                    onAskCoScout({
                      finding: {
                        text: finding.text || 'Untitled finding',
                        status,
                        hypothesis: hyp?.text,
                        ideas: (
                          hyp as { ideas?: Array<{ text: string; selected?: boolean }> } | undefined
                        )?.ideas,
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
                title={t('action.delete')}
                aria-label={t('action.delete')}
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

        {/* Suspected cause (visible when any hypothesis has causeRole and finding is analyzed+) */}
        {hypothesesMap &&
          ['analyzed', 'improving', 'resolved'].includes(status) &&
          Object.values(hypothesesMap).some(h => h.causeRole) && (
            <SuspectedCauseSection hypothesesMap={hypothesesMap} />
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
            onAskCoScout={onAskCoScoutQuestion}
            readOnly={status === 'resolved'}
            renderActionAssigneePicker={renderActionAssigneePicker}
          />
        )}

        {/* Outcome (visible for 'improving' and 'resolved') */}
        {onSetOutcome && ['improving', 'resolved'].includes(status) && (
          <OutcomeSection
            findingId={finding.id}
            outcome={finding.outcome}
            onSetOutcome={onSetOutcome}
            readOnly={status === 'resolved'}
            projectedCpk={projectedCpk}
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
