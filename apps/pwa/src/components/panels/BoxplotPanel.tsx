/**
 * BoxplotPanel - Boxplot section for Dashboard
 *
 * Renders the Boxplot chart with its header controls:
 * - Factor selector
 * - Copy and maximize buttons
 */

import React from 'react';
import Boxplot from '../charts/Boxplot';
import ErrorBoundary from '../ErrorBoundary';
import FactorSelector from '../FactorSelector';
import { ChartCard } from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { useData } from '../../context/DataContext';

interface BoxplotPanelProps {
  /** Currently selected factor for the boxplot */
  boxplotFactor: string;
  /** Handler to change the boxplot factor */
  onSetBoxplotFactor: (factor: string) => void;
  /** Variation percentage for the current factor */
  variationPct?: number;
  /** Category contributions for drill suggestion */
  categoryContributions?: Map<string, number>;
  /** Handler for drill-down on category click */
  onDrillDown: (factor: string, value: string) => void;
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

const BoxplotPanel: React.FC<BoxplotPanelProps> = ({
  boxplotFactor,
  onSetBoxplotFactor,
  variationPct,
  categoryContributions,
  onDrillDown,
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
        defaultTitle={`Boxplot: ${boxplotFactor}`}
        value={chartTitles.boxplot || ''}
        onChange={title => setChartTitles({ ...chartTitles, boxplot: title })}
      />
    </h3>
  );

  const controls = (
    <FactorSelector
      factors={factors}
      selected={boxplotFactor}
      onChange={onSetBoxplotFactor}
      hasActiveFilter={!!filters?.[boxplotFactor]?.length}
    />
  );

  return (
    <ChartCard
      id="boxplot-card"
      chartId="boxplot"
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
      <div id="boxplot-container" className="flex-1 min-h-[180px]">
        <ErrorBoundary componentName="Boxplot">
          {boxplotFactor && (
            <Boxplot
              factor={boxplotFactor}
              onDrillDown={onDrillDown}
              variationPct={variationPct}
              categoryContributions={categoryContributions}
            />
          )}
        </ErrorBoundary>
      </div>
    </ChartCard>
  );
};

export default BoxplotPanel;
