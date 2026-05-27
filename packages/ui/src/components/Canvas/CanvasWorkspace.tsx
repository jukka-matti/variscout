import React from 'react';
import {
  useCanvasStepCards,
  useCanvasAnalyzeOverlays,
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
  useSessionCanvasFilters,
  useTranslation,
  type CanvasAnalyzeFocus,
} from '@variscout/hooks';
import {
  computeFormulaColumn,
  computeLeadTimeColumn,
  computeTotalWorkTimeColumn,
  computeWaitTimeColumn,
  detectBatchData,
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
  type ProcessContext,
  type ProcessHubId,
  type ProcessHubAnalyze,
  type Question,
  type SpecLimits,
  type StepCapabilityStamp,
  type StepTimingBinding,
  type Hypothesis,
  type TimelineWindow,
} from '@variscout/core';
import { isValidLevel, type CanvasLevel } from '@variscout/core/canvas';
import type { ActionItem } from '@variscout/core/findings';
import { createEmptyMap, detectGaps, type ProcessMap } from '@variscout/core/frame';
import { profileColumns, type ColumnParsingProfile } from '@variscout/core/parser';
import { useCanvasStore } from '@variscout/stores';
import { useCanvasViewportStore, type CanvasViewportSnapshot } from '@variscout/stores';
import { Canvas, type CanvasAuthoringMode, type CanvasL3Archetype } from './index';
import { EditModeShell } from './EditMode';
import type { ExtractedStep } from './EditMode/ProcessZone/extractStepsFromCategoricalColumn';
import type { SystemHint } from './EditMode/Palette';
import { StepTimingsModal } from './EditMode/Workflows/StepTimingsModal';
import { CalculatedColumnModal } from './EditMode/Workflows/CalculatedColumnModal';
import { formatDuration } from './EditMode/formatDuration';
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
  onQuickAction?: (stepId: string) => void;
  onLogQuickAction?: (stepId: string, payload: LogActionPayload) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  questions?: readonly Question[];
  findings?: readonly Finding[];
  hypotheses?: readonly Hypothesis[];
  causalLinks?: readonly CausalLink[];
  problemCpk?: number;
  eventsPerWeek?: number;
  activeColumns?: ReadonlyArray<string>;
  onOpenWall?: () => void;
  onOpenScout?: (hubId: ProcessHubId) => void;
  onAddCausalLink?: (
    fromFactor: string,
    toFactor: string,
    whyStatement: string,
    options?: { questionIds?: string[] }
  ) => void;
  onRemoveCausalLink?: (linkId: string) => void;
  onOpenInvestigationFocus?: (focus: CanvasAnalyzeFocus) => void;
  onOpenColumnDetail?: (column: string, stepId: string) => void;
  contextLinkGroups?: readonly ContextLinkGroup[];
  onNavigateContextLink?: (item: ContextLinkItem) => void;
  priorStepStats?: ReadonlyMap<string, StepCapabilityStamp>;
  actionItems?: ActionItem[];
  /** When false, hides the Edit/State toggle and forces State mode.
   *  When undefined or true, the toggle is shown and Edit mode is reachable.
   *  Azure derives this from canAccess(currentUserId, members, 'edit');
   *  PWA passes true (no membership model). */
  canEditCanvas?: boolean;
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
  onQuickAction,
  onLogQuickAction,
  onFocusedInvestigation,
  onCharter,
  questions = [],
  findings = [],
  hypotheses = [],
  causalLinks = [],
  problemCpk,
  eventsPerWeek,
  activeColumns,
  onOpenWall,
  onOpenScout,
  onAddCausalLink,
  onRemoveCausalLink,
  onOpenInvestigationFocus,
  onOpenColumnDetail,
  contextLinkGroups,
  onNavigateContextLink,
  priorStepStats,
  actionItems = [],
  canEditCanvas,
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
  const removeStep = useCanvasStore(state => state.removeStep);
  const renameStep = useCanvasStore(state => state.renameStep);
  const connectSteps = useCanvasStore(state => state.connectSteps);
  const disconnectSteps = useCanvasStore(state => state.disconnectSteps);
  const groupIntoSubStep = useCanvasStore(state => state.groupIntoSubStep);
  const ungroupSubStep = useCanvasStore(state => state.ungroupSubStep);
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

  const previewRollup = React.useMemo(() => {
    const previewHub = {
      id: 'frame-preview',
      canonicalProcessMap: map,
      contextColumns: [],
    };
    return {
      hub: previewHub,
      members: [] as ProcessHubAnalyze[],
      rowsByAnalyze: new Map<string, ReadonlyArray<DataRow>>(),
    };
  }, [map]);

  const data = useProductionLineGlanceData({
    hub: previewRollup.hub,
    members: previewRollup.members,
    rowsByAnalyze: previewRollup.rowsByAnalyze,
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
    questions,
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

  const [authoringMode, setAuthoringMode] = React.useState<CanvasAuthoringMode>(() =>
    map.nodes.length > 0 && chips.length === 0 ? 'read' : 'author'
  );

  // C3 Task 4: local state for emergent process steps materialized from a
  // categorical-column drop on the ProcessStructureZone. The Charter modal
  // (PR-CCJ-E1) is where these will be persisted onto the ImprovementProject;
  // until then the local state gives the drop a visible effect for QA + E2E.
  const [processSteps, setProcessSteps] = React.useState<
    { id: string; name: string; order: number }[]
  >([]);

  // D1 Task 10: local state for step timing bindings captured via the
  // StepTimingsModal. Drives the derived Lead_time / Total_work_time /
  // Wait_time columns + the per-step "⏱ ~ <duration>" timing badges.
  // TODO(PR-CCJ-E1): persist stepTimings to ImprovementProject via Charter modal commit.
  const [stepTimings, setStepTimings] = React.useState<StepTimingBinding[]>([]);
  const [stepTimingsModalOpen, setStepTimingsModalOpen] = React.useState(false);

  // D2 Task 10: local state for formula bindings saved via the
  // CalculatedColumnModal. Task 11 synthesises derived profiles from these
  // bindings; Task 10 only persists the binding in local state + closes the modal.
  // TODO(PR-CCJ-E1): persist formulaBindings to ImprovementProject via Charter modal commit.
  const [formulaBindings, setFormulaBindings] = React.useState<FormulaBinding[]>([]);
  const [calcModalOpen, setCalcModalOpen] = React.useState<{ sourceColumn?: string } | null>(null);

  const onChipContextMenuSelect = React.useCallback((columnName: string, itemId: string) => {
    if (itemId === 'calculate-from') {
      setCalcModalOpen({ sourceColumn: columnName });
    }
    // Other itemIds (rename, view-distribution, etc.) are handled at the Palette level
    // or fall through. CanvasWorkspace only owns calculate-from for now.
  }, []);

  const handleStepsReplace = React.useCallback(
    (next: ExtractedStep[], _sourceColumnName: string) => {
      // TODO(PR-CCJ-E1): persist into ImprovementProject.processSteps via the
      //   Charter modal commit; sourceColumnName becomes provenance.
      setProcessSteps(next);
    },
    []
  );

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
  // Computed from rawData via the parser engine; passed to EditModeShell so the
  // palette renders raw column chips, and forwarded to StepTimingsModal so it
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

  const editModeProfiles = React.useMemo<ColumnParsingProfile[]>(
    () => [...rawProfiles, ...derivedTimingsProfiles, ...derivedFormulaProfiles],
    [rawProfiles, derivedTimingsProfiles, derivedFormulaProfiles]
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

  // D2 Task 11: batch-data detection drives the palette's contextual hint
  // banner. When the heuristic finds input/output mass-balance columns
  // (`Input_kg`, `GradeA_kg`, etc.), the banner invites the user to open the
  // CalculatedColumnModal pre-targeted at yield-ratio templates.
  const batchDataResult = React.useMemo(() => detectBatchData(rawProfiles), [rawProfiles]);

  const systemHints = React.useMemo<SystemHint[]>(() => {
    const hints: SystemHint[] = [];
    if (batchDataResult !== null) {
      hints.push({
        id: 'batch-detected',
        kind: 'batch',
        message:
          '💡 Batch data detected. Input/output mass columns found — calculate yield ratios?',
        ctaLabel: 'Calculate yield ratios →',
        onCta: () => setCalcModalOpen({ sourceColumn: undefined }),
      });
    }
    return hints;
  }, [batchDataResult]);

  // When access is revoked at runtime, snap back to State mode so the user
  // is never stranded in Edit mode without the Done affordance.
  React.useEffect(() => {
    if (canEditCanvas === false && authoringMode === 'author') {
      setAuthoringMode('read');
    }
  }, [authoringMode, canEditCanvas]);

  const effectiveAuthoringMode: CanvasAuthoringMode =
    canEditCanvas === false ? 'read' : authoringMode;
  const handleAuthoringModeChange = React.useCallback(
    (next: CanvasAuthoringMode) => {
      if (canEditCanvas === false) return;
      setAuthoringMode(next);
    },
    [canEditCanvas]
  );

  const l3Archetype: CanvasL3Archetype = effectiveAuthoringMode === 'author' ? 'b1' : 'b0';

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
      systemQuestions={questions}
      hypotheses={hypotheses}
      investigationOverlays={investigationOverlays}
      questions={questions}
      findings={findings}
      problemCpk={problemCpk}
      eventsPerWeek={eventsPerWeek}
      activeColumns={activeColumns ?? availableColumns}
      onOpenScout={onOpenScout}
      onOpenWall={onOpenWall}
      onAddCausalLink={onAddCausalLink}
      onRemoveCausalLink={onRemoveCausalLink}
      onQuickAction={onQuickAction}
      onLogQuickAction={onLogQuickAction}
      onFocusedInvestigation={onFocusedInvestigation}
      onCharter={onCharter}
      onOpenInvestigationFocus={onOpenInvestigationFocus}
      onOpenColumnDetail={onOpenColumnDetail}
      contextLinkGroups={contextLinkGroups}
      onNavigateContextLink={onNavigateContextLink}
      actionItems={actionItems}
      mode={effectiveAuthoringMode}
      l3Archetype={l3Archetype}
      onModeChange={canEditCanvas === false ? undefined : handleAuthoringModeChange}
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
      onUndo={handleUndo}
      onRedo={handleRedo}
    />
  );

  const handleShellDone = React.useCallback(() => {
    if (canEditCanvas === false) return;
    setAuthoringMode('read');
  }, [canEditCanvas]);

  const showEditShell = effectiveAuthoringMode === 'author' && canEditCanvas !== false;

  if (scope === 'b0') {
    return (
      <div className="flex-1 overflow-auto" data-testid="frame-view">
        <FrameViewB0
          yCandidates={yCandidates}
          selectedY={outcome}
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
          <h2 className="text-lg font-semibold text-content">{t('frame.b1.heading')}</h2>
          <p className="text-sm text-content-secondary">{t('frame.b1.description')}</p>
        </header>
        {showEditShell ? (
          <>
            <EditModeShell
              onDone={handleShellDone}
              profiles={editModeProfiles}
              numericValuesByColumn={numericValuesByColumn}
              systemHints={systemHints}
              steps={processSteps}
              categoricalDistinctValuesByColumn={categoricalDistinctValuesByColumn}
              onMenuItemSelect={onChipContextMenuSelect}
              onStepsReplace={handleStepsReplace}
              onCaptureStepTimings={() => setStepTimingsModalOpen(true)}
              timingByStepId={timingByStepId}
            />
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
                onSave={binding => {
                  setFormulaBindings(prev => [...prev, binding]);
                  setCalcModalOpen(null);
                }}
                onClose={() => setCalcModalOpen(null)}
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
