/**
 * IChartPanel - I-Chart section for Dashboard
 *
 * Renders the I-Chart with its header controls:
 * - Outcome selector
 * - Stage column selector
 * - Stage order mode toggle
 * - Specs popover
 * - Stage stats display
 */

import React from 'react';
import { Activity, Layers } from 'lucide-react';
import IChart from '../charts/IChart';
import ErrorBoundary from '../ErrorBoundary';
import SpecsPopover from '../SpecsPopover';
import { ChartCard, type ChartId } from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { useData } from '../../context/DataContext';
import type { StageOrderMode } from '@variscout/core';

interface IChartPanelProps {
  /** Available outcome columns for selection */
  availableOutcomes: string[];
  /** Available stage columns for selection */
  availableStageColumns: string[];
  /** Handler for point clicks on the chart */
  onPointClick?: (index: number) => void;
  /** Handler to open the spec editor */
  onSpecClick: () => void;
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

const IChartPanel: React.FC<IChartPanelProps> = ({
  availableOutcomes,
  availableStageColumns,
  onPointClick,
  onSpecClick,
  onCopy,
  onMaximize,
  copyFeedback,
  highlightClass,
  onClick,
}) => {
  const {
    outcome,
    setOutcome,
    specs,
    setSpecs,
    columnAliases,
    stageColumn,
    setStageColumn,
    stageOrderMode,
    setStageOrderMode,
    stagedStats,
    chartTitles,
    setChartTitles,
  } = useData();

  const title = (
    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
      <Activity className="text-blue-400" />
      <EditableChartTitle
        defaultTitle={`I-Chart: ${outcome}`}
        value={chartTitles.ichart || ''}
        onChange={title => setChartTitles({ ...chartTitles, ichart: title })}
      />
    </h2>
  );

  const controls = (
    <>
      {/* Outcome Selector */}
      <select
        value={outcome || ''}
        onChange={e => setOutcome(e.target.value)}
        className="bg-surface border border-edge text-sm font-medium text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
      >
        {availableOutcomes.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {/* Stage Controls */}
      {availableStageColumns.length > 0 && (
        <div className="flex items-center gap-1 pl-2 border-l border-edge">
          <Layers size={14} className="text-blue-400" />
          <select
            value={stageColumn || ''}
            onChange={e => setStageColumn(e.target.value || null)}
            className="bg-surface border border-edge text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
            title="Divide chart into stages"
          >
            <option value="">No stages</option>
            {availableStageColumns.map(col => (
              <option key={col} value={col}>
                {columnAliases[col] || col}
              </option>
            ))}
          </select>
          {stageColumn && (
            <select
              value={stageOrderMode}
              onChange={e => setStageOrderMode(e.target.value as StageOrderMode)}
              className="bg-surface border border-edge text-xs text-content-secondary rounded px-1 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
            >
              <option value="auto">Auto</option>
              <option value="data-order">Data order</option>
            </select>
          )}
        </div>
      )}

      {/* Specs */}
      <div className="pl-2 border-l border-edge">
        <SpecsPopover
          specs={specs}
          onSave={newSpecs => setSpecs(newSpecs)}
          onOpenAdvanced={onSpecClick}
        />
      </div>

      {/* Stage Stats (if active) */}
      {stageColumn && stagedStats && (
        <div className="flex gap-2 text-xs bg-surface/50 px-2 py-1 rounded border border-edge/50 pl-2 border-l border-edge">
          <span className="text-blue-400 font-medium">{stagedStats.stageOrder.length} stages</span>
          <span className="text-content-secondary">
            μ:{' '}
            <span className="text-white font-mono">{stagedStats.overallStats.mean.toFixed(2)}</span>
          </span>
        </div>
      )}
    </>
  );

  return (
    <ChartCard
      id="ichart-card"
      chartId="ichart"
      title={title}
      controls={controls}
      onCopy={onCopy}
      onMaximize={onMaximize}
      copyFeedback={copyFeedback}
      highlightClass={highlightClass}
      onClick={onClick}
      minHeight="400px"
      className="chart-card--primary"
    >
      <div id="ichart-container" className="flex-1 min-h-[300px] w-full">
        <ErrorBoundary componentName="I-Chart">
          <IChart onPointClick={onPointClick} onSpecClick={onSpecClick} />
        </ErrorBoundary>
      </div>
    </ChartCard>
  );
};

export default IChartPanel;
