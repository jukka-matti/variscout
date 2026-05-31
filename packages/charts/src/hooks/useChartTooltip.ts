/**
 * useChartTooltip - Unified tooltip positioning hook for all charts
 *
 * Provides two positioning methods:
 * - showTooltipAtPoint: Uses localPoint() from mouse event (no margin offset needed)
 * - showTooltipAtCoords: Uses scale values (requires margin offset when rendering)
 */

import { useCallback, type MouseEvent } from 'react';
import { useTooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';

export interface UseChartTooltipReturn<T> {
  /** Current tooltip data */
  tooltipData: T | undefined;
  /** Tooltip X position (in pixels) */
  tooltipLeft: number | undefined;
  /** Tooltip Y position (in pixels) */
  tooltipTop: number | undefined;
  /** Whether tooltip is currently visible */
  tooltipOpen: boolean;
  /**
   * Show tooltip at mouse position using localPoint()
   * Use for charts where tooltip follows the cursor
   * No margin offset needed when rendering
   */
  showTooltipAtPoint: (event: MouseEvent, data: T) => void;
  /**
   * Show tooltip at specific coordinates (typically from scales)
   * Use for charts where tooltip appears at data point position
   * Requires margin offset when rendering: left={margin.left + tooltipLeft}
   */
  showTooltipAtCoords: (x: number, y: number, data: T) => void;
  /** Hide the tooltip */
  hideTooltip: () => void;
  /**
   * Whether the tooltip position was set via localPoint (true) or coords (false)
   * Used to determine if margin offset is needed when rendering
   */
  usesLocalPoint: boolean;
}

/**
 * Hook for managing chart tooltips with consistent positioning
 *
 * @example
 * // Using localPoint (tooltip follows cursor, no offset needed)
 * const { tooltipData, tooltipLeft, tooltipTop, showTooltipAtPoint, hideTooltip } = useChartTooltip<MyData>();
 *
 * <Circle onMouseMove={(e) => showTooltipAtPoint(e, data)} onMouseLeave={hideTooltip} />
 * <TooltipWithBounds left={tooltipLeft} top={tooltipTop} />
 *
 * @example
 * // Using coords (tooltip at data point, needs margin offset)
 * const { tooltipData, tooltipLeft, tooltipTop, showTooltipAtCoords, hideTooltip, usesLocalPoint } = useChartTooltip<MyData>();
 *
 * <Circle onMouseOver={() => showTooltipAtCoords(xScale(d.x), yScale(d.y), d)} onMouseLeave={hideTooltip} />
 * <TooltipWithBounds
 *   left={usesLocalPoint ? tooltipLeft : margin.left + (tooltipLeft ?? 0)}
 *   top={usesLocalPoint ? tooltipTop : margin.top + (tooltipTop ?? 0)}
 * />
 */
export function useChartTooltip<T>(): UseChartTooltipReturn<T> {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip: visx_hideTooltip,
  } = useTooltip<T & { _usesLocalPoint?: boolean }>();

  const showTooltipAtPoint = useCallback(
    (event: MouseEvent, data: T) => {
      const coords = localPoint(event);
      if (!coords) return;
      showTooltip({
        tooltipData: { ...data, _usesLocalPoint: true },
        tooltipLeft: coords.x,
        tooltipTop: coords.y,
      });
    },
    [showTooltip]
  );

  const showTooltipAtCoords = useCallback(
    (x: number, y: number, data: T) => {
      showTooltip({
        tooltipData: { ...data, _usesLocalPoint: false },
        tooltipLeft: x,
        tooltipTop: y,
      });
    },
    [showTooltip]
  );

  // Determine if the current tooltip uses localPoint
  const usesLocalPoint =
    (tooltipData as T & { _usesLocalPoint?: boolean })?._usesLocalPoint ?? true;

  return {
    tooltipData: tooltipData as T | undefined,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltipAtPoint,
    showTooltipAtCoords,
    hideTooltip: visx_hideTooltip,
    usesLocalPoint,
  };
}
