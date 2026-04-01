import React, { useCallback, useMemo, useState } from 'react';
import Dashboard from '../Dashboard';

const StatsPanel = React.lazy(() => import('../StatsPanel'));
import DataTableModal from '../data/DataTableModal';
import FindingsPanel from '../FindingsPanel';
import { CoScoutPanelBase, AIOnboardingTooltip, SessionClosePrompt } from '@variscout/ui';
import type { SessionClosePromptItem } from '@variscout/ui';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { hasTeamFeatures, toNumericValue, createFactorFinding } from '@variscout/core';
import { computeCenteringOpportunity } from '@variscout/core/variation';
import type { ExclusionReason, FindingStatus } from '@variscout/core';
import type { UseHypothesesReturn, ViewState, UseFindingsReturn } from '@variscout/hooks';
import { useQuestionGeneration } from '@variscout/hooks';
import { resolveMode, getStrategy } from '@variscout/core/strategy';
import { isAIAvailable } from '../../services/aiService';
import { useData } from '../../context/DataContext';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import { useInvestigationStore } from '../../features/investigation/investigationStore';
import { useImprovementStore } from '../../features/improvement/improvementStore';
import { useAIStore } from '../../features/ai/aiStore';
import type { UseEditorDataFlowReturn } from '../../hooks/useEditorDataFlow';
import type { UseFilterNavigationReturn } from '../../hooks';
import { useResizablePanel } from '@variscout/hooks';
import type { AzureFindingsCallbacks } from '@variscout/ui';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import type { UseAIOrchestrationReturn } from '../../features/ai';
import type { UseActionProposalsReturn } from '../../features/ai';
import { X, GripVertical } from 'lucide-react';

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
  findingsCallbacks: AzureFindingsCallbacks;
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
  handleAddCommentWithAuthor: (
    findingId: string,
    text: string,
    attachment?: File
  ) => void | Promise<void>;
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
  const {
    factors,
    aiEnabled,
    processContext,
    rawData,
    filteredData,
    stats,
    filters,
    specs,
    outcome,
    cpkTarget,
    analysisMode,
  } = useData();
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  // Question-driven investigation (ADR-053)
  const resolved = resolveMode(analysisMode ?? 'standard');
  const {
    questions: factorIntelQuestions,
    bestSubsets,
    handleQuestionClick,
    factorRequest,
  } = useQuestionGeneration({
    filteredData: filteredData ?? [],
    outcome,
    factors,
    hypothesesState,
    mode: resolved,
  });

  // Session-close prompt state (ADR-049)
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [closePromptItems, setClosePromptItems] = useState<SessionClosePromptItem[]>([]);

  // Panel state from Zustand
  const isFindingsOpen = usePanelsStore(s => s.isFindingsOpen);
  const isCoScoutOpen = usePanelsStore(s => s.isCoScoutOpen);
  const isDataTableOpen = usePanelsStore(s => s.isDataTableOpen);
  const isStatsSidebarOpen = usePanelsStore(s => s.isStatsSidebarOpen);
  const statsSidebar = useResizablePanel('variscout-stats-sidebar-width', 280, 500, 320, 'left');
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);

  // Target discovery: complement stats + centering opportunity for sidebar
  const isDrilling = Object.keys(filters).length > 0;
  const complementInsight = useMemo(() => {
    if (
      !isDrilling ||
      !outcome ||
      !filteredData ||
      !rawData ||
      filteredData.length >= rawData.length
    )
      return null;
    const filteredSet = new Set(filteredData);
    const compRows = rawData.filter(r => !filteredSet.has(r));
    const values = compRows
      .map(r => toNumericValue(r[outcome]))
      .filter((v): v is number => v !== undefined);
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return { mean, stdDev: Math.sqrt(variance), count: values.length };
  }, [isDrilling, outcome, filteredData, rawData]);

  const centeringOpp = useMemo(() => (stats ? computeCenteringOpportunity(stats) : null), [stats]);

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

  // ── Factor Intelligence → Findings bridge ──────────────────────────────
  const handleInvestigateFactor = useCallback(
    (effect: import('@variscout/core/stats').FactorMainEffect) => {
      if (!outcome || !filteredData || filteredData.length === 0) return;

      // Create the bundle: Finding + Hypothesis + ImprovementIdea
      const bundle = createFactorFinding({
        factor: effect.factor,
        bestLevel: effect.bestLevel,
        worstLevel: effect.worstLevel,
        etaSquared: effect.etaSquared,
        effectRange: effect.effectRange,
        pValue: effect.pValue,
      });

      // Add finding via findingsState
      const addedFinding = findingsState.addFinding(
        bundle.finding.text,
        bundle.finding.context,
        undefined // no chart source
      );

      // Add hypothesis and apply pre-validated status from Factor Intelligence
      const addedHypothesis = hypothesesState.addHypothesis(
        bundle.hypothesis.text,
        bundle.hypothesis.factor,
        bundle.hypothesis.level
      );
      hypothesesState.setManualStatus(addedHypothesis.id, 'supported');

      // Link finding ↔ hypothesis
      findingsState.linkHypothesis(addedFinding.id, addedHypothesis.id, 'supports');

      // Add improvement idea to the hypothesis
      hypothesesState.addIdea(addedHypothesis.id, bundle.idea.text);

      // Set finding status to 'investigating' and open Findings panel
      handleSetFindingStatus(addedFinding.id, 'investigating');
      usePanelsStore.getState().setFindingsOpen(true);
      useFindingsStore.getState().setHighlightedFindingId(addedFinding.id);
    },
    [outcome, filteredData, findingsState, hypothesesState, handleSetFindingStatus]
  );

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
    // Question-driven investigation (ADR-053)
    questions: factorIntelQuestions,
    issueStatement: processContext?.issueStatement,
    evidenceLabel: getStrategy(resolved).questionStrategy.evidenceLabel,
    onQuestionClick: handleQuestionClick,
    linkedFindings: improvementLinkedFindings,
  };

  // Insight capture callbacks for SaveInsightDialog (ADR-049)
  const handleSaveAsNewFinding = useCallback(
    (text: string, sourceMessageId: string) => {
      findingsState.addFinding(
        text,
        {
          activeFilters: filters,
          cumulativeScope: null,
          stats: stats
            ? {
                mean: stats.mean,
                median: stats.median,
                cpk: stats.cpk ?? undefined,
                samples: filteredData.length,
              }
            : undefined,
        },
        { chart: 'coscout', messageId: sourceMessageId }
      );
    },
    [findingsState, filters, stats, filteredData.length]
  );

  // CoScout close intercept: check for unsaved insights before closing (ADR-049)
  const handleCoScoutClose = useCallback(() => {
    const aiState = useAIStore.getState();
    if (!aiState.shouldShowClosePrompt()) {
      usePanelsStore.getState().setCoScoutOpen(false);
      aiState.resetSessionState();
      return;
    }

    // Build items list from unsaved bookmarks and pending save proposals
    const messages = aiState.coscoutMessages;
    const items: SessionClosePromptItem[] = [];

    // Bookmarked messages (preChecked = true, user explicitly bookmarked them)
    for (const messageId of aiState.unsavedBookmarks) {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        items.push({ id: `bookmark:${messageId}`, text: msg.content, preChecked: true });
      }
    }

    // Pending save proposals from action proposals (preChecked = false, suggested by AI)
    for (const proposal of aiState.actionProposals) {
      if (proposal.tool === 'suggest_save_finding' && proposal.status === 'pending') {
        const text =
          proposal.editableText ??
          (typeof proposal.params.insight_text === 'string' ? proposal.params.insight_text : '');
        if (text) {
          items.push({ id: `proposal:${proposal.id}`, text, preChecked: false });
        }
      }
    }

    if (items.length === 0) {
      // No specific items but threshold met (turn count) — close without prompt
      usePanelsStore.getState().setCoScoutOpen(false);
      aiState.resetSessionState();
      return;
    }

    setClosePromptItems(items);
    setShowClosePrompt(true);
  }, []);

  // Save selected items as findings and close
  const handleClosePromptSave = useCallback(
    (selectedIds: string[]) => {
      for (const id of selectedIds) {
        if (id.startsWith('bookmark:')) {
          const messageId = id.slice('bookmark:'.length);
          const messages = useAIStore.getState().coscoutMessages;
          const msg = messages.find(m => m.id === messageId);
          if (msg) {
            handleSaveAsNewFinding(msg.content, messageId);
          }
        }
        // Proposals are applied via their own action handlers — skip here
        // (they were already presented as ActionProposalCards)
      }
      setShowClosePrompt(false);
      usePanelsStore.getState().setCoScoutOpen(false);
      useAIStore.getState().resetSessionState();
    },
    [handleSaveAsNewFinding]
  );

  // Dismiss without saving and close
  const handleClosePromptDismiss = useCallback(() => {
    setShowClosePrompt(false);
    usePanelsStore.getState().setCoScoutOpen(false);
    useAIStore.getState().resetSessionState();
  }, []);

  // Wrapped send that increments session turn count (ADR-049)
  const handleCoScoutSend = useCallback(
    (message: string, images?: Array<{ id: string; dataUrl: string; mimeType?: string }>) => {
      coscout.send(
        message,
        images?.map(img => ({
          id: img.id,
          dataUrl: img.dataUrl,
          mimeType: img.mimeType ?? 'image/png',
        }))
      );
      useAIStore.getState().incrementTurnCount();
    },
    [coscout]
  );

  const handleAddCommentToFinding = useCallback(
    (findingId: string, text: string, attachment?: File) => {
      if (attachment) {
        // Route through handleAddCommentWithAuthor which handles attachment upload
        void handleAddCommentWithAuthor(findingId, text, attachment);
      } else {
        findingsState.addFindingComment(findingId, text);
      }
    },
    [findingsState, handleAddCommentWithAuthor]
  );

  const handleAddCommentToHypothesis = useCallback(
    (hypothesisId: string, text: string) => {
      // Add as idea to hypothesis (hypotheses don't have a comment system)
      hypothesesState.addIdea(hypothesisId, text);
    },
    [hypothesesState]
  );

  // Insight targets for SaveInsightDialog
  const insightFindings = findingsState.findings.map(f => ({ id: f.id, text: f.text }));
  const insightHypotheses = hypothesesState.hypotheses.map(h => ({ id: h.id, text: h.text }));

  // Shared CoScoutPanel props
  const sharedCoScoutProps = {
    messages: coscout.messages,
    onSend: handleCoScoutSend,
    isLoading: coscout.isLoading,
    isStreaming: coscout.isStreaming,
    onStopStreaming: coscout.stopStreaming,
    error: coscout.error,
    onRetry: coscout.retry,
    onClear: coscout.clear,
    onCopyLastResponse: coscout.copyLastResponse,
    resizeConfig: COSCOUT_RESIZE_CONFIG,
    suggestedQuestions,
    onSuggestedQuestionClick: handleCoScoutSend,
    knowledgeAvailable: knowledgeSearch.isAvailable,
    knowledgeSearching: knowledgeSearch.isSearching,
    knowledgeDocuments: knowledgeSearch.documents,
    onSearchKnowledge: handleSearchKnowledge,
    actionProposals,
    onExecuteAction: handleExecuteAction,
    onDismissAction: handleDismissAction,
    onSaveAsNewFinding: handleSaveAsNewFinding,
    onAddCommentToFinding: handleAddCommentToFinding,
    onAddCommentToHypothesis: handleAddCommentToHypothesis,
    insightFindings,
    insightHypotheses,
  };

  const aiAvailable = aiEnabled && isAIAvailable();

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Stats Sidebar (left, resizable) */}
        {isStatsSidebarOpen && !isPhone && (
          <>
            <div
              className="flex flex-col flex-shrink-0 bg-surface-secondary overflow-y-auto"
              style={{ width: statsSidebar.width }}
            >
              <React.Suspense fallback={null}>
                <StatsPanel
                  stats={stats}
                  specs={specs}
                  filteredData={filteredData}
                  outcome={outcome}
                  cpkTarget={cpkTarget}
                  sampleCount={filteredData?.length}
                  isDrilling={isDrilling}
                  complement={complementInsight}
                  centeringOpportunity={centeringOpp}
                  factors={factors}
                  onInvestigateFactor={handleInvestigateFactor}
                  precomputedBestSubsets={bestSubsets}
                />
              </React.Suspense>
            </div>
            <div
              className={`w-1 flex-shrink-0 flex items-center justify-center cursor-col-resize transition-colors ${
                statsSidebar.isDragging ? 'bg-blue-500' : 'bg-surface-tertiary hover:bg-blue-500'
              }`}
              onMouseDown={statsSidebar.handleMouseDown}
            >
              <GripVertical size={12} className="text-content-muted" />
            </div>
          </>
        )}

        <Dashboard
          onPointClick={isPhone ? undefined : usePanelsStore.getState().handlePointClick}
          highlightedPointIndex={isPhone ? undefined : highlightedChartPoint}
          filterNav={filterNav}
          initialViewState={viewState ?? undefined}
          onViewStateChange={onViewStateChange}
          onManageFactors={dataFlow.openFactorManager}
          requestedFactor={factorRequest}
          onPinFinding={handlePinFinding}
          onShareChart={handleShareChart}
          findingsCallbacks={findingsCallbacks}
          findings={findingsState.findings}
          onInvestigateFactor={handleInvestigateFactor}
          performance={{
            drillFromPerformance: dataFlow.drillFromPerformance,
            onBackToPerformance: dataFlow.handleBackToPerformance,
            onDrillToMeasure: dataFlow.handleDrillToMeasure,
          }}
          ai={{
            fetchChartInsight: fetchChartInsightFromAI,
            aiContext: aiContext.context,
            aiEnabled: aiAvailable,
            narrative: narration.narrative,
            narrativeLoading: narration.isLoading,
            narrativeCached: narration.isCached,
            narrativeError: narration.error,
            onNarrativeRetry: narration.refresh,
            onNarrativeAsk: handleNarrativeAsk,
            onAskCoScoutFromCategory: handleAskCoScoutFromCategory,
          }}
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
                onClick={handleCoScoutClose}
                className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Close CoScout"
              >
                <X size={20} />
              </button>
            </div>
            <CoScoutPanelBase isOpen={true} onClose={handleCoScoutClose} {...sharedCoScoutProps} />
          </div>
        ) : (
          <CoScoutPanelBase
            isOpen={isCoScoutOpen}
            onClose={handleCoScoutClose}
            {...sharedCoScoutProps}
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

      {/* Session-close save prompt (ADR-049) */}
      <SessionClosePrompt
        isOpen={showClosePrompt}
        items={closePromptItems}
        onSave={handleClosePromptSave}
        onDismiss={handleClosePromptDismiss}
      />
    </>
  );
};
