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
}

const PresentationView: React.FC<PresentationViewProps> = ({ onExit }) => {
  const {
    outcome,
    factors,
    stats,
    specs,
    filteredData,
    chartTitles: rawChartTitles,
    setChartTitles,
  } = useData();
  const chartTitles = rawChartTitles || {};
  const defaultFactor = factors[0] || '';

  if (!outcome) return null;

  return (
    <PresentationViewBase
      outcome={outcome}
      boxplotFactor={defaultFactor}
      paretoFactor={defaultFactor}
      chartTitles={chartTitles}
      onChartTitleChange={(chart, title) => setChartTitles({ ...chartTitles, [chart]: title })}
      onExit={onExit}
      renderIChart={() => <IChart />}
      renderBoxplot={() => (defaultFactor ? <Boxplot factor={defaultFactor} /> : null)}
      renderPareto={() => (defaultFactor ? <ParetoChart factor={defaultFactor} /> : null)}
      renderStats={() => (
        <StatsPanel stats={stats} specs={specs} filteredData={filteredData} outcome={outcome} />
      )}
    />
  );
};

export default PresentationView;
