import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { LinePath, Circle } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { GridRows } from '@visx/grid';
import { calculateProbabilityPlotData, normalQuantile } from '@variscout/core';
import type { ProbabilityPlotProps } from './types';
import ChartSourceBar from './ChartSourceBar';
import { chartColors, chromeColors } from './colors';
import { useChartLayout } from './hooks';

/**
 * Standard percentile tick values for probability plots
 * These are the conventional percentiles used in Minitab/JMP probability plots
 */
const PROB_TICK_PERCENTILES = [1, 5, 10, 25, 50, 75, 90, 95, 99];
const PROB_TICK_PERCENTILES_COMPACT = [5, 25, 50, 75, 95];

/**
 * Calculate CI width at a given percentile for the fitted distribution
 * Uses asymptotic formula for percentile CI based on sample statistics
 *
 * The CI for a percentile θ_p = μ + z_p * σ depends on:
 * - Uncertainty in the mean estimate (σ/√n)
 * - Uncertainty in the std dev estimate
 * - The z-score for that percentile
 */
function calculateCIWidth(
  p: number, // percentile as decimal (0-1)
  n: number, // sample size
  stdDev: number // sample standard deviation
): number {
  // Simplified CI calculation based on MLE variance propagation
  // This gives symmetric, smooth CI bands that widen at extremes

  const z = normalQuantile(p);

  // Variance of the percentile estimate includes:
  // 1. Variance from mean estimation: σ²/n
  // 2. Variance from std dev estimation propagated through z: z² * σ²/(2n)
  // Combined: σ² * (1/n + z²/(2n)) = σ²/n * (1 + z²/2)

  const varPercentile = ((stdDev * stdDev) / n) * (1 + (z * z) / 2);
  const sePercentile = Math.sqrt(varPercentile);

  // 95% CI half-width
  return 1.96 * sePercentile;
}

/**
 * Probability Plot - Props-based version
 * Shows normality assessment with 95% confidence intervals
 *
 * Uses probability-transformed Y-axis (Minitab convention):
 * - Y-axis is scaled using inverse normal CDF (z-scores)
 * - This makes normally distributed data appear as a straight line
 * - Deviations from normality show as curves away from the fitted line
 */
const ProbabilityPlotBase: React.FC<ProbabilityPlotProps> = ({
  data,
  mean,
  stdDev,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  marginOverride,
  fontsOverride,
  signatureElement,
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'probability',
    showBranding,
    marginOverride,
    fontsOverride,
  });

  // Calculate plot data for data points
  const plotData = useMemo(() => calculateProbabilityPlotData(data), [data]);
  const n = data.length;

  // Percentiles for fitted line and CI bands (fine granularity for smooth curves)
  const fittedPercentiles = useMemo(() => {
    // Use more points for smoother CI curves
    const percentiles: number[] = [];
    for (let p = 1; p <= 99; p += 2) {
      percentiles.push(p);
    }
    return percentiles;
  }, []);

  // Fitted line with CI bands (calculated for theoretical distribution)
  const fittedLineWithCI = useMemo(() => {
    return fittedPercentiles.map(p => {
      const pDecimal = p / 100;
      const z = normalQuantile(pDecimal);
      const expectedX = mean + z * stdDev;
      const ciWidth = calculateCIWidth(pDecimal, n, stdDev);

      return {
        z,
        x: expectedX,
        lowerCI: expectedX - ciWidth,
        upperCI: expectedX + ciWidth,
      };
    });
  }, [fittedPercentiles, mean, stdDev, n]);

  // X Scale (data values) - include CI bounds
  const xScale = useMemo(() => {
    if (plotData.length === 0) return null;

    const dataValues = plotData.map(d => d.value);
    const ciValues = fittedLineWithCI.flatMap(d => [d.lowerCI, d.upperCI]);
    const allValues = [...dataValues, ...ciValues].filter(v => isFinite(v));

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 1;

    return scaleLinear({
      range: [0, width],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [plotData, fittedLineWithCI, width]);

  // Y Scale - Probability transformed (z-score based)
  const yScale = useMemo(() => {
    const zMin = normalQuantile(0.01);
    const zMax = normalQuantile(0.99);

    return scaleLinear({
      range: [height, 0],
      domain: [zMin, zMax],
    });
  }, [height]);

  // Z-scores for grid lines at standard percentiles
  const gridZScores = useMemo(() => PROB_TICK_PERCENTILES.map(p => normalQuantile(p / 100)), []);

  // Data points with z-scores
  const dataPoints = useMemo(
    () =>
      plotData.map(d => ({
        x: d.value,
        z: normalQuantile(d.expectedPercentile / 100),
      })),
    [plotData]
  );

  if (data.length === 0 || !xScale) {
    return (
      <svg width={parentWidth} height={parentHeight}>
        <text
          x={parentWidth / 2}
          y={parentHeight / 2}
          textAnchor="middle"
          fill={chromeColors.labelSecondary}
          fontSize={fonts.statLabel}
          fontStyle="italic"
        >
          No data available for probability plot
        </text>
      </svg>
    );
  }

  // Build CI band path - smooth curves based on fitted line CI
  const bandPath = useMemo(() => {
    if (fittedLineWithCI.length === 0) return '';

    const lowerPath = fittedLineWithCI
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.lowerCI)} ${yScale(d.z)}`)
      .join(' ');

    const upperPath = [...fittedLineWithCI]
      .reverse()
      .map(d => `L ${xScale(d.upperCI)} ${yScale(d.z)}`)
      .join(' ');

    return `${lowerPath} ${upperPath} Z`;
  }, [fittedLineWithCI, xScale, yScale]);

  // Tick values for axis
  const tickPercentiles = parentWidth < 300 ? PROB_TICK_PERCENTILES_COMPACT : PROB_TICK_PERCENTILES;

  return (
    <svg width={parentWidth} height={parentHeight}>
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines at standard percentile positions */}
        <GridRows
          scale={yScale}
          width={width}
          stroke={chromeColors.tooltipBorder}
          strokeOpacity={0.5}
          tickValues={gridZScores}
        />

        {/* CI Bands (shaded area) - now smooth and symmetric! */}
        <path d={bandPath} fill={chromeColors.ciband} fillOpacity={0.15} />

        {/* Lower CI line */}
        <LinePath
          data={fittedLineWithCI}
          x={d => xScale(d.lowerCI)}
          y={d => yScale(d.z)}
          stroke={chromeColors.labelMuted}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Upper CI line */}
        <LinePath
          data={fittedLineWithCI}
          x={d => xScale(d.upperCI)}
          y={d => yScale(d.z)}
          stroke={chromeColors.labelMuted}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Fitted distribution line (straight) */}
        <LinePath
          data={fittedLineWithCI}
          x={d => xScale(d.x)}
          y={d => yScale(d.z)}
          stroke={chartColors.linear}
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((d, i) => (
          <Circle
            key={i}
            cx={xScale(d.x)}
            cy={yScale(d.z)}
            r={4}
            fill={chartColors.pass}
            stroke="#fff"
            strokeWidth={1}
          />
        ))}

        {/* Y Axis (Percent) - custom tick formatting */}
        <AxisLeft
          scale={yScale}
          stroke={chromeColors.labelMuted}
          tickStroke={chromeColors.labelMuted}
          tickValues={tickPercentiles.map(p => normalQuantile(p / 100))}
          tickFormat={zValue => {
            const z = zValue as number;
            for (const p of PROB_TICK_PERCENTILES) {
              if (Math.abs(normalQuantile(p / 100) - z) < 0.01) {
                return String(p);
              }
            }
            return '';
          }}
          tickLabelProps={() => ({
            fill: chromeColors.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'end',
            dy: '0.33em',
            dx: -4,
          })}
          label={parentWidth > 300 ? 'Percent' : ''}
          labelOffset={parentWidth < 400 ? 28 : 36}
          labelProps={{
            fill: chromeColors.labelSecondary,
            fontSize: fonts.axisLabel,
            textAnchor: 'middle',
          }}
        />

        {/* X Axis (Value) */}
        <AxisBottom
          scale={xScale}
          top={height}
          stroke={chromeColors.labelMuted}
          tickStroke={chromeColors.labelMuted}
          numTicks={parentWidth < 300 ? 4 : 6}
          tickLabelProps={() => ({
            fill: chromeColors.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'middle',
            dy: 4,
          })}
        />

        {/* Optional signature element */}
        {signatureElement}

        {/* Source Bar (branding) */}
        {showBranding && (
          <ChartSourceBar
            width={width}
            top={height + margin.bottom - sourceBarHeight}
            n={data.length}
            brandingText={brandingText}
            fontSize={fonts.brandingText}
          />
        )}
      </Group>
    </svg>
  );
};

// Export with responsive wrapper
const ProbabilityPlot = withParentSize(ProbabilityPlotBase);
export default ProbabilityPlot;

// Also export the base component for custom sizing
export { ProbabilityPlotBase };
