/**
 * Azure ParetoChart - Thin wrapper around shared @variscout/charts ParetoChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Computes ParetoDataPoint[] with aggregation mode support
 * 3. Handles comparison mode (ghost bars via comparisonData)
 * 4. Handles separate Pareto file data
 * 5. Manages Azure-specific UI (toggle buttons, axis label editing)
 * 6. Supports annotations (highlight colors + text overlay via right-click)
 * 7. Passes everything to shared ParetoChartBase
 */
import React, { useMemo, useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { rollup, sum } from 'd3-array';
import { useData } from '../../context/DataContext';
import type { DataRow, DataCellValue } from '@variscout/core';
import {
  ParetoChartBase,
  type ParetoDataPoint,
  getResponsiveMargins,
  getScaledFonts,
} from '@variscout/charts';
import { ChartAnnotationLayer, AxisEditor } from '@variscout/ui';
import type { HighlightColor, ChartAnnotation } from '@variscout/hooks';

import { Eye, EyeOff, Hash, Sigma, Info } from 'lucide-react';

interface ParetoChartProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  /** Show ghost bars comparing filtered to full population */
  showComparison?: boolean;
  /** Callback to toggle comparison view */
  onToggleComparison?: () => void;
  /** Aggregation mode: 'count' (occurrences) or 'value' (sum of outcome) */
  aggregation?: 'count' | 'value';
  /** Callback to toggle aggregation mode */
  onToggleAggregation?: () => void;
  // Annotation support
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  annotations?: ChartAnnotation[];
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

const ParetoChart = ({
  factor,
  parentWidth,
  parentHeight,
  onDrillDown,
  showComparison = false,
  onToggleComparison,
  aggregation = 'count',
  onToggleAggregation,
  highlightedCategories,
  onContextMenu,
  annotations = [],
  onAnnotationsChange,
}: ParetoChartProps) => {
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

  // Determine if using separate Pareto data
  const usingSeparateData =
    paretoMode === 'separate' && separateParetoData && separateParetoData.length > 0;

  // Check if any filters are active (for comparison feature)
  const hasActiveFilters = useMemo(() => {
    if (!filters) return false;
    return Object.values(filters).some(values => values && values.length > 0);
  }, [filters]);

  // Calculate full population data for ghost bars comparison
  const comparisonData = useMemo(() => {
    if (!showComparison || !hasActiveFilters || usingSeparateData || rawData.length === 0) {
      return undefined;
    }

    const fullCounts = rollup(
      rawData,
      (v: DataRow[]) => v.length,
      (d: DataRow) => d[factor]
    );
    const fullTotal = rawData.length;

    // Store percentage map for tooltip use
    const percentageMap = new Map<string, number>();
    for (const [key, count] of fullCounts) {
      percentageMap.set(key as string, ((count as number) / fullTotal) * 100);
    }
    return percentageMap;
  }, [showComparison, hasActiveFilters, usingSeparateData, rawData, factor]);

  // Compute Pareto data from filtered data or separate file
  const { data, totalCount } = useMemo(() => {
    let sorted: { key: string; value: number }[];

    if (usingSeparateData && separateParetoData) {
      sorted = separateParetoData
        .map(row => ({
          key: row.category,
          value: aggregation === 'value' && row.value !== undefined ? row.value : row.count,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (aggregation === 'value' && outcome) {
      const sums = rollup(
        filteredData,
        (rows: DataRow[]) => sum(rows, (d: DataRow) => Number(d[outcome]) || 0),
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(sums, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      })).sort((a, b) => b.value - a.value);
    } else {
      const counts = rollup(
        filteredData,
        (v: DataRow[]) => v.length,
        (d: DataRow) => d[factor]
      );
      sorted = Array.from(counts, ([key, value]: [DataCellValue, number]) => ({
        key: String(key),
        value,
      })).sort((a, b) => b.value - a.value);
    }

    const total = sum(sorted, d => d.value);
    let cumulative = 0;
    const withCumulative: ParetoDataPoint[] = sorted.map(d => {
      cumulative += d.value;
      return { ...d, cumulative, cumulativePercentage: (cumulative / total) * 100 };
    });

    return { data: withCumulative, totalCount: total };
  }, [filteredData, factor, aggregation, outcome, usingSeparateData, separateParetoData]);

  // Convert comparison percentages to expected values (same scale as bars)
  const ghostBarData = useMemo(() => {
    if (!comparisonData || totalCount === 0) return undefined;
    const expectedValues = new Map<string, number>();
    for (const [key, pct] of comparisonData) {
      expectedValues.set(key, (totalCount * pct) / 100);
    }
    return expectedValues;
  }, [comparisonData, totalCount]);

  // Compute category positions for annotation layer
  const categoryPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (data.length === 0 || parentWidth === 0) return positions;

    const margin = getResponsiveMargins(parentWidth, 'pareto');
    const chartWidth = parentWidth - margin.left - margin.right;
    const padding = 0.2;
    const step = chartWidth / data.length;
    const bandwidth = step * (1 - padding);
    const offset = (step * padding) / 2;

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const x = margin.left + i * step + offset + bandwidth / 2;
      const y = margin.top;
      positions.set(d.key, { x, y });
    }
    return positions;
  }, [data, parentWidth]);

  const handleBarClick = (key: string) => {
    if (onDrillDown) {
      onDrillDown(factor, key);
    } else {
      const currentFilters = filters[factor] || [];
      const newFilters = currentFilters.includes(key)
        ? currentFilters.filter(v => v !== key)
        : [...currentFilters, key];
      setFilters({ ...filters, [factor]: newFilters });
    }
  };

  const handleSaveAlias = (newAlias: string) => {
    if (editingAxis) {
      setColumnAliases({ ...columnAliases, [editingAxis]: newAlias });
      setEditingAxis(null);
    }
  };

  if (!outcome || data.length === 0) return null;

  const yAxisLabel =
    aggregation === 'value' && outcome ? columnAliases[outcome] || outcome : 'Count';
  const xAxisLabel = columnAliases[factor] || factor;
  const selectedBars = (filters[factor] || []).map(String);
  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full">
      {/* Toggle buttons overlay */}
      <div className="absolute top-1 right-12 z-10 flex gap-1">
        {/* Separate data indicator */}
        {usingSeparateData && (
          <div className="flex items-center gap-1 text-xs text-amber-500 mr-2">
            <Info size={12} />
            <span>Using separate Pareto file</span>
          </div>
        )}

        {/* Aggregation mode toggle */}
        {onToggleAggregation && outcome && !usingSeparateData && (
          <button
            onClick={onToggleAggregation}
            className={`p-1 rounded transition-colors ${
              aggregation === 'value'
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                : 'bg-surface-tertiary/50 text-content-muted hover:text-content hover:bg-surface-tertiary'
            }`}
            title={
              aggregation === 'value'
                ? `Showing sum of ${columnAliases[outcome] || outcome}`
                : 'Showing counts'
            }
          >
            {aggregation === 'value' ? <Sigma size={14} /> : <Hash size={14} />}
          </button>
        )}

        {/* Comparison toggle */}
        {hasActiveFilters && !usingSeparateData && onToggleComparison && (
          <button
            onClick={onToggleComparison}
            className={`p-1 rounded transition-colors ${
              showComparison
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-surface-tertiary/50 text-content-muted hover:text-content hover:bg-surface-tertiary'
            }`}
            title={showComparison ? 'Hide overall comparison' : 'Compare to overall distribution'}
          >
            {showComparison ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>

      <ParetoChartBase
        data={data}
        totalCount={totalCount}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        selectedBars={selectedBars}
        onBarClick={handleBarClick}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={false}
        onYAxisClick={() => setEditingAxis(aggregation === 'value' ? outcome || 'Count' : 'Count')}
        onXAxisClick={() => setEditingAxis(factor)}
        comparisonData={ghostBarData}
        highlightedCategories={highlightedCategories}
        onBarContextMenu={onContextMenu}
        tooltipContent={d => {
          const filteredPct = (d.value / totalCount) * 100;
          const fullPct = comparisonData?.get(d.key) || 0;
          const pctDiff = filteredPct - fullPct;
          const showCompare = showComparison && hasActiveFilters && !usingSeparateData;

          return (
            <>
              <div className="font-semibold">{d.key}</div>
              <div>
                {yAxisLabel}: {aggregation === 'value' ? d.value.toFixed(1) : d.value}
              </div>
              <div>Cumulative: {d.cumulativePercentage.toFixed(1)}%</div>
              {showCompare && (
                <div className="mt-1 pt-1 border-t border-edge-secondary">
                  <div>Filtered: {filteredPct.toFixed(1)}%</div>
                  <div>Overall: {fullPct.toFixed(1)}%</div>
                  <div
                    className={
                      pctDiff > 0
                        ? 'text-red-400'
                        : pctDiff < 0
                          ? 'text-green-400'
                          : 'text-content-secondary'
                    }
                  >
                    {pctDiff > 0 ? '\u2191' : pctDiff < 0 ? '\u2193' : '\u2192'}{' '}
                    {Math.abs(pctDiff).toFixed(1)}% vs overall
                  </div>
                </div>
              )}
            </>
          );
        }}
      />

      {/* Annotation text overlay — always active (no mode toggle) */}
      {annotations.length > 0 && onAnnotationsChange && (
        <ChartAnnotationLayer
          annotations={annotations}
          onAnnotationsChange={onAnnotationsChange}
          isActive={true}
          categoryPositions={categoryPositions}
          maxWidth={parentWidth * 0.7}
          textColor="var(--color-content-primary, #cbd5e1)"
          fontSize={fonts.statLabel}
        />
      )}

      {editingAxis && (
        <AxisEditor
          title={`Edit ${editingAxis === factor ? 'Category' : 'Outcome'} Label`}
          originalName={editingAxis}
          alias={columnAliases[editingAxis] || ''}
          onSave={handleSaveAlias}
          onClose={() => setEditingAxis(null)}
          style={{
            top: parentHeight / 2,
            left: parentWidth / 2,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  );
};

export default withParentSize(ParetoChart);
