/**
 * ProcessHubCapabilityTab — Process Hub view's Capability tab content.
 *
 * Composes the production-line-glance dashboard (full 2×2) with its filter
 * strip, scoped to the hub's data via useHubProvision +
 * useProductionLineGlanceData + useProductionLineGlanceFilter.
 *
 * Migration banner + modal are wired in T11 at hub-level (separate file).
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md.
 */
import React from 'react';
import { ProductionLineGlanceDashboard, ProductionLineGlanceFilterStrip } from '@variscout/ui';
import { useProductionLineGlanceData, useProductionLineGlanceFilter } from '@variscout/hooks';
import { useHubProvision } from '../features/processHub';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';

export interface ProcessHubCapabilityTabProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

export const ProcessHubCapabilityTab: React.FC<ProcessHubCapabilityTabProps> = ({ rollup }) => {
  const provision = useHubProvision({ rollup });
  const filter = useProductionLineGlanceFilter();
  const data = useProductionLineGlanceData({
    hub: provision.hub,
    members: provision.members,
    rowsByInvestigation: provision.rowsByInvestigation,
    contextFilter: filter.value,
  });

  return (
    <div className="flex h-full flex-col">
      <ProductionLineGlanceFilterStrip
        availableContext={data.availableContext}
        contextValueOptions={data.contextValueOptions}
        value={filter.value}
        onChange={filter.onChange}
      />
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
