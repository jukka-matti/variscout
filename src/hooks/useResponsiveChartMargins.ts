import { useMemo } from 'react';

export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ChartType = 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'probability';

/**
 * Calculate responsive margins based on container width.
 * Uses a proportional approach for small screens while maintaining
 * minimum readable margins for axis labels.
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
  return useMemo(() => {
    // Breakpoint thresholds
    const isMobile = containerWidth < 400;
    const isTablet = containerWidth >= 400 && containerWidth < 768;

    // Base margins per chart type (desktop defaults)
    const baseMargins: Record<ChartType, ChartMargins> = {
      ichart: { top: 40, right: 60, bottom: 60, left: 70 },
      boxplot: { top: 20, right: 20, bottom: 60, left: 70 },
      pareto: { top: 20, right: 20, bottom: 60, left: 70 },
      histogram: { top: 20, right: 20, bottom: 40, left: 40 },
      probability: { top: 20, right: 20, bottom: 40, left: 50 },
    };

    const base = baseMargins[chartType];

    if (isMobile) {
      // Mobile: Aggressive reduction, percentage-based
      // Left margin: ~12% of width (min 35px for 2-digit numbers)
      // Right margin: 5% of width (min 15px)
      return {
        top: Math.min(base.top, 20),
        right: Math.max(15, Math.round(containerWidth * 0.05)),
        bottom: Math.min(base.bottom, 40) + additionalBottomSpace,
        left: Math.max(35, Math.round(containerWidth * 0.12)),
      };
    }

    if (isTablet) {
      // Tablet: Moderate reduction
      return {
        top: Math.round(base.top * 0.75),
        right: Math.round(base.right * 0.7),
        bottom: Math.round(base.bottom * 0.85) + additionalBottomSpace,
        left: Math.round(base.left * 0.8),
      };
    }

    // Desktop: Use base margins
    return {
      ...base,
      bottom: base.bottom + additionalBottomSpace,
    };
  }, [containerWidth, chartType, additionalBottomSpace]);
}

/**
 * Get responsive font sizes for chart elements
 *
 * @param containerWidth - The width of the chart container in pixels
 * @returns Object with font sizes for different chart elements
 */
export function useResponsiveChartFonts(containerWidth: number) {
  return useMemo(() => {
    const isMobile = containerWidth < 400;
    const isTablet = containerWidth >= 400 && containerWidth < 768;

    if (isMobile) {
      return {
        tickLabel: 8,
        axisLabel: 9,
        statLabel: 10,
      };
    }

    if (isTablet) {
      return {
        tickLabel: 9,
        axisLabel: 10,
        statLabel: 11,
      };
    }

    return {
      tickLabel: 11,
      axisLabel: 13,
      statLabel: 12,
    };
  }, [containerWidth]);
}

/**
 * Calculate number of ticks based on available space
 *
 * @param availableSize - Available width or height in pixels
 * @param type - Whether this is for x-axis (width) or y-axis (height)
 * @returns Recommended number of ticks
 */
export function useResponsiveTickCount(availableSize: number, type: 'x' | 'y' = 'x'): number {
  return useMemo(() => {
    if (type === 'x') {
      if (availableSize < 200) return 3;
      if (availableSize < 400) return 5;
      if (availableSize < 600) return 7;
      return 10;
    }

    // Y-axis - based on height
    if (availableSize < 150) return 3;
    if (availableSize < 250) return 5;
    return 7;
  }, [availableSize, type]);
}

/**
 * Hook to detect if we're on a mobile device
 * Uses container width rather than window width for more accurate
 * component-level responsiveness
 *
 * @param containerWidth - The width of the container
 * @returns Object with boolean flags for different screen sizes
 */
export function useResponsiveBreakpoints(containerWidth: number) {
  return useMemo(
    () => ({
      isMobile: containerWidth < 400,
      isTablet: containerWidth >= 400 && containerWidth < 768,
      isDesktop: containerWidth >= 768,
      isSmallMobile: containerWidth < 320,
    }),
    [containerWidth]
  );
}
