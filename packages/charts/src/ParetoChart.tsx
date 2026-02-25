import React from 'react';
import { Group } from '@visx/group';
import { Bar, LinePath, Circle } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { ParetoChartProps, ParetoDataPoint } from './types';
import ChartSourceBar from './ChartSourceBar';
import { useChartTheme } from './useChartTheme';
import { useChartLayout, useChartTooltip, useSelectionState } from './hooks';
import { interactionStyles } from './styles/interactionStyles';
import { getBarA11yProps, getInteractiveA11yProps } from './utils/accessibility';

/** Map highlight color name to hex fill color */
const getHighlightFillColors = (colors: Record<string, string>) => ({
  red: colors.fail,
  amber: colors.warning,
  green: colors.pass,
});

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
  onYAxisClick,
  onXAxisClick,
  comparisonData,
  tooltipContent,
  highlightedCategories,
  onBarContextMenu,
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'pareto',
    showBranding,
  });

  const { chrome, colors, mode } = useChartTheme();
  const isExecutive = mode === 'executive';
  const highlightFillColors = getHighlightFillColors(colors);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltipAtCoords, hideTooltip } =
    useChartTooltip<ParetoDataPoint>();

  const { isSelected, getOpacity } = useSelectionState({
    selectedKeys: selectedBars,
  });

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
      <svg
        width={parentWidth}
        height={parentHeight}
        role="img"
        aria-label="Pareto chart: category frequency analysis"
      >
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={width}
            stroke={chrome.gridLine}
            strokeDasharray={isExecutive ? '2,4' : undefined}
            strokeOpacity={isExecutive ? 0.5 : 1}
          />

          {/* Ghost bars - comparison data (rendered behind regular bars) */}
          {comparisonData &&
            data.map((d, i) => {
              const expectedValue = comparisonData.get(d.key);
              if (expectedValue === undefined) return null;
              return (
                <Bar
                  key={`ghost-${i}`}
                  x={xScale(d.key)}
                  y={yScale(expectedValue)}
                  width={xScale.bandwidth()}
                  height={height - yScale(expectedValue)}
                  fill={chrome.axisSecondary}
                  opacity={0.3}
                  rx={4}
                  stroke={chrome.axisPrimary}
                  strokeWidth={1}
                  strokeDasharray="4,2"
                  pointerEvents="none"
                />
              );
            })}

          {/* Bars */}
          {data.map((d, i) => (
            <Bar
              key={i}
              x={xScale(d.key)}
              y={yScale(d.value)}
              width={xScale.bandwidth()}
              height={height - yScale(d.value)}
              fill={
                highlightedCategories?.[d.key]
                  ? highlightFillColors[highlightedCategories[d.key]]
                  : isSelected(d.key)
                    ? colors.selected
                    : chrome.boxDefault
              }
              fillOpacity={highlightedCategories?.[d.key] ? 0.7 : 1}
              rx={4}
              onClick={() => onBarClick?.(d.key)}
              onContextMenu={
                onBarContextMenu
                  ? (e: React.MouseEvent) => {
                      e.preventDefault();
                      onBarContextMenu(d.key, e);
                    }
                  : undefined
              }
              onMouseOver={() =>
                showTooltipAtCoords((xScale(d.key) || 0) + xScale.bandwidth(), yScale(d.value), d)
              }
              onMouseLeave={hideTooltip}
              className={onBarClick || onBarContextMenu ? interactionStyles.clickable : ''}
              opacity={getOpacity(d.key)}
              {...getBarA11yProps(d.key, d.value, onBarClick ? () => onBarClick(d.key) : undefined)}
            />
          ))}

          {/* 80% Reference Line */}
          <line
            x1={0}
            x2={width}
            y1={yPercScale(80)}
            y2={yPercScale(80)}
            stroke={colors.threshold80}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.8}
          />
          <text
            x={width - 5}
            y={yPercScale(80) - 5}
            fill={colors.threshold80}
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
            stroke={colors.cumulative}
            strokeWidth={2}
          />
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={(xScale(d.key) || 0) + xScale.bandwidth() / 2}
              cy={yPercScale(d.cumulativePercentage)}
              r={3}
              fill={colors.cumulative}
              stroke={chrome.pointStroke}
              strokeWidth={1}
            />
          ))}

          {/* Left Y-Axis (Count) */}
          <AxisLeft
            scale={yScale}
            stroke={isExecutive ? 'transparent' : chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: isExecutive ? 'Inter, sans-serif' : 'monospace',
              fontWeight: isExecutive ? 500 : 400,
            })}
          />

          {/* Y-Axis Label */}
          <text
            x={parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50}
            y={height / 2}
            transform={`rotate(-90 ${parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50} ${height / 2})`}
            textAnchor="middle"
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            fontWeight={500}
            onClick={onYAxisClick}
            className={onYAxisClick ? interactionStyles.clickableSubtle : ''}
            {...getInteractiveA11yProps('Edit axis label', onYAxisClick)}
          >
            {onYAxisClick && <title>Click to edit axis label</title>}
            {yAxisLabel}
          </text>

          {/* Right Y-Axis (Percentage) */}
          <AxisRight
            scale={yPercScale}
            left={width}
            stroke={isExecutive ? 'transparent' : chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            label={parentWidth > 400 ? 'Cumulative %' : '%'}
            labelProps={{
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dx: parentWidth < 400 ? 20 : 35,
            }}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'start',
              dx: 4,
              dy: 3,
              fontFamily: isExecutive ? 'Inter, sans-serif' : 'monospace',
              fontWeight: isExecutive ? 500 : 400,
            })}
          />

          {/* X-Axis */}
          <AxisBottom
            top={height}
            scale={xScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
              fontFamily: isExecutive ? 'Inter, sans-serif' : undefined,
              fontWeight: isExecutive ? 500 : 400,
            })}
          />

          {/* X-Axis Label */}
          <text
            x={width / 2}
            y={height + (parentWidth < 400 ? 30 : 40)}
            textAnchor="middle"
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            fontWeight={500}
            onClick={onXAxisClick}
            className={onXAxisClick ? interactionStyles.clickableSubtle : ''}
            {...getInteractiveA11yProps('Edit axis label', onXAxisClick)}
          >
            {onXAxisClick && <title>Click to edit axis label</title>}
            {xAxisLabel}
          </text>
        </Group>

        {/* Source Bar (branding) */}
        {showBranding && (
          <ChartSourceBar
            width={parentWidth}
            top={parentHeight - sourceBarHeight}
            n={totalCount}
            brandingText={brandingText}
            fontSize={fonts.brandingText}
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={margin.left + (tooltipLeft ?? 0)}
          top={margin.top + (tooltipTop ?? 0)}
          style={{
            ...defaultStyles,
            backgroundColor: chrome.tooltipBg,
            color: chrome.tooltipText,
            border: `1px solid ${chrome.tooltipBorder}`,
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: fonts.tooltipText,
          }}
        >
          {tooltipContent ? (
            tooltipContent(tooltipData)
          ) : (
            <>
              <div>
                <strong>{tooltipData.key}</strong>
              </div>
              <div>Count: {tooltipData.value}</div>
              <div>Cumulative: {tooltipData.cumulativePercentage.toFixed(1)}%</div>
            </>
          )}
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
