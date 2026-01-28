import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { LinePath, Circle, Line } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import {
  getStageBoundaries,
  getNelsonRule2ViolationPoints,
  type StatsResult,
} from '@variscout/core';
import type { IChartProps, StageBoundary } from './types';
import { getResponsiveTickCount } from './responsive';
import ChartSourceBar from './ChartSourceBar';
import { chartColors } from './colors';
import { useChartTheme } from './useChartTheme';
import { useChartLayout, useChartTooltip } from './hooks';
import { interactionStyles } from './styles/interactionStyles';
import { getDataPointA11yProps, getInteractiveA11yProps } from './utils/accessibility';

/**
 * I-Chart (Individual Control Chart) - Props-based version
 * Shows time series data with control limits and optional spec limits
 */
const IChartBase: React.FC<IChartProps> = ({
  data,
  stats,
  stagedStats,
  specs,
  grades,
  yAxisLabel = 'Value',
  axisSettings,
  yDomainOverride,
  parentWidth,
  parentHeight,
  showBranding = true,
  brandingText,
  onPointClick,
  sampleSize,
  showLimitLabels = true,
  onSpecClick,
  onYAxisClick,
  highlightedPointIndex,
}) => {
  const { chrome } = useChartTheme();
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltipAtCoords, hideTooltip } =
    useChartTooltip<{ x: number; y: number; index: number; stage?: string }>();

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
  const yDomain = useMemo(() => {
    // Priority 1: yDomainOverride (for Y-axis lock feature)
    if (yDomainOverride) {
      return [yDomainOverride.min, yDomainOverride.max] as [number, number];
    }

    // Priority 2: Manual axis settings
    if (axisSettings?.min !== undefined && axisSettings?.max !== undefined) {
      return [axisSettings.min, axisSettings.max] as [number, number];
    }

    // Priority 3: Auto-calculate from data
    const values = data.map(d => d.y);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);

    // Include control limits (single stats or all staged stats)
    if (isStaged) {
      // Include all stage control limits
      stageBoundaries.forEach(boundary => {
        minVal = Math.min(minVal, boundary.stats.lcl);
        maxVal = Math.max(maxVal, boundary.stats.ucl);
      });
    } else if (stats) {
      minVal = Math.min(minVal, stats.lcl);
      maxVal = Math.max(maxVal, stats.ucl);
    }

    // Include spec limits
    if (specs.usl !== undefined) maxVal = Math.max(maxVal, specs.usl);
    if (specs.lsl !== undefined) minVal = Math.min(minVal, specs.lsl);

    // Include grade thresholds
    if (grades && grades.length > 0) {
      const gradeMax = Math.max(...grades.map(g => g.max));
      maxVal = Math.max(maxVal, gradeMax);
    }

    // Add padding
    const padding = (maxVal - minVal) * 0.1;
    return [minVal - padding, maxVal + padding] as [number, number];
  }, [data, stats, isStaged, stageBoundaries, specs, grades, axisSettings, yDomainOverride]);

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

  // Get stage stats for a specific data point
  const getStageStatsForPoint = (stage?: string): StatsResult | null => {
    if (!isStaged || !stage) return stats;
    return stagedStats?.stages.get(stage) ?? null;
  };

  // Compute Nelson Rule 2 violations (9+ consecutive points on same side of mean)
  const nelsonRule2Violations = useMemo(() => {
    if (grades && grades.length > 0) {
      // Skip Nelson Rule 2 for graded data
      return new Set<number>();
    }

    if (isStaged && stagedStats) {
      // For staged mode, compute violations per stage
      const allViolations = new Set<number>();
      let dataIndex = 0;

      stageBoundaries.forEach(boundary => {
        const stageData = data.filter(d => d.stage === boundary.name);
        const stageValues = stageData.map(d => d.y);
        const stageViolations = getNelsonRule2ViolationPoints(stageValues, boundary.stats.mean);

        // Map stage-local indices to global indices
        stageViolations.forEach(localIdx => {
          // Find the global index for this point
          const globalIdx = data.findIndex(
            (d, i) =>
              i >= dataIndex && d.stage === boundary.name && stageData.indexOf(d) === localIdx
          );
          if (globalIdx !== -1) {
            allViolations.add(globalIdx);
          }
        });
        dataIndex += stageData.length;
      });
      return allViolations;
    }

    if (stats) {
      const values = data.map(d => d.y);
      return getNelsonRule2ViolationPoints(values, stats.mean);
    }

    return new Set<number>();
  }, [data, stats, isStaged, stagedStats, stageBoundaries, grades]);

  // Determine point color using Minitab-style 2-color scheme
  // Blue = in-control, Red = any violation
  const getPointColor = (value: number, index: number, stage?: string): string => {
    // Priority 1: Check spec limit violations -> Red
    if (specs.usl !== undefined && value > specs.usl) return chartColors.fail;
    if (specs.lsl !== undefined && value < specs.lsl) return chartColors.fail;

    // Priority 2: Check control limit violations (use stage-specific limits if staged) -> Red
    const stageStats = getStageStatsForPoint(stage);
    if (stageStats) {
      if (value > stageStats.ucl) return chartColors.fail;
      if (value < stageStats.lcl) return chartColors.fail;
    }

    // Priority 3: Check Nelson Rule 2 violations -> Red
    if (nelsonRule2Violations.has(index)) return chartColors.fail;

    // Priority 4: Check grades (multi-tier) - use grade colors when in control
    if (grades && grades.length > 0) {
      const grade = grades.find(g => value <= g.max);
      return grade?.color || chartColors.fail; // Default red if above all grades but mostly covered by specs
    }

    // Priority 5: In-control default -> Blue (Minitab-style)
    return chartColors.mean;
  };

  if (data.length === 0) return null;

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke={chrome.gridLine} />

          {/* Grade bands (if defined) */}
          {grades &&
            grades.map((grade, i) => {
              const prevMax = i === 0 ? yDomain[0] : grades[i - 1].max;
              const y1 = yScale(grade.max);
              const y2 = yScale(prevMax);
              return (
                <rect
                  key={grade.label}
                  x={0}
                  y={Math.min(y1, y2)}
                  width={width}
                  height={Math.abs(y2 - y1)}
                  fill={grade.color}
                  opacity={0.1}
                />
              );
            })}

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
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />

                  {/* Mean for this stage */}
                  <Line
                    from={{ x: x1, y: yScale(boundary.stats.mean) }}
                    to={{ x: x2, y: yScale(boundary.stats.mean) }}
                    stroke={chartColors.mean}
                    strokeWidth={1.5}
                  />

                  {/* LCL for this stage */}
                  <Line
                    from={{ x: x1, y: yScale(boundary.stats.lcl) }}
                    to={{ x: x2, y: yScale(boundary.stats.lcl) }}
                    stroke={chartColors.control}
                    strokeWidth={1}
                    strokeDasharray="4,4"
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
                strokeWidth={2}
                strokeDasharray="6,3"
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
                strokeWidth={2}
                strokeDasharray="6,3"
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
                  Tgt: {specs.target.toFixed(1)}
                </text>
              )}
            </>
          )}

          {/* Data line */}
          <LinePath
            data={data}
            x={d => xScale(d.x)}
            y={d => yScale(d.y)}
            stroke={chrome.dataLine}
            strokeWidth={1}
            strokeOpacity={0.5}
          />

          {/* Data points */}
          {data.map((d, i) => {
            const isHighlighted = highlightedPointIndex === i;
            return (
              <g key={i}>
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
                  r={isHighlighted ? 6 : 4}
                  fill={getPointColor(d.y, i, d.stage)}
                  stroke={isHighlighted ? chartColors.mean : chrome.pointStroke}
                  strokeWidth={isHighlighted ? 2 : 1}
                  className={onPointClick ? interactionStyles.clickable : ''}
                  onClick={() => onPointClick?.(i, d.originalIndex)}
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

          {/* Source Bar (branding) */}
          {showBranding && (
            <ChartSourceBar
              width={width}
              top={height + margin.bottom - sourceBarHeight}
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
          </div>
          <div>Value: {tooltipData.y.toFixed(2)}</div>
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
