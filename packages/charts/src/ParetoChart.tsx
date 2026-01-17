import React from 'react';
import { Group } from '@visx/group';
import { Bar, LinePath, Circle } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { ParetoChartProps, ParetoDataPoint } from './types';
import ChartSourceBar from './ChartSourceBar';
import { chartColors, chromeColors } from './colors';
import { useChartLayout } from './hooks';

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
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'pareto',
    showBranding,
  });

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<ParetoDataPoint>();

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
          <GridRows scale={yScale} width={width} stroke={chromeColors.gridLine} />

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
                fill={isSelected ? chartColors.selected : chromeColors.boxDefault}
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
            stroke={chartColors.threshold80}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.8}
          />
          <text
            x={width - 5}
            y={yPercScale(80) - 5}
            fill={chartColors.threshold80}
            fontSize={fonts.statLabel}
            textAnchor="end"
          >
            80%
          </text>

          {/* Cumulative Line */}
          <LinePath
            data={data}
            x={d => (xScale(d.key) || 0) + xScale.bandwidth() / 2}
            y={d => yPercScale(d.cumulativePercentage)}
            stroke={chartColors.cumulative}
            strokeWidth={2}
          />
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={(xScale(d.key) || 0) + xScale.bandwidth() / 2}
              cy={yPercScale(d.cumulativePercentage)}
              r={3}
              fill={chartColors.cumulative}
              stroke={chromeColors.pointStroke}
              strokeWidth={1}
            />
          ))}

          {/* Left Y-Axis (Count) */}
          <AxisLeft
            scale={yScale}
            stroke={chromeColors.axisPrimary}
            tickStroke={chromeColors.axisPrimary}
            tickLabelProps={() => ({
              fill: chromeColors.labelPrimary,
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
            fill={chromeColors.labelPrimary}
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {yAxisLabel}
          </text>

          {/* Right Y-Axis (Percentage) */}
          <AxisRight
            scale={yPercScale}
            left={width}
            stroke={chromeColors.axisPrimary}
            tickStroke={chromeColors.axisPrimary}
            label={parentWidth > 400 ? 'Cumulative %' : '%'}
            labelProps={{
              fill: chromeColors.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dx: parentWidth < 400 ? 20 : 35,
            }}
            tickLabelProps={() => ({
              fill: chromeColors.labelPrimary,
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
            stroke={chromeColors.axisPrimary}
            tickStroke={chromeColors.axisPrimary}
            tickLabelProps={() => ({
              fill: chromeColors.labelPrimary,
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
            fill={chromeColors.labelPrimary}
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
              fontSize={fonts.brandingText}
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
            backgroundColor: chromeColors.tooltipBg,
            color: chromeColors.tooltipText,
            border: `1px solid ${chromeColors.tooltipBorder}`,
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: fonts.tooltipText,
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
