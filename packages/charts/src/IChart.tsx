import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { LinePath, Circle, Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { getStageBoundaries, type StatsResult } from '@variscout/core';
import type { IChartProps, StageBoundary } from './types';
import { getResponsiveTickCount } from './responsive';
import ChartSourceBar from './ChartSourceBar';
import ChartLegend from './ChartLegend';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { useChartLayout, useChartTooltip } from './hooks';
import { useMultiSelection } from './hooks/useMultiSelection';
import { interactionStyles } from './styles/interactionStyles';
import { getDataPointA11yProps, getInteractiveA11yProps } from './utils/accessibility';
import { computeIChartYDomain } from './ichart/computeYDomain';
import { useNelsonViolations } from './ichart/useNelsonViolations';
import NelsonSequenceOverlay from './ichart/NelsonSequenceOverlay';

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
}) => {
  const { chrome, mode } = useChartTheme();
  const isExecutive = mode === 'executive';
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

  // Determine Y domain
  const yDomain = useMemo(
    () =>
      computeIChartYDomain(
        data,
        stats,
        specs,
        isStaged,
        stageBoundaries,
        axisSettings,
        yDomainOverride
      ),
    [data, stats, isStaged, stageBoundaries, specs, axisSettings, yDomainOverride]
  );

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
  });

  // Get stage stats for a specific data point
  const getStageStatsForPoint = (stage?: string): StatsResult | null => {
    if (!isStaged || !stage) return stats;
    return stagedStats?.stages.get(stage) ?? null;
  };

  // Compute Nelson Rule 2 violations (9+ consecutive points on same side of mean)
  const { nelsonRule2Violations, nelsonRule2Sequences } = useNelsonViolations({
    data,
    stats,
    isStaged,
    stagedStats,
    stageBoundaries,
  });

  // Get violation reason for tooltip display
  const getViolationReason = (value: number, index: number, stage?: string): string | null => {
    // Priority 1: Check spec limit violations
    if (specs.usl !== undefined && value > specs.usl) return 'Above USL';
    if (specs.lsl !== undefined && value < specs.lsl) return 'Below LSL';

    // Priority 2: Check control limit violations
    const stageStats = getStageStatsForPoint(stage);
    if (stageStats) {
      if (value > stageStats.ucl) return 'Special Cause: Above UCL';
      if (value < stageStats.lcl) return 'Special Cause: Below LCL';
    }

    // Priority 3: Check Nelson Rule 2 violations
    if (nelsonRule2Violations.has(index)) {
      // Find which sequence this point belongs to
      const sequence = nelsonRule2Sequences.find(
        seq => index >= seq.startIndex && index <= seq.endIndex
      );
      if (sequence) {
        const count = sequence.endIndex - sequence.startIndex + 1;
        return `Special Cause: Nelson Rule 2 (Points #${sequence.startIndex + 1}-${sequence.endIndex + 1}, ${count} consecutive ${sequence.side} mean)`;
      }
      return 'Special Cause: Nelson Rule 2 (9 consecutive points on same side of mean)';
    }

    return null; // In-control
  };

  // Determine point color using Two Voices model:
  // Orange = spec violation (Voice of Customer - defect)
  // Red = control violation only (Voice of Process - instability)
  // Blue = in-control (healthy process)
  const getPointColor = (value: number, index: number, stage?: string): string => {
    // Priority 1: Check spec limit violations -> Orange (customer defect takes priority)
    if (specs.usl !== undefined && value > specs.usl) return chartColors.spec;
    if (specs.lsl !== undefined && value < specs.lsl) return chartColors.spec;

    // Priority 2: Check control limit violations (use stage-specific limits if staged) -> Red
    const stageStats = getStageStatsForPoint(stage);
    if (stageStats) {
      if (value > stageStats.ucl) return chartColors.fail;
      if (value < stageStats.lcl) return chartColors.fail;
    }

    // Priority 3: Check Nelson Rule 2 violations -> Red (process pattern)
    if (nelsonRule2Violations.has(index)) return chartColors.fail;

    // Priority 4: In-control default -> Blue (healthy process)
    return chartColors.mean;
  };

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
            strokeDasharray={isExecutive ? '2,4' : undefined}
            strokeOpacity={isStaged ? 0.15 : isExecutive ? 0.5 : 0.4}
          />

          {/* Control limits - Staged mode */}
          {isStaged &&
            stageBoundaries.map((boundary, idx) => {
              const x1 = xScale(boundary.startX);
              const x2 = xScale(boundary.endX);
              const stageWidth = x2 - x1;

              return (
                <Group key={boundary.name}>
                  {/* Stage divider (vertical line at stage boundary) */}
                  {idx > 0 && (
                    <Line
                      from={{ x: x1 - 5, y: 0 }}
                      to={{ x: x1 - 5, y: height }}
                      stroke={chrome.stageDivider}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                  )}

                  {/* Stage label at top */}
                  <text
                    x={x1 + stageWidth / 2}
                    y={-8}
                    textAnchor="middle"
                    fill={chrome.labelSecondary}
                    fontSize={fonts.tickLabel}
                    fontWeight={500}
                  >
                    {boundary.name}
                  </text>

                  {/* UCL for this stage */}
                  <Line
                    from={{ x: x1, y: yScale(boundary.stats.ucl) }}
                    to={{ x: x2, y: yScale(boundary.stats.ucl) }}
                    stroke={chartColors.control}
                    strokeWidth={0.8}
                    strokeDasharray="6,4"
                    strokeOpacity={0.6}
                  />

                  {/* Mean for this stage */}
                  <Line
                    from={{ x: x1, y: yScale(boundary.stats.mean) }}
                    to={{ x: x2, y: yScale(boundary.stats.mean) }}
                    stroke={chartColors.mean}
                    strokeWidth={2}
                  />

                  {/* LCL for this stage */}
                  <Line
                    from={{ x: x1, y: yScale(boundary.stats.lcl) }}
                    to={{ x: x2, y: yScale(boundary.stats.lcl) }}
                    stroke={chartColors.control}
                    strokeWidth={0.8}
                    strokeDasharray="6,4"
                    strokeOpacity={0.6}
                  />
                </Group>
              );
            })}

          {/* Control limits - Non-staged mode */}
          {!isStaged && stats && (
            <>
              {/* UCL */}
              <Line
                from={{ x: 0, y: yScale(stats.ucl) }}
                to={{ x: width, y: yScale(stats.ucl) }}
                stroke={chartColors.control}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              {/* UCL label */}
              {showLimitLabels && (
                <text
                  x={width + 4}
                  y={yScale(stats.ucl)}
                  fill={chartColors.control}
                  fontSize={fonts.statLabel}
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  UCL: {stats.ucl.toFixed(1)}
                </text>
              )}
              {/* Mean */}
              <Line
                from={{ x: 0, y: yScale(stats.mean) }}
                to={{ x: width, y: yScale(stats.mean) }}
                stroke={chartColors.mean}
                strokeWidth={1.5}
              />
              {/* Mean label */}
              {showLimitLabels && (
                <text
                  x={width + 4}
                  y={yScale(stats.mean)}
                  fill={chartColors.mean}
                  fontSize={fonts.statLabel}
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  Mean: {stats.mean.toFixed(1)}
                </text>
              )}
              {/* LCL */}
              <Line
                from={{ x: 0, y: yScale(stats.lcl) }}
                to={{ x: width, y: yScale(stats.lcl) }}
                stroke={chartColors.control}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              {/* LCL label */}
              {showLimitLabels && (
                <text
                  x={width + 4}
                  y={yScale(stats.lcl)}
                  fill={chartColors.control}
                  fontSize={fonts.statLabel}
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  LCL: {stats.lcl.toFixed(1)}
                </text>
              )}
            </>
          )}

          {/* Spec limits */}
          {specs.usl !== undefined && (
            <>
              <Line
                from={{ x: 0, y: yScale(specs.usl) }}
                to={{ x: width, y: yScale(specs.usl) }}
                stroke={chartColors.spec}
                strokeWidth={1.5}
                strokeDasharray="8,3,2,3"
                strokeOpacity={0.7}
              />
              {/* USL label - clickable for editing */}
              {showLimitLabels && (
                <text
                  x={width + 4}
                  y={yScale(specs.usl)}
                  fill={chartColors.spec}
                  fontSize={fonts.statLabel}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className={onSpecClick ? interactionStyles.clickableSubtle : ''}
                  onClick={() => onSpecClick?.('usl')}
                  {...getInteractiveA11yProps(
                    'Edit USL',
                    onSpecClick ? () => onSpecClick('usl') : undefined
                  )}
                >
                  {onSpecClick && <title>Click to edit USL</title>}
                  USL: {specs.usl.toFixed(1)}
                </text>
              )}
            </>
          )}
          {specs.lsl !== undefined && (
            <>
              <Line
                from={{ x: 0, y: yScale(specs.lsl) }}
                to={{ x: width, y: yScale(specs.lsl) }}
                stroke={chartColors.spec}
                strokeWidth={1.5}
                strokeDasharray="8,3,2,3"
                strokeOpacity={0.7}
              />
              {/* LSL label - clickable for editing */}
              {showLimitLabels && (
                <text
                  x={width + 4}
                  y={yScale(specs.lsl)}
                  fill={chartColors.spec}
                  fontSize={fonts.statLabel}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className={onSpecClick ? interactionStyles.clickableSubtle : ''}
                  onClick={() => onSpecClick?.('lsl')}
                  {...getInteractiveA11yProps(
                    'Edit LSL',
                    onSpecClick ? () => onSpecClick('lsl') : undefined
                  )}
                >
                  {onSpecClick && <title>Click to edit LSL</title>}
                  LSL: {specs.lsl.toFixed(1)}
                </text>
              )}
            </>
          )}
          {specs.target !== undefined && (
            <>
              <Line
                from={{ x: 0, y: yScale(specs.target) }}
                to={{ x: width, y: yScale(specs.target) }}
                stroke={chartColors.target}
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              {/* Target label - clickable for editing */}
              {showLimitLabels && (
                <text
                  x={width + 4}
                  y={yScale(specs.target)}
                  fill={chartColors.target}
                  fontSize={fonts.statLabel}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className={onSpecClick ? interactionStyles.clickableSubtle : ''}
                  onClick={() => onSpecClick?.('target')}
                  {...getInteractiveA11yProps(
                    'Edit Target',
                    onSpecClick ? () => onSpecClick('target') : undefined
                  )}
                >
                  {onSpecClick && <title>Click to edit Target</title>}
                  Tgt: {specs.target.toFixed(1)}
                </text>
              )}
            </>
          )}

          {/* Nelson Rule 2 sequence highlighting */}
          <NelsonSequenceOverlay
            data={data}
            sequences={nelsonRule2Sequences}
            xScale={xScale}
            yScale={yScale}
          />

          {/* Data line */}
          <LinePath
            data={data}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={chrome.dataLine}
            strokeWidth={isExecutive ? 1.5 : 1}
            strokeOpacity={isExecutive ? 0.3 : 0.5}
          />

          {/* Brush selection rectangle */}
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

          {/* Data points */}
          {data.map((d, i) => {
            const isHighlighted = highlightedPointIndex === i;
            const isSelected = enableBrushSelection && isPointSelected(i);
            const pointOpacity = enableBrushSelection ? getPointOpacity(i) : 1;
            const pointSize =
              enableBrushSelection && isSelected
                ? getPointSize(i)
                : isHighlighted
                  ? 6
                  : isExecutive
                    ? 3
                    : 4;
            const strokeWidth =
              enableBrushSelection && isSelected
                ? getPointStrokeWidth(i)
                : isHighlighted
                  ? 2
                  : isExecutive
                    ? 1.5
                    : 1;

            return (
              <g key={i} opacity={pointOpacity}>
                {/* Highlight ring for selected point */}
                {isHighlighted && (
                  <Circle
                    cx={xScale(d.x)}
                    cy={yScale(d.y)}
                    r={12}
                    fill="transparent"
                    stroke={chartColors.mean}
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}
                <Circle
                  cx={xScale(d.x)}
                  cy={yScale(d.y)}
                  r={pointSize}
                  fill={getPointColor(d.y, i, d.stage)}
                  stroke={
                    isSelected ? '#ffffff' : isHighlighted ? chartColors.mean : chrome.pointStroke
                  }
                  strokeWidth={strokeWidth}
                  className={
                    onPointClick || enableBrushSelection ? interactionStyles.clickable : ''
                  }
                  onClick={e => {
                    if (enableBrushSelection && onSelectionChange) {
                      handleBrushPointClick(i, e);
                    } else {
                      onPointClick?.(i, d.originalIndex);
                    }
                  }}
                  onMouseOver={() =>
                    showTooltipAtCoords(xScale(d.x), yScale(d.y), {
                      x: d.x,
                      y: d.y,
                      index: i,
                      stage: d.stage,
                    })
                  }
                  onMouseLeave={hideTooltip}
                  {...getDataPointA11yProps(
                    'Observation',
                    d.y,
                    i,
                    onPointClick ? () => onPointClick(i, d.originalIndex) : undefined
                  )}
                />
              </g>
            );
          })}

          {/* Axes */}
          <AxisLeft
            scale={yScale}
            stroke={isExecutive ? 'transparent' : chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={yTickCount}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: isExecutive ? 'Inter, sans-serif' : 'monospace',
              fontWeight: isExecutive ? 500 : 400,
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
              {...getInteractiveA11yProps('Edit Y-axis scale', onYAxisClick)}
            >
              <title>Click to edit Y-axis scale</title>
            </rect>
          )}

          <AxisBottom
            top={height}
            scale={xScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={xTickCount}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
              fontFamily: isExecutive ? 'Inter, sans-serif' : undefined,
              fontWeight: isExecutive ? 500 : 400,
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
            Observation
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
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={margin.left + (tooltipLeft ?? 0)}
          top={margin.top + (tooltipTop ?? 0)}
          style={{
            ...defaultStyles,
            backgroundColor: chrome.tooltipBg,
            color: chrome.tooltipText,
            border: `1px solid ${chrome.tooltipBorder}`,
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: fonts.tooltipText,
          }}
        >
          <div>
            <strong>#{tooltipData.index + 1}</strong>
            {tooltipData.stage && (
              <span style={{ color: chrome.labelSecondary, marginLeft: 8 }}>
                {tooltipData.stage}
              </span>
            )}
            {tooltipData.timeValue && (
              <div
                style={{
                  color: chrome.labelSecondary,
                  fontSize: fonts.tooltipText - 1,
                  marginTop: 2,
                }}
              >
                {tooltipData.timeValue}
              </div>
            )}
          </div>
          <div>Value: {tooltipData.y.toFixed(2)}</div>
          {(() => {
            const reason = getViolationReason(tooltipData.y, tooltipData.index, tooltipData.stage);
            if (reason) {
              // Check if it's a spec violation (orange) or control violation (red)
              const isSpecViolation =
                (specs.usl !== undefined && tooltipData.y > specs.usl) ||
                (specs.lsl !== undefined && tooltipData.y < specs.lsl);
              const color = isSpecViolation ? chartColors.spec : chartColors.fail;
              return (
                <div style={{ marginTop: 4, color, fontWeight: 500 }}>
                  {reason.startsWith('Special Cause') ? '⚠️ ' : ''}
                  {reason}
                </div>
              );
            }
            return null;
          })()}
        </TooltipWithBounds>
      )}
    </>
  );
};

// Export with responsive wrapper
const IChart = withParentSize(IChartBase);
export default IChart;

// Also export the base component for custom sizing
export { IChartBase };
