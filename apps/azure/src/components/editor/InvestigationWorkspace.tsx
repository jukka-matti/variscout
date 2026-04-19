import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  QuestionChecklist,
  InvestigationPhaseBadge,
  InvestigationConclusion,
  FindingsLog,
  QuestionLinkPrompt,
} from '@variscout/ui';
import {
  useResizablePanel,
  useQuestionGeneration,
  useProblemStatement,
  useHubComputations,
  useDefectTransform,
  useDefectEvidenceMap,
  type DefectMapView,
  type UseFindingsReturn,
  type UseQuestionsReturn,
} from '@variscout/hooks';
import type { DefectQuestionInput } from '@variscout/core/defect';
import type { FindingStatus, Question } from '@variscout/core';
import {
  hasTeamFeatures,
  inferCharacteristicType,
  computeMainEffects,
  computeInteractionEffects,
} from '@variscout/core';
import { detectEvidenceClusters } from '@variscout/core/findings';
import { detectInvestigationPhase } from '@variscout/core/ai';
import { resolveMode, getStrategy } from '@variscout/core/strategy';
import { wouldCreateCycle } from '@variscout/core/stats';
import { GripVertical } from 'lucide-react';
import {
  useProjectStore,
  useInvestigationStore,
  useSessionStore,
  useWallLayoutStore,
} from '@variscout/stores';
import { WallCanvas } from '@variscout/charts';
import { InvestigationMapView } from './InvestigationMapView';
import { CoScoutSection } from './CoScoutSection';
import { useFilteredData, useAnalysisStats } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import {
  useInvestigationFeatureStore,
  type QuestionDisplayData,
} from '../../features/investigation/investigationStore';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import { useAIStore } from '../../features/ai/aiStore';
import type { UseAIOrchestrationReturn, UseActionProposalsReturn } from '../../features/ai';
import type { UseInvestigationOrchestrationReturn } from '../../features/investigation/useInvestigationOrchestration';
import { useWallHubCommentLifecycle } from '../../features/investigation/useWallHubCommentLifecycle';

// Resize panel config (individual args for useResizablePanel)

interface InvestigationWorkspaceProps {
  // Findings
  findingsState: UseFindingsReturn;
  handleRestoreFinding: UseFindingsOrchestrationReturn['handleRestoreFinding'];
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  handleNavigateToChart: UseFindingsOrchestrationReturn['handleNavigateToChart'];
  handleShareFinding: UseFindingsOrchestrationReturn['handleShareFinding'];
  drillPath: UseFindingsOrchestrationReturn['drillPath'];
  // Questions
  questionsState: UseQuestionsReturn;
  handleCreateQuestion: (findingId: string, text: string, factor?: string, level?: string) => void;
  handleProjectIdea: (questionId: string, ideaId: string) => void;
  // Comments
  handleAddCommentWithAuthor: (
    findingId: string,
    text: string,
    attachment?: File
  ) => void | Promise<void>;
  handleAddPhoto: ((findingId: string, commentId: string, file: File) => Promise<void>) | undefined;
  handleCaptureFromTeams: ((findingId: string, commentId: string) => Promise<void>) | undefined;
  isTeamsCamera: boolean;
  // AI
  aiOrch: UseAIOrchestrationReturn;
  actionProposalsState: UseActionProposalsReturn;
  handleSearchKnowledge: () => void;
  // Column aliases
  columnAliases: Record<string, string>;
  // Hub model (SuspectedCause CRUD from useInvestigationOrchestration)
  suspectedCausesState: UseInvestigationOrchestrationReturn['suspectedCausesState'];
  // Derived investigation data (from orchestration hook)
  questionsMap: Record<string, QuestionDisplayData>;
  ideaImpacts: Record<string, import('@variscout/core').IdeaImpact | undefined>;
  // View state
  viewMode?: 'list' | 'board' | 'tree';
  onViewModeChange?: (mode: 'list' | 'board' | 'tree') => void;
}

/**
 * Investigation workspace (ADR-055): Three-column layout for question-driven EDA.
 *
 * Left: QuestionChecklist + PhaseBadge + InvestigationConclusion
 * Center: FindingsLog (list / board / tree)
 * Right: CoScout (optional)
 */
export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  findingsState,
  handleRestoreFinding,
  handleSetFindingStatus,
  handleNavigateToChart,
  handleShareFinding,
  drillPath,
  questionsState,
  handleCreateQuestion,
  handleProjectIdea,
  handleAddCommentWithAuthor,
  handleAddPhoto,
  handleCaptureFromTeams,
  isTeamsCamera,
  aiOrch,
  actionProposalsState,
  handleSearchKnowledge,
  columnAliases,
  suspectedCausesState,
  questionsMap,
  ideaImpacts,
  viewMode: externalViewMode,
  onViewModeChange,
}) => {
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const specs = useProjectStore(s => s.specs);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const processMap = useProjectStore(s => s.processContext?.processMap);
  const { filteredData } = useFilteredData();
  const { stats } = useAnalysisStats();

  const investigationViewMode = usePanelsStore(s => s.investigationViewMode);
  const highlightedFactor = usePanelsStore(s => s.highlightedFactor);
  const setInvestigationViewMode = usePanelsStore(s => s.setInvestigationViewMode);

  // Map/Wall sub-toggle (within the Evidence Map view)
  const wallViewMode = useWallLayoutStore(s => s.viewMode);
  const setWallViewMode = useWallLayoutStore(s => s.setViewMode);
  // Columns present in the active dataset — powers WallCanvas missing-column
  // badge for hubs whose condition references a renamed or dropped column.
  // Undefined when no rows are loaded so the badge stays suppressed (rather
  // than flagging every column as missing against an empty column set).
  const rawData = useProjectStore(s => s.rawData);
  const wallActiveColumns = useMemo<string[] | undefined>(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : undefined),
    [rawData]
  );
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const causalLinks = useInvestigationStore(s => s.causalLinks);

  // Wall hub-comment SSE subscription — no-op when viewMode !== 'wall' or
  // when there's no selection. Streams lifetime-bound to this component
  // (unmounts when the user leaves the Investigation workspace).
  useWallHubCommentLifecycle();

  // Question-link prompt for map context menu findings
  const skipQuestionLinkPrompt = useSessionStore(s => s.skipQuestionLinkPrompt);
  const setSkipQuestionLinkPrompt = useSessionStore(s => s.setSkipQuestionLinkPrompt);
  const linkFindingToQuestion = useInvestigationStore(s => s.linkFindingToQuestion);
  const mapQuestions = useInvestigationStore(s => s.questions);
  const [mapPromptOpen, setMapPromptOpen] = useState(false);
  const [mapPromptFindingId, setMapPromptFindingId] = useState<string>('');

  // Investigation phase (deterministic, from question/findings state)
  const investigationPhase = useMemo(
    () => detectInvestigationPhase(questionsState.questions, findingsState.findings),
    [questionsState.questions, findingsState.findings]
  );

  // Defect mode transform for question generation
  const defectResult = useDefectTransform(filteredData, defectMapping, analysisMode ?? 'standard');

  // Question generation (ADR-053) — computed from data context
  const resolved = resolveMode(analysisMode ?? 'standard');
  const strategy = getStrategy(resolved);

  // Build defect data input for question generator when in defect mode
  const defectData: DefectQuestionInput | undefined =
    resolved === 'defect' && defectResult
      ? {
          transformedData: defectResult.data,
          outcomeColumn: defectResult.outcomeColumn,
          defectTypeColumn: defectMapping?.defectTypeColumn,
          factors: defectResult.factors,
        }
      : undefined;

  const {
    questions: factorIntelQuestions,
    handleQuestionClick,
    bestSubsets,
  } = useQuestionGeneration({
    filteredData: filteredData ?? [],
    outcome,
    factors,
    questionsState,
    mode: resolved,
    defectData,
  });

  // Sync factor type metadata to aiStore for CoScout context enrichment
  useEffect(() => {
    const factorTypes = bestSubsets?.factorTypes;
    if (!factorTypes || factorTypes.size === 0) {
      useAIStore.getState().syncFactorMetadata(null);
      return;
    }

    const bestModelPredictors = bestSubsets.subsets[0]?.predictors;
    const metadata = new Map<
      string,
      {
        factorType: 'categorical' | 'continuous';
        relationship?: 'linear' | 'quadratic';
        optimum?: number;
      }
    >();

    for (const [factor, type] of factorTypes) {
      const entry: {
        factorType: 'categorical' | 'continuous';
        relationship?: 'linear' | 'quadratic';
        optimum?: number;
      } = {
        factorType: type,
      };

      if (type === 'continuous' && bestModelPredictors) {
        const linear = bestModelPredictors.find(
          p => p.factorName === factor && p.type === 'continuous'
        );
        const quad = bestModelPredictors.find(
          p => p.factorName === factor && p.type === 'quadratic'
        );

        if (linear && quad && quad.coefficient !== 0) {
          entry.relationship = 'quadratic';
          entry.optimum = (quad.mean ?? 0) - linear.coefficient / (2 * quad.coefficient);
        } else if (linear) {
          entry.relationship = 'linear';
        }
      }

      metadata.set(factor, entry);
    }

    useAIStore.getState().syncFactorMetadata(metadata);
  }, [bestSubsets]);

  // Main effects and interactions for Evidence Map (Layer 1 statistical enrichment)
  const mainEffects = useMemo(() => {
    if (!bestSubsets || !filteredData?.length || !outcome) return null;
    return computeMainEffects(filteredData, outcome, factors);
  }, [bestSubsets, filteredData, outcome, factors]);

  const interactions = useMemo(() => {
    if (!bestSubsets || !filteredData?.length || !outcome || factors.length < 2) return null;
    return computeInteractionEffects(filteredData, outcome, factors);
  }, [bestSubsets, filteredData, outcome, factors]);

  // ── Defect Evidence Map integration ──────────────────────────────────────
  const [defectMapView, setDefectMapView] = useState<DefectMapView>('all');
  const isDefectMode = resolved === 'defect';

  const defectEvidenceMap = useDefectEvidenceMap(
    isDefectMode ? defectResult : null,
    isDefectMode ? defectMapping : null,
    isDefectMode ? bestSubsets : null,
    isDefectMode ? defectMapView : 'all',
    factors
  );

  // Override bestSubsets for Evidence Map when viewing per-type defect analysis
  const mapBestSubsets =
    isDefectMode && defectMapView !== 'all' ? defectEvidenceMap.bestSubsets : bestSubsets;

  // Characteristic type derived from spec configuration (for Watson Q2)
  const characteristicType = useMemo(() => inferCharacteristicType(specs), [specs]);

  // Location factor: first significant single-factor question from Factor Intelligence (for Watson Q3)
  // Picks the first factor-intel question that has a factor and is not ruled out — ordered by
  // evidence (rSquaredAdj) descending. This is available as soon as bestSubsets runs.
  const locationFactor = useMemo(() => {
    const topQuestion = factorIntelQuestions
      .filter(q => q.factor && q.causeRole !== 'ruled-out' && q.questionSource === 'factor-intel')
      .sort(
        (a, b) =>
          (b.evidence?.rSquaredAdj ?? b.evidence?.etaSquared ?? 0) -
          (a.evidence?.rSquaredAdj ?? a.evidence?.etaSquared ?? 0)
      )[0];
    if (!topQuestion?.factor) return undefined;
    return {
      factor: topQuestion.factor,
      level: topQuestion.level,
      evidence: topQuestion.evidence?.rSquaredAdj ?? topQuestion.evidence?.etaSquared,
    };
  }, [factorIntelQuestions]);

  // ── Hub model computations (SuspectedCause hubs) ───────────────────────
  const hubs = suspectedCausesState.hubs;

  const { hubEvidences, hubProjections } = useHubComputations(
    bestSubsets,
    questionsState.questions
  );

  // Detect evidence clusters for synthesis prompts
  const evidenceClusters = useMemo(
    () => detectEvidenceClusters(questionsState.questions, findingsState.findings, hubs),
    [questionsState.questions, findingsState.findings, hubs]
  );

  // Left panel resizable
  const leftPanel = useResizablePanel('variscout-investigation-left-width', 260, 420, 320, 'left');

  // Internal view mode (if not controlled)
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'board' | 'tree'>('board');
  const viewMode = externalViewMode ?? internalViewMode;
  const handleViewMode = onViewModeChange ?? setInternalViewMode;

  // Categorize questions for InvestigationConclusion
  const { suspectedCauses, contributing, ruledOut } = useMemo(() => {
    const suspected: Question[] = [];
    const contrib: Question[] = [];
    const ruled: Question[] = [];
    for (const h of questionsState.questions) {
      if (h.causeRole === 'suspected-cause') suspected.push(h);
      else if (h.causeRole === 'contributing') contrib.push(h);
      else if (h.causeRole === 'ruled-out') ruled.push(h);
    }
    return { suspectedCauses: suspected, contributing: contrib, ruledOut: ruled };
  }, [questionsState.questions]);

  const drillFactors = useMemo(() => drillPath.map(d => d.factor), [drillPath]);

  // Problem statement auto-synthesis (Watson's 3 questions)
  const handleProblemStatementChange = useCallback(
    (text: string) => {
      setProcessContext({ ...processContext, problemStatement: text });
    },
    [processContext, setProcessContext]
  );

  const problemStatement = useProblemStatement({
    outcome,
    targetCpk: cpkTarget,
    currentCpk: stats?.cpk ?? undefined,
    characteristicType,
    locationFactor,
    questions: questionsState.questions,
    existingStatement: processContext?.problemStatement,
    onStatementChange: handleProblemStatementChange,
  });

  // Issue statement handlers
  const handleIssueStatementChange = (text: string) => {
    setProcessContext({ ...processContext, issueStatement: text });
  };

  // Question click: switch to Analysis workspace with factor focused (round-trip pattern)
  const handleQuestionClickWithSwitch = (question: Question) => {
    handleQuestionClick(question);
    usePanelsStore.getState().showAnalysis();
  };

  // ── Hub CRUD callbacks ──────────────────────────────────────────────────
  const handleCreateHub = useCallback(
    (name: string, synthesis: string, questionIds: string[], findingIds: string[]) => {
      const hub = suspectedCausesState.createHub(name, synthesis);
      for (const qId of questionIds) suspectedCausesState.connectQuestion(hub.id, qId);
      for (const fId of findingIds) suspectedCausesState.connectFinding(hub.id, fId);
    },
    [suspectedCausesState]
  );

  const handleUpdateHub = useCallback(
    (
      hubId: string,
      name: string,
      synthesis: string,
      questionIds: string[],
      findingIds: string[]
    ) => {
      suspectedCausesState.updateHub(hubId, { name, synthesis });
      // Sync connections: disconnect removed, connect added
      const existing = hubs.find(h => h.id === hubId);
      if (existing) {
        for (const qId of existing.questionIds) {
          if (!questionIds.includes(qId)) suspectedCausesState.disconnectQuestion(hubId, qId);
        }
        for (const qId of questionIds) {
          if (!existing.questionIds.includes(qId)) suspectedCausesState.connectQuestion(hubId, qId);
        }
        for (const fId of existing.findingIds) {
          if (!findingIds.includes(fId)) suspectedCausesState.disconnectFinding(hubId, fId);
        }
        for (const fId of findingIds) {
          if (!existing.findingIds.includes(fId)) suspectedCausesState.connectFinding(hubId, fId);
        }
      }
    },
    [suspectedCausesState, hubs]
  );

  const handleDeleteHub = useCallback(
    (hubId: string) => suspectedCausesState.deleteHub(hubId),
    [suspectedCausesState]
  );

  const handleToggleHubSelect = useCallback(
    (hubId: string) => {
      const hub = hubs.find(h => h.id === hubId);
      if (hub) {
        suspectedCausesState.updateHub(hubId, {});
        // Toggle selectedForImprovement via setHubStatus or direct update
        // The useSuspectedCauses hook manages the selectedForImprovement toggle
        // through the hub's status — but for selection we toggle the flag directly.
        // Since updateHub only accepts name/synthesis, use the store sync approach:
        const updated = hubs.map(h =>
          h.id === hubId ? { ...h, selectedForImprovement: !h.selectedForImprovement } : h
        );
        suspectedCausesState.resetHubs(updated);
      }
    },
    [suspectedCausesState, hubs]
  );

  const handleBrainstormHub = useCallback((_hubId: string) => {
    // Navigate to improvement workspace
    usePanelsStore.getState().showImprovement();
  }, []);

  // ── Evidence Map context menu callbacks ──────────────────────────────────
  const handleMapAskQuestion = useCallback(
    (factor: string) => {
      questionsState.addQuestion(`What is the effect of ${factor}?`, factor);
    },
    [questionsState]
  );

  const handleMapCreateFinding = useCallback(
    (factor: string) => {
      if (mapPromptOpen) return; // prevent re-trigger while prompt is open
      const filters = useProjectStore.getState().filters;
      const newFinding = findingsState.addFinding(
        `Observation about ${factor}`,
        { activeFilters: filters, cumulativeScope: null },
        { chart: 'boxplot', category: factor }
      );
      if (!skipQuestionLinkPrompt) {
        setMapPromptFindingId(newFinding.id);
        setMapPromptOpen(true);
      }
    },
    [findingsState, skipQuestionLinkPrompt, mapPromptOpen]
  );

  // Map finding question-link prompt handlers
  const handleMapPromptLink = useCallback(
    (questionId: string) => {
      linkFindingToQuestion(mapPromptFindingId, questionId);
    },
    [mapPromptFindingId, linkFindingToQuestion]
  );

  const handleMapPromptSkipForever = useCallback(() => {
    setSkipQuestionLinkPrompt(true);
  }, [setSkipQuestionLinkPrompt]);

  const handleMapPromptClose = useCallback(() => {
    setMapPromptOpen(false);
  }, []);

  const handleMapAskCoScout = useCallback(
    (factor: string) => {
      aiOrch.handleAskCoScoutFromCategory({ category: { name: factor } });
    },
    [aiOrch]
  );

  const handleMapDrillDown = useCallback((factor: string) => {
    usePanelsStore.getState().setHighlightedFactor(factor);
    usePanelsStore.getState().showAnalysis();
  }, []);

  const handleConfirmCausalLink = useCallback(
    (
      from: string,
      to: string,
      params: {
        whyStatement: string;
        direction: 'drives' | 'modulates' | 'confounds';
        evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
      }
    ) => {
      useInvestigationStore.getState().addCausalLink(from, to, params.whyStatement, {
        direction: params.direction,
        evidenceType: params.evidenceType,
      });
    },
    []
  );

  const handleRemoveCausalLink = useCallback((id: string) => {
    useInvestigationStore.getState().removeCausalLink(id);
  }, []);

  const handleUpdateCausalLink = useCallback(
    (
      id: string,
      params: {
        whyStatement: string;
        direction: 'drives' | 'modulates' | 'confounds';
        evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
      }
    ) => {
      useInvestigationStore.getState().updateCausalLink(id, {
        whyStatement: params.whyStatement,
        direction: params.direction,
        evidenceType: params.evidenceType,
      });
    },
    []
  );

  const checkWouldCreateCycle = useCallback(
    (from: string, to: string) => wouldCreateCycle(causalLinks, from, to),
    [causalLinks]
  );

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Left panel: Question checklist + phase + conclusions */}
      <div
        className="relative flex flex-col border-r border-edge overflow-hidden bg-surface flex-shrink-0"
        style={{ width: leftPanel.width }}
      >
        {/* Phase badge */}
        {investigationPhase && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <InvestigationPhaseBadge phase={investigationPhase} />
          </div>
        )}

        {/* Question checklist */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <QuestionChecklist
            questions={questionsState.questions}
            issueStatement={processContext?.issueStatement}
            onIssueStatementChange={handleIssueStatementChange}
            onQuestionClick={handleQuestionClickWithSwitch}
            problemStatement={processContext?.problemStatement}
            evidenceLabel={strategy.questionStrategy.evidenceLabel}
            highlightedFactor={highlightedFactor}
          />
        </div>

        {/* Investigation conclusion */}
        {(suspectedCauses.length > 0 || ruledOut.length > 0 || hubs.length > 0) && (
          <div className="border-t border-edge px-3 py-2 flex-shrink-0">
            <InvestigationConclusion
              suspectedCauses={suspectedCauses}
              ruledOut={ruledOut}
              contributing={contributing}
              problemStatement={processContext?.problemStatement}
              hasConclusions={suspectedCauses.length > 0 || hubs.length > 0}
              problemStatementDraft={problemStatement.draft}
              isProblemStatementReady={problemStatement.isReady}
              onGenerateProblemStatement={problemStatement.generate}
              onAcceptProblemStatement={problemStatement.accept}
              onDismissProblemStatement={problemStatement.dismiss}
              hubs={hubs}
              hubEvidences={hubEvidences}
              hubProjections={hubProjections}
              onCreateHub={handleCreateHub}
              onUpdateHub={handleUpdateHub}
              onDeleteHub={handleDeleteHub}
              onToggleHubSelect={handleToggleHubSelect}
              onBrainstormHub={handleBrainstormHub}
              evidenceClusters={evidenceClusters}
              questions={questionsState.questions}
              findings={findingsState.findings}
            />
          </div>
        )}

        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
          onMouseDown={leftPanel.handleMouseDown}
        >
          <GripVertical
            size={12}
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 text-content-tertiary"
          />
        </div>
      </div>

      {/* Center: Evidence Map or Findings (list/board/tree) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-edge bg-surface flex-shrink-0">
          {/* Primary toggle: Map vs Findings */}
          {(['map', 'findings'] as const).map(mode => (
            <button
              key={mode}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                investigationViewMode === mode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
              }`}
              onClick={() => setInvestigationViewMode(mode)}
            >
              {mode === 'map' ? 'Evidence Map' : 'Findings'}
            </button>
          ))}

          {/* Sub-toggle: Map/Wall (only when Evidence Map is active) */}
          {investigationViewMode === 'map' && (
            <>
              <div className="w-px h-4 bg-edge mx-1" />
              <div
                role="group"
                aria-label="Investigation view mode"
                className="inline-flex items-center gap-0.5 rounded border border-edge p-0.5"
              >
                {(['map', 'wall'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={wallViewMode === mode}
                    onClick={() => setWallViewMode(mode)}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      wallViewMode === mode
                        ? 'bg-surface-secondary text-content'
                        : 'text-content-secondary hover:text-content'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Sub-toggle: list/board/tree (only when Findings is active) */}
          {investigationViewMode === 'findings' && (
            <>
              <div className="w-px h-4 bg-edge mx-1" />
              {(['list', 'board', 'tree'] as const).map(mode => (
                <button
                  key={mode}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
                  }`}
                  onClick={() => handleViewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </>
          )}

          <span className="ml-auto text-xs text-content-tertiary">
            {findingsState.findings.length} finding
            {findingsState.findings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Content */}
        {investigationViewMode === 'map' ? (
          wallViewMode === 'wall' ? (
            processMap ? (
              <WallCanvas
                hubs={hubs}
                findings={findingsState.findings}
                questions={questionsState.questions}
                processMap={processMap}
                problemCpk={0}
                eventsPerWeek={0}
                activeColumns={wallActiveColumns}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-content-secondary text-sm px-6 text-center">
                Build a Process Map in the Frame workspace first.
              </div>
            )
          ) : (
            <InvestigationMapView
              mapOptions={{
                bestSubsets: mapBestSubsets,
                mainEffects,
                interactions,
                mode: resolved,
                causalLinks,
                questions: questionsState.questions,
                findings: findingsState.findings,
                suspectedCauses: hubs,
              }}
              onAskQuestion={handleMapAskQuestion}
              onCreateFinding={handleMapCreateFinding}
              onAskCoScout={handleMapAskCoScout}
              onDrillDown={handleMapDrillDown}
              onConfirmCausalLink={handleConfirmCausalLink}
              onRemoveCausalLink={handleRemoveCausalLink}
              onUpdateCausalLink={handleUpdateCausalLink}
              wouldCreateCycle={checkWouldCreateCycle}
              filteredData={filteredData ?? undefined}
              defectMapView={isDefectMode ? defectMapView : undefined}
              onDefectMapViewChange={isDefectMode ? setDefectMapView : undefined}
              defectEvidenceMap={isDefectMode ? defectEvidenceMap : undefined}
            />
          )
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <FindingsLog
              findings={findingsState.findings}
              onEditFinding={findingsState.editFinding}
              onDeleteFinding={findingsState.deleteFinding}
              onRestoreFinding={handleRestoreFinding}
              viewMode={viewMode}
              questions={questionsState.questions}
              onSelectQuestion={h => useInvestigationFeatureStore.getState().expandToQuestion(h.id)}
              onAddSubQuestion={questionsState.addSubQuestion}
              factors={drillFactors}
              getChildrenSummary={questionsState.getChildrenSummary}
              onSetFindingStatus={handleSetFindingStatus}
              onSetFindingTag={findingsState.setFindingTag}
              onAddComment={(id: string, text: string) => handleAddCommentWithAuthor(id, text)}
              columnAliases={columnAliases}
              activeFindingId={highlightedFindingId}
              onAddPhoto={
                hasTeamFeatures() && handleAddPhoto
                  ? (fId: string, cId: string, file: File) => {
                      handleAddPhoto(fId, cId, file);
                    }
                  : undefined
              }
              onCaptureFromTeams={
                hasTeamFeatures() && isTeamsCamera && handleCaptureFromTeams
                  ? (fId: string, cId: string) => {
                      handleCaptureFromTeams(fId, cId);
                    }
                  : undefined
              }
              onCreateQuestion={handleCreateQuestion}
              questionsMap={questionsMap}
              onSetValidationTask={questionsState.setValidationTask}
              onCompleteTask={questionsState.completeTask}
              onSetManualStatus={questionsState.setManualStatus}
              onAddAction={findingsState.addAction}
              onCompleteAction={findingsState.completeAction}
              onDeleteAction={findingsState.deleteAction}
              onSetOutcome={findingsState.setOutcome}
              ideaImpacts={ideaImpacts}
              onAddIdea={questionsState.addIdea}
              onUpdateIdea={questionsState.updateIdea}
              onRemoveIdea={questionsState.removeIdea}
              onSelectIdea={questionsState.selectIdea}
              onProjectIdea={handleProjectIdea}
              onSetCauseRole={questionsState.setCauseRole}
              onShareFinding={handleShareFinding}
              onNavigateToChart={handleNavigateToChart}
              showAuthors
            />
          </div>
        )}
      </div>

      {/* Right: CoScout panel (session-close prompt, visual grounding, KB search) */}
      <CoScoutSection
        aiOrch={aiOrch}
        findingsState={findingsState}
        questionsState={questionsState}
        actionProposalsState={actionProposalsState}
        handleSearchKnowledge={handleSearchKnowledge}
        handleAddCommentWithAuthor={handleAddCommentWithAuthor}
      />

      {/* Question-Link Prompt — shown after map context-menu creates a Finding */}
      <QuestionLinkPrompt
        isOpen={mapPromptOpen}
        findingId={mapPromptFindingId}
        questions={mapQuestions}
        onLink={handleMapPromptLink}
        onSkip={handleMapPromptClose}
        onSkipForever={handleMapPromptSkipForever}
        onClose={handleMapPromptClose}
      />
    </div>
  );
};
