import React from 'react';
import { useTranslation } from '@variscout/hooks';
import { Activity, Layers, X } from 'lucide-react';
import { EditableChartTitle } from '../EditableChartTitle';
import { FactorSelector } from '../FactorSelector';
import { FilterContextBar } from '../FilterContextBar';
import { BoxplotDisplayToggle } from '../BoxplotDisplayToggle';
import { ChartInsightChip } from '../ChartInsightChip';
import { AnnotationContextMenu } from '../AnnotationContextMenu';
import DashboardChartCard from './DashboardChartCard';
import DashboardGrid from './DashboardGrid';
import type { HighlightColor } from '../ChartAnnotationLayer/types';
import type { UseChartInsightsReturn, ChartTitles } from '@variscout/hooks';
import type { FilterChipData } from '../filterTypes';
import type { GlossaryTerm } from '@variscout/core';

// ---------- Annotations shape ----------
export interface DashboardAnnotations {
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    categoryKey: string;
    chartType: 'boxplot' | 'pareto';
  };
  handleContextMenu: (
    chartType: 'boxplot' | 'pareto',
    key: string,
    event: React.MouseEvent
  ) => void;
  closeContextMenu: () => void;
  boxplotHighlights: Record<string, HighlightColor>;
  paretoHighlights: Record<string, HighlightColor>;
  setHighlight: (
    chartType: 'boxplot' | 'pareto',
    key: string,
    color: HighlightColor | undefined
  ) => void;
  hasAnnotations: boolean;
  clearAnnotations: (chartType: 'boxplot' | 'pareto' | 'ichart') => void;
}

// ---------- Chart findings ----------
export interface DashboardChartFindings {
  boxplot: Array<{ id: string; source?: { chart?: string; category?: string } }>;
  pareto: Array<{ id: string; source?: { chart?: string; category?: string } }>;
  ichart: Array<{ id: string }>;
}

// ---------- Stats shape (minimal for controls display) ----------
interface DashboardControlStats {
  ucl: number;
  lcl: number;
  mean: number;
}

// ---------- Staged stats shape ----------
interface DashboardStagedStats {
  stageOrder: string[];
  overallStats: { mean: number };
}

// ---------- Main props ----------
export interface DashboardLayoutBaseProps {
  // ---- Data & state ----
  outcome: string;
  factors: string[];
  columnAliases: Record<string, string>;
  filters: Record<string, (string | number)[]>;

  // ---- Display options ----
  showFilterContext: boolean;
  showViolin: boolean;
  boxplotSortBy: string;
  boxplotSortDirection: string;
  onDisplayOptionChange: (key: string, value: unknown) => void;

  // ---- Outcome selector ----
  availableOutcomes: string[];
  setOutcome: (o: string) => void;

  // ---- Stage controls ----
  availableStageColumns: string[];
  stageColumn: string | null;
  setStageColumn: (c: string | null) => void;
  stageOrderMode: 'auto' | 'data-order' | string;
  setStageOrderMode: (m: 'auto' | 'data-order') => void;
  stagedStats: DashboardStagedStats | null;
  controlStats: DashboardControlStats | null;

  // ---- Glossary terms for control stats ----
  getTermUcl?: GlossaryTerm | undefined;
  getTermMean?: GlossaryTerm | undefined;
  getTermLcl?: GlossaryTerm | undefined;

  // ---- Chart titles ----
  chartTitles: ChartTitles;
  onChartTitleChange: (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => void;

  // ---- Factor selectors ----
  boxplotFactor: string;
  setBoxplotFactor: (f: string) => void;
  paretoFactor: string;
  setParetoFactor: (f: string) => void;

  // ---- Pareto controls ----
  showParetoPanel: boolean;

  // ---- Focus mode ----
  focusedChart: 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'probability-plot' | string | null;
  setFocusedChart: (
    c: 'ichart' | 'boxplot' | 'pareto' | 'histogram' | 'probability-plot' | null
  ) => void;

  // ---- Filter context bar data ----
  filterChipData: FilterChipData[];

  // ---- Annotations ----
  annotations: DashboardAnnotations;

  // ---- Chart findings ----
  chartFindings?: DashboardChartFindings;
  /** Called when user adds an observation from the context menu (chartType + categoryKey) */
  onAddChartObservation?: (
    chartType: 'boxplot' | 'pareto' | 'ichart',
    categoryKey?: string
  ) => void;

  // ---- Chart export ----
  copyFeedback: string | null;
  onCopyChart: (containerId: string, chartName: string) => Promise<void>;
  onDownloadPng: (containerId: string, chartName: string) => Promise<void>;
  onDownloadSvg: (containerId: string, chartName: string) => void;

  // ---- Chart insights ----
  ichartInsight: UseChartInsightsReturn;
  boxplotInsight: UseChartInsightsReturn;
  paretoInsight: UseChartInsightsReturn;
  statsInsight: UseChartInsightsReturn;
  /** Called when user clicks an actionable insight chip (e.g., drill suggestion) */
  onInsightAction?: (factor: string, value?: string) => void;

  // ---- Render slots (app-specific chart content) ----
  renderIChartContent: React.ReactNode;
  renderBoxplotContent: React.ReactNode;
  renderParetoContent: React.ReactNode;
  renderPIPanel?: React.ReactNode;
  renderFocusedView?: React.ReactNode;
  /** Tabbed verification card (Histogram/ProbPlot) */
  renderVerificationCard?: React.ReactNode;
  /** Focus target for the adaptive right-hand lens */
  verificationCardFocusTarget?: 'histogram' | 'probability-plot' | 'pareto' | null;

  // ---- Spec editor ----
  renderSpecEditor?: React.ReactNode;

  // ---- Optional overrides / extensions ----
  /** Override I-Chart title (PWA: icon + branding) */
  ichartTitleSlot?: React.ReactNode;
  /** Extra controls after stage selector (e.g. SpecEditor trigger) */
  ichartExtraControls?: React.ReactNode;
  /** Extra controls after Manage Factors in I-Chart header (Azure: inline manage button) */
  ichartHeaderExtra?: React.ReactNode;
  /** Wrap boxplot FactorSelector (Azure: lastAdvancedFactor ring) */
  boxplotFactorWrapper?: (selector: React.ReactNode) => React.ReactNode;
  /** Share chart callback (Azure only) */
  onShareChart?: (chartName: string) => void;
  /** Stats panel click handler (PWA embed mode) */
  onPIPanelClick?: () => void;
  /** Stats panel highlight class (PWA embed mode) */
  piPanelHighlightClass?: string;
  /** I-Chart card highlight class (PWA embed mode) */
  ichartHighlightClass?: string;
  /** I-Chart card click (PWA embed mode) */
  onIChartCardClick?: () => void;
  /** Boxplot card highlight class */
  boxplotHighlightClass?: string;
  /** Boxplot card click */
  onBoxplotCardClick?: () => void;
  /** Pareto card highlight class */
  paretoHighlightClass?: string;
  /** Pareto card click */
  onParetoCardClick?: () => void;
  /** I-Chart observation count */
  ichartObservationCount?: number;
  /** Boxplot observation count */
  boxplotObservationCount?: number;
  /** Pareto observation count */
  paretoObservationCount?: number;
  /** Dashboard layout mode: 'grid' (viewport-fit) or 'scroll' (stacked) */
  layout?: 'grid' | 'scroll';
}

/**
 * DashboardLayoutBase — Shared presentational layout for the analysis dashboard.
 *
 * Composes DashboardGrid + DashboardChartCard instances with title/controls/filterBar/footer slots.
 * Does NOT call any hooks — all data and callbacks come via props.
 * Apps inject chart rendering via renderXxxContent slots.
 */
const DashboardLayoutBase: React.FC<DashboardLayoutBaseProps> = ({
  outcome,
  factors,
  columnAliases,
  filters,
  showFilterContext,
  showViolin,
  boxplotSortBy,
  boxplotSortDirection,
  onDisplayOptionChange,
  availableOutcomes,
  setOutcome,
  availableStageColumns,
  stageColumn,
  setStageColumn,
  stageOrderMode,
  setStageOrderMode,
  stagedStats,
  controlStats: _controlStats,
  getTermUcl: _getTermUcl,
  getTermMean: _getTermMean,
  getTermLcl: _getTermLcl,
  chartTitles,
  onChartTitleChange,
  boxplotFactor,
  setBoxplotFactor,
  paretoFactor,
  setParetoFactor,
  showParetoPanel,
  focusedChart,
  setFocusedChart,
  filterChipData,
  annotations,
  chartFindings,
  onAddChartObservation,
  copyFeedback,
  onCopyChart,
  onDownloadPng,
  onDownloadSvg,
  ichartInsight,
  boxplotInsight: _boxplotInsight,
  paretoInsight: _paretoInsight,
  statsInsight,
  onInsightAction,
  renderIChartContent,
  renderBoxplotContent,
  renderParetoContent,
  renderPIPanel,
  renderFocusedView,
  renderVerificationCard,
  verificationCardFocusTarget,
  renderSpecEditor,
  ichartTitleSlot,
  ichartExtraControls,
  ichartHeaderExtra,
  boxplotFactorWrapper,
  onShareChart,
  onPIPanelClick,
  piPanelHighlightClass,
  ichartHighlightClass,
  onIChartCardClick,
  boxplotHighlightClass,
  onBoxplotCardClick,
  paretoHighlightClass,
  onParetoCardClick,
  ichartObservationCount,
  boxplotObservationCount,
  paretoObservationCount,
  layout,
}) => {
  const { formatStat, t } = useTranslation();
  const {
    contextMenu,
    closeContextMenu,
    boxplotHighlights,
    paretoHighlights,
    setHighlight,
    hasAnnotations,
    clearAnnotations,
  } = annotations;

  // ---- Shared filter bar for each card ----
  const filterBar = (
    <FilterContextBar
      filterChipData={filterChipData}
      columnAliases={columnAliases}
      show={showFilterContext}
    />
  );

  // ---- I-Chart title (default or override) ----
  const ichartTitle = ichartTitleSlot ?? (
    <h2 className="text-xl font-bold flex items-center gap-2 text-content">
      <Activity className="text-blue-400" />
      <EditableChartTitle
        defaultTitle={`I-Chart: ${outcome}`}
        value={chartTitles.ichart || ''}
        onChange={title => onChartTitleChange('ichart', title)}
      />
    </h2>
  );

  // ---- I-Chart controls ----
  const ichartControls = (
    <>
      <div className="flex items-center gap-4" data-export-hide>
        <select
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          aria-label="Select outcome variable"
          className="bg-surface border border-edge text-sm font-medium text-content rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
        >
          {availableOutcomes.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        {availableStageColumns.length > 0 && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-edge">
            <Layers
              size={16}
              className={availableStageColumns.length > 0 ? 'text-blue-400' : 'text-content-muted'}
            />
            <select
              value={stageColumn || ''}
              onChange={e => setStageColumn(e.target.value || null)}
              className="bg-surface border border-edge text-sm text-content rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
              title="Select a column to divide the chart into stages"
              aria-label="Select stage column"
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
                onChange={e => setStageOrderMode(e.target.value as 'auto' | 'data-order')}
                className="bg-surface border border-edge text-xs text-content-secondary rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
                aria-label="Stage order mode"
              >
                <option value="auto">Auto order</option>
                <option value="data-order">As in data</option>
              </select>
            )}
          </div>
        )}

        {ichartHeaderExtra}

        {stageColumn && stagedStats && (
          <div
            className="flex items-center gap-2 ml-2 pl-2 border-l border-edge"
            data-testid="staged-stats-chips"
          >
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5 whitespace-nowrap">
              {stagedStats.stageOrder.length} stages
            </span>
            <span className="text-xs text-content-secondary whitespace-nowrap">
              Mean:{' '}
              <span className="font-mono text-content">
                {formatStat(stagedStats.overallStats.mean)}
              </span>
            </span>
          </div>
        )}
      </div>
      {ichartExtraControls}
    </>
  );

  // ---- Boxplot factor dropdown (inline in title row) ----
  const boxplotFactorDropdown =
    factors.length > 0 ? (
      <FactorSelector
        variant="dropdown"
        factors={factors}
        selected={boxplotFactor}
        onChange={setBoxplotFactor}
        hasActiveFilter={!!filters?.[boxplotFactor]?.length}
        columnAliases={columnAliases}
        label={t('boxplot.factor.label')}
        testId="boxplot-factor-dropdown"
      />
    ) : null;

  const wrappedBoxplotFactor = boxplotFactorWrapper
    ? boxplotFactorWrapper(boxplotFactorDropdown)
    : boxplotFactorDropdown;

  // ---- Boxplot controls (display toggle + clear — factor dropdown moved to title row) ----
  const boxplotControls = boxplotFactor ? (
    <>
      <BoxplotDisplayToggle
        showViolin={showViolin}
        onToggleViolin={value => onDisplayOptionChange('showViolin', value)}
        sortBy={boxplotSortBy as 'name' | 'mean' | 'spread'}
        sortDirection={boxplotSortDirection as 'asc' | 'desc'}
        onSortChange={(sortBy, direction) => {
          onDisplayOptionChange('boxplotSortBy', sortBy);
          onDisplayOptionChange('boxplotSortDirection', direction);
        }}
      />
      {hasAnnotations && (
        <button
          onClick={() => clearAnnotations('boxplot')}
          className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-surface-tertiary transition-colors"
          title="Clear boxplot highlights"
          aria-label="Clear boxplot highlights"
        >
          <X size={12} />
        </button>
      )}
    </>
  ) : null;

  // ---- Pareto controls ----
  const paretoControls = (
    <>
      <FactorSelector
        variant="tabs"
        factors={factors}
        selected={paretoFactor}
        onChange={setParetoFactor}
        hasActiveFilter={!!filters?.[paretoFactor]?.length}
        columnAliases={columnAliases}
      />
      {paretoHighlights && Object.keys(paretoHighlights).length > 0 && (
        <button
          onClick={() => clearAnnotations('pareto')}
          className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-surface-tertiary transition-colors"
          title="Clear pareto highlights"
          aria-label="Clear pareto highlights"
        >
          <X size={12} />
        </button>
      )}
    </>
  );

  // ---- Insight chip helper ----
  const renderInsightChip = (insight: UseChartInsightsReturn, chartType: string) =>
    insight.chipText ? (
      <ChartInsightChip
        text={insight.chipText}
        chipType={insight.chipType}
        isAI={insight.isAI}
        isLoading={insight.isLoading}
        onDismiss={insight.dismiss}
        chartType={chartType}
        onAction={
          insight.action && onInsightAction
            ? () => onInsightAction(insight.action!.factor, insight.action!.value)
            : undefined
        }
      />
    ) : undefined;

  // ---- Annotation context menu hasFinding check ----
  const contextMenuHasFinding = (() => {
    if (!chartFindings || !contextMenu.isOpen) return false;
    const findings =
      contextMenu.chartType === 'boxplot' ? chartFindings.boxplot : chartFindings.pareto;
    return findings.some(
      f => f.source && f.source.chart !== 'ichart' && f.source.category === contextMenu.categoryKey
    );
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {focusedChart && renderFocusedView ? (
        renderFocusedView
      ) : (
        <DashboardGrid
          layout={layout}
          ichartCard={
            <DashboardChartCard
              id="ichart-card"
              testId="chart-ichart"
              chartName="ichart"
              minHeight={undefined}
              highlightClass={ichartHighlightClass}
              onClick={onIChartCardClick}
              onMaximize={() => setFocusedChart('ichart')}
              copyFeedback={copyFeedback}
              onCopyChart={onCopyChart}
              onDownloadPng={onDownloadPng}
              onDownloadSvg={onDownloadSvg}
              onShareChart={onShareChart}
              observationCount={ichartObservationCount}
              utilityActions="maximize-only"
              title={ichartTitle}
              controls={ichartControls}
              filterBar={filterBar}
              footer={renderInsightChip(ichartInsight, 'ichart')}
            >
              {renderIChartContent}
            </DashboardChartCard>
          }
          boxplotCard={
            <DashboardChartCard
              id="boxplot-card"
              testId="chart-boxplot"
              chartName="boxplot"
              className="flex-1 min-w-[300px] min-h-0"
              highlightClass={boxplotHighlightClass}
              onClick={onBoxplotCardClick}
              onMaximize={() => setFocusedChart('boxplot')}
              copyFeedback={copyFeedback}
              onCopyChart={onCopyChart}
              onDownloadPng={onDownloadPng}
              onDownloadSvg={onDownloadSvg}
              onShareChart={onShareChart}
              observationCount={boxplotObservationCount}
              utilityActions="maximize-only"
              title={
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider min-w-0">
                    <EditableChartTitle
                      defaultTitle={boxplotFactor ? 'Variation Sources' : 'Variation Sources'}
                      value={chartTitles.boxplot || ''}
                      onChange={title => onChartTitleChange('boxplot', title)}
                    />
                  </h3>
                  {wrappedBoxplotFactor}
                </div>
              }
              controls={boxplotControls}
              filterBar={filterBar}
              /* footer={renderInsightChip(boxplotInsight, 'boxplot')} — hidden: toolbar projection provides this insight */
            >
              {renderBoxplotContent}
            </DashboardChartCard>
          }
          paretoCard={
            showParetoPanel ? (
              <DashboardChartCard
                id="pareto-card"
                testId="chart-pareto"
                chartName="pareto"
                className="flex-1 min-w-[300px] min-h-0"
                highlightClass={paretoHighlightClass}
                onClick={onParetoCardClick}
                onMaximize={() => setFocusedChart('pareto')}
                copyFeedback={copyFeedback}
                onCopyChart={onCopyChart}
                onDownloadPng={onDownloadPng}
                onDownloadSvg={onDownloadSvg}
                onShareChart={onShareChart}
                observationCount={paretoObservationCount}
                utilityActions="maximize-only"
                title={
                  <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    <EditableChartTitle
                      defaultTitle={`Pareto: ${paretoFactor}`}
                      value={chartTitles.pareto || ''}
                      onChange={title => onChartTitleChange('pareto', title)}
                    />
                  </h3>
                }
                controls={paretoControls}
                filterBar={filterBar}
                /* footer={renderInsightChip(paretoInsight, 'pareto')} — hidden: toolbar projection provides this insight */
              >
                {renderParetoContent}
              </DashboardChartCard>
            ) : undefined
          }
          piPanel={
            renderPIPanel ? (
              <div
                data-testid="chart-stats"
                onClick={onPIPanelClick}
                className={
                  piPanelHighlightClass ? `transition-all ${piPanelHighlightClass}` : undefined
                }
              >
                {renderPIPanel}
                {renderInsightChip(statsInsight, 'stats')}
              </div>
            ) : undefined
          }
          verificationCard={
            renderVerificationCard ? (
              <DashboardChartCard
                id="verification-card"
                testId="chart-verification"
                chartName="verification"
                className="flex-1 min-w-[250px] min-h-0"
                onMaximize={() => setFocusedChart(verificationCardFocusTarget ?? 'histogram')}
                copyFeedback={copyFeedback}
                onCopyChart={onCopyChart}
                onDownloadPng={onDownloadPng}
                onDownloadSvg={onDownloadSvg}
                onShareChart={onShareChart}
                utilityActions="maximize-only"
                title={<></>}
              >
                {renderVerificationCard}
              </DashboardChartCard>
            ) : undefined
          }
        />
      )}

      {/* Annotation Context Menu overlay */}
      {contextMenu.isOpen && (
        <AnnotationContextMenu
          categoryKey={contextMenu.categoryKey}
          currentHighlight={
            contextMenu.chartType === 'boxplot'
              ? boxplotHighlights[contextMenu.categoryKey]
              : paretoHighlights[contextMenu.categoryKey]
          }
          hasFinding={contextMenuHasFinding}
          position={contextMenu.position}
          onSetHighlight={color =>
            setHighlight(contextMenu.chartType, contextMenu.categoryKey, color)
          }
          onAddObservation={() =>
            onAddChartObservation?.(contextMenu.chartType, contextMenu.categoryKey)
          }
          onClose={closeContextMenu}
        />
      )}

      {/* Spec Editor overlay */}
      {renderSpecEditor}
    </div>
  );
};

export default DashboardLayoutBase;
