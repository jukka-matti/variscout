import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Circle } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { getStageBoundaries } from '@variscout/core';
import type { StageBoundary } from './types';
import type { IChartProps } from './types';
import { getResponsiveTickCount } from './responsive';
import ChartSourceBar from './ChartSourceBar';
import ChartLegend from './ChartLegend';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { useChartLayout, useChartTooltip } from './hooks';
import { useMultiSelection } from './hooks/useMultiSelection';
import { interactionStyles } from './styles/interactionStyles';
import { getInteractiveA11yProps } from './utils/accessibility';
import { computeIChartYDomain } from './ichart/computeYDomain';
import { useNelsonViolations } from './ichart/useNelsonViolations';
import NelsonSequenceOverlay from './ichart/NelsonSequenceOverlay';
import ControlLines from './ichart/ControlLines';
import DataPoints from './ichart/DataPoints';
import IChartTooltip from './ichart/IChartTooltip';

/**
 * I-Chart (Individual Control Chart) - Props-based version
 * Shows time series data with control limits and optional spec limits
 */
const IChartBase: React.FC<IChartProps> = ({
  data,
  stats,
  stagedStats,
  specs,
  yAxisLabel = 'Value',
  axisSettings,
  yDomainOverride,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onPointClick,
  enableBrushSelection = false,
  selectedPoints = new Set(),
  onSelectionChange,
  sampleSize,
  showLimitLabels = true,
  onSpecClick,
  onYAxisClick,
  highlightedPointIndex,
  showLegend = false,
  legendMode = 'educational',
  secondaryData,
  secondaryStats,
  primaryLabel,
  secondaryLabel,
  targetLabel,
}) => {
  const { chrome, formatStat, t, tf } = useChartTheme();
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltipAtCoords, hideTooltip } =
    useChartTooltip<{ x: number; y: number; index: number; stage?: string; timeValue?: string }>();

  const { fonts, margin, width, height, sourceBarHeight } = useChartLayout({
    parentWidth,
    parentHeight,
    chartType: 'ichart',
    showBranding,
  });

  // Calculate stage boundaries when staged mode is active
  const stageBoundaries = useMemo<StageBoundary[]>(() => {
    if (!stagedStats) return [];
    return getStageBoundaries(data, stagedStats);
  }, [data, stagedStats]);

  const isStaged = stageBoundaries.length > 0;
  const hasSecondary = secondaryData && secondaryData.length > 0;

  // Determine Y domain
  const yDomain = useMemo(() => {
    const baseDomain = computeIChartYDomain(
      data,
      stats,
      specs,
      isStaged,
      stageBoundaries,
      axisSettings,
      yDomainOverride
    );

    if (!hasSecondary) return baseDomain;

    let [min, max] = baseDomain;
    for (const d of secondaryData!) {
      if (d.y < min) min = d.y;
      if (d.y > max) max = d.y;
    }
    if (secondaryStats) {
      if (secondaryStats.ucl > max) max = secondaryStats.ucl;
      if (secondaryStats.lcl < min) min = secondaryStats.lcl;
    }
    const range = max - min;
    return [min - range * 0.05, max + range * 0.05] as [number, number];
  }, [
    data,
    stats,
    isStaged,
    stageBoundaries,
    specs,
    axisSettings,
    yDomainOverride,
    hasSecondary,
    secondaryData,
    secondaryStats,
  ]);

  const xScale = useMemo(
    () =>
      scaleLinear({
        range: [0, width],
        domain: [0, Math.max(data.length - 1, 1)],
      }),
    [data.length, width]
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

  const xTickCount = getResponsiveTickCount(width, 'x');
  const yTickCount = getResponsiveTickCount(height, 'y');

  // Multi-point selection (Minitab-style brushing)
  const {
    brushExtent,
    isBrushing,
    handleBrushStart,
    handleBrushMove,
    handleBrushEnd,
    handlePointClick: handleBrushPointClick,
    isPointSelected,
    getPointOpacity,
    getPointSize,
    getPointStrokeWidth,
  } = useMultiSelection({
    data,
    xScale,
    yScale,
    selectedPoints,
    onSelectionChange: onSelectionChange || (() => {}),
    getX: d => d.x,
    getY: d => d.y,
    enableBrush: enableBrushSelection,
    margin: { left: margin.left, top: margin.top },
  });

  // Compute Nelson Rule 2 & 3 violations
  const {
    nelsonRule2Violations,
    nelsonRule2Sequences,
    nelsonRule3Violations,
    nelsonRule3Sequences,
  } = useNelsonViolations({
    data,
    stats,
    isStaged,
    stagedStats,
    stageBoundaries,
  });

  if (data.length === 0) return null;

  return (
    <>
      <svg
        width={parentWidth}
        height={parentHeight}
        role="img"
        aria-label={`I-Chart: ${yAxisLabel} control chart with ${data.length} data points`}
        onMouseDown={enableBrushSelection ? handleBrushStart : undefined}
        onMouseMove={enableBrushSelection ? handleBrushMove : undefined}
        onMouseUp={enableBrushSelection ? handleBrushEnd : undefined}
        onMouseLeave={enableBrushSelection ? handleBrushEnd : undefined}
        style={{ cursor: enableBrushSelection && !isBrushing ? 'crosshair' : 'default' }}
      >
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={width}
            stroke={chrome.gridLine}
            strokeOpacity={isStaged ? 0.15 : 0.4}
          />

          {/* Control limits, spec limits, and secondary series limits */}
          <ControlLines
            width={width}
            height={height}
            yScale={yScale}
            xScale={xScale}
            stats={stats}
            specs={specs}
            isStaged={isStaged}
            stageBoundaries={stageBoundaries}
            showLimitLabels={showLimitLabels}
            fonts={fonts}
            chrome={chrome}
            formatStat={formatStat}
            t={t}
            tf={tf}
            onSpecClick={onSpecClick}
            targetLabel={targetLabel}
            secondaryStats={secondaryStats}
            hasSecondary={!!hasSecondary}
          />

          {/* Nelson Rule 2 & 3 sequence highlighting */}
          <NelsonSequenceOverlay
            data={data}
            rule2Sequences={nelsonRule2Sequences}
            rule3Sequences={nelsonRule3Sequences}
            xScale={xScale}
            yScale={yScale}
          />

          {/* Data points (primary + secondary) */}
          <DataPoints
            data={data}
            xScale={xScale}
            yScale={yScale}
            stats={stats}
            stagedStats={stagedStats}
            specs={specs}
            isStaged={isStaged}
            stageBoundaries={stageBoundaries}
            nelsonRule2Violations={nelsonRule2Violations}
            nelsonRule3Violations={nelsonRule3Violations}
            nelsonRule3Sequences={nelsonRule3Sequences}
            chrome={chrome}
            t={t}
            onPointClick={onPointClick}
            enableBrushSelection={enableBrushSelection}
            highlightedPointIndex={highlightedPointIndex}
            onSelectionChange={onSelectionChange}
            isPointSelected={isPointSelected}
            getPointOpacity={getPointOpacity}
            getPointSize={getPointSize}
            getPointStrokeWidth={getPointStrokeWidth}
            handleBrushPointClick={handleBrushPointClick}
            showTooltipAtCoords={showTooltipAtCoords}
            hideTooltip={hideTooltip}
            secondaryData={secondaryData}
          />

          {/* Axes */}
          <AxisLeft
            scale={yScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={yTickCount}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
              fontWeight: 400,
            })}
          />

          {/* Y-Axis label */}
          <text
            x={parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50}
            y={height / 2}
            transform={`rotate(-90 ${parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50} ${height / 2})`}
            textAnchor="middle"
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {yAxisLabel}
          </text>

          {/* Clickable Y-axis area for editing scale */}
          {onYAxisClick && (
            <rect
              x={-margin.left + 10}
              y={0}
              width={margin.left - 20}
              height={height}
              fill="transparent"
              className={`${interactionStyles.clickable} hover:fill-blue-500/10`}
              onClick={onYAxisClick}
              {...getInteractiveA11yProps(t('chart.edit.yAxis'), onYAxisClick)}
            >
              <title>{t('chart.edit.yAxis')}</title>
            </rect>
          )}

          <AxisBottom
            top={height}
            scale={xScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={xTickCount}
            tickFormat={v => (Number.isInteger(v as number) ? String(Math.round(v as number)) : '')}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
              fontWeight: 400,
            })}
          />

          {/* X-Axis label */}
          <text
            x={width / 2}
            y={height + (parentWidth < 400 ? 30 : 40)}
            textAnchor="middle"
            fill={chrome.labelPrimary}
            fontSize={fonts.axisLabel}
            fontWeight={500}
          >
            {t('chart.observation')}
          </text>

          {/* Chart Legend */}
          {showLegend && (
            <ChartLegend
              mode={legendMode}
              width={width}
              top={height + (parentWidth < 400 ? 35 : 45)}
              show={showLegend}
            />
          )}

          {/* Dual-series legend (capability mode) */}
          {hasSecondary && primaryLabel && secondaryLabel && (
            <g transform={`translate(${width - 180}, -12)`}>
              <Circle cx={0} cy={0} r={4} fill={chartColors.mean} />
              <text x={8} y={4} fill={chrome.labelPrimary} fontSize={fonts.tickLabel}>
                {primaryLabel}
              </text>
              <Circle cx={60} cy={0} r={4} fill={chartColors.cpPotential} opacity={0.7} />
              <text x={68} y={4} fill={chrome.labelSecondary} fontSize={fonts.tickLabel}>
                {secondaryLabel}
              </text>
              <line
                x1={126}
                y1={-4}
                x2={126}
                y2={4}
                stroke={chrome.labelSecondary}
                strokeWidth={1.5}
                opacity={0.5}
              />
              <text x={136} y={4} fill={chrome.labelSecondary} fontSize={fonts.tickLabel}>
                Gap
              </text>
            </g>
          )}

          {/* Source Bar (branding) */}
          {showBranding && (
            <ChartSourceBar
              width={parentWidth}
              top={parentHeight - sourceBarHeight}
              n={sampleSize ?? data.length}
              brandingText={brandingText}
              fontSize={fonts.brandingText}
            />
          )}
        </Group>

        {/* Brush selection rectangle — rendered at SVG root level (not inside Group)
            so coordinates match the mouse position calculated from svg.getBoundingClientRect() */}
        {enableBrushSelection && isBrushing && brushExtent && (
          <rect
            x={Math.min(brushExtent.x0, brushExtent.x1)}
            y={Math.min(brushExtent.y0, brushExtent.y1)}
            width={Math.abs(brushExtent.x1 - brushExtent.x0)}
            height={Math.abs(brushExtent.y1 - brushExtent.y0)}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth={1.5}
            pointerEvents="none"
          />
        )}
      </svg>

      {/* Tooltip */}
      <IChartTooltip
        tooltipOpen={tooltipOpen}
        tooltipData={tooltipData}
        tooltipLeft={tooltipLeft}
        tooltipTop={tooltipTop}
        marginLeft={margin.left}
        marginTop={margin.top}
        chrome={chrome}
        fonts={fonts}
        formatStat={formatStat}
        t={t}
        tf={tf}
        stats={stats}
        stagedStats={stagedStats}
        specs={specs}
        isStaged={isStaged}
        nelsonRule2Violations={nelsonRule2Violations}
        nelsonRule2Sequences={nelsonRule2Sequences}
        nelsonRule3Violations={nelsonRule3Violations}
        nelsonRule3Sequences={nelsonRule3Sequences}
      />
    </>
  );
};

// Export with responsive wrapper
const IChart = withParentSize(IChartBase);
export default IChart;

// Also export the base component for custom sizing
export { IChartBase };
