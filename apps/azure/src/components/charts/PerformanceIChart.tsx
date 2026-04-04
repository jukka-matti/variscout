/**
 * PerformanceIChart - Azure App Wrapper
 *
 * Thin wrapper that connects the shared PerformanceIChart component
 * to Zustand stores via derived hooks.
 */

import React from 'react';
import { PerformanceIChart as PerformanceIChartBase } from '@variscout/charts';
import { usePerformanceAnalysis } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

interface PerformanceIChartProps {
  onChannelClick?: (channelId: string) => void;
  /** Which capability metric to display: 'cpk' (default), 'cp', or 'both' */
  capabilityMetric?: 'cp' | 'cpk' | 'both';
  /** User-defined Cpk/Cp target line (default: 1.33) */
  cpkTarget?: number;
}

const PerformanceIChart: React.FC<PerformanceIChartProps> = ({
  onChannelClick,
  capabilityMetric = 'cpk',
  cpkTarget,
}) => {
  const performanceResult = usePerformanceAnalysis();
  const selectedMeasure = useProjectStore(s => s.selectedMeasure);

  return (
    <PerformanceIChartBase
      channels={performanceResult?.channels ?? []}
      selectedMeasure={selectedMeasure}
      onChannelClick={onChannelClick}
      capabilityMetric={capabilityMetric}
      cpkTarget={cpkTarget}
    />
  );
};

export default PerformanceIChart;
