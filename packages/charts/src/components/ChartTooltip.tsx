/**
 * ChartTooltip - Standardized tooltip component for all charts
 *
 * Encapsulates the common tooltip styling used across all chart components.
 * Reduces code duplication by centralizing tooltip appearance.
 */

import React from 'react';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { ChartMargins, ChartFonts } from '../types';
import { chromeColors } from '../colors';

export interface ChartTooltipProps<T> {
  /** Tooltip data - when undefined, tooltip is hidden */
  data: T | undefined;
  /** Whether tooltip is open */
  isOpen: boolean;
  /** Left position from tooltip hook */
  left?: number;
  /** Top position from tooltip hook */
  top?: number;
  /** Chart margins for positioning offset */
  margin?: ChartMargins;
  /** Font sizes for tooltip text */
  fonts: ChartFonts;
  /** Render function for tooltip content */
  children: (data: T) => React.ReactNode;
  /** Whether to apply margin offset to position (default: true) */
  applyMarginOffset?: boolean;
}

/**
 * Standardized tooltip wrapper with consistent styling
 *
 * @example
 * ```tsx
 * <ChartTooltip
 *   data={tooltipData}
 *   isOpen={tooltipOpen}
 *   left={tooltipLeft}
 *   top={tooltipTop}
 *   margin={margin}
 *   fonts={fonts}
 * >
 *   {(data) => (
 *     <>
 *       <div><strong>{data.label}</strong></div>
 *       <div>Value: {data.value}</div>
 *     </>
 *   )}
 * </ChartTooltip>
 * ```
 */
export function ChartTooltip<T>({
  data,
  isOpen,
  left,
  top,
  margin,
  fonts,
  children,
  applyMarginOffset = true,
}: ChartTooltipProps<T>): React.ReactElement | null {
  if (!isOpen || data === undefined) {
    return null;
  }

  const offsetLeft = applyMarginOffset && margin ? margin.left + (left ?? 0) : (left ?? 0);
  const offsetTop = applyMarginOffset && margin ? margin.top + (top ?? 0) : (top ?? 0);

  return (
    <TooltipWithBounds
      left={offsetLeft}
      top={offsetTop}
      style={{
        ...defaultStyles,
        backgroundColor: chromeColors.tooltipBg,
        color: chromeColors.tooltipText,
        border: `1px solid ${chromeColors.tooltipBorder}`,
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: fonts.tooltipText,
      }}
    >
      {children(data)}
    </TooltipWithBounds>
  );
}

/**
 * Get tooltip style object (for charts that need custom positioning)
 */
export function getTooltipStyle(fonts: ChartFonts): React.CSSProperties {
  return {
    ...defaultStyles,
    backgroundColor: chromeColors.tooltipBg,
    color: chromeColors.tooltipText,
    border: `1px solid ${chromeColors.tooltipBorder}`,
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: fonts.tooltipText,
  };
}
