/**
 * FrameView — PWA FRAME workspace (ADR-070).
 *
 * Renders the `ProcessMapBase` component wired to `projectStore.processContext.processMap`,
 * with live gap detection from `@variscout/core/frame`. The user builds the process map
 * (SIPOC spine + tributaries + ocean/CTS + hunches). V2+ will add CoScout drafting,
 * template libraries, and data-seeded skeletons — V1 is deterministic-only.
 */
import React from 'react';
import { ProcessMapBase } from '@variscout/ui';
import { useProjectStore } from '@variscout/stores';
import type { ProcessContext } from '@variscout/core';
import { detectGaps, type ProcessMap } from '@variscout/core/frame';

const createEmptyMap = (): ProcessMap => {
  const now = new Date().toISOString();
  return {
    version: 1,
    nodes: [],
    tributaries: [],
    createdAt: now,
    updatedAt: now,
  };
};

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
        <ProcessMapBase
          map={map}
          availableColumns={availableColumns}
          onChange={handleChange}
          gaps={gaps}
          target={specs?.target}
          lsl={specs?.lsl}
          usl={specs?.usl}
          onSpecsChange={handleSpecsChange}
        />
      </div>
    </div>
  );
};

export default FrameView;
