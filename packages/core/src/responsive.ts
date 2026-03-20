/**
 * Responsive utilities for chart layout calculations
 *
 * Pure calculation functions for responsive chart sizing.
 * These are framework-agnostic and can be used directly or wrapped in React hooks.
 *
 * @module @variscout/core/responsive
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Chart margins (pixels from container edge)
 */
export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Chart font sizes (pixels)
 */
export interface ChartFonts {
  tickLabel: number;
  axisLabel: number;
  statLabel: number;
  tooltipText: number;
  brandingText: number;
}

/**
 * Supported chart types for margin calculations
 */
export type ChartType =
  | 'ichart'
  | 'boxplot'
  | 'pareto'
  | 'histogram'
  | 'probability'
  | 'scatter'
  | 'yamazumi';

/**
 * Container breakpoint information
 */
export interface Breakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
}

// ============================================================================
// Margin Calculations
// ============================================================================

/**
 * Calculate responsive margins based on container width
 *
 * Returns appropriate margins for different screen sizes and chart types.
 * I-Chart has larger right margin to accommodate Minitab-style limit labels.
 *
 * @param containerWidth - Width of the chart container in pixels
 * @param chartType - Type of chart (affects base margins)
 * @param additionalBottomSpace - Extra space for source bar or legends
 * @returns ChartMargins object with top, right, bottom, left values
 *
 * @example
 * const margins = getResponsiveMargins(800, 'ichart');
 * // { top: 40, right: 85, bottom: 60, left: 70 }
 *
 * @example
 * const margins = getResponsiveMargins(350, 'boxplot', 20);
 * // Mobile-optimized margins with extra bottom space
 */
export function getResponsiveMargins(
  containerWidth: number,
  chartType: ChartType = 'ichart',
  additionalBottomSpace: number = 0
): ChartMargins {
  const isMobile = containerWidth < 400;
  const isTablet = containerWidth >= 400 && containerWidth < 768;

  // Base margins per chart type (desktop defaults)
  // I-Chart has larger right margin to accommodate Minitab-style limit labels
  const baseMargins: Record<ChartType, ChartMargins> = {
    ichart: { top: 40, right: 85, bottom: 60, left: 70 },
    boxplot: { top: 20, right: 20, bottom: 60, left: 70 },
    pareto: { top: 20, right: 20, bottom: 60, left: 70 },
    histogram: { top: 20, right: 20, bottom: 40, left: 40 },
    probability: { top: 20, right: 20, bottom: 40, left: 50 },
    scatter: { top: 30, right: 20, bottom: 50, left: 55 },
    yamazumi: { top: 20, right: 20, bottom: 60, left: 70 },
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

// ============================================================================
// Font Size Calculations
// ============================================================================

/**
 * Get responsive font sizes for chart elements
 *
 * Returns appropriate font sizes for different screen sizes.
 *
 * @param containerWidth - Width of the chart container in pixels
 * @returns ChartFonts object with font sizes for different elements
 *
 * @example
 * const fonts = getResponsiveFonts(800);
 * // { tickLabel: 11, axisLabel: 13, statLabel: 12, tooltipText: 12, brandingText: 10 }
 */
export function getResponsiveFonts(containerWidth: number): ChartFonts {
  const isMobile = containerWidth < 400;
  const isTablet = containerWidth >= 400 && containerWidth < 768;

  if (isMobile) {
    return {
      tickLabel: 8,
      axisLabel: 9,
      statLabel: 10,
      tooltipText: 10,
      brandingText: 8,
    };
  }

  if (isTablet) {
    return {
      tickLabel: 9,
      axisLabel: 10,
      statLabel: 11,
      tooltipText: 11,
      brandingText: 9,
    };
  }

  return {
    tickLabel: 11,
    axisLabel: 13,
    statLabel: 12,
    tooltipText: 12,
    brandingText: 10,
  };
}

/**
 * Get scaled font sizes based on a multiplier
 *
 * Useful for embedding charts in different contexts where base font
 * size needs adjustment.
 *
 * @param containerWidth - Width of the chart container in pixels
 * @param scale - Multiplier for all font sizes (default: 1)
 * @returns Scaled ChartFonts object
 *
 * @example
 * const fonts = getScaledFonts(800, 1.2);
 * // All font sizes increased by 20%
 */
export function getScaledFonts(containerWidth: number, scale: number = 1): ChartFonts {
  const baseFonts = getResponsiveFonts(containerWidth);

  if (scale === 1) {
    return baseFonts;
  }

  return {
    tickLabel: Math.round(baseFonts.tickLabel * scale),
    axisLabel: Math.round(baseFonts.axisLabel * scale),
    statLabel: Math.round(baseFonts.statLabel * scale),
    tooltipText: Math.round(baseFonts.tooltipText * scale),
    brandingText: Math.round(baseFonts.brandingText * scale),
  };
}

// ============================================================================
// Tick Calculations
// ============================================================================

/**
 * Calculate number of ticks based on available space
 *
 * Returns optimal tick count to avoid crowding or sparse axes.
 *
 * @param availableSize - Available width (x) or height (y) in pixels
 * @param type - Whether this is for x-axis (width) or y-axis (height)
 * @returns Recommended number of ticks
 *
 * @example
 * const xTicks = getResponsiveTickCount(600, 'x'); // 7
 * const yTicks = getResponsiveTickCount(300, 'y'); // 7
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

// ============================================================================
// Breakpoint Detection
// ============================================================================

/**
 * Get breakpoint information for a container
 *
 * Returns boolean flags for different screen size categories.
 *
 * @param containerWidth - Width of the container in pixels
 * @returns Breakpoints object with boolean flags
 *
 * @example
 * const bp = getBreakpoints(500);
 * // { isMobile: false, isTablet: true, isDesktop: false, isSmallMobile: false }
 */
export function getBreakpoints(containerWidth: number): Breakpoints {
  return {
    isMobile: containerWidth < 400,
    isTablet: containerWidth >= 400 && containerWidth < 768,
    isDesktop: containerWidth >= 768,
    isSmallMobile: containerWidth < 320,
  };
}

// ============================================================================
// Stage Colors (shared between charts and hooks)
// ============================================================================

/** Stage colors for dual-stage boxplot (before/after comparison) */
export const stageColors = [
  '#94a3b8', // slate-400 — "before" stage
  '#3b82f6', // blue-500 — "after" stage
] as const;
