/**
 * ProbabilityPlot - Shared wrapper for ProbabilityPlotBase
 *
 * Adds tier-aware branding, responsive margins/fonts to the multi-series
 * probability plot chart component.
 */
import React from 'react';
import { ProbabilityPlotBase, getSourceBarHeight } from '@variscout/charts';
import type { ProbabilityPlotSeries } from '@variscout/core';
import { shouldShowBranding, getBrandingText } from '@variscout/core';
import { useResponsiveChartMargins, useResponsiveChartFonts } from '@variscout/hooks';

export interface ProbabilityPlotProps {
  parentWidth: number;
  parentHeight: number;
  series: ProbabilityPlotSeries[];
  selectedPoints?: Set<number>;
  onSelectionChange?: (indices: Set<number>) => void;
  onChartContextMenu?: (anchorX: number, anchorY: number, seriesKey?: string) => void;
  onSeriesHover?: (
    series: ProbabilityPlotSeries | null,
    position: { x: number; y: number }
  ) => void;
}

export const ProbabilityPlot = ({
  parentWidth,
  parentHeight,
  series,
  selectedPoints,
  onSelectionChange,
  onChartContextMenu,
  onSeriesHover,
}: ProbabilityPlotProps) => {
  const showBranding = shouldShowBranding();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = useResponsiveChartMargins(parentWidth, 'probability', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);
  const brandingText = getBrandingText();

  return (
    <ProbabilityPlotBase
      series={series}
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      showBranding={showBranding}
      brandingText={brandingText}
      marginOverride={margin}
      fontsOverride={fonts}
      selectedPoints={selectedPoints}
      onSelectionChange={onSelectionChange}
      onChartContextMenu={onChartContextMenu}
      onSeriesHover={onSeriesHover}
    />
  );
};
