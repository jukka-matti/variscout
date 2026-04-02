import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Activity, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import ProcessIntelligencePanel from './ProcessIntelligencePanel';
import {
  AnovaResults,
  ErrorBoundary,
  FactorSelector,
  FilterBreadcrumb,
  MobileCategorySheet,
} from '@variscout/ui';
import type { StatsResult, AnovaResult, DataRow, Finding } from '@variscout/core';
import type { FilterChipData } from '@variscout/hooks';

type ChartView = 'ichart' | 'boxplot' | 'pareto' | 'stats';

interface MobileDashboardProps {
  outcome: string | null;
  factors: string[];
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  boxplotFactor: string;
  paretoFactor: string;
  filteredData: DataRow[];
  anovaResult: AnovaResult | null;
  filters: Record<string, (string | number)[]>;
  columnAliases?: Record<string, string>;
  onSetBoxplotFactor: (f: string) => void;
  onSetParetoFactor: (f: string) => void;
  onPointClick?: (index: number) => void;
  onDrillDown?: (factor: string, value: string) => void;
  onRemoveFilter?: (factor: string) => void;
  onClearAllFilters?: () => void;
  // Filter chip props for enhanced breadcrumb
  filterChipData?: FilterChipData[];
  cumulativeVariationPct?: number | null;
  onUpdateFilterValues?: (factor: string, newValues: (string | number)[]) => void;
  // Pareto empty state actions
  onHideParetoPanel?: () => void;
  onUploadPareto?: () => void;
  // Variation tracking for drill hints
  factorVariations?: Map<string, number>;
  // Pareto aggregation
  paretoAggregation?: 'count' | 'value';
  onToggleParetoAggregation?: () => void;
  // Findings integration
  onPinFinding?: (text: string, chartType?: string, category?: string) => void;
  findings?: Finding[];
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  outcome,
  factors,
  stats,
  specs,
  boxplotFactor,
  paretoFactor,
  filteredData,
  anovaResult,
  filters,
  columnAliases = {},
  onSetBoxplotFactor,
  onSetParetoFactor,
  onPointClick,
  onDrillDown,
  onRemoveFilter,
  onClearAllFilters,
  filterChipData = [],
  cumulativeVariationPct,
  onUpdateFilterValues,
  onHideParetoPanel,
  onUploadPareto,
  factorVariations,
  paretoAggregation = 'count',
  onToggleParetoAggregation,
  onPinFinding,
  findings,
  onEditFinding,
  onDeleteFinding,
}) => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ChartView>('ichart');

  // MobileCategorySheet state
  const [sheetData, setSheetData] = useState<{
    categoryKey: string;
    chartType: 'boxplot' | 'pareto';
    contributionPct?: number;
  } | null>(null);
  const [sheetFactor, setSheetFactor] = useState('');

  const handleBoxplotDrillIntercept = useCallback(
    (factor: string, value: string) => {
      const variationPct = factorVariations?.get(factor);
      setSheetFactor(factor);
      setSheetData({
        categoryKey: value,
        chartType: 'boxplot',
        contributionPct: variationPct ? variationPct * 100 : undefined,
      });
    },
    [factorVariations]
  );

  const handleParetoDrillIntercept = useCallback((factor: string, value: string) => {
    setSheetFactor(factor);
    setSheetData({
      categoryKey: value,
      chartType: 'pareto',
    });
  }, []);

  const handleSheetDrillDown = useCallback(() => {
    if (onDrillDown && sheetData) {
      onDrillDown(sheetFactor, sheetData.categoryKey);
    }
    setSheetData(null);
  }, [onDrillDown, sheetData, sheetFactor]);

  const handleSheetPinFinding = useCallback(
    (noteText: string) => {
      if (onPinFinding && sheetData) {
        onPinFinding(
          noteText || `${sheetData.categoryKey} (${sheetData.chartType})`,
          sheetData.chartType,
          sheetData.categoryKey
        );
      }
      setSheetData(null);
    },
    [onPinFinding, sheetData]
  );

  const views: { key: ChartView; label: string; icon: React.ReactNode }[] = [
    { key: 'ichart', label: t('chart.type.ichart'), icon: <Activity size={18} /> },
    { key: 'boxplot', label: t('chart.type.boxplot'), icon: <BarChart3 size={18} /> },
    { key: 'pareto', label: t('chart.type.pareto'), icon: <PieChart size={18} /> },
    { key: 'stats', label: t('view.stats'), icon: <TrendingUp size={18} /> },
  ];

  const currentIndex = views.findIndex(v => v.key === activeView);

  const goToView = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'next'
        ? (currentIndex + 1) % views.length
        : (currentIndex - 1 + views.length) % views.length;
    setActiveView(views[newIndex].key);
  };

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToView('next');
    }
    if (isRightSwipe) {
      goToView('prev');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-surface"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Chart Header with Navigation */}
      <div className="flex items-center justify-between px-2 py-2 bg-surface-secondary/50 border-b border-edge">
        <button
          onClick={() => goToView('prev')}
          aria-label="Previous chart"
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-white"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-feedback
                                ${
                                  activeView === v.key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface-tertiary/50 text-content-secondary hover:text-white'
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
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-white"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filter Breadcrumb (chip-based for mobile) */}
      {(filterChipData.length > 0 || cumulativeVariationPct !== undefined) &&
        onUpdateFilterValues &&
        onRemoveFilter && (
          <FilterBreadcrumb
            filterChipData={filterChipData}
            columnAliases={columnAliases}
            onUpdateFilterValues={onUpdateFilterValues}
            onRemoveFilter={onRemoveFilter}
            onClearAll={onClearAllFilters}
            cumulativeVariationPct={cumulativeVariationPct}
          />
        )}

      {/* Factor Selector (for boxplot/pareto) */}
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
          <ErrorBoundary componentName={views.find(v => v.key === activeView)?.label || ''}>
            {activeView === 'ichart' && <IChart onPointClick={onPointClick} />}
            {activeView === 'boxplot' && boxplotFactor && (
              <Boxplot
                factor={boxplotFactor}
                onDrillDown={handleBoxplotDrillIntercept}
                findings={findings?.filter(f => f.source?.chart === 'boxplot')}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
              />
            )}
            {activeView === 'pareto' && paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                onDrillDown={handleParetoDrillIntercept}
                onHide={onHideParetoPanel}
                onUploadPareto={onUploadPareto}
                availableFactors={factors}
                aggregation={paretoAggregation}
                onToggleAggregation={onToggleParetoAggregation}
                findings={findings?.filter(f => f.source?.chart === 'pareto')}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
              />
            )}
            {activeView === 'stats' && (
              <ProcessIntelligencePanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
                compact
              />
            )}
          </ErrorBoundary>
        </div>
        {activeView === 'boxplot' && anovaResult && (
          <div className="flex-none mt-2">
            <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />
          </div>
        )}
      </div>

      {/* Swipe Indicator Dots */}
      <div className="flex justify-center gap-2 py-3 bg-surface/50">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`w-2 h-2 rounded-full transition-colors
                            ${activeView === v.key ? 'bg-blue-500' : 'bg-surface-elevated'}`}
            aria-label={`Go to ${v.label}`}
          />
        ))}
      </div>

      {/* Mobile Category Sheet */}
      <MobileCategorySheet
        data={sheetData}
        factor={sheetFactor}
        onDrillDown={handleSheetDrillDown}
        onSetHighlight={() => {}} // PWA: highlights not persisted
        onPinFinding={handleSheetPinFinding}
        onClose={() => setSheetData(null)}
      />
    </div>
  );
};

export default MobileDashboard;
