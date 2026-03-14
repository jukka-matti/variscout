/**
 * SVG shape renderer for I-Chart data points.
 * Each Nelson rule type gets a distinct shape for dual encoding (shape + color).
 *
 * Shape mapping:
 * - circle:        In-control (normal)
 * - diamond:       Rule 1 — Beyond 3σ (UCL/LCL) or spec violation
 * - square:        Rule 2 — 9+ consecutive same side of mean
 * - triangle-up:   Rule 3 — 6+ consecutive increasing
 * - triangle-down: Rule 3 — 6+ consecutive decreasing
 */

import React from 'react';

export type ViolationShape = 'circle' | 'diamond' | 'square' | 'triangle-up' | 'triangle-down';

interface ViolationPointProps {
  cx: number;
  cy: number;
  r: number;
  shape: ViolationShape;
  fill: string;
  stroke: string;
  strokeWidth: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onMouseOver?: () => void;
  onMouseLeave?: () => void;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Renders a data point as the appropriate SVG shape based on violation type.
 * All shapes scale with `r` to maintain visual equivalence.
 */
const ViolationPoint: React.FC<ViolationPointProps> = ({
  cx,
  cy,
  r,
  shape,
  fill,
  stroke,
  strokeWidth,
  className,
  onClick,
  onMouseOver,
  onMouseLeave,
  ...a11yProps
}) => {
  const eventProps = { onClick, onMouseOver, onMouseLeave, className };

  switch (shape) {
    case 'diamond': {
      // Rotated square — scale up ~1.25x for comparable visual area
      const s = r * 1.25;
      const points = `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`;
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...eventProps}
          {...a11yProps}
        />
      );
    }
    case 'square': {
      // Centered square — scale up ~1.1x
      const s = r * 1.1;
      return (
        <rect
          x={cx - s}
          y={cy - s}
          width={s * 2}
          height={s * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...eventProps}
          {...a11yProps}
        />
      );
    }
    case 'triangle-up': {
      // Upward triangle — scale up ~1.3x
      const s = r * 1.3;
      const points = `${cx},${cy - s} ${cx + s},${cy + s * 0.7} ${cx - s},${cy + s * 0.7}`;
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...eventProps}
          {...a11yProps}
        />
      );
    }
    case 'triangle-down': {
      // Downward triangle — scale up ~1.3x
      const s = r * 1.3;
      const points = `${cx},${cy + s} ${cx + s},${cy - s * 0.7} ${cx - s},${cy - s * 0.7}`;
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...eventProps}
          {...a11yProps}
        />
      );
    }
    case 'circle':
    default:
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...eventProps}
          {...a11yProps}
        />
      );
  }
};

export default ViolationPoint;
