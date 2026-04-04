/**
 * Azure PresentationView - Thin wrapper connecting DataContext to PresentationViewBase
 * Static grid only — FocusedChartView serves the single-chart focus need.
 */
import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import ProcessIntelligencePanel from '../ProcessIntelligencePanel';
import { PresentationViewBase } from '@variscout/ui';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData, useAnalysisStats } from '@variscout/hooks';

interface PresentationViewProps {
  onExit: () => void;
  boxplotFactor: string;
  paretoFactor: string;
  showParetoComparison: boolean;
  onToggleParetoComparison: () => void;
  paretoAggregation: 'count' | 'value';
  onToggleParetoAggregation: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  onExit,
  boxplotFactor,
  paretoFactor,
  showParetoComparison,
  onToggleParetoComparison,
  paretoAggregation,
  onToggleParetoAggregation,
}) => {
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const specs = useProjectStore(s => s.specs);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const rawChartTitles = useProjectStore(s => s.chartTitles);
  const setChartTitles = useProjectStore(s => s.setChartTitles);
  const { filteredData } = useFilteredData();
  const { stats } = useAnalysisStats();
  const chartTitles = rawChartTitles || {};

  if (!outcome) return null;

  return (
    <PresentationViewBase
      outcome={outcome}
      boxplotFactor={boxplotFactor}
      paretoFactor={paretoFactor}
      chartTitles={chartTitles}
      onChartTitleChange={(chart, title) => setChartTitles({ ...chartTitles, [chart]: title })}
      onExit={onExit}
      renderIChart={() => <IChart />}
      renderBoxplot={() => (boxplotFactor ? <Boxplot factor={boxplotFactor} /> : null)}
      renderPareto={() =>
        paretoFactor ? (
          <ParetoChart
            factor={paretoFactor}
            showComparison={showParetoComparison}
            onToggleComparison={onToggleParetoComparison}
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
          onSaveSpecs={setSpecs}
          factors={factors}
        />
      )}
    />
  );
};

export default PresentationView;
