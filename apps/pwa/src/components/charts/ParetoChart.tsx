/**
 * PWA ParetoChart - Thin wrapper around shared @variscout/charts ParetoChartBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Uses useParetoChartData for shared data pipeline
 * 3. Shows empty state with action buttons when no data
 * 4. Manages PWA-specific UI (toggle buttons, axis label editing)
 * 5. Supports annotations (highlight colors + text overlay via right-click)
 * 6. Passes everything to shared ParetoChartBase
 */
import React, { useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { ParetoChartBase, getScaledFonts } from '@variscout/charts';
import { AxisEditor, ChartAnnotationLayer } from '@variscout/ui';
import { useParetoChartData } from '@variscout/hooks';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';
import type { HighlightColor, ChartAnnotation } from '@variscout/hooks';
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
  showBranding?: boolean;
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
  onHide,
  onSelectFactor,
  onUploadPareto,
  availableFactors = [],
  aggregation = 'count',
  onToggleAggregation,
  showBranding: showBrandingProp,
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

  const {
    usingSeparateData,
    hasActiveFilters,
    data,
    totalCount,
    comparisonData,
    ghostBarData,
    categoryPositions,
  } = useParetoChartData({
    rawData,
    filteredData,
    factor,
    outcome,
    aggregation,
    showComparison,
    paretoMode,
    separateParetoData,
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
