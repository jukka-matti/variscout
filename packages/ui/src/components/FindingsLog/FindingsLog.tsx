import React from 'react';
import { Pin } from 'lucide-react';
import type {
  Finding,
  FindingStatus,
  FindingTag,
  Hypothesis,
  ImprovementIdea,
  IdeaImpact,
} from '@variscout/core';
import FindingCard from './FindingCard';
import FindingBoardView from './FindingBoardView';
import HypothesisTreeView from './HypothesisTreeView';

export interface FindingsLogProps {
  /** List of findings to display */
  findings: Finding[];
  /** Edit a finding's note */
  onEditFinding: (id: string, text: string) => void;
  /** Delete a finding */
  onDeleteFinding: (id: string) => void;
  /** Click a finding card to restore its filter state */
  onRestoreFinding: (id: string) => void;
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** ID of the finding that matches current active filters (if any) */
  activeFindingId?: string | null;
  /** View mode: 'list' (flat), 'board' (grouped by status), or 'tree' (hypothesis tree) */
  viewMode?: 'list' | 'board' | 'tree';
  /** All hypotheses for tree view */
  hypotheses?: Hypothesis[];
  /** Callback when a hypothesis node is selected in tree view */
  onSelectHypothesis?: (hypothesis: Hypothesis) => void;
  /** Add a sub-hypothesis under a parent */
  onAddSubHypothesis?: (parentId: string) => void;
  /** Get children summary for tree display */
  getChildrenSummary?: (parentId: string) => {
    supported: number;
    contradicted: number;
    untested: number;
    partial: number;
    total: number;
  };
  /** Change finding investigation status */
  onSetFindingStatus?: (id: string, status: FindingStatus) => void;
  /** Set a finding's classification tag */
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  /** Add a comment to a finding */
  onAddComment?: (id: string, text: string) => void;
  /** Edit an existing comment */
  onEditComment?: (findingId: string, commentId: string, text: string) => void;
  /** Delete a comment */
  onDeleteComment?: (findingId: string, commentId: string) => void;
  /** Callback when a photo is attached to a comment */
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  /** Callback to capture photo via Teams SDK */
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  /** Show author names on comments */
  showAuthors?: boolean;
  /** Share a finding via deep link. Passed through to FindingCard. */
  onShareFinding?: (findingId: string) => void;
  /** Assign someone to a finding. Passed through to FindingCard. */
  onAssignFinding?: (findingId: string) => void;
  /** Render inline assign UI for a specific finding (e.g., PeoplePicker) */
  renderAssignSlot?: (findingId: string) => React.ReactNode;
  /** Navigate to the chart that sourced a finding */
  onNavigateToChart?: (source: import('@variscout/core').FindingSource) => void;
  /** Maximum statuses to show in status badge dropdown (3=PWA, 5=Azure). Default: all. */
  maxStatuses?: number;
  /** Link a hypothesis to a finding */
  onLinkHypothesis?: (findingId: string, hypothesisId: string) => void;
  /** Create a new hypothesis and link to a finding */
  onCreateHypothesis?: (findingId: string, text: string, factor?: string, level?: string) => void;
  /** Map of hypothesis IDs to hypothesis objects for display */
  hypothesesMap?: Record<string, { text: string; status: string; factor?: string; level?: string }>;
  /** Add an action item */
  onAddAction?: (id: string, text: string, assignee?: string, dueDate?: string) => void;
  /** Complete an action item */
  onCompleteAction?: (id: string, actionId: string) => void;
  /** Delete an action item */
  onDeleteAction?: (id: string, actionId: string) => void;
  /** Set outcome assessment */
  onSetOutcome?: (
    id: string,
    outcome: {
      effective: 'yes' | 'no' | 'partial';
      cpkAfter?: number;
      notes?: string;
      verifiedAt: number;
    }
  ) => void;
  /** Open What-If simulator for a key-driver finding */
  onProjectImprovement?: (findingId: string) => void;
  /** Whether spec limits exist (affects projection display metrics) */
  hasSpecs?: boolean;
  // --- Improvement Ideas (passed through to HypothesisTreeView) ---
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
  /** Ask CoScout about a specific finding (from FindingCard action button) */
  onAskCoScoutAboutFinding?: (focusContext: {
    finding: { text: string; status: string; hypothesis?: string };
  }) => void;
}

/**
 * Scrollable list of analyst findings.
 * Supports list view (flat) and board view (grouped by status accordion).
 * Shows empty state with guidance when no findings exist.
 */
const FindingsLog: React.FC<FindingsLogProps> = ({
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  columnAliases,
  activeFindingId,
  viewMode = 'list',
  hypotheses,
  onSelectHypothesis,
  onAddSubHypothesis,
  getChildrenSummary,
  onSetFindingStatus,
  onSetFindingTag,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddPhoto,
  onCaptureFromTeams,
  showAuthors,
  onShareFinding,
  onAssignFinding,
  renderAssignSlot,
  onNavigateToChart,
  maxStatuses,
  onLinkHypothesis,
  onCreateHypothesis,
  hypothesesMap,
  onAddAction,
  onCompleteAction,
  onDeleteAction,
  onSetOutcome,
  onProjectImprovement,
  hasSpecs,
  ideaImpacts,
  onAddIdea,
  onUpdateIdea,
  onRemoveIdea,
  onSelectIdea,
  onProjectIdea,
  onAskCoScout,
  onAskCoScoutAboutFinding,
}) => {
  if (findings.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-surface-tertiary/50 flex items-center justify-center mb-3">
          <Pin size={18} className="text-content-muted" />
        </div>
        <p className="text-sm text-content-secondary mb-1">No findings yet</p>
        <p className="text-xs text-content-muted leading-relaxed max-w-[240px]">
          Pin interesting filter combinations as you explore. Click the pin button in the breadcrumb
          bar to save your current view.
        </p>
      </div>
    );
  }

  if (viewMode === 'tree' && hypotheses) {
    return (
      <HypothesisTreeView
        hypotheses={hypotheses}
        findings={findings}
        onSelectHypothesis={onSelectHypothesis}
        onAddSubHypothesis={onAddSubHypothesis}
        getChildrenSummary={getChildrenSummary}
        ideaImpacts={ideaImpacts}
        onAddIdea={onAddIdea}
        onUpdateIdea={onUpdateIdea}
        onRemoveIdea={onRemoveIdea}
        onSelectIdea={onSelectIdea}
        onProjectIdea={onProjectIdea}
        onAskCoScout={onAskCoScout}
      />
    );
  }

  if (viewMode === 'board' && onSetFindingStatus) {
    return (
      <FindingBoardView
        findings={findings}
        onEditFinding={onEditFinding}
        onDeleteFinding={onDeleteFinding}
        onRestoreFinding={onRestoreFinding}
        onSetFindingStatus={onSetFindingStatus}
        onSetFindingTag={onSetFindingTag}
        onAddComment={onAddComment ?? (() => {})}
        onEditComment={onEditComment ?? (() => {})}
        onDeleteComment={onDeleteComment ?? (() => {})}
        onAddPhoto={onAddPhoto}
        onCaptureFromTeams={onCaptureFromTeams}
        showAuthors={showAuthors}
        columnAliases={columnAliases}
        activeFindingId={activeFindingId}
        onAssignFinding={onAssignFinding}
        renderAssignSlot={renderAssignSlot}
        onNavigateToChart={onNavigateToChart}
        maxStatuses={maxStatuses}
        onLinkHypothesis={onLinkHypothesis}
        onCreateHypothesis={onCreateHypothesis}
        hypothesesMap={hypothesesMap}
        onAddAction={onAddAction}
        onCompleteAction={onCompleteAction}
        onDeleteAction={onDeleteAction}
        onSetOutcome={onSetOutcome}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" data-testid="findings-list">
      {findings.map(finding => (
        <FindingCard
          key={finding.id}
          finding={finding}
          onEdit={onEditFinding}
          onDelete={onDeleteFinding}
          onRestore={onRestoreFinding}
          onSetStatus={onSetFindingStatus}
          onSetTag={onSetFindingTag}
          onAddComment={onAddComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onAddPhoto={onAddPhoto}
          onCaptureFromTeams={onCaptureFromTeams}
          showAuthors={showAuthors}
          columnAliases={columnAliases}
          isActive={finding.id === activeFindingId}
          onShare={onShareFinding}
          onAssign={onAssignFinding}
          renderAssignSlot={renderAssignSlot?.(finding.id)}
          onNavigateToChart={onNavigateToChart}
          maxStatuses={maxStatuses}
          onLinkHypothesis={onLinkHypothesis}
          onCreateHypothesis={onCreateHypothesis}
          hypothesesMap={hypothesesMap}
          onAddAction={onAddAction}
          onCompleteAction={onCompleteAction}
          onDeleteAction={onDeleteAction}
          onSetOutcome={onSetOutcome}
          onProjectImprovement={onProjectImprovement}
          hasSpecs={hasSpecs}
          onAskCoScout={onAskCoScoutAboutFinding}
        />
      ))}
    </div>
  );
};

export default FindingsLog;
