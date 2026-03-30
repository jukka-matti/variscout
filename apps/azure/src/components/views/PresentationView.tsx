/**
 * Azure PresentationView - Thin wrapper connecting DataContext to PresentationViewBase
 * Static grid only — FocusedChartView serves the single-chart focus need.
 */
import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import StatsPanel from '../StatsPanel';
import { PresentationViewBase } from '@variscout/ui';
import { useData } from '../../context/DataContext';

interface PresentationViewProps {
  onExit: () => void;
  boxplotFactor: string;
  paretoFactor: string;
  factorVariations: Map<string, number>;
  categoryContributions?: Map<string, Map<string | number, number>>;
  showParetoComparison: boolean;
  onToggleParetoComparison: () => void;
  paretoAggregation: 'count' | 'value';
  onToggleParetoAggregation: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  onExit,
  boxplotFactor,
  paretoFactor,
  factorVariations,
  categoryContributions,
  showParetoComparison,
  onToggleParetoComparison,
  paretoAggregation,
  onToggleParetoAggregation,
}) => {
  const {
    outcome,
    factors,
    stats,
    specs,
    setSpecs,
    filteredData,
    chartTitles: rawChartTitles,
    setChartTitles,
  } = useData();
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
      renderBoxplot={() =>
        boxplotFactor ? (
          <Boxplot
            factor={boxplotFactor}
            variationPct={factorVariations.get(boxplotFactor)}
            categoryContributions={categoryContributions?.get(boxplotFactor)}
          />
        ) : null
      }
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
        <StatsPanel
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
