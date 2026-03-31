import React, { useState, useEffect, useCallback } from 'react';
import {
  GripVertical,
  X,
  ClipboardCopy,
  Check,
  ExternalLink,
  List,
  LayoutGrid,
  GitBranch,
  User,
} from 'lucide-react';
import type {
  Finding,
  FindingSource,
  FindingStatus,
  FindingTag,
  ImprovementIdea,
  IdeaImpact,
  CoScoutMessage,
  CoScoutError,
  InvestigationPhase,
} from '@variscout/core';
import type { DrillStep } from '@variscout/hooks';
import { useResizablePanel, useTranslation } from '@variscout/hooks';
import { FindingsLog, copyFindingsToClipboard } from '../FindingsLog';
import { CoScoutInline } from '../CoScoutInline';

export interface FindingsPanelResizeConfig {
  storageKey: string;
  min?: number;
  max?: number;
  defaultWidth?: number;
}

export interface FindingsPanelBaseProps {
  isOpen: boolean;
  onClose: () => void;

  // FindingsLog passthrough
  findings: Finding[];
  onEditFinding: (id: string, text: string) => void;
  onDeleteFinding: (id: string) => void;
  onRestoreFinding: (id: string) => void;
  onSetFindingStatus: (id: string, status: FindingStatus) => void;
  onSetFindingTag?: (id: string, tag: FindingTag | null) => void;
  onAddComment: (id: string, text: string, attachment?: File) => void;
  onEditComment: (findingId: string, commentId: string, text: string) => void;
  onDeleteComment: (findingId: string, commentId: string) => void;

  // Azure-optional (not used in PWA)
  onAddPhoto?: (findingId: string, commentId: string, file: File) => void;
  onCaptureFromTeams?: (findingId: string, commentId: string) => void;
  showAuthors?: boolean;
  onShareFinding?: (findingId: string) => void;
  onAssignFinding?: (findingId: string) => void;
  renderAssignSlot?: (findingId: string) => React.ReactNode;
  onNavigateToChart?: (source: FindingSource) => void;

  // 5-status investigation (Azure only)
  maxStatuses?: number;
  onLinkHypothesis?: (findingId: string, hypothesisId: string) => void;
  onCreateHypothesis?: (findingId: string, text: string, factor?: string, level?: string) => void;
  hypothesesMap?: Record<string, { text: string; status: string; factor?: string; level?: string }>;
  onAddAction?: (
    id: string,
    text: string,
    assignee?: import('@variscout/core').FindingAssignee,
    dueDate?: string
  ) => void;
  renderActionAssigneePicker?: (
    onSelect: (a: import('@variscout/core').FindingAssignee) => void
  ) => React.ReactNode;
  onCompleteAction?: (id: string, actionId: string) => void;
  onDeleteAction?: (id: string, actionId: string) => void;
  onSetOutcome?: (
    id: string,
    outcome: {
      effective: 'yes' | 'no' | 'partial';
      cpkAfter?: number;
      notes?: string;
      verifiedAt: number;
    }
  ) => void;

  // Panel chrome
  columnAliases?: Record<string, string>;
  drillPath: DrillStep[];
  activeFindingId?: string | null;
  onPopout?: () => void;

  // View mode (uncontrolled by default, controlled when both provided)
  viewMode?: 'list' | 'board' | 'tree';
  onViewModeChange?: (mode: 'list' | 'board' | 'tree') => void;

  // Tree view props (passed through to FindingsLog → HypothesisTreeView)
  hypotheses?: import('@variscout/core').Hypothesis[];
  onSelectHypothesis?: (hypothesis: import('@variscout/core').Hypothesis) => void;
  onAddSubHypothesis?: (
    parentId: string,
    text: string,
    factor?: string,
    validationType?: 'data' | 'gemba' | 'expert'
  ) => void;
  /** Available factor columns for sub-hypothesis factor picker */
  factors?: string[];
  getChildrenSummary?: (parentId: string) => {
    supported: number;
    contradicted: number;
    untested: number;
    partial: number;
    total: number;
  };

  // --- Validation Task (passed through to FindingsLog → HypothesisTreeView) ---
  onSetValidationTask?: (id: string, task: string) => void;
  onCompleteTask?: (id: string) => void;
  onSetManualStatus?: (
    id: string,
    status: import('@variscout/core').HypothesisStatus,
    note?: string
  ) => void;
  // --- Improvement Ideas (passed through to FindingsLog → HypothesisTreeView) ---
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  onAddIdea?: (hypothesisId: string, text: string) => void;
  onUpdateIdea?: (
    hypothesisId: string,
    ideaId: string,
    updates: Partial<Pick<ImprovementIdea, 'text' | 'timeframe' | 'impactOverride' | 'notes'>>
  ) => void;
  onRemoveIdea?: (hypothesisId: string, ideaId: string) => void;
  onSelectIdea?: (hypothesisId: string, ideaId: string, selected: boolean) => void;
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
  onAskCoScout?: (question: string) => void;
  /** Set cause role on a hypothesis */
  onSetCauseRole?: (
    hypothesisId: string,
    role: 'suspected-cause' | 'contributing' | 'ruled-out' | undefined
  ) => void;
  /** Ask CoScout about a specific finding (from FindingCard action button) */
  onAskCoScoutAboutFinding?: (focusContext: {
    finding: { text: string; status: string; hypothesis?: string };
  }) => void;

  // Resize config
  resizeConfig: FindingsPanelResizeConfig;

  // CoScout inline (Azure only — omit in PWA)
  coScoutMessages?: CoScoutMessage[];
  coScoutOnSend?: (text: string) => void;
  coScoutIsLoading?: boolean;
  coScoutIsStreaming?: boolean;
  coScoutOnStopStreaming?: () => void;
  coScoutError?: CoScoutError | null;
  coScoutOnRetry?: () => void;
  investigationPhase?: InvestigationPhase;
  coScoutSuggestedQuestions?: string[];

  /** Current user's UPN for "assigned to me" filtering (Azure Team only) */
  currentUserUpn?: string;
  /** Projected Cpk map keyed by finding ID (for projected vs actual comparison) */
  projectedCpkMap?: Record<string, number>;
  /** Synthesis narrative for board view header */
  synthesis?: string;
  /** Linked findings for board view synthesis card */
  linkedFindings?: Array<{ id: string; text: string }>;
}

const FindingsPanelBase: React.FC<FindingsPanelBaseProps> = ({
  isOpen,
  onClose,
  findings,
  onEditFinding,
  onDeleteFinding,
  onRestoreFinding,
  onSetFindingStatus,
  onSetFindingTag,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddPhoto,
  onCaptureFromTeams,
  showAuthors,
  columnAliases,
  drillPath,
  activeFindingId,
  onPopout,
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
  renderActionAssigneePicker,
  viewMode: externalViewMode,
  onViewModeChange,
  hypotheses,
  onSelectHypothesis,
  onAddSubHypothesis,
  factors,
  getChildrenSummary,
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
  onAskCoScoutAboutFinding,
  resizeConfig,
  coScoutMessages,
  coScoutOnSend,
  coScoutIsLoading,
  coScoutIsStreaming,
  coScoutOnStopStreaming,
  coScoutError,
  coScoutOnRetry,
  investigationPhase,
  coScoutSuggestedQuestions,
  currentUserUpn,
  projectedCpkMap,
  synthesis,
  linkedFindings,
}) => {
  const { t, formatStat } = useTranslation();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [coScoutExpanded, setCoScoutExpanded] = useState(false);
  const [localViewMode, setLocalViewMode] = useState<'list' | 'board' | 'tree'>('list');
  const viewMode = externalViewMode ?? localViewMode;
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);

  const displayFindings =
    showAssignedToMe && currentUserUpn
      ? findings.filter(
          f =>
            f.assignee?.upn === currentUserUpn ||
            f.actions?.some(a => a.assignee?.upn === currentUserUpn)
        )
      : findings;

  const handleViewModeChange = (mode: 'list' | 'board' | 'tree') => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const { width, isDragging, handleMouseDown } = useResizablePanel(
    resizeConfig.storageKey,
    resizeConfig.min ?? 320,
    resizeConfig.max ?? 600,
    resizeConfig.defaultWidth ?? 384
  );

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyAll = useCallback(async () => {
    const ok = await copyFindingsToClipboard(displayFindings, columnAliases);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, [displayFindings, columnAliases]);

  if (!isOpen) return null;

  return (
    <>
      {/* Draggable divider */}
      <div
        className={`w-1 bg-surface-tertiary hover:bg-blue-500 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical size={12} className="text-content-muted" />
      </div>

      {/* Panel */}
      <div
        className="flex-shrink-0 bg-surface-secondary border-l border-edge flex flex-col overflow-hidden"
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-content flex items-center">
            {t('panel.findings')}
            {findings.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[0.625rem] bg-blue-500/20 text-blue-400 rounded">
                {showAssignedToMe ? displayFindings.length : findings.length}
              </span>
            )}
            {currentUserUpn && findings.length > 0 && (
              <button
                onClick={() => setShowAssignedToMe(prev => !prev)}
                className={`ml-2 p-1 rounded transition-colors ${
                  showAssignedToMe
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-content-muted hover:text-content-secondary hover:bg-surface-tertiary'
                }`}
                title="Assigned to me"
                aria-label="Assigned to me"
                aria-pressed={showAssignedToMe}
              >
                <User size={12} />
              </button>
            )}
          </h2>

          <div className="flex items-center gap-1">
            {/* View toggle */}
            {findings.length > 0 && (
              <div className="flex items-center rounded-lg border border-edge overflow-hidden mr-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-surface-tertiary text-content'
                      : 'text-content-muted hover:text-content-secondary'
                  }`}
                  title={t('view.list')}
                  aria-label={t('view.list')}
                >
                  <List size={12} />
                </button>
                <button
                  onClick={() => handleViewModeChange('board')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'board'
                      ? 'bg-surface-tertiary text-content'
                      : 'text-content-muted hover:text-content-secondary'
                  }`}
                  title={t('view.board')}
                  aria-label={t('view.board')}
                >
                  <LayoutGrid size={12} />
                </button>
                {hypotheses && hypotheses.length > 0 && (
                  <button
                    onClick={() => handleViewModeChange('tree')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'tree'
                        ? 'bg-surface-tertiary text-content'
                        : 'text-content-muted hover:text-content-secondary'
                    }`}
                    title={t('view.tree')}
                    aria-label={t('view.tree')}
                  >
                    <GitBranch size={12} />
                  </button>
                )}
              </div>
            )}
            {findings.length > 0 && (
              <button
                onClick={handleCopyAll}
                className={`p-1.5 rounded-lg transition-all ${
                  copyFeedback
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
                }`}
                title="Copy all findings to clipboard"
                aria-label="Copy all findings"
              >
                {copyFeedback ? <Check size={14} /> : <ClipboardCopy size={14} />}
              </button>
            )}
            {onPopout && (
              <button
                onClick={onPopout}
                className="hidden sm:inline-flex p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Open in separate window"
                aria-label="Open findings in separate window"
              >
                <ExternalLink size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
              title="Close"
              aria-label="Close findings panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Findings list/board */}
        <FindingsLog
          findings={displayFindings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
          onRestoreFinding={onRestoreFinding}
          onSetFindingStatus={onSetFindingStatus}
          onSetFindingTag={onSetFindingTag}
          onAddComment={onAddComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onAddPhoto={onAddPhoto}
          onCaptureFromTeams={onCaptureFromTeams}
          showAuthors={showAuthors}
          columnAliases={columnAliases}
          activeFindingId={activeFindingId}
          onShareFinding={onShareFinding}
          onAssignFinding={onAssignFinding}
          renderAssignSlot={renderAssignSlot}
          onNavigateToChart={onNavigateToChart}
          viewMode={viewMode}
          hypotheses={hypotheses}
          onSelectHypothesis={onSelectHypothesis}
          onAddSubHypothesis={onAddSubHypothesis}
          factors={factors}
          getChildrenSummary={getChildrenSummary}
          onSetValidationTask={onSetValidationTask}
          onCompleteTask={onCompleteTask}
          onSetManualStatus={onSetManualStatus}
          maxStatuses={maxStatuses}
          onLinkHypothesis={onLinkHypothesis}
          onCreateHypothesis={onCreateHypothesis}
          hypothesesMap={hypothesesMap}
          onAddAction={onAddAction}
          onCompleteAction={onCompleteAction}
          onDeleteAction={onDeleteAction}
          onSetOutcome={onSetOutcome}
          renderActionAssigneePicker={renderActionAssigneePicker}
          ideaImpacts={ideaImpacts}
          onAddIdea={onAddIdea}
          onUpdateIdea={onUpdateIdea}
          onRemoveIdea={onRemoveIdea}
          onSelectIdea={onSelectIdea}
          onProjectIdea={onProjectIdea}
          onAskCoScout={onAskCoScout}
          onSetCauseRole={onSetCauseRole}
          onAskCoScoutAboutFinding={onAskCoScoutAboutFinding}
          projectedCpkMap={projectedCpkMap}
          synthesis={synthesis}
          linkedFindings={linkedFindings}
        />

        {/* CoScout inline (Azure only) */}
        {coScoutMessages && coScoutOnSend && (
          <CoScoutInline
            messages={coScoutMessages}
            onSend={coScoutOnSend}
            isLoading={coScoutIsLoading ?? false}
            isStreaming={coScoutIsStreaming}
            onStopStreaming={coScoutOnStopStreaming}
            error={coScoutError}
            onRetry={coScoutOnRetry}
            phase={investigationPhase}
            suggestedQuestions={coScoutSuggestedQuestions}
            isExpanded={coScoutExpanded}
            onToggleExpand={() => setCoScoutExpanded(prev => !prev)}
          />
        )}

        {/* Drill path footer */}
        {drillPath.length > 0 && (
          <div className="px-4 py-3 border-t border-edge">
            <div className="text-[0.625rem] text-content-muted uppercase tracking-wider mb-1.5">
              {t('panel.drillPath')}
            </div>
            <div className="flex flex-wrap gap-1">
              {drillPath.map((step, i) => (
                <span
                  key={step.factor}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[0.6875rem] rounded-full"
                >
                  {columnAliases?.[step.factor] || step.factor}
                  <span className="text-blue-300/60">
                    {formatStat(step.scopeFraction * 100, 0)}%
                  </span>
                  {i < drillPath.length - 1 && (
                    <span className="text-content-muted ml-0.5">&rarr;</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { FindingsPanelBase };
