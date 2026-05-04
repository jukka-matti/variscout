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
import { PARETO_Y_METRICS } from '@variscout/core/pareto';
import type { ParetoYMetricId, ParetoYMetric } from '@variscout/core/pareto';
import type { PerformanceParetoProps, ChannelResult } from './types';
import { chartColors } from './colors';
import { useChartTheme, getDocumentFontScale } from './useChartTheme';
import { getResponsiveMargins, getScaledFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';

const DEFAULT_MAX_DISPLAYED = 20;

interface TooltipData {
  channel: ChannelResult;
  rank: number;
  cumulativePct: number;
}

/**
 * Supported Y metrics for PerformancePareto.
 *
 * Uses pre-computed ChannelResult fields:
 *   - 'cpk':               d.channel.cpk (smallerIsWorse → ascending sort)
 *   - 'percent-out-of-spec': d.channel.outOfSpecPercentage (largerIsWorse → descending sort)
 *
 * Note: computeParetoY from @variscout/core/pareto operates on raw DataRow[]; this
 * component uses already-aggregated ChannelResult[], so we read the pre-computed
 * fields directly (Option B migration — raw-row wiring is a future task).
 */
export const PERFORMANCE_PARETO_Y_METRICS: ParetoYMetric[] = [
  PARETO_Y_METRICS['cpk'],
  PARETO_Y_METRICS['percent-out-of-spec'],
];

/** Get the Y value for a channel given the active metric. */
function getChannelYValue(channel: ChannelResult, metricId: ParetoYMetricId): number {
  switch (metricId) {
    case 'percent-out-of-spec':
      return channel.outOfSpecPercentage;
    case 'cpk':
    default:
      return channel.cpk ?? 0;
  }
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
  yMetric = 'cpk',
  availableYMetrics,
  onYMetricSwitch,
}) => {
  const { chrome, formatStat } = useChartTheme();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'pareto', sourceBarHeight);
  const fonts = getScaledFonts(parentWidth, getDocumentFontScale());

  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = React.useState(0);
  const [tooltipTop, setTooltipTop] = React.useState(0);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Sort channels by the active metric (worst first) and limit display.
  // cpk: ascending (lower Cpk = worse) — uses sortChannels for consistent null handling.
  // percent-out-of-spec: descending (higher % = worse) — sort by outOfSpecPercentage desc.
  const sortedChannels = useMemo(() => {
    let sorted: ChannelResult[];
    if (yMetric === 'percent-out-of-spec') {
      sorted = [...channels].sort((a, b) => b.outOfSpecPercentage - a.outOfSpecPercentage);
    } else {
      // Default: cpk ascending (worst first)
      sorted = sortChannels(channels, 'cpk-asc');
    }
    return sorted.slice(0, maxDisplayed);
  }, [channels, maxDisplayed, yMetric]);

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

  // Y scale — domain driven by the active metric's values.
  // For cpk: [0, max(cpk, 2)] so reference threshold lines fit.
  // For percent-out-of-spec: [0, 100] (always a percentage).
  const yScale = useMemo(() => {
    if (dataWithCumulative.length === 0) {
      return scaleLinear({
        range: [height, 0],
        domain: [0, yMetric === 'percent-out-of-spec' ? 100 : 2],
      });
    }

    if (yMetric === 'percent-out-of-spec') {
      return scaleLinear({
        range: [height, 0],
        domain: [0, 100],
      });
    }

    const maxCpk = Math.max(...dataWithCumulative.map(d => d.channel.cpk ?? 0), 2);
    return scaleLinear({
      range: [height, 0],
      domain: [0, maxCpk],
      nice: true,
    });
  }, [dataWithCumulative, height, yMetric]);

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

  // Show Cpk threshold lines only when the y metric is cpk (they are meaningless for % out-of-spec)
  const showCpkThresholds = yMetric !== 'percent-out-of-spec';

  // Picker visibility: requires ≥ 2 available options and an onYMetricSwitch callback
  const showPicker =
    availableYMetrics !== undefined && availableYMetrics.length >= 2 && !!onYMetricSwitch;

  return (
    <div style={{ position: 'relative' }}>
      {/* Y-metric picker chip — positioned top-right, above the SVG */}
      {showPicker && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 8,
            zIndex: 10,
            display: 'flex',
            gap: 4,
          }}
        >
          {availableYMetrics!.map(m => (
            <button
              key={m.id}
              aria-label="Y axis metric"
              aria-pressed={m.id === yMetric}
              onClick={() => onYMetricSwitch!(m.id)}
              title={m.description ?? m.label}
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background:
                  m.id === yMetric ? `${chartColors.selected}33` : `${chrome.labelSecondary}26`,
                color: m.id === yMetric ? chartColors.selected : chrome.labelSecondary,
                fontWeight: m.id === yMetric ? 600 : 400,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
      <svg
        width={parentWidth}
        height={parentHeight}
        role="img"
        aria-label={`Performance Pareto: ${yMetric === 'percent-out-of-spec' ? '% out of spec' : 'Cpk'} ranking`}
      >
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke={chrome.gridLine} />

          {/* Reference lines for Cpk thresholds — only shown in cpk mode */}
          {showCpkThresholds && (
            <>
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
                {formatStat(cpkThresholds.critical)}
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
                {formatStat(cpkThresholds.warning)}
              </text>
            </>
          )}

          {/* Bars */}
          {dataWithCumulative.map(d => {
            const yValue = getChannelYValue(d.channel, yMetric);
            const x = xScale(d.channel.id) ?? 0;
            const barHeight = height - yScale(yValue);
            const isSelected = selectedMeasure === d.channel.id;

            return (
              <Bar
                key={d.channel.id}
                x={x}
                y={yScale(yValue)}
                width={xScale.bandwidth()}
                height={Math.max(0, barHeight)}
                fill={chartColors.mean}
                fillOpacity={isSelected ? 1 : selectedMeasure ? 0.4 : 0.8}
                stroke={isSelected ? chrome.tooltipText : undefined}
                strokeWidth={isSelected ? 2 : 0}
                rx={4}
                style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
                onClick={() => onChannelClick?.(d.channel.id)}
                onMouseEnter={() => showTooltip(d, x + xScale.bandwidth() / 2, yScale(yValue))}
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
            {yMetric === 'percent-out-of-spec' ? '% out of spec' : 'Cpk'}
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
            {yMetric === 'percent-out-of-spec' ? (
              <div>
                % out of spec:{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {formatStat(tooltipData.channel.outOfSpecPercentage, 1)}%
                </span>
              </div>
            ) : (
              <div>
                Cpk:{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {tooltipData.channel.cpk !== undefined && tooltipData.channel.cpk !== null
                    ? formatStat(tooltipData.channel.cpk)
                    : 'N/A'}
                </span>
              </div>
            )}
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
