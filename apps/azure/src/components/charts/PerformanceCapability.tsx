/**
 * PerformanceCapability - Azure App Wrapper
 *
 * Thin wrapper that connects the shared PerformanceCapability component
 * to Zustand stores via derived hooks.
 */

import React, { useMemo } from 'react';
import { PerformanceCapability as PerformanceCapabilityBase } from '@variscout/charts';
import { usePerformanceAnalysis } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

const PerformanceCapability: React.FC = () => {
  const performanceResult = usePerformanceAnalysis();
  const selectedMeasure = useProjectStore(s => s.selectedMeasure);
  const specs = useProjectStore(s => s.specs);

  // Get the selected channel's data
  const selectedChannel = useMemo(() => {
    if (!selectedMeasure || !performanceResult) return null;
    return performanceResult.channels.find(c => c.id === selectedMeasure) ?? null;
  }, [performanceResult, selectedMeasure]);

  return <PerformanceCapabilityBase channel={selectedChannel} specs={specs} />;
};

export default PerformanceCapability;
