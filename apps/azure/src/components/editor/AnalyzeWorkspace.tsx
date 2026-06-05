import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnalyzePhaseBadge,
  AnalyzeConclusion,
  FindingsLog,
  WallCanvas,
  ScopeRail,
  CommandPalette,
  Minimap,
  CANVAS_W,
  CANVAS_H,
  computeWallLayout,
  buildWallLayoutArgs,
  ActiveIPScopeRibbon,
  useWallKeyboard,
  useWallIsMobile,
  navigateToExploreForChip,
  type HubComposerBranchFields,
} from '@variscout/ui';
import type { ActiveIPScopeLabels } from '@variscout/ui';
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
  IdeaImpact,
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
  formatConditionLeaves,
  predicateSetKey,
  parseMentions,
} from '@variscout/core';
import { computeBestSubsets } from '@variscout/core/stats';
import {
  detectEvidenceClusters,
  evaluateHypothesisFactor,
  isEvaluateFindingForFactor,
  evaluateDisconfirmation,
  isDisconfirmationFindingForFactor,
  isDisconfirmationResult,
} from '@variscout/core/findings';
import type { DisconfirmationAttempt } from '@variscout/core';
import { generateDeterministicId } from '@variscout/core/identity';
import type { EvaluateFactorOptions } from '@variscout/ui';
import type { ColumnTypeMap } from '@variscout/core/findings';
import { canAccess } from '@variscout/core/projectMembership';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { detectColumns } from '@variscout/core/parser';
import { deriveProcessSteps } from '@variscout/core/frame';
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
  useViewStore,
} from '@variscout/stores';
import type { WallCanvasPlanningProps, WallCanvasModelBuilderProps } from '@variscout/ui';
import type { CapturedModelSnapshot } from '@variscout/ui';
import type { FindingProjection } from '@variscout/core';
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
  /**
   * PR-CS-0 Task 2: id under which drill-materialized ProblemStatementScopes are
   * keyed. Threaded from the active Improvement Project (`activeIP.id`) so scopes
   * are durable per-IP and don't co-mingle across projects. Defaults to the
   * `'general-unassigned'` sentinel for the quick-analysis flow (no active IP) and
   * for render harnesses that don't pass the prop.
   */
  scopeInvestigationId?: string;
  // Findings
  findingsState: UseFindingsReturn;
  handleRestoreFinding: UseFindingsOrchestrationReturn['handleRestoreFinding'];
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  handleNavigateToChart: UseFindingsOrchestrationReturn['handleNavigateToChart'];
  handleShareFinding: UseFindingsOrchestrationReturn['handleShareFinding'];
  drillPath: UseFindingsOrchestrationReturn['drillPath'];
  /**
   * PR-CS-6 Edge 1: COPY a finding-level action into the active project's action
   * tracker. Provided only when an active IP exists; FindingCard hides the
   * promote button once the source action carries `parentImprovementProjectId`.
   */
  onPromoteFindingAction?: (findingId: string, actionId: string) => void;
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
   *
   * IM-4b: AnalyzeWorkspace ENRICHES this with the hub comment-thread, ActionItem,
   * and improvement-idea callbacks (sourced from `hypothesesState` + `ideaImpacts`)
   * before passing the merged bag to WallCanvas — Editor's base bag carries only
   * the measurement-plan + disconfirmation callbacks (TDZ-bound there).
   */
  planningProps?: WallCanvasPlanningProps;
  /** IM-4b — computed IdeaImpact map keyed by ideaId, for the Wall ideas section. */
  ideaImpacts?: Record<string, IdeaImpact | undefined>;
  /** IM-4b — open What-If for an improvement idea (handleProjectIdea). */
  onProjectIdea?: (hypothesisId: string, ideaId: string) => void;
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
  scopeInvestigationId = 'general-unassigned',
  findingsState,
  handleRestoreFinding,
  handleSetFindingStatus,
  handleNavigateToChart,
  handleShareFinding,
  onPromoteFindingAction,
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
  ideaImpacts,
  onProjectIdea,
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
  //
  // Execution model: reactive-on-condition-change with set-keyed idempotency.
  // `syncScopeFromDrill` runs every time `categoricalFilters` or `outcome`
  // changes (not on an imperative "commit" gesture). Intermediate scopes
  // accumulate in the store; stale ones are pruned via the IM-4b scope rail
  // (SCOPE_ARCHIVE) — not here.
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const scopes = useAnalyzeStore(s => s.scopes);
  // PR-CS-0 Task 2: scopeInvestigationId arrives as a prop (active IP id, or the
  // 'general-unassigned' sentinel for the quick-analysis flow). It is now a dep
  // of every consumer below so an IP switch re-keys materialization + the rail.
  useEffect(() => {
    if (!outcome) return;
    useAnalyzeStore
      .getState()
      .syncScopeFromDrill(scopeInvestigationId, outcome, categoricalFilters);
  }, [categoricalFilters, outcome, scopeInvestigationId]);
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
  }, [categoricalFilters, outcome, scopes, scopeInvestigationId]);
  // Per-outcome spec limits for the scope's What-If projection (IM-5).
  const activeScopeSpecs = useMemo(
    () => (outcome ? (measureSpecs[outcome] ?? specs) : undefined),
    [measureSpecs, outcome, specs]
  );

  // ── FE-1 — scope-level vital-few model-builder band ──────────────────────
  // The band runs on the ACTIVE scope: filteredData (the drilled subset) +
  // factors (candidates) + outcome Y. Factors drilled to a single value are
  // constant in scope → chipped + excluded. Capture-as-Finding creates a Finding
  // carrying the model snapshot in its projection.modelContext (LOCKED #4).
  const handleCaptureModel = useCallback(
    (snapshot: CapturedModelSnapshot) => {
      const activeFilters = categoricalFiltersToActiveFilters(
        useAnalysisScopeStore.getState().categoricalFilters
      );
      const factorList = snapshot.factors.join(', ');
      const r2adjLabel = Number.isFinite(snapshot.rSquaredAdj)
        ? snapshot.rSquaredAdj.toFixed(2)
        : '—';
      const finding = findingsState.addFinding(
        `Model: ${factorList} accounts for the spread (R²adj ${r2adjLabel}) in ${snapshot.scopeLabel}`,
        { activeFilters, cumulativeScope: null },
        undefined,
        activeScope?.id
      );
      // Snapshot the model into the Finding's projection.modelContext (the
      // canonical home — rSquaredAdj / scopeLabel / linkedFactor). This is a
      // model snapshot, not a What-If, so baseline == projected (no delta).
      const projection: FindingProjection = {
        baselineMean: 0,
        baselineSigma: 0,
        projectedMean: 0,
        projectedSigma: 0,
        meanDelta: 0,
        sigmaDelta: 0,
        simulationParams: { meanAdjustment: 0, variationReduction: 0, presetUsed: 'model-capture' },
        createdAt: new Date().toISOString(),
        modelContext: {
          linkedFactor: snapshot.topFactor ?? undefined,
          rSquaredAdj: snapshot.rSquaredAdj,
          scopeLabel: snapshot.scopeLabel,
        },
      };
      findingsState.setProjection(finding.id, projection);
    },
    [findingsState, activeScope]
  );
  const modelBuilderProps = useMemo<WallCanvasModelBuilderProps | undefined>(() => {
    if (!outcome || factors.length === 0) return undefined;
    // Single-value drill columns that are also factors are constant in scope.
    const constantFactors = categoricalFilters
      .filter(f => f.values.length === 1 && factors.includes(f.column))
      .map(f => f.column);
    const scopeLabel = activeScope ? formatConditionLeaves(activeScope.predicates) : 'All data';
    return {
      candidateFactors: factors,
      scopeLabel,
      // The band re-ranks on the ACTIVE scope (drilled subset), not rawData.
      scopeRows: filteredData,
      constantFactors,
      onCaptureModel: handleCaptureModel,
    };
  }, [outcome, factors, filteredData, categoricalFilters, activeScope, handleCaptureModel]);

  // ── FE-2a — one-tap evaluate of a hypothesis factor ──────────────────────
  // The PRODUCTION seam: run the real `evaluateHypothesisFactor` on the active
  // (scoped) data, write a typed Finding via the real `addFinding`, connect it
  // to the hub via the real `connectFinding`, then stamp the classification via
  // `setValidation`. NEVER auto-run — the analyst taps. One `data` evidence type
  // per evaluation (locked #2): we write exactly ONE finding regardless of the
  // factor's tool. A non-significant result classifies 'inconclusive' (NOT-tested),
  // never supporting (engine honesty — same rule as the IM-3 auto-link fix).
  const handleEvaluateFactor = useCallback(
    (hypothesisId: string, factor: string, options?: EvaluateFactorOptions) => {
      if (!outcome || !filteredData?.length) return;
      const tryToBreakIt = Boolean(options?.tryToBreakIt);
      // FE-2b — the fused "Try to break it" path INVERTS the classification under
      // the wrongness-prediction (significant → survived/supports; not-significant
      // → refuted/contradicts), graded by the SAME engine. The plain FE-2a path is
      // unchanged. The branches use distinct finding-text templates so a repeat tap
      // is idempotent per-mode (and the two modes never cross-match).
      const result = tryToBreakIt
        ? evaluateDisconfirmation(filteredData, factor, outcome)
        : evaluateHypothesisFactor(filteredData, factor, outcome);
      if (!result) return;
      const activeFilters = categoricalFiltersToActiveFilters(
        useAnalysisScopeStore.getState().categoricalFilters
      );
      const matchesPriorEvaluate = (text: string) =>
        tryToBreakIt
          ? isDisconfirmationFindingForFactor(text, factor)
          : isEvaluateFindingForFactor(text, factor);
      // FE-2a/2b idempotency: a repeat evaluate of the SAME (hypothesis × factor ×
      // mode) refreshes the existing finding instead of appending a duplicate.
      const hub = hypothesesState.hubs.find(h => h.id === hypothesisId);
      const existing = hub
        ? findingsState.findings.find(
            f => hub.findingIds.includes(f.id) && matchesPriorEvaluate(f.text)
          )
        : undefined;
      let findingId: string;
      if (existing) {
        findingsState.editFinding(existing.id, result.findingText);
        findingsState.setValidation(existing.id, result.validationStatus, result.refutes);
        findingId = existing.id;
      } else {
        const finding = findingsState.addFinding(
          result.findingText,
          {
            activeFilters,
            cumulativeScope: null,
          },
          undefined,
          activeScope?.id
        );
        // Classify BEFORE connecting so the finding is never read as an
        // unclassified "support" clue on the Wall in the interim.
        findingsState.setValidation(finding.id, result.validationStatus, result.refutes);
        hypothesesState.connectFinding(hypothesisId, finding.id);
        findingId = finding.id;
      }

      // FE-2b — record the engine-graded DisconfirmationAttempt with the finding
      // linked. This closes the `linkedFindingIds:[]` gap BY CONSTRUCTION (the
      // evaluate already made the finding) and reaches the SAME production
      // disconfirmation write-path (hypothesesState.recordDisconfirmation) the
      // legacy manual form uses. The app stamps id + attemptedAt + attemptedBy.
      if (tryToBreakIt) {
        const attempt: DisconfirmationAttempt = {
          id: generateDeterministicId(),
          attemptedAt: new Date().toISOString(),
          attemptedBy: {
            displayName: members.find(m => m.userId === userId)?.displayName ?? userId ?? 'Analyst',
            upn: userId ?? undefined,
          },
          description: (options?.prediction ?? result.findingText).trim(),
          // Engine-graded verdict carried straight off the disconfirmation result:
          // 'refuted' (the predicted relationship was absent on an adequately
          // powered sample), 'survived' (the cause withstood the attempt), OR
          // 'pending' (MAJOR-1 — a low-power null: too few rows to refute, so the
          // attempt stays open rather than falsely refute a real cause). Inside
          // this `tryToBreakIt` branch the result is always a
          // `DisconfirmationEvaluation` (it has `verdict`); guard for that shape.
          verdict: isDisconfirmationResult(result)
            ? result.verdict
            : result.refutes
              ? 'refuted'
              : 'survived',
          linkedFindingIds: [findingId],
        };
        hypothesesState.recordDisconfirmation(hypothesisId, attempt);
      }
    },
    [outcome, filteredData, findingsState, hypothesesState, members, userId, activeScope]
  );

  // ── IM-4b Task 5 — multi-scope rail ──────────────────────────────────────
  // Active (non-archived) scopes for the current investigation + outcome.
  const railScopes = useMemo(
    () => scopes.filter(s => s.investigationId === scopeInvestigationId && s.deletedAt === null),
    [scopes, scopeInvestigationId]
  );
  // Re-anchor: selecting a scope chip rewrites the drill filters to that scope's
  // compound WHERE (IM-4a's predicateSetKey-matched producer then re-selects the
  // scope, re-anchoring the Problem card). Reconstruct categoricalFilters from the
  // scope's eq-predicates, grouped by column.
  const handleScopeSelect = useCallback(
    (scopeId: string) => {
      const scope = scopes.find(s => s.id === scopeId);
      if (!scope) return;
      const byColumn = new Map<string, (string | number)[]>();
      for (const leaf of scope.predicates) {
        if (leaf.op !== 'eq') continue;
        const vals = byColumn.get(leaf.column) ?? [];
        vals.push(leaf.value as string | number);
        byColumn.set(leaf.column, vals);
      }
      const scopeStore = useAnalysisScopeStore.getState();
      scopeStore.clearScope();
      for (const [column, values] of byColumn) {
        scopeStore.setCategoricalValues(column, values);
      }
    },
    [scopes]
  );
  const handleScopeArchive = useCallback((scopeId: string) => {
    useAnalyzeStore.getState().archiveScope(scopeId);
  }, []);

  // ── IM-4b — enrich the base measurement-plan bag with the comment-thread,
  // ActionItem, and improvement-idea callbacks. Routes through `hypothesesState`
  // (the Wall's source of truth — updating it re-renders the Wall live; its
  // onHubsChange syncs useAnalyzeStore for the analyze blob). The author display
  // name resolves from the active members against `userId`.
  const wallAuthorName = useMemo(() => {
    if (!userId) return undefined;
    return members.find(m => m.userId === userId)?.displayName ?? userId;
  }, [members, userId]);
  const enrichedPlanningProps = useMemo<WallCanvasPlanningProps | undefined>(() => {
    if (!planningProps) return undefined;
    return {
      ...planningProps,
      // Task 1 — comment thread (parseMentions runs here; mentions ride the comment)
      onAddHubComment: (hubId: string, text: string) => {
        const mentionedUserIds = parseMentions(text, members);
        hypothesesState.addComment(hubId, text, wallAuthorName, mentionedUserIds);
      },
      onEditHubComment: (hubId: string, commentId: string, text: string) =>
        hypothesesState.editComment(hubId, commentId, text),
      onDeleteHubComment: (hubId: string, commentId: string) =>
        hypothesesState.deleteComment(hubId, commentId),
      showCommentAuthors: members.length > 0,
      // Task 3 — ActionItem tasks
      onAddHypothesisAction: (hypothesisId: string, text: string) =>
        hypothesesState.addAction(hypothesisId, text),
      onCompleteHypothesisAction: (hypothesisId: string, actionId: string) =>
        hypothesesState.completeAction(hypothesisId, actionId, Date.now()),
      // Task 6 — improvement ideas
      ideaImpacts: ideaImpacts ?? {},
      onProjectIdea,
      onAddIdea: (hypothesisId: string, text: string) =>
        hypothesesState.addIdea(hypothesisId, text),
      onUpdateIdea: (hypothesisId, ideaId, updates) =>
        hypothesesState.updateIdea(hypothesisId, ideaId, updates),
      onRemoveIdea: (hypothesisId: string, ideaId: string) =>
        hypothesesState.removeIdea(hypothesisId, ideaId),
      onSelectIdea: (hypothesisId: string, ideaId: string, selected: boolean) =>
        hypothesesState.selectIdea(hypothesisId, ideaId, selected),
      // FE-2a/2b — one-tap evaluate → typed Finding linked to the hub (+ the
      // fused disconfirmation verdict when "Try to break it" is checked).
      onEvaluateFactor: handleEvaluateFactor,
      // FE-2b — refute → respawn-sharper. Seeds H2 from the editable name and
      // carries the refutation FORWARD as SUPPORTING evidence for H2 (a fresh
      // supporting finding, so H1's red refuting finding stays intact). H1 stays
      // refuted, never archived.
      onRespawnSharper: (refutedHypothesisId: string, newName: string) => {
        const h1 = hypothesesState.hubs.find(h => h.id === refutedHypothesisId);
        const refuting = h1
          ? findingsState.findings.find(f => h1.findingIds.includes(f.id) && f.refutes)
          : undefined;
        const newHub = hypothesesState.createHub(newName, '');
        // FE-2b — the "superseded by →" anti-amnesia trail (spec §4.2): point the
        // red dead-end (H1) at its sharper successor (H2). The refuted card renders
        // "superseded by → [H2 name]" so the analyst doesn't re-walk the dead end.
        hypothesesState.updateHub(refutedHypothesisId, { supersededByHypothesisId: newHub.id });
        if (refuting) {
          // The finding that REFUTED H1 is positive evidence for the sharper H2.
          const carried = findingsState.addFinding(
            `Carried from the refutation of “${h1?.name ?? 'the prior hypothesis'}”: ${refuting.text}`,
            { activeFilters: refuting.context.activeFilters, cumulativeScope: null }
          );
          findingsState.setValidation(carried.id, 'supports', false);
          hypothesesState.connectFinding(newHub.id, carried.id);
        }
      },
      // FE-2b — confound: mark the opposite sign on a rival cause. Re-links the
      // shared finding to the rival as a counter-clue (counterFindingIds) and
      // classifies it 'contradicts' for the rival (the data picks the side; the
      // human confirms — §10 #1).
      onMarkConfoundOpposite: (rivalHypothesisId: string, findingId: string) => {
        const rival = hypothesesState.hubs.find(h => h.id === rivalHypothesisId);
        if (!rival) return;
        const existingCounter = rival.counterFindingIds ?? [];
        if (!existingCounter.includes(findingId)) {
          hypothesesState.updateHub(rivalHypothesisId, {
            counterFindingIds: [...existingCounter, findingId],
          });
        }
        if (!rival.findingIds.includes(findingId)) {
          hypothesesState.connectFinding(rivalHypothesisId, findingId);
        }
        findingsState.setValidation(findingId, 'contradicts', false);
      },
    };
  }, [
    planningProps,
    members,
    wallAuthorName,
    hypothesesState,
    findingsState,
    ideaImpacts,
    onProjectIdea,
    handleEvaluateFactor,
  ]);
  // Live Problem-card base values for the scoped subset (no longer hardcoded):
  // Cpk from the filtered-data stats, and the out-of-spec event COUNT as the
  // "events" proxy (no reliable weekly cadence in V1 — count of occurrences).
  const problemCpk = stats?.cpk ?? 0;
  const problemEvents = useMemo(() => {
    if (!stats || !filteredData?.length) return 0;
    return Math.round((stats.outOfSpecPercentage / 100) * filteredData.length);
  }, [stats, filteredData]);

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
  // PO-5: active-IP scope shows the whole document — the Wall renders every hub
  // and finding (the lineage-membership filter is retired; empty-set-means-
  // unfiltered is the permanent semantics).
  const hubs = hypothesesState.hubs;

  // PR-CS-6 Edge 4: resolve each finding's `originStepId` to its ProcessMap step
  // name (FindingCard stays pure). Suppressed silently for findings whose step no
  // longer resolves (non-durable across map re-derivation — ADR-087 caveat).
  const originStepNameByFindingId = useMemo(() => {
    const stepNameById = new Map(deriveProcessSteps(processMap).map(s => [s.id, s.name]));
    const out = new Map<string, string>();
    for (const f of findingsState.findings) {
      const name = f.originStepId ? stepNameById.get(f.originStepId) : undefined;
      if (name) out.set(f.id, name);
    }
    return out;
  }, [processMap, findingsState.findings]);

  // Phase 13 — pan-to-node: center the viewport on a hub by id. IM-4c: consumes
  // the SHARED computeWallLayout authority with the SAME inputs WallCanvas + the
  // Minimap use (incl. tributary grouping), so the pan target always lands on the
  // rendered card — no more linear-only duplicate that drifted under grouping.
  const handleWallPanToNode = useCallback(
    (nodeId: string) => {
      const layout = computeWallLayout(
        buildWallLayoutArgs({
          hubs,
          processMap,
          groupByTributary: Boolean(processMap && wallGroupByTributary),
          canvasW: CANVAS_W,
          canvasH: CANVAS_H,
        })
      );
      const pos = layout.hubPositions.get(nodeId);
      if (pos) {
        setWallPan(wallHubId, {
          x: CANVAS_W / 2 - pos.x,
          y: CANVAS_H / 2 - pos.y,
        });
      }
    },
    [hubs, processMap, wallGroupByTributary, wallHubId, setWallPan]
  );

  // PR-CS-5 Part 1 — focus-on-arrival pan. When a Process-tab hypothesis link
  // sets `focusedWallEntityId` (the visible Wall focus lens, ADR-086) and forces
  // the Wall view, off-screen targets make dim-only useless — so we center the
  // focused node on arrival. Reuses the SAME computeWallLayout pan-to-node path
  // the Minimap + command palette use, so the target always lands on the rendered
  // card. Gated on `wallViewMode === 'wall'` so we don't pan an invisible Wall.
  const focusedWallEntityId = useViewStore(s => s.focusedWallEntityId);
  useEffect(() => {
    if (wallViewMode !== 'wall') return;
    if (!focusedWallEntityId) return;
    handleWallPanToNode(focusedWallEntityId);
  }, [focusedWallEntityId, wallViewMode, handleWallPanToNode]);

  const handleReturnToImprovementProject = useCallback(() => {
    const target = returnNavigation.consumeReturnTarget();
    if (target?.sourceSurface === 'improvement-project') {
      usePanelsStore.getState().showCharter();
    }
  }, [returnNavigation]);

  const { hubEvidences, hubProjections } = useHubComputations(bestSubsets, findingsState.findings);

  // Detect evidence clusters for synthesis prompts
  const evidenceClusters = useMemo(
    () => detectEvidenceClusters(findingsState.findings, hubs),
    [findingsState.findings, hubs]
  );

  // Left panel resizable
  const leftPanel = useResizablePanel('variscout-analyze-left-width', 260, 420, 320, 'left');

  // Internal view mode (if not controlled)
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'board'>('board');
  const viewMode = externalViewMode ?? internalViewMode;
  const handleViewMode = onViewModeChange ?? setInternalViewMode;

  // PO-5: the conclusion-categorizer memo was gate-only ceremony — its
  // suspected/ruledOut buckets partition `hubs`, so the conclusion-panel gate
  // reduces to `hubs.length > 0`. AnalyzeConclusion renders all hubs flat
  // (per-hub STATUS_STYLES badges; no internal bucketing). The one canonical
  // status→bucket mapping now lives in core (`groupHypothesesByStatus`), keyed
  // by the Report engine.

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

  // IM-4c — "propose suspected mechanism from this finding". The Wall renders
  // `hypothesesState.hubs` (the useHypotheses hook is the source of truth), so we
  // create + connect through THAT hook — NOT analyzeStore.createHubFromFinding,
  // which appends to a different collection that does NOT re-render this Wall.
  // Mirrors handleCreateHub's create→connect path; name matches the store
  // factory's "Suspected mechanism: {excerpt}" convention.
  const handleProposeHypothesis = useCallback(
    (findingId: string) => {
      const finding = findingsState.findings.find(f => f.id === findingId);
      const excerpt = (finding?.text ?? '').trim().slice(0, 80);
      const name = excerpt.length > 0 ? `Suspected mechanism: ${excerpt}` : 'New mechanism branch';
      const hub = hypothesesState.createHub(name, '');
      hypothesesState.connectFinding(hub.id, findingId);
    },
    [findingsState.findings, hypothesesState]
  );

  // Wall empty-state entry points (investigations.md 2026-06-04 — the CTAs were
  // never wired on the destination mount; only the retired CanvasWallOverlay
  // passed them). Create directly + let the analyst rename on the card — the
  // same convention as handleProposeHypothesis.
  const handleWriteHypothesis = useCallback(() => {
    hypothesesState.createHub('New mechanism branch', '');
  }, [hypothesesState]);
  const handleSeedFromFactorIntel = useCallback(() => {
    for (const factor of factors.slice(0, 3)) {
      hypothesesState.createHub(`Suspected mechanism: ${factor}`, '');
    }
  }, [hypothesesState, factors]);

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
        { chart: 'boxplot', category: factor, timeLens: usePreferencesStore.getState().timeLens },
        activeScope?.id
      );
    },
    [findingsState, activeScope]
  );

  const handleMapAskCoScout = useCallback(
    (factor: string) => {
      aiOrch.handleAskCoScoutFromCategory({ category: { name: factor } });
    },
    [aiOrch]
  );

  // CS-13 — the crossing-back (spec §4.0a): from a Wall hypothesis/factor,
  // land in Explore scoped to its local y=f(x). Same primitive as the
  // Process-tab chips (FrameView.handleChipExploreJump).
  const handleExploreFactor = useCallback(
    (factor: string) => {
      navigateToExploreForChip(
        { kind: 'factor', columnName: factor, outcomeColumn: outcome ?? undefined },
        () => usePanelsStore.getState().showExplore()
      );
    },
    [outcome]
  );

  const handleMapDrillDown = useCallback(
    (factor: string) => {
      usePanelsStore.getState().setHighlightedFactor(factor);
      // CS-13 — route the Evidence-Map drill through the SAME scoped path as the
      // Wall affordances (the drill previously switched tabs WITHOUT writing the
      // scope the Explore charts read). Composing handleExploreFactor keeps the
      // two Analyze→Explore gestures structurally unable to diverge.
      handleExploreFactor(factor);
    },
    [handleExploreFactor]
  );

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
          {hubs.length > 0 && (
            <div className="border-t border-edge px-3 py-2 flex-shrink-0">
              <AnalyzeConclusion
                problemStatement={processContext?.problemStatement}
                hasConclusions={hubs.length > 0}
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
              {findingsState.findings.length} finding
              {findingsState.findings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          {analyzeViewMode === 'map' ? (
            wallViewMode === 'wall' ? (
              <div className="relative flex-1 flex flex-col min-h-0">
                {/* IM-4b Task 5 — multi-scope rail above the canvas. Selecting a
                    chip re-anchors the Problem card (rewrites the drill filters
                    → IM-4a's producer re-selects the scope). Hidden when no scopes
                    have been captured yet. */}
                {!wallIsMobile && railScopes.length > 0 && (
                  <div className="border-edge bg-surface-secondary/40 border-b px-3 py-2">
                    <ScopeRail
                      scopes={railScopes}
                      activeScopeId={activeScope?.id}
                      onScopeSelect={handleScopeSelect}
                      onScopeArchive={handleScopeArchive}
                    />
                  </div>
                )}
                <WallCanvas
                  hubId={wallHubId}
                  hubs={hubs}
                  findings={findingsState.findings}
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
                  planningProps={enrichedPlanningProps}
                  modelBuilderProps={modelBuilderProps}
                  onWriteHypothesis={handleWriteHypothesis}
                  onSeedFromFactorIntel={factors.length > 0 ? handleSeedFromFactorIntel : undefined}
                  onProposeHypothesis={handleProposeHypothesis}
                  onExploreFactor={handleExploreFactor}
                />
                {/* Minimap + CommandPalette are desktop-only. WallCanvas
                  self-gates to MobileCardList below 768px, so these
                  sibling controls would overlap the mobile list. */}
                {!wallIsMobile && (
                  <>
                    <div className="absolute bottom-4 right-4 pointer-events-auto">
                      <Minimap
                        hubs={hubs}
                        zoom={wallZoom}
                        pan={wallPan}
                        onPanTo={(x, y) => setWallPan(wallHubId, { x, y })}
                        processMap={processMap}
                        groupByTributary={Boolean(processMap && wallGroupByTributary)}
                      />
                    </div>
                    <CommandPalette
                      open={wallPaletteOpen}
                      onClose={() => setWallPaletteOpen(false)}
                      onPanTo={handleWallPanToNode}
                      hubs={hubs}
                      findings={findingsState.findings}
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
                  findings: findingsState.findings,
                  hypotheses: hubs,
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
                onPromoteAction={onPromoteFindingAction}
                originStepNameByFindingId={originStepNameByFindingId}
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
