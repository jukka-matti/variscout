/**
 * PerformanceBoxplot - Channel Distribution Comparison
 *
 * Shows boxplots for selected channel or top worst-performing channels.
 * When a channel is selected, shows detailed distribution for that channel.
 * When no channel is selected, shows comparison of worst N channels.
 *
 * Props-based component for sharing across PWA, Azure, and Excel Add-in.
 */

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar, Line } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { getWorstChannels, CPK_THRESHOLDS } from '@variscout/core';
import type { PerformanceBoxplotProps, ChannelResult } from './types';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { getResponsiveMargins, getScaledFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import * as d3 from 'd3';

const DEFAULT_MAX_DISPLAYED = 5;

interface BoxplotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

function calculateBoxplotStats(values: number[]): BoxplotStats | null {
  if (values.length < 5) return null;

  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: d3.min(sorted) ?? 0,
    q1: d3.quantile(sorted, 0.25) ?? 0,
    median: d3.quantile(sorted, 0.5) ?? 0,
    q3: d3.quantile(sorted, 0.75) ?? 0,
    max: d3.max(sorted) ?? 0,
    mean: d3.mean(sorted) ?? 0,
  };
}

interface TooltipData {
  channel: ChannelResult;
  stats: BoxplotStats;
}

export const PerformanceBoxplotBase: React.FC<PerformanceBoxplotProps> = ({
  parentWidth,
  parentHeight,
  channels,
  specs,
  selectedMeasure,
  maxDisplayed = DEFAULT_MAX_DISPLAYED,
  onChannelClick,
  showBranding = true,
  showStatsTable = false,
  cpkThresholds = CPK_THRESHOLDS,
}) => {
  const { chrome, fontScale } = useChartTheme();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'boxplot', sourceBarHeight);
  const fonts = getScaledFonts(parentWidth, fontScale);

  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = React.useState(0);
  const [tooltipTop, setTooltipTop] = React.useState(0);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Determine which channels to display
  const displayedChannels = useMemo(() => {
    if (channels.length === 0) return [];

    // If a measure is selected, show only that measure
    if (selectedMeasure) {
      const selected = channels.find(c => c.id === selectedMeasure);
      return selected ? [selected] : [];
    }

    // Otherwise, show worst N measures
    return getWorstChannels(channels, maxDisplayed);
  }, [channels, selectedMeasure, maxDisplayed]);

  // Calculate boxplot stats for each channel
  const boxplotData = useMemo(() => {
    return displayedChannels
      .map(channel => ({
        channel,
        stats: calculateBoxplotStats(channel.values),
      }))
      .filter((d): d is { channel: ChannelResult; stats: BoxplotStats } => d.stats !== null);
  }, [displayedChannels]);

  // X scale - channels
  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, width],
        domain: boxplotData.map(d => d.channel.id),
        padding: 0.3,
      }),
    [boxplotData, width]
  );

  // Y scale - measurement values
  const yScale = useMemo(() => {
    if (boxplotData.length === 0) {
      return scaleLinear({ range: [height, 0], domain: [0, 100] });
    }

    let minVal = Math.min(...boxplotData.map(d => d.stats.min));
    let maxVal = Math.max(...boxplotData.map(d => d.stats.max));

    // Include spec limits
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    const padding = (maxVal - minVal) * 0.1;

    return scaleLinear({
      range: [height, 0],
      domain: [minVal - padding, maxVal + padding],
      nice: true,
    });
  }, [boxplotData, height, specs]);

  const showTooltip = (data: { channel: ChannelResult; stats: BoxplotStats }, x: number) => {
    setTooltipData(data);
    setTooltipLeft(x + margin.left);
    setTooltipTop(yScale(data.stats.median) + margin.top);
  };

  const hideTooltip = () => {
    setTooltipData(null);
  };

  if (boxplotData.length === 0) {
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
        <p>Select a channel or load performance data</p>
      </div>
    );
  }

  const boxWidth = xScale.bandwidth();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          {/* Spec limits */}
          {specs.usl !== undefined && (
            <Line
              from={{ x: 0, y: yScale(specs.usl) }}
              to={{ x: width, y: yScale(specs.usl) }}
              stroke={chartColors.spec}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}
          {specs.lsl !== undefined && (
            <Line
              from={{ x: 0, y: yScale(specs.lsl) }}
              to={{ x: width, y: yScale(specs.lsl) }}
              stroke={chartColors.spec}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}

          {/* Boxplots */}
          {boxplotData.map(({ channel, stats }) => {
            const x = xScale(channel.id) ?? 0;
            const isSelected = selectedMeasure === channel.id;

            return (
              <Group
                key={channel.id}
                style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
                onClick={() => onChannelClick?.(channel.id)}
                onMouseEnter={() => showTooltip({ channel, stats }, x + boxWidth / 2)}
                onMouseLeave={hideTooltip}
              >
                {/* Vertical line (whiskers) */}
                <Line
                  from={{ x: x + boxWidth / 2, y: yScale(stats.min) }}
                  to={{ x: x + boxWidth / 2, y: yScale(stats.max) }}
                  stroke={chrome.whisker}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Min whisker cap */}
                <Line
                  from={{ x: x + boxWidth * 0.25, y: yScale(stats.min) }}
                  to={{ x: x + boxWidth * 0.75, y: yScale(stats.min) }}
                  stroke={chrome.whisker}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Max whisker cap */}
                <Line
                  from={{ x: x + boxWidth * 0.25, y: yScale(stats.max) }}
                  to={{ x: x + boxWidth * 0.75, y: yScale(stats.max) }}
                  stroke={chrome.whisker}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Box (Q1 to Q3) */}
                <Bar
                  x={x}
                  y={yScale(stats.q3)}
                  width={boxWidth}
                  height={Math.max(0, yScale(stats.q1) - yScale(stats.q3))}
                  fill={isSelected ? chartColors.selected : chrome.boxDefault}
                  stroke={isSelected ? chartColors.selectedBorder : chrome.boxBorder}
                  strokeWidth={isSelected ? 2 : 1}
                  rx={2}
                />

                {/* Median line */}
                <Line
                  from={{ x: x, y: yScale(stats.median) }}
                  to={{ x: x + boxWidth, y: yScale(stats.median) }}
                  stroke={chartColors.cumulative}
                  strokeWidth={2}
                />

                {/* Mean marker (diamond) */}
                <polygon
                  points={`
                    ${x + boxWidth / 2},${yScale(stats.mean) - 4}
                    ${x + boxWidth / 2 + 4},${yScale(stats.mean)}
                    ${x + boxWidth / 2},${yScale(stats.mean) + 4}
                    ${x + boxWidth / 2 - 4},${yScale(stats.mean)}
                  `}
                  fill={chrome.labelPrimary}
                />
              </Group>
            );
          })}

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
            })}
            tickFormat={channelId => {
              const channel = boxplotData.find(d => d.channel.id === channelId);
              return channel?.channel.label ?? channelId;
            }}
          />

          {/* n Labels (always visible below X-axis) */}
          {boxplotData.map(({ channel }) => {
            const x = xScale(channel.id) ?? 0;
            return (
              <text
                key={`n-${channel.id}`}
                x={x + boxWidth / 2}
                y={height + (parentWidth < 400 ? 32 : 40)}
                textAnchor="middle"
                fill={chrome.labelMuted}
                fontSize={fonts.statLabel - 2}
              >
                n={channel.n}
              </text>
            );
          })}

          {/* Y Axis */}
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
            Value
          </text>
        </Group>

        {/* Source Bar */}
        {showBranding && (
          <ChartSourceBar
            width={parentWidth}
            top={parentHeight - getSourceBarHeight()}
            n={boxplotData.reduce((sum, d) => sum + d.channel.n, 0)}
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0 16px',
                fontSize: '0.75rem',
              }}
            >
              <span>Max:</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.stats.max.toFixed(2)}</span>
              <span>Q3:</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.stats.q3.toFixed(2)}</span>
              <span>Median:</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.stats.median.toFixed(2)}</span>
              <span>Mean:</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.stats.mean.toFixed(2)}</span>
              <span>Q1:</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.stats.q1.toFixed(2)}</span>
              <span>Min:</span>
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.stats.min.toFixed(2)}</span>
            </div>
            <div style={{ paddingTop: '4px', borderTop: `1px solid ${chrome.gridLine}` }}>
              Cpk:{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {tooltipData.channel.cpk?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
          </div>
        </TooltipWithBounds>
      )}

      {/* Stats Table (optional) */}
      {showStatsTable && boxplotData.length > 0 && (
        <div style={{ marginTop: 8, fontSize: fonts.tickLabel }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: `1px solid ${chrome.gridLine}`,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: chrome.tooltipBg }}>
                <th
                  style={{
                    padding: '4px 8px',
                    textAlign: 'left',
                    color: chrome.labelPrimary,
                    borderBottom: `1px solid ${chrome.gridLine}`,
                  }}
                >
                  Channel
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: chrome.labelPrimary,
                    borderBottom: `1px solid ${chrome.gridLine}`,
                  }}
                >
                  n
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: chrome.labelPrimary,
                    borderBottom: `1px solid ${chrome.gridLine}`,
                  }}
                >
                  Mean
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: chrome.labelPrimary,
                    borderBottom: `1px solid ${chrome.gridLine}`,
                  }}
                >
                  StdDev
                </th>
                <th
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: chrome.labelPrimary,
                    borderBottom: `1px solid ${chrome.gridLine}`,
                  }}
                >
                  Cpk
                </th>
              </tr>
            </thead>
            <tbody>
              {boxplotData.map(({ channel, stats }) => (
                <tr key={channel.id}>
                  <td
                    style={{
                      padding: '4px 8px',
                      color: chrome.labelPrimary,
                      borderBottom: `1px solid ${chrome.gridLine}`,
                    }}
                  >
                    {channel.label}
                  </td>
                  <td
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      color: chrome.labelSecondary,
                      fontFamily: 'monospace',
                      borderBottom: `1px solid ${chrome.gridLine}`,
                    }}
                  >
                    {channel.n}
                  </td>
                  <td
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      color: chrome.labelSecondary,
                      fontFamily: 'monospace',
                      borderBottom: `1px solid ${chrome.gridLine}`,
                    }}
                  >
                    {stats.mean.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      color: chrome.labelSecondary,
                      fontFamily: 'monospace',
                      borderBottom: `1px solid ${chrome.gridLine}`,
                    }}
                  >
                    {channel.stdDev?.toFixed(3) ?? '-'}
                  </td>
                  <td
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      color:
                        channel.cpk !== undefined && channel.cpk < cpkThresholds.warning
                          ? chartColors.fail
                          : chrome.labelSecondary,
                      fontFamily: 'monospace',
                      fontWeight:
                        channel.cpk !== undefined && channel.cpk < cpkThresholds.warning
                          ? 600
                          : 400,
                      borderBottom: `1px solid ${chrome.gridLine}`,
                    }}
                  >
                    {channel.cpk?.toFixed(2) ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const PerformanceBoxplot = withParentSize(PerformanceBoxplotBase);
export default PerformanceBoxplot;
