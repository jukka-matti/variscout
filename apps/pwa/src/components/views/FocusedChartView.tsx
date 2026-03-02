import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import { FocusedChartViewBase } from '@variscout/ui';
import type { AnovaResult, StatsResult, StagedStatsResult, Finding } from '@variscout/core';
import type { FilterChipData, HighlightColor, ChartTitles } from '@variscout/hooks';
import { BoxplotStatsTable, type BoxplotGroupData } from '@variscout/charts';

export type FocusableChart = 'ichart' | 'boxplot' | 'pareto';

export interface FocusedChartViewProps {
  focusedChart: FocusableChart;
  outcome: string;
  availableOutcomes: string[];
  boxplotFactor: string;
  paretoFactor: string;
  factors: string[];
  filters: Record<string, (string | number)[]>;
  factorVariations: Map<string, number>;
  showParetoComparison: boolean;
  anovaResult: AnovaResult | null;
  boxplotData?: BoxplotGroupData[];
  boxplotCategoryContributions?: Map<string | number, number>;
  stats?: StatsResult | null;
  stagedStats?: StagedStatsResult | null;
  stageColumn?: string | null;
  onSetOutcome: (outcome: string) => void;
  onSetBoxplotFactor: (factor: string) => void;
  onSetParetoFactor: (factor: string) => void;
  onDrillDown: (factor: string, value: string) => void;
  onToggleParetoComparison: () => void;
  onHideParetoPanel: () => void;
  onManageFactors?: () => void;
  onPointClick?: (index: number) => void;
  onSpecClick: () => void;
  onNextChart: () => void;
  onPrevChart: () => void;
  onExitFocus: () => void;
  paretoAggregation?: 'count' | 'value';
  onToggleParetoAggregation?: () => void;
  filterChipData?: FilterChipData[];
  columnAliases?: Record<string, string>;
  cumulativeVariationPct?: number | null;
  showFilterContext?: boolean;
  // I-Chart finding props
  ichartFindings?: Finding[];
  onCreateObservation?: (anchorX: number, anchorY: number) => void;
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
  // Boxplot finding props
  boxplotHighlights?: Record<string, HighlightColor>;
  onBoxplotContextMenu?: (key: string, event: React.MouseEvent) => void;
  boxplotFindings?: Finding[];
  onBoxplotEditFinding?: (id: string, text: string) => void;
  onBoxplotDeleteFinding?: (id: string) => void;
  // Pareto finding props
  paretoHighlights?: Record<string, HighlightColor>;
  onParetoContextMenu?: (key: string, event: React.MouseEvent) => void;
  paretoFindings?: Finding[];
  onParetoEditFinding?: (id: string, text: string) => void;
  onParetoDeleteFinding?: (id: string) => void;
  // Chart title props
  chartTitles?: ChartTitles;
  onChartTitleChange?: (chart: keyof ChartTitles, title: string) => void;
  // Chart export props
  copyFeedback?: string | null;
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg?: (containerId: string, chartName: string) => void;
}

/**
 * PWA Focused chart view — maps PWA-specific props to FocusedChartViewBase.
 * Provides chart render callbacks with PWA chart wrappers and annotation props.
 */
const FocusedChartView: React.FC<FocusedChartViewProps> = props => {
  const {
    focusedChart,
    outcome,
    availableOutcomes,
    boxplotFactor,
    paretoFactor,
    factors,
    filters,
    factorVariations,
    showParetoComparison,
    anovaResult,
    boxplotData,
    boxplotCategoryContributions,
    stats,
    stagedStats,
    stageColumn,
    onSetOutcome,
    onSetBoxplotFactor,
    onSetParetoFactor,
    onDrillDown,
    onToggleParetoComparison,
    onHideParetoPanel,
    onManageFactors,
    onPointClick,
    onSpecClick,
    onNextChart,
    onPrevChart,
    onExitFocus,
    paretoAggregation = 'count',
    onToggleParetoAggregation,
    filterChipData = [],
    columnAliases = {},
    cumulativeVariationPct,
    showFilterContext = true,
    ichartFindings,
    onCreateObservation,
    onEditFinding,
    onDeleteFinding,
    boxplotHighlights,
    onBoxplotContextMenu,
    boxplotFindings,
    onBoxplotEditFinding,
    onBoxplotDeleteFinding,
    paretoHighlights,
    onParetoContextMenu,
    paretoFindings,
    onParetoEditFinding,
    onParetoDeleteFinding,
    chartTitles,
    onChartTitleChange,
    copyFeedback,
    onCopyChart,
    onDownloadPng,
    onDownloadSvg,
  } = props;

  return (
    <FocusedChartViewBase
      navigation={{
        focusedChart,
        onPrev: onPrevChart,
        onNext: onNextChart,
        onExit: onExitFocus,
      }}
      chartExport={{ copyFeedback, onCopyChart, onDownloadPng, onDownloadSvg }}
      filterContext={{
        filterChipData,
        columnAliases,
        cumulativeVariationPct,
        showFilterContext,
      }}
      ichart={{
        outcome,
        availableOutcomes,
        onSetOutcome,
        chartTitle: chartTitles?.ichart || '',
        onTitleChange: title => onChartTitleChange?.('ichart', title),
        stats: stats ?? null,
        stageColumn,
        stagedStats: stagedStats ?? null,
        findings: ichartFindings,
        renderChart: () => (
          <IChart
            onPointClick={onPointClick}
            onSpecClick={onSpecClick}
            ichartFindings={ichartFindings}
            onCreateObservation={onCreateObservation}
            onEditFinding={onEditFinding}
            onDeleteFinding={onDeleteFinding}
          />
        ),
      }}
      boxplot={{
        factor: boxplotFactor,
        factors,
        onSetFactor: onSetBoxplotFactor,
        filters,
        columnAliases,
        chartTitle: chartTitles?.boxplot || '',
        onTitleChange: title => onChartTitleChange?.('boxplot', title),
        anovaResult,
        renderStatsTable:
          boxplotData && boxplotData.length > 0
            ? () => (
                <div className="mt-2 max-h-[200px] overflow-y-auto">
                  <BoxplotStatsTable
                    data={boxplotData}
                    categoryContributions={boxplotCategoryContributions}
                  />
                </div>
              )
            : undefined,
        renderChart: () =>
          boxplotFactor ? (
            <Boxplot
              factor={boxplotFactor}
              onDrillDown={onDrillDown}
              variationPct={factorVariations.get(boxplotFactor)}
              categoryContributions={boxplotCategoryContributions}
              highlightedCategories={boxplotHighlights}
              onContextMenu={onBoxplotContextMenu}
              findings={boxplotFindings}
              onEditFinding={onBoxplotEditFinding}
              onDeleteFinding={onBoxplotDeleteFinding}
            />
          ) : null,
      }}
      pareto={{
        factor: paretoFactor,
        factors,
        onSetFactor: onSetParetoFactor,
        filters,
        columnAliases,
        chartTitle: chartTitles?.pareto || '',
        onTitleChange: title => onChartTitleChange?.('pareto', title),
        renderChart: () =>
          paretoFactor ? (
            <ParetoChart
              factor={paretoFactor}
              onDrillDown={onDrillDown}
              showComparison={showParetoComparison}
              onToggleComparison={onToggleParetoComparison}
              onHide={() => {
                onHideParetoPanel();
                onExitFocus();
              }}
              onUploadPareto={onManageFactors}
              availableFactors={factors}
              aggregation={paretoAggregation}
              onToggleAggregation={onToggleParetoAggregation}
              highlightedCategories={paretoHighlights}
              onContextMenu={onParetoContextMenu}
              findings={paretoFindings}
              onEditFinding={onParetoEditFinding}
              onDeleteFinding={onParetoDeleteFinding}
            />
          ) : null,
      }}
    />
  );
};

export default FocusedChartView;
