/**
 * PWA ParetoChart - Thin wrapper around shared @variscout/charts ParetoChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Computes ParetoDataPoint[] with aggregation mode support
 * 3. Handles comparison mode (ghost bars via comparisonData)
 * 4. Handles separate Pareto file data
 * 5. Shows empty state with action buttons when no data
 * 6. Manages PWA-specific UI (toggle buttons, axis label editing)
 * 7. Passes everything to shared ParetoChartBase
 */
import React, { useMemo, useState } from 'react';
import { withParentSize } from '@visx/responsive';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import { ParetoChartBase, type ParetoDataPoint } from '@variscout/charts';
import { AxisEditor } from '@variscout/ui';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';
import {
  Eye,
  EyeOff,
  Hash,
  Sigma,
  Info,
  BarChart3,
  Upload,
  EyeOff as HideIcon,
} from 'lucide-react';

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
  showComparison?: boolean;
  onToggleComparison?: () => void;
  onHide?: () => void;
  onSelectFactor?: () => void;
  onUploadPareto?: () => void;
  availableFactors?: string[];
  aggregation?: 'count' | 'value';
  onToggleAggregation?: () => void;
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
  aggregation = 'count',
  onToggleAggregation,
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

    const fullCounts = d3.rollup(
      rawData,
      (v: any) => v.length,
      (d: any) => d[factor]
    );
    const fullTotal = rawData.length;

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
      const sums = d3.rollup(
        filteredData,
        (rows: any) => d3.sum(rows, (d: any) => Number(d[outcome]) || 0),
        (d: any) => d[factor]
      );
      sorted = Array.from(sums, ([key, value]: any) => ({ key, value })).sort(
        (a, b) => b.value - a.value
      );
    } else {
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

  const showBranding = shouldShowBranding();
  const yAxisLabel =
    aggregation === 'value' && outcome ? columnAliases[outcome] || outcome : 'Count';
  const xAxisLabel = columnAliases[factor] || factor;
  const selectedBars = (filters[factor] || []).map(String);

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

        {/* Hide button */}
        {onHide && (
          <button
            onClick={onHide}
            className="p-1 rounded bg-surface-tertiary/50 text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
            title="Hide Pareto panel"
          >
            <HideIcon size={14} />
          </button>
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
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onYAxisClick={() => setEditingAxis(aggregation === 'value' ? outcome || 'Count' : 'Count')}
        onXAxisClick={() => setEditingAxis(factor)}
        comparisonData={ghostBarData}
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
