import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { LinePath, Circle, Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import { safeMin, safeMax } from '@variscout/core';
import { useChartTheme } from './useChartTheme';
import { useChartLayout } from './hooks';
import { chartColors, chromeColors } from './colors';
import ChartSourceBar from './ChartSourceBar';
import type { ScatterFitProps } from './types';

/**
 * ScatterFit chart — scatterplot with a fitted curve overlay.
 *
 * Shows raw data points (scatter), a fitted line/curve (linear or quadratic),
 * an optional prediction band, and an optional optimum marker.
 * Used in FactorPreviewOverlay to show the continuous-factor relationship.
 */
const ScatterFitBase: React.FC<ScatterFitProps> = ({
  data,
  fittedLine,
  predictionBand,
  optimum,
  isSignificant = true,
  xLabel,
  yLabel,
  insightText,
  parentWidth,
  parentHeight,
  showBranding = false,
  brandingText,
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'scatter',
    showBranding,
  });

  const { chrome } = useChartTheme();

  // Derive x/y domains from all points
  const xDomain = useMemo(() => {
    const allX = [
      ...data.map(d => d.x),
      ...fittedLine.map(d => d.x),
      ...(predictionBand ?? []).map(d => d.x),
    ];
    if (allX.length === 0) return [0, 1] as [number, number];
    const lo = safeMin(allX);
    const hi = safeMax(allX);
    const pad = (hi - lo) * 0.05 || 0.5;
    return [lo - pad, hi + pad] as [number, number];
  }, [data, fittedLine, predictionBand]);

  const yDomain = useMemo(() => {
    const allY = [
      ...data.map(d => d.y),
      ...fittedLine.map(d => d.y),
      ...(predictionBand ?? []).flatMap(d => [d.yLow, d.yHigh]),
    ];
    if (allY.length === 0) return [0, 1] as [number, number];
    const lo = safeMin(allY);
    const hi = safeMax(allY);
    const pad = (hi - lo) * 0.1 || 0.5;
    return [lo - pad, hi + pad] as [number, number];
  }, [data, fittedLine, predictionBand]);

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [0, width],
        domain: xDomain,
        nice: true,
      }),
    [width, xDomain]
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

  const fittedLineColor = isSignificant ? chartColors.pass : chromeColors.axisSecondary;
  const optimumColor = chartColors.cpPotential;

  // Axis label bottom padding: leave room for xLabel text if provided
  const axisLabelOffset = xLabel ? 28 : 0;
  const totalHeight = parentHeight - (insightText ? 24 : 0);

  if (data.length === 0) return null;

  return (
    <svg
      width={parentWidth}
      height={totalHeight}
      role="img"
      aria-label={`Scatter plot with fitted curve${xLabel ? ` — ${xLabel}` : ''}`}
    >
      <Group left={margin.left} top={margin.top}>
        {/* Prediction band — filled area between yLow and yHigh */}
        {predictionBand && predictionBand.length > 1 && (
          <>
            {/* Upper boundary */}
            <LinePath
              data={predictionBand}
              x={d => xScale(d.x)}
              y={d => yScale(d.yHigh)}
              stroke="none"
            />
            {/* Lower boundary — rendered as a polygon fill */}
            <polygon
              points={[
                ...predictionBand.map(d => `${xScale(d.x)},${yScale(d.yHigh)}`),
                ...[...predictionBand].reverse().map(d => `${xScale(d.x)},${yScale(d.yLow)}`),
              ].join(' ')}
              fill={fittedLineColor}
              opacity={0.1}
            />
          </>
        )}

        {/* Optimum vertical dashed line */}
        {optimum && (
          <Line
            from={{ x: xScale(optimum.x), y: 0 }}
            to={{ x: xScale(optimum.x), y: height }}
            stroke={optimumColor}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Fitted curve */}
        {fittedLine.length > 1 && (
          <LinePath
            data={fittedLine}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={fittedLineColor}
            strokeWidth={2}
          />
        )}

        {/* Scatter data points */}
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r={3}
            fill={chartColors.mean}
            opacity={0.4}
          />
        ))}

        {/* Optimum marker circle at peak/valley */}
        {optimum && (
          <Circle
            cx={xScale(optimum.x)}
            cy={yScale(optimum.y)}
            r={5}
            fill={optimumColor}
            stroke="white"
            strokeWidth={1.5}
          />
        )}

        {/* Y Axis */}
        <AxisLeft
          scale={yScale}
          numTicks={parentHeight < 200 ? 3 : 5}
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
          label={yLabel}
          labelProps={{
            fill: chrome.labelSecondary,
            fontSize: fonts.axisLabel,
            textAnchor: 'middle',
          }}
        />

        {/* X Axis */}
        <AxisBottom
          scale={xScale}
          top={height}
          numTicks={parentWidth < 200 ? 3 : 5}
          stroke={chrome.axisSecondary}
          tickStroke={chrome.axisSecondary}
          tickLabelProps={() => ({
            fill: chrome.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'middle',
            dy: 4,
            fontWeight: 400,
          })}
          label={xLabel}
          labelProps={{
            fill: chrome.labelSecondary,
            fontSize: fonts.axisLabel,
            textAnchor: 'middle',
            dy: axisLabelOffset,
          }}
        />
      </Group>

      {/* Source Bar (branding) */}
      {showBranding && (
        <ChartSourceBar
          width={parentWidth}
          top={totalHeight - sourceBarHeight}
          n={data.length}
          brandingText={brandingText}
          fontSize={fonts.brandingText}
        />
      )}
    </svg>
  );
};

// Export with responsive wrapper
const ScatterFit = withParentSize(ScatterFitBase);
export default ScatterFit;

// Also export the base component for custom sizing
export { ScatterFitBase };
