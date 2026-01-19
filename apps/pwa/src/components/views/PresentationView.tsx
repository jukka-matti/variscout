import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import StatsPanel from '../StatsPanel';
import ErrorBoundary from '../ErrorBoundary';
import { EditableChartTitle } from '@variscout/charts';
import { Activity } from 'lucide-react';
import type { StatsResult, SpecLimits } from '@variscout/core';

export interface PresentationViewProps {
  outcome: string;
  boxplotFactor: string;
  paretoFactor: string;
  factors: string[];
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData: any[];
  factorVariations: Map<string, number>;
  showParetoComparison: boolean;
  onToggleParetoComparison: () => void;
  chartTitles: {
    ichart?: string;
    boxplot?: string;
    pareto?: string;
  };
  onChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;
  onSpecClick: () => void;
}

/**
 * Fullscreen presentation mode showing all charts
 * Used for projecting dashboard during meetings/reviews
 */
const PresentationView: React.FC<PresentationViewProps> = ({
  outcome,
  boxplotFactor,
  paretoFactor,
  factors,
  stats,
  specs,
  filteredData,
  factorVariations,
  showParetoComparison,
  onToggleParetoComparison,
  chartTitles,
  onChartTitleChange,
  onSpecClick,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col p-4 gap-4">
      {/* I-Chart - top section */}
      <div className="flex-[45] min-h-0 bg-surface-secondary border border-edge rounded-2xl p-4 flex flex-col">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Activity className="text-blue-400" size={20} />
            <EditableChartTitle
              defaultTitle={`I-Chart: ${outcome}`}
              value={chartTitles.ichart || ''}
              onChange={title => onChartTitleChange('ichart', title)}
            />
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          <ErrorBoundary componentName="I-Chart">
            <IChart onSpecClick={onSpecClick} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Bottom section - Boxplot, Pareto, Stats */}
      <div className="flex-[55] min-h-0 flex gap-4">
        <div className="flex-1 bg-surface-secondary border border-edge rounded-2xl p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-2">
            <EditableChartTitle
              defaultTitle={`Boxplot: ${boxplotFactor}`}
              value={chartTitles.boxplot || ''}
              onChange={title => onChartTitleChange('boxplot', title)}
            />
          </h3>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Boxplot">
              {boxplotFactor && (
                <Boxplot
                  factor={boxplotFactor}
                  variationPct={factorVariations.get(boxplotFactor)}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
        <div className="flex-1 bg-surface-secondary border border-edge rounded-2xl p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-2">
            <EditableChartTitle
              defaultTitle={`Pareto: ${paretoFactor}`}
              value={chartTitles.pareto || ''}
              onChange={title => onChartTitleChange('pareto', title)}
            />
          </h3>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Pareto Chart">
              {paretoFactor && (
                <ParetoChart
                  factor={paretoFactor}
                  showComparison={showParetoComparison}
                  onToggleComparison={onToggleParetoComparison}
                  availableFactors={factors}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
        <div className="w-80 bg-surface-secondary border border-edge rounded-2xl p-4">
          <StatsPanel stats={stats} specs={specs} filteredData={filteredData} outcome={outcome} />
        </div>
      </div>

      {/* Exit hint */}
      <div className="absolute bottom-4 right-4 text-content-muted text-xs">
        Press Escape to exit
      </div>
    </div>
  );
};

export default PresentationView;
