/**
 * ParetoPanel - Pareto chart section for Dashboard
 *
 * Renders the Pareto chart with its header controls:
 * - Factor selector
 * - Comparison toggle
 * - Aggregation toggle
 * - Copy and maximize buttons
 */

import React from 'react';
import ParetoChart from '../charts/ParetoChart';
import ErrorBoundary from '../ErrorBoundary';
import FactorSelector from '../FactorSelector';
import { ChartCard } from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { useData } from '../../context/DataContext';

type ParetoAggregation = 'count' | 'value';

interface ParetoPanelProps {
  /** Currently selected factor for the Pareto */
  paretoFactor: string;
  /** Handler to change the Pareto factor */
  onSetParetoFactor: (factor: string) => void;
  /** Whether to show comparison ghost bars */
  showComparison: boolean;
  /** Toggle comparison mode */
  onToggleComparison: () => void;
  /** Current aggregation mode */
  aggregation: ParetoAggregation;
  /** Toggle aggregation mode */
  onToggleAggregation: () => void;
  /** Handler for drill-down on bar click */
  onDrillDown: (factor: string, value: string) => void;
  /** Handler to hide the Pareto panel */
  onHide: () => void;
  /** Handler to focus the factor selector */
  onSelectFactor: () => void;
  /** Handler to open column mapping for upload */
  onUploadPareto?: () => void;
  /** Copy chart to clipboard handler */
  onCopy: () => void;
  /** Maximize/focus the chart */
  onMaximize: () => void;
  /** Copy success feedback */
  copyFeedback: boolean;
  /** Highlight class for embed mode */
  highlightClass: string;
  /** Click handler for embed mode */
  onClick: () => void;
}

const ParetoPanel: React.FC<ParetoPanelProps> = ({
  paretoFactor,
  onSetParetoFactor,
  showComparison,
  onToggleComparison,
  aggregation,
  onToggleAggregation,
  onDrillDown,
  onHide,
  onSelectFactor,
  onUploadPareto,
  onCopy,
  onMaximize,
  copyFeedback,
  highlightClass,
  onClick,
}) => {
  const { factors, filters, chartTitles, setChartTitles } = useData();

  const title = (
    <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
      <EditableChartTitle
        defaultTitle={`Pareto: ${paretoFactor}`}
        value={chartTitles.pareto || ''}
        onChange={title => setChartTitles({ ...chartTitles, pareto: title })}
      />
    </h3>
  );

  const controls = (
    <FactorSelector
      factors={factors}
      selected={paretoFactor}
      onChange={onSetParetoFactor}
      hasActiveFilter={!!filters?.[paretoFactor]?.length}
    />
  );

  return (
    <ChartCard
      id="pareto-card"
      chartId="pareto"
      title={title}
      controls={controls}
      onCopy={onCopy}
      onMaximize={onMaximize}
      copyFeedback={copyFeedback}
      highlightClass={highlightClass}
      onClick={onClick}
      minHeight="280px"
      className="flex-1 min-w-[300px]"
    >
      <div id="pareto-container" className="flex-1 min-h-[180px]">
        <ErrorBoundary componentName="Pareto Chart">
          {paretoFactor && (
            <ParetoChart
              factor={paretoFactor}
              onDrillDown={onDrillDown}
              showComparison={showComparison}
              onToggleComparison={onToggleComparison}
              onHide={onHide}
              onSelectFactor={onSelectFactor}
              onUploadPareto={onUploadPareto}
              availableFactors={factors}
              aggregation={aggregation}
              onToggleAggregation={onToggleAggregation}
            />
          )}
        </ErrorBoundary>
      </div>
    </ChartCard>
  );
};

export default ParetoPanel;
