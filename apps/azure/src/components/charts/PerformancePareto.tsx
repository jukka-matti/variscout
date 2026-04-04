/**
 * PerformancePareto - Azure App Wrapper
 *
 * Thin wrapper that connects the shared PerformancePareto component
 * to Zustand stores via derived hooks.
 */

import React from 'react';
import { PerformancePareto as PerformanceParetoBase } from '@variscout/charts';
import { usePerformanceAnalysis } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

interface PerformanceParetoProps {
  onChannelClick?: (channelId: string) => void;
  /** Maximum number of channels to display (default: 20) */
  maxDisplayed?: number;
}

const PerformancePareto: React.FC<PerformanceParetoProps> = ({ onChannelClick, maxDisplayed }) => {
  const performanceResult = usePerformanceAnalysis();
  const selectedMeasure = useProjectStore(s => s.selectedMeasure);

  return (
    <PerformanceParetoBase
      channels={performanceResult?.channels ?? []}
      selectedMeasure={selectedMeasure}
      onChannelClick={onChannelClick}
      maxDisplayed={maxDisplayed}
    />
  );
};

export default PerformancePareto;
