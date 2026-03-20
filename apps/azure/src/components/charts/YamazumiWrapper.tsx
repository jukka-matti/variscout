/**
 * Azure YamazumiWrapper - Thin wrapper connecting DataContext to YamazumiChartBase
 */
import React from 'react';
import { YamazumiChartBase } from '@variscout/charts';
import type { YamazumiBarData } from '@variscout/core';
import type { HighlightColor } from '@variscout/charts';
import { isPaidTier } from '@variscout/core';

interface YamazumiWrapperProps {
  data: YamazumiBarData[];
  taktTime?: number;
  selectedBars?: string[];
  parentWidth: number;
  parentHeight: number;
  onBarClick?: (stepKey: string) => void;
  onBarContextMenu?: (key: string, event: React.MouseEvent) => void;
  highlightedBars?: Record<string, HighlightColor>;
}

const YamazumiWrapper: React.FC<YamazumiWrapperProps> = ({
  data,
  taktTime,
  selectedBars,
  parentWidth,
  parentHeight,
  onBarClick,
  onBarContextMenu,
  highlightedBars,
}) => {
  return (
    <YamazumiChartBase
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      data={data}
      taktTime={taktTime}
      selectedBars={selectedBars}
      onBarClick={onBarClick}
      onBarContextMenu={onBarContextMenu}
      highlightedBars={highlightedBars}
      showBranding={!isPaidTier()}
    />
  );
};

export default YamazumiWrapper;
