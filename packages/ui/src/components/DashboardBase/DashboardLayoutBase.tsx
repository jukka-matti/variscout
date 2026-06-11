import React from 'react';
import { useTranslation } from '@variscout/hooks';
import { Activity, X } from 'lucide-react';
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
import type { ChartObservationCaptureOptions } from '../../types/findingsCallbacks';
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
  // The stage-column + stage-order SELECTS moved to the context line
  // (ProcessHealthBar) in ER-1 Task 2. Only `stageColumn` (read by the
  // staged-stats chip) + `stagedStats` remain here.
  stageColumn: string | null;
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
  /**
   * The active comparison factor setter. ER-2 retired the in-card dropdown;
   * the factor strip drives this (apps wire it onto the strip node via
   * `factorStrip`). Kept here for the app caller contract.
   */
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
    chartType: 'boxplot' | 'pareto' | 'ichart' | 'probability',
    categoryKey?: string,
    noteText?: string,
    anchorX?: number,
    anchorY?: number,
    captureOptions?: ChartObservationCaptureOptions
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
  /** Called when user captures an I-Chart deterministic signal chip */
  onInsightCapture?: (chartType: 'ichart') => void;

  // ---- Render slots (app-specific chart content) ----
  renderIChartContent: React.ReactNode;
  renderBoxplotContent: React.ReactNode;
  renderParetoContent: React.ReactNode;
  renderPIPanel?: React.ReactNode;
  renderFocusedView?: React.ReactNode;
  /** Tabbed verification card (Histogram/ProbPlot) */
  renderVerificationCard?: React.ReactNode;
  /**
   * Segmented control rendered as the Verify card's header title.
   * Replaces the empty title placeholder so the control sits in the card header row.
   */
  verificationCardTitle?: React.ReactNode;
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
  /**
   * Optional ER-2 factor-strip band between the I-Chart hero and the boxplot.
   * The strip's chip clicks drive `setBoxplotFactor` (the dropdown is retired).
   */
  factorStrip?: React.ReactNode;
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
  /**
   * Hold the I-Chart card's plot slot on a ChartSkeleton while its stats are
   * pending (apps pass `!stats || isComputing`). The card paints a skeleton for
   * one rAF on mount regardless; this flag keeps it skeletoned across the async
   * worker round-trip so no blank window shows on tab return.
   */
  ichartLoading?: boolean;
  /** Boxplot observation count */
  boxplotObservationCount?: number;
  /** Pareto observation count */
  paretoObservationCount?: number;
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
  stageColumn,
  stagedStats,
  controlStats: _controlStats,
  getTermUcl: _getTermUcl,
  getTermMean: _getTermMean,
  getTermLcl: _getTermLcl,
  chartTitles,
  onChartTitleChange,
  boxplotFactor,
  // ER-2: factor selection moved to the strip (chip click → app wires
  // setBoxplotFactor onto the strip node). DashboardLayoutBase no longer
  // renders the dropdown, so it no longer consumes the setter directly. The
  // prop stays on the interface for the app callers + Task 4 strip wiring.
  setBoxplotFactor: _setBoxplotFactor,
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
  onInsightCapture,
  renderIChartContent,
  renderBoxplotContent,
  renderParetoContent,
  renderPIPanel,
  renderFocusedView,
  renderVerificationCard,
  verificationCardTitle,
  verificationCardFocusTarget,
  renderSpecEditor,
  ichartTitleSlot,
  ichartExtraControls,
  ichartHeaderExtra,
  factorStrip,
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
  ichartLoading,
  boxplotObservationCount,
  paretoObservationCount,
}) => {
  const { formatStat, t, tf } = useTranslation();
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

        {/* Stage-column + stage-order selects relocated to the context line
            (ProcessHealthBar right cluster) in ER-1 Task 2. The staged-stats
            chips below stay with the I-Chart card. */}

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

  // ER-2: the boxplot factor dropdown is RETIRED — the factor strip above the
  // boxplot owns factor selection (chip click → setBoxplotFactor). The card
  // title now reflects the active comparison ("<outcome> by <factor>").
  const outcomeLabel = columnAliases[outcome] ?? outcome;
  const boxplotCardTitle = boxplotFactor
    ? tf('boxplot.title.by', {
        outcome: outcomeLabel,
        factor: columnAliases[boxplotFactor] ?? boxplotFactor,
      })
    : outcomeLabel;

  // ---- Boxplot controls (display toggle + clear) ----
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
            : onInsightCapture && chartType === 'ichart' && isIChartSignalInsight(insight.chipText)
              ? () => onInsightCapture(chartType)
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
          factorStrip={factorStrip}
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
              isLoading={ichartLoading}
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
                      defaultTitle={boxplotCardTitle}
                      value={chartTitles.boxplot || ''}
                      onChange={title => onChartTitleChange('boxplot', title)}
                    />
                  </h3>
                  <span className="text-xs text-content-muted normal-case font-normal truncate">
                    {t('boxplot.factor.hint')}
                  </span>
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
                title={verificationCardTitle ?? <></>}
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

function isIChartSignalInsight(chipText: string): boolean {
  return chipText.startsWith('Process shift:') || chipText.startsWith('Trend detected:');
}

export default DashboardLayoutBase;
