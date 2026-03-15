import React from 'react';
import { FocusedViewOverlay, FocusedChartCard } from '../DashboardBase';
import { AnovaResults } from '../AnovaResults';
import { FactorSelector } from '../FactorSelector';
import { HelpTooltip } from '../HelpTooltip';
import { useGlossary } from '../../hooks';
import { ErrorBoundary } from '../ErrorBoundary';
import { EditableChartTitle } from '../EditableChartTitle';
import { Activity } from 'lucide-react';
import type { FocusedChartViewBaseProps } from './types';

// ---------------------------------------------------------------------------
// I-Chart focused section
// ---------------------------------------------------------------------------

const IChartFocusedSection: React.FC<{
  props: FocusedChartViewBaseProps;
}> = ({ props }) => {
  const { ichart, navigation, chartExport, filterContext } = props;
  const { getTerm } = useGlossary();

  const header = (
    <>
      <h2 className="text-xl font-bold flex items-center gap-2 text-content">
        <Activity className="text-blue-400" size={24} />
        <EditableChartTitle
          defaultTitle={`I-Chart: ${ichart.outcome}`}
          value={ichart.chartTitle}
          onChange={ichart.onTitleChange}
        />
        <HelpTooltip term={getTerm('iChart')} iconSize={12} />
      </h2>
      <select
        value={ichart.outcome}
        onChange={e => ichart.onSetOutcome(e.target.value)}
        aria-label="Select outcome variable"
        className="bg-surface border border-edge text-xl font-bold text-content rounded px-3 py-1.5 outline-none focus:border-blue-500"
      >
        {ichart.availableOutcomes.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {ichart.renderHeaderExtra}
      {ichart.findings && ichart.findings.length > 0 && (
        <span className="text-xs text-content-muted px-2 py-0.5 bg-surface-secondary rounded-full">
          {ichart.findings.length} observation{ichart.findings.length !== 1 ? 's' : ''}
        </span>
      )}
    </>
  );

  const headerRight =
    ichart.stageColumn && ichart.stagedStats ? (
      <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
        <span className="text-blue-400 font-medium">
          {ichart.stagedStats.stageOrder.length} stages
        </span>
        <span className="text-content-secondary">
          Overall Mean:{' '}
          <span className="text-content font-mono">
            {ichart.stagedStats.overallStats.mean.toFixed(2)}
          </span>
        </span>
      </div>
    ) : ichart.stats ? (
      <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
        <span className="text-content-secondary flex items-center gap-1">
          UCL: <span className="text-content font-mono">{ichart.stats.ucl.toFixed(2)}</span>
          <HelpTooltip term={getTerm('ucl')} iconSize={12} />
        </span>
        <span className="text-content-secondary flex items-center gap-1">
          Mean: <span className="text-content font-mono">{ichart.stats.mean.toFixed(2)}</span>
          <HelpTooltip term={getTerm('mean')} iconSize={12} />
        </span>
        <span className="text-content-secondary flex items-center gap-1">
          LCL: <span className="text-content font-mono">{ichart.stats.lcl.toFixed(2)}</span>
          <HelpTooltip term={getTerm('lcl')} iconSize={12} />
        </span>
      </div>
    ) : undefined;

  return (
    <FocusedChartCard
      id="ichart-focus"
      chartName="ichart"
      onExit={navigation.onExit}
      header={header}
      headerRight={headerRight}
      {...chartExport}
      filterChipData={filterContext?.filterChipData}
      columnAliases={filterContext?.columnAliases}
      cumulativeVariationPct={filterContext?.cumulativeVariationPct}
      showFilterContext={filterContext?.showFilterContext}
    >
      <ErrorBoundary componentName="I-Chart">{ichart.renderChart()}</ErrorBoundary>
    </FocusedChartCard>
  );
};

// ---------------------------------------------------------------------------
// Boxplot focused section
// ---------------------------------------------------------------------------

const BoxplotFocusedSection: React.FC<{
  props: FocusedChartViewBaseProps;
}> = ({ props }) => {
  const { boxplot, navigation, chartExport, filterContext } = props;
  const { getTerm } = useGlossary();

  const header = (
    <>
      <h3 className="text-sm font-semibold text-content uppercase tracking-wider flex items-center gap-1">
        <EditableChartTitle
          defaultTitle={`Boxplot: ${boxplot.factor}`}
          value={boxplot.chartTitle}
          onChange={boxplot.onTitleChange}
        />
        <HelpTooltip term={getTerm('boxplot')} iconSize={12} />
      </h3>
      <FactorSelector
        factors={boxplot.factors}
        selected={boxplot.factor}
        onChange={boxplot.onSetFactor}
        hasActiveFilter={!!boxplot.filters?.[boxplot.factor]?.length}
        size="md"
        columnAliases={boxplot.columnAliases}
      />
    </>
  );

  const footer = (
    <>
      {boxplot.renderStatsTable?.()}
      {boxplot.anovaResult && (
        <AnovaResults result={boxplot.anovaResult} factorLabel={boxplot.factor} />
      )}
    </>
  );

  return (
    <FocusedChartCard
      id="boxplot-focus"
      chartName="boxplot"
      onExit={navigation.onExit}
      header={header}
      footer={footer}
      className="overflow-hidden"
      {...chartExport}
      filterChipData={filterContext?.filterChipData}
      columnAliases={filterContext?.columnAliases}
      cumulativeVariationPct={filterContext?.cumulativeVariationPct}
      showFilterContext={filterContext?.showFilterContext}
    >
      <ErrorBoundary componentName="Boxplot">{boxplot.renderChart()}</ErrorBoundary>
    </FocusedChartCard>
  );
};

// ---------------------------------------------------------------------------
// Pareto focused section
// ---------------------------------------------------------------------------

const ParetoFocusedSection: React.FC<{
  props: FocusedChartViewBaseProps;
}> = ({ props }) => {
  const { pareto, navigation, chartExport, filterContext } = props;
  const { getTerm } = useGlossary();

  const header = (
    <>
      <h3 className="text-sm font-semibold text-content uppercase tracking-wider flex items-center gap-1">
        <EditableChartTitle
          defaultTitle={`Pareto: ${pareto.factor}`}
          value={pareto.chartTitle}
          onChange={pareto.onTitleChange}
        />
        <HelpTooltip term={getTerm('paretoChart')} iconSize={12} />
      </h3>
      <FactorSelector
        factors={pareto.factors}
        selected={pareto.factor}
        onChange={pareto.onSetFactor}
        hasActiveFilter={!!pareto.filters?.[pareto.factor]?.length}
        size="md"
        columnAliases={pareto.columnAliases}
      />
    </>
  );

  return (
    <FocusedChartCard
      id="pareto-focus"
      chartName="pareto"
      onExit={navigation.onExit}
      header={header}
      {...chartExport}
      filterChipData={filterContext?.filterChipData}
      columnAliases={filterContext?.columnAliases}
      cumulativeVariationPct={filterContext?.cumulativeVariationPct}
      showFilterContext={filterContext?.showFilterContext}
    >
      <ErrorBoundary componentName="Pareto Chart">{pareto.renderChart()}</ErrorBoundary>
    </FocusedChartCard>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const FocusedChartViewBase: React.FC<FocusedChartViewBaseProps> = props => {
  const { navigation } = props;

  return (
    <FocusedViewOverlay onPrev={navigation.onPrev} onNext={navigation.onNext}>
      {navigation.focusedChart === 'ichart' && <IChartFocusedSection props={props} />}
      {navigation.focusedChart === 'boxplot' && <BoxplotFocusedSection props={props} />}
      {navigation.focusedChart === 'pareto' && <ParetoFocusedSection props={props} />}
    </FocusedViewOverlay>
  );
};

export default FocusedChartViewBase;
