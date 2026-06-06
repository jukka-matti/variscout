import React from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  useCanvasStepCards,
  useCanvasAnalyzeOverlays,
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
  useSessionCanvasFilters,
  useTranslation,
  type CanvasAnalyzeFocus,
  type CanvasStepCardModel,
} from '@variscout/hooks';
import {
  computeBinnedFactorColumn,
  computeFormulaColumn,
  computeLeadTimeColumn,
  computeTimeDecompositionColumns,
  computeTotalWorkTimeColumn,
  computeWaitTimeColumn,
  detectColumns,
  detectScopeFromMap,
  normalizeProcessHubId,
  parseTimeValue,
  rankYCandidates,
  type CausalLink,
  type ColumnAnalysis,
  type DataRow,
  type Finding,
  type FormulaBinding,
  type TimeDecompositionBinding,
  type ProcessContext,
  type ProcessHubId,
  type ProcessStepCapabilityMember,
  type SpecLimits,
  type StepCapabilityStamp,
  type StepTimingBinding,
  type Hypothesis,
  type TimelineWindow,
} from '@variscout/core';
import { isValidLevel, type CanvasLevel } from '@variscout/core/canvas';
import type { ExploreLandingView } from '@variscout/core/exploreRouting';
import type { ChipNavigationTarget } from './EditMode/handlers/navigateToExploreForChip';
import type { ActionItem } from '@variscout/core/findings';
import {
  createEmptyMap,
  deriveProcessSteps,
  detectGaps,
  type ProcessMap,
} from '@variscout/core/frame';
import type {
  ImprovementProject,
  ImprovementProjectFactorControl,
} from '@variscout/core/improvementProject';
import type { OutcomeSpec } from '@variscout/core/processHub';
import { profileColumns, type ColumnParsingProfile } from '@variscout/core/parser';
import { useCanvasStore } from '@variscout/stores';
import { useCanvasViewportStore, type CanvasViewportSnapshot } from '@variscout/stores';
import { Canvas, type CanvasL3Archetype } from './index';
import { Palette } from './EditMode/Palette';
import type { SystemHint } from './EditMode/Palette';
import { OutcomeZone } from './EditMode/OutcomeZone';
import { FactorZone } from './EditMode/FactorZone';
import { ProcessStructureZone } from './EditMode/ProcessZone';
import { EditModeToolbar } from './EditMode/EditModeToolbar';
import { handleEditModeDragEnd } from './EditMode/handleEditModeDragEnd';
import { useSystemHints } from './EditMode/hooks/useSystemHints';
import { useGhostSuggestions } from './EditMode/hooks/useGhostSuggestions';
import { StepTimingsModal } from './EditMode/Workflows/StepTimingsModal';
import { CalculatedColumnModal } from './EditMode/Workflows/CalculatedColumnModal';
import { TimeAsFactorsModal } from './EditMode/Workflows/TimeAsFactorsModal';
import { formatDuration } from './EditMode/formatDuration';
import { OutcomeSummaryPill } from './EditMode/Header/OutcomeSummaryPill';
import { CanvasFilterChips } from '../CanvasFilterChips';
import { FrameViewB0, type FrameViewB0YCandidate } from '../FrameViewB0';
import type { XCandidate } from '../XPickerSection';
import type { ChipRailEntry } from '../ChipRail';
import type { ContextLinkGroup, ContextLinkItem } from '../CrossSurface';
import type { LogActionPayload } from '../QuickAction';

const DEFAULT_CPK_TARGET = 1.33;
const DEFAULT_WORKSPACE_VIEWPORT: CanvasViewportSnapshot = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  currentLevel: 'l2',
  nodePositions: {},
  groupByTributary: false,
};
const CANVAS_FIT_REQUEST_EVENT = 'variscout:canvas-fit-request';

export interface CanvasWorkspaceProps {
  canvasViewportHubId?: string | null;
  rawData: readonly DataRow[];
  outcome: string | null;
  factors: readonly string[];
  measureSpecs: Record<string, SpecLimits>;
  processContext: ProcessContext | null;
  setOutcome: (outcome: string | null) => void;
  setFactors: (factors: string[]) => void;
  setMeasureSpec: (column: string, partial: Partial<SpecLimits>) => void;
  setProcessContext: (context: ProcessContext | null) => void;
  onSeeData: () => void;
  onLogQuickAction?: (stepId: string, payload: LogActionPayload) => void;
  findings?: readonly Finding[];
  hypotheses?: readonly Hypothesis[];
  causalLinks?: readonly CausalLink[];
  onOpenWall?: () => void;
  onOpenScout?: (hubId: ProcessHubId) => void;
  onAddCausalLink?: (
    fromFactor: string,
    toFactor: string,
    whyStatement: string,
    // IM-1: questionId plumbing retained for the IM-4 unified-Wall draw-tool; not wired to a Question entity
    options?: { questionIds?: string[] }
  ) => void;
  onRemoveCausalLink?: (linkId: string) => void;
  onOpenInvestigationFocus?: (focus: CanvasAnalyzeFocus) => void;
  onOpenColumnDetail?: (column: string, stepId: string) => void;
  contextLinkGroups?: readonly ContextLinkGroup[];
  onNavigateContextLink?: (item: ContextLinkItem) => void;
  /** PR-CS-5 Part 2: capture-from-step affordance forwarded to Canvas → CanvasStepOverlay. */
  onCaptureFindingFromStep?: (card: CanvasStepCardModel) => void;
  priorStepStats?: ReadonlyMap<string, StepCapabilityStamp>;
  actionItems?: ActionItem[];
  /** When false, hides the Edit/State toggle and forces State mode.
   *  When undefined or true, the toggle is shown and Edit mode is reachable.
   *  Azure derives this from canAccess(currentUserId, members, 'edit');
   *  PWA passes true (no membership model). */
  canEditCanvas?: boolean;
  /** The active ImprovementProject (CCJ E1 T5). When provided, the four
   *  Canvas-Edit-mode binding arrays (`processSteps`, `stepTimings`,
   *  `formulaBindings`, `timeDecompositionBindings`) are sourced from this IP
   *  and writes flow through `onPersistCanvasState`. When `null` /
   *  `undefined`, the four arrays fall back to local `useState` (legacy
   *  behaviour preserved for callers that pre-date E1 — e.g. `FrameViewB0`
   *  test wrappers, fixture-only renders, and PWA wiring before the active-IP
   *  cascade lands there). Production Azure passes a resolved `activeIP` via
   *  `FrameView`. */
  activeIP?: ImprovementProject | null;
  /** Persist a freshly-patched IP. Called by Canvas Edit-mode handlers
   *  (modal saves, drag-and-drop step replacement) with `{ ...activeIP,
   *  <field>: nextValue, updatedAt: now }`. Expected to upsert via the app's
   *  IP store (`useImprovementProjectStore.upsertProject`). No-op when
   *  `activeIP` is `null` / `undefined` — handlers guard internally and fall
   *  back to local state. */
  onPersistCanvasState?: (next: ImprovementProject) => void;
  /**
   * F1 Task 3: outcome specs owned by the ProcessHub (hub.outcomes).
   * Threaded from the calling app (Azure FrameView / PWA frame wrapper) which
   * reads them from the Hub store. Controls the → Explore button soft-gate:
   * the button is disabled until at least one spec is present. Optional so
   * callers that predate F1 (test fixtures, FrameViewB0) compile unchanged.
   */
  outcomeSpecs?: OutcomeSpec[];
  /**
   * F1 Task 6: callback invoked when the user clicks the → Explore button in
   * Edit-mode toolbar. Called with the derived `ExploreLandingView`; the
   * caller is responsible for navigating to the Explore tab (and optionally
   * setting a `pendingExploreIntent` on their panels store).
   *
   * @variscout/ui CANNOT import `usePanelsStore` from apps/ — the callback
   * prop pattern keeps the dependency direction correct (apps→ui, not
   * ui→apps). Azure FrameView wires this to
   * `usePanelsStore.getState().showExplore(intent)`. PWA wires it to bare
   * `usePanelsStore.getState().showExplore()` (no intent payload in PWA V1).
   * When omitted (test fixtures, FrameViewB0), a no-op default is used so
   * EditModeToolbar always has a handler.
   */
  onExploreExit?: (landing: ExploreLandingView) => void;
  /**
   * LV1-D: dispatched when a chip's "Open in Explore" affordance is clicked.
   * Caller is responsible for mutating analysisScopeStore + switching to the
   * Explore tab (typically via `navigateToExploreForChip(target, () =>
   * panelsStore.showExplore())`). PWA leaves this undefined; Azure wires it.
   */
  onChipExploreJump?: (target: ChipNavigationTarget) => void;
  /**
   * FSJ-2 b0 landing slots (spec §4.1) — content owned by the app shell
   * (provenance, "Fix data…" hatch, "+ track another outcome", no-Y banner).
   * belowY maps to FrameViewB0's belowYSlot prop.
   * Optional: Azure does not pass them until FSJ-3.
   */
  b0Slots?: { topBar?: React.ReactNode; belowY?: React.ReactNode; noYBanner?: React.ReactNode };
}

function formatTimelineWindow(w: TimelineWindow): string {
  if (w.kind === 'cumulative') return 'Cumulative';
  if (w.kind === 'fixed') return `${w.startISO} → ${w.endISO}`;
  if (w.kind === 'rolling') return `Last ${w.windowDays}d`;
  if (w.kind === 'openEnded') return `From ${w.startISO}`;
  return (w as { kind: string }).kind;
}

function toggleArray<T>(arr: readonly T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function fitViewportNowAndAfterRender(
  fitToContent: (hubId: ProcessHubId, targetLevel?: CanvasLevel) => void,
  hubId: ProcessHubId,
  targetLevel: CanvasLevel
): void {
  fitToContent(hubId, targetLevel);
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
  window.requestAnimationFrame(() => {
    const viewport = useCanvasViewportStore.getState().getViewport(hubId);
    if (targetLevel === 'l3' && !viewport.focalStepId) return;
    window.dispatchEvent(
      new CustomEvent(CANVAS_FIT_REQUEST_EVENT, { detail: { hubId, level: targetLevel } })
    );
  });
}

function numericValuesFor(column: string, rows: readonly DataRow[]): number[] {
  const out: number[] = [];
  for (const row of rows) {
    const raw = row[column];
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function levelsFor(
  column: string,
  rows: readonly DataRow[]
): ReadonlyArray<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[column];
    if (raw === null || raw === undefined || raw === '') continue;
    const label = String(raw);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function toXCandidate(column: ColumnAnalysis, rows: readonly DataRow[]): XCandidate {
  if (column.type === 'numeric') {
    return { column, numericValues: numericValuesFor(column.name, rows) };
  }
  return { column, levels: levelsFor(column.name, rows) };
}

function stepNameFromChipLabel(label: string): string {
  return label.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ') || 'New step';
}

function isRunOrderLikeColumn(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes('timestamp') || normalized.includes('datetime');
}

function deriveUnassignedChips({
  columnAnalysis,
  outcome,
  runOrderColumn,
  assignments,
}: {
  columnAnalysis: readonly ColumnAnalysis[];
  outcome: string | null;
  runOrderColumn: string | null;
  assignments: ProcessMap['assignments'] | undefined;
}): ChipRailEntry[] {
  const assignedColumns = new Set(Object.keys(assignments ?? {}));

  return columnAnalysis
    .filter(column => {
      if (column.name === outcome) return false;
      if (column.name === runOrderColumn) return false;
      if (isRunOrderLikeColumn(column.name)) return false;
      if (assignedColumns.has(column.name)) return false;
      return column.hasVariation;
    })
    .map(column => ({
      chipId: column.name,
      label: stepNameFromChipLabel(column.name),
      role: column.type === 'numeric' || column.type === 'categorical' ? 'factor' : 'metadata',
    }));
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  canvasViewportHubId,
  rawData,
  outcome,
  factors,
  measureSpecs,
  processContext,
  setOutcome,
  setFactors,
  setMeasureSpec,
  setProcessContext,
  onSeeData,
  onLogQuickAction,
  findings = [],
  hypotheses = [],
  causalLinks = [],
  onOpenWall,
  onOpenScout,
  onAddCausalLink,
  onRemoveCausalLink,
  onOpenInvestigationFocus,
  onOpenColumnDetail,
  contextLinkGroups,
  onNavigateContextLink,
  onCaptureFindingFromStep,
  priorStepStats,
  actionItems = [],
  canEditCanvas,
  activeIP,
  onPersistCanvasState,
  outcomeSpecs = [],
  onExploreExit,
  onChipExploreJump,
  b0Slots,
}) => {
  const { t } = useTranslation();
  const fallbackMap = React.useMemo(() => createEmptyMap(), []);
  const availableColumns = React.useMemo(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : []),
    [rawData]
  );

  const map: ProcessMap = processContext?.processMap ?? fallbackMap;
  const hubId = normalizeProcessHubId(canvasViewportHubId ?? processContext?.processHubId);
  const viewport =
    useCanvasViewportStore(state => state.viewports[hubId]) ?? DEFAULT_WORKSPACE_VIEWPORT;
  const setViewportLevel = useCanvasViewportStore(state => state.setLevel);
  const fitViewportToContent = useCanvasViewportStore(state => state.fitToContent);
  const scope = detectScopeFromMap(map);
  const ctsColumn = map.ctsColumn;
  const ctsSpecs = ctsColumn ? measureSpecs[ctsColumn] : undefined;
  const hydrateCanvasDocument = useCanvasStore(state => state.hydrateCanvasDocument);
  const currentCanonicalMap = useCanvasStore(state => state.canonicalMap);
  const placeChipOnStep = useCanvasStore(state => state.placeChipOnStep);
  const createStepFromChip = useCanvasStore(state => state.createStepFromChip);
  const addStep = useCanvasStore(state => state.addStep);
  const addStepsFromColumn = useCanvasStore(state => state.addStepsFromColumn);
  const removeStep = useCanvasStore(state => state.removeStep);
  const renameStep = useCanvasStore(state => state.renameStep);
  const connectSteps = useCanvasStore(state => state.connectSteps);
  const disconnectSteps = useCanvasStore(state => state.disconnectSteps);
  const groupIntoSubStep = useCanvasStore(state => state.groupIntoSubStep);
  const ungroupSubStep = useCanvasStore(state => state.ungroupSubStep);
  // IM-0b-2 (ADR-087 §5): rich-map authoring actions — canvasStore is now the
  // single authoring authority for ctqColumn / tributary / subgroupAxis / hunch.
  const setStepCtq = useCanvasStore(state => state.setStepCtq);
  const addTributary = useCanvasStore(state => state.addTributary);
  const removeTributary = useCanvasStore(state => state.removeTributary);
  const toggleSubgroupAxis = useCanvasStore(state => state.toggleSubgroupAxis);
  const addHunch = useCanvasStore(state => state.addHunch);
  const removeHunch = useCanvasStore(state => state.removeHunch);
  const undoCanvas = useCanvasStore(state => state.undo);
  const redoCanvas = useCanvasStore(state => state.redo);
  const mapHydrationSignature = React.useMemo(() => JSON.stringify(map), [map]);
  const currentCanonicalMapSignature = React.useMemo(
    () => JSON.stringify(currentCanonicalMap),
    [currentCanonicalMap]
  );
  const lastHydratedMapSignature = React.useRef<string | null>(null);
  const appliedUrlLevelRef = React.useRef<string | null>(null);
  const pendingUrlLevelRef = React.useRef<CanvasLevel | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const signature = `${hubId}:${window.location.search}`;
    if (appliedUrlLevelRef.current === signature) return;

    const params = new URLSearchParams(window.location.search);
    const rawLevel = params.get('level');
    if (!isValidLevel(rawLevel)) return;

    const urlLevel = rawLevel as CanvasLevel;
    const focalStepFromUrl = params.get('focalStep');
    const hasMapNodes = map.nodes.length > 0;
    const focalStepFromUrlExists =
      focalStepFromUrl !== null && map.nodes.some(node => node.id === focalStepFromUrl);

    if (urlLevel === 'l3' && focalStepFromUrl && !focalStepFromUrlExists && !hasMapNodes) {
      pendingUrlLevelRef.current = 'l3';
      return;
    }

    appliedUrlLevelRef.current = signature;

    const focalStepId = focalStepFromUrlExists ? focalStepFromUrl : undefined;
    const nextLevel = urlLevel === 'l3' && !focalStepId ? 'l2' : urlLevel;
    pendingUrlLevelRef.current = nextLevel;
    if (nextLevel === 'l3') {
      setViewportLevel(hubId, 'l3', focalStepId);
    } else {
      setViewportLevel(hubId, nextLevel);
    }
    fitViewportNowAndAfterRender(fitViewportToContent, hubId, nextLevel);
  }, [fitViewportToContent, hubId, map.nodes, setViewportLevel]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pendingUrlLevelRef.current && viewport.currentLevel !== pendingUrlLevelRef.current) return;
    pendingUrlLevelRef.current = null;
    const params = new URLSearchParams(window.location.search);
    const currentFocalStep = params.get('focalStep');
    if (
      params.get('level') === viewport.currentLevel &&
      (viewport.currentLevel !== 'l3' || currentFocalStep === viewport.focalStepId)
    ) {
      return;
    }
    params.set('level', viewport.currentLevel);
    if (viewport.currentLevel === 'l3' && viewport.focalStepId) {
      params.set('focalStep', viewport.focalStepId);
    } else {
      params.delete('focalStep');
    }
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${nextSearch}${window.location.hash}`
    );
  }, [viewport.currentLevel, viewport.focalStepId]);

  React.useEffect(() => {
    if (lastHydratedMapSignature.current === mapHydrationSignature) return;
    if (currentCanonicalMapSignature === mapHydrationSignature) {
      lastHydratedMapSignature.current = mapHydrationSignature;
      return;
    }
    hydrateCanvasDocument({ canonicalMap: map });
    lastHydratedMapSignature.current = mapHydrationSignature;
  }, [currentCanonicalMapSignature, hydrateCanvasDocument, map, mapHydrationSignature]);

  const gaps = React.useMemo(
    () =>
      detectGaps({
        processMap: map,
        columns: availableColumns,
        outcomeColumn: outcome ?? undefined,
        specs: ctsSpecs,
      }),
    [map, availableColumns, outcome, ctsSpecs]
  );

  const handleChange = React.useCallback(
    (next: ProcessMap) => {
      const baseContext: ProcessContext = processContext ?? {};
      setProcessContext({ ...baseContext, processMap: next });
    },
    [processContext, setProcessContext]
  );

  const handleSpecsChange = React.useCallback(
    (next: Partial<SpecLimits>) => {
      if (!ctsColumn) return;
      setMeasureSpec(ctsColumn, next);
    },
    [ctsColumn, setMeasureSpec]
  );

  const filter = useProductionLineGlanceFilter();
  const {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
    activeCanvasLens,
    setActiveCanvasLens,
    activeCanvasOverlays,
    toggleCanvasOverlay,
    activeCanvasTool,
    setActiveCanvasTool,
  } = useSessionCanvasFilters();

  const canvasFilterChipsNode = (
    <CanvasFilterChips
      timelineWindow={timelineWindow}
      scopeFilter={scopeFilter}
      paretoGroupBy={paretoGroupBy}
      formatTimelineWindow={formatTimelineWindow}
      onClearTimelineWindow={() => setTimelineWindow({ kind: 'cumulative' })}
      onClearScopeFilter={() => setScopeFilter(undefined)}
      onClearParetoGroupBy={() => setParetoGroupBy(undefined)}
    />
  );

  const previewSource = React.useMemo(() => {
    const previewHub = {
      id: 'frame-preview',
      canonicalProcessMap: map,
      contextColumns: [],
    };
    return {
      hub: previewHub,
      members: [] as ProcessStepCapabilityMember[],
      rowsByAnalyze: new Map<string, ReadonlyArray<DataRow>>(),
    };
  }, [map]);

  const data = useProductionLineGlanceData({
    hub: previewSource.hub,
    members: previewSource.members,
    rowsByAnalyze: previewSource.rowsByAnalyze,
    contextFilter: filter.value,
  });

  const { cards: stepCards } = useCanvasStepCards({
    map,
    rows: rawData,
    measureSpecs,
    capabilityNodes: data.capabilityNodes,
    errorSteps: data.errorSteps,
    priorStepStats,
  });

  const { overlays: investigationOverlays } = useCanvasAnalyzeOverlays({
    map,
    findings,
    hypotheses,
    causalLinks,
  });

  const detected = React.useMemo(
    () => (rawData.length > 0 ? detectColumns([...rawData]) : null),
    [rawData]
  );
  const runOrderColumn = detected?.timeColumn ?? null;
  const columnAnalysis = React.useMemo(() => detected?.columnAnalysis ?? [], [detected]);

  const yCandidates: FrameViewB0YCandidate[] = React.useMemo(() => {
    const ranked = rankYCandidates(columnAnalysis);
    return ranked.map(({ column }) => ({
      column,
      numericValues: numericValuesFor(column.name, rawData),
    }));
  }, [columnAnalysis, rawData]);

  const xCandidates: XCandidate[] = React.useMemo(() => {
    return columnAnalysis
      .filter(
        col =>
          col.name !== outcome &&
          col.name !== runOrderColumn &&
          (col.type === 'numeric' || col.type === 'categorical')
      )
      .map(col => toXCandidate(col, rawData));
  }, [columnAnalysis, outcome, runOrderColumn, rawData]);

  const chips = React.useMemo(
    () =>
      deriveUnassignedChips({
        columnAnalysis,
        outcome,
        runOrderColumn,
        assignments: map.assignments,
      }),
    [columnAnalysis, outcome, runOrderColumn, map.assignments]
  );

  // PR-CCJ-E1 T5: the Canvas-Edit-mode binding arrays (`stepTimings`,
  // `formulaBindings`, `timeDecompositionBindings`) live on the active
  // `ImprovementProject` after E1. When `activeIP` is provided, reads come
  // from the IP and writes flow through `onPersistCanvasState` (the IP store's
  // `upsertProject`). When `activeIP` is `null` / `undefined` (test fixtures,
  // FrameViewB0 stubs, PWA without active-IP wiring), the local-state fallback
  // below keeps the modal save flows working in isolation. The fallback is
  // structural — once `activeIP` is supplied it owns the source of truth and
  // local state goes unused for those fields.
  //
  // IM-0b (ADR-087): `processSteps` is NO LONGER one of these binding arrays.
  // The rich `ProcessMap` is the single canonical step structure; the step
  // list is a read-only projection of `map.nodes` via `deriveProcessSteps`.
  // There is no local-state fallback and no IP write path for steps — the
  // canvas map (canvasStore → persistCanvasStoreMap → setProcessContext) is
  // the only step author path.
  const [localStepTimings, setLocalStepTimings] = React.useState<StepTimingBinding[]>([]);
  const [localFormulaBindings, setLocalFormulaBindings] = React.useState<FormulaBinding[]>([]);
  const [localTimeDecompositionBindings, setLocalTimeDecompositionBindings] = React.useState<
    TimeDecompositionBinding[]
  >([]);

  const processSteps = React.useMemo(() => deriveProcessSteps(map), [map]);
  const stepTimings = activeIP?.stepTimings ?? localStepTimings;
  const formulaBindings = activeIP?.formulaBindings ?? localFormulaBindings;
  const timeDecompositionBindings =
    activeIP?.timeDecompositionBindings ?? localTimeDecompositionBindings;
  // G1: binnedFactorBindings are read-only from activeIP (no local-state
  // fallback — binning is always persisted via the probability-plot UX which
  // requires an active IP to be open). Defaults to [] when absent so the
  // derived-column memos stay stable.
  const binnedFactorBindings = activeIP?.binnedFactorBindings ?? [];

  const [stepTimingsModalOpen, setStepTimingsModalOpen] = React.useState(false);
  const [calcModalOpen, setCalcModalOpen] = React.useState<{ sourceColumn?: string } | null>(null);
  const [timeFactorsModalOpen, setTimeFactorsModalOpen] = React.useState<{
    sourceColumn?: string;
  } | null>(null);

  // H1 Task 1: dismissed system hints — persisted only for the current session
  // (component lifetime). Hints reappear on remount; user can re-dismiss.
  const [dismissedSystemHints, setDismissedSystemHints] = React.useState<Set<string>>(
    () => new Set()
  );

  // E1 T5: route a per-field patch through `onPersistCanvasState`. Always
  // emits a fully-formed IP (factory contract: `upsertProject` expects the
  // whole object) with `updatedAt` refreshed at the moment of the write.
  // No-op when `activeIP` / `onPersistCanvasState` is missing; callers
  // dispatch to the local-state setters in that branch instead.
  const patchActiveIP = React.useCallback(
    (
      fieldPatch: Partial<
        Pick<ImprovementProject, 'stepTimings' | 'formulaBindings' | 'timeDecompositionBindings'>
      >
    ) => {
      if (!activeIP || !onPersistCanvasState) return;
      onPersistCanvasState({ ...activeIP, ...fieldPatch, updatedAt: Date.now() });
    },
    [activeIP, onPersistCanvasState]
  );

  const setStepTimings = React.useCallback(
    (next: StepTimingBinding[]) => {
      if (activeIP && onPersistCanvasState) {
        patchActiveIP({ stepTimings: next });
      } else {
        setLocalStepTimings(next);
      }
    },
    [activeIP, onPersistCanvasState, patchActiveIP]
  );

  const setFormulaBindings = React.useCallback(
    (next: FormulaBinding[]) => {
      if (activeIP && onPersistCanvasState) {
        patchActiveIP({ formulaBindings: next });
      } else {
        setLocalFormulaBindings(next);
      }
    },
    [activeIP, onPersistCanvasState, patchActiveIP]
  );

  const setTimeDecompositionBindings = React.useCallback(
    (next: TimeDecompositionBinding[]) => {
      if (activeIP && onPersistCanvasState) {
        patchActiveIP({ timeDecompositionBindings: next });
      } else {
        setLocalTimeDecompositionBindings(next);
      }
    },
    [activeIP, onPersistCanvasState, patchActiveIP]
  );

  // F1 Task 3: factor controls sourced from the active IP's goal.factorControls.
  // Falls back to [] when no IP is present (test fixtures, PWA without active-IP
  // cascade, FrameViewB0 stubs). Read-only; mutations are owned by the IP charter
  // panel (ImprovementProjectPanel) — CanvasWorkspace does not write factorControls.
  const factorControls = activeIP?.goal?.factorControls ?? [];

  // F1 Task 6: `onExploreExit` is injected by the calling app (Azure FrameView /
  // PWA FrameView). @variscout/ui cannot import `usePanelsStore` from apps/ —
  // the callback-prop pattern keeps the dependency direction correct.
  // Fall back to a no-op so FrameViewB0 / test wrappers that omit the prop
  // always give EditModeToolbar a defined handler.
  const handleExploreExit = React.useCallback(
    (landing: ExploreLandingView) => {
      onExploreExit?.(landing);
    },
    [onExploreExit]
  );

  const handleTimeFactorsSave = React.useCallback(
    (binding: TimeDecompositionBinding) => {
      const next = [
        ...timeDecompositionBindings.filter(b => b.sourceColumn !== binding.sourceColumn),
        binding,
      ];
      setTimeDecompositionBindings(next);
      setTimeFactorsModalOpen(null);
    },
    [timeDecompositionBindings, setTimeDecompositionBindings]
  );

  const handleCalcModalSave = React.useCallback(
    (binding: FormulaBinding) => {
      setFormulaBindings([...formulaBindings, binding]);
      setCalcModalOpen(null);
    },
    [formulaBindings, setFormulaBindings]
  );

  const onChipContextMenuSelect = React.useCallback((columnName: string, itemId: string) => {
    if (itemId === 'calculate-from') {
      setCalcModalOpen({ sourceColumn: columnName });
      return;
    }
    if (itemId === 'use-as-time-factors') {
      setTimeFactorsModalOpen({ sourceColumn: columnName });
      return;
    }
    // Other itemIds (rename, view-distribution, etc.) are handled at the Palette level
    // or fall through. CanvasWorkspace only owns calculate-from + use-as-time-factors.
  }, []);

  // C3 Task 4: build the categorical-distinct-values map from the parsed
  // column analysis. Only `type === 'categorical'` columns participate (numeric
  // columns are absent and therefore fall through to the OutcomeZone handler in
  // handleEditModeDragEnd). Mirrors the level extraction used by xCandidates,
  // scoped to the columns the process-zone drop router can consume.
  const categoricalDistinctValuesByColumn = React.useMemo<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {};
    for (const col of columnAnalysis) {
      if (col.type !== 'categorical') continue;
      out[col.name] = levelsFor(col.name, rawData).map(lv => lv.label);
    }
    return out;
  }, [columnAnalysis, rawData]);

  // D1 Task 10: per-column parsing profiles for the palette + StepTimingsModal.
  // Computed from rawData via the parser engine; passed to the inlined edit
  // chrome's Palette so the chips render, and forwarded to StepTimingsModal so it
  // can pre-fill paired pickers (dateProfiles) + offer duration columns
  // (numericProfiles).
  const rawProfiles = React.useMemo<ColumnParsingProfile[]>(() => {
    if (rawData.length === 0) return [];
    return profileColumns([...rawData]);
  }, [rawData]);

  // D1 Task 10: derived Lead_time / Total_work_time / Wait_time columns.
  // Each engine helper returns `number[] | null`; `null` ⇒ that derivation
  // doesn't apply (e.g. Lead_time/Wait_time require ≥ 1 paired binding).
  // Derived profiles are synthesized below and merged into the palette
  // profile list so the chips appear in the "DERIVED FROM TIMINGS" group.
  const leadTimeColumn = React.useMemo(
    () => computeLeadTimeColumn([...rawData], stepTimings),
    [rawData, stepTimings]
  );
  const totalWorkTimeColumn = React.useMemo(
    () => computeTotalWorkTimeColumn([...rawData], stepTimings),
    [rawData, stepTimings]
  );
  const waitTimeColumn = React.useMemo(
    () => computeWaitTimeColumn([...rawData], stepTimings),
    [rawData, stepTimings]
  );

  const derivedTimingsProfiles = React.useMemo<ColumnParsingProfile[]>(() => {
    const profiles: ColumnParsingProfile[] = [];
    const make = (columnName: string): ColumnParsingProfile => ({
      columnName,
      status: 'ok',
      confidence: 100,
      primary: { kind: 'numeric', label: 'numeric · derived', detail: {} },
      alternatives: [],
      transformedSamples: [],
      derived: true,
      derivationSource: 'timings',
    });
    if (leadTimeColumn !== null) profiles.push(make('Lead_time'));
    if (totalWorkTimeColumn !== null) profiles.push(make('Total_work_time'));
    if (waitTimeColumn !== null) profiles.push(make('Wait_time'));
    return profiles;
  }, [leadTimeColumn, totalWorkTimeColumn, waitTimeColumn]);

  // D2 Task 11: augmented-column map exposed to formula evaluation. Formulas
  // can reference D1's derived Lead_time / Total_work_time / Wait_time columns
  // alongside raw row fields (the evaluator checks row first, then augmented).
  const augmentedColumnsForFormulas = React.useMemo<Record<string, number[]>>(() => {
    const out: Record<string, number[]> = {};
    if (leadTimeColumn !== null) out['Lead_time'] = leadTimeColumn;
    if (totalWorkTimeColumn !== null) out['Total_work_time'] = totalWorkTimeColumn;
    if (waitTimeColumn !== null) out['Wait_time'] = waitTimeColumn;
    return out;
  }, [leadTimeColumn, totalWorkTimeColumn, waitTimeColumn]);

  // D2 Task 11: per-binding derived numeric columns. Each entry maps the
  // binding name to its computed `number[]` (NaN preserved — callers below
  // filter via Number.isFinite). `computeFormulaColumn` returns null when the
  // numerator is empty; we skip those entries entirely (no chip, no values).
  const formulaDerivedColumns = React.useMemo<Record<string, number[]>>(() => {
    const out: Record<string, number[]> = {};
    for (const binding of formulaBindings) {
      const result = computeFormulaColumn([...rawData], binding, augmentedColumnsForFormulas);
      if (result !== null) {
        out[binding.name] = result;
      }
    }
    return out;
  }, [formulaBindings, rawData, augmentedColumnsForFormulas]);

  // D2 Task 11: synthesized profiles for the formula-derived columns. Mirrors
  // `derivedTimingsProfiles` shape exactly; `derivationSource: 'formula'` drives
  // the palette's "DERIVED FROM FORMULA" group header.
  const derivedFormulaProfiles = React.useMemo<ColumnParsingProfile[]>(() => {
    const profiles: ColumnParsingProfile[] = [];
    for (const binding of formulaBindings) {
      if (formulaDerivedColumns[binding.name] === undefined) continue;
      profiles.push({
        columnName: binding.name,
        status: 'ok',
        confidence: 100,
        primary: { kind: 'numeric', label: 'numeric · derived', detail: {} },
        alternatives: [],
        transformedSamples: [],
        derived: true,
        derivationSource: 'formula',
      });
    }
    return profiles;
  }, [formulaBindings, formulaDerivedColumns]);

  // D3 Task 8: per-binding derived categorical columns produced by
  // `computeTimeDecompositionColumns`. Each entry maps the derived column name
  // (e.g. `Order_Date.year`, `Order_Date.day-of-week`, `Order_Date.hour-15min`)
  // to its `(string | null)[]` value array. Bindings are merged in order; the
  // TimeAsFactorsModal save handler dedupes by sourceColumn so a single source
  // cannot produce conflicting derived names within one render.
  const timeDecompositionDerivedColumns = React.useMemo<Record<string, (string | null)[]>>(() => {
    const merged: Record<string, (string | null)[]> = {};
    for (const binding of timeDecompositionBindings) {
      const cols = computeTimeDecompositionColumns([...rawData], binding);
      for (const [key, vals] of Object.entries(cols)) {
        merged[key] = vals;
      }
    }
    return merged;
  }, [timeDecompositionBindings, rawData]);

  // D3 Task 8: synthesized profiles for the time-decomposition derived columns.
  // Mirrors `derivedTimingsProfiles` / `derivedFormulaProfiles` shape; the
  // `derivationSource: 'time-decomposition'` discriminant drives the palette's
  // "DERIVED FROM TIME-DECOMPOSITION" group header. Primary kind is
  // `'categorical'` — derived bucket-labels (Year `2026`, DayOfWeek `Mon`,
  // Hour `14:00` / `14:30`) are categorical, not numeric.
  const derivedTimeDecompositionProfiles = React.useMemo<ColumnParsingProfile[]>(() => {
    return Object.keys(timeDecompositionDerivedColumns).map(columnName => ({
      columnName,
      status: 'ok',
      confidence: 100,
      primary: { kind: 'categorical', label: 'categorical · derived', detail: {} },
      alternatives: [],
      transformedSamples: [],
      derived: true,
      derivationSource: 'time-decomposition',
    }));
  }, [timeDecompositionDerivedColumns]);

  // G1: per-binding derived categorical columns produced by
  // `computeBinnedFactorColumn`. Each entry maps the derived column name
  // (`${sourceColumn}_bin`) to its `(string | null)[]` value array.
  const binnedFactorDerivedColumns = React.useMemo<Record<string, (string | null)[]>>(() => {
    const merged: Record<string, (string | null)[]> = {};
    for (const binding of binnedFactorBindings) {
      const vals = computeBinnedFactorColumn([...rawData], binding);
      merged[`${binding.sourceColumn}_bin`] = vals;
    }
    return merged;
  }, [binnedFactorBindings, rawData]);

  // G1: synthesized profiles for the bin-derived columns.
  // Mirrors `derivedTimeDecompositionProfiles` shape; the
  // `derivationSource: 'bins'` discriminant drives the palette's
  // "DERIVED FROM BINNING" group header. Primary kind is `'categorical'` —
  // bin level names (e.g. '<50', '>=50') are categorical labels, not numeric.
  const derivedBinsProfiles = React.useMemo<ColumnParsingProfile[]>(() => {
    return Object.keys(binnedFactorDerivedColumns).map(columnName => ({
      columnName,
      status: 'ok',
      confidence: 100,
      primary: { kind: 'categorical', label: 'categorical · derived', detail: {} },
      alternatives: [],
      transformedSamples: [],
      derived: true,
      derivationSource: 'bins',
    }));
  }, [binnedFactorDerivedColumns]);

  const editModeProfiles = React.useMemo<ColumnParsingProfile[]>(
    () => [
      ...rawProfiles,
      ...derivedTimingsProfiles,
      ...derivedFormulaProfiles,
      ...derivedTimeDecompositionProfiles,
      ...derivedBinsProfiles,
    ],
    [
      rawProfiles,
      derivedTimingsProfiles,
      derivedFormulaProfiles,
      derivedTimeDecompositionProfiles,
      derivedBinsProfiles,
    ]
  );

  // D1 Task 10: numericValuesByColumn — raw numeric columns from columnAnalysis
  // plus the derived timing columns so dropped derived chips have values
  // available to the OutcomeZone / FactorZone drop handlers.
  // D2 Task 11: extended with formula-derived columns (NaN-filtered) so the
  // formula-derived chips are draggable like raw numeric columns.
  const numericValuesByColumn = React.useMemo<Record<string, number[]>>(() => {
    const out: Record<string, number[]> = {};
    for (const col of columnAnalysis) {
      if (col.type === 'numeric') {
        out[col.name] = numericValuesFor(col.name, rawData);
      }
    }
    if (leadTimeColumn !== null) {
      out['Lead_time'] = leadTimeColumn.filter(v => Number.isFinite(v));
    }
    if (totalWorkTimeColumn !== null) {
      out['Total_work_time'] = totalWorkTimeColumn.filter(v => Number.isFinite(v));
    }
    if (waitTimeColumn !== null) {
      out['Wait_time'] = waitTimeColumn.filter(v => Number.isFinite(v));
    }
    for (const [name, values] of Object.entries(formulaDerivedColumns)) {
      out[name] = values.filter(v => Number.isFinite(v));
    }
    return out;
  }, [
    columnAnalysis,
    rawData,
    leadTimeColumn,
    totalWorkTimeColumn,
    waitTimeColumn,
    formulaDerivedColumns,
  ]);

  // D1 Task 10: timingByStepId — per-step average duration (in ms) rendered
  // as a "⏱ ~ <formatted>" badge on the matching `<StepBox>`.
  // - Paired binding: mean(end_value - start_value) across rows (skip rows where
  //   either cell is NaN/unparseable).
  // - Duration binding: mean(durationColumn value) across rows (skip non-finite).
  // - When the mean is NaN (all rows missing) ⇒ skip the entry (no badge).
  const timingByStepId = React.useMemo<Record<string, React.ReactNode>>(() => {
    const out: Record<string, React.ReactNode> = {};
    for (const binding of stepTimings) {
      const perRow: number[] = [];
      if (binding.kind === 'paired') {
        for (const row of rawData) {
          const startDate = parseTimeValue(row[binding.startColumn]);
          const endDate = parseTimeValue(row[binding.endColumn]);
          if (startDate === null || endDate === null) continue;
          perRow.push(endDate.getTime() - startDate.getTime());
        }
      } else {
        for (const row of rawData) {
          const raw = row[binding.durationColumn];
          if (typeof raw === 'number' && Number.isFinite(raw)) {
            perRow.push(raw);
          }
        }
      }
      if (perRow.length === 0) continue;
      const mean = perRow.reduce((acc, v) => acc + v, 0) / perRow.length;
      out[binding.stepId] = (
        <span className="text-xs text-content-secondary">{`⏱ ~ ${formatDuration(mean)}`}</span>
      );
    }
    return out;
  }, [stepTimings, rawData]);

  // D3 Task 8 / G1: categorical-values channel exposed alongside numericValuesByColumn.
  // Contains time-decomposition derived columns and bin-derived columns.
  // Raw categorical values continue to flow through `rows`. Downstream
  // Analyze/Explore consumers light up this prop incrementally in F1/H1.
  const categoricalValuesByColumn = React.useMemo<Record<string, (string | null)[]>>(() => {
    return { ...timeDecompositionDerivedColumns, ...binnedFactorDerivedColumns };
  }, [timeDecompositionDerivedColumns, binnedFactorDerivedColumns]);

  // H1 Task 1: batchDataResult and timeColumnsDetection memos retired — logic
  // moved into useSystemHints hook. detectBatchData / detectTimeColumns imports
  // also removed.

  // D3 Task 8: memoized list of date-kind column names. Drives the
  // TimeAsFactorsModal `timeColumns` prop; previously computed inline in JSX
  // (T7 review nit).
  const timeColumns = React.useMemo(
    () => rawProfiles.filter(p => p.primary?.kind === 'date').map(p => p.columnName),
    [rawProfiles]
  );

  // H1 Task 1: useSystemHints replaces the inline batch/time hint memos.
  // CTAs are wired to the existing modal-opener callbacks. `dismissedSystemHints`
  // suppresses hints that the user has dismissed for this session. The resulting
  // `SystemHintItem[]` is adapted to `SystemHint[]` below so the downstream
  // inlined Palette prop shape is unchanged.
  const systemHintItems = useSystemHints({
    columnProfiles: rawProfiles,
    dismissedHints: dismissedSystemHints,
    timeDecompositionBindings,
    onOpenCalc: () => setCalcModalOpen({ sourceColumn: undefined }),
    onOpenTimeAsFactors: () => setTimeFactorsModalOpen({}),
  });

  // Adapt SystemHintItem[] → SystemHint[] by injecting the per-hint dismiss
  // callback. `setDismissedSystemHints` is a stable React state-setter — it
  // does not change between renders and does not need to be listed in deps.
  const systemHints = React.useMemo<SystemHint[]>(
    () =>
      systemHintItems.map(item => ({
        ...item,
        onDismiss: () => setDismissedSystemHints(prev => new Set([...prev, item.id])),
      })),
    [systemHintItems, setDismissedSystemHints]
  );

  // H1 Task 2: ghost suggestions for unbound palette chips.
  // `outcomeSpecs` comes from the CanvasWorkspace prop (set by the Azure/PWA wrapper).
  // `factorControls` is derived from activeIP?.goal?.factorControls (line ~642 above).
  // StepBinding: no unified StepBinding type exists in @variscout/core yet; step
  // associations live on ImprovementProjectOutcomeGoal.stepId and
  // ImprovementProjectFactorControl.stepId. Passing empty array for now (graceful
  // fallback). Deferred to V2 when a StepBinding type is introduced.
  const ghostSuggestions = useGhostSuggestions({
    columnProfiles: rawProfiles,
    outcomeSpecs,
    factorControls,
    stepBindingColumns: [],
  });

  // PR-LV1-C: canvas is always directly editable subject to `canEditCanvas`.
  // When access is revoked (`canEditCanvas === false`), the b0 archetype renders
  // the read-only L3 view; otherwise the b1 archetype renders the author view.
  // No mode ceremony — edit affordances appear contextually.
  const l3Archetype: CanvasL3Archetype = canEditCanvas !== false ? 'b1' : 'b0';

  const handleConfirmYSpec = React.useCallback(
    (values: Partial<SpecLimits>) => {
      if (!outcome) return;
      setMeasureSpec(outcome, values);
    },
    [outcome, setMeasureSpec]
  );

  const persistCanvasStoreMap = React.useCallback(() => {
    const nextMap = useCanvasStore.getState().canonicalMap;
    lastHydratedMapSignature.current = JSON.stringify(nextMap);
    handleChange(nextMap);
  }, [handleChange]);

  const handlePlaceChip = React.useCallback(
    (chipId: string, stepId: string) => {
      placeChipOnStep(chipId, stepId);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, placeChipOnStep]
  );

  const handleCreateStepFromChip = React.useCallback(
    (chipId: string) => {
      const chip = chips.find(candidate => candidate.chipId === chipId);
      createStepFromChip(chipId, stepNameFromChipLabel(chip?.label ?? chipId));
      persistCanvasStoreMap();
    },
    [chips, createStepFromChip, persistCanvasStoreMap]
  );

  const handleAddStep = React.useCallback(() => {
    addStep('New step');
    persistCanvasStoreMap();
  }, [addStep, persistCanvasStoreMap]);

  const handleRemoveStep = React.useCallback(
    (stepId: string) => {
      removeStep(stepId);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, removeStep]
  );

  const handleRenameStep = React.useCallback(
    (stepId: string, newName: string) => {
      renameStep(stepId, newName);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, renameStep]
  );

  const handleConnectSteps = React.useCallback(
    (fromStepId: string, toStepId: string) => {
      connectSteps(fromStepId, toStepId);
      persistCanvasStoreMap();
    },
    [connectSteps, persistCanvasStoreMap]
  );

  const handleDisconnectSteps = React.useCallback(
    (fromStepId: string, toStepId: string) => {
      disconnectSteps(fromStepId, toStepId);
      persistCanvasStoreMap();
    },
    [disconnectSteps, persistCanvasStoreMap]
  );

  const handleGroupIntoSubStep = React.useCallback(
    (stepIds: string[], parentStepId: string) => {
      groupIntoSubStep(stepIds, parentStepId);
      persistCanvasStoreMap();
    },
    [groupIntoSubStep, persistCanvasStoreMap]
  );

  const handleUngroupSubStep = React.useCallback(
    (stepId: string) => {
      ungroupSubStep(stepId);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, ungroupSubStep]
  );

  // IM-0b-2 (ADR-087 §5): rich-map authoring handlers. Each dispatches the
  // canvasStore action then mirrors `persistCanvasStoreMap()` exactly like
  // `handleAddStep` — the edit lands on `processContext.processMap` via the
  // SAME persist path as every step-structure edit, retiring the legacy
  // ProcessMapBase `onChange` -> setProcessContext path. `persistCanvasStoreMap`
  // sets `lastHydratedMapSignature.current` to the post-edit map BEFORE calling
  // `handleChange`, so the resulting `map` change does NOT re-trigger the
  // hydration effect (no re-hydrate / clobber loop).
  const handleSetStepCtq = React.useCallback(
    (stepId: string, ctqColumn: string | undefined) => {
      setStepCtq(stepId, ctqColumn);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, setStepCtq]
  );

  const handleAddTributary = React.useCallback(
    (stepId: string, column: string) => {
      addTributary(stepId, column);
      persistCanvasStoreMap();
    },
    [addTributary, persistCanvasStoreMap]
  );

  const handleRemoveTributary = React.useCallback(
    (tributaryId: string) => {
      removeTributary(tributaryId);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, removeTributary]
  );

  const handleToggleSubgroupAxis = React.useCallback(
    (tributaryId: string) => {
      toggleSubgroupAxis(tributaryId);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, toggleSubgroupAxis]
  );

  const handleAddHunch = React.useCallback(
    (text: string, pin: { stepId?: string; tributaryId?: string }) => {
      addHunch(text, pin);
      persistCanvasStoreMap();
    },
    [addHunch, persistCanvasStoreMap]
  );

  const handleRemoveHunch = React.useCallback(
    (hunchId: string) => {
      removeHunch(hunchId);
      persistCanvasStoreMap();
    },
    [persistCanvasStoreMap, removeHunch]
  );

  const handleUndo = React.useCallback(() => {
    undoCanvas();
    persistCanvasStoreMap();
  }, [persistCanvasStoreMap, undoCanvas]);

  const handleRedo = React.useCallback(() => {
    redoCanvas();
    persistCanvasStoreMap();
  }, [persistCanvasStoreMap, redoCanvas]);

  const canvasNode = (
    <Canvas
      hubId={hubId}
      map={map}
      rows={rawData}
      availableColumns={availableColumns}
      onChange={handleChange}
      gaps={gaps}
      target={ctsSpecs?.target}
      lsl={ctsSpecs?.lsl}
      usl={ctsSpecs?.usl}
      cpkTarget={ctsSpecs?.cpkTarget}
      onSpecsChange={handleSpecsChange}
      stepSpecs={measureSpecs}
      // IM-0b-2 deferral: per-step specs route to project-wide `measureSpecs`
      // (NOT canvasStore / `node.capabilityScope`). Per-step capability-scope
      // authoring is deferred to the IM-5/IM-6 holistic design (ADR-038/073).
      // See investigations.md "IM-0b-2 deferrals".
      onStepSpecsChange={(column, next) => setMeasureSpec(column, next)}
      data={data}
      filter={{
        availableContext: data.availableContext,
        contextValueOptions: data.contextValueOptions,
        value: filter.value,
        onChange: filter.onChange,
      }}
      showGaps={scope !== 'b0'}
      canvasFilterChips={canvasFilterChipsNode}
      stepCards={stepCards}
      activeLens={activeCanvasLens}
      onLensChange={setActiveCanvasLens}
      activeOverlays={activeCanvasOverlays}
      onOverlayToggle={toggleCanvasOverlay}
      activeCanvasTool={activeCanvasTool}
      onCanvasToolChange={setActiveCanvasTool}
      hypotheses={hypotheses}
      investigationOverlays={investigationOverlays}
      findings={findings}
      onOpenScout={onOpenScout}
      onOpenWall={onOpenWall}
      onAddCausalLink={onAddCausalLink}
      onRemoveCausalLink={onRemoveCausalLink}
      onLogQuickAction={onLogQuickAction}
      onOpenInvestigationFocus={onOpenInvestigationFocus}
      onOpenColumnDetail={onOpenColumnDetail}
      contextLinkGroups={contextLinkGroups}
      onNavigateContextLink={onNavigateContextLink}
      onCaptureFindingFromStep={onCaptureFindingFromStep}
      actionItems={actionItems}
      l3Archetype={l3Archetype}
      chips={chips}
      onPlaceChip={handlePlaceChip}
      onCreateStepFromChip={handleCreateStepFromChip}
      onAddStep={handleAddStep}
      onRemoveStep={handleRemoveStep}
      onRenameStep={handleRenameStep}
      onConnectSteps={handleConnectSteps}
      onDisconnectSteps={handleDisconnectSteps}
      onGroupIntoSubStep={handleGroupIntoSubStep}
      onUngroupSubStep={handleUngroupSubStep}
      onSetStepCtq={handleSetStepCtq}
      onAddTributary={handleAddTributary}
      onRemoveTributary={handleRemoveTributary}
      onToggleSubgroupAxis={handleToggleSubgroupAxis}
      onAddHunch={handleAddHunch}
      onRemoveHunch={handleRemoveHunch}
      onUndo={handleUndo}
      onRedo={handleRedo}
    />
  );

  // IM-0b (ADR-087): the column-drop-to-process-zone gesture authors the
  // CANONICAL rich map, not a flat IP.processSteps list. We dispatch the
  // canvasStore `addStepsFromColumn` action (one rich `ProcessMapNode` per
  // distinct value, minted with the canvas `step-${slug}-${seq}` id scheme),
  // then mirror `persistCanvasStoreMap` so the new nodes flow through
  // `setProcessContext` exactly like every other canvas edit. The pre-extracted
  // `steps` ids (from `handleProcessStructureDrop`) are intentionally ignored —
  // only their ordered names are used as the distinct values, retiring the old
  // `step-${columnName}-${idx}` scheme. One id scheme, one author path.
  // IM-0b: receives ordered distinct values directly (no intermediate
  // ExtractedStep[] with throwaway ids). addStepsFromColumn mints canonical ids.
  const handleStepsReplace = React.useCallback(
    (distinctValues: string[], sourceColumnName: string) => {
      addStepsFromColumn(sourceColumnName, distinctValues);
      persistCanvasStoreMap();
    },
    [addStepsFromColumn, persistCanvasStoreMap]
  );

  // IM-0b (ADR-087): wire `onFactorControlAdd` (previously `undefined` — a
  // silent no-op). Writes `IP.goal.factorControls` via `onPersistCanvasState`,
  // appending one control per dropped column. `stepId` (set for a per-step
  // factor zone) is already a canonical `ProcessMap` node id — the FactorZone
  // step list comes from deriveProcessSteps(map) (ADR-087).
  // No-op when no active IP is wired.
  const handleFactorControlAdd = React.useCallback(
    (columnName: string, stepId?: string) => {
      if (!activeIP || !onPersistCanvasState) return;
      const existing = activeIP.goal.factorControls ?? [];
      if (existing.some(control => control.factor === columnName && control.stepId === stepId)) {
        return;
      }
      const nextControl: ImprovementProjectFactorControl = {
        factor: columnName,
        targetCondition: '',
        ...(stepId !== undefined && { stepId }),
      };
      onPersistCanvasState({
        ...activeIP,
        goal: { ...activeIP.goal, factorControls: [...existing, nextControl] },
        updatedAt: Date.now(),
      });
    },
    [activeIP, onPersistCanvasState]
  );

  // PR-LV1-C: drag-end router for the inlined Edit chrome's `DndContext`.
  // Routes `column:<name>` drops to the process / outcome / factor zones;
  // Canvas keeps its own separate `DndContext` for chip→step routing inside
  // the L2 view.
  const handleEditDragEnd = React.useCallback(
    (event: Parameters<typeof handleEditModeDragEnd>[0]) =>
      handleEditModeDragEnd(event, {
        numericValuesByColumn,
        categoricalDistinctValuesByColumn,
        onOutcomeSpecAdd: undefined,
        onFactorControlAdd: handleFactorControlAdd,
        onStepsReplace: handleStepsReplace,
      }),
    [
      numericValuesByColumn,
      categoricalDistinctValuesByColumn,
      handleFactorControlAdd,
      handleStepsReplace,
    ]
  );

  // PR-LV1-C: edit chrome surfaces inline whenever the viewer is permitted to
  // edit (canEditCanvas !== false). When access is revoked, the bare canvas
  // node renders without the palette / outcome / factor / process zones.
  const showEditChrome = canEditCanvas !== false;

  if (scope === 'b0') {
    return (
      <div className="flex-1 overflow-auto" data-testid="frame-view">
        <FrameViewB0
          yCandidates={yCandidates}
          // The b0 contract is "a wrong pick is one glance + one click to fix"
          // (spec §4.1). When the store outcome is NOT among the ranked candidates
          // (engine misinference like a date column named 'Timestamp', or a name
          // rankYCandidates filters out), degrade to no-selection rather than make
          // an invisible claim: no chip highlights AND the CTA stays gated on
          // picking a visible candidate. FSJ-2 chrome-walk fix.
          selectedY={yCandidates.some(c => c.column.name === outcome) ? outcome : null}
          onSelectY={setOutcome}
          xCandidates={xCandidates}
          selectedXs={factors}
          onToggleX={name => setFactors(toggleArray(factors, name))}
          runOrderColumn={runOrderColumn}
          currentYSpec={outcome ? measureSpecs[outcome] : undefined}
          yspecSuggestion={undefined}
          defaultCpkTarget={DEFAULT_CPK_TARGET}
          onConfirmYSpec={handleConfirmYSpec}
          onSeeData={onSeeData}
          topBar={b0Slots?.topBar}
          belowYSlot={b0Slots?.belowY}
          noYBanner={b0Slots?.noYBanner}
        >
          {canvasNode}
        </FrameViewB0>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="frame-view">
      <div className="mx-auto max-w-6xl">
        <header className="px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-content">{t('frame.b1.heading')}</h2>
              <p className="text-sm text-content-secondary">{t('frame.b1.description')}</p>
            </div>
            <OutcomeSummaryPill rawData={rawData} outcomeSpecs={outcomeSpecs} />
          </div>
        </header>
        {showEditChrome ? (
          <>
            <DndContext onDragEnd={handleEditDragEnd}>
              <section
                data-testid="edit-mode-shell"
                className="flex min-h-0 flex-1 flex-col"
                aria-label="Edit mode"
              >
                <header className="flex items-center justify-between border-b border-edge bg-surface-secondary px-4 py-2">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-semibold text-content">Edit map</h2>
                    <p className="text-xs text-content-secondary">
                      Connect your data to the process structure.
                    </p>
                  </div>
                </header>

                <EditModeToolbar
                  steps={processSteps}
                  onCaptureStepTimings={() => setStepTimingsModalOpen(true)}
                  outcomeSpecs={outcomeSpecs}
                  factorControls={factorControls}
                  processSteps={processSteps}
                  categoricalValuesByColumn={categoricalValuesByColumn}
                  onExploreExit={handleExploreExit}
                />

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[14rem_18rem_minmax(0,1fr)]">
                  <aside
                    data-testid="edit-mode-zone-palette"
                    className="flex flex-col gap-2 rounded-md border border-dashed border-edge bg-surface-primary p-3"
                    aria-label="Palette zone"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                      Palette
                    </h3>
                    <Palette
                      profiles={editModeProfiles}
                      numericValuesByColumn={numericValuesByColumn}
                      categoricalValuesByColumn={categoricalValuesByColumn}
                      systemHints={systemHints}
                      ghostSuggestions={ghostSuggestions}
                      onMenuItemSelect={onChipContextMenuSelect}
                    />
                  </aside>

                  <aside
                    data-testid="edit-mode-zone-outcomes-factors"
                    className="flex flex-col gap-3 rounded-md border border-dashed border-edge bg-surface-primary p-3"
                    aria-label="Outcomes and Factors zone"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                      Outcomes &amp; Factors
                    </h3>
                    <OutcomeZone
                      specs={outcomeSpecs}
                      numericValuesByColumn={numericValuesByColumn}
                      onSpecAdd={() => {}}
                      onSpecUpdate={() => {}}
                      onChipExploreJump={onChipExploreJump}
                    />
                    <FactorZone
                      controls={factorControls}
                      steps={processSteps}
                      onControlAdd={handleFactorControlAdd}
                      onControlUpdate={() => {}}
                      onChipExploreJump={onChipExploreJump}
                    />
                  </aside>

                  <section
                    data-testid="edit-mode-zone-process"
                    className="flex min-h-0 flex-col rounded-md border border-edge bg-surface-primary"
                    aria-label="Process structure zone"
                  >
                    <ProcessStructureZone
                      steps={processSteps}
                      timingByStepId={timingByStepId}
                      onChipExploreJump={onChipExploreJump}
                    />
                  </section>
                </div>
              </section>
            </DndContext>
            {stepTimingsModalOpen && (
              <StepTimingsModal
                steps={processSteps}
                dateProfiles={rawProfiles.filter(p => p.primary?.kind === 'date')}
                numericProfiles={rawProfiles.filter(p => p.primary?.kind === 'numeric')}
                initialBindings={stepTimings}
                onSave={bindings => {
                  setStepTimings(bindings);
                  setStepTimingsModalOpen(false);
                }}
                onClose={() => setStepTimingsModalOpen(false)}
              />
            )}
            {calcModalOpen != null && (
              <CalculatedColumnModal
                sourceColumn={calcModalOpen.sourceColumn}
                rawProfiles={rawProfiles}
                numericValuesByColumn={numericValuesByColumn}
                rows={rawData}
                hasLeadTime={leadTimeColumn !== null}
                existingDerivedNames={[
                  ...derivedTimingsProfiles.map(p => p.columnName),
                  ...derivedFormulaProfiles.map(p => p.columnName),
                ]}
                onSave={handleCalcModalSave}
                onClose={() => setCalcModalOpen(null)}
              />
            )}
            {timeFactorsModalOpen != null && (
              <TimeAsFactorsModal
                sourceColumn={timeFactorsModalOpen.sourceColumn}
                timeColumns={timeColumns}
                existingBinding={timeDecompositionBindings.find(
                  b => b.sourceColumn === timeFactorsModalOpen.sourceColumn
                )}
                rows={rawData}
                onSave={handleTimeFactorsSave}
                onClose={() => setTimeFactorsModalOpen(null)}
              />
            )}
          </>
        ) : (
          canvasNode
        )}
      </div>
    </div>
  );
};
