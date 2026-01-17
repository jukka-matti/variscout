/**
 * ChartAxis - Helper functions for consistent axis styling
 *
 * Provides standardized tick label and axis label props to ensure
 * consistent appearance across all chart components.
 */

import type { ChartFonts } from '../types';
import { chromeColors } from '../colors';

/**
 * Tick label style types
 */
export type TickLabelStyle = 'primary' | 'secondary' | 'muted';

interface TickLabelPropsOptions {
  /** Font sizes from layout */
  fonts: ChartFonts;
  /** Text anchor - defaults based on axis orientation */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Vertical offset */
  dy?: number | string;
  /** Horizontal offset */
  dx?: number;
  /** Use monospace font (for Y-axis values) */
  monospace?: boolean;
  /** Color style variant */
  style?: TickLabelStyle;
}

/**
 * Get standardized tick label props for Y-axis (left)
 */
export function getYAxisTickLabelProps(fonts: ChartFonts, style: TickLabelStyle = 'primary') {
  return () => ({
    fill: style === 'primary' ? chromeColors.labelPrimary : chromeColors.labelSecondary,
    fontSize: fonts.tickLabel,
    textAnchor: 'end' as const,
    dx: -4,
    dy: 3,
    fontFamily: 'monospace',
  });
}

/**
 * Get standardized tick label props for X-axis (bottom)
 */
export function getXAxisTickLabelProps(fonts: ChartFonts, style: TickLabelStyle = 'primary') {
  return () => ({
    fill: style === 'primary' ? chromeColors.labelPrimary : chromeColors.labelSecondary,
    fontSize: fonts.tickLabel,
    textAnchor: 'middle' as const,
    dy: 2,
  });
}

/**
 * Get flexible tick label props with customization options
 */
export function getTickLabelProps(options: TickLabelPropsOptions) {
  const {
    fonts,
    textAnchor = 'end',
    dy = '0.33em',
    dx = -4,
    monospace = false,
    style = 'primary',
  } = options;

  return () => ({
    fill: style === 'primary' ? chromeColors.labelPrimary : chromeColors.labelSecondary,
    fontSize: fonts.tickLabel,
    textAnchor,
    dy,
    dx,
    ...(monospace && { fontFamily: 'monospace' }),
  });
}

/**
 * Get standardized axis label props
 */
export function getAxisLabelProps(fonts: ChartFonts, style: TickLabelStyle = 'primary') {
  return {
    fill: style === 'primary' ? chromeColors.labelPrimary : chromeColors.labelSecondary,
    fontSize: fonts.axisLabel,
    textAnchor: 'middle' as const,
  };
}

/**
 * Calculate responsive Y-axis label position
 */
export function getYAxisLabelX(parentWidth: number): number {
  if (parentWidth < 400) return -25;
  if (parentWidth < 768) return -40;
  return -50;
}

/**
 * Calculate responsive axis label offset
 */
export function getAxisLabelOffset(parentWidth: number, axis: 'x' | 'y'): number {
  if (axis === 'y') {
    return parentWidth < 400 ? 28 : 36;
  }
  return parentWidth < 400 ? 24 : 32;
}
