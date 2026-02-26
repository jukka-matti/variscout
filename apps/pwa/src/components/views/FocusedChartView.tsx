import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import {
  ErrorBoundary,
  FactorSelector,
  AnovaResults,
  FocusedViewOverlay,
  FocusedChartCard,
  HelpTooltip,
  useGlossary,
} from '@variscout/ui';
import { Activity } from 'lucide-react';
import type { AnovaResult, StatsResult, StagedStatsResult } from '@variscout/core';
import type { FilterChipData, ChartAnnotation, HighlightColor } from '@variscout/hooks';
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
  onSelectParetoFactor: () => void;
  onOpenColumnMapping?: () => void;
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
  // Boxplot annotation props
  boxplotHighlights?: Record<string, HighlightColor>;
  onBoxplotContextMenu?: (key: string, event: React.MouseEvent) => void;
  boxplotAnnotations?: ChartAnnotation[];
  onBoxplotAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
  // Pareto annotation props
  paretoHighlights?: Record<string, HighlightColor>;
  onParetoContextMenu?: (key: string, event: React.MouseEvent) => void;
  paretoAnnotations?: ChartAnnotation[];
  onParetoAnnotationsChange?: (annotations: ChartAnnotation[]) => void;
  // Chart export props
  copyFeedback?: string | null;
  onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg?: (containerId: string, chartName: string) => void;
}

/**
 * Focused chart view - maximized single chart with navigation
 * Shows one chart fullscreen with left/right navigation arrows
 */
const FocusedChartView: React.FC<FocusedChartViewProps> = ({
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
  onSelectParetoFactor,
  onOpenColumnMapping,
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
  boxplotHighlights,
  onBoxplotContextMenu,
  boxplotAnnotations,
  onBoxplotAnnotationsChange,
  paretoHighlights,
  onParetoContextMenu,
  paretoAnnotations,
  onParetoAnnotationsChange,
  copyFeedback,
  onCopyChart,
  onDownloadPng,
  onDownloadSvg,
}) => {
  const { getTerm } = useGlossary();

  const ichartHeaderRight =
    stageColumn && stagedStats ? (
      <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
        <span className="text-blue-400 font-medium">{stagedStats.stageOrder.length} stages</span>
        <span className="text-content-secondary">
          μ:{' '}
          <span className="text-white font-mono">{stagedStats.overallStats.mean.toFixed(2)}</span>
        </span>
      </div>
    ) : stats ? (
      <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
        <span className="text-content-secondary flex items-center gap-1">
          UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
          <HelpTooltip term={getTerm('ucl')} iconSize={12} />
        </span>
        <span className="text-content-secondary flex items-center gap-1">
          Mean: <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
          <HelpTooltip term={getTerm('mean')} iconSize={12} />
        </span>
        <span className="text-content-secondary flex items-center gap-1">
          LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
          <HelpTooltip term={getTerm('lcl')} iconSize={12} />
        </span>
      </div>
    ) : undefined;

  return (
    <FocusedViewOverlay onPrev={onPrevChart} onNext={onNextChart}>
      {focusedChart === 'ichart' && (
        <FocusedChartCard
          id="ichart-focus"
          chartName="ichart"
          onExit={onExitFocus}
          copyFeedback={copyFeedback}
          onCopyChart={onCopyChart}
          onDownloadPng={onDownloadPng}
          onDownloadSvg={onDownloadSvg}
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          cumulativeVariationPct={cumulativeVariationPct}
          showFilterContext={showFilterContext}
          header={
            <>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                <Activity className="text-blue-400" size={24} />
                I-Chart:
              </h2>
              <select
                value={outcome}
                onChange={e => onSetOutcome(e.target.value)}
                className="bg-surface border border-edge text-xl font-bold text-white rounded px-3 py-1.5 outline-none focus:border-blue-500"
              >
                {availableOutcomes.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </>
          }
          headerRight={ichartHeaderRight}
        >
          <ErrorBoundary componentName="I-Chart">
            <IChart onPointClick={onPointClick} onSpecClick={onSpecClick} />
          </ErrorBoundary>
        </FocusedChartCard>
      )}

      {focusedChart === 'boxplot' && (
        <FocusedChartCard
          id="boxplot-focus"
          chartName="boxplot"
          onExit={onExitFocus}
          copyFeedback={copyFeedback}
          onCopyChart={onCopyChart}
          onDownloadPng={onDownloadPng}
          onDownloadSvg={onDownloadSvg}
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          cumulativeVariationPct={cumulativeVariationPct}
          showFilterContext={showFilterContext}
          className="overflow-hidden"
          header={
            <>
              <h3 className="text-xl font-semibold text-content uppercase tracking-wider">
                Boxplot
              </h3>
            </>
          }
          headerRight={
            <div className="flex items-center gap-4">
              <FactorSelector
                factors={factors}
                selected={boxplotFactor}
                onChange={onSetBoxplotFactor}
                hasActiveFilter={!!filters?.[boxplotFactor]?.length}
                size="md"
              />
            </div>
          }
          footer={
            <>
              {boxplotData && boxplotData.length > 0 && (
                <div className="mt-2 max-h-[200px] overflow-y-auto">
                  <BoxplotStatsTable
                    data={boxplotData}
                    categoryContributions={boxplotCategoryContributions}
                  />
                </div>
              )}
              {anovaResult && <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />}
            </>
          }
        >
          <ErrorBoundary componentName="Boxplot">
            {boxplotFactor && (
              <Boxplot
                factor={boxplotFactor}
                onDrillDown={onDrillDown}
                variationPct={factorVariations.get(boxplotFactor)}
                categoryContributions={boxplotCategoryContributions}
                highlightedCategories={boxplotHighlights}
                onContextMenu={onBoxplotContextMenu}
                annotations={boxplotAnnotations}
                onAnnotationsChange={onBoxplotAnnotationsChange}
              />
            )}
          </ErrorBoundary>
        </FocusedChartCard>
      )}

      {focusedChart === 'pareto' && (
        <FocusedChartCard
          id="pareto-focus"
          chartName="pareto"
          onExit={onExitFocus}
          copyFeedback={copyFeedback}
          onCopyChart={onCopyChart}
          onDownloadPng={onDownloadPng}
          onDownloadSvg={onDownloadSvg}
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          cumulativeVariationPct={cumulativeVariationPct}
          showFilterContext={showFilterContext}
          header={
            <h3 className="text-xl font-semibold text-content uppercase tracking-wider">Pareto</h3>
          }
          headerRight={
            <div className="flex items-center gap-4">
              <FactorSelector
                factors={factors}
                selected={paretoFactor}
                onChange={onSetParetoFactor}
                hasActiveFilter={!!filters?.[paretoFactor]?.length}
                size="md"
              />
            </div>
          }
        >
          <ErrorBoundary componentName="Pareto Chart">
            {paretoFactor && (
              <ParetoChart
                factor={paretoFactor}
                onDrillDown={onDrillDown}
                showComparison={showParetoComparison}
                onToggleComparison={onToggleParetoComparison}
                onHide={() => {
                  onHideParetoPanel();
                  onExitFocus();
                }}
                onSelectFactor={onSelectParetoFactor}
                onUploadPareto={onOpenColumnMapping}
                availableFactors={factors}
                aggregation={paretoAggregation}
                onToggleAggregation={onToggleParetoAggregation}
                highlightedCategories={paretoHighlights}
                onContextMenu={onParetoContextMenu}
                annotations={paretoAnnotations}
                onAnnotationsChange={onParetoAnnotationsChange}
              />
            )}
          </ErrorBoundary>
        </FocusedChartCard>
      )}
    </FocusedViewOverlay>
  );
};

export default FocusedChartView;
