import React from 'react';
import ParetoChart from '../charts/ParetoChart';
import ErrorBoundary from '../ErrorBoundary';
import { FilterContextBar, filterContextBarAzureColorScheme, FactorSelector } from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { Minimize2 } from 'lucide-react';
import type { DisplayOptions } from '@variscout/core';
import type { FilterChipData, ChartAnnotation, HighlightColor } from '@variscout/hooks';

interface FocusedParetoViewProps {
  paretoFactor: string;
  factors: string[];
  filters: Record<string, (string | number)[]>;
  showParetoComparison: boolean;
  paretoAggregation: 'count' | 'value';
  chartTitle: string;
  displayOptions: DisplayOptions;
  columnAliases: Record<string, string>;
  cumulativeVariationPct: number;
  filterChipData: FilterChipData[];
  onSetParetoFactor: (f: string) => void;
  onDrillDown: (factor: string, value: string) => void;
  onToggleComparison: () => void;
  onToggleAggregation: () => void;
  onChartTitleChange: (title: string) => void;
  onExit: () => void;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  annotations?: ChartAnnotation[];
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

const FocusedParetoView: React.FC<FocusedParetoViewProps> = ({
  paretoFactor,
  factors,
  filters,
  showParetoComparison,
  paretoAggregation,
  chartTitle,
  displayOptions,
  columnAliases,
  cumulativeVariationPct,
  filterChipData,
  onSetParetoFactor,
  onDrillDown,
  onToggleComparison,
  onToggleAggregation,
  onChartTitleChange,
  onExit,
  highlightedCategories,
  onContextMenu,
  annotations,
  onAnnotationsChange,
}) => {
  return (
    <div className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-200 uppercase tracking-wider">
          <EditableChartTitle
            defaultTitle={`Pareto: ${paretoFactor}`}
            value={chartTitle}
            onChange={onChartTitleChange}
          />
        </h3>
        <div className="flex items-center gap-4">
          <FactorSelector
            factors={factors}
            selected={paretoFactor}
            onChange={onSetParetoFactor}
            hasActiveFilter={!!filters?.[paretoFactor]?.length}
            size="md"
          />
          <button
            onClick={onExit}
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
            aria-label="Exit focus mode"
            title="Exit Focus Mode"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      </div>
      <FilterContextBar
        filterChipData={filterChipData}
        columnAliases={columnAliases}
        cumulativeVariationPct={cumulativeVariationPct}
        show={displayOptions.showFilterContext !== false}
        colorScheme={filterContextBarAzureColorScheme}
      />
      <div className="flex-1 min-h-0">
        <ErrorBoundary componentName="Pareto Chart">
          {paretoFactor && (
            <ParetoChart
              factor={paretoFactor}
              onDrillDown={onDrillDown}
              showComparison={showParetoComparison}
              onToggleComparison={onToggleComparison}
              aggregation={paretoAggregation}
              onToggleAggregation={onToggleAggregation}
              highlightedCategories={highlightedCategories}
              onContextMenu={onContextMenu}
              annotations={annotations}
              onAnnotationsChange={onAnnotationsChange}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default FocusedParetoView;
