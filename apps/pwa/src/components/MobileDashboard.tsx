import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  LineChart,
  Target,
} from 'lucide-react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import MobileStatsPanel from './MobileStatsPanel';
import AnovaResults from './AnovaResults';
import RegressionPanel from './RegressionPanel';
import GageRRPanel from './GageRRPanel';
import ErrorBoundary from './ErrorBoundary';
import FactorSelector from './FactorSelector';
import DrillBreadcrumb from './DrillBreadcrumb';
import type { StatsResult, AnovaResult, BreadcrumbItem } from '@variscout/core';

type ChartView = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';

interface MobileDashboardProps {
  outcome: string | null;
  factors: string[];
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  boxplotFactor: string;
  paretoFactor: string;
  filteredData: any[];
  anovaResult: AnovaResult | null;
  filters: Record<string, string[]>;
  columnAliases?: Record<string, string>;
  onSetBoxplotFactor: (f: string) => void;
  onSetParetoFactor: (f: string) => void;
  onPointClick?: (index: number) => void;
  onDrillDown?: (factor: string, value: string) => void;
  onRemoveFilter?: (factor: string) => void;
  onClearAllFilters?: () => void;
  // Breadcrumb props for unified filter display
  breadcrumbItems?: BreadcrumbItem[];
  cumulativeVariationPct?: number | null;
  onBreadcrumbNavigate?: (id: string) => void;
  // Pareto empty state actions
  onHideParetoPanel?: () => void;
  onUploadPareto?: () => void;
  // Variation tracking for drill hints
  factorVariations?: Map<string, number>;
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
  breadcrumbItems = [],
  cumulativeVariationPct,
  onBreadcrumbNavigate,
  onHideParetoPanel,
  onUploadPareto,
  factorVariations,
}) => {
  const [activeView, setActiveView] = useState<ChartView>('ichart');

  const views: { key: ChartView; label: string; icon: React.ReactNode }[] = [
    { key: 'ichart', label: 'I-Chart', icon: <Activity size={18} /> },
    { key: 'boxplot', label: 'Boxplot', icon: <BarChart3 size={18} /> },
    { key: 'pareto', label: 'Pareto', icon: <PieChart size={18} /> },
    { key: 'stats', label: 'Stats', icon: <TrendingUp size={18} /> },
    { key: 'regression', label: 'Regr', icon: <LineChart size={18} /> },
    { key: 'gagerr', label: 'GR&R', icon: <Target size={18} /> },
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
          className="p-2 touch-feedback rounded-lg text-content-secondary hover:text-white"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filter Breadcrumb (compact mode for mobile) */}
      {breadcrumbItems.length > 0 && onBreadcrumbNavigate && (
        <DrillBreadcrumb
          items={breadcrumbItems}
          onNavigate={onBreadcrumbNavigate}
          onClearAll={onClearAllFilters}
          onRemove={
            onRemoveFilter
              ? (id: string) => {
                  // Find the factor name from the breadcrumb item id
                  const item = breadcrumbItems.find(b => b.id === id);
                  if (item && item.id !== 'root') {
                    // Extract factor from label (format: "Factor: Value")
                    const colonIndex = item.label.indexOf(':');
                    if (colonIndex > 0) {
                      const factor = item.label.substring(0, colonIndex).trim();
                      onRemoveFilter(factor);
                    }
                  }
                }
              : undefined
          }
          cumulativeVariationPct={cumulativeVariationPct}
          compact={true}
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
                onDrillDown={onDrillDown}
                variationPct={factorVariations?.get(boxplotFactor)}
              />
            )}
            {activeView === 'pareto' && paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                onDrillDown={onDrillDown}
                onHide={onHideParetoPanel}
                onUploadPareto={onUploadPareto}
                availableFactors={factors}
              />
            )}
            {activeView === 'stats' && (
              <MobileStatsPanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
              />
            )}
            {activeView === 'regression' && <RegressionPanel />}
            {activeView === 'gagerr' && <GageRRPanel />}
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
    </div>
  );
};

export default MobileDashboard;
