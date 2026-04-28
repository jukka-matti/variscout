/**
 * FrameView — PWA FRAME workspace (ADR-070).
 *
 * Renders `LayeredProcessViewWithCapability` wired to `projectStore.processContext.processMap`,
 * with live gap detection from `@variscout/core/frame`. The user builds the process map
 * (SIPOC spine + tributaries + ocean/CTS + hunches). V2+ will add CoScout drafting,
 * template libraries, and data-seeded skeletons — V1 is deterministic-only.
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
  const specs = useProjectStore(s => s.specs);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const processContext = useProjectStore(s => s.processContext);
  const setProcessContext = useProjectStore(s => s.setProcessContext);

  const availableColumns = React.useMemo(
    () => (rawData.length > 0 ? Object.keys(rawData[0]) : []),
    [rawData]
  );

  const map: ProcessMap = processContext?.processMap ?? createEmptyMap();

  const gaps = React.useMemo(
    () =>
      detectGaps({
        processMap: map,
        columns: availableColumns,
        outcomeColumn: outcome ?? undefined,
        specs: specs ?? undefined,
      }),
    [map, availableColumns, outcome, specs]
  );

  const handleChange = (next: ProcessMap) => {
    const baseContext: ProcessContext = processContext ?? {};
    setProcessContext({ ...baseContext, processMap: next });
  };

  const handleSpecsChange = (next: { target?: number; usl?: number; lsl?: number }) => {
    setSpecs({ ...(specs ?? {}), ...next });
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
          target={specs?.target}
          lsl={specs?.lsl}
          usl={specs?.usl}
          onSpecsChange={handleSpecsChange}
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
