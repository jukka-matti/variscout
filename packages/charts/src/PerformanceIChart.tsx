/**
 * PerformanceIChart - I-Chart for Capability Metrics (Cpk/Cp)
 *
 * Displays Cpk or Cp values for each channel as an Individuals Control Chart.
 * X-axis: Channel index (1, 2, 3, ... n)
 * Y-axis: Cpk or Cp value
 * Control limits: UCL/LCL calculated from Cpk/Cp distribution across channels
 * Point coloring: Standard I-Chart logic (blue = in-control, red = out-of-control)
 * Target line: User-defined reference (default 1.33)
 *
 * Props-based component for sharing across PWA, Azure, and Excel Add-in.
 */

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Circle, Line } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import type { PerformanceIChartProps, ChannelResult } from './types';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { getResponsiveMargins, getScaledFonts, getResponsiveTickCount } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import {
  calculateCapabilityControlLimits,
  getCapabilityControlStatus,
  type CapabilityControlStatus,
} from '@variscout/core';

interface TooltipData {
  channel: ChannelResult;
  x: number;
  y: number;
  status: CapabilityControlStatus | undefined;
}

/** Default Cpk target (industry standard for ~63 PPM defects) */
const DEFAULT_CPK_TARGET = 1.33;

export interface PerformanceIChartBaseProps extends PerformanceIChartProps {
  /** User-defined Cpk/Cp target line (default: 1.33) */
  cpkTarget?: number;
}

export const PerformanceIChartBase: React.FC<PerformanceIChartBaseProps> = ({
  parentWidth,
  parentHeight,
  channels,
  selectedMeasure,
  onChannelClick,
  showBranding = true,
  capabilityMetric = 'cpk',
  cpkTarget = DEFAULT_CPK_TARGET,
}) => {
  const { chrome, fontScale } = useChartTheme();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'ichart', sourceBarHeight);
  const fonts = getScaledFonts(parentWidth, fontScale);

  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const [tooltipLeft, setTooltipLeft] = React.useState(0);
  const [tooltipTop, setTooltipTop] = React.useState(0);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Calculate control limits from capability values across channels
  const controlLimits = useMemo(
    () => calculateCapabilityControlLimits(channels, capabilityMetric),
    [channels, capabilityMetric]
  );

  // Determine control status for each channel
  const controlStatus = useMemo(() => {
    if (!controlLimits) return new Map<string, CapabilityControlStatus>();
    return getCapabilityControlStatus(channels, controlLimits, capabilityMetric);
  }, [channels, controlLimits, capabilityMetric]);

  // X scale - band scale for channels
  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, width],
        domain: channels.map((_, i) => i.toString()),
        padding: 0.1,
      }),
    [channels, width]
  );

  // Metric label for display
  const metricLabel = capabilityMetric === 'cp' ? 'Cp' : 'Cpk';

  // Y scale - capability metric values with control limits and target
  const yScale = useMemo(() => {
    if (channels.length === 0) {
      return scaleLinear({ range: [height, 0], domain: [0, 2] });
    }

    const metricValues = channels.map(c => c[capabilityMetric] ?? 0).filter(v => v > 0);
    let minMetric = Math.min(...metricValues, 0);
    let maxMetric = Math.max(...metricValues, 2);

    // Include control limits in scale
    if (controlLimits) {
      minMetric = Math.min(minMetric, controlLimits.lcl);
      maxMetric = Math.max(maxMetric, controlLimits.ucl);
    }

    // Include target in scale
    maxMetric = Math.max(maxMetric, cpkTarget);

    const padding = (maxMetric - minMetric) * 0.1;

    return scaleLinear({
      range: [height, 0],
      domain: [Math.min(minMetric - padding, 0), maxMetric + padding],
      nice: true,
    });
  }, [channels, height, capabilityMetric, controlLimits, cpkTarget]);

  const xTickCount = getResponsiveTickCount(width, 'x');

  // Get point color based on control status (I-Chart style)
  const getPointColor = (channelId: string): string => {
    const status = controlStatus.get(channelId);
    if (!status) return chrome.labelSecondary;

    // Out of control = red, in control = blue
    if (!status.inControl || status.nelsonRule2Violation) {
      return chartColors.fail; // Red
    }
    return chartColors.mean; // Blue (in-control)
  };

  const showTooltip = (channel: ChannelResult, index: number) => {
    const x = (xScale(index.toString()) ?? 0) + xScale.bandwidth() / 2;
    const y = yScale(channel[capabilityMetric] ?? 0);
    const status = controlStatus.get(channel.id);
    setTooltipData({ channel, x, y, status });
    setTooltipLeft(x + margin.left);
    setTooltipTop(y + margin.top);
  };

  const hideTooltip = () => {
    setTooltipData(null);
  };

  if (channels.length === 0) {
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

          {/* Control Limits (when available) */}
          {controlLimits && (
            <>
              {/* UCL line - cyan for Voice of the Process */}
              <Line
                from={{ x: 0, y: yScale(controlLimits.ucl) }}
                to={{ x: width, y: yScale(controlLimits.ucl) }}
                stroke={chartColors.control}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
              <text
                x={width - 4}
                y={yScale(controlLimits.ucl) - 4}
                fill={chartColors.control}
                fontSize={fonts.statLabel}
                textAnchor="end"
              >
                UCL = {controlLimits.ucl.toFixed(2)}
              </text>

              {/* Mean line */}
              <Line
                from={{ x: 0, y: yScale(controlLimits.mean) }}
                to={{ x: width, y: yScale(controlLimits.mean) }}
                stroke={chartColors.mean}
                strokeWidth={1.5}
              />
              <text
                x={width - 4}
                y={yScale(controlLimits.mean) - 4}
                fill={chartColors.mean}
                fontSize={fonts.statLabel}
                textAnchor="end"
              >
                x̄ = {controlLimits.mean.toFixed(2)}
              </text>

              {/* LCL line - cyan for Voice of the Process */}
              <Line
                from={{ x: 0, y: yScale(controlLimits.lcl) }}
                to={{ x: width, y: yScale(controlLimits.lcl) }}
                stroke={chartColors.control}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
              <text
                x={width - 4}
                y={yScale(controlLimits.lcl) + 12}
                fill={chartColors.control}
                fontSize={fonts.statLabel}
                textAnchor="end"
              >
                LCL = {controlLimits.lcl.toFixed(2)}
              </text>
            </>
          )}

          {/* Target line (user-defined reference) */}
          <Line
            from={{ x: 0, y: yScale(cpkTarget) }}
            to={{ x: width, y: yScale(cpkTarget) }}
            stroke={chartColors.pass}
            strokeWidth={1.5}
            strokeDasharray="4,2"
          />
          <text
            x={4}
            y={yScale(cpkTarget) - 4}
            fill={chartColors.pass}
            fontSize={fonts.statLabel}
            textAnchor="start"
          >
            Target = {cpkTarget}
          </text>

          {/* Data points */}
          {channels.map((channel, i) => {
            const metricValue = channel[capabilityMetric] ?? 0;
            const x = (xScale(i.toString()) ?? 0) + xScale.bandwidth() / 2;
            const y = yScale(metricValue);
            const isSelected = selectedMeasure === channel.id;
            const pointColor = getPointColor(channel.id);

            return (
              <Circle
                key={channel.id}
                cx={x}
                cy={y}
                r={isSelected ? 8 : 5}
                fill={pointColor}
                stroke={isSelected ? '#fff' : chrome.pointStroke}
                strokeWidth={isSelected ? 2 : 1}
                opacity={selectedMeasure && !isSelected ? 0.4 : 1}
                style={{ cursor: onChannelClick ? 'pointer' : 'default' }}
                onClick={() => onChannelClick?.(channel.id)}
                onMouseEnter={() => showTooltip(channel, i)}
                onMouseLeave={hideTooltip}
              />
            );
          })}

          {/* X Axis */}
          <AxisBottom
            scale={xScale}
            top={height}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={Math.min(xTickCount, channels.length)}
            tickFormat={(_, i) => {
              // Show channel labels for smaller datasets, or indices for larger
              if (channels.length <= 20) {
                return channels[Number(i)]?.label ?? '';
              }
              return String(Number(i) + 1);
            }}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 4,
            })}
          />

          {/* X Axis Label */}
          <text
            x={width / 2}
            y={height + margin.bottom - 10}
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            textAnchor="middle"
          >
            Channel
          </text>

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
            {metricLabel}
          </text>
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
              Cp:{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {tooltipData.channel.cp?.toFixed(2) ?? 'N/A'}
              </span>
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
            <div>
              Mean:{' '}
              <span style={{ fontFamily: 'monospace' }}>{tooltipData.channel.mean.toFixed(2)}</span>
            </div>
            {/* Control status */}
            {tooltipData.status && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    tooltipData.status.inControl && !tooltipData.status.nelsonRule2Violation
                      ? chartColors.mean
                      : chartColors.fail,
                }}
              >
                {!tooltipData.status.inControl
                  ? 'Out of control (beyond UCL/LCL)'
                  : tooltipData.status.nelsonRule2Violation
                    ? 'Nelson Rule 2 violation'
                    : 'In control'}
              </div>
            )}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

const PerformanceIChart = withParentSize(PerformanceIChartBase);
export default PerformanceIChart;
