import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { Bar, LinePath, Circle } from '@visx/shape';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { withParentSize } from '@visx/responsive';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import {
  useResponsiveChartMargins,
  useResponsiveChartFonts,
} from '../../hooks/useResponsiveChartMargins';
import AxisEditor from '../AxisEditor';
import ChartSourceBar, { getSourceBarHeight } from './ChartSourceBar';
import ChartSignature from './ChartSignature';
import { Edit2 } from 'lucide-react';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

interface ParetoChartProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
}

const ParetoChart = ({ factor, parentWidth, parentHeight }: ParetoChartProps) => {
  const { filteredData, filters, setFilters, columnAliases, setColumnAliases, outcome } = useData();
  const [editingAxis, setEditingAxis] = useState<string | null>(null);
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<any>();

  const sourceBarHeight = getSourceBarHeight();
  const margin = useResponsiveChartMargins(parentWidth, 'pareto', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);

  const { data, totalCount } = useMemo(() => {
    const counts = d3.rollup(
      filteredData,
      (v: any) => v.length,
      (d: any) => d[factor]
    );
    let sorted = Array.from(counts, ([key, value]: any) => ({ key, value })).sort(
      (a: any, b: any) => b.value - a.value
    );

    const total = d3.sum(sorted, d => d.value);
    let cumulative = 0;
    const withCumulative = sorted.map(d => {
      cumulative += d.value;
      return { ...d, cumulative, cumulativePercentage: (cumulative / total) * 100 };
    });

    return { data: withCumulative, totalCount: total };
  }, [filteredData, factor]);

  const width = Math.max(0, parentWidth - margin.left - margin.right);
  const height = Math.max(0, parentHeight - margin.top - margin.bottom);

  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, width],
        domain: data.map(d => d.key),
        padding: 0.2,
      }),
    [data, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: [0, Math.max(0, ...data.map(d => d.value))],
        nice: true,
      }),
    [data, height]
  );

  const yPercScale = useMemo(
    () =>
      scaleLinear({
        range: [height, 0],
        domain: [0, 100],
      }),
    [height]
  );

  const handleBarClick = (key: any) => {
    const currentFilters = filters[factor] || [];
    const newFilters = currentFilters.includes(key)
      ? currentFilters.filter(v => v !== key)
      : [...currentFilters, key];

    setFilters({ ...filters, [factor]: newFilters });
  };

  const handleAxisClick = (axisName: string) => {
    setEditingAxis(axisName);
  };

  const handleSaveAlias = (newAlias: string) => {
    if (editingAxis) {
      setColumnAliases({
        ...columnAliases,
        [editingAxis]: newAlias,
      });
      setEditingAxis(null);
    }
  };

  if (data.length === 0) return null;

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke="#1e293b" />

          {/* Bars */}
          {data.map((d, i) => {
            const isSelected = (filters[factor] || []).includes(d.key);
            return (
              <Bar
                key={i}
                x={xScale(d.key)}
                y={yScale(d.value)}
                width={xScale.bandwidth()}
                height={height - yScale(d.value)}
                fill={isSelected ? '#0ea5e9' : '#475569'}
                rx={4}
                onClick={() => handleBarClick(d.key)}
                onMouseOver={event => {
                  showTooltip({
                    tooltipLeft: (xScale(d.key) || 0) + xScale.bandwidth(),
                    tooltipTop: yScale(d.value),
                    tooltipData: d,
                  });
                }}
                onMouseLeave={hideTooltip}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            );
          })}

          {/* 80% Reference Line */}
          <line
            x1={0}
            x2={width}
            y1={yPercScale(80)}
            y2={yPercScale(80)}
            stroke="#f97316"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.8}
          />
          <text x={width - 5} y={yPercScale(80) - 5} fill="#f97316" fontSize={10} textAnchor="end">
            80%
          </text>

          {/* Cumulative Line */}
          <LinePath
            data={data}
            x={d => (xScale(d.key) || 0) + xScale.bandwidth() / 2}
            y={d => yPercScale(d.cumulativePercentage)}
            stroke="#f97316"
            strokeWidth={2}
          />
          {data.map((d, i) => (
            <Circle
              key={i}
              cx={(xScale(d.key) || 0) + xScale.bandwidth() / 2}
              cy={yPercScale(d.cumulativePercentage)}
              r={3}
              fill="#f97316"
              stroke="#0f172a"
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
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

          {/* Y-Axis Label (Affordance) */}
          {(() => {
            const yLabelOffset = parentWidth < 400 ? -25 : parentWidth < 768 ? -40 : -50;
            return (
              <Group
                onClick={() => handleAxisClick(outcome || 'Frequency')}
                className="cursor-pointer group/label"
              >
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
                  {outcome ? columnAliases[outcome] || outcome : 'Frequency'}
                </text>
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
            );
          })()}

          <AxisRight
            scale={yPercScale}
            left={width}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            label={parentWidth > 400 ? 'Cumulative %' : '%'}
            labelProps={{
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dx: parentWidth < 400 ? 20 : 35,
            }}
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'start',
              dx: 4,
              dy: 3,
            })}
          />
          <AxisBottom
            top={height}
            scale={xScale}
            stroke="#94a3b8"
            tickStroke="#94a3b8"
            label=""
            tickLabelProps={() => ({
              fill: '#cbd5e1',
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* X-Axis Label (Affordance) */}
          {(() => {
            const xLabelOffset = parentWidth < 400 ? 30 : 40;
            return (
              <Group
                onClick={() => handleAxisClick(factor)}
                className="cursor-pointer group/label2"
              >
                <text
                  x={width / 2}
                  y={height + xLabelOffset}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize={fonts.axisLabel}
                  fontWeight={500}
                  className="group-hover/label2:fill-blue-400 transition-colors"
                >
                  {columnAliases[factor] || factor}
                </text>
                <foreignObject
                  x={width / 2 + 8}
                  y={height + xLabelOffset - 12}
                  width={16}
                  height={16}
                  className="opacity-0 group-hover/label2:opacity-100 transition-opacity"
                >
                  <div className="flex items-center justify-center text-blue-400">
                    <Edit2 size={14} />
                  </div>
                </foreignObject>
              </Group>
            );
          })()}

          {/* Signature (painter-style branding) */}
          <ChartSignature x={width - 10} y={height + margin.bottom - sourceBarHeight - 18} />

          {/* Source Bar (branding) */}
          <ChartSourceBar
            width={width}
            top={height + margin.bottom - sourceBarHeight}
            n={totalCount}
          />
        </Group>
      </svg>

      {editingAxis && (
        <AxisEditor
          title={`Edit ${editingAxis === factor ? 'Category' : 'Outcome'} Label`}
          originalName={editingAxis}
          alias={columnAliases[editingAxis] || ''}
          onSave={handleSaveAlias}
          onClose={() => setEditingAxis(null)}
          style={{
            top: height / 2,
            left: width / 2,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </>
  );
};

export default withParentSize(ParetoChart);
