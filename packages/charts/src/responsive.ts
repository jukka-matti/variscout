/**
 * Responsive utilities for @variscout/charts
 * Extracted from PWA for sharing across platforms
 */

import type { ChartMargins, ChartFonts } from './types';

export type ChartType = 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'probability';

/**
 * Calculate responsive margins based on container width
 */
export function getResponsiveMargins(
  containerWidth: number,
  chartType: ChartType = 'ichart',
  additionalBottomSpace: number = 0
): ChartMargins {
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
    return {
      top: Math.min(base.top, 20),
      right: Math.max(15, Math.round(containerWidth * 0.05)),
      bottom: Math.min(base.bottom, 40) + additionalBottomSpace,
      left: Math.max(35, Math.round(containerWidth * 0.12)),
    };
  }

  if (isTablet) {
    return {
      top: Math.round(base.top * 0.75),
      right: Math.round(base.right * 0.7),
      bottom: Math.round(base.bottom * 0.85) + additionalBottomSpace,
      left: Math.round(base.left * 0.8),
    };
  }

  return {
    ...base,
    bottom: base.bottom + additionalBottomSpace,
  };
}

/**
 * Get responsive font sizes for chart elements
 */
export function getResponsiveFonts(containerWidth: number): ChartFonts {
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
}

/**
 * Calculate number of ticks based on available space
 */
export function getResponsiveTickCount(availableSize: number, type: 'x' | 'y' = 'x'): number {
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
}

/**
 * Get breakpoint information for a container
 */
export function getBreakpoints(containerWidth: number) {
  return {
    isMobile: containerWidth < 400,
    isTablet: containerWidth >= 400 && containerWidth < 768,
    isDesktop: containerWidth >= 768,
    isSmallMobile: containerWidth < 320,
  };
}
