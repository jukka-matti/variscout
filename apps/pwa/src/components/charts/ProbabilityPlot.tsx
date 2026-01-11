import React from 'react';
import { withParentSize } from '@visx/responsive';
import { ProbabilityPlotBase } from '@variscout/charts';
import { getSourceBarHeight } from '@variscout/charts';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
} from '../../hooks/useResponsiveChartMargins';
import ChartSignature from './ChartSignature';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';

interface ProbabilityPlotProps {
  parentWidth: number;
  parentHeight: number;
  data: number[];
  mean: number;
  stdDev: number;
}

/**
 * PWA wrapper for ProbabilityPlot
 * Uses package component with PWA-specific hooks and branding
 */
const ProbabilityPlot = ({
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

export default withParentSize(ProbabilityPlot);
