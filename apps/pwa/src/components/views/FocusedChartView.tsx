import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import { ErrorBoundary, FactorSelector, AnovaResults } from '@variscout/ui';
import { Activity, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';
import type { AnovaResult } from '@variscout/core';
import { BoxplotStatsTable, type BoxplotGroupData } from '@variscout/charts';

export type FocusableChart = 'ichart' | 'boxplot' | 'pareto';

export interface FocusedChartViewProps {
  focusedChart: FocusableChart;
  outcome: string;
  availableOutcomes: string[];
  boxplotFactor: string;
  paretoFactor: string;
  factors: string[];
  filters: Record<string, (string | number)[]>;
  factorVariations: Map<string, number>;
  showParetoComparison: boolean;
  anovaResult: AnovaResult | null;
  boxplotData?: BoxplotGroupData[];
  boxplotCategoryContributions?: Map<string | number, number>;
  onSetOutcome: (outcome: string) => void;
  onSetBoxplotFactor: (factor: string) => void;
  onSetParetoFactor: (factor: string) => void;
  onDrillDown: (factor: string, value: string) => void;
  onToggleParetoComparison: () => void;
  onHideParetoPanel: () => void;
  onSelectParetoFactor: () => void;
  onOpenColumnMapping?: () => void;
  onPointClick?: (index: number) => void;
  onSpecClick: () => void;
  onNextChart: () => void;
  onPrevChart: () => void;
  onExitFocus: () => void;
  paretoAggregation?: 'count' | 'value';
  onToggleParetoAggregation?: () => void;
}

/**
 * Focused chart view - maximized single chart with navigation
 * Shows one chart fullscreen with left/right navigation arrows
 */
const FocusedChartView: React.FC<FocusedChartViewProps> = ({
  focusedChart,
  outcome,
  availableOutcomes,
  boxplotFactor,
  paretoFactor,
  factors,
  filters,
  factorVariations,
  showParetoComparison,
  anovaResult,
  boxplotData,
  boxplotCategoryContributions,
  onSetOutcome,
  onSetBoxplotFactor,
  onSetParetoFactor,
  onDrillDown,
  onToggleParetoComparison,
  onHideParetoPanel,
  onSelectParetoFactor,
  onOpenColumnMapping,
  onPointClick,
  onSpecClick,
  onNextChart,
  onPrevChart,
  onExitFocus,
  paretoAggregation = 'count',
  onToggleParetoAggregation,
}) => {
  return (
    <div className="flex-1 flex p-4 h-full relative group/focus">
      {/* Navigation Buttons (Overlay) */}
      <button
        onClick={onPrevChart}
        aria-label="Previous chart"
        className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-surface-secondary/80 hover:bg-surface-tertiary text-content-secondary hover:text-white rounded-full shadow-lg border border-edge opacity-0 group-hover/focus:opacity-100 transition-opacity"
        title="Previous Chart (Left Arrow)"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={onNextChart}
        aria-label="Next chart"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-surface-secondary/80 hover:bg-surface-tertiary text-content-secondary hover:text-white rounded-full shadow-lg border border-edge opacity-0 group-hover/focus:opacity-100 transition-opacity"
        title="Next Chart (Right Arrow)"
      >
        <ChevronRight size={24} />
      </button>

      {focusedChart === 'ichart' && (
        <div
          id="ichart-focus"
          className="flex-1 bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full"
        >
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                <Activity className="text-blue-400" size={24} />
                I-Chart:
              </h2>
              <select
                value={outcome}
                onChange={e => onSetOutcome(e.target.value)}
                className="bg-surface border border-edge text-xl font-bold text-white rounded px-3 py-1.5 outline-none focus:border-blue-500"
              >
                {availableOutcomes.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <button
                onClick={onExitFocus}
                className="p-2 rounded text-content-secondary hover:text-white hover:bg-surface-tertiary transition-colors ml-4 bg-surface-tertiary/50"
                title="Exit Focus Mode"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ErrorBoundary componentName="I-Chart">
              <IChart onPointClick={onPointClick} onSpecClick={onSpecClick} />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {focusedChart === 'boxplot' && (
        <div
          id="boxplot-focus"
          className="flex-1 bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full overflow-hidden"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-content uppercase tracking-wider">Boxplot</h3>
            <div className="flex items-center gap-4">
              <FactorSelector
                factors={factors}
                selected={boxplotFactor}
                onChange={onSetBoxplotFactor}
                hasActiveFilter={!!filters?.[boxplotFactor]?.length}
                size="md"
              />
              <button
                onClick={onExitFocus}
                className="p-2 rounded text-content-secondary hover:text-white hover:bg-surface-tertiary transition-colors bg-surface-tertiary/50"
                title="Exit Focus Mode"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Boxplot">
              {boxplotFactor && (
                <Boxplot
                  factor={boxplotFactor}
                  onDrillDown={onDrillDown}
                  variationPct={factorVariations.get(boxplotFactor)}
                  categoryContributions={boxplotCategoryContributions}
                />
              )}
            </ErrorBoundary>
          </div>
          {/* Stats Table (fullscreen only) */}
          {boxplotData && boxplotData.length > 0 && (
            <div className="mt-2 max-h-[200px] overflow-y-auto">
              <BoxplotStatsTable
                data={boxplotData}
                categoryContributions={boxplotCategoryContributions}
              />
            </div>
          )}
          {anovaResult && <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />}
        </div>
      )}

      {focusedChart === 'pareto' && (
        <div
          id="pareto-focus"
          className="flex-1 bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-content uppercase tracking-wider">Pareto</h3>
            <div className="flex items-center gap-4">
              <FactorSelector
                factors={factors}
                selected={paretoFactor}
                onChange={onSetParetoFactor}
                hasActiveFilter={!!filters?.[paretoFactor]?.length}
                size="md"
              />
              <button
                onClick={onExitFocus}
                className="p-2 rounded text-content-secondary hover:text-white hover:bg-surface-tertiary transition-colors bg-surface-tertiary/50"
                title="Exit Focus Mode"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Pareto Chart">
              {paretoFactor && (
                <ParetoChart
                  factor={paretoFactor}
                  onDrillDown={onDrillDown}
                  showComparison={showParetoComparison}
                  onToggleComparison={onToggleParetoComparison}
                  onHide={() => {
                    onHideParetoPanel();
                    onExitFocus();
                  }}
                  onSelectFactor={onSelectParetoFactor}
                  onUploadPareto={onOpenColumnMapping}
                  availableFactors={factors}
                  aggregation={paretoAggregation}
                  onToggleAggregation={onToggleParetoAggregation}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusedChartView;
