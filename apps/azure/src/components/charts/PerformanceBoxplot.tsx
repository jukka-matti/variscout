/**
 * PerformanceBoxplot - Azure App Wrapper
 *
 * Thin wrapper that connects the shared PerformanceBoxplot component
 * to Zustand stores via derived hooks.
 */

import React from 'react';
import { PerformanceBoxplot as PerformanceBoxplotBase } from '@variscout/charts';
import { usePerformanceAnalysis } from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';

interface PerformanceBoxplotProps {
  onChannelClick?: (channelId: string) => void;
  /** Maximum number of channels to display (default: 5) */
  maxDisplayed?: number;
}

const PerformanceBoxplot: React.FC<PerformanceBoxplotProps> = ({
  onChannelClick,
  maxDisplayed,
}) => {
  const performanceResult = usePerformanceAnalysis();
  const selectedMeasure = useProjectStore(s => s.selectedMeasure);
  const specs = useProjectStore(s => s.specs);
  const displayOptions = useProjectStore(s => s.displayOptions);

  return (
    <PerformanceBoxplotBase
      channels={performanceResult?.channels ?? []}
      specs={specs}
      selectedMeasure={selectedMeasure}
      onChannelClick={onChannelClick}
      maxDisplayed={maxDisplayed}
      showViolin={displayOptions?.showViolin}
    />
  );
};

export default PerformanceBoxplot;
