import React from 'react';
import { Group } from '@visx/group';
import { Bar, LinePath, Circle } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { ParetoChartProps, ParetoDataPoint } from './types';
import { getResponsiveMargins, getResponsiveFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';

/**
 * Pareto Chart - Props-based version
 * Shows frequency analysis with cumulative percentage line
 */
const ParetoChartBase: React.FC<ParetoChartProps> = ({
  data,
  totalCount,
  xAxisLabel = 'Category',
  yAxisLabel = 'Count',
  selectedBars = [],
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onBarClick,
}) => {
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'pareto', sourceBarHeight);
  const fonts = getResponsiveFonts(parentWidth);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<ParetoDataPoint>();

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  const xScale = scaleBand({
    range: [0, width],
    domain: data.map(d => d.key),
    padding: 0.2,
  });

  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, Math.max(0, ...data.map(d => d.value))],
    nice: true,
  });

  const yPercScale = scaleLinear({
    range: [height, 0],
    domain: [0, 100],
  });

  if (data.length === 0) return null;

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke="#1e293b" />

          {/* Bars */}
          {data.map((d, i) => {
            const isSelected = selectedBars.includes(d.key);
            const hasSelection = selectedBars.length > 0;

            return (
              <Bar
                key={i}
                x={xScale(d.key)}
                y={yScale(d.value)}
                width={xScale.bandwidth()}
                height={height - yScale(d.value)}
                fill={isSelected ? '#0ea5e9' : '#475569'}
                rx={4}
                onClick={() => onBarClick?.(d.key)}
                onMouseOver={() =>
                  showTooltip({
                    tooltipLeft: (xScale(d.key) || 0) + xScale.bandwidth(),
                    tooltipTop: yScale(d.value),
                    tooltipData: d,
                  })
                }
                onMouseLeave={hideTooltip}
                className={onBarClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                opacity={hasSelection && !isSelected ? 0.3 : 1}
              />
            );
          })}

          {/* 80% Reference Line */}
          <line
            x1={0}
            x2={width}
            y1={yPercScale(80)}
            y2={yPercScale(80)}
            stroke="#f97316"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.8}
          />
          <text x={width - 5} y={yPercScale(80) - 5} fill="#f97316" fontSize={10} textAnchor="end">
            80%
          </text>

          {/* Cumulative Line */}
          <LinePath
            data={data}
            x={d => (xScale(d.key) || 0) + xScale.bandwidth() / 2}
            y={d => yPercScale(d.cumulativePercentage)}
            stroke="#f97316"
            strokeWidth={2}
          />
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={(xScale(d.key) || 0) + xScale.bandwidth() / 2}
              cy={yPercScale(d.cumulativePercentage)}
              r={3}
              fill="#f97316"
              stroke="#0f172a"
              strokeWidth={1}
            />
          ))}

          {/* Left Y-Axis (Count) */}
          <AxisLeft
            scale={yScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
            })}
          />

          {/* Y-Axis Label */}
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

          {/* Right Y-Axis (Percentage) */}
          <AxisRight
            scale={yPercScale}
            left={width}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            label={parentWidth > 400 ? 'Cumulative %' : '%'}
            labelProps={{
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dx: parentWidth < 400 ? 20 : 35,
            }}
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'start',
              dx: 4,
              dy: 3,
            })}
          />

          {/* X-Axis */}
          <AxisBottom
            top={height}
            scale={xScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* X-Axis Label */}
          <text
            x={width / 2}
            y={height + (parentWidth < 400 ? 30 : 40)}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {xAxisLabel}
          </text>

          {/* Source Bar (branding) */}
          {showBranding && (
            <ChartSourceBar
              width={width}
              top={height + margin.bottom - sourceBarHeight}
              n={totalCount}
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
            <strong>{tooltipData.key}</strong>
          </div>
          <div>Count: {tooltipData.value}</div>
          <div>Cumulative: {tooltipData.cumulativePercentage.toFixed(1)}%</div>
        </TooltipWithBounds>
      )}
    </>
  );
};

// Export with responsive wrapper
const ParetoChart = withParentSize(ParetoChartBase);
export default ParetoChart;

// Also export the base component for custom sizing
export { ParetoChartBase };
