import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnalyzePhaseBadge,
  AnalyzeConclusion,
  FindingsLog,
  WallCanvas,
  CommandPalette,
  Minimap,
  CANVAS_W,
  CANVAS_H,
  ActiveIPScopeRibbon,
  useWallKeyboard,
  useWallIsMobile,
  type HubComposerBranchFields,
} from '@variscout/ui';
import type { ActiveIPLineageIds, ActiveIPScopeLabels } from '@variscout/ui';
import {
  useResizablePanel,
  useProblemStatement,
  useCurrentUnderstanding,
  useHubComputations,
  useDefectTransform,
  useDefectEvidenceMap,
  useReturnNavigation,
  type DefectMapView,
  type UseFindingsReturn,
} from '@variscout/hooks';
import type {
  CurrentUnderstanding,
  FindingStatus,
  Hypothesis,
  ProblemCondition,
  ProcessContext,
} from '@variscout/core';
import {
  normalizeProcessHubId,
  inferCharacteristicType,
  computeMainEffects,
  computeInteractionEffects,
  categoricalFiltersToActiveFilters,
  buildConditionFromCategoricalFilters,
  predicateSetKey,
} from '@variscout/core';
import { computeBestSubsets } from '@variscout/core/stats';
import { detectEvidenceClusters } from '@variscout/core/findings';
import type { ColumnTypeMap } from '@variscout/core/findings';
import { canAccess } from '@variscout/core/projectMembership';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { detectColumns } from '@variscout/core/parser';
import { detectInvestigationPhase } from '@variscout/core/ai';
import { resolveMode } from '@variscout/core/strategy';
import { resolveCpkTarget } from '@variscout/core/capability';
import { wouldCreateCycle } from '@variscout/core/stats';
import { GripVertical } from 'lucide-react';
import {
  useProjectStore,
  useAnalyzeStore,
  useAnalysisScopeStore,
  usePreferencesStore,
  useCanvasViewportStore,
} from '@variscout/stores';
import type { WallCanvasPlanningProps } from '@variscout/ui';
import { AnalyzeMapView } from './AnalyzeMapView';
import { CoScoutSection } from './CoScoutSection';
import { isSpeechToTextAvailable, transcribeAudio } from '../../services/speechService';
import { useFilteredData, useAnalysisStats } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';
import { useFindingsStore } from '../../features/findings/findingsStore';
import type { UseFindingsOrchestrationReturn } from '../../features/findings/useFindingsOrchestration';
import { useAIStore } from '../../features/ai/aiStore';
import type { UseAIOrchestrationReturn, UseActionProposalsReturn } from '../../features/ai';
import type { UseAnalyzeOrchestrationReturn } from '../../features/analyze/useAnalyzeOrchestration';
import { useWallHubCommentLifecycle } from '../../features/analyze/useWallHubCommentLifecycle';

const DEFAULT_WALL_PAN = { x: 0, y: 0 };

// Resize panel config (individual args for useResizablePanel)

interface AnalyzeWorkspaceProps {
  activeIPScope?: { title: string; labels: ActiveIPScopeLabels } | null;
  activeIPLineage?: ActiveIPLineageIds | null;
  // Findings
  findingsState: UseFindingsReturn;
  handleRestoreFinding: UseFindingsOrchestrationReturn['handleRestoreFinding'];
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  handleNavigateToChart: UseFindingsOrchestrationReturn['handleNavigateToChart'];
  handleShareFinding: UseFindingsOrchestrationReturn['handleShareFinding'];
  drillPath: UseFindingsOrchestrationReturn['drillPath'];
  // Comments
  handleAddCommentWithAuthor: (
    findingId: string,
    text: string,
    attachment?: File
  ) => void | Promise<void>;
  handleAddPhoto: ((findingId: string, commentId: string, file: File) => Promise<void>) | undefined;
  /** userId of the currently signed-in user — used for canAccess('edit-contributions') role check. */
  userId: string | null;
  /** Members of the active improvement project — used for canAccess role check. Empty = open-access (quick-analysis flow). */
  members: ProjectMember[];
  // AI
  aiOrch: UseAIOrchestrationReturn;
  actionProposalsState: UseActionProposalsReturn;
  handleSearchKnowledge: () => void;
  // Column aliases
  columnAliases: Record<string, string>;
  // Hub model (Hypothesis CRUD from useAnalyzeOrchestration)
  hypothesesState: UseAnalyzeOrchestrationReturn['hypothesesState'];
  // View state
  viewMode?: 'list' | 'board';
  onViewModeChange?: (mode: 'list' | 'board') => void;
  /**
   * Optional measurement-plan affordances threaded into WallCanvas.
   * When provided, hub cards render HypothesisCardWithPlans.
   * When omitted (default), hub cards render bare HypothesisCard.
   */
  planningProps?: WallCanvasPlanningProps;
}

/**
 * Investigation workspace (ADR-055, IM-1): hypothesis-driven EDA.
 *
 * Left: PhaseBadge + AnalyzeConclusion (hub composer)
 * Center: Evidence Map / Wall (hubs + findings) | FindingsLog (list / board)
 * Right: CoScout (optional)
 *
 * IM-1 (ADR-085): the Question entity is retired. Suspected causes are
 * `Hypothesis` hubs; the Wall renders hubs + findings (no question column).
 */
export const AnalyzeWorkspace: React.FC<AnalyzeWorkspaceProps> = ({
  activeIPScope,
  activeIPLineage,
  findingsState,
  handleRestoreFinding,
  handleSetFindingStatus,
  handleNavigateToChart,
  handleShareFinding,
  // IM-1: drillPath no longer consumed (drillFactors derivation removed); kept on
  // the props interface for API stability + the call site that still passes it.
  drillPath: _drillPath,
  handleAddCommentWithAuthor,
  handleAddPhoto,
  userId,
  members,
  aiOrch,
  actionProposalsState,
  handleSearchKnowledge,
  columnAliases,
  hypothesesState,
  viewMode: externalViewMode,
  onViewModeChange,
  planningProps,
}) => {
  const voiceInput = isSpeechToTextAvailable() ? { isAvailable: true, transcribeAudio } : undefined;
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const specs = useProjectStore(s => s.specs);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const projectCpkTarget = useProjectStore(s => s.cpkTarget);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const { value: cpkTarget } = resolveCpkTarget(outcome ?? '', {
    measureSpecs,
    projectCpkTarget,
  });
  const processMap = useProjectStore(s => s.processContext?.processMap);
  const { filteredData } = useFilteredData();
  const { stats } = useAnalysisStats();

  const analyzeViewMode = usePanelsStore(s => s.analyzeViewMode);
  // IM-1: highlightedFactor read removed here; its only consumer was the retired
  // Question-driven evidence header. AnalyzeMapView reads the store field directly.
  const setAnalyzeViewMode = usePanelsStore(s => s.setAnalyzeViewMode);

  // Map/Wall sub-toggle (within the Evidence Map view)
  const wallViewMode = useCanvasViewportStore(s => s.viewMode);
  const setWallViewMode = useCanvasViewportStore(s => s.setViewMode);
  // Phase 13 scale features — threaded into WallCanvas so zoom, pan, and
  // tributary clustering route through the existing store + persistence.
  const wallHubId = normalizeProcessHubId(processContext?.processHubId);
  const wallZoom = useCanvasViewportStore(s => s.viewports[wallHubId]?.zoom ?? 1);
  const wallPan = useCanvasViewportStore(s => s.viewports[wallHubId]?.pan ?? DEFAULT_WALL_PAN);
  const setWallPan = useCanvasViewportStore(s => s.setPan);
  const wallGroupByTributary = useCanvasViewportStore(
    s => s.viewports[wallHubId]?.groupByTributary ?? false
  );
  const setWallGroupByTributary = useCanvasViewportStore(s => s.setGroupByTributary);
  const returnNavigation = useReturnNavigation();
  const returnTarget = returnNavigation.peekReturnTarget();
  const canReturnToImprovementProject = returnTarget?.sourceSurface === 'improvement-project';
  // Columns present in the active dataset — powers WallCanvas missing-column
  // badge for hubs whose condition references a renamed or dropped column.
  // Undefined when no rows are loaded so the badge stays suppressed (rather
  // than flagging every column as missing against an empty column set).
  const rawData = useProjectStore(s => s.rawData);
  const wallActiveColumns = useMemo<string[] | undefined>(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : undefined),
    [rawData]
  );
  const columnTypes = useMemo<ColumnTypeMap>(() => {
    if (rawData.length === 0) return {};
    const det = detectColumns(rawData);
    const map: ColumnTypeMap = {};
    for (const c of det.columnAnalysis) map[c.name] = c.type;
    return map;
  }, [rawData]);
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);
  const causalLinks = useAnalyzeStore(s => s.causalLinks);

  // ── Drill → scope spine (IM-4a) ──────────────────────────────────────────
  // The active drill chips ARE the active scope (design §2). Materialize them
  // into a persisted ProblemStatementScope (idempotent) and select the scope
  // matching the current compound condition so the Problem card anchors on it.
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const scopes = useAnalyzeStore(s => s.scopes);
  const scopeInvestigationId = 'general-unassigned'; // sentinel until F6 first-class investigations
  useEffect(() => {
    if (!outcome) return;
    useAnalyzeStore
      .getState()
      .syncScopeFromDrill(scopeInvestigationId, outcome, categoricalFilters);
  }, [categoricalFilters, outcome]);
  const activeScope = useMemo(() => {
    if (!outcome) return undefined;
    const predicates = buildConditionFromCategoricalFilters(categoricalFilters);
    if (predicates.length === 0) return undefined;
    const key = predicateSetKey(predicates);
    return scopes.find(
      s =>
        s.investigationId === scopeInvestigationId &&
        s.outcome === outcome &&
        predicateSetKey(s.predicates) === key
    );
  }, [categoricalFilters, outcome, scopes]);
  // Per-outcome spec limits for the scope's What-If projection (IM-5).
  const activeScopeSpecs = useMemo(
    () => (outcome ? (measureSpecs[outcome] ?? specs) : undefined),
    [measureSpecs, outcome, specs]
  );
  // Live Problem-card base values for the scoped subset (no longer hardcoded):
  // Cpk from the filtered-data stats, and the out-of-spec event COUNT as the
  // "events" proxy (no reliable weekly cadence in V1 — count of occurrences).
  const problemCpk = stats?.cpk ?? 0;
  const problemEvents = useMemo(() => {
    if (!stats || !filteredData?.length) return 0;
    return Math.round((stats.outOfSpecPercentage / 100) * filteredData.length);
  }, [stats, filteredData]);
  const scopedHubIds = useMemo(
    () => new Set(activeIPLineage?.hypothesisIds ?? []),
    [activeIPLineage]
  );
  const scopedFindingIds = useMemo(
    () => new Set(activeIPLineage?.findingIds ?? []),
    [activeIPLineage]
  );

  // Wall hub-comment SSE subscription — no-op when viewMode !== 'wall' or
  // when there's no selection. Streams lifetime-bound to this component
  // (unmounts when the user leaves the Investigation workspace).
  useWallHubCommentLifecycle();

  // Phase 13 — ⌘K command palette. Only responds when Wall is visible.
  // (pan-to-node helper is defined after `hubs` is available, below.)
  const [wallPaletteOpen, setWallPaletteOpen] = useState(false);
  // Phase 14.1 — viewport-aware rendering. Below 768px the WallCanvas swaps
  // to MobileCardList; the Minimap and CommandPalette are sibling controls,
  // so we gate their mount on the same breakpoint.
  const wallIsMobile = useWallIsMobile();
  useWallKeyboard({
    onSearch: () => {
      if (wallViewMode === 'wall' && !wallIsMobile) setWallPaletteOpen(true);
    },
  });

  // Investigation phase (deterministic, from findings state)
  const analyzePhase = useMemo(
    () => detectInvestigationPhase(findingsState.findings),
    [findingsState.findings]
  );

  // Defect mode transform
  const defectResult = useDefectTransform(filteredData, defectMapping, analysisMode ?? 'standard');

  const resolved = resolveMode(analysisMode ?? 'standard');
  // IM-1: strategy (getStrategy) derivation removed; its only consumer was the
  // retired Question-strategy evidence label. resolved still drives defect mode.

  // Best-subsets regression — drives hub evidence/projection + Evidence Map
  // (IM-1: was sourced from the retired useQuestionGeneration; now computed
  // directly from the filtered dataset).
  const bestSubsets = useMemo(() => {
    if (!filteredData?.length || !outcome || factors.length === 0) return null;
    return computeBestSubsets(filteredData, outcome, factors);
  }, [filteredData, outcome, factors]);

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

  // Location factor for Watson Q3 (IM-1: derived from best-subsets directly,
  // not from the retired factor-intel questions). Picks the strongest
  // single-factor model and its worst level (largest positive level effect).
  const locationFactor = useMemo(() => {
    if (!bestSubsets) return undefined;
    const singleFactor = bestSubsets.subsets
      .filter(s => s.factors.length === 1)
      .sort((a, b) => b.rSquaredAdj - a.rSquaredAdj)[0];
    if (!singleFactor) return undefined;
    const factor = singleFactor.factors[0];
    const levelEffects = singleFactor.levelEffects.get(factor);
    let worstLevel: string | undefined;
    let worstEffect = -Infinity;
    if (levelEffects) {
      for (const [level, effect] of levelEffects) {
        if (effect > worstEffect) {
          worstEffect = effect;
          worstLevel = level;
        }
      }
    }
    return {
      factor,
      level: worstLevel,
      evidence: singleFactor.rSquaredAdj,
    };
  }, [bestSubsets]);

  // ── Hub model computations (Hypothesis hubs) ───────────────────────
  const hubs = hypothesesState.hubs;
  const scopedHubs = useMemo(
    () => (activeIPScope ? hubs.filter(h => scopedHubIds.has(h.id)) : hubs),
    [activeIPScope, hubs, scopedHubIds]
  );
  const scopedWallFindings = useMemo(
    () =>
      activeIPScope
        ? findingsState.findings.filter(f => scopedFindingIds.has(f.id))
        : findingsState.findings,
    [activeIPScope, scopedFindingIds, findingsState.findings]
  );

  // Phase 13 — pan-to-node: replicate WallCanvas's deterministic layout so the
  // command palette can center the viewport on a hub by id. (IM-1: the
  // question row is gone; only hub nodes are pan-targets.)
  const handleWallPanToNode = useCallback(
    (nodeId: string) => {
      const hubIndex = scopedHubs.findIndex(h => h.id === nodeId);
      if (hubIndex >= 0) {
        const hubSpacing = CANVAS_W / (scopedHubs.length + 1);
        setWallPan(wallHubId, {
          x: CANVAS_W / 2 - hubSpacing * (hubIndex + 1),
          y: CANVAS_H / 2 - 400,
        });
      }
    },
    [scopedHubs, wallHubId, setWallPan]
  );

  const handleReturnToImprovementProject = useCallback(() => {
    const target = returnNavigation.consumeReturnTarget();
    if (target?.sourceSurface === 'improvement-project') {
      usePanelsStore.getState().showCharter();
    }
  }, [returnNavigation]);

  const { hubEvidences, hubProjections } = useHubComputations(bestSubsets, findingsState.findings);

  // Detect evidence clusters for synthesis prompts
  const evidenceClusters = useMemo(
    () => detectEvidenceClusters(findingsState.findings, scopedHubs, bestSubsets),
    [findingsState.findings, scopedHubs, bestSubsets]
  );

  // Left panel resizable
  const leftPanel = useResizablePanel('variscout-analyze-left-width', 260, 420, 320, 'left');

  // Internal view mode (if not controlled)
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'board'>('board');
  const viewMode = externalViewMode ?? internalViewMode;
  const handleViewMode = onViewModeChange ?? setInternalViewMode;

  // Categorize hypothesis hubs for AnalyzeConclusion (IM-1: status-derived,
  // replacing the retired Question causeRole split). Only the suspected
  // (confirmed) and ruledOut (refuted) sets gate the conclusion panel today;
  // IM-1: the `contributing` set derivation is removed — the level-native
  // contribution view that renders it arrives in IM-5.
  const { hypotheses, ruledOut } = useMemo(() => {
    const suspected: Hypothesis[] = [];
    const ruled: Hypothesis[] = [];
    for (const h of hypothesesState.hubs) {
      if (h.status === 'refuted') ruled.push(h);
      else if (h.status === 'confirmed') suspected.push(h);
    }
    return { hypotheses: suspected, ruledOut: ruled };
  }, [hypothesesState.hubs]);

  // IM-1: drillFactors derivation removed; its only consumer was the retired
  // Question-driven evidence panel (factors={drillFactors}). The `drillPath`
  // prop is retained on the interface for API stability but no longer read here.

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
    hypothesisHubs: hypothesesState.hubs,
    existingStatement: processContext?.problemStatement,
    onStatementChange: handleProblemStatementChange,
  });

  const handleCurrentUnderstandingChange = useCallback(
    (
      currentUnderstanding: CurrentUnderstanding | undefined,
      problemCondition: ProblemCondition | undefined
    ) => {
      const next: ProcessContext = { ...(processContext ?? {}) };
      if (currentUnderstanding) {
        next.currentUnderstanding = currentUnderstanding;
      } else {
        delete next.currentUnderstanding;
      }
      if (problemCondition) {
        next.problemCondition = problemCondition;
      } else {
        delete next.problemCondition;
      }
      setProcessContext(next);
    },
    [processContext, setProcessContext]
  );

  const currentUnderstandingState = useCurrentUnderstanding({
    processContext,
    stats: {
      mean: stats?.mean,
      stdDev: stats?.stdDev,
      cpk: stats?.cpk,
      passRate:
        stats?.outOfSpecPercentage !== undefined ? 100 - stats.outOfSpecPercentage : undefined,
    },
    problemStatement,
    hypothesisHubs: hubs,
    onCurrentUnderstandingChange: handleCurrentUnderstandingChange,
  });

  // Issue statement handlers
  const handleIssueStatementChange = (text: string) => {
    setProcessContext({ ...processContext, issueStatement: text });
  };

  // ── Hub CRUD callbacks (IM-1: hubs connect findings only — Question retired) ──
  const handleCreateHub = useCallback(
    (
      name: string,
      synthesis: string,
      findingIds: string[],
      branchFields: HubComposerBranchFields
    ) => {
      const hub = hypothesesState.createHub(name, synthesis);
      for (const fId of findingIds) hypothesesState.connectFinding(hub.id, fId);
      if (branchFields.nextMove) hypothesesState.updateHub(hub.id, branchFields);
    },
    [hypothesesState]
  );

  const handleUpdateHub = useCallback(
    (
      hubId: string,
      name: string,
      synthesis: string,
      findingIds: string[],
      branchFields: HubComposerBranchFields
    ) => {
      hypothesesState.updateHub(hubId, { name, synthesis, ...branchFields });
      // Sync finding connections: disconnect removed, connect added
      const existing = hubs.find(h => h.id === hubId);
      if (existing) {
        for (const fId of existing.findingIds) {
          if (!findingIds.includes(fId)) hypothesesState.disconnectFinding(hubId, fId);
        }
        for (const fId of findingIds) {
          if (!existing.findingIds.includes(fId)) hypothesesState.connectFinding(hubId, fId);
        }
      }
    },
    [hypothesesState, hubs]
  );

  const handleDeleteHub = useCallback(
    (hubId: string) => hypothesesState.deleteHub(hubId),
    [hypothesesState]
  );

  const handleToggleHubSelect = useCallback(
    (hubId: string) => {
      const hub = hubs.find(h => h.id === hubId);
      if (hub) {
        hypothesesState.updateHub(hubId, {});
        // selectedForImprovement is a flag toggle, not a status change (status is
        // now derived via deriveHypothesisStatus — IM-4a). updateHub only accepts
        // name/synthesis, so use the store-sync approach to flip the flag:
        const updated = hubs.map(h =>
          h.id === hubId ? { ...h, selectedForImprovement: !h.selectedForImprovement } : h
        );
        hypothesesState.resetHubs(updated);
      }
    },
    [hypothesesState, hubs]
  );

  const handleBrainstormHub = useCallback((_hubId: string) => {
    // Navigate to improvement workspace
    usePanelsStore.getState().showImprovement();
  }, []);

  // ── Evidence Map context menu callbacks ──────────────────────────────────
  // IM-1: "ask question" routes to CoScout (no Question entity to create).
  const handleMapAskQuestion = useCallback(
    (factor: string) => {
      aiOrch.handleAskCoScoutFromCategory({ category: { name: factor } });
    },
    [aiOrch]
  );

  const handleMapCreateFinding = useCallback(
    (factor: string) => {
      // IM-4a: snapshot the DRILL condition (the active scope chips), not the
      // legacy row-level projectStore.filters map — the captured Finding should
      // reflect the WHERE the analyst is investigating.
      const activeFilters = categoricalFiltersToActiveFilters(
        useAnalysisScopeStore.getState().categoricalFilters
      );
      findingsState.addFinding(
        `Observation about ${factor}`,
        { activeFilters, cumulativeScope: null },
        { chart: 'boxplot', category: factor, timeLens: usePreferencesStore.getState().timeLens }
      );
    },
    [findingsState]
  );

  const handleMapAskCoScout = useCallback(
    (factor: string) => {
      aiOrch.handleAskCoScoutFromCategory({ category: { name: factor } });
    },
    [aiOrch]
  );

  const handleMapDrillDown = useCallback((factor: string) => {
    usePanelsStore.getState().setHighlightedFactor(factor);
    usePanelsStore.getState().showExplore();
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
      useAnalyzeStore.getState().addCausalLink(from, to, params.whyStatement, {
        direction: params.direction,
        evidenceType: params.evidenceType,
      });
    },
    []
  );

  const handleRemoveCausalLink = useCallback((id: string) => {
    useAnalyzeStore.getState().removeCausalLink(id);
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
      useAnalyzeStore.getState().updateCausalLink(id, {
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
    <div className="flex flex-1 min-h-0 flex-col">
      {activeIPScope ? (
        <ActiveIPScopeRibbon
          title={activeIPScope.title}
          labels={activeIPScope.labels}
          surface="Analyze"
        />
      ) : null}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left panel: phase + issue statement + hub conclusions (IM-1: the
            question checklist is retired; suspected causes live as hubs). */}
        <div
          className="relative flex flex-col border-r border-edge overflow-hidden bg-surface flex-shrink-0"
          style={{ width: leftPanel.width }}
        >
          {/* Phase badge */}
          {analyzePhase && (
            <div className="px-3 pt-3 pb-1 flex-shrink-0">
              <AnalyzePhaseBadge phase={analyzePhase} />
            </div>
          )}

          {/* Issue statement */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <label className="block text-xs font-medium text-content-secondary mb-1">
              Issue statement
            </label>
            <textarea
              className="w-full rounded border border-edge bg-surface-secondary px-2 py-1.5 text-sm text-content resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              value={processContext?.issueStatement ?? ''}
              onChange={e => handleIssueStatementChange(e.target.value)}
              placeholder="Describe the issue under investigation…"
            />
            {currentUnderstandingState.currentUnderstanding && (
              <p className="mt-2 text-xs text-content-secondary">
                {currentUnderstandingState.currentUnderstanding.summary}
              </p>
            )}
          </div>

          {/* Investigation conclusion */}
          {(hypotheses.length > 0 || ruledOut.length > 0 || scopedHubs.length > 0) && (
            <div className="border-t border-edge px-3 py-2 flex-shrink-0">
              <AnalyzeConclusion
                problemStatement={processContext?.problemStatement}
                hasConclusions={hypotheses.length > 0 || scopedHubs.length > 0}
                problemStatementDraft={problemStatement.draft}
                isProblemStatementReady={problemStatement.isReady}
                onGenerateProblemStatement={problemStatement.generate}
                onAcceptProblemStatement={problemStatement.accept}
                onDismissProblemStatement={problemStatement.dismiss}
                hubs={scopedHubs}
                hubEvidences={hubEvidences}
                hubProjections={hubProjections}
                onCreateHub={handleCreateHub}
                onUpdateHub={handleUpdateHub}
                onDeleteHub={handleDeleteHub}
                onToggleHubSelect={handleToggleHubSelect}
                onBrainstormHub={handleBrainstormHub}
                evidenceClusters={evidenceClusters}
                findings={scopedWallFindings}
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
                  analyzeViewMode === mode
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-content-secondary hover:text-content hover:bg-surface-secondary'
                }`}
                onClick={() => setAnalyzeViewMode(mode)}
              >
                {mode === 'map' ? 'Evidence Map' : 'Findings'}
              </button>
            ))}

            {/* Sub-toggle: Map/Wall (only when Evidence Map is active) */}
            {analyzeViewMode === 'map' && (
              <>
                <div className="w-px h-4 bg-edge mx-1" />
                <div
                  role="group"
                  aria-label="Analyze view mode"
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
                {/* Wall-only toolbar: group by tributary */}
                {wallViewMode === 'wall' && processMap && (
                  <button
                    type="button"
                    aria-pressed={wallGroupByTributary}
                    onClick={() => setWallGroupByTributary(wallHubId, !wallGroupByTributary)}
                    className={`ml-1 px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      wallGroupByTributary
                        ? 'bg-surface-secondary text-content'
                        : 'text-content-secondary hover:text-content'
                    }`}
                  >
                    Group by tributary
                  </button>
                )}
              </>
            )}

            {canReturnToImprovementProject && (
              <button
                type="button"
                onClick={handleReturnToImprovementProject}
                className="ml-1 rounded border border-edge bg-surface-secondary px-2 py-0.5 text-xs font-medium text-content hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Back to Project
              </button>
            )}

            {/* Sub-toggle: list/board (only when Findings is active) */}
            {analyzeViewMode === 'findings' && (
              <>
                <div className="w-px h-4 bg-edge mx-1" />
                {(['list', 'board'] as const).map(mode => (
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
              {scopedWallFindings.length} finding
              {scopedWallFindings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          {analyzeViewMode === 'map' ? (
            wallViewMode === 'wall' ? (
              <div className="relative flex-1 flex flex-col min-h-0">
                <WallCanvas
                  hubId={wallHubId}
                  hubs={scopedHubs}
                  findings={scopedWallFindings}
                  processMap={processMap}
                  problemCpk={problemCpk}
                  eventsPerWeek={problemEvents}
                  activeScope={activeScope}
                  activeScopeSpecs={activeScopeSpecs}
                  activeColumns={wallActiveColumns}
                  rows={rawData}
                  columnTypes={columnTypes}
                  outcomeColumn={outcome}
                  zoom={wallZoom}
                  pan={wallPan}
                  groupByTributary={Boolean(processMap && wallGroupByTributary)}
                  planningProps={planningProps}
                />
                {/* Minimap + CommandPalette are desktop-only. WallCanvas
                  self-gates to MobileCardList below 768px, so these
                  sibling controls would overlap the mobile list. */}
                {!wallIsMobile && (
                  <>
                    <div className="absolute bottom-4 right-4 pointer-events-auto">
                      <Minimap
                        hubs={scopedHubs}
                        zoom={wallZoom}
                        pan={wallPan}
                        onPanTo={(x, y) => setWallPan(wallHubId, { x, y })}
                      />
                    </div>
                    <CommandPalette
                      open={wallPaletteOpen}
                      onClose={() => setWallPaletteOpen(false)}
                      onPanTo={handleWallPanToNode}
                      hubs={scopedHubs}
                      findings={scopedWallFindings}
                    />
                  </>
                )}
              </div>
            ) : (
              <AnalyzeMapView
                mapOptions={{
                  bestSubsets: mapBestSubsets,
                  mainEffects,
                  interactions,
                  mode: resolved,
                  causalLinks,
                  findings: scopedWallFindings,
                  hypotheses: scopedHubs,
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
                findings={scopedWallFindings}
                onEditFinding={findingsState.editFinding}
                onDeleteFinding={findingsState.deleteFinding}
                onRestoreFinding={handleRestoreFinding}
                viewMode={viewMode}
                onSetFindingStatus={handleSetFindingStatus}
                onSetFindingTag={findingsState.setFindingTag}
                onAddComment={(id: string, text: string) => handleAddCommentWithAuthor(id, text)}
                columnAliases={columnAliases}
                activeFindingId={highlightedFindingId}
                onAddPhoto={
                  (members.length === 0 ||
                    (userId !== null && canAccess(userId, members, 'edit-contributions'))) &&
                  handleAddPhoto
                    ? (fId: string, cId: string, file: File) => {
                        handleAddPhoto(fId, cId, file);
                      }
                    : undefined
                }
                onAddAction={findingsState.addAction}
                onCompleteAction={findingsState.completeAction}
                onDeleteAction={findingsState.deleteAction}
                onSetOutcome={findingsState.setOutcome}
                onShareFinding={handleShareFinding}
                onNavigateToChart={handleNavigateToChart}
                showAuthors
                voiceInput={voiceInput}
              />
            </div>
          )}
        </div>

        {/* Right: CoScout panel (session-close prompt, visual grounding, KB search) */}
        <CoScoutSection
          aiOrch={aiOrch}
          findingsState={findingsState}
          actionProposalsState={actionProposalsState}
          handleSearchKnowledge={handleSearchKnowledge}
          handleAddCommentWithAuthor={handleAddCommentWithAuthor}
        />
      </div>
    </div>
  );
};
