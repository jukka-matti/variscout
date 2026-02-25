/**
 * useMultiSelection - Hook for Minitab-style brushing and multi-point selection
 *
 * Provides:
 * - Rectangular brush selection (drag region)
 * - Ctrl+click to toggle individual points
 * - Shift+click to add to selection
 * - Visual styling helpers (opacity, size, stroke)
 *
 * Usage:
 * ```tsx
 * const {
 *   brushExtent,
 *   isBrushing,
 *   handleBrushStart,
 *   handleBrushMove,
 *   handleBrushEnd,
 *   handlePointClick,
 *   isPointSelected,
 *   getPointOpacity,
 *   getPointSize,
 * } = useMultiSelection({
 *   data,
 *   xScale,
 *   yScale,
 *   selectedPoints,
 *   onSelectionChange,
 * });
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';

// Generic scale interface matching what we need from visx scales
interface ChartScale {
  (value: number): number | undefined;
  invert(value: number): number;
  range(): number[];
  domain(): number[];
}

export interface UseMultiSelectionOptions<T> {
  /** Chart data points */
  data: T[];
  /** X-axis scale */
  xScale: ChartScale;
  /** Y-axis scale */
  yScale: ChartScale;
  /** Currently selected point indices (controlled state) */
  selectedPoints: Set<number>;
  /** Callback when selection changes */
  onSelectionChange: (indices: Set<number>) => void;
  /** Accessor for X value (default: d => d.x) */
  getX?: (d: T, index: number) => number;
  /** Accessor for Y value (default: d => d.y) */
  getY?: (d: T, index: number) => number;
  /** Enable brush selection (default: true) */
  enableBrush?: boolean;
}

export interface BrushExtent {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface UseMultiSelectionResult {
  /** Current brush extent (pixel coordinates) */
  brushExtent: BrushExtent | null;
  /** Whether actively brushing */
  isBrushing: boolean;
  /** Start brush interaction */
  handleBrushStart: (event: React.MouseEvent<SVGElement>) => void;
  /** Update brush region */
  handleBrushMove: (event: React.MouseEvent<SVGElement>) => void;
  /** Complete brush selection */
  handleBrushEnd: () => void;
  /** Handle point click with modifier keys (Ctrl/Shift) */
  handlePointClick: (index: number, event: React.MouseEvent) => void;
  /** Check if a point is selected */
  isPointSelected: (index: number) => boolean;
  /** Get opacity for a point (dimmed if selection exists and point not selected) */
  getPointOpacity: (index: number) => number;
  /** Get size for a point (larger if selected) */
  getPointSize: (index: number) => number;
  /** Get stroke width for a point (thicker if selected) */
  getPointStrokeWidth: (index: number) => number;
}

const DEFAULT_POINT_SIZE = 4;
const SELECTED_POINT_SIZE = 6;
const DEFAULT_OPACITY = 1.0;
const DIMMED_OPACITY = 0.3;
const SELECTED_STROKE_WIDTH = 2;
const DEFAULT_STROKE_WIDTH = 1;

export function useMultiSelection<T = { x: number; y: number }>({
  data,
  xScale,
  yScale,
  selectedPoints,
  onSelectionChange,
  getX = ((d: T) => (d as Record<string, number>).x) as (d: T, index: number) => number,
  getY = ((d: T) => (d as Record<string, number>).y) as (d: T, index: number) => number,
  enableBrush = true,
}: UseMultiSelectionOptions<T>): UseMultiSelectionResult {
  const [brushExtent, setBrushExtent] = useState<BrushExtent | null>(null);
  const [isBrushing, setIsBrushing] = useState(false);
  const [brushStart, setBrushStart] = useState<{ x: number; y: number } | null>(null);

  /**
   * Get the bounding box of the chart area from the scale ranges
   */
  const chartBounds = useMemo(
    () => ({
      left: xScale.range()[0],
      right: xScale.range()[1],
      top: yScale.range()[1], // Y-scale is inverted (0 at bottom)
      bottom: yScale.range()[0],
    }),
    [xScale, yScale]
  );

  /**
   * Find all points within the brush extent
   */
  const getPointsInBrush = useCallback(
    (extent: BrushExtent): Set<number> => {
      const { x0, y0, x1, y1 } = extent;

      // Convert brush pixel coords to data values
      const dataX0 = xScale.invert(Math.min(x0, x1));
      const dataX1 = xScale.invert(Math.max(x0, x1));
      const dataY0 = yScale.invert(Math.max(y0, y1)); // Y inverted
      const dataY1 = yScale.invert(Math.min(y0, y1));

      const indices = new Set<number>();
      data.forEach((d, i) => {
        const x = getX(d, i);
        const y = getY(d, i);
        if (x >= dataX0 && x <= dataX1 && y >= dataY0 && y <= dataY1) {
          indices.add(i);
        }
      });

      return indices;
    },
    [data, xScale, yScale, getX, getY]
  );

  /**
   * Start brush selection
   */
  const handleBrushStart = useCallback(
    (event: React.MouseEvent<SVGElement>) => {
      if (!enableBrush) return;

      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if click is within chart bounds
      if (
        x >= chartBounds.left &&
        x <= chartBounds.right &&
        y >= chartBounds.top &&
        y <= chartBounds.bottom
      ) {
        setBrushStart({ x, y });
        setBrushExtent({ x0: x, y0: y, x1: x, y1: y });
        setIsBrushing(true);
      }
    },
    [enableBrush, chartBounds]
  );

  /**
   * Update brush region while dragging
   */
  const handleBrushMove = useCallback(
    (event: React.MouseEvent<SVGElement>) => {
      if (!isBrushing || !brushStart) return;

      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Clamp to chart bounds
      const clampedX = Math.max(chartBounds.left, Math.min(chartBounds.right, x));
      const clampedY = Math.max(chartBounds.top, Math.min(chartBounds.bottom, y));

      setBrushExtent({
        x0: brushStart.x,
        y0: brushStart.y,
        x1: clampedX,
        y1: clampedY,
      });
    },
    [isBrushing, brushStart, chartBounds]
  );

  /**
   * Complete brush selection
   */
  const handleBrushEnd = useCallback(() => {
    if (!isBrushing || !brushExtent) return;

    const brushedIndices = getPointsInBrush(brushExtent);

    // Only update selection if we actually brushed some points
    if (brushedIndices.size > 0) {
      onSelectionChange(brushedIndices);
    }

    // Clear brush UI
    setIsBrushing(false);
    setBrushStart(null);
    setBrushExtent(null);
  }, [isBrushing, brushExtent, getPointsInBrush, onSelectionChange]);

  /**
   * Handle point click with modifier keys
   * - Ctrl+click: Toggle point in selection
   * - Shift+click: Add point to selection
   * - Regular click: Replace selection with this point
   */
  const handlePointClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent brush start

      if (event.ctrlKey || event.metaKey) {
        // Toggle point
        const newSelection = new Set(selectedPoints);
        if (newSelection.has(index)) {
          newSelection.delete(index);
        } else {
          newSelection.add(index);
        }
        onSelectionChange(newSelection);
      } else if (event.shiftKey) {
        // Add to selection
        const newSelection = new Set(selectedPoints);
        newSelection.add(index);
        onSelectionChange(newSelection);
      } else {
        // Replace selection
        onSelectionChange(new Set([index]));
      }
    },
    [selectedPoints, onSelectionChange]
  );

  /**
   * Check if a point is selected
   */
  const isPointSelected = useCallback(
    (index: number) => selectedPoints.has(index),
    [selectedPoints]
  );

  /**
   * Get opacity for a point
   * - Selected: full opacity
   * - Unselected when selection exists: dimmed
   * - No selection: full opacity
   */
  const getPointOpacity = useCallback(
    (index: number) => {
      if (selectedPoints.size === 0) return DEFAULT_OPACITY;
      return selectedPoints.has(index) ? DEFAULT_OPACITY : DIMMED_OPACITY;
    },
    [selectedPoints]
  );

  /**
   * Get size for a point
   * - Selected: larger
   * - Unselected: default
   */
  const getPointSize = useCallback(
    (index: number) => {
      return selectedPoints.has(index) ? SELECTED_POINT_SIZE : DEFAULT_POINT_SIZE;
    },
    [selectedPoints]
  );

  /**
   * Get stroke width for a point
   * - Selected: thicker white stroke
   * - Unselected: default
   */
  const getPointStrokeWidth = useCallback(
    (index: number) => {
      return selectedPoints.has(index) ? SELECTED_STROKE_WIDTH : DEFAULT_STROKE_WIDTH;
    },
    [selectedPoints]
  );

  return {
    brushExtent,
    isBrushing,
    handleBrushStart,
    handleBrushMove,
    handleBrushEnd,
    handlePointClick,
    isPointSelected,
    getPointOpacity,
    getPointSize,
    getPointStrokeWidth,
  };
}
