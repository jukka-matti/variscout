/**
 * FrameView (Azure) — FRAME workspace (ADR-070).
 *
 * Azure-app equivalent of the PWA FrameView. Renders `LayeredProcessViewWithCapability`
 * wired to `projectStore.processContext.processMap` with live gap detection from
 * `@variscout/core/frame`.
 *
 * V1 is deterministic-only: no CoScout, no templates. Pre-data hunches
 * persist as draft SuspectedCause hubs through the projectStore +
 * investigationStore; the full integration lands in follow-up.
 *
 * Plan C2: ProductionLineGlanceDashboard is wired into the Operations band
 * via a synthetic preview rollup (empty rows — authoring surface has no
 * investigation data). Live-data wiring lands in C3 (right-hand drawer).
 */
import React from 'react';
import { LayeredProcessViewWithCapability } from '@variscout/ui';
import {
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
  useProductionLineGlanceOpsToggle,
} from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import type { ProcessContext, ProcessHub, ProcessHubInvestigation } from '@variscout/core';
import type { DataRow } from '@variscout/core';
import { createEmptyMap, detectGaps, type ProcessMap } from '@variscout/core/frame';

const FrameView: React.FC = () => {
  const rawData = useProjectStore(s => s.rawData);
  const outcome = useProjectStore(s => s.outcome);
  const measureSpecs = useProjectStore(s => s.measureSpecs);
  const setMeasureSpec = useProjectStore(s => s.setMeasureSpec);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);

  const availableColumns = React.useMemo(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : []),
    [rawData]
  );

  const map: ProcessMap = processContext?.processMap ?? createEmptyMap();

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

  return (
    <div className="flex-1 overflow-auto" data-testid="frame-view">
      <div className="mx-auto max-w-6xl">
        <header className="px-4 pt-4">
          <h2 className="text-lg font-semibold text-content">Frame the investigation</h2>
          <p className="text-sm text-content-secondary">
            Build your process map so the analysis has context. The map drives mode selection and a
            measurement-gap report; the methodology wants CTS at the ocean, a CTQ per step, and at
            least one rational-subgroup axis.
          </p>
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
