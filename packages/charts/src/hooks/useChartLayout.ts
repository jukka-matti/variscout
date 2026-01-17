/**
 * useChartLayout - Consolidated chart layout hook
 *
 * Combines all the common chart initialization logic:
 * - Font scale from theme
 * - Source bar height calculation
 * - Responsive margins
 * - Scaled fonts
 * - Inner dimensions
 */

import { useMemo } from 'react';
import type { ChartMargins, ChartFonts } from '../types';
import { useChartTheme } from '../useChartTheme';
import { getSourceBarHeight } from '../ChartSourceBar';
import { getResponsiveMargins, getScaledFonts, type ChartType } from '../responsive';

export interface UseChartLayoutOptions {
  /** Container width in pixels */
  parentWidth: number;
  /** Container height in pixels */
  parentHeight: number;
  /** Chart type for margin calculation */
  chartType: ChartType;
  /** Whether to show branding bar */
  showBranding?: boolean;
  /** Override margins (bypasses responsive calculation) */
  marginOverride?: ChartMargins;
  /** Override fonts (bypasses responsive calculation) */
  fontsOverride?: ChartFonts;
}

export interface ChartLayout {
  /** Scaled font sizes */
  fonts: ChartFonts;
  /** Chart margins */
  margin: ChartMargins;
  /** Height of source/branding bar */
  sourceBarHeight: number;
  /** Inner chart width (parentWidth - margins) */
  width: number;
  /** Inner chart height (parentHeight - margins) */
  height: number;
  /** Font scale multiplier from theme */
  fontScale: number;
}

/**
 * Hook that consolidates all chart layout calculations
 *
 * @example
 * ```tsx
 * const layout = useChartLayout({
 *   parentWidth,
 *   parentHeight,
 *   chartType: 'ichart',
 *   showBranding
 * });
 * const { fonts, margin, width, height, sourceBarHeight } = layout;
 * ```
 */
export function useChartLayout(options: UseChartLayoutOptions): ChartLayout {
  const {
    parentWidth,
    parentHeight,
    chartType,
    showBranding = true,
    marginOverride,
    fontsOverride,
  } = options;

  const { fontScale } = useChartTheme();

  return useMemo(() => {
    const sourceBarHeight = getSourceBarHeight(showBranding);
    const margin = marginOverride ?? getResponsiveMargins(parentWidth, chartType, sourceBarHeight);
    const fonts = fontsOverride ?? getScaledFonts(parentWidth, fontScale);
    const width = Math.max(0, parentWidth - margin.left - margin.right);
    const height = Math.max(0, parentHeight - margin.top - margin.bottom);

    return {
      fonts,
      margin,
      sourceBarHeight,
      width,
      height,
      fontScale,
    };
  }, [
    parentWidth,
    parentHeight,
    chartType,
    showBranding,
    marginOverride,
    fontsOverride,
    fontScale,
  ]);
}
