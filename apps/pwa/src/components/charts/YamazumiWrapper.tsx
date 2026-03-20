/**
 * PWA YamazumiWrapper - Thin wrapper that connects to YamazumiChartBase
 *
 * Follows the same withParentSize pattern as Boxplot.tsx and IChart.tsx.
 * Uses DashboardChartCard for consistent dashboard card styling.
 */
import React from 'react';
import { withParentSize } from '@visx/responsive';
import { YamazumiChartBase } from '@variscout/charts';
import type { YamazumiBarData } from '@variscout/core';
import type { HighlightColor } from '@variscout/charts';

interface YamazumiWrapperProps {
  parentWidth: number;
  parentHeight: number;
  data: YamazumiBarData[];
  taktTime?: number;
  selectedBars?: string[];
  onBarClick?: (stepKey: string) => void;
  onBarContextMenu?: (key: string, event: React.MouseEvent) => void;
  highlightedBars?: Record<string, HighlightColor>;
  showBranding?: boolean;
  showPercentLabels?: boolean;
}

const YamazumiWrapper: React.FC<YamazumiWrapperProps> = ({
  parentWidth,
  parentHeight,
  data,
  taktTime,
  selectedBars,
  onBarClick,
  onBarContextMenu,
  highlightedBars,
  showBranding,
  showPercentLabels,
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
      showBranding={showBranding}
      showPercentLabels={showPercentLabels}
    />
  );
};

export default withParentSize(YamazumiWrapper);
