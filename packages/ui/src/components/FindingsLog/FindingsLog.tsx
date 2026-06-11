import React from 'react';
import { Pin } from 'lucide-react';
import type { Finding, FindingStatus, FindingTag, ProcessContext } from '@variscout/core';
import type { FindingEvidenceType } from '@variscout/core/findings';
import FindingCard from './FindingCard';
import FindingBoardView from './FindingBoardView';
import FindingsExportMenu from './FindingsExportMenu';
import type { VoiceInputConfig } from '../VoiceInput';

export interface FindingsLogProps {
  /** Optional className for the root wrapper */
  className?: string;
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
  /** View mode: 'list' (flat) or 'board' (grouped by status). */
  viewMode?: 'list' | 'board';
  /** Change finding investigation status */
  onSetFindingStatus?: (id: string, status: FindingStatus) => void;
  /** Set a finding's classification tag */
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  /** Reclassify a finding's evidence angle */
  onSetFindingEvidenceType?: (id: string, evidenceType: FindingEvidenceType) => void;
  /** Add a comment to a finding */
  onAddComment?: (id: string, text: string, attachment?: File) => void;
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
  /** Add an action item */
  onAddAction?: (
    id: string,
    text: string,
    assignee?: import('@variscout/core').FindingAssignee,
    dueDate?: string
  ) => void;
  /** Optional slot to render an assignee picker for action items */
  renderActionAssigneePicker?: (
    onSelect: (a: import('@variscout/core').FindingAssignee) => void
  ) => React.ReactNode;
  /** Complete an action item */
  onCompleteAction?: (id: string, actionId: string) => void;
  /** Delete an action item */
  onDeleteAction?: (id: string, actionId: string) => void;
  /** Copy a finding-level action into the active project's action tracker (PR-CS-6 Edge 1) */
  onPromoteAction?: (findingId: string, actionId: string) => void;
  /**
   * PR-CS-6 Edge 4: resolved origin-step name per finding id (`Finding.originStepId`
   * → ProcessMap step name). The app wrapper resolves; FindingCard renders the
   * "from {step}" breadcrumb. Findings whose step no longer resolves are absent.
   */
  originStepNameByFindingId?: ReadonlyMap<string, string>;
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
  /** Ask CoScout about a specific finding (from FindingCard action button) */
  onAskCoScoutAboutFinding?: (focusContext: { finding: { text: string; status: string } }) => void;
  /** Process context for JSON export */
  processContext?: ProcessContext;
  /** Callback for AI report generation (requires AI endpoint) */
  onGenerateAIReport?: () => Promise<string>;
  /** Projected Cpk map keyed by finding ID (for projected vs actual comparison) */
  projectedCpkMap?: Record<string, number>;
  /** Synthesis narrative for board view header */
  synthesis?: string;
  /** Linked findings for board view synthesis card */
  linkedFindings?: Array<{ id: string; text: string }>;
  /** Optional Azure-only voice input that transcribes into finding/comment editors */
  voiceInput?: VoiceInputConfig;
  /** Mark a finding as supporting evidence for the selected hypothesis. */
  onMarkSupport?: (findingId: string) => void;
  /** Mark a finding as evidence that counts against the selected hypothesis. */
  onMarkCounter?: (findingId: string) => void;
}

/**
 * Scrollable list of analyst findings.
 * Supports list view (flat) and board view (grouped by status accordion).
 * Shows empty state with guidance when no findings exist.
 */
const FindingsLog: React.FC<FindingsLogProps> = ({
  className,
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  columnAliases,
  activeFindingId,
  viewMode = 'list',
  onSetFindingStatus,
  onSetFindingTag,
  onSetFindingEvidenceType,
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
  onAddAction,
  onCompleteAction,
  onDeleteAction,
  onPromoteAction,
  originStepNameByFindingId,
  onSetOutcome,
  onProjectImprovement,
  hasSpecs,
  renderActionAssigneePicker,
  onAskCoScoutAboutFinding,
  processContext,
  onGenerateAIReport,
  projectedCpkMap,
  synthesis,
  linkedFindings,
  voiceInput,
  onMarkSupport,
  onMarkCounter,
}) => {
  if (findings.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-surface-tertiary/50 flex items-center justify-center mb-3">
          <Pin size={18} className="text-content-muted" />
        </div>
        <p className="text-sm text-content-secondary mb-1">No findings yet</p>
        <p className="text-xs text-content-muted leading-relaxed max-w-[240px]">
          Brush a range, pin your filters, or capture a detected signal.
        </p>
      </div>
    );
  }

  if (viewMode === 'board' && onSetFindingStatus) {
    return (
      <div className={`flex-1 min-h-0 flex flex-col ${className ?? ''}`}>
        <FindingBoardView
          findings={findings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
          onRestoreFinding={onRestoreFinding}
          onSetFindingStatus={onSetFindingStatus}
          onSetFindingTag={onSetFindingTag}
          onSetFindingEvidenceType={onSetFindingEvidenceType}
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
          synthesis={synthesis}
          linkedFindings={linkedFindings}
          projectedCpkMap={projectedCpkMap}
          onAddAction={onAddAction}
          onCompleteAction={onCompleteAction}
          onDeleteAction={onDeleteAction}
          onPromoteAction={onPromoteAction}
          originStepNameByFindingId={originStepNameByFindingId}
          onSetOutcome={onSetOutcome}
          voiceInput={voiceInput}
        />
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-0 flex flex-col ${className ?? ''}`}>
      <div className="flex items-center justify-end px-3 pt-2 pb-0">
        <FindingsExportMenu
          findings={findings}
          processContext={processContext}
          onGenerateAIReport={onGenerateAIReport}
          columnAliases={columnAliases}
        />
      </div>
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
            onSetEvidenceType={onSetFindingEvidenceType}
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
            onAddAction={onAddAction}
            onCompleteAction={onCompleteAction}
            onDeleteAction={onDeleteAction}
            onPromoteAction={onPromoteAction}
            originStepName={originStepNameByFindingId?.get(finding.id)}
            onSetOutcome={onSetOutcome}
            onProjectImprovement={onProjectImprovement}
            hasSpecs={hasSpecs}
            renderActionAssigneePicker={renderActionAssigneePicker}
            onAskCoScout={onAskCoScoutAboutFinding}
            projectedCpk={projectedCpkMap?.[finding.id]}
            voiceInput={voiceInput}
            onMarkSupport={onMarkSupport}
            onMarkCounter={onMarkCounter}
          />
        ))}
      </div>
    </div>
  );
};

export default FindingsLog;
