import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar, Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import { bin } from 'd3-array';
import { safeMin, safeMax } from '@variscout/core';
import type { CapabilityHistogramProps } from './types';
import ChartSourceBar from './ChartSourceBar';
import { useChartTheme } from './useChartTheme';
import { useChartLayout } from './hooks';

/**
 * Capability Histogram - Props-based version
 * Shows distribution with spec limits overlay
 */
const CapabilityHistogramBase: React.FC<CapabilityHistogramProps> = ({
  data,
  specs,
  mean,
  xDomainOverride,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'histogram',
    showBranding,
  });

  const { chrome, colors } = useChartTheme();

  const bins = useMemo(() => {
    if (data.length === 0) return [];

    const minVal = safeMin(data);
    const maxVal = safeMax(data);

    // Use xDomainOverride if provided (for Y-axis lock feature)
    // Otherwise extend range to include spec limits if outside data range
    const rangeMin = xDomainOverride ? xDomainOverride.min : Math.min(minVal, specs.lsl ?? minVal);
    const rangeMax = xDomainOverride ? xDomainOverride.max : Math.max(maxVal, specs.usl ?? maxVal);

    const binGenerator = bin<number, number>().domain([rangeMin, rangeMax]).thresholds(15);

    return binGenerator(data);
  }, [data, specs.lsl, specs.usl, xDomainOverride]);

  const xScale = useMemo(() => {
    if (bins.length === 0) return null;

    const minVal = bins[0]?.x0 ?? 0;
    const maxVal = bins[bins.length - 1]?.x1 ?? 1;

    return scaleLinear({
      range: [0, width],
      domain: [minVal, maxVal],
    });
  }, [bins, width]);

  const yScale = useMemo(() => {
    if (bins.length === 0) return null;

    const maxCount = Math.max(...bins.map(b => b.length));

    return scaleLinear({
      range: [height, 0],
      domain: [0, maxCount * 1.1],
      nice: true,
    });
  }, [bins, height]);

  // Helper to determine if a bin is within spec
  const isWithinSpec = (binX0: number, binX1: number) => {
    const midpoint = (binX0 + binX1) / 2;
    const aboveLsl = specs.lsl === undefined || midpoint >= specs.lsl;
    const belowUsl = specs.usl === undefined || midpoint <= specs.usl;
    return aboveLsl && belowUsl;
  };

  if (data.length === 0 || !xScale || !yScale) {
    return null;
  }

  return (
    <svg
      width={parentWidth}
      height={parentHeight}
      role="img"
      aria-label="Capability histogram: process distribution"
    >
      <Group left={margin.left} top={margin.top}>
        {/* Histogram bars */}
        {bins.map((binData, i) => {
          const x0 = binData.x0 ?? 0;
          const x1 = binData.x1 ?? 0;
          const barX = xScale(x0);
          const barWidth = xScale(x1) - xScale(x0) - 1;
          const barHeight = height - yScale(binData.length);
          const barY = yScale(binData.length);
          const withinSpec = isWithinSpec(x0, x1);

          return (
            <Bar
              key={i}
              x={barX}
              y={barY}
              width={Math.max(0, barWidth)}
              height={Math.max(0, barHeight)}
              fill={withinSpec ? colors.pass : colors.fail}
              opacity={0.8}
              rx={2}
            />
          );
        })}

        {/* LSL line */}
        {specs.lsl !== undefined && (
          <>
            <Line
              from={{ x: xScale(specs.lsl), y: 0 }}
              to={{ x: xScale(specs.lsl), y: height }}
              stroke={colors.spec}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={xScale(specs.lsl)}
              y={-5}
              textAnchor="middle"
              fill={colors.spec}
              fontSize={fonts.statLabel}
              fontWeight="bold"
            >
              LSL
            </text>
          </>
        )}

        {/* USL line */}
        {specs.usl !== undefined && (
          <>
            <Line
              from={{ x: xScale(specs.usl), y: 0 }}
              to={{ x: xScale(specs.usl), y: height }}
              stroke={colors.spec}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={xScale(specs.usl)}
              y={-5}
              textAnchor="middle"
              fill={colors.spec}
              fontSize={fonts.statLabel}
              fontWeight="bold"
            >
              USL
            </text>
          </>
        )}

        {/* Target line */}
        {specs.target !== undefined && (
          <>
            <Line
              from={{ x: xScale(specs.target), y: 0 }}
              to={{ x: xScale(specs.target), y: height }}
              stroke={colors.target}
              strokeWidth={2}
              strokeDasharray="6,3"
            />
            <text
              x={xScale(specs.target)}
              y={-5}
              textAnchor="middle"
              fill={colors.target}
              fontSize={fonts.statLabel}
              fontWeight="bold"
            >
              Target
            </text>
          </>
        )}

        {/* Mean line */}
        <Line
          from={{ x: xScale(mean), y: 0 }}
          to={{ x: xScale(mean), y: height }}
          stroke={colors.meanAlt}
          strokeWidth={2}
        />
        <text
          x={xScale(mean)}
          y={height + 25}
          textAnchor="middle"
          fill={colors.meanAlt}
          fontSize={fonts.statLabel}
          fontWeight="bold"
        >
          Mean
        </text>

        {/* Y Axis */}
        <AxisLeft
          scale={yScale}
          numTicks={parentWidth < 300 ? 3 : 5}
          stroke={chrome.axisSecondary}
          tickStroke={chrome.axisSecondary}
          tickLabelProps={() => ({
            fill: chrome.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'end',
            dy: '0.33em',
            dx: -4,
            fontFamily: 'monospace',
            fontWeight: 400,
          })}
        />

        {/* X Axis */}
        <AxisBottom
          scale={xScale}
          top={height}
          numTicks={parentWidth < 300 ? 4 : 6}
          stroke={chrome.axisSecondary}
          tickStroke={chrome.axisSecondary}
          tickLabelProps={() => ({
            fill: chrome.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'middle',
            dy: 4,
            fontWeight: 400,
          })}
        />
      </Group>

      {/* Source Bar (branding) */}
      {showBranding && (
        <ChartSourceBar
          width={parentWidth}
          top={parentHeight - sourceBarHeight}
          n={data.length}
          brandingText={brandingText}
          fontSize={fonts.brandingText}
        />
      )}
    </svg>
  );
};

// Export with responsive wrapper
const CapabilityHistogram = withParentSize(CapabilityHistogramBase);
export default CapabilityHistogram;

// Also export the base component for custom sizing
export { CapabilityHistogramBase };
