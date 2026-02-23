import React from 'react';
import Boxplot from '../charts/Boxplot';
import AnovaResults from '../AnovaResults';
import ErrorBoundary from '../ErrorBoundary';
import {
  FilterContextBar,
  filterContextBarAzureColorScheme,
  FactorSelector,
  ChartDownloadMenu,
  chartDownloadMenuAzureColorScheme,
} from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { BoxplotStatsTable, type BoxplotGroupData } from '@variscout/charts';
import { Minimize2, Copy, Check } from 'lucide-react';
import type { AnovaResult, DisplayOptions } from '@variscout/core';
import type { FilterChipData, ChartAnnotation, HighlightColor } from '@variscout/hooks';

interface FocusedBoxplotViewProps {
  boxplotFactor: string;
  factors: string[];
  filters: Record<string, (string | number)[]>;
  factorVariations: Map<string, number>;
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];
  chartTitle: string;
  displayOptions: DisplayOptions;
  columnAliases: Record<string, string>;
  cumulativeVariationPct: number;
  filterChipData: FilterChipData[];
  onSetBoxplotFactor: (f: string) => void;
  onDrillDown: (factor: string, value: string) => void;
  onChartTitleChange: (title: string) => void;
  onExit: () => void;
  highlightedCategories?: Record<string, HighlightColor>;
  onContextMenu?: (key: string, event: React.MouseEvent) => void;
  annotations?: ChartAnnotation[];
  onAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
  categoryContributions?: Map<string | number, number>;
  // Chart export props
  copyFeedback?: string | null;
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg?: (containerId: string, chartName: string) => void;
}

const FocusedBoxplotView: React.FC<FocusedBoxplotViewProps> = ({
  boxplotFactor,
  factors,
  filters,
  factorVariations,
  anovaResult,
  boxplotData,
  chartTitle,
  displayOptions,
  columnAliases,
  cumulativeVariationPct,
  filterChipData,
  onSetBoxplotFactor,
  onDrillDown,
  onChartTitleChange,
  onExit,
  highlightedCategories,
  onContextMenu,
  annotations,
  onAnnotationsChange,
  categoryContributions,
  copyFeedback,
  onCopyChart,
  onDownloadPng,
  onDownloadSvg,
}) => {
  return (
    <div
      id="boxplot-focus"
      className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-200 uppercase tracking-wider">
          <EditableChartTitle
            defaultTitle={`Boxplot: ${boxplotFactor}`}
            value={chartTitle}
            onChange={onChartTitleChange}
          />
        </h3>
        <div className="flex items-center gap-4">
          <FactorSelector
            factors={factors}
            selected={boxplotFactor}
            onChange={onSetBoxplotFactor}
            hasActiveFilter={!!filters?.[boxplotFactor]?.length}
            size="md"
          />
          {onCopyChart && onDownloadPng && onDownloadSvg && (
            <div className="flex items-center gap-1" data-export-hide>
              <button
                onClick={() => onCopyChart('boxplot-focus', 'boxplot')}
                className={`p-1.5 rounded transition-all ${
                  copyFeedback === 'boxplot'
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-slate-500 hover:text-white hover:bg-slate-700'
                }`}
                title="Copy Boxplot to clipboard"
                aria-label="Copy Boxplot to clipboard"
              >
                {copyFeedback === 'boxplot' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <ChartDownloadMenu
                containerId="boxplot-focus"
                chartName="boxplot"
                onDownloadPng={onDownloadPng}
                onDownloadSvg={onDownloadSvg}
                colorScheme={chartDownloadMenuAzureColorScheme}
              />
            </div>
          )}
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
        <ErrorBoundary componentName="Boxplot">
          {boxplotFactor && (
            <Boxplot
              factor={boxplotFactor}
              onDrillDown={onDrillDown}
              variationPct={factorVariations.get(boxplotFactor)}
              categoryContributions={categoryContributions}
              highlightedCategories={highlightedCategories}
              onContextMenu={onContextMenu}
              annotations={annotations}
              onAnnotationsChange={onAnnotationsChange}
            />
          )}
        </ErrorBoundary>
      </div>
      {boxplotData.length > 0 && (
        <div className="mt-2 max-h-[200px] overflow-y-auto">
          <BoxplotStatsTable data={boxplotData} />
        </div>
      )}
      {anovaResult && <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />}
    </div>
  );
};

export default FocusedBoxplotView;
