/**
 * SpecLimitLine - Reusable component for spec/control limit lines
 *
 * Used for rendering USL, LSL, Target, UCL, LCL, and Mean lines
 * with consistent styling across charts.
 */

import React from 'react';
import { Line } from '@visx/shape';
import type { ChartFonts } from '../types';
import { chartColors } from '../colors';

// Using a generic numeric scale type that works with visx scales
type NumericScale = {
  (value: number): number;
};

export type LimitType = 'usl' | 'lsl' | 'target' | 'ucl' | 'lcl' | 'mean';

export interface SpecLimitLineProps {
  /** The limit value */
  value: number;
  /** Type of limit (determines color and label) */
  type: LimitType;
  /** Y-scale for positioning (for horizontal lines) */
  yScale: NumericScale;
  /** Chart inner width */
  width: number;
  /** Font sizes for label */
  fonts: ChartFonts;
  /** Show label next to line (default: true) */
  showLabel?: boolean;
  /** Custom label text (overrides default) */
  labelText?: string;
  /** Label position from right edge (default: 4) */
  labelOffset?: number;
  /** Click handler for the label */
  onLabelClick?: () => void;
  /** Decimal places for value display (default: 1) */
  decimalPlaces?: number;
}

/**
 * Get default color for limit type
 */
function getLineColor(type: LimitType): string {
  switch (type) {
    case 'usl':
    case 'lsl':
      return chartColors.spec;
    case 'target':
      return chartColors.target;
    case 'ucl':
    case 'lcl':
      return chartColors.control;
    case 'mean':
      return chartColors.mean;
    default:
      return chartColors.spec;
  }
}

/**
 * Get line style for limit type
 */
function getLineStyle(type: LimitType): { strokeWidth: number; strokeDasharray?: string } {
  switch (type) {
    case 'usl':
    case 'lsl':
      return { strokeWidth: 2, strokeDasharray: '6,3' };
    case 'target':
      return { strokeWidth: 1, strokeDasharray: '2,2' };
    case 'ucl':
    case 'lcl':
      return { strokeWidth: 1, strokeDasharray: '4,4' };
    case 'mean':
      return { strokeWidth: 1.5 };
    default:
      return { strokeWidth: 1 };
  }
}

/**
 * Get default label text for limit type
 */
function getDefaultLabel(type: LimitType, value: number, decimalPlaces: number): string {
  const formattedValue = value.toFixed(decimalPlaces);
  switch (type) {
    case 'usl':
      return `USL: ${formattedValue}`;
    case 'lsl':
      return `LSL: ${formattedValue}`;
    case 'target':
      return `Tgt: ${formattedValue}`;
    case 'ucl':
      return `UCL: ${formattedValue}`;
    case 'lcl':
      return `LCL: ${formattedValue}`;
    case 'mean':
      return `Mean: ${formattedValue}`;
    default:
      return formattedValue;
  }
}

/**
 * Horizontal spec/control limit line with optional label
 *
 * @example
 * ```tsx
 * <SpecLimitLine
 *   value={specs.usl}
 *   type="usl"
 *   yScale={yScale}
 *   width={width}
 *   fonts={fonts}
 *   onLabelClick={() => onSpecClick?.('usl')}
 * />
 * ```
 */
export const SpecLimitLine: React.FC<SpecLimitLineProps> = ({
  value,
  type,
  yScale,
  width,
  fonts,
  showLabel = true,
  labelText,
  labelOffset = 4,
  onLabelClick,
  decimalPlaces = 1,
}) => {
  const y = yScale(value);
  const color = getLineColor(type);
  const lineStyle = getLineStyle(type);
  const label = labelText ?? getDefaultLabel(type, value, decimalPlaces);

  return (
    <>
      <Line
        from={{ x: 0, y }}
        to={{ x: width, y }}
        stroke={color}
        strokeWidth={lineStyle.strokeWidth}
        strokeDasharray={lineStyle.strokeDasharray}
      />
      {showLabel && (
        <text
          x={width + labelOffset}
          y={y}
          fill={color}
          fontSize={fonts.statLabel}
          textAnchor="start"
          dominantBaseline="middle"
          style={{ cursor: onLabelClick ? 'pointer' : 'default' }}
          onClick={onLabelClick}
          className={onLabelClick ? 'hover:opacity-70' : ''}
        >
          {label}
        </text>
      )}
    </>
  );
};

/**
 * Vertical spec limit line (for histogram X-axis)
 */
export interface VerticalSpecLimitLineProps {
  /** The limit value */
  value: number;
  /** Type of limit */
  type: LimitType;
  /** X-scale for positioning */
  xScale: NumericScale;
  /** Chart inner height */
  height: number;
  /** Font sizes for label */
  fonts: ChartFonts;
  /** Show label above line (default: true) */
  showLabel?: boolean;
  /** Custom label text */
  labelText?: string;
}

export const VerticalSpecLimitLine: React.FC<VerticalSpecLimitLineProps> = ({
  value,
  type,
  xScale,
  height,
  fonts,
  showLabel = true,
  labelText,
}) => {
  const x = xScale(value);
  const color = getLineColor(type);
  const lineStyle = getLineStyle(type);
  const label = labelText ?? type.toUpperCase();

  return (
    <>
      <Line
        from={{ x, y: 0 }}
        to={{ x, y: height }}
        stroke={color}
        strokeWidth={lineStyle.strokeWidth}
        strokeDasharray={lineStyle.strokeDasharray}
      />
      {showLabel && (
        <text
          x={x}
          y={-5}
          textAnchor="middle"
          fill={color}
          fontSize={fonts.statLabel}
          fontWeight="bold"
        >
          {label}
        </text>
      )}
    </>
  );
};
