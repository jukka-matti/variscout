/**
 * PerformanceIChart - PWA Wrapper
 *
 * Thin wrapper that connects the shared PerformanceIChart component
 * to the PWA's DataContext.
 */

import React from 'react';
import { PerformanceIChart as PerformanceIChartBase, type CpkThresholds } from '@variscout/charts';
import { useData } from '../../context/DataContext';

interface PerformanceIChartProps {
  onChannelClick?: (channelId: string) => void;
  /** Which capability metric to display: 'cpk' (default) or 'cp' */
  capabilityMetric?: 'cp' | 'cpk';
  /** Custom Cpk thresholds for health classification (defaults to industry standards) */
  cpkThresholds?: CpkThresholds;
}

const PerformanceIChart: React.FC<PerformanceIChartProps> = ({
  onChannelClick,
  capabilityMetric = 'cpk',
  cpkThresholds,
}) => {
  const { performanceResult, selectedMeasure } = useData();

  return (
    <PerformanceIChartBase
      channels={performanceResult?.channels ?? []}
      selectedMeasure={selectedMeasure}
      onChannelClick={onChannelClick}
      capabilityMetric={capabilityMetric}
      cpkThresholds={cpkThresholds}
    />
  );
};

export default PerformanceIChart;
