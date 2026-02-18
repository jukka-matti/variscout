import React from 'react';
import IChart from '../charts/IChart';
import SpecsPopover from '../settings/SpecsPopover';
import ErrorBoundary from '../ErrorBoundary';
import {
  FilterContextBar,
  filterContextBarAzureColorScheme,
  HelpTooltip,
  useGlossary,
} from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { Activity, Layers, Minimize2 } from 'lucide-react';
import type {
  StageOrderMode,
  SpecLimits,
  StatsResult,
  StagedStatsResult,
  DisplayOptions,
} from '@variscout/core';
import type { FilterChipData } from '@variscout/hooks';

interface FocusedIChartViewProps {
  outcome: string;
  availableOutcomes: string[];
  stageColumn: string | null;
  availableStageColumns: string[];
  stageOrderMode: StageOrderMode;
  stagedStats: StagedStatsResult | null;
  stats: StatsResult | null;
  specs: SpecLimits;
  chartTitle: string;
  displayOptions: DisplayOptions;
  columnAliases: Record<string, string>;
  cumulativeVariationPct: number;
  filterChipData: FilterChipData[];
  onSetOutcome: (o: string) => void;
  onSetStageColumn: (sc: string | null) => void;
  onSetStageOrderMode: (m: StageOrderMode) => void;
  onSaveSpecs: (specs: SpecLimits) => void;
  onChartTitleChange: (title: string) => void;
  onExit: () => void;
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
}

const FocusedIChartView: React.FC<FocusedIChartViewProps> = ({
  outcome,
  availableOutcomes,
  stageColumn,
  availableStageColumns,
  stageOrderMode,
  stagedStats,
  stats,
  specs,
  chartTitle,
  displayOptions,
  columnAliases,
  cumulativeVariationPct,
  filterChipData,
  onSetOutcome,
  onSetStageColumn,
  onSetStageOrderMode,
  onSaveSpecs,
  onChartTitleChange,
  onExit,
  onPointClick,
  highlightedPointIndex,
}) => {
  const { getTerm } = useGlossary();

  return (
    <div className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Activity className="text-blue-400" size={24} />
            <EditableChartTitle
              defaultTitle={`I-Chart: ${outcome}`}
              value={chartTitle}
              onChange={onChartTitleChange}
            />
          </h2>
          <select
            value={outcome}
            onChange={e => onSetOutcome(e.target.value)}
            aria-label="Select outcome variable"
            className="bg-slate-900 border border-slate-700 text-xl font-bold text-white rounded px-3 py-1.5 outline-none focus:border-blue-500"
          >
            {availableOutcomes.map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {/* Stage Column Selector */}
          {availableStageColumns.length > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
              <Layers size={16} className="text-blue-400" />
              <select
                value={stageColumn || ''}
                onChange={e => onSetStageColumn(e.target.value || null)}
                className="bg-slate-900 border border-slate-700 text-sm text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                title="Select a column to divide the chart into stages"
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
                  onChange={e => onSetStageOrderMode(e.target.value as StageOrderMode)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-400 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                  title="Stage ordering method"
                >
                  <option value="auto">Auto order</option>
                  <option value="data-order">As in data</option>
                </select>
              )}
            </div>
          )}
          <SpecsPopover specs={specs} onSave={onSaveSpecs} />
          <button
            onClick={onExit}
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-4 bg-slate-700/50"
            aria-label="Exit focus mode"
            title="Exit Focus Mode"
          >
            <Minimize2 size={20} />
          </button>
        </div>
        {/* Stats summary */}
        {stageColumn && stagedStats ? (
          <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="text-blue-400 font-medium">
              {stagedStats.stageOrder.length} stages
            </span>
            <span className="text-slate-400">
              Overall Mean:{' '}
              <span className="text-white font-mono">
                {stagedStats.overallStats.mean.toFixed(2)}
              </span>
            </span>
          </div>
        ) : (
          stats && (
            <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 flex items-center gap-1">
                UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                <HelpTooltip term={getTerm('ucl')} iconSize={12} />
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                Mean: <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                <HelpTooltip term={getTerm('mean')} iconSize={12} />
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
                <HelpTooltip term={getTerm('lcl')} iconSize={12} />
              </span>
            </div>
          )
        )}
      </div>
      <FilterContextBar
        filterChipData={filterChipData}
        columnAliases={columnAliases}
        cumulativeVariationPct={cumulativeVariationPct}
        show={displayOptions.showFilterContext !== false}
        colorScheme={filterContextBarAzureColorScheme}
      />
      <div className="flex-1 min-h-0 w-full">
        <ErrorBoundary componentName="I-Chart">
          <IChart onPointClick={onPointClick} highlightedPointIndex={highlightedPointIndex} />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default FocusedIChartView;
