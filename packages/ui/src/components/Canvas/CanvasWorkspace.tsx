import React from 'react';
import {
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
  useProductionLineGlanceOpsToggle,
  useSessionCanvasFilters,
  useTranslation,
} from '@variscout/hooks';
import {
  detectColumns,
  detectScopeFromMap,
  rankYCandidates,
  type ColumnAnalysis,
  type DataRow,
  type ProcessContext,
  type ProcessHubInvestigation,
  type SpecLimits,
  type TimelineWindow,
} from '@variscout/core';
import { createEmptyMap, detectGaps, type ProcessMap } from '@variscout/core/frame';
import { Canvas } from './index';
import { CanvasFilterChips } from '../CanvasFilterChips';
import { FrameViewB0, type FrameViewB0YCandidate } from '../FrameViewB0';
import type { XCandidate } from '../XPickerSection';

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

function computeMeanPlusMinusSigma(
  outcome: string | null,
  rawData: readonly DataRow[]
): { target?: number; usl?: number; lsl?: number } | undefined {
  if (!outcome) return undefined;
  const values = numericValuesFor(outcome, rawData);
  if (values.length < 2) return undefined;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (values.length - 1);
  const sigma = Math.sqrt(variance);
  if (!Number.isFinite(sigma)) return undefined;
  return { target: mean, usl: mean + 3 * sigma, lsl: mean - 3 * sigma };
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
  onSeeData,
}) => {
  const { t } = useTranslation();
  const availableColumns = React.useMemo(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : []),
    [rawData]
  );

  const map: ProcessMap = processContext?.processMap ?? createEmptyMap();
  const scope = detectScopeFromMap(map);
  const ctsColumn = map.ctsColumn;
  const ctsSpecs = ctsColumn ? measureSpecs[ctsColumn] : undefined;

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
  const ops = useProductionLineGlanceOpsToggle();
  const {
    timelineWindow,
    setTimelineWindow,
    scopeFilter,
    setScopeFilter,
    paretoGroupBy,
    setParetoGroupBy,
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

  const yspecSuggestion = React.useMemo(
    () => computeMeanPlusMinusSigma(outcome, rawData),
    [outcome, rawData]
  );

  const handleConfirmYSpec = React.useCallback(
    (values: Partial<SpecLimits>) => {
      if (!outcome) return;
      setMeasureSpec(outcome, values);
    },
    [outcome, setMeasureSpec]
  );

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
      mode={ops.mode}
      onModeChange={ops.setMode}
      showGaps={scope !== 'b0'}
      canvasFilterChips={canvasFilterChipsNode}
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
          yspecSuggestion={yspecSuggestion}
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
