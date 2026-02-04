/**
 * PerformancePareto - Channel Ranking by Cpk
 *
 * Shows channels ranked by Cpk (worst first) in Pareto-style bar chart.
 * Helps identify which channels need the most attention.
 *
 * Props-based component for sharing across PWA, Azure, and Excel Add-in.
 */

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar, LinePath, Circle } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { sortChannels, CPK_THRESHOLDS } from '@variscout/core';
import type { PerformanceParetoProps, ChannelResult } from './types';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { getResponsiveMargins, getScaledFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';

const DEFAULT_MAX_DISPLAYED = 20;

interface TooltipData {
  channel: ChannelResult;
  rank: number;
  cumulativePct: number;
}

export const PerformanceParetoBase: React.FC<PerformanceParetoProps> = ({
  parentWidth,
  parentHeight,
  channels,
  selectedMeasure,
  maxDisplayed = DEFAULT_MAX_DISPLAYED,
  onChannelClick,
  showBranding = true,
  cpkThresholds = CPK_THRESHOLDS,
}) => {
  const { chrome, fontScale } = useChartTheme();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'pareto', sourceBarHeight);
  const fonts = getScaledFonts(parentWidth, fontScale);

  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = React.useState(0);
  const [tooltipTop, setTooltipTop] = React.useState(0);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Sort channels by Cpk ascending (worst first) and limit display
  const sortedChannels = useMemo(() => {
    const sorted = sortChannels(channels, 'cpk-asc');
    return sorted.slice(0, maxDisplayed);
  }, [channels, maxDisplayed]);

  // Calculate cumulative percentage (based on total channels needing review)
  const dataWithCumulative = useMemo(() => {
    const total = sortedChannels.length;
    let cumulative = 0;

    return sortedChannels.map((channel, index) => {
      cumulative++;
      return {
        channel,
        rank: index + 1,
        cumulativePct: (cumulative / total) * 100,
      };
    });
  }, [sortedChannels]);

  // X scale - channels
  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, width],
        domain: dataWithCumulative.map(d => d.channel.id),
        padding: 0.2,
      }),
    [dataWithCumulative, width]
  );

  // Y scale - Cpk values (inverted so lower is worse/taller)
  const yScale = useMemo(() => {
    if (dataWithCumulative.length === 0) {
      return scaleLinear({ range: [height, 0], domain: [0, 2] });
    }

    const maxCpk = Math.max(...dataWithCumulative.map(d => d.channel.cpk ?? 0), 2);

    return scaleLinear({
      range: [height, 0],
      domain: [0, maxCpk],
      nice: true,
    });
  }, [dataWithCumulative, height]);

  // Y scale for cumulative percentage (right axis)
  const yPercScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: [0, 100],
      }),
    [height]
  );

  const showTooltip = (data: TooltipData, x: number, y: number) => {
    setTooltipData(data);
    setTooltipLeft(x + margin.left);
    setTooltipTop(y + margin.top);
  };

  const hideTooltip = () => {
    setTooltipData(null);
  };

  if (dataWithCumulative.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: parentHeight,
          color: chrome.labelSecondary,
        }}
      >
        <p>No channel performance data available</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke={chrome.gridLine} />

          {/* Reference lines for Cpk thresholds */}
          {/* Critical threshold line */}
          <line
            x1={0}
            x2={width}
            y1={yScale(cpkThresholds.critical)}
            y2={yScale(cpkThresholds.critical)}
            stroke={chartColors.fail}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.6}
          />
          <text
            x={width - 4}
            y={yScale(cpkThresholds.critical) - 4}
            fontSize={fonts.tickLabel}
            fill={chartColors.fail}
            textAnchor="end"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {cpkThresholds.critical.toFixed(2)}
          </text>

          {/* Warning threshold line */}
          <line
            x1={0}
            x2={width}
            y1={yScale(cpkThresholds.warning)}
            y2={yScale(cpkThresholds.warning)}
            stroke={chartColors.pass}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.6}
          />
          <text
            x={width - 4}
            y={yScale(cpkThresholds.warning) - 4}
            fontSize={fonts.tickLabel}
            fill={chartColors.pass}
            textAnchor="end"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {cpkThresholds.warning.toFixed(2)}
          </text>

          {/* Bars */}
          {dataWithCumulative.map(d => {
            const cpk = d.channel.cpk ?? 0;
            const x = xScale(d.channel.id) ?? 0;
            const barHeight = height - yScale(cpk);
            const isSelected = selectedMeasure === d.channel.id;

            return (
              <Bar
                key={d.channel.id}
                x={x}
                y={yScale(cpk)}
                width={xScale.bandwidth()}
                height={Math.max(0, barHeight)}
                fill={chartColors.mean}
                fillOpacity={isSelected ? 1 : selectedMeasure ? 0.4 : 0.8}
                stroke={isSelected ? '#fff' : undefined}
                strokeWidth={isSelected ? 2 : 0}
                rx={4}
                style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
                onClick={() => onChannelClick?.(d.channel.id)}
                onMouseEnter={() => showTooltip(d, x + xScale.bandwidth() / 2, yScale(cpk))}
                onMouseLeave={hideTooltip}
              />
            );
          })}

          {/* Cumulative line */}
          <LinePath
            data={dataWithCumulative}
            x={d => (xScale(d.channel.id) ?? 0) + xScale.bandwidth() / 2}
            y={d => yPercScale(d.cumulativePct)}
            stroke={chartColors.cumulative}
            strokeWidth={2}
          />
          {dataWithCumulative.map(d => (
            <Circle
              key={`dot-${d.channel.id}`}
              cx={(xScale(d.channel.id) ?? 0) + xScale.bandwidth() / 2}
              cy={yPercScale(d.cumulativePct)}
              r={3}
              fill={chartColors.cumulative}
              stroke={chrome.pointStroke}
              strokeWidth={1}
            />
          ))}

          {/* X Axis */}
          <AxisBottom
            scale={xScale}
            top={height}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 4,
              angle: dataWithCumulative.length > 10 ? -45 : 0,
            })}
            tickFormat={channelId => {
              const data = dataWithCumulative.find(d => d.channel.id === channelId);
              const label = data?.channel.label ?? channelId;
              return label.length > 8 ? label.slice(0, 8) + '…' : label;
            }}
          />

          {/* Left Y Axis (Cpk) */}
          <AxisLeft
            scale={yScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
            })}
          />

          {/* Y Axis Label */}
          <text
            x={-height / 2}
            y={-margin.left + 14}
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            textAnchor="middle"
            transform="rotate(-90)"
          >
            Cpk
          </text>

          {/* Right Y Axis (Cumulative %) */}
          <AxisRight
            scale={yPercScale}
            left={width}
            stroke={chartColors.cumulative}
            tickStroke={chartColors.cumulative}
            tickLabelProps={() => ({
              fill: chartColors.cumulative,
              fontSize: fonts.tickLabel,
              textAnchor: 'start',
              dx: 4,
              dy: 3,
              fontFamily: 'monospace',
            })}
            tickFormat={v => `${v}%`}
          />
        </Group>

        {/* Source Bar */}
        {showBranding && (
          <ChartSourceBar
            width={parentWidth}
            top={parentHeight - getSourceBarHeight()}
            n={channels.length}
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            backgroundColor: chrome.tooltipBg,
            color: chrome.labelPrimary,
            border: `1px solid ${chrome.gridLine}`,
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: fonts.tickLabel,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 600 }}>{tooltipData.channel.label}</div>
            <div>
              Rank: <span style={{ fontFamily: 'monospace' }}>#{tooltipData.rank}</span>
            </div>
            <div>
              Cpk:{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {tooltipData.channel.cpk?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div>
              n: <span style={{ fontFamily: 'monospace' }}>{tooltipData.channel.n}</span>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

const PerformancePareto = withParentSize(PerformanceParetoBase);
export default PerformancePareto;
