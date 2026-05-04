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
import React, { useState, useRef, useEffect } from 'react';
import { ParetoChartBase, getScaledFonts } from '@variscout/charts';
import { useParetoChartData, useTranslation } from '@variscout/hooks';
import { shouldShowBranding, getBrandingText } from '@variscout/core';
import { ChartAnnotationLayer } from '../ChartAnnotationLayer';
import { AxisEditor } from '../AxisEditor';
import { ParetoMakeScopeButton } from '../ParetoMakeScopeButton';
import {
  Eye,
  EyeOff,
  Hash,
  Sigma,
  Info,
  BarChart3,
  Upload,
  EyeOff as HideIcon,
  ChevronDown,
} from 'lucide-react';
import type { DataRow, ParetoRow, Finding } from '@variscout/core';
import type { AnalysisBrief } from '@variscout/core/findings';
import type { ParetoYMetric, ParetoYMetricId, ComputeParetoYContext } from '@variscout/core/pareto';
import type { HighlightColor, ParetoMode } from '@variscout/hooks';

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
  /** Findings linked to this chart (rendered as annotation boxes) */
  findings?: Finding[];
  /** Edit a finding's text from the annotation box */
  onEditFinding?: (id: string, text: string) => void;
  /** Delete a finding from the annotation box */
  onDeleteFinding?: (id: string) => void;
  // PWA-specific empty state actions (omit for Azure behavior of returning null)
  /** Callback to hide pareto panel */
  onHide?: () => void;
  /** Callback to open factor selector */
  onSelectFactor?: () => void;
  /** Callback to upload pareto data */
  onUploadPareto?: () => void;
  /** Available factors for factor selector */
  availableFactors?: string[];
  /** Callback to switch the Pareto grouping factor (inline dropdown) */
  onFactorSwitch?: (factorName: string) => void;
  /**
   * When provided, takes precedence over `onFiltersChange` for bar clicks.
   * Plain click replaces selection (single-bar); shift-click toggles add/remove.
   * Receiver typically calls `setScopeFilter` via `useCanvasFilters`.
   *
   * Precedence order (highest to lowest):
   *   1. `onDrillDown` — if set, runs and short-circuits everything else.
   *   2. `onScopeFilterClick` — if set (and no onDrillDown), routes here.
   *   3. Legacy `onFiltersChange` toggle — default when neither above is set.
   */
  onScopeFilterClick?: (factor: string, value: string, ctx: { shiftKey: boolean }) => void;
  /**
   * Currently-active scope filter values for `factor`. Drives `selectedBars`
   * highlight on the chart. Caller derives this from `useCanvasFilters.scopeFilter`
   * when `scopeFilter.factor === factor`; pass empty array otherwise.
   *
   * When provided, takes precedence over the legacy `filters[factor]` source for
   * the highlight state.
   */
  scopeFilterValues?: ReadonlyArray<string | number>;
  /**
   * When provided AND bars are selected (via `scopeFilterValues` or `filters[factor]`),
   * renders a "Make this the investigation scope" affordance next to the picker header.
   * On click, builds an {@link AnalysisBrief} with auto-filled `issueStatement` and
   * emits it via this callback.
   *
   * Consumers should wire this to a StageFiveModal opener. Consumer-app integration
   * (opening StageFiveModal with the brief, creating an Investigation entity via the
   * appropriate store) is per-app and is currently a follow-up — see slice 4 plan
   * P4.2 scope notes.
   */
  onMakeInvestigationScope?: (brief: AnalysisBrief) => void;
  /**
   * Active Y-axis metric id. When set, takes precedence over `aggregation` for
   * non-count metrics. Forwarded to useParetoChartData.
   */
  yMetric?: ParetoYMetricId;
  /**
   * Available Y-metric options (typically `getStrategy(mode).paretoYOptions`).
   * Picker is hidden when undefined or length ≤ 1.
   */
  availableYMetrics?: ParetoYMetric[];
  /** Callback when user picks a different Y metric. */
  onYMetricSwitch?: (metricId: ParetoYMetricId) => void;
  /**
   * Context required by computeParetoY for non-`count` metrics.
   * Caller MUST memoize this object to avoid re-render loops.
   */
  yMetricContext?: ComputeParetoYContext;
}

/** Compact dropdown for switching the Pareto grouping factor */
const FactorSelectorDropdown = ({
  currentFactor,
  availableFactors,
  onSelect,
}: {
  currentFactor: string;
  availableFactors: string[];
  onSelect: (factor: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-surface-tertiary/50 text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors max-w-[120px]"
        title={`Group by: ${currentFactor}`}
      >
        <span className="truncate">{currentFactor}</span>
        <ChevronDown
          size={10}
          className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full right-0 mt-0.5 min-w-[120px] max-w-[200px] bg-surface-elevated border border-edge rounded shadow-lg z-20 py-0.5 max-h-[200px] overflow-y-auto"
        >
          {availableFactors.map(f => (
            <button
              key={f}
              role="option"
              aria-selected={f === currentFactor}
              onClick={() => {
                onSelect(f);
                setIsOpen(false);
              }}
              className={`w-full text-left text-xs px-2 py-1 truncate transition-colors ${
                f === currentFactor
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
              }`}
              title={f}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Compact dropdown for switching the Pareto Y-axis metric */
const YMetricSelectorDropdown = ({
  currentMetricId,
  availableYMetrics,
  onSelect,
}: {
  currentMetricId: ParetoYMetricId;
  availableYMetrics: ParetoYMetric[];
  onSelect: (metricId: ParetoYMetricId) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentMetric = availableYMetrics.find(m => m.id === currentMetricId);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Y axis metric"
        className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-surface-tertiary/50 text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors max-w-[120px]"
        title={`Y axis: ${currentMetric?.label ?? currentMetricId}`}
      >
        <span className="truncate">{currentMetric?.label ?? currentMetricId}</span>
        <ChevronDown
          size={10}
          className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full right-0 mt-0.5 min-w-[140px] max-w-[220px] bg-surface-elevated border border-edge rounded shadow-lg z-20 py-0.5 max-h-[200px] overflow-y-auto"
        >
          {availableYMetrics.map(m => (
            <button
              key={m.id}
              role="option"
              aria-selected={m.id === currentMetricId}
              onClick={() => {
                onSelect(m.id);
                setIsOpen(false);
              }}
              className={`w-full text-left text-xs px-2 py-1 truncate transition-colors ${
                m.id === currentMetricId
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-content-secondary hover:text-content hover:bg-surface-tertiary'
              }`}
              title={m.description ?? m.label}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  onScopeFilterClick,
  scopeFilterValues,
  showComparison = false,
  onToggleComparison,
  aggregation = 'count',
  onToggleAggregation,
  showBranding: showBrandingProp,
  highlightedCategories,
  onContextMenu,
  findings = [],
  onEditFinding,
  onDeleteFinding,
  onHide,
  onSelectFactor,
  onUploadPareto,
  availableFactors = [],
  onFactorSwitch,
  onMakeInvestigationScope,
  yMetric,
  availableYMetrics,
  onYMetricSwitch,
  yMetricContext,
}: ParetoChartWrapperBaseProps) => {
  const { formatStat } = useTranslation();
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
    yMetric,
    yMetricContext,
  });

  const handleBarClick = (key: string, ctx?: { shiftKey: boolean }) => {
    if (onDrillDown) {
      onDrillDown(factor, key);
      return;
    }
    if (onScopeFilterClick) {
      onScopeFilterClick(factor, key, { shiftKey: ctx?.shiftKey ?? false });
      return;
    }
    // Legacy behavior: toggle filter membership in filters[factor]
    const currentFilters = filters[factor] || [];
    const newFilters = currentFilters.includes(key)
      ? currentFilters.filter(v => v !== key)
      : [...currentFilters, key];
    onFiltersChange({ ...filters, [factor]: newFilters });
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
  // Prefer scopeFilterValues (new canvas-filter path) over legacy filters[factor]
  const selectedBars = scopeFilterValues
    ? scopeFilterValues.map(String)
    : (filters[factor] || []).map(String);
  const fonts = getScaledFonts(parentWidth);

  return (
    <div className="relative w-full h-full">
      {/* Toggle buttons overlay */}
      <div className="absolute top-1 right-12 z-10 flex items-center gap-1">
        {/* Factor selector dropdown — visible when multiple factors + switch callback */}
        {availableFactors.length >= 2 && onFactorSwitch && (
          <FactorSelectorDropdown
            currentFactor={factor}
            availableFactors={availableFactors}
            onSelect={onFactorSwitch}
          />
        )}

        {/* Y-axis metric picker — visible when ≥ 2 options + switch callback */}
        {availableYMetrics !== undefined &&
          availableYMetrics.length >= 2 &&
          onYMetricSwitch &&
          yMetric !== undefined && (
            <YMetricSelectorDropdown
              currentMetricId={yMetric}
              availableYMetrics={availableYMetrics}
              onSelect={onYMetricSwitch}
            />
          )}

        {onMakeInvestigationScope && (
          <ParetoMakeScopeButton
            factor={factor}
            selectedBars={
              scopeFilterValues
                ? scopeFilterValues.map(v => v as string | number)
                : filters[factor] || []
            }
            onCreateInvestigation={onMakeInvestigationScope}
          />
        )}

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
                {yAxisLabel}: {aggregation === 'value' ? formatStat(d.value, 1) : d.value}
              </div>
              <div>Cumulative: {formatStat(d.cumulativePercentage, 1)}%</div>
              {showCompare && (
                <div className="mt-1 pt-1 border-t border-edge-secondary">
                  <div>Filtered: {formatStat(filteredPct, 1)}%</div>
                  <div>Overall: {formatStat(fullPct, 1)}%</div>
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
                    {formatStat(Math.abs(pctDiff), 1)}% vs overall
                  </div>
                </div>
              )}
            </>
          );
        }}
      />

      {findings.length > 0 && onEditFinding && onDeleteFinding && (
        <ChartAnnotationLayer
          findings={findings}
          onEditFinding={onEditFinding}
          onDeleteFinding={onDeleteFinding}
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
