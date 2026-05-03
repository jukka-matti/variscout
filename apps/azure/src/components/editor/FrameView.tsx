/**
 * FrameView (Azure) — FRAME workspace (ADR-070).
 *
 * Branches on scope (b0 vs b1/b2):
 *
 * - **b0** (no process steps yet): renders the lightweight `<FrameViewB0 />`
 *   — Y / X picker + inline spec editor + collapsed steps expander wrapping
 *   the canvas + "See the data" CTA. Existing canvas runs with
 *   `showGaps={false}` because b0 surfaces missing-spec via inline
 *   affordances, not the upfront GapStrip warning.
 * - **b1 / b2** (one or more process steps): renders the existing
 *   `<LayeredProcessViewWithCapability />` canvas as before.
 *
 * Plan C2: ProductionLineGlanceDashboard is wired into the Operations band
 * via a synthetic preview rollup (empty rows — authoring surface has no
 * investigation data).
 */
import React from 'react';
import {
  FrameViewB0,
  type FrameViewB0YCandidate,
  LayeredProcessViewWithCapability,
} from '@variscout/ui';
import {
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
  useProductionLineGlanceOpsToggle,
  useTranslation,
} from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import {
  detectColumns,
  detectScopeFromMap,
  rankYCandidates,
  type ColumnAnalysis,
  type DataRow,
  type ProcessContext,
  type ProcessHub,
  type ProcessHubInvestigation,
  type SpecLimits,
} from '@variscout/core';
import { createEmptyMap, detectGaps, type ProcessMap } from '@variscout/core/frame';
import type { XCandidate } from '@variscout/ui';
import { usePanelsStore } from '../../features/panels/panelsStore';

const DEFAULT_CPK_TARGET = 1.33;

/** Toggle a value in/out of an array, returning a fresh array. */
function toggleArray<T>(arr: readonly T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

/** Extract finite numeric values for a column. Used for chip sparklines. */
function numericValuesFor(column: string, rows: readonly DataRow[]): number[] {
  const out: number[] = [];
  for (const row of rows) {
    const raw = row[column];
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/**
 * Compute mean ± 3σ as a spec suggestion. Returns undefined when there is
 * no Y or fewer than 2 finite samples (sample-stdev needs n ≥ 2).
 */
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

/** Build a level breakdown for a categorical column (for X picker chip). */
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

/** Map a ColumnAnalysis to an XCandidate, choosing values vs. levels by type. */
function toXCandidate(column: ColumnAnalysis, rows: readonly DataRow[]): XCandidate {
  if (column.type === 'numeric') {
    return { column, numericValues: numericValuesFor(column.name, rows) };
  }
  return { column, levels: levelsFor(column.name, rows) };
}

const FrameView: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const setFactors = useProjectStore(s => s.setFactors);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);

  const availableColumns = React.useMemo(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : []),
    [rawData]
  );

  const map: ProcessMap = processContext?.processMap ?? createEmptyMap();
  const scope = detectScopeFromMap(map);

  // Phase D: per-column FRAME spec edits keyed off the canonical map's CTS column.
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

  const handleChange = (next: ProcessMap) => {
    const baseContext: ProcessContext = processContext ?? {};
    setProcessContext({ ...baseContext, processMap: next });
  };

  const handleSpecsChange = (next: {
    target?: number;
    usl?: number;
    lsl?: number;
    cpkTarget?: number;
  }) => {
    if (!ctsColumn) return; // No CTS picked yet — silently ignore until the user picks one.
    setMeasureSpec(ctsColumn, next);
  };

  // Plan C2: URL-backed filter + ops-mode state.
  const filter = useProductionLineGlanceFilter();
  const ops = useProductionLineGlanceOpsToggle();

  // Synthetic preview rollup — FrameView is a canonical-map authoring surface;
  // investigation rows are not loaded here. The dashboard renders empty-state
  // gracefully. Live data wiring lands in C3 (right-hand drawer).
  const previewRollup = React.useMemo(() => {
    const previewHub: ProcessHub = {
      id: 'frame-preview',
      name: 'Frame preview',
      canonicalProcessMap: map,
      canonicalMapVersion: 'preview',
      contextColumns: [],
    } as unknown as ProcessHub;
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

  // ── b0 derived inputs (column ranking, spec suggestion, callbacks) ────────
  const detected = React.useMemo(
    () => (rawData.length > 0 ? detectColumns(rawData) : null),
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
          // Spec §3.4: X picker shows "categorical + continuous-not-Y". Exclude
          // date/text types (e.g. a secondary unspecified date column or a
          // high-cardinality free-text column) — they are not plausible factors.
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

  const handleSeeData = React.useCallback(() => {
    usePanelsStore.getState().showAnalysis();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
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
          onSeeData={handleSeeData}
        >
          <LayeredProcessViewWithCapability
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
            showGaps={false}
          />
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
        <LayeredProcessViewWithCapability
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
        />
      </div>
    </div>
  );
};

export default FrameView;
