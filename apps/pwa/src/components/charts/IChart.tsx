import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { LinePath, Circle, Line } from '@visx/shape';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
  useResponsiveTickCount,
} from '../../hooks/useResponsiveChartMargins';
import { Edit2 } from 'lucide-react';
import AxisEditor from '../AxisEditor';
import YAxisPopover from '../YAxisPopover';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';
import {
  getStageBoundaries,
  getNelsonRule2ViolationPoints,
  formatTimeValue,
  type StageBoundary,
} from '@variscout/core';
import { chartColors, useChartTheme } from '@variscout/charts';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
  onSpecClick?: (spec: 'usl' | 'lsl' | 'target') => void;
}

const IChart = ({ parentWidth, parentHeight, onPointClick, onSpecClick }: IChartProps) => {
  const { chrome } = useChartTheme();
  const sourceBarHeight = getSourceBarHeight();
  const margin = useResponsiveChartMargins(parentWidth, 'ichart', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);
  const {
    filteredData,
    outcome,
    timeColumn,
    stats,
    specs,
    grades,
    axisSettings,
    setAxisSettings,
    columnAliases,
    setColumnAliases,
    displayOptions,
    stageColumn,
    stagedStats,
    stagedData,
  } = useData();
  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Use staged data when stage column is active
  const sourceData = stageColumn ? stagedData : filteredData;
  const isStaged = !!stageColumn && !!stagedStats;

  const data = useMemo(() => {
    if (!outcome) return [];
    return sourceData
      .map((d: any, i: number) => ({
        x: timeColumn && !stageColumn ? new Date(d[timeColumn]) : i, // Use index when staged
        y: Number(d[outcome]),
        stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
        timeValue: timeColumn && !stageColumn ? formatTimeValue(d[timeColumn]) : undefined,
      }))
      .filter((d: any) => !isNaN(d.y));
  }, [sourceData, outcome, timeColumn, stageColumn]);

  // Calculate stage boundaries for rendering
  // Need to convert data to expected format (x as number) for getStageBoundaries
  const stageBoundaries = useMemo<StageBoundary[]>(() => {
    if (!isStaged || !stagedStats) return [];
    const dataForBoundaries = data.map((d, i) => ({
      x: i, // Always use index for stage boundaries
      stage: d.stage,
    }));
    return getStageBoundaries(dataForBoundaries, stagedStats);
  }, [data, isStaged, stagedStats]);

  const xScale = useMemo(() => {
    // When staged, always use linear scale (index-based)
    if (timeColumn && !isStaged) {
      return scaleTime({
        range: [0, width],
        domain: [
          Math.min(...data.map((d: any) => (d.x as Date).getTime())),
          Math.max(...data.map((d: any) => (d.x as Date).getTime())),
        ],
      });
    }
    return scaleLinear({
      range: [0, width],
      domain: [-0.5, Math.max(data.length - 1, 1) + 0.5],
    });
  }, [data, width, timeColumn, isStaged]);

  // Use existing hook for scale limits
  const { min, max } = useChartScale();

  const yScale = useMemo(() => {
    return scaleLinear({
      range: [height, 0],
      domain: [min, max],
      nice: true,
    });
  }, [height, min, max]);

  const handleSaveAlias = (newAlias: string) => {
    if (outcome) {
      setColumnAliases({
        ...columnAliases,
        [outcome]: newAlias,
      });
    }
  };

  // Compute Nelson Rule 2 violations (9+ consecutive points on same side of mean)
  const nelsonRule2Violations = useMemo(() => {
    if (!outcome || data.length === 0) return new Set<number>();
    if (grades && grades.length > 0) {
      // Skip Nelson Rule 2 for graded data
      return new Set<number>();
    }

    if (isStaged && stagedStats) {
      // For staged mode, compute violations per stage
      const allViolations = new Set<number>();

      stageBoundaries.forEach(boundary => {
        const stageData = data.filter((d: any) => d.stage === boundary.name);
        const stageValues = stageData.map((d: any) => d.y);
        const stageViolations = getNelsonRule2ViolationPoints(stageValues, boundary.stats.mean);

        // Map stage-local indices to global indices
        let stageLocalIdx = 0;
        data.forEach((d: any, globalIdx: number) => {
          if (d.stage === boundary.name) {
            if (stageViolations.has(stageLocalIdx)) {
              allViolations.add(globalIdx);
            }
            stageLocalIdx++;
          }
        });
      });
      return allViolations;
    }

    if (stats) {
      const values = data.map((d: any) => d.y);
      return getNelsonRule2ViolationPoints(values, stats.mean);
    }

    return new Set<number>();
  }, [data, outcome, stats, isStaged, stagedStats, stageBoundaries, grades]);

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted italic">
        No data available for I-Chart
      </div>
    );
  }

  // Helper to get color for a value using Minitab-style 2-color scheme
  // Blue = in-control, Red = any violation
  const getPointColor = (val: number, index: number) => {
    // Graded data uses grade colors
    if (grades && grades.length > 0) {
      const grade = grades.find(g => val <= g.max);
      if (!grade) return grades[grades.length - 1].color;
      return grade.color;
    }

    // Spec limit violations -> Red
    if (specs.usl !== undefined && val > specs.usl) return chartColors.fail;
    if (specs.lsl !== undefined && val < specs.lsl) return chartColors.fail;

    // Control limit violations -> Red (use stage-specific limits if staged)
    if (isStaged && stagedStats) {
      const point = data[index];
      const stageStats = point?.stage ? stagedStats.stages.get(point.stage) : null;
      if (stageStats) {
        if (val > stageStats.ucl) return chartColors.fail;
        if (val < stageStats.lcl) return chartColors.fail;
      }
    } else if (stats) {
      if (val > stats.ucl) return chartColors.fail;
      if (val < stats.lcl) return chartColors.fail;
    }

    // Nelson Rule 2 violations -> Red
    if (nelsonRule2Violations.has(index)) return chartColors.fail;

    // In-control -> Blue (Minitab-style)
    return chartColors.mean;
  };

  // Responsive Y-axis label positioning
  const yLabelOffset = parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50;
  const yParams = {
    label: columnAliases[outcome] || outcome,
    x: yLabelOffset,
    y: height / 2,
    rotation: -90,
  };

  // Resolve Label Collisions
  const resolvedLabels = useMemo(() => {
    const labels: {
      y: number;
      text: string;
      fill: string;
      tooltip?: string;
      onClick?: () => void;
    }[] = [];
    const showSpecs = displayOptions.showSpecs !== false && (!grades || grades.length === 0);

    // Collect Spec Labels
    if (showSpecs) {
      if (specs.usl !== undefined) {
        labels.push({
          y: yScale(specs.usl),
          text: `USL: ${specs.usl.toFixed(1)}`,
          fill: chartColors.spec,
          tooltip: 'Upper Specification Limit – Maximum acceptable value per requirements.',
          onClick: () => onSpecClick?.('usl'),
        });
      }
      if (specs.lsl !== undefined) {
        labels.push({
          y: yScale(specs.lsl),
          text: `LSL: ${specs.lsl.toFixed(1)}`,
          fill: chartColors.spec,
          tooltip: 'Lower Specification Limit – Minimum acceptable value per requirements.',
          onClick: () => onSpecClick?.('lsl'),
        });
      }
      if (specs.target !== undefined) {
        labels.push({
          y: yScale(specs.target),
          text: `Tgt: ${specs.target.toFixed(1)}`,
          fill: chartColors.target,
          tooltip: 'Target – Ideal value for this process.',
          onClick: () => onSpecClick?.('target'),
        });
      }
    }

    // Collect Stat Labels (only if not staged and control limits are enabled)
    if (displayOptions.showControlLimits !== false && !isStaged && stats) {
      labels.push({
        y: yScale(stats.mean),
        text: `Mean: ${stats.mean.toFixed(1)}`,
        fill: chartColors.mean,
        tooltip: 'Process average. The center line on the I-Chart.',
      });
      labels.push({
        y: yScale(stats.ucl),
        text: `UCL: ${stats.ucl.toFixed(1)}`,
        fill: chrome.axisSecondary,
        tooltip:
          'Upper Control Limit – 3σ above the mean. Points above indicate special cause variation.',
      });
      labels.push({
        y: yScale(stats.lcl),
        text: `LCL: ${stats.lcl.toFixed(1)}`,
        fill: chrome.axisSecondary,
        tooltip:
          'Lower Control Limit – 3σ below the mean. Points below indicate special cause variation.',
      });
    }

    // Sort by Y (top to bottom)
    labels.sort((a, b) => a.y - b.y);

    // Apply strict collision resolution
    // Text height approximation: fonts.statLabel (approx 10-12px) + padding
    const minSpacing = (fonts.statLabel || 10) + 2;

    for (let i = 1; i < labels.length; i++) {
      const prev = labels[i - 1];
      const curr = labels[i];
      if (curr.y < prev.y + minSpacing) {
        curr.y = prev.y + minSpacing;
      }
    }

    return labels;
  }, [
    specs,
    stats,
    isStaged,
    displayOptions.showSpecs,
    displayOptions.showControlLimits,
    grades,
    yScale,
    fonts.statLabel,
    onSpecClick,
    chrome.axisSecondary,
  ]);

  return (
    <div className="relative w-full h-full group">
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          {/* Grade Bands (Background) */}
          {grades &&
            grades.length > 0 &&
            grades.map((grade, i) => {
              const prevMax = i === 0 ? 0 : grades[i - 1].max;
              if (grade.max > yScale.domain()[1] && prevMax > yScale.domain()[1]) return null;

              const yTop = yScale(Math.min(grade.max, yScale.domain()[1]));
              const yBottom = yScale(Math.max(prevMax, yScale.domain()[0]));
              const bandHeight = Math.abs(yBottom - yTop);

              if (bandHeight <= 0) return null;

              return (
                <rect
                  key={i}
                  x={0}
                  y={yTop}
                  width={width}
                  height={bandHeight}
                  fill={grade.color}
                  opacity={0.1}
                />
              );
            })}

          <GridRows scale={yScale} width={width} stroke={chrome.gridLine} />
          <GridColumns scale={xScale} height={height} stroke={chrome.gridLine} />

          {/* Spec Lines with Clickable Annotations */}
          {displayOptions.showSpecs !== false &&
            (!grades || grades.length === 0) &&
            specs.usl !== undefined && (
              <g
                onClick={() => onSpecClick?.('usl')}
                style={{ cursor: onSpecClick ? 'pointer' : 'default' }}
                className="hover:opacity-80"
              >
                <line
                  x1={0}
                  x2={width}
                  y1={yScale(specs.usl)}
                  y2={yScale(specs.usl)}
                  stroke={chartColors.spec}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />
              </g>
            )}
          {displayOptions.showSpecs !== false &&
            (!grades || grades.length === 0) &&
            specs.lsl !== undefined && (
              <g
                onClick={() => onSpecClick?.('lsl')}
                style={{ cursor: onSpecClick ? 'pointer' : 'default' }}
                className="hover:opacity-80"
              >
                <line
                  x1={0}
                  x2={width}
                  y1={yScale(specs.lsl)}
                  y2={yScale(specs.lsl)}
                  stroke={chartColors.spec}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />
              </g>
            )}
          {displayOptions.showSpecs !== false &&
            (!grades || grades.length === 0) &&
            specs.target !== undefined && (
              <g
                onClick={() => onSpecClick?.('target')}
                style={{ cursor: onSpecClick ? 'pointer' : 'default' }}
                className="hover:opacity-80"
              >
                <line
                  x1={0}
                  x2={width}
                  y1={yScale(specs.target)}
                  y2={yScale(specs.target)}
                  stroke={chartColors.target}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              </g>
            )}

          {/* Control Limits - Staged Mode */}
          {displayOptions.showControlLimits !== false &&
            isStaged &&
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
                  <line
                    x1={x1}
                    x2={x2}
                    y1={yScale(boundary.stats.ucl)}
                    y2={yScale(boundary.stats.ucl)}
                    stroke={chrome.axisSecondary}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />

                  {/* Mean for this stage */}
                  <line
                    x1={x1}
                    x2={x2}
                    y1={yScale(boundary.stats.mean)}
                    y2={yScale(boundary.stats.mean)}
                    stroke={chrome.axisSecondary}
                    strokeWidth={1}
                  />

                  {/* LCL for this stage */}
                  <line
                    x1={x1}
                    x2={x2}
                    y1={yScale(boundary.stats.lcl)}
                    y2={yScale(boundary.stats.lcl)}
                    stroke={chrome.axisSecondary}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                </Group>
              );
            })}

          {/* Control Limits - Non-staged Mode */}
          {displayOptions.showControlLimits !== false && !isStaged && stats && (
            <>
              {/* UCL */}
              <line
                x1={0}
                x2={width}
                y1={yScale(stats.ucl)}
                y2={yScale(stats.ucl)}
                stroke={chrome.axisSecondary}
                strokeWidth={1}
                strokeDasharray="4,4"
              />

              {/* LCL */}
              <line
                x1={0}
                x2={width}
                y1={yScale(stats.lcl)}
                y2={yScale(stats.lcl)}
                stroke={chrome.axisSecondary}
                strokeWidth={1}
                strokeDasharray="4,4"
              />

              {/* Mean */}
              <line
                x1={0}
                x2={width}
                y1={yScale(stats.mean)}
                y2={yScale(stats.mean)}
                stroke={chartColors.mean}
                strokeWidth={1}
              />
            </>
          )}

          <LinePath
            data={data}
            x={d => xScale(d.x as any)}
            y={d => yScale(d.y)}
            stroke={chrome.dataLine}
            strokeWidth={2}
          />

          {data.map((d: any, i: number) => (
            <Circle
              key={i}
              cx={xScale(d.x as any)}
              cy={yScale(d.y)}
              r={4}
              fill={getPointColor(d.y, i)}
              stroke={chrome.pointStroke}
              strokeWidth={1}
              className={onPointClick ? 'cursor-pointer' : ''}
              onClick={() => onPointClick?.(i)}
            >
              <title>
                #{i + 1}
                {d.timeValue && `\n${d.timeValue}`}
                {`\nValue: ${d.y.toFixed(2)}`}
              </title>
            </Circle>
          ))}

          <AxisLeft
            scale={yScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            // Custom Label Handling
            label={''}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 4,
              fontFamily: 'monospace',
            })}
          />

          {/* Custom Clickable Axis Label Group */}
          <Group onClick={() => setIsEditingLabel(true)} className="cursor-pointer group/label">
            <text
              x={yParams.x}
              y={yParams.y}
              transform={`rotate(${yParams.rotation} ${yParams.x} ${yParams.y})`}
              textAnchor="middle"
              fill={chrome.labelPrimary}
              fontSize={13} // Increased
              fontWeight={500}
              className="group-hover/label:fill-blue-400 transition-colors"
            >
              {yParams.label}
            </text>
            {/* Edit Icon (rotated to match text) */}
            <foreignObject
              x={yParams.x - 8}
              y={yParams.y + 10} // Adjusted for rotation
              width={16}
              height={16}
              transform={`rotate(${yParams.rotation} ${yParams.x} ${yParams.y})`}
              className="opacity-0 group-hover/label:opacity-100 transition-opacity"
            >
              <div className="flex items-center justify-center text-blue-400">
                <Edit2 size={14} />
              </div>
            </foreignObject>
          </Group>

          {/* Interactive Scale Overlay (ticks area) */}
          <rect
            x={-margin.left + 20}
            y={0}
            width={30}
            height={height}
            fill="transparent"
            className="cursor-pointer hover:fill-blue-500/10 transition-colors"
            onClick={() => setIsEditingScale(true)}
          >
            <title>Click to edit scale</title>
          </rect>

          <AxisBottom
            top={height}
            scale={xScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            numTicks={width > 500 ? 10 : width > 300 ? 5 : 3}
            label={timeColumn ? 'Time' : 'Sequence'}
            labelProps={{
              fill: chrome.labelPrimary,
              fontSize: fonts.axisLabel,
              textAnchor: 'middle',
            }}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* Signature (painter-style branding) */}
          <ChartSignature x={width - 10} y={height + margin.bottom - sourceBarHeight - 18} />

          {/* Source Bar (branding) */}
          <ChartSourceBar
            width={width}
            top={height + margin.bottom - sourceBarHeight}
            n={data.length}
          />

          {/* Render Resolved Labels */}
          {resolvedLabels.map((label, i) => (
            <text
              key={i}
              x={width + 4}
              y={label.y}
              fill={label.fill}
              fontSize={fonts.statLabel}
              textAnchor="start"
              dominantBaseline="middle"
              onClick={label.onClick}
              style={{ cursor: label.onClick ? 'pointer' : 'default' }}
              className={label.onClick ? 'hover:opacity-80' : ''}
            >
              {label.tooltip && <title>{label.tooltip}</title>}
              {label.text}
            </text>
          ))}
        </Group>
      </svg>

      {/* Y-Axis Scale Editor Popover */}
      <YAxisPopover
        isOpen={isEditingScale}
        onClose={() => setIsEditingScale(false)}
        currentMin={axisSettings.min}
        currentMax={axisSettings.max}
        autoMin={min}
        autoMax={max}
        onSave={setAxisSettings}
        anchorPosition={{ top: margin.top, left: 10 }}
      />

      {/* In-Place Label Editor Popover */}
      {isEditingLabel && (
        <AxisEditor
          title="Edit Axis Label"
          originalName={outcome}
          alias={columnAliases[outcome] || ''}
          onSave={handleSaveAlias}
          onClose={() => setIsEditingLabel(false)}
          style={{ top: margin.top + height / 2 - 50, left: 10 }}
        />
      )}
    </div>
  );
};

export default withParentSize(IChart);
