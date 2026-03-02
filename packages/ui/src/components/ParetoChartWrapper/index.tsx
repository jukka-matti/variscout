/**
 * ParetoChartWrapperBase - Shared Pareto wrapper for PWA and Azure apps
 *
 * Contains all rendering logic:
 * - Computes pareto data via useParetoChartData
 * - Toggle buttons overlay (aggregation, comparison, hide, separate data indicator)
 * - Empty state (configurable: PWA shows action buttons, Azure returns null)
 * - Manages axis editor state
 * - Renders ParetoChartBase + ChartAnnotationLayer + AxisEditor
 * - Tier-aware branding via shouldShowBranding()
 *
 * Each app keeps a thin wrapper that calls useData() and spreads the result as props.
 */
import React, { useState } from 'react';
import { ParetoChartBase, getScaledFonts } from '@variscout/charts';
import { useParetoChartData } from '@variscout/hooks';
import { shouldShowBranding, getBrandingText } from '@variscout/core';
import { ChartAnnotationLayer } from '../ChartAnnotationLayer';
import { AxisEditor } from '../AxisEditor';
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
import type { DataRow, ParetoRow } from '@variscout/core';
import type { HighlightColor, ChartAnnotation, ParetoMode } from '@variscout/hooks';

export interface ParetoChartWrapperBaseProps {
  parentWidth: number;
  parentHeight: number;
  /** Factor column for categories */
  factor: string;
  /** Full unfiltered data */
  rawData: DataRow[];
  /** Filtered data rows */
  filteredData: DataRow[];
  /** Outcome column name */
  outcome: string | null;
  /** Current filter selections */
  filters: Record<string, (string | number)[]>;
  /** Callback to update filters */
  onFiltersChange: (filters: Record<string, (string | number)[]>) => void;
  /** Column display aliases */
  columnAliases: Record<string, string>;
  /** Callback to update aliases */
  onColumnAliasesChange: (aliases: Record<string, string>) => void;
  /** Pareto data source mode */
  paretoMode?: ParetoMode | null;
  /** Separately uploaded pareto data */
  separateParetoData?: ParetoRow[] | null;
  /** Drill-down callback (overrides filter toggle when provided) */
  onDrillDown?: (factor: string, value: string) => void;
  /** Show ghost bars comparing filtered to full population */
  showComparison?: boolean;
  /** Callback to toggle comparison view */
  onToggleComparison?: () => void;
  /** Aggregation mode: 'count' or 'value' */
  aggregation?: 'count' | 'value';
  /** Callback to toggle aggregation mode */
  onToggleAggregation?: () => void;
  /** Override branding display (undefined = auto-detect via tier) */
  showBranding?: boolean;
  /** Annotation highlights */
  highlightedCategories?: Record<string, HighlightColor>;
  /** Context menu callback for annotations */
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  /** Text annotations */
  annotations?: ChartAnnotation[];
  /** Callback when annotations change */
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
  // PWA-specific empty state actions (omit for Azure behavior of returning null)
  /** Callback to hide pareto panel */
  onHide?: () => void;
  /** Callback to open factor selector */
  onSelectFactor?: () => void;
  /** Callback to upload pareto data */
  onUploadPareto?: () => void;
  /** Available factors for factor selector */
  availableFactors?: string[];
}

export const ParetoChartWrapperBase = ({
  parentWidth,
  parentHeight,
  factor,
  rawData,
  filteredData,
  outcome,
  filters,
  onFiltersChange,
  columnAliases,
  onColumnAliasesChange,
  paretoMode,
  separateParetoData,
  onDrillDown,
  showComparison = false,
  onToggleComparison,
  aggregation = 'count',
  onToggleAggregation,
  showBranding: showBrandingProp,
  highlightedCategories,
  onContextMenu,
  annotations = [],
  onAnnotationsChange,
  onHide,
  onSelectFactor,
  onUploadPareto,
  availableFactors = [],
}: ParetoChartWrapperBaseProps) => {
  const [editingAxis, setEditingAxis] = useState<string | null>(null);

  const {
    usingSeparateData,
    hasActiveFilters,
    data,
    totalCount,
    comparisonData,
    ghostBarData,
    categoryPositions,
    allSingleRow,
  } = useParetoChartData({
    rawData,
    filteredData,
    factor,
    outcome,
    aggregation,
    showComparison,
    paretoMode: paretoMode ?? null,
    separateParetoData: separateParetoData ?? null,
    filters,
    parentWidth,
  });

  const handleBarClick = (key: string) => {
    if (onDrillDown) {
      onDrillDown(factor, key);
    } else {
      const currentFilters = filters[factor] || [];
      const newFilters = currentFilters.includes(key)
        ? currentFilters.filter(v => v !== key)
        : [...currentFilters, key];
      onFiltersChange({ ...filters, [factor]: newFilters });
    }
  };

  const handleSaveAlias = (newAlias: string) => {
    if (editingAxis) {
      onColumnAliasesChange({ ...columnAliases, [editingAxis]: newAlias });
      setEditingAxis(null);
    }
  };

  // Empty state
  if (data.length === 0) {
    // PWA: show action buttons when callbacks are provided
    if (onHide || onSelectFactor || onUploadPareto) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-content-secondary">
          <BarChart3 size={32} className="mb-2 opacity-50" />
          <p className="text-sm mb-3">No Pareto data</p>
          <div className="flex gap-2">
            {availableFactors.length > 0 && onSelectFactor && (
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
    // Azure: return null
    return null;
  }

  const showBranding = showBrandingProp ?? shouldShowBranding();
  const yAxisLabel =
    aggregation === 'value' && outcome ? columnAliases[outcome] || outcome : 'Count';
  const xAxisLabel = columnAliases[factor] || factor;
  const selectedBars = (filters[factor] || []).map(String);
  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full">
      {/* Toggle buttons overlay */}
      <div className="absolute top-1 right-12 z-10 flex gap-1">
        {usingSeparateData && (
          <div className="flex items-center gap-1 text-xs text-amber-500 mr-2">
            <Info size={12} />
            <span>Using separate Pareto file</span>
          </div>
        )}

        {onHide && (
          <button
            onClick={onHide}
            className="p-1 rounded bg-surface-tertiary/50 text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
            title="Hide Pareto panel"
          >
            <HideIcon size={14} />
          </button>
        )}

        {allSingleRow && aggregation === 'count' && outcome && onToggleAggregation && (
          <button
            onClick={onToggleAggregation}
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 mr-1 transition-colors"
            title={`Each category has 1 row — switch to sum of ${columnAliases[outcome] || outcome}`}
          >
            <Info size={12} />
            <span>1 row each — try &Sigma;</span>
          </button>
        )}

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
