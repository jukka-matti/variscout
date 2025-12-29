import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { LinePath, Circle, Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { IChartProps } from './types';
import { getResponsiveMargins, getResponsiveFonts, getResponsiveTickCount } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';

/**
 * I-Chart (Individual Control Chart) - Props-based version
 * Shows time series data with control limits and optional spec limits
 */
const IChartBase: React.FC<IChartProps> = ({
  data,
  stats,
  specs,
  grades,
  yAxisLabel = 'Value',
  axisSettings,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onPointClick,
  sampleSize,
}) => {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<{ x: number; y: number; index: number }>();

  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'ichart', sourceBarHeight);
  const fonts = getResponsiveFonts(parentWidth);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Determine Y domain
  const yDomain = useMemo(() => {
    if (axisSettings?.min !== undefined && axisSettings?.max !== undefined) {
      return [axisSettings.min, axisSettings.max] as [number, number];
    }

    const values = data.map(d => d.y);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    // Include control limits
    if (stats) {
      minVal = Math.min(minVal, stats.lcl);
      maxVal = Math.max(maxVal, stats.ucl);
    }

    // Include spec limits
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    // Include grade thresholds
    if (grades && grades.length > 0) {
      const gradeMax = Math.max(...grades.map(g => g.max));
      maxVal = Math.max(maxVal, gradeMax);
    }

    // Add padding
    const padding = (maxVal - minVal) * 0.1;
    return [minVal - padding, maxVal + padding] as [number, number];
  }, [data, stats, specs, grades, axisSettings]);

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [0, width],
        domain: [0, Math.max(data.length - 1, 1)],
      }),
    [data.length, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: yDomain,
        nice: true,
      }),
    [height, yDomain]
  );

  const xTickCount = getResponsiveTickCount(width, 'x');
  const yTickCount = getResponsiveTickCount(height, 'y');

  // Determine point color based on specs or grades
  const getPointColor = (value: number): string => {
    // Check grades first (multi-tier)
    if (grades && grades.length > 0) {
      const grade = grades.find(g => value <= g.max);
      return grade?.color || '#ef4444'; // Default red if above all grades
    }

    // Check spec limits
    if (specs.usl !== undefined && value > specs.usl) return '#ef4444'; // Red - above USL
    if (specs.lsl !== undefined && value < specs.lsl) return '#f59e0b'; // Amber - below LSL

    return '#22c55e'; // Green - in spec
  };

  if (data.length === 0) return null;

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke="#1e293b" />

          {/* Grade bands (if defined) */}
          {grades &&
            grades.map((grade, i) => {
              const prevMax = i === 0 ? yDomain[0] : grades[i - 1].max;
              const y1 = yScale(grade.max);
              const y2 = yScale(prevMax);
              return (
                <rect
                  key={grade.label}
                  x={0}
                  y={Math.min(y1, y2)}
                  width={width}
                  height={Math.abs(y2 - y1)}
                  fill={grade.color}
                  opacity={0.1}
                />
              );
            })}

          {/* Control limits */}
          {stats && (
            <>
              {/* UCL */}
              <Line
                from={{ x: 0, y: yScale(stats.ucl) }}
                to={{ x: width, y: yScale(stats.ucl) }}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              {/* Mean */}
              <Line
                from={{ x: 0, y: yScale(stats.mean) }}
                to={{ x: width, y: yScale(stats.mean) }}
                stroke="#3b82f6"
                strokeWidth={1.5}
              />
              {/* LCL */}
              <Line
                from={{ x: 0, y: yScale(stats.lcl) }}
                to={{ x: width, y: yScale(stats.lcl) }}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            </>
          )}

          {/* Spec limits */}
          {specs.usl !== undefined && (
            <Line
              from={{ x: 0, y: yScale(specs.usl) }}
              to={{ x: width, y: yScale(specs.usl) }}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6,3"
            />
          )}
          {specs.lsl !== undefined && (
            <Line
              from={{ x: 0, y: yScale(specs.lsl) }}
              to={{ x: width, y: yScale(specs.lsl) }}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6,3"
            />
          )}
          {specs.target !== undefined && (
            <Line
              from={{ x: 0, y: yScale(specs.target) }}
              to={{ x: width, y: yScale(specs.target) }}
              stroke="#22c55e"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          )}

          {/* Data line */}
          <LinePath
            data={data}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeOpacity={0.5}
          />

          {/* Data points */}
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={4}
              fill={getPointColor(d.y)}
              stroke="#0f172a"
              strokeWidth={1}
              className={onPointClick ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => onPointClick?.(i, d.originalIndex)}
              onMouseOver={() =>
                showTooltip({
                  tooltipLeft: xScale(d.x),
                  tooltipTop: yScale(d.y),
                  tooltipData: { x: d.x, y: d.y, index: i },
                })
              }
              onMouseLeave={hideTooltip}
            />
          ))}

          {/* Axes */}
          <AxisLeft
            scale={yScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            numTicks={yTickCount}
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
            })}
          />

          {/* Y-Axis label */}
          <text
            x={parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50}
            y={height / 2}
            transform={`rotate(-90 ${parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50} ${height / 2})`}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {yAxisLabel}
          </text>

          <AxisBottom
            top={height}
            scale={xScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            numTicks={xTickCount}
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* X-Axis label */}
          <text
            x={width / 2}
            y={height + (parentWidth < 400 ? 30 : 40)}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            Observation
          </text>

          {/* Source Bar (branding) */}
          {showBranding && (
            <ChartSourceBar
              width={width}
              top={height + margin.bottom - sourceBarHeight}
              n={sampleSize ?? data.length}
              brandingText={brandingText}
            />
          )}
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={margin.left + (tooltipLeft ?? 0)}
          top={margin.top + (tooltipTop ?? 0)}
          style={{
            ...defaultStyles,
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
          }}
        >
          <div>
            <strong>#{tooltipData.index + 1}</strong>
          </div>
          <div>Value: {tooltipData.y.toFixed(2)}</div>
        </TooltipWithBounds>
      )}
    </>
  );
};

// Export with responsive wrapper
const IChart = withParentSize(IChartBase);
export default IChart;

// Also export the base component for custom sizing
export { IChartBase };
