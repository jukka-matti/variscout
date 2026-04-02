import React, { useCallback, useMemo, useState } from 'react';
import Dashboard from '../Dashboard';

const ProcessIntelligencePanel = React.lazy(() => import('../ProcessIntelligencePanel'));
import DataTableModal from '../data/DataTableModal';
import {
  CoScoutPanelBase,
  AIOnboardingTooltip,
  SessionClosePrompt,
  QuestionsTabView,
  JournalTabView,
} from '@variscout/ui';
import type { SessionClosePromptItem } from '@variscout/ui';
import { useIsMobile, BREAKPOINTS } from '@variscout/ui';
import { toNumericValue, createFactorFinding } from '@variscout/core';
import { computeCenteringOpportunity } from '@variscout/core/variation';
import type { ExclusionReason, FindingStatus } from '@variscout/core';
import type { UseQuestionsReturn, ViewState, UseFindingsReturn } from '@variscout/hooks';
import {
  useQuestionGeneration,
  useQuestionReactivity,
  useJournalEntries,
  useJourneyPhase,
  useVisualGrounding,
} from '@variscout/hooks';
import { resolveMode, getStrategy } from '@variscout/core/strategy';
import { isAIAvailable } from '../../services/aiService';
import { useData } from '../../context/DataContext';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import { useAIStore } from '../../features/ai/aiStore';
import { useImprovementStore } from '../../features/improvement/improvementStore';
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
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  // Questions
  questionsState: UseQuestionsReturn;
  // Photo comments
  handleAddCommentWithAuthor: (
    findingId: string,
    text: string,
    attachment?: File
  ) => void | Promise<void>;
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
}

export const EditorDashboardView: React.FC<EditorDashboardViewProps> = ({
  dataFlow,
  filterNav,
  viewState,
  onViewStateChange,
  findingsState,
  findingsCallbacks,
  handlePinFinding,
  handleSetFindingStatus,
  questionsState,
  handleAddCommentWithAuthor,
  aiOrch,
  actionProposalsState,
  handleSearchKnowledge,
  handleShareChart,
  controlViolations,
  excludedRowIndices,
  excludedReasons,
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
    questionsState,
    mode: resolved,
  });

  const strategy = getStrategy(resolved);
  const projectedCpkMap = useImprovementStore(s => s.projectedCpkMap);
  const journeyPhase = useJourneyPhase(!!rawData?.length, findingsState.findings);

  const suspectedCauses = useMemo(() => {
    return questionsState.questions
      .filter(h => h.causeRole === 'suspected-cause' && h.factor)
      .map(h => ({
        factor: h.factor!,
        projectedCpk: projectedCpkMap[h.factor!],
      }));
  }, [questionsState.questions, projectedCpkMap]);

  const combinedProjectedCpk = useMemo(() => {
    const values = Object.values(projectedCpkMap);
    return values.length > 0 ? Math.max(...values) : undefined;
  }, [projectedCpkMap]);

  // ── PI Panel: Questions + Journal wiring ─────────────────────────────
  const activeFactor = useMemo(() => {
    const filterKeys = Object.keys(filters);
    return filterKeys.length > 0 ? filterKeys[filterKeys.length - 1] : null;
  }, [filters]);

  const { activeQuestionId } = useQuestionReactivity({
    questions: factorIntelQuestions,
    activeFactor,
  });

  const journalEntries = useJournalEntries({
    findings: findingsState.findings,
    questions: factorIntelQuestions,
    problemStatement: processContext?.problemStatement,
  });

  const openQuestionCount = useMemo(
    () =>
      factorIntelQuestions.filter(q => q.status === 'open' || q.status === 'investigating').length,
    [factorIntelQuestions]
  );

  const handleAddQuestion = (text: string): void => {
    questionsState.addQuestion(text);
  };

  const handleAddObservation = (text: string): void => {
    const newFinding = findingsState.addFinding(text, {
      activeFilters: filters,
      cumulativeScope: null,
      stats: stats
        ? {
            mean: stats.mean,
            median: stats.median,
            cpk: stats.cpk,
            samples: filteredData?.length ?? 0,
          }
        : undefined,
    });
    if (questionsState.focusedQuestionId) {
      questionsState.linkFinding(questionsState.focusedQuestionId, newFinding.id);
    }
  };

  const handleLinkObservation = (findingId: string, questionId: string): void => {
    questionsState.linkFinding(questionId, findingId);
  };

  const piOverflowView = usePanelsStore(s => s.piOverflowView);
  const setPIOverflowView = usePanelsStore(s => s.setPIOverflowView);

  // Session-close prompt state (ADR-049)
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [closePromptItems, setClosePromptItems] = useState<SessionClosePromptItem[]>([]);

  // Panel state from Zustand
  const isCoScoutOpen = usePanelsStore(s => s.isCoScoutOpen);
  const isDataTableOpen = usePanelsStore(s => s.isDataTableOpen);
  const isPISidebarOpen = usePanelsStore(s => s.isPISidebarOpen);
  const piSidebar = useResizablePanel('variscout-stats-sidebar-width', 280, 500, 320, 'left');
  const highlightedChartPoint = usePanelsStore(s => s.highlightedChartPoint);

  // Visual grounding for CoScout REF markers (ADR-050)
  const { highlight: visualGroundingHighlight } = useVisualGrounding({
    onFocusChart: chartType => {
      usePanelsStore.getState().setPendingChartFocus(chartType);
    },
    onExpandPanel: (panelId, targetId) => {
      if (panelId === 'question' || panelId === 'finding') {
        // Navigate to Questions tab in PI panel
        usePanelsStore.getState().setPIActiveTab('questions');
        if (!usePanelsStore.getState().isPISidebarOpen) {
          usePanelsStore.getState().togglePISidebar();
        }
        if (panelId === 'question' && targetId) {
          questionsState.setFocusedQuestion(targetId);
        }
      } else if (panelId === 'stats') {
        usePanelsStore.getState().setPIActiveTab('stats');
        if (!usePanelsStore.getState().isPISidebarOpen) {
          usePanelsStore.getState().togglePISidebar();
        }
      } else if (panelId === 'improvement') {
        usePanelsStore.getState().showImprovement();
      }
    },
  });

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
  } = aiOrch;

  const { actionProposals, handleExecuteAction, handleDismissAction } = actionProposalsState;

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

      // Add question and apply pre-validated status from Factor Intelligence
      const addedQuestion = questionsState.addQuestion(
        bundle.question.text,
        bundle.question.factor,
        bundle.question.level
      );
      questionsState.setManualStatus(addedQuestion.id, 'answered');

      // Link finding ↔ question
      findingsState.linkQuestion(addedFinding.id, addedQuestion.id, 'supports');

      // Add improvement idea to the question
      questionsState.addIdea(addedQuestion.id, bundle.idea.text);

      // Set finding status to 'investigating' and open Findings panel
      handleSetFindingStatus(addedFinding.id, 'investigating');
      usePanelsStore.getState().setFindingsOpen(true);
      useFindingsStore.getState().setHighlightedFindingId(addedFinding.id);
    },
    [outcome, filteredData, findingsState, questionsState, handleSetFindingStatus]
  );

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

  const handleAddCommentToQuestion = useCallback(
    (questionId: string, text: string) => {
      // Add as idea to question (questions don't have a comment system)
      questionsState.addIdea(questionId, text);
    },
    [questionsState]
  );

  // Insight targets for SaveInsightDialog
  const insightFindings = findingsState.findings.map(f => ({ id: f.id, text: f.text }));
  const insightQuestions = questionsState.questions.map(h => ({ id: h.id, text: h.text }));

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
    onAddCommentToHypothesis: handleAddCommentToQuestion,
    insightFindings,
    insightQuestions,
    onRefActivate: visualGroundingHighlight,
  };

  const aiAvailable = aiEnabled && isAIAvailable();

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Stats Sidebar (left, resizable) */}
        {isPISidebarOpen && !isPhone && (
          <>
            <div
              className="flex flex-col flex-shrink-0 bg-surface-secondary overflow-y-auto"
              style={{ width: piSidebar.width }}
            >
              <React.Suspense fallback={null}>
                <ProcessIntelligencePanel
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
                  renderQuestionsTab={() => (
                    <QuestionsTabView
                      questions={factorIntelQuestions}
                      findings={findingsState.findings}
                      issueStatement={processContext?.issueStatement}
                      currentCpk={stats?.cpk ?? undefined}
                      targetCpk={cpkTarget}
                      activeQuestionId={activeQuestionId}
                      onQuestionClick={handleQuestionClick}
                      onAddNote={(findingId, text) =>
                        findingsState.addFindingComment(findingId, text)
                      }
                      suspectedCauses={suspectedCauses}
                      combinedProjectedCpk={combinedProjectedCpk}
                      projectedCpkMap={projectedCpkMap}
                      onAddQuestion={handleAddQuestion}
                      onAddObservation={handleAddObservation}
                      onLinkObservation={handleLinkObservation}
                      evidenceLabel={strategy.questionStrategy.evidenceLabel}
                      phaseBadge={journeyPhase ?? undefined}
                    />
                  )}
                  renderJournalTab={() => <JournalTabView entries={journalEntries} />}
                  openQuestionCount={openQuestionCount}
                  overflowView={piOverflowView}
                  onOverflowViewChange={setPIOverflowView}
                />
              </React.Suspense>
            </div>
            <div
              className={`w-1 flex-shrink-0 flex items-center justify-center cursor-col-resize transition-colors ${
                piSidebar.isDragging ? 'bg-blue-500' : 'bg-surface-tertiary hover:bg-blue-500'
              }`}
              onMouseDown={piSidebar.handleMouseDown}
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
