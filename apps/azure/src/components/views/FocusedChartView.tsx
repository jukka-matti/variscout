import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import { FocusedChartViewBase } from '@variscout/ui';
import { BoxplotStatsTable, type BoxplotGroupData } from '@variscout/charts';
import { Layers } from 'lucide-react';
import type {
  StageOrderMode,
  StatsResult,
  StagedStatsResult,
  DisplayOptions,
  AnovaResult,
} from '@variscout/core';
import type { FilterChipData, ChartAnnotation, HighlightColor } from '@variscout/hooks';

type FocusedChartType = 'ichart' | 'boxplot' | 'pareto';

interface FocusedChartViewProps {
  focusedChart: FocusedChartType;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;

  // Shared props
  displayOptions: DisplayOptions;
  columnAliases: Record<string, string>;
  cumulativeVariationPct: number;
  filterChipData: FilterChipData[];
  copyFeedback?: string | null;
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg?: (containerId: string, chartName: string) => void;

  // I-Chart props
  outcome: string;
  availableOutcomes: string[];
  stageColumn: string | null;
  availableStageColumns: string[];
  stageOrderMode: StageOrderMode;
  stagedStats: StagedStatsResult | null;
  stats: StatsResult | null;
  ichartChartTitle: string;
  onSetOutcome: (o: string) => void;
  onSetStageColumn: (sc: string | null) => void;
  onSetStageOrderMode: (m: StageOrderMode) => void;
  onSpecClick?: () => void;
  onIChartTitleChange: (title: string) => void;
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  ichartAnnotations?: ChartAnnotation[];
  onCreateIChartAnnotation?: (anchorX: number, anchorY: number) => void;
  onIChartAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
  onClearIChartAnnotations?: () => void;

  // Boxplot props
  boxplotFactor: string;
  factors: string[];
  filters: Record<string, (string | number)[]>;
  factorVariations: Map<string, number>;
  anovaResult: AnovaResult | null;
  boxplotData: BoxplotGroupData[];
  boxplotChartTitle: string;
  onSetBoxplotFactor: (f: string) => void;
  onDrillDown: (factor: string, value: string) => void;
  onBoxplotTitleChange: (title: string) => void;
  boxplotHighlightedCategories?: Record<string, HighlightColor>;
  onBoxplotContextMenu?: (key: string, event: React.MouseEvent) => void;
  boxplotAnnotations?: ChartAnnotation[];
  onBoxplotAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
  categoryContributions?: Map<string | number, number>;

  // Pareto props
  paretoFactor: string;
  showParetoComparison: boolean;
  paretoAggregation: 'count' | 'value';
  paretoChartTitle: string;
  onSetParetoFactor: (f: string) => void;
  onToggleComparison: () => void;
  onToggleAggregation: () => void;
  onParetoTitleChange: (title: string) => void;
  paretoHighlightedCategories?: Record<string, HighlightColor>;
  onParetoContextMenu?: (key: string, event: React.MouseEvent) => void;
  paretoAnnotations?: ChartAnnotation[];
  onParetoAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
}

/**
 * Azure Focused chart view — maps Azure-specific props to FocusedChartViewBase.
 * Provides stage column selector via renderHeaderExtra and chart render callbacks.
 */
const FocusedChartView: React.FC<FocusedChartViewProps> = props => {
  const stageColumnSelector =
    props.availableStageColumns.length > 0 ? (
      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-edge">
        <Layers size={16} className="text-blue-400" />
        <select
          value={props.stageColumn || ''}
          onChange={e => props.onSetStageColumn(e.target.value || null)}
          className="bg-surface border border-edge text-sm text-content rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
          title="Select a column to divide the chart into stages"
        >
          <option value="">No stages</option>
          {props.availableStageColumns.map(col => (
            <option key={col} value={col}>
              {props.columnAliases[col] || col}
            </option>
          ))}
        </select>
        {props.stageColumn && (
          <select
            value={props.stageOrderMode}
            onChange={e => props.onSetStageOrderMode(e.target.value as StageOrderMode)}
            className="bg-surface border border-edge text-xs text-content-secondary rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
            title="Stage ordering method"
          >
            <option value="auto">Auto order</option>
            <option value="data-order">As in data</option>
          </select>
        )}
      </div>
    ) : undefined;

  return (
    <FocusedChartViewBase
      navigation={{
        focusedChart: props.focusedChart,
        onPrev: props.onPrev,
        onNext: props.onNext,
        onExit: props.onExit,
      }}
      chartExport={{
        copyFeedback: props.copyFeedback,
        onCopyChart: props.onCopyChart,
        onDownloadPng: props.onDownloadPng,
        onDownloadSvg: props.onDownloadSvg,
      }}
      filterContext={{
        filterChipData: props.filterChipData,
        columnAliases: props.columnAliases,
        cumulativeVariationPct: props.cumulativeVariationPct,
        showFilterContext: props.displayOptions.showFilterContext !== false,
      }}
      ichart={{
        outcome: props.outcome,
        availableOutcomes: props.availableOutcomes,
        onSetOutcome: props.onSetOutcome,
        chartTitle: props.ichartChartTitle,
        onTitleChange: props.onIChartTitleChange,
        stats: props.stats,
        stageColumn: props.stageColumn,
        stagedStats: props.stagedStats,
        annotations: props.ichartAnnotations,
        onClearAnnotations: props.onClearIChartAnnotations,
        renderHeaderExtra: stageColumnSelector,
        renderChart: () => (
          <IChart
            onPointClick={props.onPointClick}
            highlightedPointIndex={props.highlightedPointIndex}
            onSpecClick={props.onSpecClick}
            ichartAnnotations={props.ichartAnnotations}
            onCreateAnnotation={props.onCreateIChartAnnotation}
            onAnnotationsChange={props.onIChartAnnotationsChange}
          />
        ),
      }}
      boxplot={{
        factor: props.boxplotFactor,
        factors: props.factors,
        onSetFactor: props.onSetBoxplotFactor,
        filters: props.filters,
        columnAliases: props.columnAliases,
        chartTitle: props.boxplotChartTitle,
        onTitleChange: props.onBoxplotTitleChange,
        anovaResult: props.anovaResult,
        renderStatsTable:
          props.boxplotData.length > 0
            ? () => (
                <div className="mt-2 max-h-[200px] overflow-y-auto">
                  <BoxplotStatsTable
                    data={props.boxplotData}
                    categoryContributions={props.categoryContributions}
                  />
                </div>
              )
            : undefined,
        renderChart: () =>
          props.boxplotFactor ? (
            <Boxplot
              factor={props.boxplotFactor}
              onDrillDown={props.onDrillDown}
              variationPct={props.factorVariations.get(props.boxplotFactor)}
              categoryContributions={props.categoryContributions}
              highlightedCategories={props.boxplotHighlightedCategories}
              onContextMenu={props.onBoxplotContextMenu}
              annotations={props.boxplotAnnotations}
              onAnnotationsChange={props.onBoxplotAnnotationsChange}
            />
          ) : null,
      }}
      pareto={{
        factor: props.paretoFactor,
        factors: props.factors,
        onSetFactor: props.onSetParetoFactor,
        filters: props.filters,
        columnAliases: props.columnAliases,
        chartTitle: props.paretoChartTitle,
        onTitleChange: props.onParetoTitleChange,
        renderChart: () =>
          props.paretoFactor ? (
            <ParetoChart
              factor={props.paretoFactor}
              onDrillDown={props.onDrillDown}
              showComparison={props.showParetoComparison}
              onToggleComparison={props.onToggleComparison}
              aggregation={props.paretoAggregation}
              onToggleAggregation={props.onToggleAggregation}
              highlightedCategories={props.paretoHighlightedCategories}
              onContextMenu={props.onParetoContextMenu}
              annotations={props.paretoAnnotations}
              onAnnotationsChange={props.onParetoAnnotationsChange}
            />
          ) : null,
      }}
    />
  );
};

export default FocusedChartView;
