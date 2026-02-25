import React, { useState, useEffect, useCallback } from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import StatsPanel from '../StatsPanel';
import ErrorBoundary from '../ErrorBoundary';
import { useData } from '../../context/DataContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type FocusedChart = 'ichart' | 'boxplot' | 'pareto' | 'stats';

const chartOrder: FocusedChart[] = ['ichart', 'boxplot', 'pareto', 'stats'];

interface PresentationViewProps {
  onExit: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ onExit }) => {
  const { outcome, factors, stats, specs, filteredData } = useData();
  const [focused, setFocused] = useState<FocusedChart | null>(null);
  const defaultFactor = factors[0] || '';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (focused) {
          setFocused(null);
        } else {
          onExit();
        }
        return;
      }

      if (focused) {
        const idx = chartOrder.indexOf(focused);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setFocused(chartOrder[(idx + 1) % chartOrder.length]);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setFocused(chartOrder[(idx - 1 + chartOrder.length) % chartOrder.length]);
        }
      }
    },
    [focused, onExit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!outcome) return null;

  // Focused mode: single chart fills screen
  if (focused) {
    const idx = chartOrder.indexOf(focused);
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
        <div className="flex-1 relative">
          <ErrorBoundary componentName={focused}>
            {focused === 'ichart' && <IChart />}
            {focused === 'boxplot' && defaultFactor && <Boxplot factor={defaultFactor} />}
            {focused === 'pareto' && defaultFactor && <ParetoChart factor={defaultFactor} />}
            {focused === 'stats' && (
              <StatsPanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
              />
            )}
          </ErrorBoundary>

          {/* Navigation arrows */}
          <button
            onClick={() =>
              setFocused(chartOrder[(idx - 1 + chartOrder.length) % chartOrder.length])
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            aria-label="Previous chart"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => setFocused(chartOrder[(idx + 1) % chartOrder.length])}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            aria-label="Next chart"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Hint bar */}
        <div className="px-4 py-2 text-center text-xs text-slate-600">
          Press Escape to return to overview &middot; Arrow keys to navigate
        </div>
      </div>
    );
  }

  // Overview mode: grid of all charts
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-4 gap-3">
      {/* Top row: I-Chart (45% height) */}
      <div
        className="flex-[45] min-h-0 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
        onClick={() => setFocused('ichart')}
        role="button"
        aria-label="Focus I-Chart"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter') setFocused('ichart');
        }}
      >
        <ErrorBoundary componentName="I-Chart">
          <IChart />
        </ErrorBoundary>
      </div>

      {/* Bottom row: Boxplot + Pareto + Stats (55% height) */}
      <div className="flex-[55] min-h-0 flex gap-3">
        <div
          className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => setFocused('boxplot')}
          role="button"
          aria-label="Focus Boxplot"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') setFocused('boxplot');
          }}
        >
          <ErrorBoundary componentName="Boxplot">
            {defaultFactor && <Boxplot factor={defaultFactor} />}
          </ErrorBoundary>
        </div>

        <div
          className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => setFocused('pareto')}
          role="button"
          aria-label="Focus Pareto"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') setFocused('pareto');
          }}
        >
          <ErrorBoundary componentName="Pareto">
            {defaultFactor && <ParetoChart factor={defaultFactor} />}
          </ErrorBoundary>
        </div>

        <div
          className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => setFocused('stats')}
          role="button"
          aria-label="Focus Stats"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') setFocused('stats');
          }}
        >
          <ErrorBoundary componentName="Stats">
            <StatsPanel stats={stats} specs={specs} filteredData={filteredData} outcome={outcome} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Hint bar */}
      <div className="text-center text-xs text-slate-600 py-1">
        Click a chart to focus &middot; Press Escape to exit presentation
      </div>
    </div>
  );
};

export default PresentationView;
