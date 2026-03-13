/**
 * MobileChartCarousel — Phone-optimized single-chart-at-a-time view
 *
 * Shows one chart per screen with swipe navigation (Touch API),
 * pill navigation buttons, and dot indicators. Designed for
 * Teams mobile / phone viewports (<640px).
 *
 * Azure-specific: renders Azure chart wrappers that use useData() context.
 * Does not share code with PWA MobileDashboard (different context model).
 *
 * Boxplot/Pareto: tapping a category opens MobileCategorySheet (bottom action sheet)
 * instead of drilling down immediately. Sheet provides drill-down, highlight, and
 * pin-as-finding actions.
 */
import React, { useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Send,
  Check,
} from 'lucide-react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import PeoplePicker from './PeoplePicker';
import {
  AnovaResults,
  FactorSelector,
  ErrorBoundary,
  FilterBreadcrumb,
  MobileCategorySheet,
} from '@variscout/ui';
import type { MobileCategorySheetData } from '@variscout/ui';
import type {
  StatsResult,
  SpecLimits,
  DataRow,
  AnovaResult,
  BoxplotGroupData,
  Finding,
  FindingAssignee,
} from '@variscout/core';
import type { FilterChipData, HighlightColor } from '@variscout/hooks';

type ChartView = 'ichart' | 'boxplot' | 'pareto' | 'stats';

const VIEWS: { key: ChartView; label: string; icon: React.ReactNode }[] = [
  { key: 'ichart', label: 'I-Chart', icon: <Activity size={18} /> },
  { key: 'boxplot', label: 'Boxplot', icon: <BarChart3 size={18} /> },
  { key: 'pareto', label: 'Pareto', icon: <PieChart size={18} /> },
  { key: 'stats', label: 'Stats', icon: <TrendingUp size={18} /> },
];

interface MobileChartCarouselProps {
  // Factor state
  boxplotFactor: string;
  paretoFactor: string;
  factors: string[];
  onSetBoxplotFactor: (f: string) => void;
  onSetParetoFactor: (f: string) => void;
  // Filter state
  filters: Record<string, (string | number)[]>;
  columnAliases?: Record<string, string>;
  filterChipData: FilterChipData[];
  cumulativeVariationPct: number;
  onUpdateFilterValues: (factor: string, newValues: (string | number)[]) => void;
  onRemoveFilter: (factor: string) => void;
  onClearAllFilters: () => void;
  // Drill down
  onDrillDown: (factor: string, value: string) => void;
  // Variation tracking
  factorVariations: Map<string, number>;
  categoryContributions?: Map<string, Map<string | number, number>>;
  // Pareto
  paretoAggregation: 'count' | 'value';
  onToggleParetoAggregation: () => void;
  showParetoComparison: boolean;
  onToggleParetoComparison: () => void;
  // Stats
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData: DataRow[];
  outcome: string | null;
  onSaveSpecs: (specs: SpecLimits) => void;
  showCpk: boolean;
  // ANOVA
  anovaResult: AnovaResult | null;
  // Pin finding
  onPinFinding?: (noteText?: string) => void;
  // Chart observation (creates a Finding with source metadata)
  onAddChartObservation?: (
    chartType: 'boxplot' | 'pareto' | 'ichart',
    categoryKey?: string,
    noteText?: string
  ) => Finding | void;
  // Category sheet data (from Dashboard)
  boxplotData: BoxplotGroupData[];
  boxplotHighlights: Record<string, HighlightColor>;
  paretoHighlights: Record<string, HighlightColor>;
  onSetHighlight: (
    chartType: 'boxplot' | 'pareto',
    key: string,
    color: HighlightColor | undefined
  ) => void;
  // Assign & Share (Team plan channel @mention)
  canMentionInChannel?: boolean;
  onShareFinding?: (finding: Finding, assignee?: FindingAssignee) => Promise<boolean>;
  onSetFindingAssignee?: (findingId: string, assignee: FindingAssignee | null) => void;
}

const MobileChartCarousel: React.FC<MobileChartCarouselProps> = ({
  boxplotFactor,
  paretoFactor,
  factors,
  onSetBoxplotFactor,
  onSetParetoFactor,
  filters,
  columnAliases = {},
  filterChipData,
  cumulativeVariationPct,
  onUpdateFilterValues,
  onRemoveFilter,
  onClearAllFilters,
  onDrillDown,
  factorVariations,
  categoryContributions,
  paretoAggregation,
  onToggleParetoAggregation,
  showParetoComparison,
  onToggleParetoComparison,
  stats,
  specs,
  filteredData,
  outcome,
  onSaveSpecs,
  showCpk,
  anovaResult,
  onPinFinding,
  onAddChartObservation,
  boxplotData,
  boxplotHighlights,
  paretoHighlights,
  onSetHighlight,
  canMentionInChannel = false,
  onShareFinding,
  onSetFindingAssignee,
}) => {
  const [activeView, setActiveView] = useState<ChartView>('ichart');

  // Category sheet state
  const [categorySheet, setCategorySheet] = useState<MobileCategorySheetData | null>(null);
  const [sheetFactor, setSheetFactor] = useState<string>('');
  const [sheetChartType, setSheetChartType] = useState<'boxplot' | 'pareto'>('boxplot');

  // Post-pin "Assign & Share" state
  const [pinnedFinding, setPinnedFinding] = useState<Finding | null>(null);
  const [sheetPhase, setSheetPhase] = useState<'input' | 'confirm'>('input');
  const [assignee, setAssignee] = useState<FindingAssignee | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState(false);

  const currentIndex = VIEWS.findIndex(v => v.key === activeView);

  const goToView = useCallback(
    (direction: 'prev' | 'next') => {
      const newIndex =
        direction === 'next'
          ? (currentIndex + 1) % VIEWS.length
          : (currentIndex - 1 + VIEWS.length) % VIEWS.length;
      setActiveView(VIEWS[newIndex].key);
    },
    [currentIndex]
  );

  // Swipe handling (Touch API)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      goToView('next');
    } else if (distance < -minSwipeDistance) {
      goToView('prev');
    }
  }, [touchStart, touchEnd, goToView]);

  // Boxplot drill-down interceptor: opens sheet instead of drilling immediately
  const handleBoxplotDrillDown = useCallback(
    (factor: string, value: string) => {
      const group = boxplotData.find(g => g.key === value);
      const contributions = categoryContributions?.get(factor);
      const sheetData: MobileCategorySheetData = {
        categoryKey: value,
        chartType: 'boxplot',
        sampleN: group?.values.length,
        mean: group?.mean,
        median: group?.median,
        iqr: group ? group.q3 - group.q1 : undefined,
        stdDev: group?.stdDev,
        contributionPct: contributions?.get(value),
      };
      setCategorySheet(sheetData);
      setSheetFactor(factor);
      setSheetChartType('boxplot');
    },
    [boxplotData, categoryContributions]
  );

  // Pareto drill-down interceptor: opens sheet with contribution % (Option A)
  const handleParetoDrillDown = useCallback(
    (factor: string, value: string) => {
      const contributions = categoryContributions?.get(factor);
      const sheetData: MobileCategorySheetData = {
        categoryKey: value,
        chartType: 'pareto',
        contributionPct: contributions?.get(value),
      };
      setCategorySheet(sheetData);
      setSheetFactor(factor);
      setSheetChartType('pareto');
    },
    [categoryContributions]
  );

  const handleSheetClose = useCallback(() => {
    setCategorySheet(null);
    setPinnedFinding(null);
    setSheetPhase('input');
    setAssignee(null);
    setIsSharing(false);
    setShareSuccess(false);
    setShareError(false);
  }, []);

  // Sheet drill-down: performs the actual drill-down
  const handleSheetDrillDown = useCallback(() => {
    if (categorySheet) {
      onDrillDown(sheetFactor, categorySheet.categoryKey);
    }
  }, [categorySheet, sheetFactor, onDrillDown]);

  // Sheet highlight
  const handleSheetHighlight = useCallback(
    (color: HighlightColor | undefined) => {
      if (categorySheet) {
        onSetHighlight(sheetChartType, categorySheet.categoryKey, color);
      }
    },
    [categorySheet, sheetChartType, onSetHighlight]
  );

  // Sheet pin finding: use chart observation if available, else fall back to pin
  // If canMentionInChannel, transition to confirm phase instead of closing sheet
  const handleSheetPinFinding = useCallback(
    (noteText: string) => {
      let finding: Finding | undefined;
      if (onAddChartObservation && categorySheet) {
        const result = onAddChartObservation(sheetChartType, categorySheet.categoryKey, noteText);
        if (result) finding = result;
      } else {
        onPinFinding?.(noteText);
      }

      // Transition to confirm phase if we got a Finding back and can @mention
      if (finding && canMentionInChannel) {
        setPinnedFinding(finding);
        setSheetPhase('confirm');
        // Don't close the sheet — it transitions to confirm UI
      }
    },
    [onPinFinding, onAddChartObservation, categorySheet, sheetChartType, canMentionInChannel]
  );

  // Assign & Share handler
  const handleAssignAndShare = useCallback(async () => {
    if (!pinnedFinding || !onShareFinding) return;
    setIsSharing(true);
    try {
      // Persist assignee on the finding
      if (assignee && onSetFindingAssignee) {
        onSetFindingAssignee(pinnedFinding.id, assignee);
      }
      const success = await onShareFinding(pinnedFinding, assignee ?? undefined);
      if (success) {
        setShareSuccess(true);
        setTimeout(() => handleSheetClose(), 1500);
      } else {
        setIsSharing(false);
        setShareError(true);
      }
    } catch {
      setIsSharing(false);
      setShareError(true);
    }
  }, [pinnedFinding, assignee, onShareFinding, onSetFindingAssignee, handleSheetClose]);

  // Post-pin confirm UI (rendered inside sheet via renderExtra slot)
  const renderPostPinFlow = useCallback(() => {
    if (sheetPhase !== 'confirm' || !pinnedFinding) return null;

    if (shareSuccess) {
      return (
        <div className="px-4 py-3" data-testid="share-success">
          <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
            <Check size={16} />
            <span>Shared to channel</span>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mx-4 border-t border-edge" />
        <div className="px-4 py-3 space-y-3" data-testid="post-pin-flow">
          <div className="text-sm text-content-secondary">
            <Check size={14} className="inline text-green-500 mr-1" />
            Finding created
            {pinnedFinding.text && (
              <span className="block text-content mt-1 truncate">
                &ldquo;{pinnedFinding.text}&rdquo;
              </span>
            )}
          </div>

          {/* People Picker */}
          <div>
            <label className="text-xs text-content-secondary mb-1 block">Assign to:</label>
            <PeoplePicker
              selected={assignee}
              onSelect={setAssignee}
              onClear={() => setAssignee(null)}
            />
          </div>

          {/* Error message */}
          {shareError && (
            <div className="flex items-center gap-2 text-red-400 text-sm" data-testid="share-error">
              <span>Couldn&apos;t share</span>
              <button
                onClick={() => {
                  setShareError(false);
                  handleAssignAndShare();
                }}
                className="text-blue-400 underline text-xs"
                data-testid="share-retry"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAssignAndShare}
              disabled={isSharing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors touch-feedback"
              style={{ minHeight: 44 }}
              data-testid="share-to-channel"
            >
              {isSharing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Share to Channel
            </button>
            <button
              onClick={handleSheetClose}
              className="px-4 py-2.5 text-sm font-medium text-content-secondary bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-xl transition-colors touch-feedback"
              style={{ minHeight: 44 }}
              data-testid="post-pin-done"
            >
              Done
            </button>
          </div>
        </div>
      </>
    );
  }, [
    sheetPhase,
    pinnedFinding,
    assignee,
    isSharing,
    shareSuccess,
    shareError,
    handleAssignAndShare,
    handleSheetClose,
  ]);

  // Current highlight for the open sheet
  const currentSheetHighlight = categorySheet
    ? sheetChartType === 'boxplot'
      ? boxplotHighlights[categorySheet.categoryKey]
      : paretoHighlights[categorySheet.categoryKey]
    : undefined;

  return (
    <div
      className="flex flex-col h-full bg-surface"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pill Navigation with Chevrons */}
      <div className="flex items-center justify-between px-2 py-2 bg-surface-secondary/50 border-b border-edge">
        <button
          onClick={() => goToView('prev')}
          aria-label="Previous chart"
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-content"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-feedback ${
                activeView === v.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-tertiary/50 text-content-secondary hover:text-content'
              }`}
              style={{ minHeight: 36 }}
            >
              {v.icon}
              <span className="hidden xs:inline">{v.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => goToView('next')}
          aria-label="Next chart"
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-content"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filter Breadcrumb (horizontal scroll) */}
      {filterChipData.length > 0 && (
        <div className="overflow-x-auto">
          <FilterBreadcrumb
            filterChipData={filterChipData}
            columnAliases={columnAliases}
            onUpdateFilterValues={onUpdateFilterValues}
            onRemoveFilter={onRemoveFilter}
            onClearAll={onClearAllFilters}
            cumulativeVariationPct={cumulativeVariationPct}
            onPinFinding={onPinFinding ? () => onPinFinding() : undefined}
          />
        </div>
      )}

      {/* Factor Selector (for boxplot/pareto views) */}
      {(activeView === 'boxplot' || activeView === 'pareto') && factors.length > 0 && (
        <div className="px-3 py-2 bg-surface/50 border-b border-edge/50 flex justify-center">
          <FactorSelector
            factors={factors}
            selected={activeView === 'boxplot' ? boxplotFactor : paretoFactor}
            onChange={f =>
              activeView === 'boxplot' ? onSetBoxplotFactor(f) : onSetParetoFactor(f)
            }
            hasActiveFilter={
              activeView === 'boxplot'
                ? !!filters[boxplotFactor]?.length
                : !!filters[paretoFactor]?.length
            }
            columnAliases={columnAliases}
            size="md"
          />
        </div>
      )}

      {/* Chart Content Area */}
      <div className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 bg-surface-secondary/50 rounded-xl border border-edge overflow-hidden">
          <ErrorBoundary componentName={VIEWS.find(v => v.key === activeView)?.label || ''}>
            {activeView === 'ichart' && <IChart />}
            {activeView === 'boxplot' && boxplotFactor && (
              <Boxplot
                factor={boxplotFactor}
                onDrillDown={handleBoxplotDrillDown}
                variationPct={factorVariations.get(boxplotFactor)}
                categoryContributions={categoryContributions?.get(boxplotFactor)}
                highlightedCategories={boxplotHighlights}
              />
            )}
            {activeView === 'pareto' && paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                onDrillDown={handleParetoDrillDown}
                showComparison={showParetoComparison}
                onToggleComparison={onToggleParetoComparison}
                aggregation={paretoAggregation}
                onToggleAggregation={onToggleParetoAggregation}
                highlightedCategories={paretoHighlights}
              />
            )}
            {activeView === 'stats' && (
              <StatsPanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
                onSaveSpecs={onSaveSpecs}
                showCpk={showCpk}
              />
            )}
          </ErrorBoundary>
        </div>

        {/* ANOVA results below boxplot */}
        {activeView === 'boxplot' && anovaResult && (
          <div className="flex-none mt-2">
            <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />
          </div>
        )}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 py-3 bg-surface/50 safe-area-bottom">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`w-2 h-2 rounded-full transition-colors ${
              activeView === v.key ? 'bg-blue-500' : 'bg-surface-elevated'
            }`}
            aria-label={`Go to ${v.label}`}
          />
        ))}
      </div>

      {/* Mobile Category Action Sheet */}
      <MobileCategorySheet
        data={categorySheet}
        factor={sheetFactor}
        currentHighlight={currentSheetHighlight}
        onDrillDown={handleSheetDrillDown}
        onSetHighlight={handleSheetHighlight}
        onPinFinding={onPinFinding ? handleSheetPinFinding : undefined}
        onClose={handleSheetClose}
        renderExtra={canMentionInChannel ? renderPostPinFlow : undefined}
      />
    </div>
  );
};

export default MobileChartCarousel;
