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
import { Edit2, Info, Eye, EyeOff, BarChart3, Upload, EyeOff as HideIcon } from 'lucide-react';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { chartColors, useChartTheme } from '@variscout/charts';

// Empty state component for when no Pareto data is available
interface ParetoEmptyStateProps {
  onHide?: () => void;
  onSelectFactor?: () => void;
  onUploadPareto?: () => void;
  hasFactors: boolean;
}

function ParetoEmptyState({
  onHide,
  onSelectFactor,
  onUploadPareto,
  hasFactors,
}: ParetoEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-content-secondary">
      <BarChart3 size={32} className="mb-2 opacity-50" />
      <p className="text-sm mb-3">No Pareto data</p>
      <div className="flex gap-2">
        {hasFactors && onSelectFactor && (
          <button
            onClick={onSelectFactor}
            className="text-xs px-3 py-1 bg-surface-tertiary rounded hover:bg-surface-elevated transition-colors"
          >
            Select Factor
          </button>
        )}
        {onUploadPareto && (
          <button
            onClick={onUploadPareto}
            className="text-xs px-3 py-1 bg-surface-tertiary rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <Upload size={12} />
            Upload
          </button>
        )}
        {onHide && (
          <button
            onClick={onHide}
            className="text-xs px-3 py-1 bg-surface-tertiary rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <HideIcon size={12} />
            Hide
          </button>
        )}
      </div>
    </div>
  );
}

interface ParetoChartProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  /** Show ghost bars comparing filtered to full population */
  showComparison?: boolean;
  /** Callback to toggle comparison view */
  onToggleComparison?: () => void;
  /** Callback to hide the Pareto panel */
  onHide?: () => void;
  /** Callback to open factor selector */
  onSelectFactor?: () => void;
  /** Callback to open Pareto file upload dialog */
  onUploadPareto?: () => void;
  /** Available factors for selection (to determine if "Select Factor" button shows) */
  availableFactors?: string[];
}

const ParetoChart = ({
  factor,
  parentWidth,
  parentHeight,
  onDrillDown,
  showComparison = false,
  onToggleComparison,
  onHide,
  onSelectFactor,
  onUploadPareto,
  availableFactors = [],
}: ParetoChartProps) => {
  const { chrome } = useChartTheme();
  const {
    rawData,
    filteredData,
    filters,
    setFilters,
    columnAliases,
    setColumnAliases,
    outcome,
    paretoMode,
    separateParetoData,
  } = useData();
  const [editingAxis, setEditingAxis] = useState<string | null>(null);
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<any>();

  const sourceBarHeight = getSourceBarHeight();
  const margin = useResponsiveChartMargins(parentWidth, 'pareto', sourceBarHeight);
  const fonts = useResponsiveChartFonts(parentWidth);

  // Determine if using separate Pareto data
  const usingSeparateData =
    paretoMode === 'separate' && separateParetoData && separateParetoData.length > 0;

  // Check if any filters are active (for comparison feature)
  const hasActiveFilters = useMemo(() => {
    if (!filters) return false;
    return Object.values(filters).some(values => values && values.length > 0);
  }, [filters]);

  // Calculate full population percentages for ghost bars comparison
  const fullPopulationData = useMemo(() => {
    if (!showComparison || !hasActiveFilters || usingSeparateData || rawData.length === 0) {
      return new Map<string, number>();
    }

    const fullCounts = d3.rollup(
      rawData,
      (v: any) => v.length,
      (d: any) => d[factor]
    );
    const fullTotal = rawData.length;

    // Convert to percentage map
    const percentageMap = new Map<string, number>();
    for (const [key, count] of fullCounts) {
      percentageMap.set(key as string, ((count as number) / fullTotal) * 100);
    }
    return percentageMap;
  }, [showComparison, hasActiveFilters, usingSeparateData, rawData, factor]);

  const { data, totalCount } = useMemo(() => {
    let sorted: { key: string; value: number }[];

    if (usingSeparateData && separateParetoData) {
      // Use pre-aggregated separate Pareto data
      sorted = separateParetoData
        .map(row => ({ key: row.category, value: row.count }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Derive from filtered data (default behavior)
      const counts = d3.rollup(
        filteredData,
        (v: any) => v.length,
        (d: any) => d[factor]
      );
      sorted = Array.from(counts, ([key, value]: any) => ({ key, value })).sort(
        (a: any, b: any) => b.value - a.value
      );
    }

    const total = d3.sum(sorted, d => d.value);
    let cumulative = 0;
    const withCumulative = sorted.map(d => {
      cumulative += d.value;
      return { ...d, cumulative, cumulativePercentage: (cumulative / total) * 100 };
    });

    return { data: withCumulative, totalCount: total };
  }, [filteredData, factor, usingSeparateData, separateParetoData]);

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

  // Show empty state with actionable options when no Pareto data
  if (data.length === 0) {
    return (
      <ParetoEmptyState
        onHide={onHide}
        onSelectFactor={onSelectFactor}
        onUploadPareto={onUploadPareto}
        hasFactors={availableFactors.length > 0}
      />
    );
  }

  return (
    <>
      <svg width={parentWidth} height={parentHeight}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={width} stroke={chrome.gridLine} />

          {/* Separate data indicator */}
          {usingSeparateData && (
            <foreignObject x={0} y={-margin.top + 4} width={width} height={20}>
              <div className="flex items-center justify-center gap-1 text-xs text-amber-500">
                <Info size={12} />
                <span>Using separate Pareto file (not linked to filters)</span>
              </div>
            </foreignObject>
          )}

          {/* Toggle button for comparison (positioned in top right) */}
          {hasActiveFilters && !usingSeparateData && onToggleComparison && (
            <foreignObject x={width - 30} y={-margin.top + 4} width={26} height={26}>
              <button
                onClick={onToggleComparison}
                className={`p-1 rounded transition-colors ${
                  showComparison
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-surface-tertiary/50 text-content-muted hover:text-content hover:bg-surface-tertiary'
                }`}
                title={
                  showComparison ? 'Hide overall comparison' : 'Compare to overall distribution'
                }
              >
                {showComparison ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </foreignObject>
          )}

          {/* Ghost bars - full population comparison (render first, behind solid bars) */}
          {showComparison &&
            hasActiveFilters &&
            !usingSeparateData &&
            data.map((d, i) => {
              const fullPct = fullPopulationData.get(d.key);
              if (fullPct === undefined) return null;

              // Calculate "expected" count based on full population distribution
              // This allows visual comparison on the same count scale
              const expectedCount = (totalCount * fullPct) / 100;

              return (
                <Bar
                  key={`ghost-${i}`}
                  x={xScale(d.key)}
                  y={yScale(expectedCount)}
                  width={xScale.bandwidth()}
                  height={height - yScale(expectedCount)}
                  fill={chrome.axisSecondary}
                  opacity={0.3}
                  rx={4}
                  stroke={chrome.axisPrimary}
                  strokeWidth={1}
                  strokeDasharray="4,2"
                  pointerEvents="none"
                />
              );
            })}

          {/* Solid bars - filtered data */}
          {data.map((d, i) => {
            const isSelected = (filters[factor] || []).includes(d.key);
            // Calculate percentages for tooltip comparison
            const filteredPct = (d.value / totalCount) * 100;
            const fullPct = fullPopulationData.get(d.key) || 0;
            const pctDiff = filteredPct - fullPct;

            return (
              <Bar
                key={i}
                x={xScale(d.key)}
                y={yScale(d.value)}
                width={xScale.bandwidth()}
                height={height - yScale(d.value)}
                fill={isSelected ? chartColors.selected : chrome.boxDefault}
                rx={4}
                onClick={() => handleBarClick(d.key)}
                onMouseOver={event => {
                  showTooltip({
                    tooltipLeft: (xScale(d.key) || 0) + xScale.bandwidth(),
                    tooltipTop: yScale(d.value),
                    tooltipData: {
                      ...d,
                      filteredPct,
                      fullPct,
                      pctDiff,
                      showComparison: showComparison && hasActiveFilters,
                    },
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
              fill={chartColors.cumulative}
              stroke={chrome.pointStroke}
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
          <AxisLeft
            scale={yScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            label=""
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
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
                  fill={chrome.labelPrimary}
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
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            label={parentWidth > 400 ? 'Cumulative %' : '%'}
            labelProps={{
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'middle',
              dx: parentWidth < 400 ? 20 : 35,
            }}
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
              fontSize: fonts.tickLabel,
              textAnchor: 'start',
              dx: 4,
              dy: 3,
            })}
          />
          <AxisBottom
            top={height}
            scale={xScale}
            stroke={chrome.axisPrimary}
            tickStroke={chrome.axisPrimary}
            label=""
            tickLabelProps={() => ({
              fill: chrome.labelPrimary,
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
                  fill={chrome.labelPrimary}
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
            fontSize: 12,
          }}
        >
          <div className="font-semibold">{tooltipData.key}</div>
          <div>Count: {tooltipData.value}</div>
          <div>Cumulative: {tooltipData.cumulativePercentage?.toFixed(1)}%</div>
          {tooltipData.showComparison && (
            <>
              <div className="mt-1 pt-1 border-t border-edge-secondary">
                <div>Filtered: {tooltipData.filteredPct?.toFixed(1)}%</div>
                <div>Overall: {tooltipData.fullPct?.toFixed(1)}%</div>
                <div
                  className={
                    tooltipData.pctDiff > 0
                      ? 'text-red-400'
                      : tooltipData.pctDiff < 0
                        ? 'text-green-400'
                        : 'text-content-secondary'
                  }
                >
                  {tooltipData.pctDiff > 0 ? '↑' : tooltipData.pctDiff < 0 ? '↓' : '→'}{' '}
                  {Math.abs(tooltipData.pctDiff).toFixed(1)}% vs overall
                </div>
              </div>
            </>
          )}
        </TooltipWithBounds>
      )}

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
