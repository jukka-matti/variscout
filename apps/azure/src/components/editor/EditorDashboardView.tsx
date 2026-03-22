import React, { useCallback } from 'react';
import Dashboard from '../Dashboard';
import DataPanel from '../data/DataPanel';
import DataTableModal from '../data/DataTableModal';
import FindingsPanel from '../FindingsPanel';
import { CoScoutPanelBase, AIOnboardingTooltip } from '@variscout/ui';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { hasTeamFeatures } from '@variscout/core';
import type { ExclusionReason, FindingStatus } from '@variscout/core';
import type { UseHypothesesReturn, ViewState, UseFindingsReturn } from '@variscout/hooks';
import { isAIAvailable } from '../../services/aiService';
import { useData } from '../../context/DataContext';
import { usePanelsStore } from '../../stores/panelsStore';
import { useFindingsStore } from '../../stores/findingsStore';
import { useInvestigationStore } from '../../stores/investigationStore';
import { useImprovementStore } from '../../stores/improvementStore';
import type { UseEditorDataFlowReturn } from '../../hooks/useEditorDataFlow';
import type { UseFilterNavigationReturn } from '../../hooks';
import type { FindingsCallbacks } from '../../types/findingsCallbacks';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import type { UseAIOrchestrationReturn } from '../../features/ai';
import type { UseActionProposalsReturn } from '../../features/ai';
import { X } from 'lucide-react';

const COSCOUT_RESIZE_CONFIG = {
  storageKey: 'variscout-azure-coscout-panel-width',
  min: 320,
  max: 600,
  defaultWidth: 384,
};

interface EditorDashboardViewProps {
  dataFlow: UseEditorDataFlowReturn;
  filterNav: UseFilterNavigationReturn;
  viewState: ViewState | undefined;
  onViewStateChange: (partial: Partial<ViewState>) => void;
  // Findings (from useFindingsOrchestration)
  findingsState: UseFindingsReturn;
  findingsCallbacks: FindingsCallbacks;
  handlePinFinding: UseFindingsOrchestrationReturn['handlePinFinding'];
  handleRestoreFinding: UseFindingsOrchestrationReturn['handleRestoreFinding'];
  handleNavigateToChart: UseFindingsOrchestrationReturn['handleNavigateToChart'];
  handleShareFinding: UseFindingsOrchestrationReturn['handleShareFinding'];
  handleOpenFindingsPopout: UseFindingsOrchestrationReturn['handleOpenFindingsPopout'];
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  drillPath: UseFindingsOrchestrationReturn['drillPath'];
  // Hypotheses
  hypothesesState: UseHypothesesReturn;
  handleCreateHypothesis: (
    findingId: string,
    text: string,
    factor?: string,
    level?: string
  ) => void;
  handleProjectIdea: (hypothesisId: string, ideaId: string) => void;
  // Photo comments
  handleAddCommentWithAuthor: (findingId: string, text: string) => void;
  handleAddPhoto: ((findingId: string, commentId: string, file: File) => Promise<void>) | undefined;
  handleCaptureFromTeams: ((findingId: string, commentId: string) => Promise<void>) | undefined;
  isTeamsCamera: boolean;
  // AI (from useAIOrchestration)
  aiOrch: UseAIOrchestrationReturn;
  // Action proposals (from useActionProposals)
  actionProposalsState: UseActionProposalsReturn;
  handleSearchKnowledge: () => void;
  handleShareChart: (chartType: string) => void;
  // Data quality
  controlViolations: Map<number, string[]> | undefined;
  excludedRowIndices: Set<number> | undefined;
  excludedReasons: Map<number, ExclusionReason[]> | undefined;
  // Column aliases
  columnAliases: Record<string, string>;
}

export const EditorDashboardView: React.FC<EditorDashboardViewProps> = ({
  dataFlow,
  filterNav,
  viewState,
  onViewStateChange,
  findingsState,
  findingsCallbacks,
  handlePinFinding,
  handleRestoreFinding,
  handleNavigateToChart,
  handleShareFinding,
  handleOpenFindingsPopout,
  handleSetFindingStatus,
  drillPath,
  hypothesesState,
  handleCreateHypothesis,
  handleProjectIdea,
  handleAddCommentWithAuthor,
  handleAddPhoto,
  handleCaptureFromTeams,
  isTeamsCamera,
  aiOrch,
  actionProposalsState,
  handleSearchKnowledge,
  handleShareChart,
  controlViolations,
  excludedRowIndices,
  excludedReasons,
  columnAliases,
}) => {
  const { factors, aiEnabled, processContext } = useData();
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  // Panel state from Zustand
  const isFindingsOpen = usePanelsStore(s => s.isFindingsOpen);
  const isCoScoutOpen = usePanelsStore(s => s.isCoScoutOpen);
  const isReportOpen = usePanelsStore(s => s.isReportOpen);
  const isPresentationMode = usePanelsStore(s => s.isPresentationMode);
  const isDataPanelOpen = usePanelsStore(s => s.isDataPanelOpen);
  const isDataTableOpen = usePanelsStore(s => s.isDataTableOpen);
  const highlightRowIndex = usePanelsStore(s => s.highlightRowIndex);
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);

  // Findings highlight from Zustand
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const setHighlightedFindingId = useFindingsStore(s => s.setHighlightedFindingId);

  // Investigation store
  const hypothesesMap = useInvestigationStore(s => s.hypothesesMap);
  const ideaImpacts = useInvestigationStore(s => s.ideaImpacts);

  // Improvement store
  const projectedCpkMap = useImprovementStore(s => s.projectedCpkMap);
  const improvementLinkedFindings = useImprovementStore(s => s.improvementLinkedFindings);

  // Destructure AI orchestration
  const {
    aiContext,
    narration,
    coscout,
    knowledgeSearch,
    suggestedQuestions,
    fetchChartInsight: fetchChartInsightFromAI,
    handleNarrativeAsk,
    handleAskCoScoutFromCategory,
    handleAskCoScoutFromIdeas,
    handleAskCoScoutFromFinding,
  } = aiOrch;

  const { actionProposals, handleExecuteAction, handleDismissAction } = actionProposalsState;

  const handleCloseFindingsPanel = useCallback(() => {
    usePanelsStore.getState().setFindingsOpen(false);
    setHighlightedFindingId(null);
  }, [setHighlightedFindingId]);

  // Build shared FindingsPanel props to avoid duplication between phone/desktop
  const sharedFindingsProps = {
    findings: findingsState.findings,
    onEditFinding: findingsState.editFinding,
    onDeleteFinding: findingsState.deleteFinding,
    onRestoreFinding: handleRestoreFinding,
    onSetFindingStatus: handleSetFindingStatus,
    onSetFindingTag: findingsState.setFindingTag,
    onAddComment: handleAddCommentWithAuthor,
    onEditComment: findingsState.editFindingComment,
    onDeleteComment: findingsState.deleteFindingComment,
    onAddPhoto: hasTeamFeatures() ? handleAddPhoto : undefined,
    onCaptureFromTeams: hasTeamFeatures() && isTeamsCamera ? handleCaptureFromTeams : undefined,
    onCreateHypothesis: handleCreateHypothesis,
    hypothesesMap,
    hypotheses: hypothesesState.hypotheses,
    onAddSubHypothesis: hypothesesState.addSubHypothesis,
    factors,
    getChildrenSummary: hypothesesState.getChildrenSummary,
    onSetValidationTask: hypothesesState.setValidationTask,
    onCompleteTask: hypothesesState.completeTask,
    onSetManualStatus: hypothesesState.setManualStatus,
    onAddAction: findingsState.addAction,
    onCompleteAction: findingsState.completeAction,
    onDeleteAction: findingsState.deleteAction,
    onSetOutcome: findingsState.setOutcome,
    ideaImpacts,
    onAddIdea: hypothesesState.addIdea,
    onUpdateIdea: hypothesesState.updateIdea,
    onRemoveIdea: hypothesesState.removeIdea,
    onSelectIdea: hypothesesState.selectIdea,
    onProjectIdea: handleProjectIdea,
    onSetCauseRole: hypothesesState.setCauseRole,
    onAskCoScout: handleAskCoScoutFromIdeas,
    onAskCoScoutAboutFinding: handleAskCoScoutFromFinding,
    showAuthors: true,
    columnAliases,
    drillPath,
    activeFindingId: highlightedFindingId,
    onShareFinding: handleShareFinding,
    onSetFindingAssignee: findingsState.setFindingAssignee,
    onNavigateToChart: handleNavigateToChart,
    viewMode: viewState?.findingsViewMode,
    onViewModeChange: (mode: 'list' | 'board' | 'tree') =>
      onViewStateChange({ findingsViewMode: mode }),
    coScoutMessages: coscout.messages,
    coScoutOnSend: coscout.send,
    coScoutIsLoading: coscout.isLoading,
    coScoutIsStreaming: coscout.isStreaming,
    coScoutOnStopStreaming: coscout.stopStreaming,
    coScoutError: coscout.error,
    coScoutOnRetry: coscout.retry,
    investigationPhase: aiContext.context?.investigation?.phase,
    coScoutSuggestedQuestions: suggestedQuestions,
    projectedCpkMap,
    synthesis: processContext?.synthesis,
    linkedFindings: improvementLinkedFindings,
  };

  // Shared CoScoutPanel props
  const sharedCoScoutProps = {
    messages: coscout.messages,
    onSend: coscout.send,
    isLoading: coscout.isLoading,
    isStreaming: coscout.isStreaming,
    onStopStreaming: coscout.stopStreaming,
    error: coscout.error,
    onRetry: coscout.retry,
    onClear: coscout.clear,
    onCopyLastResponse: coscout.copyLastResponse,
    resizeConfig: COSCOUT_RESIZE_CONFIG,
    suggestedQuestions,
    onSuggestedQuestionClick: coscout.send,
    knowledgeAvailable: knowledgeSearch.isAvailable,
    knowledgeSearching: knowledgeSearch.isSearching,
    knowledgeDocuments: knowledgeSearch.documents,
    onSearchKnowledge: handleSearchKnowledge,
    actionProposals,
    onExecuteAction: handleExecuteAction,
    onDismissAction: handleDismissAction,
  };

  const aiAvailable = aiEnabled && isAIAvailable();

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <Dashboard
          drillFromPerformance={dataFlow.drillFromPerformance}
          onBackToPerformance={dataFlow.handleBackToPerformance}
          onDrillToMeasure={dataFlow.handleDrillToMeasure}
          onPointClick={isPhone ? undefined : usePanelsStore.getState().handlePointClick}
          highlightedPointIndex={isPhone ? undefined : highlightedChartPoint}
          filterNav={filterNav}
          initialViewState={viewState ?? undefined}
          onViewStateChange={onViewStateChange}
          isReportOpen={isReportOpen}
          onCloseReport={() => usePanelsStore.getState().closeReport()}
          isPresentationMode={isPresentationMode}
          onExitPresentation={() => usePanelsStore.getState().closePresentation()}
          onManageFactors={dataFlow.openFactorManager}
          onPinFinding={handlePinFinding}
          onShareChart={handleShareChart}
          findingsCallbacks={findingsCallbacks}
          fetchChartInsight={fetchChartInsightFromAI}
          aiContext={aiContext.context}
          aiEnabled={aiAvailable}
          narrative={narration.narrative}
          narrativeLoading={narration.isLoading}
          narrativeCached={narration.isCached}
          narrativeError={narration.error}
          onNarrativeRetry={narration.refresh}
          onNarrativeAsk={handleNarrativeAsk}
          onAskCoScoutFromCategory={handleAskCoScoutFromCategory}
          findings={findingsState.findings}
        />
        {/* AI onboarding tooltip */}
        <AIOnboardingTooltip
          isAIAvailable={aiAvailable}
          anchorSelector='[data-testid="narrative-ask-button"]'
        />
        {/* FindingsPanel: full-screen overlay on phone, inline sidebar on desktop */}
        {isPhone && isFindingsOpen ? (
          <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
            <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
              <h2 className="text-sm font-semibold text-content">Findings</h2>
              <button
                onClick={handleCloseFindingsPanel}
                className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Close findings"
              >
                <X size={20} />
              </button>
            </div>
            <FindingsPanel
              isOpen={true}
              onClose={handleCloseFindingsPanel}
              {...sharedFindingsProps}
            />
          </div>
        ) : (
          <FindingsPanel
            isOpen={isFindingsOpen}
            onClose={handleCloseFindingsPanel}
            onPopout={handleOpenFindingsPopout}
            onSelectHypothesis={_h => {
              // Hypothesis drill-down — currently handled via filter navigation at parent level
            }}
            {...sharedFindingsProps}
          />
        )}
        {/* CoScoutPanel: full-screen overlay on phone, inline sidebar on desktop */}
        {isPhone && isCoScoutOpen ? (
          <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-slide-up safe-area-bottom">
            <div className="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
              <h2 className="text-sm font-semibold text-content">CoScout</h2>
              <button
                onClick={() => usePanelsStore.getState().setCoScoutOpen(false)}
                className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Close CoScout"
              >
                <X size={20} />
              </button>
            </div>
            <CoScoutPanelBase
              isOpen={true}
              onClose={() => usePanelsStore.getState().setCoScoutOpen(false)}
              {...sharedCoScoutProps}
            />
          </div>
        ) : (
          <CoScoutPanelBase
            isOpen={isCoScoutOpen}
            onClose={() => usePanelsStore.getState().setCoScoutOpen(false)}
            {...sharedCoScoutProps}
          />
        )}
        {/* DataPanel: hidden on phone (use DataTableModal instead) */}
        {!isPhone && (
          <DataPanel
            isOpen={isDataPanelOpen}
            onClose={() => usePanelsStore.getState().closeDataPanel()}
            highlightRowIndex={highlightRowIndex}
            onRowClick={usePanelsStore.getState().handleRowClick}
            controlViolations={controlViolations}
            onOpenEditor={() => usePanelsStore.getState().openDataTable()}
          />
        )}
      </div>

      {/* Data Table Editor Modal */}
      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={() => usePanelsStore.getState().closeDataTable()}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
        controlViolations={controlViolations}
      />
    </>
  );
};
