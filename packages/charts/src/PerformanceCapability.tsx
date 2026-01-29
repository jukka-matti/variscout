/**
 * PerformanceCapability - Channel Histogram with Stats
 *
 * Shows detailed capability histogram for the selected channel.
 * Includes spec limits, mean, and capability metrics.
 *
 * Props-based component for sharing across PWA, Azure, and Excel Add-in.
 */

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar, Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import type { PerformanceCapabilityProps } from './types';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { getResponsiveMargins, getScaledFonts } from './responsive';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import * as d3 from 'd3';

const NUM_BINS = 15;

interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

function calculateHistogram(values: number[], numBins: number): HistogramBin[] {
  if (values.length === 0) return [];

  const min = d3.min(values) ?? 0;
  const max = d3.max(values) ?? 1;
  const binWidth = (max - min) / numBins;

  // Initialize bins
  const bins: HistogramBin[] = Array.from({ length: numBins }, (_, i) => ({
    x0: min + i * binWidth,
    x1: min + (i + 1) * binWidth,
    count: 0,
  }));

  // Count values into bins
  values.forEach(v => {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), numBins - 1);
    if (binIndex >= 0 && binIndex < bins.length) {
      bins[binIndex].count++;
    }
  });

  return bins;
}

export const PerformanceCapabilityBase: React.FC<PerformanceCapabilityProps> = ({
  parentWidth,
  parentHeight,
  channel,
  specs,
  showBranding = true,
}) => {
  const { chrome, fontScale } = useChartTheme();
  const sourceBarHeight = getSourceBarHeight(showBranding);
  const margin = getResponsiveMargins(parentWidth, 'histogram', sourceBarHeight);
  const fonts = getScaledFonts(parentWidth, fontScale);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Calculate histogram bins
  const bins = useMemo(() => {
    if (!channel) return [];
    return calculateHistogram(channel.values, NUM_BINS);
  }, [channel]);

  // X scale - value range
  const xScale = useMemo(() => {
    if (bins.length === 0) {
      return scaleLinear({ range: [0, width], domain: [0, 100] });
    }

    let minX = bins[0].x0;
    let maxX = bins[bins.length - 1].x1;

    // Include spec limits in domain
    if (specs.lsl !== undefined) minX = Math.min(minX, specs.lsl);
    if (specs.usl !== undefined) maxX = Math.max(maxX, specs.usl);

    const padding = (maxX - minX) * 0.05;

    return scaleLinear({
      range: [0, width],
      domain: [minX - padding, maxX + padding],
    });
  }, [bins, width, specs]);

  // Y scale - count
  const yScale = useMemo(() => {
    const maxCount = Math.max(...bins.map(b => b.count), 1);

    return scaleLinear({
      range: [height, 0],
      domain: [0, maxCount * 1.1],
      nice: true,
    });
  }, [bins, height]);

  if (!channel) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: parentHeight,
          color: chrome.labelSecondary,
          padding: '16px',
        }}
      >
        <p style={{ textAlign: 'center' }}>Click on a channel to see its capability histogram</p>
      </div>
    );
  }

  const { mean, stdDev, cpk, n } = channel;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke={chrome.gridLine} />

          {/* Histogram bars */}
          {bins.map((bin, i) => {
            const barWidth = xScale(bin.x1) - xScale(bin.x0) - 2;
            const barHeight = height - yScale(bin.count);

            // Color bars based on spec position
            let fillColor: string = chartColors.pass;
            if (specs.usl !== undefined && bin.x0 >= specs.usl) {
              fillColor = chartColors.fail;
            } else if (specs.lsl !== undefined && bin.x1 <= specs.lsl) {
              fillColor = chartColors.warning;
            }

            return (
              <Bar
                key={i}
                x={xScale(bin.x0) + 1}
                y={yScale(bin.count)}
                width={Math.max(0, barWidth)}
                height={Math.max(0, barHeight)}
                fill={fillColor}
                fillOpacity={0.6}
                stroke={fillColor}
                strokeWidth={1}
                rx={2}
              />
            );
          })}

          {/* Spec limits */}
          {specs.lsl !== undefined && (
            <>
              <Line
                from={{ x: xScale(specs.lsl), y: 0 }}
                to={{ x: xScale(specs.lsl), y: height }}
                stroke={chartColors.spec}
                strokeWidth={2}
                strokeDasharray="6,4"
              />
              <text
                x={xScale(specs.lsl) - 4}
                y={12}
                fill={chartColors.spec}
                fontSize={fonts.statLabel}
                textAnchor="end"
              >
                LSL
              </text>
            </>
          )}
          {specs.usl !== undefined && (
            <>
              <Line
                from={{ x: xScale(specs.usl), y: 0 }}
                to={{ x: xScale(specs.usl), y: height }}
                stroke={chartColors.spec}
                strokeWidth={2}
                strokeDasharray="6,4"
              />
              <text
                x={xScale(specs.usl) + 4}
                y={12}
                fill={chartColors.spec}
                fontSize={fonts.statLabel}
                textAnchor="start"
              >
                USL
              </text>
            </>
          )}

          {/* Mean line */}
          <Line
            from={{ x: xScale(mean), y: 0 }}
            to={{ x: xScale(mean), y: height }}
            stroke={chartColors.mean}
            strokeWidth={2}
          />
          <text
            x={xScale(mean)}
            y={-6}
            fill={chartColors.mean}
            fontSize={fonts.statLabel}
            textAnchor="middle"
          >
            μ = {mean.toFixed(2)}
          </text>

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
              fontFamily: 'monospace',
            })}
          />

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
            Count
          </text>
        </Group>

        {/* Stats overlay */}
        <Group left={parentWidth - 120} top={margin.top + 8}>
          <rect
            x={0}
            y={0}
            width={110}
            height={75}
            fill={chrome.tooltipBg}
            fillOpacity={0.9}
            rx={4}
          />
          <text
            x={8}
            y={18}
            fill={chrome.labelPrimary}
            fontSize={fonts.statLabel}
            fontWeight="bold"
          >
            {channel.label}
          </text>
          <text x={8} y={38} fill={chrome.labelSecondary} fontSize={10}>
            n = {n}
          </text>
          <text x={8} y={52} fill={chrome.labelSecondary} fontSize={10}>
            σ = {stdDev.toFixed(3)}
          </text>
          {cpk !== undefined && (
            <text x={8} y={66} fill={chrome.labelPrimary} fontSize={11} fontWeight="bold">
              Cpk = {cpk.toFixed(2)}
            </text>
          )}
        </Group>

        {/* Source Bar */}
        {showBranding && (
          <ChartSourceBar width={parentWidth} top={parentHeight - getSourceBarHeight()} n={n} />
        )}
      </svg>
    </div>
  );
};

const PerformanceCapability = withParentSize(PerformanceCapabilityBase);
export default PerformanceCapability;
