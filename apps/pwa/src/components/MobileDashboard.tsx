import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import MobileStatsPanel from './MobileStatsPanel';
import ErrorBoundary from './ErrorBoundary';
import type { StatsResult } from '@variscout/core';

type ChartView = 'ichart' | 'boxplot' | 'pareto' | 'stats';

interface MobileDashboardProps {
  outcome: string | null;
  factors: string[];
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  boxplotFactor: string;
  paretoFactor: string;
  filteredData: any[];
  onSetBoxplotFactor: (f: string) => void;
  onSetParetoFactor: (f: string) => void;
  onPointClick?: (index: number) => void;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  outcome,
  factors,
  stats,
  specs,
  boxplotFactor,
  paretoFactor,
  filteredData,
  onSetBoxplotFactor,
  onSetParetoFactor,
  onPointClick,
}) => {
  const [activeView, setActiveView] = useState<ChartView>('ichart');

  const views: { key: ChartView; label: string; icon: React.ReactNode }[] = [
    { key: 'ichart', label: 'I-Chart', icon: <Activity size={18} /> },
    { key: 'boxplot', label: 'Boxplot', icon: <BarChart3 size={18} /> },
    { key: 'pareto', label: 'Pareto', icon: <PieChart size={18} /> },
    { key: 'stats', label: 'Stats', icon: <TrendingUp size={18} /> },
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
      className="flex flex-col h-full bg-slate-900"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Chart Header with Navigation */}
      <div className="flex items-center justify-between px-2 py-2 bg-slate-800/50 border-b border-slate-700">
        <button
          onClick={() => goToView('prev')}
          className="p-2 touch-feedback rounded-lg text-slate-400 hover:text-white"
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
                                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
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
          className="p-2 touch-feedback rounded-lg text-slate-400 hover:text-white"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Factor Selector (for boxplot/pareto) */}
      {(activeView === 'boxplot' || activeView === 'pareto') && factors.length > 0 && (
        <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-700/50">
          <select
            value={activeView === 'boxplot' ? boxplotFactor : paretoFactor}
            onChange={e =>
              activeView === 'boxplot'
                ? onSetBoxplotFactor(e.target.value)
                : onSetParetoFactor(e.target.value)
            }
            className="w-full bg-slate-800 border border-slate-600 text-sm text-white rounded-lg px-3 py-2 touch-feedback"
            style={{ minHeight: 44 }}
          >
            {factors.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Chart Content Area */}
      <div className="flex-1 min-h-0 p-2 overflow-hidden">
        <div className="h-full bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          <ErrorBoundary componentName={views.find(v => v.key === activeView)?.label || ''}>
            {activeView === 'ichart' && <IChart onPointClick={onPointClick} />}
            {activeView === 'boxplot' && boxplotFactor && <Boxplot factor={boxplotFactor} />}
            {activeView === 'pareto' && paretoFactor && <ParetoChart factor={paretoFactor} />}
            {activeView === 'stats' && (
              <MobileStatsPanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Swipe Indicator Dots */}
      <div className="flex justify-center gap-2 py-3 bg-slate-900/50">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`w-2 h-2 rounded-full transition-colors
                            ${activeView === v.key ? 'bg-blue-500' : 'bg-slate-600'}`}
            aria-label={`Go to ${v.label}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileDashboard;
