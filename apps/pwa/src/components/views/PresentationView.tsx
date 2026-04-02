/**
 * PWA PresentationView - Thin wrapper connecting DataContext to PresentationViewBase
 */
import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import ProcessIntelligencePanel from '../ProcessIntelligencePanel';
import { PresentationViewBase } from '@variscout/ui';
import type { StatsResult, SpecLimits, DataRow } from '@variscout/core';

export interface PresentationViewProps {
  outcome: string;
  boxplotFactor: string;
  paretoFactor: string;
  factors: string[];
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData: DataRow[];
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
  onSpecClick: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  outcome,
  boxplotFactor,
  paretoFactor,
  factors,
  stats,
  specs,
  filteredData,
  showParetoComparison,
  onToggleParetoComparison,
  paretoAggregation = 'count',
  onToggleParetoAggregation,
  chartTitles,
  onChartTitleChange,
  onSpecClick,
}) => (
  <PresentationViewBase
    outcome={outcome}
    boxplotFactor={boxplotFactor}
    paretoFactor={paretoFactor}
    chartTitles={chartTitles}
    onChartTitleChange={onChartTitleChange}
    renderIChart={() => <IChart onSpecClick={onSpecClick} />}
    renderBoxplot={() => (boxplotFactor ? <Boxplot factor={boxplotFactor} /> : null)}
    renderPareto={() =>
      paretoFactor ? (
        <ParetoChart
          factor={paretoFactor}
          showComparison={showParetoComparison}
          onToggleComparison={onToggleParetoComparison}
          availableFactors={factors}
          aggregation={paretoAggregation}
          onToggleAggregation={onToggleParetoAggregation}
        />
      ) : null
    }
    renderStats={() => (
      <ProcessIntelligencePanel
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        outcome={outcome}
      />
    )}
  />
);

export default PresentationView;
