/**
 * AnalyzeView - Hypothesis-driven investigation workspace for PWA
 *
 * Simplified version of Azure's AnalyzeWorkspace:
 * - Left panel: AnalyzePhaseBadge + AnalyzeConclusion (hub composer)
 * - Center: Map/Wall toggle → FindingsLog (list/board) | WallCanvas (hubs+findings)
 * - No CoScout (PWA has no AI)
 * - No Teams integration (no photos, no assignees)
 * - 3-status findings (not 5)
 *
 * IM-1 (ADR-085): the Question entity is retired. Suspected causes are
 * `Hypothesis` hubs; the Wall renders hubs + findings (no question column).
 */
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
  computeWallLayout,
  buildWallLayoutArgs,
  ActiveIPScopeRibbon,
  useWallKeyboard,
  useWallIsMobile,
} from '@variscout/ui';
import type { ActiveIPLineageIds, ActiveIPScopeLabels } from '@variscout/ui';
import { useResizablePanel, useReturnNavigation, type UseFindingsReturn } from '@variscout/hooks';
import type { WallCanvasPlanningProps, WallCanvasModelBuilderProps } from '@variscout/ui';
import type { CapturedModelSnapshot } from '@variscout/ui';
import {
  type FindingStatus,
  type Hypothesis,
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
import { detectInvestigationPhase } from '@variscout/core/ai';
import type { ResolvedMode } from '@variscout/core/strategy';
import { detectColumns } from '@variscout/core/parser';
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
  activeIPLineage?: ActiveIPLineageIds | null;
  canvasViewportHubId: ProcessHubId;
  // Data context
  filteredData: Record<string, unknown>[];
  outcome: string | null;
  factors: string[];
  // Findings
  findingsState: UseFindingsReturn;
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
  activeIPLineage,
  canvasViewportHubId,
  filteredData,
  factors,
  findingsState,
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
  const scopedHubIds = useMemo(
    () => new Set(activeIPLineage?.hypothesisIds ?? []),
    [activeIPLineage]
  );
  const scopedFindingIds = useMemo(
    () => new Set(activeIPLineage?.findingIds ?? []),
    [activeIPLineage]
  );
  const scopedWallHubs = useMemo(
    () => (activeIPScope ? hubs.filter(h => scopedHubIds.has(h.id)) : hubs),
    [activeIPScope, hubs, scopedHubIds]
  );
  const scopedWallFindings = useMemo(
    () => (activeIPScope ? wallFindings.filter(f => scopedFindingIds.has(f.id)) : wallFindings),
    [activeIPScope, scopedFindingIds, wallFindings]
  );

  // Investigation phase detection (deterministic, from findings)
  const analyzePhase = useMemo(
    () => detectInvestigationPhase(findingsState.findings),
    [findingsState.findings]
  );

  // Left panel resizable
  const leftPanel = useResizablePanel('variscout-pwa-analyze-left-width', 220, 400, 280, 'left');

  // View mode (list/board)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  // Phase 13 — ⌘K command palette trigger. Only active when Wall is visible.
  // Phase 14.1 — Minimap + palette gate on desktop only; MobileCardList
  // takes over below 768px and overlay controls would collide with it.
  const wallIsMobile = useWallIsMobile();
  const [paletteOpen, setPaletteOpen] = useState(false);
  useWallKeyboard({
    onSearch: () => {
      if (wallViewMode === 'wall' && !wallIsMobile) setPaletteOpen(true);
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
          hubs: scopedWallHubs,
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
    [scopedWallHubs, processMap, wallGroupByTributary, wallHubId, setWallPan]
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

  // IM-4c — "propose suspected mechanism from this finding". The PWA Wall reads
  // hubs from useAnalyzeStore.hypotheses REACTIVELY (line above), so
  // createHubFromFinding (which appends to that exact collection) re-renders the
  // Wall with the new hypothesis card. No follow-through sync needed.
  const handleProposeHypothesis = useCallback((findingId: string) => {
    useAnalyzeStore.getState().createHubFromFinding(findingId);
  }, []);

  // FE-2a — one-tap evaluate of a hypothesis factor (PRODUCTION seam). The PWA
  // Wall reads hubs + findings from `useAnalyzeStore` REACTIVELY, so the typed
  // Finding MUST be written there (not the separate `findingsState`) to render
  // as a clue + advance the hub via `deriveHypothesisStatus`. Run the real
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
  // FE-1 fix: write the captured-model Finding into `useAnalyzeStore` — the PWA
  // Wall's REACTIVE source of truth for findings (see `wallFindings` above) —
  // not the separate `findingsState` (useFindings) engine, which the Wall never
  // reads. Routing it here makes the captured model render on the PWA Wall as a
  // clue (parity with FE-2a's evaluate path). Azure stays on `findingsState`
  // because its Wall reads `findingsState`.
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

  // Categorize hypothesis hubs for AnalyzeConclusion (IM-1: status-derived,
  // replacing the retired Question causeRole split).
  const { hypotheses, contributing, ruledOut } = useMemo(() => {
    const suspected: Hypothesis[] = [];
    const contrib: Hypothesis[] = [];
    const ruled: Hypothesis[] = [];
    for (const h of scopedWallHubs) {
      if (h.status === 'refuted') ruled.push(h);
      else if (h.status === 'confirmed') suspected.push(h);
      else contrib.push(h);
    }
    return { hypotheses: suspected, contributing: contrib, ruledOut: ruled };
  }, [scopedWallHubs]);

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
        {/* Left panel: Question checklist + phase + conclusions */}
        <div
          className="relative hidden md:flex flex-col border-r border-edge overflow-hidden bg-surface flex-shrink-0"
          style={{ width: leftPanel.width }}
        >
          {/* Phase badge */}
          {analyzePhase && (
            <div className="px-3 pt-3 pb-1 flex-shrink-0">
              <AnalyzePhaseBadge phase={analyzePhase} />
            </div>
          )}

          {/* Investigation conclusion (IM-1: hub-driven, question checklist retired) */}
          {(hypotheses.length > 0 || ruledOut.length > 0 || contributing.length > 0) && (
            <div className="flex-1 overflow-y-auto border-t border-edge px-3 py-2">
              <AnalyzeConclusion
                hubs={scopedWallHubs}
                findings={scopedWallFindings}
                hasConclusions={hypotheses.length > 0 || scopedWallHubs.length > 0}
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

            {/* List/board sub-toggle (only in Map/Findings view) */}
            {wallViewMode === 'map' && (
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
              {scopedWallFindings.length} finding
              {scopedWallFindings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          {wallViewMode === 'wall' ? (
            <div className="relative flex-1 flex flex-col min-h-0">
              <WallCanvas
                hubId={wallHubId}
                hubs={scopedWallHubs}
                findings={scopedWallFindings}
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
                onProposeHypothesis={handleProposeHypothesis}
              />
              {/* Minimap + CommandPalette are desktop-only. WallCanvas
                self-gates to MobileCardList below 768px. */}
              {!wallIsMobile && (
                <>
                  <div className="absolute bottom-4 right-4 pointer-events-auto">
                    <Minimap
                      hubs={scopedWallHubs}
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
                    hubs={scopedWallHubs}
                    findings={scopedWallFindings}
                  />
                </>
              )}
            </div>
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
                onAddComment={(id: string, text: string) =>
                  findingsState.addFindingComment(id, text)
                }
                columnAliases={columnAliases}
                activeFindingId={highlightedFindingId}
                onAddAction={findingsState.addAction}
                onCompleteAction={findingsState.completeAction}
                onDeleteAction={findingsState.deleteAction}
                onPromoteAction={onPromoteFindingAction}
                onSetOutcome={findingsState.setOutcome}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzeView;
