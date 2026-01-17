import { useMemo } from 'react';
import {
  getResponsiveMargins,
  getResponsiveFonts,
  getResponsiveTickCount,
  getBreakpoints,
  type ChartMargins,
  type ChartFonts,
  type ChartType,
} from '@variscout/charts';

// Re-export types for convenience
export type { ChartMargins, ChartFonts, ChartType };

/**
 * React hook wrapper for getResponsiveMargins from @variscout/charts
 *
 * @param containerWidth - The width of the chart container in pixels
 * @param chartType - The type of chart (affects base margins)
 * @param additionalBottomSpace - Extra space for source bar or legends
 * @returns ChartMargins object with top, right, bottom, left values
 */
export function useResponsiveChartMargins(
  containerWidth: number,
  chartType: ChartType = 'ichart',
  additionalBottomSpace: number = 0
): ChartMargins {
  return useMemo(
    () => getResponsiveMargins(containerWidth, chartType, additionalBottomSpace),
    [containerWidth, chartType, additionalBottomSpace]
  );
}

/**
 * React hook wrapper for getResponsiveFonts from @variscout/charts
 *
 * @param containerWidth - The width of the chart container in pixels
 * @returns Object with font sizes for different chart elements
 */
export function useResponsiveChartFonts(containerWidth: number): ChartFonts {
  return useMemo(() => getResponsiveFonts(containerWidth), [containerWidth]);
}

/**
 * React hook wrapper for getResponsiveTickCount from @variscout/charts
 *
 * @param availableSize - Available width or height in pixels
 * @param type - Whether this is for x-axis (width) or y-axis (height)
 * @returns Recommended number of ticks
 */
export function useResponsiveTickCount(availableSize: number, type: 'x' | 'y' = 'x'): number {
  return useMemo(() => getResponsiveTickCount(availableSize, type), [availableSize, type]);
}

/**
 * React hook wrapper for getBreakpoints from @variscout/charts
 *
 * @param containerWidth - The width of the container
 * @returns Object with boolean flags for different screen sizes
 */
export function useResponsiveBreakpoints(containerWidth: number) {
  return useMemo(() => getBreakpoints(containerWidth), [containerWidth]);
}
