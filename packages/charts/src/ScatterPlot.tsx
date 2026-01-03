import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { LinePath, Circle } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { GridRows, GridColumns } from '@visx/grid';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import type { RegressionResult } from '@variscout/core';
import type { BaseChartProps, SpecLimits } from './types';
import { getResponsiveMargins, getResponsiveFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';

interface TooltipData {
  x: number;
  y: number;
  index: number;
}

/**
 * ScatterPlot props
 */
export interface ScatterPlotProps extends BaseChartProps {
  /** Regression result with points and fit data */
  regression: RegressionResult;
  /** Specification limits for Y axis */
  specs?: SpecLimits;
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Show stars for R² strength */
  showStars?: boolean;
  /** Callback when chart is clicked (for expansion) */
  onClick?: () => void;
}

/**
 * Generate star rating display
 */
function getStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * Generate quadratic curve points for rendering
 */
function generateQuadraticCurve(
  a: number,
  b: number,
  c: number,
  xMin: number,
  xMax: number,
  numPoints: number = 50
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const step = (xMax - xMin) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = a * x * x + b * x + c;
    points.push({ x, y });
  }

  return points;
}

/**
 * ScatterPlot - Shows X-Y relationship with regression line
 */
const ScatterPlotBase: React.FC<ScatterPlotProps> = ({
  regression,
  specs,
  xAxisLabel,
  yAxisLabel,
  showStars = true,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onClick,
}) => {
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'scatter', sourceBarHeight);
  const fonts = getResponsiveFonts(parentWidth);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<TooltipData>();

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  const { points, linear, quadratic, recommendedFit, strengthRating } = regression;

  // X Scale
  const xScale = useMemo(() => {
    if (points.length === 0) return null;

    const xValues = points.map(p => p.x);
    const min = Math.min(...xValues);
    const max = Math.max(...xValues);
    const padding = (max - min) * 0.1 || 1;

    return scaleLinear({
      range: [0, width],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [points, width]);

  // Y Scale
  const yScale = useMemo(() => {
    if (points.length === 0) return null;

    const yValues = points.map(p => p.y);
    let min = Math.min(...yValues);
    let max = Math.max(...yValues);

    // Include spec limits in range if present
    if (specs?.lsl !== undefined) min = Math.min(min, specs.lsl);
    if (specs?.usl !== undefined) max = Math.max(max, specs.usl);

    const padding = (max - min) * 0.1 || 1;

    return scaleLinear({
      range: [height, 0],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [points, specs, height]);

  // Linear regression line endpoints
  const linearLine = useMemo(() => {
    if (!xScale) return [];

    const [xMin, xMax] = xScale.domain();
    return [
      { x: xMin, y: linear.slope * xMin + linear.intercept },
      { x: xMax, y: linear.slope * xMax + linear.intercept },
    ];
  }, [xScale, linear]);

  // Quadratic curve points
  const quadraticCurve = useMemo(() => {
    if (!xScale || !quadratic) return [];

    const [xMin, xMax] = xScale.domain();
    return generateQuadraticCurve(quadratic.a, quadratic.b, quadratic.c, xMin, xMax);
  }, [xScale, quadratic]);

  if (points.length === 0 || !xScale || !yScale) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No data available
      </div>
    );
  }

  const rSquared =
    recommendedFit === 'quadratic' && quadratic ? quadratic.rSquared : linear.rSquared;

  const handleMouseMove = (
    event: React.MouseEvent,
    point: { x: number; y: number },
    index: number
  ) => {
    const coords = localPoint(event);
    if (!coords) return;
    showTooltip({
      tooltipData: { x: point.x, y: point.y, index },
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
    });
  };

  return (
    <>
      <svg
        width={parentWidth}
        height={parentHeight}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          <GridRows
            scale={yScale}
            width={width}
            stroke="#334155"
            strokeOpacity={0.5}
            numTicks={5}
          />
          <GridColumns
            scale={xScale}
            height={height}
            stroke="#334155"
            strokeOpacity={0.3}
            numTicks={5}
          />

          {/* Spec limit lines */}
          {specs?.usl !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={yScale(specs.usl)}
              y2={yScale(specs.usl)}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="6,3"
            />
          )}
          {specs?.lsl !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={yScale(specs.lsl)}
              y2={yScale(specs.lsl)}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="6,3"
            />
          )}

          {/* Quadratic curve (if recommended) */}
          {recommendedFit === 'quadratic' && quadraticCurve.length > 0 && (
            <LinePath
              data={quadraticCurve}
              x={d => xScale(d.x)}
              y={d => yScale(d.y)}
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          )}

          {/* Linear regression line (show dimmed if quadratic is recommended) */}
          {linearLine.length === 2 && (
            <LinePath
              data={linearLine}
              x={d => xScale(d.x)}
              y={d => yScale(d.y)}
              stroke={recommendedFit === 'quadratic' ? '#64748b' : '#3b82f6'}
              strokeWidth={recommendedFit === 'quadratic' ? 1 : 2}
              strokeDasharray={recommendedFit === 'quadratic' ? '4,4' : undefined}
            />
          )}

          {/* Data points */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={4}
              fill="#22c55e"
              stroke="#fff"
              strokeWidth={1}
              style={{ cursor: 'pointer' }}
              onMouseMove={e => handleMouseMove(e, p, i)}
              onMouseLeave={hideTooltip}
            />
          ))}

          {/* R² and stars label */}
          <text x={width - 8} y={16} textAnchor="end" fill="#94a3b8" fontSize={fonts.statLabel}>
            R² = {rSquared.toFixed(2)}
            {showStars && parentWidth > 200 && (
              <tspan fill="#fbbf24" dx={6}>
                {getStars(strengthRating)}
              </tspan>
            )}
          </text>

          {/* Y Axis */}
          <AxisLeft
            scale={yScale}
            stroke="#64748b"
            tickStroke="#64748b"
            numTicks={parentWidth < 300 ? 4 : 6}
            tickLabelProps={() => ({
              fill: '#94a3b8',
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dy: '0.33em',
              dx: -4,
            })}
            label={yAxisLabel && parentWidth > 250 ? yAxisLabel : ''}
            labelOffset={parentWidth < 400 ? 28 : 36}
            labelProps={{
              fill: '#94a3b8',
              fontSize: fonts.axisLabel,
              textAnchor: 'middle',
            }}
          />

          {/* X Axis */}
          <AxisBottom
            scale={xScale}
            top={height}
            stroke="#64748b"
            tickStroke="#64748b"
            numTicks={parentWidth < 300 ? 4 : 6}
            tickLabelProps={() => ({
              fill: '#94a3b8',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 4,
            })}
            label={xAxisLabel && parentWidth > 250 ? xAxisLabel : ''}
            labelOffset={parentWidth < 400 ? 24 : 32}
            labelProps={{
              fill: '#94a3b8',
              fontSize: fonts.axisLabel,
              textAnchor: 'middle',
            }}
          />

          {/* Source Bar (branding) */}
          {showBranding && (
            <ChartSourceBar
              width={width}
              top={height + margin.bottom - sourceBarHeight}
              n={points.length}
              brandingText={brandingText}
            />
          )}
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f1f5f9',
            fontSize: 12,
            padding: '8px 12px',
          }}
        >
          <div style={{ marginBottom: 4 }}>
            <strong>{xAxisLabel || 'X'}:</strong> {tooltipData.x.toFixed(3)}
          </div>
          <div>
            <strong>{yAxisLabel || 'Y'}:</strong> {tooltipData.y.toFixed(3)}
          </div>
        </TooltipWithBounds>
      )}
    </>
  );
};

// Export with responsive wrapper
const ScatterPlot = withParentSize(ScatterPlotBase);
export default ScatterPlot;

// Also export the base component for custom sizing
export { ScatterPlotBase };
