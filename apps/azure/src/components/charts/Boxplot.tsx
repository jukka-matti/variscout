import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { withParentSize } from '@visx/responsive';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
} from '../../hooks/useResponsiveChartMargins';
import AxisEditor from '../AxisEditor';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';
import { Edit2 } from 'lucide-react';
import { VARIATION_THRESHOLDS } from '@variscout/core';
import { chartColors } from '@variscout/charts';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  /** Variation % explained by this factor (for drill suggestion indicator) */
  variationPct?: number;
}

const Boxplot = ({
  factor,
  parentWidth,
  parentHeight,
  onDrillDown,
  variationPct,
}: BoxplotProps) => {
  // Determine if this factor should be highlighted as a drill target
  const isHighVariation =
    variationPct !== undefined && variationPct >= VARIATION_THRESHOLDS.HIGH_IMPACT;
  const sourceBarHeight = getSourceBarHeight();
  const margin = useResponsiveChartMargins(parentWidth, 'boxplot', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);
  const {
    filteredData,
    outcome,
    filters,
    setFilters,
    columnAliases,
    setColumnAliases,
    valueLabels,
    setValueLabels,
    specs,
    displayOptions,
  } = useData();
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const data = useMemo(() => {
    if (!outcome) return [];
    const groups = d3.group(filteredData, (d: any) => d[factor]);
    return Array.from(groups, ([key, values]) => {
      const v = values
        .map((d: any) => Number(d[outcome]))
        .filter(val => !isNaN(val))
        .sort(d3.ascending);
      if (v.length === 0) return null;
      const q1 = d3.quantile(v, 0.25) || 0;
      const median = d3.quantile(v, 0.5) || 0;
      const q3 = d3.quantile(v, 0.75) || 0;
      const iqr = q3 - q1;
      const min = Math.max(v[0], q1 - 1.5 * iqr);
      const max = Math.min(v[v.length - 1], q3 + 1.5 * iqr);
      return { key, q1, median, q3, min, max, outliers: v.filter(x => x < min || x > max) };
    }).filter(d => d !== null) as any[];
  }, [filteredData, factor, outcome]);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, width],
        domain: data.map(d => d.key),
        padding: 0.4,
      }),
    [data, width]
  );

  const { min, max } = useChartScale();

  const yScale = useMemo(() => {
    return scaleLinear({
      range: [height, 0],
      domain: [min, max],
      nice: true,
    });
  }, [height, min, max]);

  const handleBoxClick = (key: string) => {
    if (onDrillDown) {
      onDrillDown(factor, key);
    } else {
      // Fallback to current behavior
      const currentFilters = filters[factor] || [];
      const newFilters = currentFilters.includes(key)
        ? currentFilters.filter(v => v !== key)
        : [...currentFilters, key];
      setFilters({ ...filters, [factor]: newFilters });
    }
  };

  const handleSaveAlias = (newAlias: string, newValueLabels?: Record<string, string>) => {
    setColumnAliases({
      ...columnAliases,
      [factor]: newAlias,
    });
    if (newValueLabels) {
      setValueLabels({
        ...valueLabels,
        [factor]: newValueLabels,
      });
    }
  };

  if (!outcome || data.length === 0) return null;

  const alias = columnAliases[factor] || factor;
  const factorLabels = valueLabels[factor] || {};

  // Responsive axis label positioning
  const yLabelOffset = parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50;
  const xLabelOffset = parentWidth < 400 ? 35 : 50;

  const xParams = {
    label: alias,
    x: width / 2,
    y: height + xLabelOffset,
  };

  return (
    <div className="relative w-full h-full">
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          {/* Spec Lines */}
          {displayOptions.showSpecs !== false && specs && (
            <>
              {specs.usl !== undefined && (
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
              {specs.lsl !== undefined && (
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
              {specs.target !== undefined && (
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
            </>
          )}
          {data.map((d: any, i: number) => {
            const x = xScale(d.key) || 0;
            const barWidth = xScale.bandwidth();
            const isSelected = (filters[factor] || []).includes(d.key);
            const opacity = filters[factor] && filters[factor].length > 0 && !isSelected ? 0.3 : 1;

            return (
              <Group
                key={i}
                onClick={() => handleBoxClick(d.key)}
                className="cursor-pointer"
                opacity={opacity}
              >
                {/* Transparent capture rect for better clickability */}
                <rect x={x - 5} y={0} width={barWidth + 10} height={height} fill="transparent" />

                {/* Whisker Line */}
                <line
                  x1={x + barWidth / 2}
                  x2={x + barWidth / 2}
                  y1={yScale(d.min)}
                  y2={yScale(d.max)}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />

                {/* Box */}
                <rect
                  x={x}
                  y={yScale(d.q3)}
                  width={barWidth}
                  height={Math.abs(yScale(d.q1) - yScale(d.q3))}
                  fill="#0ea5e9"
                  stroke="#0284c7"
                  rx={2}
                />

                {/* Median Line */}
                <line
                  x1={x}
                  x2={x + barWidth}
                  y1={yScale(d.median)}
                  y2={yScale(d.median)}
                  stroke="#f97316"
                  strokeWidth={2}
                />

                {/* Outliers */}
                {d.outliers.map((o: number, j: number) => (
                  <circle
                    key={j}
                    cx={x + barWidth / 2}
                    cy={yScale(o)}
                    r={3}
                    fill={chartColors.fail}
                    opacity={0.6}
                  />
                ))}
              </Group>
            );
          })}
          <AxisLeft
            scale={yScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            label=""
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
              fontFamily: 'monospace',
            })}
          />

          {/* Interactive Y-Axis Label */}
          <Group onClick={() => setIsEditingLabel(true)} className="cursor-pointer group/label">
            <text
              x={yLabelOffset}
              y={height / 2}
              transform={`rotate(-90 ${yLabelOffset} ${height / 2})`}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={fonts.axisLabel}
              fontWeight={500}
              className="group-hover/label:fill-blue-400 transition-colors"
            >
              {columnAliases[outcome] || outcome}
            </text>
            {/* Edit Icon */}
            <foreignObject
              x={yLabelOffset - 8}
              y={height / 2 + 10}
              width={16}
              height={16}
              transform={`rotate(-90 ${yLabelOffset} ${height / 2})`}
              className="opacity-0 group-hover/label:opacity-100 transition-opacity"
            >
              <div className="flex items-center justify-center text-blue-400">
                <Edit2 size={14} />
              </div>
            </foreignObject>
          </Group>

          <AxisBottom
            top={height}
            scale={xScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            label={''}
            tickFormat={val => factorLabels[val] || val}
            tickLabelProps={() => ({
              fill: '#94a3b8',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* Custom Clickable Axis Label with Variation Indicator */}
          <Group onClick={() => setIsEditingLabel(true)} className="cursor-pointer group/label2">
            <text
              x={xParams.x}
              y={xParams.y}
              textAnchor="middle"
              fill={isHighVariation ? '#f87171' : '#94a3b8'}
              fontSize={13}
              fontWeight={isHighVariation ? 600 : 500}
              className="group-hover/label2:fill-blue-400 transition-colors"
            >
              {xParams.label}
              {variationPct !== undefined && ` (${Math.round(variationPct)}%)`}
            </text>
            {/* Drill suggestion indicator */}
            {isHighVariation && (
              <text
                x={xParams.x}
                y={xParams.y + 14}
                textAnchor="middle"
                fill="#f87171"
                fontSize={10}
                className="pointer-events-none"
              >
                ↓ drill here
              </text>
            )}
            <foreignObject
              x={xParams.x + (variationPct !== undefined ? 40 : 8)}
              y={xParams.y - 12}
              width={16}
              height={16}
              className="opacity-0 group-hover/label2:opacity-100 transition-opacity"
            >
              <div className="flex items-center justify-center text-blue-400">
                <Edit2 size={14} />
              </div>
            </foreignObject>
          </Group>

          {/* Signature (painter-style branding) */}
          <ChartSignature x={width - 10} y={height + margin.bottom - sourceBarHeight - 18} />

          {/* Source Bar (branding) */}
          <ChartSourceBar
            width={width}
            top={height + margin.bottom - sourceBarHeight}
            n={filteredData.length}
          />
        </Group>
      </svg>

      {/* In-Place Label Editor Popover */}
      {isEditingLabel && (
        <AxisEditor
          title="Edit Axis & Categories"
          originalName={factor}
          alias={alias}
          values={data.map(d => d.key)}
          valueLabels={factorLabels}
          onSave={handleSaveAlias}
          onClose={() => setIsEditingLabel(false)}
          style={{ bottom: 10, left: margin.left + width / 2 - 120 }}
        />
      )}
    </div>
  );
};

export default withParentSize(Boxplot);
