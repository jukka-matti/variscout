/**
 * ProcessHubCapabilityTab — Process Hub view's Capability tab content.
 *
 * Composes the production-line-glance dashboard (full 2×2) with its filter
 * strip, scoped to the hub's data via useHubProvision +
 * useProductionLineGlanceData + useProductionLineGlanceFilter.
 *
 * Migration banner + modal are wired in T11 at hub-level (separate file).
 *
 * Multi-level SCOUT V1 (Task 13): the call site now consults `useDataRouter`
 * (via the standard mode strategy) as a sanity-check on the dataflow choice
 * and threads a `TimelineWindow` into `useProductionLineGlanceData`. The
 * dashboard composition itself stays hardcoded — slot-component-registry is
 * a V2/V3 concern and no such registry exists in V1.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * and docs/superpowers/specs/2026-04-29-multi-level-scout-design.md.
 */
import React, { useState } from 'react';
import {
  ProductionLineGlanceDashboard,
  ProductionLineGlanceFilterStrip,
  TimelineWindowPicker,
} from '@variscout/ui';
import {
  useDataRouter,
  useProductionLineGlanceData,
  useProductionLineGlanceFilter,
} from '@variscout/hooks';
import { detectScope } from '@variscout/core';
import type { TimelineWindow } from '@variscout/core';
import { useHubProvision } from '../features/processHub';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';

export interface ProcessHubCapabilityTabProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

const DEFAULT_WINDOW: TimelineWindow = { kind: 'cumulative' };

export const ProcessHubCapabilityTab: React.FC<ProcessHubCapabilityTabProps> = ({ rollup }) => {
  const provision = useHubProvision({ rollup });
  const filter = useProductionLineGlanceFilter();

  // Hub-level window state. Hub doesn't carry its own TimelineWindow envelope
  // in V1 — `useTimelineWindow` is keyed on a single ProcessHubInvestigation,
  // and the hub view aggregates many. Local useState is the correct V1 fit.
  // TODO(multi-level-scout V1.5): default the window to rolling matched to
  // hub.cadence on first mount.
  // TODO(multi-level-scout V2): wire hub-level window persistence.
  const [window, setWindow] = useState<TimelineWindow>(DEFAULT_WINDOW);

  // Scope detection: hub views are typically `b1` (multi-step, multi-member).
  // If a single representative member exists, use detectScope on it; otherwise
  // default to `b1` (the hub-aggregate scope).
  const scope = provision.members.length === 1 ? detectScope(provision.members[0]) : 'b1';

  // Sanity-check the dataflow choice via the strategy router. The actual hook
  // used (`useProductionLineGlanceData`) must remain known at compile time —
  // React forbids conditional hook calls. The router is a validation hook + a
  // V2/V3 extension point.
  const router = useDataRouter({
    mode: 'standard',
    modeOptions: { standardIChartMetric: 'capability' },
    scope,
    phase: 'hub',
    window,
    context: filter.value,
  });
  if (import.meta.env.DEV && router.hook !== 'useProductionLineGlanceData') {
    console.warn(
      `[ProcessHubCapabilityTab] dataRouter expected 'useProductionLineGlanceData', got '${router.hook}'`
    );
  }

  const data = useProductionLineGlanceData({
    hub: provision.hub,
    members: provision.members,
    rowsByInvestigation: provision.rowsByInvestigation,
    contextFilter: filter.value,
    window,
    // timeColumnByInvestigation is not reachable at hub level in V1; the hook
    // skips windowing for any member without a time column (safer fail-mode).
  });

  return (
    <div className="flex h-full flex-col">
      <ProductionLineGlanceFilterStrip
        availableContext={data.availableContext}
        contextValueOptions={data.contextValueOptions}
        value={filter.value}
        onChange={filter.onChange}
      />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-edge bg-surface">
        <TimelineWindowPicker window={window} onChange={setWindow} />
      </div>
      <div className="flex-1 min-h-0">
        <ProductionLineGlanceDashboard
          cpkTrend={data.cpkTrend}
          cpkGapTrend={data.cpkGapTrend}
          capabilityNodes={data.capabilityNodes}
          errorSteps={data.errorSteps}
        />
      </div>
    </div>
  );
};

export default ProcessHubCapabilityTab;
