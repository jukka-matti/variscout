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
} from '../../hooks/useResponsiveChartMargins';
import { Edit2 } from 'lucide-react';
import AxisEditor from '../AxisEditor';
import YAxisPopover from '../YAxisPopover';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';
import { getStageBoundaries, type StageBoundary } from '@variscout/core';
import { chartColors, useChartTheme } from '@variscout/charts';

interface IChartProps {
  parentWidth: number;
  parentHeight: number;
  onPointClick?: (index: number) => void;
}

const IChart = ({ parentWidth, parentHeight, onPointClick }: IChartProps) => {
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
    stagedData,
    stagedStats,
  } = useData();
  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  // Use stagedData when staging is active, otherwise filteredData
  const sourceData = stageColumn ? stagedData : filteredData;

  const data = useMemo(() => {
    if (!outcome) return [];
    return sourceData
      .map((d: any, i: number) => ({
        // When staging, always use index (no time-based axis)
        x: stageColumn ? i : timeColumn ? new Date(d[timeColumn]) : i,
        y: Number(d[outcome]),
        stage: stageColumn ? String(d[stageColumn] ?? '') : undefined,
      }))
      .filter((d: any) => !isNaN(d.y));
  }, [sourceData, outcome, timeColumn, stageColumn]);

  const xScale = useMemo(() => {
    // When staging is active, always use linear scale (index-based)
    if (!stageColumn && timeColumn) {
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
      domain: [0, data.length - 1],
    });
  }, [data, width, timeColumn, stageColumn]);

  // Calculate stage boundaries for rendering
  const stageBoundaries = useMemo(() => {
    if (!stageColumn || !stagedStats) return [];
    // Map data to the expected type for getStageBoundaries (x must be number)
    const stageData = data.map((d, i) => ({ x: i, stage: d.stage }));
    return getStageBoundaries(stageData, stagedStats);
  }, [data, stageColumn, stagedStats]);

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

  if (!outcome || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 italic">
        No data available for I-Chart
      </div>
    );
  }

  // Helper to get color for a value
  const getPointColor = (val: number) => {
    if (grades && grades.length > 0) {
      const grade = grades.find(g => val <= g.max);
      if (!grade) return grades[grades.length - 1].color;
      return grade.color;
    }
    if (
      (specs.usl !== undefined && val > specs.usl) ||
      (specs.lsl !== undefined && val < specs.lsl)
    ) {
      return chartColors.fail;
    }
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

          {/* Spec Lines */}
          {displayOptions.showSpecs !== false &&
            (!grades || grades.length === 0) &&
            specs.usl !== undefined && (
              <line
                x1={0}
                x2={width}
                y1={yScale(specs.usl)}
                y2={yScale(specs.usl)}
                stroke={chartColors.spec}
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            )}
          {displayOptions.showSpecs !== false &&
            (!grades || grades.length === 0) &&
            specs.lsl !== undefined && (
              <line
                x1={0}
                x2={width}
                y1={yScale(specs.lsl)}
                y2={yScale(specs.lsl)}
                stroke={chartColors.spec}
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            )}
          {displayOptions.showSpecs !== false &&
            (!grades || grades.length === 0) &&
            specs.target !== undefined && (
              <line
                x1={0}
                x2={width}
                y1={yScale(specs.target)}
                y2={yScale(specs.target)}
                stroke={chartColors.target}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            )}

          {/* Control Limits - per-stage when staging is active */}
          {stageBoundaries.length > 0
            ? stageBoundaries.map((boundary, i) => {
                const x1 = xScale(boundary.startX);
                const x2 = xScale(boundary.endX);
                return (
                  <React.Fragment key={`stage-${i}`}>
                    {/* Stage divider line */}
                    {i > 0 && (
                      <Line
                        from={{ x: x1, y: 0 }}
                        to={{ x: x1, y: height }}
                        stroke={chrome.stageDivider}
                        strokeWidth={1}
                        strokeDasharray="4,4"
                      />
                    )}
                    {/* Stage label */}
                    <text
                      x={(x1 + x2) / 2}
                      y={-8}
                      textAnchor="middle"
                      fill={chrome.labelSecondary}
                      fontSize={10}
                      fontWeight={500}
                    >
                      {boundary.name}
                    </text>
                    {/* UCL */}
                    <line
                      x1={x1}
                      x2={x2}
                      y1={yScale(boundary.stats.ucl)}
                      y2={yScale(boundary.stats.ucl)}
                      stroke={chrome.axisSecondary}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                    {/* LCL */}
                    <line
                      x1={x1}
                      x2={x2}
                      y1={yScale(boundary.stats.lcl)}
                      y2={yScale(boundary.stats.lcl)}
                      stroke={chrome.axisSecondary}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                    {/* Mean */}
                    <line
                      x1={x1}
                      x2={x2}
                      y1={yScale(boundary.stats.mean)}
                      y2={yScale(boundary.stats.mean)}
                      stroke={chrome.axisSecondary}
                      strokeWidth={1}
                    />
                  </React.Fragment>
                );
              })
            : stats && (
                <>
                  <line
                    x1={0}
                    x2={width}
                    y1={yScale(stats.ucl)}
                    y2={yScale(stats.ucl)}
                    stroke={chrome.axisSecondary}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  <line
                    x1={0}
                    x2={width}
                    y1={yScale(stats.lcl)}
                    y2={yScale(stats.lcl)}
                    stroke={chrome.axisSecondary}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  <line
                    x1={0}
                    x2={width}
                    y1={yScale(stats.mean)}
                    y2={yScale(stats.mean)}
                    stroke={chrome.axisSecondary}
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
              fill={getPointColor(d.y)}
              stroke={chrome.pointStroke}
              strokeWidth={1}
              className={onPointClick ? 'cursor-pointer' : ''}
              onClick={() => onPointClick?.(i)}
            />
          ))}

          <AxisLeft
            scale={yScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
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
              fontSize={13}
              fontWeight={500}
              className="group-hover/label:fill-blue-400 transition-colors"
            >
              {yParams.label}
            </text>
            <foreignObject
              x={yParams.x - 8}
              y={yParams.y + 10}
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
            label={stageColumn ? 'Observation' : timeColumn ? 'Time' : 'Sequence'}
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
        </Group>
      </svg>

      {/* Y-Axis Scale Popover */}
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
