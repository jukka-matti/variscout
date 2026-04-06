/**
 * EditorDashboardView — Layout composer for the Azure editor analysis view.
 *
 * Delegates rendering to three section components:
 * - PISection (left sidebar: stats, questions, journal, docs)
 * - DashboardSection (center: chart grid with narration)
 * - CoScoutSection (right sidebar: AI assistant panel)
 *
 * Owns only cross-section concerns:
 * - useQuestionGeneration (bestSubsets + factorRequest shared by PI + Dashboard)
 * - handleInvestigateFactor callback (creates Finding + Question + Idea bundle)
 * - FactorPreviewOverlay (one-time overlay on Factor Intelligence completion)
 * - DataTableModal (triggered from PI overflow)
 * - AIOnboardingTooltip
 */

import React, { useCallback, useMemo } from 'react';
import { EvidenceMapBase } from '@variscout/charts';
import { AIOnboardingTooltip, FactorPreviewOverlay } from '@variscout/ui';
import {
  createFactorFinding,
  computeMainEffects,
  computeInteractionEffects,
} from '@variscout/core';
import { resolveMode } from '@variscout/core/strategy';
import type { ExclusionReason, FindingStatus } from '@variscout/core';
import type { UseQuestionsReturn, ViewState, UseFindingsReturn } from '@variscout/hooks';
import {
  useQuestionGeneration,
  useJourneyPhase,
  useEvidenceMapData,
  useFilteredData,
} from '@variscout/hooks';
import { isAIAvailable } from '../../services/aiService';
import { useProjectStore, useSessionStore } from '@variscout/stores';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import type { UseEditorDataFlowReturn } from '../../hooks/useEditorDataFlow';
import type { UseFilterNavigationReturn } from '../../hooks';
import type { AzureFindingsCallbacks } from '@variscout/ui';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import type { UseAIOrchestrationReturn } from '../../features/ai';
import type { UseActionProposalsReturn } from '../../features/ai';

import DataTableModal from '../data/DataTableModal';
import { PISection } from './PISection';
import { DashboardSection } from './DashboardSection';
import { CoScoutSection } from './CoScoutSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditorDashboardViewProps {
  dataFlow: UseEditorDataFlowReturn;
  filterNav: UseFilterNavigationReturn;
  viewState: ViewState | undefined;
  onViewStateChange: (partial: Partial<ViewState>) => void;
  /** Project ID for Document Shelf scoping */
  projectId?: string;
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
  // Improvement projection
  projectedCpkMap: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EditorDashboardView: React.FC<EditorDashboardViewProps> = ({
  dataFlow,
  filterNav,
  viewState,
  onViewStateChange,
  projectId,
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
  projectedCpkMap,
}) => {
  // ── Store selectors ──────────────────────────────────────────────────────
  const factors = useProjectStore(s => s.factors);
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const aiEnabled = useSessionStore(s => s.aiEnabled);
  const { filteredData } = useFilteredData();

  // ── Question generation (shared across PISection + DashboardSection) ────
  const resolved = resolveMode(analysisMode ?? 'standard');
  const { bestSubsets, handleQuestionClick, factorRequest } = useQuestionGeneration({
    filteredData: filteredData ?? [],
    outcome,
    factors,
    questionsState,
    mode: resolved,
  });

  // ── Journey phase badge ─────────────────────────────────────────────────
  const journeyPhase = useJourneyPhase(!!rawData?.length, findingsState.findings);

  // ── AI availability ─────────────────────────────────────────────────────
  const aiAvailable = aiEnabled && isAIAvailable();

  // ── Factor Intelligence → Findings bridge ──────────────────────────────
  const handleInvestigateFactor = useCallback(
    (effect: import('@variscout/core/stats').FactorMainEffect) => {
      if (!outcome || !filteredData || filteredData.length === 0) return;

      const bundle = createFactorFinding({
        factor: effect.factor,
        bestLevel: effect.bestLevel,
        worstLevel: effect.worstLevel,
        etaSquared: effect.etaSquared,
        effectRange: effect.effectRange,
        pValue: effect.pValue,
      });

      const addedFinding = findingsState.addFinding(
        bundle.finding.text,
        bundle.finding.context,
        undefined
      );

      const addedQuestion = questionsState.addQuestion(
        bundle.question.text,
        bundle.question.factor,
        bundle.question.level
      );
      questionsState.setManualStatus(addedQuestion.id, 'answered');
      findingsState.linkQuestion(addedFinding.id, addedQuestion.id, 'supports');
      questionsState.addIdea(addedQuestion.id, bundle.idea.text);

      handleSetFindingStatus(addedFinding.id, 'investigating');
      usePanelsStore.getState().setFindingsOpen(true);
      useFindingsStore.getState().setHighlightedFindingId(addedFinding.id);
    },
    [outcome, filteredData, findingsState, questionsState, handleSetFindingStatus]
  );

  // ── Factor Preview overlay ──────────────────────────────────────────────
  const activeView = usePanelsStore(s => s.activeView);
  const factorPreviewDismissed = usePanelsStore(s => s.factorPreviewDismissed);
  const dismissFactorPreview = usePanelsStore(s => s.dismissFactorPreview);
  const isDataTableOpen = usePanelsStore(s => s.isDataTableOpen);

  const FACTOR_PREVIEW_MAP_SIZE = useMemo(() => ({ width: 620, height: 360 }), []);
  const hasFactorIntelligenceForPreview = bestSubsets !== null && factors.length >= 2;

  const mainEffectsForPreview = useMemo(() => {
    if (!hasFactorIntelligenceForPreview || !outcome || !filteredData.length) return null;
    return computeMainEffects(filteredData, outcome, factors);
  }, [hasFactorIntelligenceForPreview, filteredData, outcome, factors]);

  const interactionsForPreview = useMemo(() => {
    if (!hasFactorIntelligenceForPreview || !outcome || !filteredData.length) return null;
    return computeInteractionEffects(filteredData, outcome, factors);
  }, [hasFactorIntelligenceForPreview, filteredData, outcome, factors]);

  const evidenceMapDataForPreview = useEvidenceMapData({
    bestSubsets: hasFactorIntelligenceForPreview ? bestSubsets : null,
    mainEffects: mainEffectsForPreview,
    interactions: interactionsForPreview,
    containerSize: FACTOR_PREVIEW_MAP_SIZE,
    mode: resolved,
  });

  const showFactorPreview =
    !factorPreviewDismissed &&
    activeView === 'analysis' &&
    hasFactorIntelligenceForPreview &&
    !evidenceMapDataForPreview.isEmpty;

  const topFactor = bestSubsets?.subsets[0]?.factors[0] ?? null;
  const topFactorR2 = useMemo(() => {
    if (!topFactor || !bestSubsets) return 0;
    const singleFactorSubset = bestSubsets.subsets.find(
      s => s.factors.length === 1 && s.factors[0] === topFactor
    );
    return singleFactorSubset?.rSquaredAdj ?? bestSubsets.subsets[0]?.rSquaredAdj ?? 0;
  }, [topFactor, bestSubsets]);

  const handleFactorPreviewStart = useCallback(
    (factor: string) => {
      usePanelsStore.getState().setHighlightedFactor(factor);
      dismissFactorPreview();
    },
    [dismissFactorPreview]
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* PI sidebar (left) — handles its own visibility + resize */}
        <PISection
          bestSubsets={bestSubsets}
          projectedCpkMap={projectedCpkMap}
          handleQuestionClick={handleQuestionClick}
          onInvestigateFactor={handleInvestigateFactor}
          phaseBadge={journeyPhase ?? undefined}
          questionsState={questionsState}
          findingsState={findingsState}
          projectId={projectId}
        />

        {/* Chart grid (center) */}
        <DashboardSection
          dataFlow={dataFlow}
          filterNav={filterNav}
          questionsState={questionsState}
          findingsState={findingsState}
          aiOrch={aiOrch}
          factorRequest={factorRequest}
          viewState={viewState ?? undefined}
          onViewStateChange={onViewStateChange}
          findingsCallbacks={findingsCallbacks}
          onPinFinding={handlePinFinding}
          onShareChart={handleShareChart}
          onInvestigateFactor={handleInvestigateFactor}
          projectedCpkMap={projectedCpkMap}
          aiAvailable={aiAvailable}
        />

        {/* AI onboarding tooltip */}
        <AIOnboardingTooltip
          isAIAvailable={aiAvailable}
          anchorSelector='[data-testid="narrative-ask-button"]'
        />

        {/* CoScout panel (right) — handles its own visibility + close prompt */}
        <CoScoutSection
          aiOrch={aiOrch}
          findingsState={findingsState}
          questionsState={questionsState}
          actionProposalsState={actionProposalsState}
          handleSearchKnowledge={handleSearchKnowledge}
          handleAddCommentWithAuthor={handleAddCommentWithAuthor}
        />
      </div>

      {/* Data Table Editor Modal */}
      <DataTableModal
        isOpen={isDataTableOpen}
        onClose={() => usePanelsStore.getState().closeDataTable()}
        excludedRowIndices={excludedRowIndices}
        excludedReasons={excludedReasons}
        controlViolations={controlViolations}
      />

      {/* Factor Preview overlay — shown once when Factor Intelligence first completes */}
      {showFactorPreview && topFactor && (
        <FactorPreviewOverlay
          evidenceMap={
            <EvidenceMapBase
              parentWidth={FACTOR_PREVIEW_MAP_SIZE.width}
              parentHeight={FACTOR_PREVIEW_MAP_SIZE.height}
              outcomeNode={evidenceMapDataForPreview.outcomeNode}
              factorNodes={evidenceMapDataForPreview.factorNodes}
              relationshipEdges={evidenceMapDataForPreview.relationshipEdges}
              equation={evidenceMapDataForPreview.equation}
              causalEdges={[]}
              convergencePoints={[]}
              enableZoom={false}
              compact={false}
            />
          }
          topFactor={topFactor}
          topFactorR2={topFactorR2}
          modelR2={bestSubsets!.subsets[0]?.rSquaredAdj ?? 0}
          factorCount={factors.length}
          onStartWithFactor={handleFactorPreviewStart}
          onDismiss={dismissFactorPreview}
        />
      )}
    </>
  );
};
