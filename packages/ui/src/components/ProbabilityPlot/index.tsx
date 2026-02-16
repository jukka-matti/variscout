/**
 * ProbabilityPlot - Shared wrapper for ProbabilityPlotBase
 *
 * Adds tier-aware branding, responsive margins/fonts, and optional signature
 * to the shared chart component.
 */
import React from 'react';
import { ProbabilityPlotBase, getSourceBarHeight, ChartSignature } from '@variscout/charts';
import { shouldShowBranding, getBrandingText } from '@variscout/core';
import { useResponsiveChartMargins, useResponsiveChartFonts } from '@variscout/hooks';

export interface ProbabilityPlotProps {
  parentWidth: number;
  parentHeight: number;
  data: number[];
  mean: number;
  stdDev: number;
}

export const ProbabilityPlot = ({
  parentWidth,
  parentHeight,
  data,
  mean,
  stdDev,
}: ProbabilityPlotProps) => {
  const showBranding = shouldShowBranding();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = useResponsiveChartMargins(parentWidth, 'probability', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);
  const brandingText = getBrandingText();

  // Calculate dimensions for signature positioning
  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Create signature element with correct positioning
  const signatureElement = (
    <ChartSignature x={width - 10} y={height + margin.bottom - sourceBarHeight - 18} />
  );

  return (
    <ProbabilityPlotBase
      data={data}
      mean={mean}
      stdDev={stdDev}
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      showBranding={showBranding}
      brandingText={brandingText}
      marginOverride={margin}
      fontsOverride={fonts}
      signatureElement={signatureElement}
    />
  );
};
