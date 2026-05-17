/**
 * ProbabilityPlot - Shared wrapper for ProbabilityPlotBase
 *
 * Adds responsive margins/fonts and optional branding (apps decide via the
 * `showBranding` prop) to the multi-series probability plot chart component.
 */
import React from 'react';
import { ProbabilityPlotBase, getSourceBarHeight } from '@variscout/charts';
import type { ProbabilityPlotSeries } from '@variscout/core';
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
  /** Render the VariScout source-bar branding when true. Defaults to false. */
  showBranding?: boolean;
  /** Branding text (only used when showBranding=true). Defaults to "VariScout Lite". */
  brandingText?: string;
}

export const ProbabilityPlot = ({
  parentWidth,
  parentHeight,
  series,
  selectedPoints,
  onSelectionChange,
  onChartContextMenu,
  onSeriesHover,
  showBranding: showBrandingProp,
  brandingText: brandingTextProp,
}: ProbabilityPlotProps) => {
  const showBranding = showBrandingProp ?? false;
  const brandingText = brandingTextProp ?? 'VariScout Lite';
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = useResponsiveChartMargins(parentWidth, 'probability', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);

  return (
    <ProbabilityPlotBase
      series={series}
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      showBranding={showBranding}
      brandingText={showBranding ? brandingText : undefined}
      marginOverride={margin}
      fontsOverride={fonts}
      selectedPoints={selectedPoints}
      onSelectionChange={onSelectionChange}
      onChartContextMenu={onChartContextMenu}
      onSeriesHover={onSeriesHover}
    />
  );
};
