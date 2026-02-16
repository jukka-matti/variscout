/**
 * PerformanceBoxplot - Azure App Wrapper
 *
 * Thin wrapper that connects the shared PerformanceBoxplot component
 * to the Azure app's DataContext.
 */

import React from 'react';
import { PerformanceBoxplot as PerformanceBoxplotBase } from '@variscout/charts';
import { useData } from '../../context/DataContext';

interface PerformanceBoxplotProps {
  onChannelClick?: (channelId: string) => void;
  /** Maximum number of channels to display (default: 5) */
  maxDisplayed?: number;
}

const PerformanceBoxplot: React.FC<PerformanceBoxplotProps> = ({
  onChannelClick,
  maxDisplayed,
}) => {
  const { performanceResult, selectedMeasure, specs, displayOptions } = useData();

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
