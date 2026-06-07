/**
 * AnalyzeView - Hypothesis-driven investigation workspace for PWA
 *
 * Simplified version of Azure's AnalyzeWorkspace:
 * - Left panel: AnalyzeConclusion (hub composer)
 * - Center: Map/Wall toggle → FindingsLog (list/board) | WallCanvas (hubs+findings)
 * - No CoScout (PWA has no AI)
 * - No Teams integration (no photos, no assignees)
 * - 3-status findings (not 5)
 *
 * IM-1 (ADR-085): the Question entity is retired. Suspected causes are
 * `Hypothesis` hubs; the Wall renders hubs + findings (no question column).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnalyzeConclusion,
  FindingsLog,
  WallCanvas,
  navigateToExploreForChip,
  CommandPalette,
  Minimap,
  CANVAS_W,
  CANVAS_H,
  computeWallLayout,
  buildWallLayoutArgs,
  ActiveIPScopeRibbon,
  useWallKeyboard,
  useWallIsMobile,
} from '@variscout/ui';
import { EvidenceMap } from '@variscout/charts';
import { useEvidenceMapData } from '@variscout/hooks';
import {
  computeBestSubsets,
  computeMainEffects,
  computeInteractionEffects,
} from '@variscout/core/stats';
import type { ActiveIPScopeLabels } from '@variscout/ui';
import { useResizablePanel, useReturnNavigation } from '@variscout/hooks';
import type { WallCanvasPlanningProps, WallCanvasModelBuilderProps } from '@variscout/ui';
import type { CapturedModelSnapshot } from '@variscout/ui';
import {
  type FindingStatus,
  type FindingProjection,
  type DataRow,
  type DisconfirmationAttempt,
} from '@variscout/core';
import { generateDeterministicId } from '@variscout/core/identity';
import {
  evaluateHypothesisFactor,
  isEvaluateFindingForFactor,
  evaluateDisconfirmation,
  isDisconfirmationFindingForFactor,
  isDisconfirmationResult,
} from '@variscout/core/findings';
import type { EvaluateFactorOptions } from '@variscout/ui';
import type { ResolvedMode } from '@variscout/core/strategy';
import { detectColumns } from '@variscout/core/parser';
import { deriveProcessSteps } from '@variscout/core/frame';
import type { ColumnTypeMap } from '@variscout/core/findings';
import type { DrillStep } from '@variscout/hooks';
import { GripVertical } from 'lucide-react';
import {
  useCanvasViewportStore,
  useProjectStore,
  useAnalyzeStore,
  useViewStore,
} from '@variscout/stores';
import type { ProcessHubId } from '@variscout/core/processHub';
import { useFindingsStore } from '../../features/findings/findingsStore';
import { usePanelsStore } from '../../features/panels/panelsStore';

const DEFAULT_WALL_PAN = { x: 0, y: 0 };

interface AnalyzeViewProps {
  activeIPScope?: { title: string; labels: ActiveIPScopeLabels } | null;
  canvasViewportHubId: ProcessHubId;
  // Data context
  filteredData: Record<string, unknown>[];
  outcome: string | null;
  factors: string[];
  handleRestoreFinding: (id: string) => void;
  handleSetFindingStatus: (id: string, status: FindingStatus) => void;
  /**
   * PR-CS-6 Edge 1: COPY a finding-level action into the active project's action
   * tracker. Provided only when an active IP exists; FindingCard hides the
   * promote button once the source action carries `parentImprovementProjectId`.
   */
  onPromoteFindingAction?: (findingId: string, actionId: string) => void;
  drillPath: DrillStep[];
  // Column aliases
  columnAliases: Record<string, string>;
  // Strategy
  resolvedMode: ResolvedMode;
  /**
   * Optional measurement-plan affordances threaded into WallCanvas.
   * When provided, hub cards render HypothesisCardWithPlans.
   * When omitted (default), hub cards render bare HypothesisCard.
   */
  planningProps?: WallCanvasPlanningProps;
}

const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  activeIPScope,
  canvasViewportHubId,
  filteredData,
  factors,
  handleRestoreFinding,
  handleSetFindingStatus,
  onPromoteFindingAction,
  drillPath: _drillPath,
  columnAliases,
  resolvedMode: _resolvedMode,
  planningProps,
}) => {
  const highlightedFindingId = useFindingsStore(s => s.highlightedFindingId);

  // Map/Wall sub-toggle (mirrors Azure AnalyzeWorkspace)
  const wallViewMode = useCanvasViewportStore(s => s.viewMode);
  const setWallViewMode = useCanvasViewportStore(s => s.setViewMode);
  // Phase 13 scale features — thread store values into WallCanvas so zoom,
  // pan, and tributary clustering survive re-renders and route through the
  // existing undo/persist infrastructure.
  const wallHubId = canvasViewportHubId;
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
  const processMap = useProjectStore(s => s.processContext?.processMap);
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const specs = useProjectStore(s => s.specs);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  // Per-outcome spec limits for the per-hypothesis What-If projection (FE-2a §5).
  const wallScopeSpecs = useMemo(
    () => (outcome ? (measureSpecs[outcome] ?? specs) : undefined),
    [measureSpecs, outcome, specs]
  );
  // Undefined when no rows are loaded so WallCanvas keeps the missing-column
  // badge suppressed (rather than flagging every hub against an empty set).
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
  const hubs = useAnalyzeStore(s => s.hypotheses);
  const wallFindings = useAnalyzeStore(s => s.findings);
  const hasAppliedFindingsArrivalRef = useRef(false);
  useEffect(() => {
    if (hasAppliedFindingsArrivalRef.current) return;
    if (hubs.length === 0 && wallFindings.length > 0) {
      setWallViewMode('wall');
      hasAppliedFindingsArrivalRef.current = true;
    }
  }, [hubs.length, setWallViewMode, wallFindings.length]);
  // PO-5: active-IP scope shows the whole document — the Wall renders every hub
  // and finding (the lineage-membership filter is retired; empty-set-means-
  // unfiltered is the permanent semantics).

  // PR-CS-6 Edge 4: resolve each finding's `originStepId` to its ProcessMap step
  // name (FindingCard stays pure). Suppressed silently for findings whose step no
  // longer resolves (non-durable across map re-derivation — ADR-087 caveat).
  const originStepNameByFindingId = useMemo(() => {
    const stepNameById = new Map(deriveProcessSteps(processMap).map(s => [s.id, s.name]));
    const out = new Map<string, string>();
    for (const f of wallFindings) {
      const name = f.originStepId ? stepNameById.get(f.originStepId) : undefined;
      if (name) out.set(f.id, name);
    }
    return out;
  }, [processMap, wallFindings]);

  // Investigation phase detection (deterministic, from findings)
  // Left panel resizable
  const leftPanel = useResizablePanel('variscout-pwa-analyze-left-width', 220, 400, 280, 'left');

  // View mode (list/board) for the findings list.
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  // PR-CS-7 (parity): the Map view hosts two content panes — the findings list
  // and the Evidence Map (Layer 1 statistical constellation). The findings list
  // stays reachable; this switch only governs the Map-view body.
  const [mapContent, setMapContent] = useState<'findings' | 'evidence-map'>('findings');

  // ── PR-CS-7: Evidence Map (Layer 1) inputs computed locally ──────────────
  // Mirrors MobileDashboard: best-subsets / main-effects / interactions over the
  // scoped data. Layer 1 always renders (gated on a meaningful model). Layers 2/3
  // SELF-SUPPRESS because we never pass causalLinks / hypotheses to the hook, so
  // `causalEdges` / `convergencePoints` come back empty — the data-presence gate
  // (charts/CLAUDE.md), not a tier flag.
  const hasFactorIntelligence = factors.length >= 2 && !!outcome && filteredData.length > 0;
  const mapRows = filteredData as unknown as DataRow[];
  const bestSubsets = useMemo(
    () => (hasFactorIntelligence ? computeBestSubsets(mapRows, outcome!, factors) : null),
    [hasFactorIntelligence, mapRows, outcome, factors]
  );
  const mainEffects = useMemo(
    () => (hasFactorIntelligence ? computeMainEffects(mapRows, outcome!, factors) : null),
    [hasFactorIntelligence, mapRows, outcome, factors]
  );
  const interactionEffects = useMemo(
    () => (hasFactorIntelligence ? computeInteractionEffects(mapRows, outcome!, factors) : null),
    [hasFactorIntelligence, mapRows, outcome, factors]
  );
  const bestModel = bestSubsets?.subsets[0];
  const showEvidenceMap = !!bestModel && bestModel.rSquaredAdj > 0.05;
  const evidenceMapData = useEvidenceMapData({
    bestSubsets: showEvidenceMap ? bestSubsets : null,
    mainEffects: showEvidenceMap ? mainEffects : null,
    interactions: showEvidenceMap ? interactionEffects : null,
    // Layout positions are computed at a reference size; the responsive wrapper +
    // zoom transform in EvidenceMap handle actual viewport fitting (mirrors
    // MobileDashboard). NO causalLinks / hypotheses → Layers 2/3 self-suppress.
    containerSize: { width: 600, height: 400 },
    mode: 'standard',
  });
  // When the Evidence Map has nothing to show (no model), fall back to the
  // findings list so the Map view never renders an empty graph pane.
  const mapContentResolved =
    mapContent === 'evidence-map' && showEvidenceMap ? 'evidence-map' : 'findings';
  const isDark = useRef(
    typeof window !== 'undefined' && window.localStorage.getItem('variscout_theme') === 'dark'
  ).current;

  // Phase 13 — ⌘K command palette trigger. Only active when Wall is visible.
  // Phase 14.1 — Minimap + palette gate on desktop only; MobileCardList
  // takes over below 768px and overlay controls would collide with it.
  const wallIsMobile = useWallIsMobile();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const fitWallToContent = useCallback(() => {
    useCanvasViewportStore.getState().fitToContent(wallHubId, 'l2', {
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  }, [wallHubId]);
  useWallKeyboard({
    onSearch: () => {
      if (wallViewMode === 'wall' && !wallIsMobile) setPaletteOpen(true);
    },
    onFit: () => {
      if (wallViewMode === 'wall' && !wallIsMobile) fitWallToContent();
    },
  });

  // Phase 13 — resolve a CommandPalette result id to a canvas-space pan target.
  // IM-4c: consumes the SHARED computeWallLayout authority with the SAME inputs
  // WallCanvas + the Minimap use (incl. tributary grouping), so the pan target
  // always lands on the rendered card — no recomputed duplicate.
  const handlePanToNode = useCallback(
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
  // focused node on arrival, reusing the SAME computeWallLayout pan-to-node path
  // the Minimap + command palette use. Gated on `wallViewMode === 'wall'`.
  const focusedWallEntityId = useViewStore(s => s.focusedWallEntityId);
  useEffect(() => {
    if (wallViewMode !== 'wall') return;
    if (!focusedWallEntityId) return;
    handlePanToNode(focusedWallEntityId);
  }, [focusedWallEntityId, wallViewMode, handlePanToNode]);

  const handleReturnToImprovementProject = useCallback(() => {
    const target = returnNavigation.consumeReturnTarget();
    if (target?.sourceSurface === 'improvement-project') {
      usePanelsStore.getState().showCharter();
    }
  }, [returnNavigation]);

  // FSJ-8 — finding promotion requires a plain-language hypothesis name before
  // creating the hub. The PWA Wall reads useAnalyzeStore.hypotheses reactively,
  // so create + connect through that same collection.
  const handleProposeHypothesis = useCallback((findingId: string, name: string) => {
    const store = useAnalyzeStore.getState();
    const hub = store.createHub(name, '');
    store.connectFindingToHub(hub.id, findingId);
  }, []);

  // CS-13 — the crossing-back (spec §4.0a). PWA parity note: the scope lands in
  // analysisScopeStore + the chrome chip; the PWA Explore chart mirror is the
  // deferred lv1-pwa-mount follow-up (matches the existing chip path).
  const handleExploreFactor = useCallback(
    (factor: string) => {
      navigateToExploreForChip(
        { kind: 'factor', columnName: factor, outcomeColumn: outcome ?? undefined },
        () => usePanelsStore.getState().showExplore()
      );
    },
    [outcome]
  );

  // Wall empty-state entry points (investigations.md 2026-06-04 — the CTAs were
  // never wired on the destination mount; only the retired CanvasWallOverlay
  // passed them). Create directly + let the analyst rename on the card — the
  // same convention as handleProposeHypothesis.
  const handleWriteHypothesis = useCallback(() => {
    useAnalyzeStore.getState().createHub('New suspected cause', '');
  }, []);
  const handleSeedFromFactorIntel = useCallback(() => {
    const store = useAnalyzeStore.getState();
    for (const factor of factors.slice(0, 3)) {
      store.createHub(`Suspected cause: ${factor}`, '');
    }
  }, [factors]);

  // FE-2a — one-tap evaluate of a hypothesis factor (PRODUCTION seam). The PWA
  // Wall reads hubs + findings from `useAnalyzeStore` REACTIVELY, so the typed
  // Finding MUST be written there to render as a clue + advance the hub via
  // `deriveHypothesisStatus`. Run the real
  // engine on the active (scoped) data, write ONE typed Finding, classify it,
  // then connect it. NEVER auto-run. A non-significant result → 'inconclusive'
  // (NOT-tested), never supporting.
  const handleEvaluateFactor = useCallback(
    (hypothesisId: string, factor: string, options?: EvaluateFactorOptions) => {
      if (!outcome || filteredData.length === 0) return;
      const tryToBreakIt = Boolean(options?.tryToBreakIt);
      // `filteredData` is the looser app-level `Record<string, unknown>[]`; the
      // core engine reads (never mutates) the constrained `DataRow` cells. Cast
      // to match the engine signature (mirrors the Wall's IM-5 cast).
      const rows = filteredData as unknown as DataRow[];
      // FE-2b — the fused "Try to break it" path INVERTS the classification under
      // the wrongness-prediction (significant → survived/supports; not-significant
      // → refuted/contradicts), graded by the SAME engine. The plain FE-2a path is
      // unchanged.
      const result = tryToBreakIt
        ? evaluateDisconfirmation(rows, factor, outcome)
        : evaluateHypothesisFactor(rows, factor, outcome);
      if (!result) return;
      const store = useAnalyzeStore.getState();
      const matchesPriorEvaluate = (text: string) =>
        tryToBreakIt
          ? isDisconfirmationFindingForFactor(text, factor)
          : isEvaluateFindingForFactor(text, factor);
      // FE-2a/2b idempotency: a repeat evaluate of the SAME (hypothesis × factor ×
      // mode) refreshes the existing finding instead of appending a duplicate.
      const hub = store.hypotheses.find(h => h.id === hypothesisId);
      const existing = hub
        ? store.findings.find(f => hub.findingIds.includes(f.id) && matchesPriorEvaluate(f.text))
        : undefined;
      let findingId: string;
      if (existing) {
        store.editFinding(existing.id, result.findingText);
        store.setFindingValidation(existing.id, result.validationStatus, result.refutes);
        findingId = existing.id;
      } else {
        const finding = store.addFinding(result.findingText, {
          activeFilters: {},
          cumulativeScope: null,
        });
        // Classify BEFORE connecting so the finding is never read as an
        // unclassified "support" clue on the Wall in the interim.
        store.setFindingValidation(finding.id, result.validationStatus, result.refutes);
        store.connectFindingToHub(hypothesisId, finding.id);
        findingId = finding.id;
      }

      // FE-2b — record the engine-graded DisconfirmationAttempt with the finding
      // linked (closes the `linkedFindingIds:[]` gap BY CONSTRUCTION). Reaches the
      // SAME production write-path (store.recordDisconfirmation) the legacy manual
      // form uses. The app stamps id + attemptedAt + attemptedBy.
      if (tryToBreakIt) {
        const attempt: DisconfirmationAttempt = {
          id: generateDeterministicId(),
          attemptedAt: new Date().toISOString(),
          attemptedBy: { displayName: 'Local browser', upn: 'analyst@local' },
          description: (options?.prediction ?? result.findingText).trim(),
          // Engine-graded verdict carried straight off the disconfirmation result:
          // 'refuted' (relationship absent, adequate power), 'survived' (cause
          // withstood the attempt), OR 'pending' (MAJOR-1 — a low-power null: too
          // few rows to refute, so the attempt stays open rather than falsely
          // refute a real cause). Inside this `tryToBreakIt` branch the result is
          // always a `DisconfirmationEvaluation`; guard for that shape.
          verdict: isDisconfirmationResult(result)
            ? result.verdict
            : result.refutes
              ? 'refuted'
              : 'survived',
          linkedFindingIds: [findingId],
        };
        store.recordDisconfirmation(hypothesisId, attempt);
      }
    },
    [outcome, filteredData]
  );

  // Enrich the parent's planningProps bag with the FE-2a/2b evaluate callback +
  // the FE-2b respawn/confound actions so the triad is wired through the
  // production path (useAnalyzeStore is the PWA Wall's reactive source of truth).
  const enrichedPlanningProps = useMemo<WallCanvasPlanningProps | undefined>(() => {
    if (!planningProps) return undefined;
    return {
      ...planningProps,
      onEvaluateFactor: handleEvaluateFactor,
      // FE-2b — refute → respawn-sharper. Seeds H2 + carries the refutation
      // forward as SUPPORTING evidence (a fresh supporting finding so H1's red
      // refuting finding stays intact). H1 stays refuted, never archived.
      onRespawnSharper: (refutedHypothesisId: string, newName: string) => {
        const store = useAnalyzeStore.getState();
        const h1 = store.hypotheses.find(h => h.id === refutedHypothesisId);
        const refuting = h1
          ? store.findings.find(f => h1.findingIds.includes(f.id) && f.refutes)
          : undefined;
        const newHub = store.createHub(newName, '');
        // FE-2b — the "superseded by →" anti-amnesia trail (spec §4.2): point the
        // red dead-end (H1) at its sharper successor (H2) so the refuted card can
        // render "superseded by → [H2 name]" and the analyst doesn't re-walk it.
        store.updateHub(refutedHypothesisId, { supersededByHypothesisId: newHub.id });
        if (refuting) {
          const carried = store.addFinding(
            `Carried from the refutation of “${h1?.name ?? 'the prior hypothesis'}”: ${refuting.text}`,
            { activeFilters: {}, cumulativeScope: null }
          );
          store.setFindingValidation(carried.id, 'supports', false);
          store.connectFindingToHub(newHub.id, carried.id);
        }
      },
      // FE-2b — confound: mark the opposite sign on a rival cause (counter-clue).
      onMarkConfoundOpposite: (rivalHypothesisId: string, findingId: string) => {
        const store = useAnalyzeStore.getState();
        const rival = store.hypotheses.find(h => h.id === rivalHypothesisId);
        if (!rival) return;
        const existingCounter = rival.counterFindingIds ?? [];
        if (!existingCounter.includes(findingId)) {
          store.updateHub(rivalHypothesisId, {
            counterFindingIds: [...existingCounter, findingId],
          });
        }
        if (!rival.findingIds.includes(findingId)) {
          store.connectFindingToHub(rivalHypothesisId, findingId);
        }
        store.setFindingValidation(findingId, 'contradicts', false);
      },
    };
  }, [planningProps, handleEvaluateFactor]);

  // ── FE-1 — scope-level vital-few model-builder band ──────────────────────
  // The PWA scope = the active-IP filtered data; factors are the candidates.
  // Capture-as-Finding stamps the model snapshot into the Finding's
  // projection.modelContext (rSquaredAdj / scopeLabel / linkedFactor).
  //
  // FE-1 fix: write the captured-model Finding into `useAnalyzeStore` — the single
  // source of truth for findings in both PWA and Azure (PO-6 §4.4 unification).
  // Routing it here makes the captured model render on the PWA Wall as a clue
  // (parity with FE-2a's evaluate path).
  const handleCaptureModel = useCallback((snapshot: CapturedModelSnapshot) => {
    const r2adjLabel = Number.isFinite(snapshot.rSquaredAdj)
      ? snapshot.rSquaredAdj.toFixed(2)
      : '—';
    const store = useAnalyzeStore.getState();
    const finding = store.addFinding(
      `Model: ${snapshot.factors.join(', ')} accounts for the spread (R²adj ${r2adjLabel}) in ${snapshot.scopeLabel}`,
      { activeFilters: {}, cumulativeScope: null }
    );
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
    store.setFindingProjection(finding.id, projection);
  }, []);
  const modelBuilderProps = useMemo<WallCanvasModelBuilderProps | undefined>(() => {
    if (!outcome || factors.length === 0) return undefined;
    // Parity with Azure's drilled-constant chipping: the PWA does not surface
    // `categoricalFilters` here, but `filteredData` is already the drilled subset
    // — a candidate factor that is single-valued across that subset IS constant
    // in scope (the data realization of Azure's "drilled to one value" rule).
    const constantFactors =
      filteredData.length > 0
        ? factors.filter(f => {
            let seen: unknown;
            let multi = false;
            for (const row of filteredData) {
              const v = row[f];
              if (seen === undefined) seen = v;
              else if (v !== seen) {
                multi = true;
                break;
              }
            }
            return !multi && seen !== undefined;
          })
        : [];
    return {
      candidateFactors: factors,
      scopeLabel: activeIPScope?.title ?? 'All data',
      scopeRows: filteredData,
      constantFactors,
      onCaptureModel: handleCaptureModel,
    };
  }, [outcome, factors, filteredData, activeIPScope, handleCaptureModel]);

  // PO-5: the conclusion-categorizer memo was gate-only ceremony — its
  // suspected/contributing/ruledOut buckets partition `hubs`, so the conclusion-
  // panel gate reduces to `hubs.length > 0`. AnalyzeConclusion renders all hubs
  // flat (per-hub STATUS_STYLES badges; no internal bucketing). The one canonical
  // status→bucket mapping now lives in core (`groupHypothesesByStatus`).

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
        {/* Left panel: conclusions */}
        <div
          className="relative hidden md:flex flex-col border-r border-edge overflow-hidden bg-surface flex-shrink-0"
          style={{ width: leftPanel.width }}
        >
          {/* Investigation conclusion (IM-1: hub-driven, question checklist retired) */}
          {hubs.length > 0 && (
            <div className="flex-1 overflow-y-auto border-t border-edge px-3 py-2">
              <AnalyzeConclusion
                hubs={hubs}
                findings={wallFindings}
                hasConclusions={hubs.length > 0}
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

        {/* Center: Map/Wall toggle + content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Header toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-edge bg-surface flex-shrink-0">
            {/* Map/Wall primary toggle */}
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

            {/* Map-view content switch: Findings list vs Evidence Map (Layer 1).
                PR-CS-7 parity — the findings list stays reachable; the Evidence
                Map button is disabled until best-subsets has a meaningful model. */}
            {wallViewMode === 'map' && (
              <>
                <div className="w-px h-4 bg-edge mx-1" />
                <div
                  role="group"
                  aria-label="Map content"
                  className="inline-flex items-center gap-0.5 rounded border border-edge p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={mapContentResolved === 'findings'}
                    onClick={() => setMapContent('findings')}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      mapContentResolved === 'findings'
                        ? 'bg-surface-secondary text-content'
                        : 'text-content-secondary hover:text-content'
                    }`}
                  >
                    Findings
                  </button>
                  <button
                    type="button"
                    aria-pressed={mapContentResolved === 'evidence-map'}
                    disabled={!showEvidenceMap}
                    onClick={() => setMapContent('evidence-map')}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      mapContentResolved === 'evidence-map'
                        ? 'bg-surface-secondary text-content'
                        : 'text-content-secondary hover:text-content disabled:opacity-40 disabled:hover:text-content-secondary'
                    }`}
                    title={
                      showEvidenceMap
                        ? undefined
                        : 'Select 2+ factors with a meaningful model to see the Evidence Map'
                    }
                  >
                    Evidence Map
                  </button>
                </div>
              </>
            )}

            {/* List/board sub-toggle (only in the Map/Findings list pane) */}
            {wallViewMode === 'map' && mapContentResolved === 'findings' && (
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
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </>
            )}

            {/* Wall-only: group-by-tributary toggle */}
            {wallViewMode === 'wall' && processMap && (
              <>
                <div className="w-px h-4 bg-edge mx-1" />
                <button
                  type="button"
                  aria-pressed={wallGroupByTributary}
                  onClick={() => setWallGroupByTributary(wallHubId, !wallGroupByTributary)}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                    wallGroupByTributary
                      ? 'bg-surface-secondary text-content'
                      : 'text-content-secondary hover:text-content'
                  }`}
                >
                  Group by tributary
                </button>
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

            <span className="ml-auto text-xs text-content-tertiary">
              {wallFindings.length} finding
              {wallFindings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          {wallViewMode === 'wall' ? (
            <div className="relative flex-1 flex flex-col min-h-0">
              <WallCanvas
                hubId={wallHubId}
                hubs={hubs}
                findings={wallFindings}
                processMap={processMap}
                problemCpk={0}
                eventsPerWeek={0}
                activeScopeSpecs={wallScopeSpecs}
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
                self-gates to MobileCardList below 768px. */}
              {!wallIsMobile && (
                <>
                  <button
                    type="button"
                    onClick={fitWallToContent}
                    aria-label="Fit Wall to content"
                    title="Fit Wall to content"
                    className="border-edge bg-surface-secondary text-content hover:bg-surface-tertiary focus:ring-ring absolute bottom-4 right-40 rounded border px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-2"
                  >
                    ⌖ Fit
                  </button>
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
                    open={paletteOpen}
                    onClose={() => setPaletteOpen(false)}
                    onPanTo={handlePanToNode}
                    hubs={hubs}
                    findings={wallFindings}
                  />
                </>
              )}
            </div>
          ) : mapContentResolved === 'evidence-map' ? (
            // PR-CS-7 (parity): the Evidence Map graph (Layer 1 statistical
            // constellation). The responsive `EvidenceMap` wrapper auto-sizes via
            // withParentSize; the host fills the pane. Layers 2/3 self-suppress
            // (no causal/convergence data passed to the hook).
            <div className="flex-1 min-h-0" data-testid="analyze-evidence-map">
              <EvidenceMap
                outcomeNode={evidenceMapData.outcomeNode}
                factorNodes={evidenceMapData.factorNodes}
                relationshipEdges={evidenceMapData.relationshipEdges}
                equation={evidenceMapData.equation}
                enableZoom={true}
                isDark={isDark}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <FindingsLog
                findings={wallFindings}
                onEditFinding={useAnalyzeStore.getState().editFinding}
                onDeleteFinding={useAnalyzeStore.getState().deleteFinding}
                onRestoreFinding={handleRestoreFinding}
                viewMode={viewMode}
                onSetFindingStatus={handleSetFindingStatus}
                onSetFindingTag={useAnalyzeStore.getState().setFindingTag}
                onSetFindingEvidenceType={useAnalyzeStore.getState().editFindingEvidenceType}
                onAddComment={(id: string, text: string) => {
                  // wrapper: the attachment param (Azure-only) is intentionally dropped in PWA
                  useAnalyzeStore.getState().addFindingComment(id, text);
                }}
                columnAliases={columnAliases}
                activeFindingId={highlightedFindingId}
                onAddAction={(id: string, text: string) => {
                  useAnalyzeStore.getState().addFindingAction(id, text);
                }}
                onCompleteAction={useAnalyzeStore.getState().completeFindingAction}
                onDeleteAction={useAnalyzeStore.getState().deleteFindingAction}
                onPromoteAction={onPromoteFindingAction}
                originStepNameByFindingId={originStepNameByFindingId}
                onSetOutcome={useAnalyzeStore.getState().setFindingOutcome}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzeView;
