import React from 'react';
import {
  useCanvasStepCards,
  useCanvasInvestigationOverlays,
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
  useSessionCanvasFilters,
  useTranslation,
  type CanvasInvestigationFocus,
} from '@variscout/hooks';
import {
  detectColumns,
  detectScopeFromMap,
  rankYCandidates,
  type CausalLink,
  type ColumnAnalysis,
  type DataRow,
  type Finding,
  type ProcessContext,
  type ProcessHubInvestigation,
  type Question,
  type SpecLimits,
  type SuspectedCause,
  type TimelineWindow,
  type WorkflowReadinessSignals,
} from '@variscout/core';
import { createEmptyMap, detectGaps, type ProcessMap } from '@variscout/core/frame';
import { useCanvasStore } from '@variscout/stores';
import { Canvas, type CanvasAuthoringMode } from './index';
import { CanvasFilterChips } from '../CanvasFilterChips';
import { FrameViewB0, type FrameViewB0YCandidate } from '../FrameViewB0';
import type { XCandidate } from '../XPickerSection';
import type { ChipRailEntry } from '../ChipRail';

const DEFAULT_CPK_TARGET = 1.33;

export interface CanvasWorkspaceProps {
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
  signals: WorkflowReadinessSignals;
  onQuickAction?: (stepId: string) => void;
  onFocusedInvestigation?: (stepId: string) => void;
  onCharter?: (stepId: string) => void;
  onSustainment?: (stepId: string) => void;
  onHandoff?: (stepId: string) => void;
  questions?: readonly Question[];
  findings?: readonly Finding[];
  suspectedCauses?: readonly SuspectedCause[];
  causalLinks?: readonly CausalLink[];
  onOpenInvestigationFocus?: (focus: CanvasInvestigationFocus) => void;
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
  rawData,
  outcome,
  factors,
  measureSpecs,
  processContext,
  setOutcome,
  setFactors,
  setMeasureSpec,
  setProcessContext,
  signals,
  onSeeData,
  onQuickAction,
  onFocusedInvestigation,
  onCharter,
  onSustainment,
  onHandoff,
  questions = [],
  findings = [],
  suspectedCauses = [],
  causalLinks = [],
  onOpenInvestigationFocus,
}) => {
  const { t } = useTranslation();
  const fallbackMap = React.useMemo(() => createEmptyMap(), []);
  const availableColumns = React.useMemo(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : []),
    [rawData]
  );

  const map: ProcessMap = processContext?.processMap ?? fallbackMap;
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
      members: [] as ProcessHubInvestigation[],
      rowsByInvestigation: new Map<string, ReadonlyArray<DataRow>>(),
    };
  }, [map]);

  const data = useProductionLineGlanceData({
    hub: previewRollup.hub,
    members: previewRollup.members,
    rowsByInvestigation: previewRollup.rowsByInvestigation,
    contextFilter: filter.value,
  });

  const { cards: stepCards } = useCanvasStepCards({
    map,
    rows: rawData,
    measureSpecs,
    capabilityNodes: data.capabilityNodes,
    errorSteps: data.errorSteps,
  });

  const { overlays: investigationOverlays } = useCanvasInvestigationOverlays({
    map,
    questions,
    findings,
    suspectedCauses,
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
      map={map}
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
      investigationOverlays={investigationOverlays}
      signals={signals}
      onQuickAction={onQuickAction}
      onFocusedInvestigation={onFocusedInvestigation}
      onCharter={onCharter}
      onSustainment={onSustainment}
      onHandoff={onHandoff}
      onOpenInvestigationFocus={onOpenInvestigationFocus}
      mode={authoringMode}
      onModeChange={setAuthoringMode}
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
        {canvasNode}
      </div>
    </div>
  );
};
