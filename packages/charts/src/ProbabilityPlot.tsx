import React, { useMemo, useState, useCallback } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { LinePath, Circle } from '@visx/shape';
import { withParentSize } from '@visx/responsive';
import { GridRows } from '@visx/grid';
import { normalQuantile, safeMin, safeMax } from '@variscout/core';
import type { ProbabilityPlotProps } from './types';
import ChartSourceBar from './ChartSourceBar';
import { useChartTheme } from './useChartTheme';
import { useChartLayout } from './hooks';
import { operatorColors } from './colors';
import { useMultiSelection } from './hooks/useMultiSelection';

/**
 * Standard percentile tick values for probability plots
 */
const PROB_TICK_PERCENTILES = [1, 5, 10, 25, 50, 75, 90, 95, 99];
const PROB_TICK_PERCENTILES_COMPACT = [5, 25, 50, 75, 95];

/** Fine-grained percentiles for smooth fitted line and CI curves */
const FITTED_PERCENTILES: number[] = [];
for (let p = 1; p <= 99; p += 2) {
  FITTED_PERCENTILES.push(p);
}

/**
 * Calculate CI width at a given percentile for the fitted distribution
 */
function calculateCIWidth(p: number, n: number, stdDev: number): number {
  const z = normalQuantile(p);
  const varPercentile = ((stdDev * stdDev) / n) * (1 + (z * z) / 2);
  const sePercentile = Math.sqrt(varPercentile);
  return 1.96 * sePercentile;
}

/** Computed fitted line point with CI bounds */
interface FittedPoint {
  z: number;
  x: number;
  lowerCI: number;
  upperCI: number;
}

function computeFittedLine(mean: number, stdDev: number, n: number): FittedPoint[] {
  return FITTED_PERCENTILES.map(p => {
    const pDecimal = p / 100;
    const z = normalQuantile(pDecimal);
    const expectedX = mean + z * stdDev;
    const ciWidth = calculateCIWidth(pDecimal, n, stdDev);
    return { z, x: expectedX, lowerCI: expectedX - ciWidth, upperCI: expectedX + ciWidth };
  });
}

/** Empty set reused as default for selectedPoints to avoid re-renders */
const EMPTY_SET = new Set<number>();
/** No-op reused as default for onSelectionChange */
const NOOP_SELECTION = () => {};

/**
 * Multi-series Probability Plot
 *
 * Renders one or more series on shared axes with:
 * - Per-series fitted lines and data points
 * - CI bands on hover
 * - Brush selection for cross-chart highlighting
 * - Right-click for findings creation
 * - Series hover tooltip
 */
const ProbabilityPlotBase: React.FC<ProbabilityPlotProps> = ({
  series,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  marginOverride,
  fontsOverride,
  selectedPoints,
  onSelectionChange,
  onChartContextMenu,
  onSeriesHover,
}) => {
  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'probability',
    showBranding,
    marginOverride,
    fontsOverride,
  });

  const { chrome, colors, t } = useChartTheme();
  const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);

  // Compute fitted lines per series
  const seriesFitted = useMemo(
    () => series.map(s => ({ key: s.key, fitted: computeFittedLine(s.mean, s.stdDev, s.n) })),
    [series]
  );

  // Compute data points with z-scores per series
  const seriesDataPoints = useMemo(
    () =>
      series.map(s => ({
        key: s.key,
        points: s.points.map(d => ({
          x: d.value,
          z: normalQuantile(d.expectedPercentile / 100),
        })),
      })),
    [series]
  );

  // Flat data points for brush selection (all series combined)
  const allDataPoints = useMemo(() => {
    const flat: {
      x: number;
      z: number;
      seriesIndex: number;
      pointIndex: number;
      globalIndex: number;
    }[] = [];
    let globalIdx = 0;
    series.forEach((s, si) => {
      s.points.forEach((d, pi) => {
        flat.push({
          x: d.value,
          z: normalQuantile(d.expectedPercentile / 100),
          seriesIndex: si,
          pointIndex: pi,
          globalIndex: globalIdx++,
        });
      });
    });
    return flat;
  }, [series]);

  // X Scale (data values) — union of all series
  const xScale = useMemo(() => {
    if (series.length === 0) return null;

    const allValues: number[] = [];
    series.forEach(s => {
      s.points.forEach(d => allValues.push(d.value));
    });
    seriesFitted.forEach(sf => {
      sf.fitted.forEach(d => {
        allValues.push(d.lowerCI, d.upperCI);
      });
    });

    const finiteVals = allValues.filter(v => isFinite(v));
    if (finiteVals.length === 0) return null;

    const min = safeMin(finiteVals);
    const max = safeMax(finiteVals);
    const padding = (max - min) * 0.1 || 1;

    return scaleLinear({
      range: [0, width],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [series, seriesFitted, width]);

  // Y Scale — probability-transformed z-scores
  const yScale = useMemo(() => {
    const zMin = normalQuantile(0.01);
    const zMax = normalQuantile(0.99);
    return scaleLinear({ range: [height, 0], domain: [zMin, zMax] });
  }, [height]);

  // Grid z-scores
  const gridZScores = useMemo(() => PROB_TICK_PERCENTILES.map(p => normalQuantile(p / 100)), []);

  // Brush selection
  const brushSelection = useMultiSelection({
    data: allDataPoints,
    xScale: xScale as {
      (v: number): number | undefined;
      invert(v: number): number;
      range(): number[];
      domain(): number[];
    },
    yScale: yScale as {
      (v: number): number | undefined;
      invert(v: number): number;
      range(): number[];
      domain(): number[];
    },
    selectedPoints: selectedPoints ?? EMPTY_SET,
    onSelectionChange: onSelectionChange ?? NOOP_SELECTION,
    getX: d => d.x,
    getY: d => d.z,
    enableBrush: !!onSelectionChange,
    margin: { left: margin.left, top: margin.top },
  });

  // Handle series hover
  const handleSeriesEnter = useCallback(
    (seriesKey: string, event: React.MouseEvent) => {
      setHoveredSeriesKey(seriesKey);
      const s = series.find(s => s.key === seriesKey);
      if (s && onSeriesHover) {
        onSeriesHover(s, { x: event.clientX, y: event.clientY });
      }
    },
    [series, onSeriesHover]
  );

  const handleSeriesLeave = useCallback(() => {
    setHoveredSeriesKey(null);
    onSeriesHover?.(null, { x: 0, y: 0 });
  }, [onSeriesHover]);

  // Right-click context menu
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<SVGElement>) => {
      if (!onChartContextMenu) return;
      event.preventDefault();

      const svg = event.currentTarget.closest('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const clickX = event.clientX - rect.left - margin.left;
      const clickY = event.clientY - rect.top - margin.top;

      // Normalize to 0-1
      const anchorX = Math.max(0, Math.min(1, clickX / width));
      const anchorY = Math.max(0, Math.min(1, clickY / height));

      // Check if near a series line for series-aware annotation
      let nearestSeriesKey: string | undefined;
      const hitThreshold = 15; // pixels

      series.forEach((s, si) => {
        const dp = seriesDataPoints[si];
        if (!dp || !xScale) return;

        for (const pt of dp.points) {
          const px = xScale(pt.x);
          const py = yScale(pt.z);
          if (px === undefined || py === undefined) continue;
          const dx = event.clientX - rect.left - margin.left - (px as number);
          const dy = event.clientY - rect.top - margin.top - (py as number);
          if (Math.sqrt(dx * dx + dy * dy) < hitThreshold) {
            nearestSeriesKey = s.key;
            break;
          }
        }
      });

      onChartContextMenu(anchorX, anchorY, nearestSeriesKey);
    },
    [onChartContextMenu, margin, width, height, series, seriesDataPoints, xScale, yScale]
  );

  // Empty state
  if (series.length === 0 || !xScale) {
    return (
      <svg
        width={parentWidth}
        height={parentHeight}
        role="img"
        aria-label="Probability plot: no data available"
      >
        <text
          x={parentWidth / 2}
          y={parentHeight / 2}
          textAnchor="middle"
          fill={chrome.labelSecondary}
          fontSize={fonts.statLabel}
          fontStyle="italic"
        >
          {t('chart.noDataProbPlot')}
        </text>
      </svg>
    );
  }

  const tickPercentiles = parentWidth < 300 ? PROB_TICK_PERCENTILES_COMPACT : PROB_TICK_PERCENTILES;
  const isMultiSeries = series.length > 1;
  const hasSelection = (selectedPoints?.size ?? 0) > 0;
  const totalN = series.reduce((sum, s) => sum + s.n, 0);

  return (
    <svg
      width={parentWidth}
      height={parentHeight}
      role="img"
      aria-label={`Probability plot: ${series.length} series`}
      onMouseDown={brushSelection.handleBrushStart}
      onMouseMove={brushSelection.handleBrushMove}
      onMouseUp={brushSelection.handleBrushEnd}
      onContextMenu={handleContextMenu}
    >
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines at standard percentile positions */}
        <GridRows
          scale={yScale}
          width={width}
          stroke={chrome.tooltipBorder}
          strokeOpacity={0.5}
          tickValues={gridZScores}
        />

        {/* Render each series */}
        {series.map((s, si) => {
          const color = isMultiSeries ? operatorColors[si % operatorColors.length] : colors.mean;
          const fitted = seriesFitted[si]?.fitted ?? [];
          const dp = seriesDataPoints[si]?.points ?? [];
          const isHovered = hoveredSeriesKey === s.key;
          const isDimmed = hoveredSeriesKey !== null && !isHovered;
          const seriesOpacity = isDimmed ? 0.3 : 1;

          // CI band path (only for hovered or single series)
          const showCI = isHovered || (!isMultiSeries && hoveredSeriesKey === null);
          const bandPath =
            showCI && fitted.length > 0
              ? [
                  ...fitted.map(
                    (d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.lowerCI)} ${yScale(d.z)}`
                  ),
                  ...[...fitted].reverse().map(d => `L ${xScale(d.upperCI)} ${yScale(d.z)}`),
                  'Z',
                ].join(' ')
              : '';

          // Compute global point offset for brush selection indexing
          let globalOffset = 0;
          for (let j = 0; j < si; j++) globalOffset += series[j].points.length;

          return (
            <g
              key={s.key}
              opacity={seriesOpacity}
              onMouseEnter={e => handleSeriesEnter(s.key, e)}
              onMouseLeave={handleSeriesLeave}
            >
              {/* CI Band (shown on hover or for single series) */}
              {bandPath && (
                <>
                  <path d={bandPath} fill={color} fillOpacity={0.1} />
                  <LinePath
                    data={fitted}
                    x={d => xScale(d.lowerCI)!}
                    y={d => yScale(d.z)!}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    strokeOpacity={0.5}
                  />
                  <LinePath
                    data={fitted}
                    x={d => xScale(d.upperCI)!}
                    y={d => yScale(d.z)!}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    strokeOpacity={0.5}
                  />
                </>
              )}

              {/* Fitted line */}
              <LinePath
                data={fitted}
                x={d => xScale(d.x)!}
                y={d => yScale(d.z)!}
                stroke={color}
                strokeWidth={2}
              />

              {/* Data points */}
              {dp.map((d, i) => {
                const globalIdx = globalOffset + i;
                const pointOpacity = hasSelection ? brushSelection.getPointOpacity(globalIdx) : 1;
                const pointSize = hasSelection ? brushSelection.getPointSize(globalIdx) : 4;

                return (
                  <Circle
                    key={i}
                    cx={xScale(d.x)!}
                    cy={yScale(d.z)!}
                    r={pointSize}
                    fill={color}
                    stroke={chrome.pointStroke}
                    strokeWidth={brushSelection.getPointStrokeWidth(globalIdx)}
                    fillOpacity={pointOpacity}
                    style={{ cursor: 'pointer' }}
                    onClick={e => brushSelection.handlePointClick(globalIdx, e)}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Y Axis (Percent) */}
        <AxisLeft
          scale={yScale}
          stroke={chrome.labelMuted}
          tickStroke={chrome.labelMuted}
          tickValues={tickPercentiles.map(p => normalQuantile(p / 100))}
          tickFormat={zValue => {
            const z = zValue as number;
            for (const p of PROB_TICK_PERCENTILES) {
              if (Math.abs(normalQuantile(p / 100) - z) < 0.01) return String(p);
            }
            return '';
          }}
          tickLabelProps={() => ({
            fill: chrome.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'end' as const,
            dy: '0.33em',
            dx: -4,
            fontFamily: 'monospace',
            fontWeight: 400,
          })}
          label={parentWidth > 300 ? t('chart.percent') : ''}
          labelOffset={parentWidth < 400 ? 28 : 36}
          labelProps={{
            fill: chrome.labelSecondary,
            fontSize: fonts.axisLabel,
            textAnchor: 'middle' as const,
          }}
        />

        {/* X Axis (Value) */}
        <AxisBottom
          scale={xScale}
          top={height}
          stroke={chrome.labelMuted}
          tickStroke={chrome.labelMuted}
          numTicks={parentWidth < 300 ? 4 : 6}
          tickLabelProps={() => ({
            fill: chrome.labelSecondary,
            fontSize: fonts.tickLabel,
            textAnchor: 'middle' as const,
            dy: 4,
            fontWeight: 400,
          })}
        />
      </Group>

      {/* Brush rectangle (at SVG root, not inside Group) */}
      {brushSelection.brushExtent && (
        <rect
          x={Math.min(brushSelection.brushExtent.x0, brushSelection.brushExtent.x1)}
          y={Math.min(brushSelection.brushExtent.y0, brushSelection.brushExtent.y1)}
          width={Math.abs(brushSelection.brushExtent.x1 - brushSelection.brushExtent.x0)}
          height={Math.abs(brushSelection.brushExtent.y1 - brushSelection.brushExtent.y0)}
          fill={colors.mean}
          fillOpacity={0.1}
          stroke={colors.mean}
          strokeWidth={1}
          strokeDasharray="4,2"
          pointerEvents="none"
        />
      )}

      {/* Legend (multi-series only) */}
      {isMultiSeries && parentWidth > 300 && (
        <g transform={`translate(${margin.left + width - series.length * 80}, ${margin.top - 8})`}>
          {series.map((s, i) => (
            <g key={s.key} transform={`translate(${i * 80}, 0)`}>
              <circle r={4} cx={0} cy={0} fill={operatorColors[i % operatorColors.length]} />
              <text x={8} y={4} fontSize={fonts.tickLabel} fill={chrome.labelPrimary}>
                {s.key.length > 8 ? s.key.slice(0, 8) + '…' : s.key}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Source Bar (branding) */}
      {showBranding && (
        <ChartSourceBar
          width={parentWidth}
          top={parentHeight - sourceBarHeight}
          n={totalN}
          brandingText={brandingText}
          fontSize={fonts.brandingText}
        />
      )}
    </svg>
  );
};

// Export with responsive wrapper
const ProbabilityPlot = withParentSize(ProbabilityPlotBase);
export default ProbabilityPlot;
export { ProbabilityPlotBase };
