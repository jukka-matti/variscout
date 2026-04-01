import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import StatsPanel from '../StatsPanel';
import { ErrorBoundary, FactorSelector } from '@variscout/ui';
import { EditableChartTitle } from '@variscout/ui';
import type { StatsPanelTab } from '@variscout/ui';
import { Activity } from 'lucide-react';
import type { StatsResult, SpecLimits, DataRow } from '@variscout/core';

/** Maps legacy embed stats tab values to current StatsPanelTab names */
function toStatsPanelTab(embedTab: EmbedStatsTab | null | undefined): StatsPanelTab | undefined {
  if (!embedTab) return undefined;
  // 'summary' was the old name for the main stats tab (now 'stats')
  if (embedTab === 'summary') return 'stats';
  // 'data' and 'whatif' are now overflow views — default to stats tab
  return 'stats';
}

export type EmbedFocusChart = 'ichart' | 'boxplot' | 'pareto' | 'stats';
/** Legacy embed stats tab values — 'summary' maps to 'stats', 'data'/'whatif' open overflow */
export type EmbedStatsTab = 'summary' | 'data' | 'whatif';

export interface EmbedFocusViewProps {
  focusChart: EmbedFocusChart;
  outcome: string;
  boxplotFactor: string;
  paretoFactor: string;
  factors: string[];
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData: DataRow[];
  filters: Record<string, (string | number)[]>;
  showParetoComparison: boolean;
  onToggleParetoComparison: () => void;
  paretoAggregation?: 'count' | 'value';
  onToggleParetoAggregation?: () => void;
  chartTitles: {
    ichart?: string;
    boxplot?: string;
    pareto?: string;
  };
  onChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;
  onBoxplotFactorChange: (factor: string) => void;
  onParetoFactorChange: (factor: string) => void;
  onDrillDown: (factor: string, value: string) => void;
  onPointClick?: (index: number) => void;
  onSpecClick: () => void;
  onManageFactors?: () => void;
  embedStatsTab?: EmbedStatsTab | null;
}

/**
 * Embed focus mode - renders only a single chart for iframe embeds
 * Used when embedding individual charts in external dashboards
 */
const EmbedFocusView: React.FC<EmbedFocusViewProps> = ({
  focusChart,
  outcome,
  boxplotFactor,
  paretoFactor,
  factors,
  stats,
  specs,
  filteredData,
  filters,
  showParetoComparison,
  onToggleParetoComparison,
  paretoAggregation = 'count',
  onToggleParetoAggregation,
  chartTitles,
  onChartTitleChange,
  onBoxplotFactorChange,
  onParetoFactorChange,
  onDrillDown,
  onPointClick,
  onSpecClick,
  onManageFactors,
  embedStatsTab,
}) => {
  return (
    <div className="h-full w-full bg-surface p-4 flex flex-col">
      {focusChart === 'ichart' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="text-blue-400" size={20} />
            <span className="text-lg font-bold text-white">
              <EditableChartTitle
                defaultTitle={`I-Chart: ${outcome}`}
                value={chartTitles.ichart || ''}
                onChange={title => onChartTitleChange('ichart', title)}
              />
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="I-Chart">
              <IChart onPointClick={onPointClick} onSpecClick={onSpecClick} />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {focusChart === 'boxplot' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold text-white">
              <EditableChartTitle
                defaultTitle={`Boxplot: ${boxplotFactor}`}
                value={chartTitles.boxplot || ''}
                onChange={title => onChartTitleChange('boxplot', title)}
              />
            </span>
            <FactorSelector
              factors={factors}
              selected={boxplotFactor}
              onChange={onBoxplotFactorChange}
              hasActiveFilter={!!filters?.[boxplotFactor]?.length}
            />
          </div>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Boxplot">
              {boxplotFactor && <Boxplot factor={boxplotFactor} onDrillDown={onDrillDown} />}
            </ErrorBoundary>
          </div>
        </div>
      )}

      {focusChart === 'pareto' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold text-white">
              <EditableChartTitle
                defaultTitle={`Pareto: ${paretoFactor}`}
                value={chartTitles.pareto || ''}
                onChange={title => onChartTitleChange('pareto', title)}
              />
            </span>
            <FactorSelector
              factors={factors}
              selected={paretoFactor}
              onChange={onParetoFactorChange}
              hasActiveFilter={!!filters?.[paretoFactor]?.length}
            />
          </div>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="Pareto Chart">
              {paretoFactor && (
                <ParetoChart
                  factor={paretoFactor}
                  onDrillDown={onDrillDown}
                  showComparison={showParetoComparison}
                  onToggleComparison={onToggleParetoComparison}
                  onUploadPareto={onManageFactors}
                  availableFactors={factors}
                  aggregation={paretoAggregation}
                  onToggleAggregation={onToggleParetoAggregation}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      )}

      {focusChart === 'stats' && (
        <div className="flex-1 min-h-0">
          <StatsPanel
            stats={stats}
            specs={specs}
            filteredData={filteredData}
            outcome={outcome}
            defaultTab={toStatsPanelTab(embedStatsTab)}
            className="w-full h-full lg:w-full border-none shadow-none rounded-none"
          />
        </div>
      )}
    </div>
  );
};

export default EmbedFocusView;
