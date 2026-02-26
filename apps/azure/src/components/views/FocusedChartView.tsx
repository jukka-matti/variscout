import React from 'react';
import IChart from '../charts/IChart';
import Boxplot from '../charts/Boxplot';
import ParetoChart from '../charts/ParetoChart';
import SpecsPopover from '../settings/SpecsPopover';
import ErrorBoundary from '../ErrorBoundary';
import {
  FocusedViewOverlay,
  FocusedChartCard,
  AnovaResults,
  FactorSelector,
  HelpTooltip,
  useGlossary,
} from '@variscout/ui';
import { EditableChartTitle } from '@variscout/charts';
import { BoxplotStatsTable, type BoxplotGroupData } from '@variscout/charts';
import { Activity, Layers, X } from 'lucide-react';
import type {
  StageOrderMode,
  SpecLimits,
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
  specs: SpecLimits;
  ichartChartTitle: string;
  onSetOutcome: (o: string) => void;
  onSetStageColumn: (sc: string | null) => void;
  onSetStageOrderMode: (m: StageOrderMode) => void;
  onSaveSpecs: (specs: SpecLimits) => void;
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

// ---------------------------------------------------------------------------
// I-Chart focused content
// ---------------------------------------------------------------------------

const IChartFocusedContent: React.FC<{
  props: FocusedChartViewProps;
}> = ({ props }) => {
  const { getTerm } = useGlossary();

  const header = (
    <>
      <h2 className="text-xl font-bold flex items-center gap-2 text-content">
        <Activity className="text-blue-400" size={24} />
        <EditableChartTitle
          defaultTitle={`I-Chart: ${props.outcome}`}
          value={props.ichartChartTitle}
          onChange={props.onIChartTitleChange}
        />
      </h2>
      <select
        value={props.outcome}
        onChange={e => props.onSetOutcome(e.target.value)}
        aria-label="Select outcome variable"
        className="bg-surface border border-edge text-xl font-bold text-content rounded px-3 py-1.5 outline-none focus:border-blue-500"
      >
        {props.availableOutcomes.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {/* Stage Column Selector */}
      {props.availableStageColumns.length > 0 && (
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
      )}
      <SpecsPopover specs={props.specs} onSave={props.onSaveSpecs} />
      {props.ichartAnnotations &&
        props.ichartAnnotations.length > 0 &&
        props.onClearIChartAnnotations && (
          <button
            onClick={props.onClearIChartAnnotations}
            className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-surface-tertiary transition-colors"
            title="Clear I-Chart annotations"
            aria-label="Clear I-Chart annotations"
          >
            <X size={12} />
          </button>
        )}
    </>
  );

  const headerRight =
    props.stageColumn && props.stagedStats ? (
      <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
        <span className="text-blue-400 font-medium">
          {props.stagedStats.stageOrder.length} stages
        </span>
        <span className="text-content-secondary">
          Overall Mean:{' '}
          <span className="text-content font-mono">
            {props.stagedStats.overallStats.mean.toFixed(2)}
          </span>
        </span>
      </div>
    ) : (
      props.stats && (
        <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
          <span className="text-content-secondary flex items-center gap-1">
            UCL: <span className="text-content font-mono">{props.stats.ucl.toFixed(2)}</span>
            <HelpTooltip term={getTerm('ucl')} iconSize={12} />
          </span>
          <span className="text-content-secondary flex items-center gap-1">
            Mean: <span className="text-content font-mono">{props.stats.mean.toFixed(2)}</span>
            <HelpTooltip term={getTerm('mean')} iconSize={12} />
          </span>
          <span className="text-content-secondary flex items-center gap-1">
            LCL: <span className="text-content font-mono">{props.stats.lcl.toFixed(2)}</span>
            <HelpTooltip term={getTerm('lcl')} iconSize={12} />
          </span>
        </div>
      )
    );

  return (
    <FocusedChartCard
      id="ichart-focus"
      chartName="ichart"
      onExit={props.onExit}
      header={header}
      headerRight={headerRight}
      copyFeedback={props.copyFeedback}
      onCopyChart={props.onCopyChart}
      onDownloadPng={props.onDownloadPng}
      onDownloadSvg={props.onDownloadSvg}
      filterChipData={props.filterChipData}
      columnAliases={props.columnAliases}
      cumulativeVariationPct={props.cumulativeVariationPct}
      showFilterContext={props.displayOptions.showFilterContext !== false}
    >
      <ErrorBoundary componentName="I-Chart">
        <IChart
          onPointClick={props.onPointClick}
          highlightedPointIndex={props.highlightedPointIndex}
          ichartAnnotations={props.ichartAnnotations}
          onCreateAnnotation={props.onCreateIChartAnnotation}
          onAnnotationsChange={props.onIChartAnnotationsChange}
        />
      </ErrorBoundary>
    </FocusedChartCard>
  );
};

// ---------------------------------------------------------------------------
// Boxplot focused content
// ---------------------------------------------------------------------------

const BoxplotFocusedContent: React.FC<{
  props: FocusedChartViewProps;
}> = ({ props }) => {
  const header = (
    <>
      <h3 className="text-sm font-semibold text-content uppercase tracking-wider">
        <EditableChartTitle
          defaultTitle={`Boxplot: ${props.boxplotFactor}`}
          value={props.boxplotChartTitle}
          onChange={props.onBoxplotTitleChange}
        />
      </h3>
      <FactorSelector
        factors={props.factors}
        selected={props.boxplotFactor}
        onChange={props.onSetBoxplotFactor}
        hasActiveFilter={!!props.filters?.[props.boxplotFactor]?.length}
        size="md"
      />
    </>
  );

  const footer = (
    <>
      {props.boxplotData.length > 0 && (
        <div className="mt-2 max-h-[200px] overflow-y-auto">
          <BoxplotStatsTable data={props.boxplotData} />
        </div>
      )}
      {props.anovaResult && (
        <AnovaResults result={props.anovaResult} factorLabel={props.boxplotFactor} />
      )}
    </>
  );

  return (
    <FocusedChartCard
      id="boxplot-focus"
      chartName="boxplot"
      onExit={props.onExit}
      header={header}
      footer={footer}
      copyFeedback={props.copyFeedback}
      onCopyChart={props.onCopyChart}
      onDownloadPng={props.onDownloadPng}
      onDownloadSvg={props.onDownloadSvg}
      filterChipData={props.filterChipData}
      columnAliases={props.columnAliases}
      cumulativeVariationPct={props.cumulativeVariationPct}
      showFilterContext={props.displayOptions.showFilterContext !== false}
      className="overflow-hidden"
    >
      <ErrorBoundary componentName="Boxplot">
        {props.boxplotFactor && (
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
        )}
      </ErrorBoundary>
    </FocusedChartCard>
  );
};

// ---------------------------------------------------------------------------
// Pareto focused content
// ---------------------------------------------------------------------------

const ParetoFocusedContent: React.FC<{
  props: FocusedChartViewProps;
}> = ({ props }) => {
  const header = (
    <>
      <h3 className="text-sm font-semibold text-content uppercase tracking-wider">
        <EditableChartTitle
          defaultTitle={`Pareto: ${props.paretoFactor}`}
          value={props.paretoChartTitle}
          onChange={props.onParetoTitleChange}
        />
      </h3>
      <FactorSelector
        factors={props.factors}
        selected={props.paretoFactor}
        onChange={props.onSetParetoFactor}
        hasActiveFilter={!!props.filters?.[props.paretoFactor]?.length}
        size="md"
      />
    </>
  );

  return (
    <FocusedChartCard
      id="pareto-focus"
      chartName="pareto"
      onExit={props.onExit}
      header={header}
      copyFeedback={props.copyFeedback}
      onCopyChart={props.onCopyChart}
      onDownloadPng={props.onDownloadPng}
      onDownloadSvg={props.onDownloadSvg}
      filterChipData={props.filterChipData}
      columnAliases={props.columnAliases}
      cumulativeVariationPct={props.cumulativeVariationPct}
      showFilterContext={props.displayOptions.showFilterContext !== false}
    >
      <ErrorBoundary componentName="Pareto Chart">
        {props.paretoFactor && (
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
        )}
      </ErrorBoundary>
    </FocusedChartCard>
  );
};

// ---------------------------------------------------------------------------
// Main consolidated component
// ---------------------------------------------------------------------------

const FocusedChartView: React.FC<FocusedChartViewProps> = props => {
  return (
    <FocusedViewOverlay onPrev={props.onPrev} onNext={props.onNext}>
      {props.focusedChart === 'ichart' && <IChartFocusedContent props={props} />}
      {props.focusedChart === 'boxplot' && <BoxplotFocusedContent props={props} />}
      {props.focusedChart === 'pareto' && <ParetoFocusedContent props={props} />}
    </FocusedViewOverlay>
  );
};

export default FocusedChartView;
