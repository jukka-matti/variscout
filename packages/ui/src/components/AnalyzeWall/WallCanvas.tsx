/**
 * WallCanvas — Top-level composition component for the Investigation Wall.
 *
 * Assembles ProblemConditionCard (top), Mechanism Branch cards (middle row),
 * TributaryFooter (bottom), and MissingEvidencePanel (rule-driven HTML panel
 * below the SVG canvas).
 *
 * Renders hubs + findings only (Question entity retired — IM-1; the bipartite
 * hub↔finding re-layout is IM-4). Renders EmptyState when no hubs exist.
 */

import React, { useMemo, useRef } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useCanvasViewportInput } from '@variscout/hooks';
import type { ProcessHubId } from '@variscout/core/processHub';
import type {
  Hypothesis,
  Finding,
  ProcessMap,
  GateNode,
  GatePath,
  ProblemStatementScope,
} from '@variscout/core';
import type { DataRow } from '@variscout/core';
import type { ColumnTypeMap, ConditionLeaf } from '@variscout/core/findings';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';
import {
  conditionHasMissingColumn,
  conditionReferencesStep,
  formatConditionLeaves,
  projectMechanismBranch,
  runAndCheck,
} from '@variscout/core';
import { computeScopeWhatIfProjection, computeConditionCoverage } from '@variscout/core/variation';
import { deriveProcessSteps } from '@variscout/core/frame';
import { getMessage } from '@variscout/core/i18n';
import { surveyWallRules, deriveHypothesisStatus } from '@variscout/core/survey';
import { chartColors } from '@variscout/charts';
import { ProblemConditionCard } from './ProblemConditionCard';
import { GateBadge } from './GateBadge';
import { FindingChip } from './FindingChip';
import { HypothesisCard } from './HypothesisCard';
import { HypothesisCardWithPlans } from './HypothesisCardWithPlans';
import { DraggableHypothesisCard } from './DraggableHypothesisCard';
import { TributaryFooter } from './TributaryFooter';
import { EmptyState } from './EmptyState';
import { MissingEvidencePanel } from './MissingEvidencePanel';
import { MobileCardList } from './MobileCardList';
import { useWallLocale } from './hooks/useWallLocale';
import { useWallDragDrop } from './hooks/useWallDragDrop';
import { useWallIsMobile } from './hooks/useWallBreakpoint';

/**
 * Measurement-plan affordances threaded into WallCanvas as a single bag.
 * Using a bag rather than individual props keeps WallCanvasProps under
 * the 20-prop threshold at which the interface becomes unwieldy.
 */
export interface WallCanvasPlanningProps {
  /** All measurement plans for the active investigation (across all hypotheses). */
  plans: MeasurementPlan[];
  /** Project members for ACL checks and owner name resolution. */
  members: ReadonlyArray<ProjectMember>;
  /**
   * Current user's userId. Matches ProjectMember.userId.
   * Pass null when unauthenticated.
   */
  currentUserId: string | null;
  /**
   * Called when the user saves a new plan.
   * Caller stamps id (generateDeterministicId) + timestamps + dispatches MEASUREMENT_PLAN_ADD.
   */
  onAddPlan: (plan: Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'>) => void;
  /**
   * Called once per finding the user chose to link.
   * Caller dispatches MEASUREMENT_PLAN_LINK_FINDING per call.
   */
  onLinkFinding: (planId: string, findingId: string) => void;
  /**
   * Called when user clicks the edit affordance on a chip.
   * V1 pass-through — caller decides behaviour.
   */
  onEditPlan: (planId: string) => void;
  /**
   * Active drill-chip scope conditions passed to AddPlanForm as `defaultScope`.
   * Derived from `analysisScopeStore.categoricalFilters` via
   * `buildConditionFromCategoricalFilters` at the app call site.
   * Pass `undefined` when the app call site cannot source it cheaply;
   * AddPlanForm defaults to `[]`.
   */
  defaultScope?: ConditionLeaf[];
  /**
   * Project/hypothesis outcome pre-fill for AddPlanForm's outcome field.
   * Pass `undefined` when not readily available; form defaults to `''`.
   */
  defaultOutcome?: string;
  /**
   * IM-4a — record a falsification attempt on a hypothesis. When provided AND
   * the user has edit-contributions access, each card shows the disconfirmation
   * gesture. The app stamps id + timestamps + attemptedBy and dispatches
   * HYPOTHESIS_RECORD_DISCONFIRMATION. Omit to hide the gesture.
   */
  onRecordDisconfirmation?: (
    hypothesisId: string,
    input: { description: string; verdict: 'pending' | 'survived' | 'refuted' }
  ) => void;
}

export interface WallCanvasProps {
  hubId?: ProcessHubId;
  hubs: Hypothesis[];
  findings: Finding[];
  processMap?: ProcessMap;
  problemCpk: number;
  eventsPerWeek: number;
  problemContributionTree?: GateNode;
  /**
   * The active `ProblemStatementScope` (the compound WHERE the analyst drilled
   * into). When provided, the Problem-condition card renders as the SCOPE
   * ANCHOR (IM-4a): the compound condition text, the HOLDS N/M gate (the
   * scope's `gateNode` evaluated over `rows` via `runAndCheck`), and the IM-5
   * What-If projected Cpk + coverage %. Omit for the legacy global render.
   */
  activeScope?: ProblemStatementScope;
  /**
   * Spec limits for the active scope's outcome — required by
   * `computeScopeWhatIfProjection` to project the if-fixed Cpk. Pass `undefined`
   * when no specs are set; the What-If row is then omitted.
   */
  activeScopeSpecs?: { usl?: number; lsl?: number };
  /**
   * Column keys present in the active dataset. When provided, each hub whose
   * `condition` references a column absent from this set renders a
   * missing-column warning badge on its card.
   */
  activeColumns?: ReadonlyArray<string>;
  onSelectHub?: (id: string) => void;
  onWriteHypothesis?: () => void;
  onSeedFromFactorIntel?: () => void;
  onFocusHubFromGap?: (id: string) => void;
  /**
   * When provided, enables drag-drop gate composition. Hubs become draggable
   * sources; gate badges become drop targets. Fired on a valid hub→gate
   * drop — callers should wire this to `analyzeStore.composeGate`.
   * When omitted, drag-drop is disabled (the branch card renders without a
   * draggable wrapper, avoiding unused DndContext overhead).
   */
  onComposeGate?: (payload: { hubId: string; gatePath: GatePath }) => void;
  /**
   * View-level zoom factor applied as `scale(zoom)` on the content group.
   * Defaults to 1.0 (identity). Apps thread this from the active Hub's canvas viewport.
   * Values typically in [0.2, 3.0]; consumers should clamp before setting.
   */
  zoom?: number;
  /**
   * View-level pan offset applied as `translate(pan.x, pan.y)` on the content
   * group. Defaults to origin. Apps thread this from the active Hub's canvas viewport.
   */
  pan?: { x: number; y: number };
  /**
   * When true and a process map exists, hubs are grouped by their first
   * matching tributary (intersect `hub.tributaryIds` with
   * `processMap.tributaries[].id`). Each non-empty
   * group renders inside a dashed-outline `<g data-tributary-group>` frame
   * labeled at top-left. Hubs without a matching tributary fall into an
   * "unassigned" group rendered without a frame. Apps thread this from
   * the active Hub's canvas viewport.
   */
  groupByTributary?: boolean;
  /**
   * Optional focal-step filter. When provided, only hubs whose condition
   * references a column mapped to this ProcessMap step are rendered.
   */
  filterByStepId?: string;
  /** Dataset rows forwarded to each HypothesisCard to populate the mini-chart slot. */
  rows?: ReadonlyArray<Record<string, unknown>>;
  /** Column type map (from `detectColumns`) forwarded to each HypothesisCard. */
  columnTypes?: ColumnTypeMap;
  /** Investigation-level outcome column forwarded to each HypothesisCard for boxplot Y-axis. */
  outcomeColumn?: string | null;
  /**
   * Render mode.
   * - `'destination'` (default): full destination-view chrome including
   *   `MissingEvidencePanel` (rule-driven) below the SVG and the dedicated
   *   `EmptyState` for zero-hub graphs.
   * - `'overlay'` (8e canvas overlay): SVG-only render; no
   *   `MissingEvidencePanel`; empty hubs render the SVG header/footer
   *   without the EmptyState CTA panel (the overlay wrapper gates mount).
   */
  mode?: 'destination' | 'overlay';
  /**
   * Optional measurement-plan affordances. When provided, hub cards render
   * as `<HypothesisCardWithPlans>` (with inline plan chips + add-plan form).
   * When omitted, hub cards render as bare `<HypothesisCard>` (legacy path).
   */
  planningProps?: WallCanvasPlanningProps;
}

/**
 * Canvas dimensions in user-space units. Exported so Minimap and other
 * viewport-overlay primitives can reuse the same coordinate space.
 */
export const CANVAS_W = 2000;
export const CANVAS_H = 1400;

const WALL_PAN_IGNORED_TARGET =
  'button,a,input,select,textarea,[role="button"],[data-no-overlay-pan],[data-no-wall-pan]';

function shouldHandleWallPanInput(event: Event): boolean {
  return !(event.target instanceof Element && event.target.closest(WALL_PAN_IGNORED_TARGET));
}

export const WallCanvas: React.FC<WallCanvasProps> = ({
  hubId,
  hubs,
  findings,
  processMap,
  problemCpk,
  eventsPerWeek,
  activeScope,
  activeScopeSpecs,
  activeColumns,
  onSelectHub,
  onWriteHypothesis,
  onSeedFromFactorIntel,
  onFocusHubFromGap,
  onComposeGate,
  zoom = 1,
  pan = { x: 0, y: 0 },
  groupByTributary = false,
  mode = 'destination',
  rows,
  columnTypes,
  outcomeColumn,
  filterByStepId,
  planningProps,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const locale = useWallLocale();
  const filteredHubs = useMemo(() => {
    if (!filterByStepId) return hubs;
    return hubs.filter(hub => conditionReferencesStep(hub.condition, processMap, filterByStepId));
  }, [filterByStepId, hubs, processMap]);
  const surveyHints = useMemo(
    () => surveyWallRules({ hypotheses: filteredHubs, findings }),
    [filteredHubs, findings]
  );
  // Hub gets the warning badge when it has a data-collection hint —
  // i.e., it's evidenced but lacks triangulation evidence.
  const hubsWithGap = useMemo(() => {
    const set = new Set<string>();
    for (const h of surveyHints) {
      if (h.kind === 'data-collection') set.add(h.targetEntityId);
    }
    return set;
  }, [surveyHints]);
  const columnSet = useMemo(
    () => (activeColumns ? new Set(activeColumns) : undefined),
    [activeColumns]
  );
  const branchByHubId = useMemo(() => {
    const entries = filteredHubs.map(
      hub =>
        [
          hub.id,
          projectMechanismBranch(hub, {
            findings,
            processContext: processMap ? { processMap } : undefined,
          }),
        ] as const
    );
    return new Map(entries);
  }, [filteredHubs, findings, processMap]);
  // Tributary clustering: bucket each hub by its first matching tributary.
  // Unmatched hubs (no tributaryIds, or none intersecting processMap) drop
  // into an "unassigned" bucket rendered without a frame. Order matches
  // processMap.tributaries, with unassigned always last. Empty buckets drop.
  // Computed unconditionally — returns null when disabled so the render path
  // falls back to the default linear layout.
  const tributaryGroups = useMemo(() => {
    if (!groupByTributary || !processMap) return null;
    const tributaries = processMap.tributaries;
    const tributaryById = new Map(tributaries.map(t => [t.id, t]));
    type Bucket = {
      tributary: (typeof tributaries)[number] | null;
      hubs: Hypothesis[];
    };
    const buckets: Bucket[] = tributaries.map(t => ({ tributary: t, hubs: [] }));
    const unassigned: Bucket = { tributary: null, hubs: [] };
    for (const hub of filteredHubs) {
      const matchId = hub.tributaryIds?.find(id => tributaryById.has(id));
      if (matchId) {
        const b = buckets.find(bk => bk.tributary?.id === matchId);
        b!.hubs.push(hub);
      } else {
        unassigned.hubs.push(hub);
      }
    }
    return [...buckets, unassigned].filter(b => b.hubs.length > 0);
  }, [filteredHubs, groupByTributary, processMap]);

  // Scope-anchor (IM-4a): derive the Problem-condition card's live display
  // values from the active scope + data window. Reuses the shipped IM-5 math +
  // the HOLDS evaluator — nothing is hardcoded. Within ONE homogeneous outcome
  // (ADR-073); no roll-up.
  const scopeAnchor = useMemo(() => {
    if (!activeScope) return undefined;
    // Materialize a mutable array for the core helpers (they read, never
    // mutate). The `rows` prop is ReadonlyArray; spread into a fresh array.
    const dataRows: Record<string, unknown>[] = rows ? [...rows] : [];
    // HOLDS N/M: evaluate the scope's gateNode (the per-scope contribution tree)
    // over the active data window. Absent gateNode → no HOLDS row.
    const holdsResult =
      activeScope.gateNode && dataRows.length > 0
        ? runAndCheck(activeScope.gateNode, hubs, dataRows)
        : undefined;
    // What-If projected Cpk (if-fixed) — null when unprojectable (no specs /
    // insufficient data); the card omits the row. The IM-5 helpers type rows as
    // the core `DataRow` (constrained cell values); the Wall's `rows` prop is
    // looser (`Record<string, unknown>`) so cast for the call.
    const im5Rows = dataRows as unknown as DataRow[];
    const whatIfCpk = computeScopeWhatIfProjection(
      activeScope.predicates,
      im5Rows,
      activeScope.outcome,
      activeScopeSpecs
    );
    // Coverage %: prevalence of the compound condition in the dataset.
    const coveragePct =
      dataRows.length > 0 ? computeConditionCoverage(activeScope.predicates, im5Rows) : undefined;
    return {
      conditionText: formatConditionLeaves(activeScope.predicates),
      holds: holdsResult?.holds,
      total: holdsResult?.total,
      whatIfCpk,
      coveragePct,
    };
  }, [activeScope, activeScopeSpecs, hubs, rows]);

  // stepOptions for AddPlanForm: derived once from processMap so renderHubAt can use it.
  // Returns undefined (not []) when processMap is absent so AddPlanForm hides the picker.
  const planningStepOptions = useMemo(() => {
    if (!planningProps || !processMap) return undefined;
    const steps = deriveProcessSteps(processMap);
    return steps.length > 0 ? steps.map(s => ({ id: s.id, label: s.name })) : undefined;
  }, [planningProps, processMap]);

  const dndEnabled = mode === 'destination' && Boolean(onComposeGate);
  const { onDragEnd } = useWallDragDrop({ onDrop: onComposeGate });
  const isMobile = useWallIsMobile();
  useCanvasViewportInput({
    hubId: hubId ?? null,
    ref: svgRef,
    disabled: mode !== 'destination' || !hubId || isMobile || filteredHubs.length === 0,
    filter: shouldHandleWallPanInput,
  });
  if (mode === 'overlay' && filteredHubs.length === 0) {
    // Overlay mode: render a blank SVG so the wrapper owns empty-state semantics.
    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="bg-background text-content w-full h-full"
        role="img"
        aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
      />
    );
  }

  // Mobile (<768px): swap the 2000×1400 SVG for a vertical card stack.
  // MissingEvidencePanel still renders below the list on mobile so gap
  // coaching stays visible. MobileCardList handles its own empty state,
  // so this branch supersedes the hubs-empty short-circuit below.
  if (mode === 'destination' && isMobile) {
    return (
      <div className="w-full h-full flex flex-col">
        <MobileCardList
          hubs={filteredHubs}
          findings={findings}
          processMap={processMap}
          onSelectHub={onSelectHub}
          onWriteHypothesis={onWriteHypothesis}
          onSeedFromFactorIntel={onSeedFromFactorIntel}
        />
        {mode === 'destination' ? (
          <MissingEvidencePanel hints={surveyHints} onFocusHub={onFocusHubFromGap} />
        ) : null}
      </div>
    );
  }

  if (mode === 'destination' && filteredHubs.length === 0) {
    return (
      <EmptyState
        onWriteHypothesis={onWriteHypothesis}
        onSeedFromFactorIntel={onSeedFromFactorIntel}
      />
    );
  }

  const problemLabel = processMap?.ctsColumn ?? 'CTS';
  const hubY = 400;
  const hubSpacing = CANVAS_W / (filteredHubs.length + 1);

  // Evidence band (IM-4a Task 5): per-hub HOLDS GateBadge + the hub's linked
  // findings as FindingChips tethered (dashed) to the hub anchor. Rendered ABOVE
  // the hub card (between the y=280 divider and the hub at hubY) so it never
  // collides with the plans/disconfirmation foreignObject below. The full
  // bipartite re-layout is IM-4b.
  const dataRowsForBand: Record<string, unknown>[] = rows ? [...rows] : [];
  const renderHubEvidence = (hub: Hypothesis, x: number) => {
    // Per-hub HOLDS: evaluate the hub's own condition over the active window.
    const holds =
      hub.condition && dataRowsForBand.length > 0
        ? runAndCheck({ kind: 'hub', hubId: hub.id }, [hub], dataRowsForBand)
        : undefined;
    // Supporting + counter findings linked to this hub.
    const counterIds = new Set(hub.counterFindingIds ?? []);
    const supporting = hub.findingIds
      .filter(id => !counterIds.has(id))
      .map(id => findings.find(f => f.id === id))
      .filter((f): f is Finding => !!f);
    const counter = [...counterIds]
      .map(id => findings.find(f => f.id === id))
      .filter((f): f is Finding => !!f);

    const CHIP_GAP = 52;
    const bandTop = 296;
    // Supporting chips climb to the LEFT of the hub anchor; counter to the RIGHT.
    const renderChips = (
      chips: Finding[],
      side: 'support' | 'counter',
      labelKey: 'wall.evidence.supports' | 'wall.evidence.countsAgainst'
    ) => {
      if (chips.length === 0) return null;
      const colX = side === 'support' ? x - 130 : x + 130;
      return (
        <g key={`${hub.id}-${side}`}>
          {/* Counts-against label is styled LOUD (§7): bold + warning fill. */}
          <text
            x={colX}
            y={bandTop - 8}
            textAnchor="middle"
            className={
              side === 'counter'
                ? 'text-[10px] font-bold uppercase'
                : 'fill-content-muted text-[10px] font-semibold uppercase'
            }
            fill={side === 'counter' ? chartColors.warning : undefined}
          >
            {getMessage(locale, labelKey)}
          </text>
          {chips.map((finding, i) => {
            const chipY = bandTop + i * CHIP_GAP;
            return (
              <g key={finding.id}>
                <line
                  x1={colX}
                  y1={chipY + 22}
                  x2={x}
                  y2={hubY}
                  stroke={side === 'counter' ? chartColors.warning : undefined}
                  className={side === 'counter' ? undefined : 'stroke-edge'}
                  strokeDasharray="4 4"
                  data-evidence-tether={hub.id}
                  data-evidence-kind={side}
                />
                <FindingChip finding={finding} x={colX} y={chipY} onSelect={onSelectHub} />
              </g>
            );
          })}
        </g>
      );
    };

    return (
      <g key={`${hub.id}-evidence`} data-hub-evidence={hub.id}>
        {holds && (
          <g data-testid={`hub-holds-${hub.id}`}>
            <GateBadge
              kind="and"
              gatePath={`hub:${hub.id}`}
              holds={holds.holds}
              total={holds.total}
              x={x}
              y={hubY - 26}
            />
          </g>
        )}
        {renderChips(supporting, 'support', 'wall.evidence.supports')}
        {renderChips(counter, 'counter', 'wall.evidence.countsAgainst')}
      </g>
    );
  };

  const renderHubAt = (hub: Hypothesis, x: number) => {
    const hubProps = {
      hub,
      branch: branchByHubId.get(hub.id),
      displayStatus: deriveHypothesisStatus(hub, findings),
      x,
      y: hubY,
      hasGap: hubsWithGap.has(hub.id),
      missingColumn: columnSet ? conditionHasMissingColumn(hub.condition, columnSet) : false,
      zoomScale: zoom !== 1 ? zoom : undefined,
      onSelect: onSelectHub,
      rows,
      columnTypes,
      outcomeColumn,
    };

    // Derive per-hypothesis plans (non-deleted only) when planningProps are provided.
    // stepOptions is derived once per render from processMap (stable reference via useMemo
    // at the outer level — see stepOptions memo below). defaultScope + defaultOutcome are
    // forwarded as-is; the form defaults to [] / '' when undefined.
    const hubPlanningProps = planningProps
      ? {
          plans: planningProps.plans.filter(p => p.hypothesisId === hub.id && p.deletedAt === null),
          members: planningProps.members,
          currentUserId: planningProps.currentUserId,
          findings,
          onAddPlan: planningProps.onAddPlan,
          onLinkFinding: planningProps.onLinkFinding,
          onEditPlan: planningProps.onEditPlan,
          onRecordDisconfirmation: planningProps.onRecordDisconfirmation,
          stepOptions: planningStepOptions,
          defaultScope: planningProps.defaultScope,
          defaultOutcome: planningProps.defaultOutcome,
        }
      : undefined;

    const card = dndEnabled ? (
      <DraggableHypothesisCard {...hubProps} planningProps={hubPlanningProps} />
    ) : hubPlanningProps ? (
      <HypothesisCardWithPlans {...hubProps} {...hubPlanningProps} />
    ) : (
      <HypothesisCard {...hubProps} />
    );

    // Card + its evidence band (per-hub HOLDS + tethered FindingChips, IM-4a T5).
    return (
      <g key={hub.id}>
        {renderHubEvidence(hub, x)}
        {card}
      </g>
    );
  };

  const body = (
    <div className="w-full h-full flex flex-col">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="bg-background text-content flex-1"
        role="img"
        aria-label={getMessage(locale, 'wall.canvas.ariaLabel')}
      >
        <g data-wall-viewport transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <ProblemConditionCard
            ctsColumn={problemLabel}
            cpk={problemCpk}
            eventsPerWeek={eventsPerWeek}
            conditionText={scopeAnchor?.conditionText}
            holds={scopeAnchor?.holds}
            total={scopeAnchor?.total}
            whatIfCpk={scopeAnchor?.whatIfCpk}
            coveragePct={scopeAnchor?.coveragePct}
            x={CANVAS_W / 2}
            y={40}
          />

          <line
            x1={80}
            x2={CANVAS_W - 80}
            y1={280}
            y2={280}
            className="stroke-edge"
            strokeDasharray="4 6"
          />

          {tributaryGroups
            ? (() => {
                // Slice the canvas horizontally into equal-width bands, one per
                // non-empty group. Each band draws its own frame (when a
                // tributary is known) and distributes its hubs evenly within
                // the inner padding.
                const GROUP_PAD_X = 40;
                const bandWidth = CANVAS_W / tributaryGroups.length;
                return tributaryGroups.map((group, bandIdx) => {
                  const bandX0 = bandIdx * bandWidth;
                  const innerX0 = bandX0 + GROUP_PAD_X;
                  const innerW = bandWidth - GROUP_PAD_X * 2;
                  const perHub = innerW / (group.hubs.length + 1);
                  return (
                    <g
                      key={group.tributary?.id ?? '__unassigned__'}
                      data-tributary-group={group.tributary?.id ?? 'unassigned'}
                    >
                      {group.tributary && (
                        <>
                          <rect
                            x={bandX0 + GROUP_PAD_X / 2}
                            y={hubY - 40}
                            width={bandWidth - GROUP_PAD_X}
                            height={348}
                            rx={12}
                            className="fill-transparent stroke-edge"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={bandX0 + GROUP_PAD_X / 2 + 12}
                            y={hubY - 20}
                            className="fill-content-muted text-xs font-mono uppercase tracking-wide"
                          >
                            {group.tributary.label ?? group.tributary.column}
                          </text>
                        </>
                      )}
                      {group.hubs.map((hub, i) => renderHubAt(hub, innerX0 + perHub * (i + 1)))}
                    </g>
                  );
                });
              })()
            : filteredHubs.map((hub, idx) => renderHubAt(hub, hubSpacing * (idx + 1)))}

          {processMap && (
            <TributaryFooter
              tributaries={processMap.tributaries}
              hubs={filteredHubs}
              y={1300}
              canvasWidth={CANVAS_W}
            />
          )}
        </g>
      </svg>

      {mode === 'destination' ? (
        <MissingEvidencePanel hints={surveyHints} onFocusHub={onFocusHubFromGap} />
      ) : null}
    </div>
  );

  // Only mount DndContext when drag-drop is enabled — keeps the tree lean
  // and avoids unused pointer-event listeners in the legacy/read-only case.
  return dndEnabled ? <DndContext onDragEnd={onDragEnd}>{body}</DndContext> : body;
};
