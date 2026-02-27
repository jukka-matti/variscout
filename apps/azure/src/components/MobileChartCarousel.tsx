/**
 * MobileChartCarousel — Phone-optimized single-chart-at-a-time view
 *
 * Shows one chart per screen with swipe navigation (Touch API),
 * pill navigation buttons, and dot indicators. Designed for
 * Teams mobile / phone viewports (<640px).
 *
 * Azure-specific: renders Azure chart wrappers that use useData() context.
 * Does not share code with PWA MobileDashboard (different context model).
 */
import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Activity, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import FilterBreadcrumb from './FilterBreadcrumb';
import ErrorBoundary from './ErrorBoundary';
import { AnovaResults, FactorSelector } from '@variscout/ui';
import type { StatsResult, SpecLimits, DataRow, AnovaResult } from '@variscout/core';
import type { FilterChipData } from '@variscout/hooks';

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
  onPinFinding?: () => void;
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
}) => {
  const [activeView, setActiveView] = useState<ChartView>('ichart');

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
            onPinFinding={onPinFinding}
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
                onDrillDown={onDrillDown}
                variationPct={factorVariations.get(boxplotFactor)}
                categoryContributions={categoryContributions?.get(boxplotFactor)}
              />
            )}
            {activeView === 'pareto' && paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                onDrillDown={onDrillDown}
                showComparison={showParetoComparison}
                onToggleComparison={onToggleParetoComparison}
                aggregation={paretoAggregation}
                onToggleAggregation={onToggleParetoAggregation}
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
    </div>
  );
};

export default MobileChartCarousel;
