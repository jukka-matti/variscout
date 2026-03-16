import React, { useState, useCallback, useEffect, useMemo } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import MobileChartCarousel from './MobileChartCarousel';
import PerformanceDashboard from './PerformanceDashboard';
import SpecEditor from './settings/SpecEditor';
import FocusedChartView from './views/FocusedChartView';
import PresentationView from './views/PresentationView';
import ReportView from './views/ReportView';
import { useData } from '../context/DataContext';
import { useDashboardCharts } from '../hooks';
import type { UseFilterNavigationReturn } from '../hooks';
import {
  ErrorBoundary,
  FilterBreadcrumb,
  NarrativeBar,
  SelectionPanel,
  CreateFactorModal,
  DashboardLayoutBase,
  useIsMobile,
  useGlossary,
  BREAKPOINTS,
} from '@variscout/ui';
import { getColumnNames } from '@variscout/core';
import type { FindingsCallbacks } from '../types/findingsCallbacks';
import {
  useAnnotations,
  useChartInsights,
  useFilterHandlers,
  useCreateFactorModal,
} from '@variscout/hooks';
import {
  getNelsonRule2Sequences,
  getNelsonRule3Sequences,
  getNextDrillFactor,
} from '@variscout/core';
import type { AIContext } from '@variscout/core';
import type { ViewState } from '@variscout/hooks';
import {
  Activity,
  BarChart3,
  Gauge,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Settings2,
} from 'lucide-react';

type DashboardTab = 'analysis' | 'performance';

interface DashboardProps {
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  drillFromPerformance?: string | null;
  onBackToPerformance?: () => void;
  onDrillToMeasure?: (measureId: string) => void;
  filterNav?: UseFilterNavigationReturn;
  /** Initial view state from persistence (tab, focused chart, factors) */
  initialViewState?: ViewState;
  /** Report view state changes for persistence */
  onViewStateChange?: (partial: Partial<ViewState>) => void;
  /** Whether presentation mode is active */
  isPresentationMode?: boolean;
  /** Callback to exit presentation mode */
  onExitPresentation?: () => void;
  /** Whether report view is active */
  isReportOpen?: boolean;
  /** Callback to close report view */
  onCloseReport?: () => void;
  /** Callback to open ColumnMapping in re-edit mode for factor management */
  onManageFactors?: () => void;
  /** Callback to pin current filter state as a finding (optional note text) */
  onPinFinding?: (noteText?: string) => void;
  /** Callback to share a chart via deep link */
  onShareChart?: (chartType: string) => void;
  /** Grouped findings-related callbacks */
  findingsCallbacks?: FindingsCallbacks;
  /** AI-enhanced chart insight fetch function (from Editor) */
  fetchChartInsight?: (userPrompt: string) => Promise<string>;
  /** AI context for chart insights */
  aiContext?: AIContext | null;
  /** Whether AI is enabled */
  aiEnabled?: boolean;
  /** AI narration state */
  narrative?: string | null;
  narrativeLoading?: boolean;
  narrativeCached?: boolean;
  narrativeError?: string | null;
  onNarrativeAsk?: () => void;
  onNarrativeRetry?: () => void;
  /** Ask CoScout about a category (from MobileCategorySheet) */
  onAskCoScoutFromCategory?: (focusContext: {
    chartType: 'boxplot' | 'pareto';
    category: { name: string; mean?: number; contributionPct?: number };
  }) => void;
}

const Dashboard = ({
  onPointClick,
  highlightedPointIndex,
  drillFromPerformance,
  onBackToPerformance,
  onDrillToMeasure,
  filterNav: externalFilterNav,
  initialViewState,
  onViewStateChange,
  isPresentationMode,
  onExitPresentation,
  isReportOpen,
  onCloseReport,
  onManageFactors,
  onPinFinding,
  onShareChart,
  findingsCallbacks,
  fetchChartInsight,
  aiContext,
  aiEnabled,
  narrative,
  narrativeLoading,
  narrativeCached,
  narrativeError,
  onNarrativeAsk,
  onNarrativeRetry,
  onAskCoScoutFromCategory,
}: DashboardProps) => {
  const { onAddChartObservation, chartFindings, onEditFinding, onDeleteFinding } =
    findingsCallbacks ?? {};
  const {
    outcome,
    factors,
    setOutcome,
    rawData,
    setRawData,
    stats,
    specs,
    setSpecs,
    filteredData,
    filters,
    setFilters,
    isPerformanceMode,
    columnAliases,
    stageColumn,
    stageOrderMode,
    stagedStats,
    setStageColumn,
    setStageOrderMode,
    paretoAggregation,
    setParetoAggregation,
    chartTitles,
    timeColumn,
    displayOptions,
    setDisplayOptions,
    selectedPoints,
    clearSelection,
  } = useData();
  const { getTerm } = useGlossary();
  const isPhone = useIsMobile(BREAKPOINTS.phone);

  const [activeTab, setActiveTabRaw] = useState<DashboardTab>(
    initialViewState?.activeTab ?? 'analysis'
  );
  const [showSpecEditor, setShowSpecEditor] = useState(false);

  // Wrap setActiveTab to report changes for persistence
  const setActiveTab = useCallback(
    (tab: DashboardTab) => {
      setActiveTabRaw(tab);
      onViewStateChange?.({ activeTab: tab });
    },
    [onViewStateChange]
  );

  // Initialize focused chart from persisted view state (one-time on mount)
  const [hasRestoredFocusedChart, setHasRestoredFocusedChart] = useState(false);

  // Auto-switch to analysis tab when drilling from performance mode
  useEffect(() => {
    if (drillFromPerformance) {
      setActiveTab('analysis');
    }
  }, [drillFromPerformance, setActiveTab]);

  // Chart state and logic from the hook
  const {
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    showParetoPanel,
    setShowParetoPanel,
    showParetoComparison,
    setShowParetoComparison,
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    cumulativeVariationPct,
    filterChipData,
    factorVariations,
    categoryContributions,
    lastAdvancedFactor,
    clearFilters,
    updateFilterValues,
    removeFilter,
    handleDrillDown,
    handleChartTitleChange,
  } = useDashboardCharts({
    externalFilterNav,
    initialBoxplotFactor: initialViewState?.boxplotFactor,
    initialParetoFactor: initialViewState?.paretoFactor,
    onViewStateChange,
  });

  // Restore persisted focused chart (one-time after hook initializes)
  useEffect(() => {
    if (!hasRestoredFocusedChart && initialViewState?.focusedChart) {
      setFocusedChart(initialViewState.focusedChart);
      setHasRestoredFocusedChart(true);
    } else if (!hasRestoredFocusedChart) {
      setHasRestoredFocusedChart(true);
    }
  }, [hasRestoredFocusedChart, initialViewState?.focusedChart, setFocusedChart]);

  // Report focused chart changes for persistence
  useEffect(() => {
    if (hasRestoredFocusedChart) {
      onViewStateChange?.({ focusedChart });
    }
  }, [focusedChart, hasRestoredFocusedChart, onViewStateChange]);

  // Annotations (right-click context menu for highlights, no mode toggle)
  const {
    hasAnnotations,
    clearAnnotations,
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    boxplotHighlights,
    paretoHighlights,
    setHighlight,
  } = useAnnotations({ displayOptions, setDisplayOptions });

  // Keyboard: clear selection on Escape (complement to hook's focused-mode ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPoints.size > 0) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPoints, clearSelection]);

  // Shared filter handler callbacks
  const { handleClearAllFilters, handleRemoveFilter, handleUpdateFilterValues } = useFilterHandlers(
    {
      clearFilters,
      removeFilter,
      updateFilterValues,
    }
  );

  // Create Factor modal state and handlers
  const {
    showCreateFactorModal,
    handleOpenCreateFactorModal,
    handleCloseCreateFactorModal,
    handleCreateFactor,
  } = useCreateFactorModal({
    rawData,
    selectedPoints,
    filters,
    setRawData,
    setFilters,
    clearSelection,
  });

  // --- Chart Insight Chips (AI-enhanced when available) ---
  const ichartInsight = useChartInsights({
    chartType: 'ichart',
    aiEnabled: aiEnabled ?? false,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(() => {
      if (!stats || !filteredData.length || !outcome) return {};
      const values = filteredData
        .map(r => {
          const v = r[outcome];
          return typeof v === 'number' ? v : parseFloat(String(v));
        })
        .filter(v => !isNaN(v));
      const sequences = getNelsonRule2Sequences(values, stats.mean);
      const rule3Sequences = getNelsonRule3Sequences(values);
      const ooc = values.filter(v => v > stats.ucl || v < stats.lcl).length;
      return {
        nelsonSequences: sequences,
        nelsonRule3Sequences: rule3Sequences,
        outOfControlCount: ooc,
        totalPoints: values.length,
      };
    }, [filteredData, outcome, stats]),
  });

  const boxplotInsight = useChartInsights({
    chartType: 'boxplot',
    aiEnabled: aiEnabled ?? false,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(
      () => ({
        factorVariations,
        currentFactor: boxplotFactor,
        nextDrillFactor: getNextDrillFactor(factorVariations, boxplotFactor),
      }),
      [factorVariations, boxplotFactor]
    ),
  });

  const paretoInsight = useChartInsights({
    chartType: 'pareto',
    aiEnabled: aiEnabled ?? false,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(() => {
      const innerMap = categoryContributions?.get(paretoFactor);
      const converted = innerMap
        ? new Map([...innerMap.entries()].map(([k, v]) => [String(k), v]))
        : undefined;
      return {
        categoryContributions: converted,
        categoryCount: innerMap?.size ?? 0,
        paretoFactor,
      };
    }, [categoryContributions, paretoFactor]),
  });

  const statsInsight = useChartInsights({
    chartType: 'stats',
    aiEnabled: aiEnabled ?? false,
    aiContext: aiContext ?? null,
    fetchInsight: fetchChartInsight,
    deterministicData: useMemo(
      () => ({
        cpk: stats?.cpk,
        cp: stats?.cp,
        cpkTarget: 1.33,
        passRate: stats ? 100 - stats.outOfSpecPercentage : undefined,
        hasSpecs: !!(specs?.usl !== undefined || specs?.lsl !== undefined),
      }),
      [stats, specs]
    ),
  });

  if (!outcome) return null;

  if (isReportOpen && onCloseReport) {
    return (
      <ReportView
        onClose={onCloseReport}
        aiEnabled={aiEnabled}
        narrative={narrative}
        stagedComparison={Boolean(stagedStats)}
      />
    );
  }

  if (isPresentationMode && onExitPresentation) {
    return (
      <PresentationView
        onExit={onExitPresentation}
        boxplotFactor={boxplotFactor}
        paretoFactor={paretoFactor}
        factorVariations={factorVariations}
        categoryContributions={categoryContributions}
        showParetoComparison={showParetoComparison}
        onToggleParetoComparison={() => setShowParetoComparison(!showParetoComparison)}
        paretoAggregation={paretoAggregation}
        onToggleParetoAggregation={() =>
          setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
        }
      />
    );
  }

  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto bg-surface relative"
    >
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-surface">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            {/* On phone, FilterBreadcrumb is handled inside MobileChartCarousel */}
            {!isPhone && (
              <FilterBreadcrumb
                filterChipData={filterChipData}
                columnAliases={columnAliases}
                onUpdateFilterValues={handleUpdateFilterValues}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                cumulativeVariationPct={cumulativeVariationPct}
                onPinFinding={onPinFinding}
              />
            )}
          </div>
          {activeTab === 'analysis' && !focusedChart && !isPhone && (
            <div className="flex items-center gap-1 px-3 flex-shrink-0" data-export-hide>
              <button
                onClick={() => handleCopyChart('dashboard-export-container', 'dashboard')}
                className={`p-1.5 rounded transition-all ${
                  copyFeedback === 'dashboard'
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-content-muted hover:text-content hover:bg-surface-tertiary'
                }`}
                title="Copy dashboard to clipboard"
                aria-label="Copy dashboard to clipboard"
              >
                {copyFeedback === 'dashboard' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => handleDownloadPng('dashboard-export-container', 'dashboard')}
                className="p-1.5 rounded text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
                title="Download dashboard as PNG"
                aria-label="Download dashboard as PNG"
              >
                <Download size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Selection Panel (desktop only — multi-point selection is a desktop feature) */}
        {!isPhone && selectedPoints.size > 0 && (
          <SelectionPanel
            selectedIndices={selectedPoints}
            data={filteredData}
            outcome={outcome}
            columnAliases={columnAliases}
            factors={factors}
            timeColumn={timeColumn}
            onClearSelection={clearSelection}
            onCreateFactor={handleOpenCreateFactorModal}
          />
        )}

        {/* Tab Navigation */}
        <div
          className="flex-none flex items-center gap-2 px-4 pt-4 pb-2"
          role="tablist"
          aria-label="Dashboard tabs"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'analysis'}
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white'
                : 'bg-surface-secondary text-content-secondary hover:text-content hover:bg-surface-tertiary'
            }`}
          >
            <BarChart3 size={16} />
            Analysis
          </button>
          {isPerformanceMode && (
            <button
              role="tab"
              aria-selected={activeTab === 'performance'}
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-secondary text-content-secondary hover:text-content hover:bg-surface-tertiary'
              }`}
            >
              <Gauge size={16} />
              Performance
            </button>
          )}
        </div>
      </div>

      {/* Create Factor Modal */}
      <CreateFactorModal
        isOpen={showCreateFactorModal}
        onClose={handleCloseCreateFactorModal}
        selectedCount={selectedPoints.size}
        existingFactors={getColumnNames(rawData)}
        onCreateFactor={handleCreateFactor}
      />

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary componentName="Performance Dashboard">
            <PerformanceDashboard onDrillToMeasure={onDrillToMeasure} />
          </ErrorBoundary>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Back to Performance banner */}
          {drillFromPerformance && onBackToPerformance && (
            <div className="flex items-center justify-between px-4 py-2 bg-blue-600/20 border-b border-blue-600/30">
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Activity size={14} />
                <span>
                  Viewing: <span className="font-medium text-content">{drillFromPerformance}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  onBackToPerformance?.();
                  setActiveTab('performance');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-300 hover:text-content hover:bg-blue-600/30 rounded transition-colors"
              >
                <ArrowLeft size={12} />
                Back to Performance
              </button>
            </div>
          )}

          {isPhone ? (
            <MobileChartCarousel
              factorState={{
                boxplotFactor,
                paretoFactor,
                factors,
                onSetBoxplotFactor: setBoxplotFactor,
                onSetParetoFactor: setParetoFactor,
              }}
              filterContext={{
                filters,
                columnAliases,
                filterChipData,
                cumulativeVariationPct,
                onUpdateFilterValues: handleUpdateFilterValues,
                onRemoveFilter: handleRemoveFilter,
                onClearAllFilters: handleClearAllFilters,
              }}
              paretoOptions={{
                paretoAggregation,
                onToggleParetoAggregation: () =>
                  setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count'),
                showParetoComparison,
                onToggleParetoComparison: () => setShowParetoComparison(!showParetoComparison),
              }}
              highlights={{
                boxplotHighlights,
                paretoHighlights,
                onSetHighlight: setHighlight,
              }}
              onDrillDown={handleDrillDown}
              factorVariations={factorVariations}
              categoryContributions={categoryContributions}
              stats={stats}
              specs={specs}
              filteredData={filteredData}
              outcome={outcome}
              onSaveSpecs={setSpecs}
              showCpk={displayOptions.showCpk !== false}
              anovaResult={anovaResult}
              onPinFinding={onPinFinding}
              boxplotData={boxplotData}
              findingsCallbacks={findingsCallbacks}
              onAskCoScout={onAskCoScoutFromCategory}
            />
          ) : (
            <DashboardLayoutBase
              outcome={outcome}
              factors={factors}
              columnAliases={columnAliases}
              filters={filters}
              showFilterContext={displayOptions.showFilterContext !== false}
              showViolin={displayOptions.showViolin ?? false}
              showContributionLabels={displayOptions.showContributionLabels ?? false}
              boxplotSortBy={displayOptions.boxplotSortBy ?? 'name'}
              boxplotSortDirection={displayOptions.boxplotSortDirection ?? 'asc'}
              onDisplayOptionChange={(key, value) =>
                setDisplayOptions({ ...displayOptions, [key]: value })
              }
              availableOutcomes={availableOutcomes}
              setOutcome={setOutcome}
              availableStageColumns={availableStageColumns}
              stageColumn={stageColumn}
              setStageColumn={setStageColumn}
              stageOrderMode={stageOrderMode}
              setStageOrderMode={setStageOrderMode}
              stagedStats={stagedStats}
              controlStats={stats}
              getTermUcl={getTerm('ucl')}
              getTermMean={getTerm('mean')}
              getTermLcl={getTerm('lcl')}
              chartTitles={chartTitles}
              onChartTitleChange={handleChartTitleChange}
              boxplotFactor={boxplotFactor}
              setBoxplotFactor={setBoxplotFactor}
              paretoFactor={paretoFactor}
              setParetoFactor={setParetoFactor}
              showParetoPanel={showParetoPanel}
              focusedChart={focusedChart}
              setFocusedChart={setFocusedChart}
              filterChipData={filterChipData}
              cumulativeVariationPct={cumulativeVariationPct}
              annotations={{
                contextMenu: isPhone
                  ? {
                      isOpen: false,
                      position: { x: 0, y: 0 },
                      categoryKey: '',
                      chartType: 'boxplot',
                    }
                  : contextMenu,
                handleContextMenu,
                closeContextMenu,
                boxplotHighlights,
                paretoHighlights,
                setHighlight,
                hasAnnotations,
                clearAnnotations,
              }}
              chartFindings={chartFindings}
              onAddChartObservation={onAddChartObservation}
              copyFeedback={copyFeedback}
              onCopyChart={handleCopyChart}
              onDownloadPng={handleDownloadPng}
              onDownloadSvg={handleDownloadSvg}
              onShareChart={onShareChart}
              ichartInsight={ichartInsight}
              boxplotInsight={boxplotInsight}
              paretoInsight={paretoInsight}
              statsInsight={statsInsight}
              onInsightAction={(factor, value) => {
                if (value) {
                  handleDrillDown(factor, value);
                } else {
                  // Switch factor view (e.g., boxplot drill suggestion)
                  setBoxplotFactor(factor);
                  setParetoFactor(factor);
                }
              }}
              // Azure-specific: Manage Factors button in I-Chart header
              ichartHeaderExtra={
                onManageFactors ? (
                  <button
                    onClick={onManageFactors}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-content-secondary hover:text-content bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-lg transition-colors"
                    title="Manage analysis factors"
                    aria-label="Manage factors"
                    data-testid="btn-manage-factors"
                  >
                    <Settings2 size={14} />
                    <span>Factors ({factors.length})</span>
                  </button>
                ) : undefined
              }
              // Azure-specific: lastAdvancedFactor ring on boxplot factor selector
              boxplotFactorWrapper={selector => (
                <div
                  className={`rounded-lg transition-all duration-300 ${
                    lastAdvancedFactor && lastAdvancedFactor === boxplotFactor
                      ? 'ring-2 ring-blue-400'
                      : ''
                  }`}
                >
                  {selector}
                </div>
              )}
              // Render slots
              renderIChartContent={
                <ErrorBoundary componentName="I-Chart">
                  <IChart
                    onPointClick={onPointClick}
                    highlightedPointIndex={highlightedPointIndex}
                    onSpecClick={() => setShowSpecEditor(true)}
                    ichartFindings={chartFindings?.ichart}
                    onCreateObservation={(anchorX, anchorY) =>
                      onAddChartObservation?.('ichart', undefined, undefined, anchorX, anchorY)
                    }
                    onEditFinding={onEditFinding}
                    onDeleteFinding={onDeleteFinding}
                  />
                </ErrorBoundary>
              }
              renderBoxplotContent={
                <ErrorBoundary componentName="Boxplot">
                  {boxplotFactor && (
                    <Boxplot
                      factor={boxplotFactor}
                      onDrillDown={handleDrillDown}
                      variationPct={factorVariations.get(boxplotFactor)}
                      categoryContributions={categoryContributions?.get(boxplotFactor)}
                      highlightedCategories={boxplotHighlights}
                      onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                      findings={chartFindings?.boxplot}
                      onEditFinding={onEditFinding}
                      onDeleteFinding={onDeleteFinding}
                    />
                  )}
                </ErrorBoundary>
              }
              renderParetoContent={
                <ErrorBoundary componentName="Pareto Chart">
                  {paretoFactor && (
                    <ParetoChart
                      factor={paretoFactor}
                      onDrillDown={handleDrillDown}
                      showComparison={showParetoComparison}
                      onToggleComparison={() => setShowParetoComparison(!showParetoComparison)}
                      onHide={() => setShowParetoPanel(false)}
                      onUploadPareto={onManageFactors}
                      availableFactors={factors}
                      aggregation={paretoAggregation}
                      onToggleAggregation={() =>
                        setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                      }
                      highlightedCategories={paretoHighlights}
                      onContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                      findings={chartFindings?.pareto}
                      onEditFinding={onEditFinding}
                      onDeleteFinding={onDeleteFinding}
                    />
                  )}
                </ErrorBoundary>
              }
              renderStatsPanel={
                <StatsPanel
                  stats={stats}
                  specs={specs}
                  filteredData={filteredData}
                  outcome={outcome}
                  onSaveSpecs={setSpecs}
                  showCpk={displayOptions.showCpk !== false}
                />
              }
              renderFocusedView={
                focusedChart ? (
                  <FocusedChartView
                    focusedChart={focusedChart}
                    onPrev={handlePrevChart}
                    onNext={handleNextChart}
                    onExit={() => setFocusedChart(null)}
                    displayOptions={displayOptions}
                    columnAliases={columnAliases}
                    cumulativeVariationPct={cumulativeVariationPct}
                    filterChipData={filterChipData}
                    copyFeedback={copyFeedback}
                    onCopyChart={handleCopyChart}
                    onDownloadPng={handleDownloadPng}
                    onDownloadSvg={handleDownloadSvg}
                    outcome={outcome}
                    availableOutcomes={availableOutcomes}
                    stageColumn={stageColumn}
                    availableStageColumns={availableStageColumns}
                    stageOrderMode={stageOrderMode}
                    stagedStats={stagedStats}
                    stats={stats}
                    ichartChartTitle={chartTitles.ichart || ''}
                    onSetOutcome={setOutcome}
                    onSetStageColumn={setStageColumn}
                    onSetStageOrderMode={setStageOrderMode}
                    onSpecClick={() => setShowSpecEditor(true)}
                    onIChartTitleChange={title => handleChartTitleChange('ichart', title)}
                    onPointClick={onPointClick}
                    highlightedPointIndex={highlightedPointIndex}
                    ichartFindings={chartFindings?.ichart}
                    onCreateIChartObservation={(anchorX: number, anchorY: number) =>
                      onAddChartObservation?.('ichart', undefined, undefined, anchorX, anchorY)
                    }
                    onEditFinding={onEditFinding}
                    onDeleteFinding={onDeleteFinding}
                    boxplotFactor={boxplotFactor}
                    factors={factors}
                    filters={filters}
                    factorVariations={factorVariations}
                    anovaResult={anovaResult}
                    boxplotData={boxplotData}
                    boxplotChartTitle={chartTitles.boxplot || ''}
                    onSetBoxplotFactor={setBoxplotFactor}
                    onDrillDown={handleDrillDown}
                    onBoxplotTitleChange={title => handleChartTitleChange('boxplot', title)}
                    boxplotHighlightedCategories={boxplotHighlights}
                    onBoxplotContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                    boxplotFindings={chartFindings?.boxplot}
                    categoryContributions={categoryContributions?.get(boxplotFactor)}
                    paretoFactor={paretoFactor}
                    showParetoComparison={showParetoComparison}
                    paretoAggregation={paretoAggregation}
                    paretoChartTitle={chartTitles.pareto || ''}
                    onSetParetoFactor={setParetoFactor}
                    onToggleComparison={() => setShowParetoComparison(!showParetoComparison)}
                    onToggleAggregation={() =>
                      setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                    }
                    onParetoTitleChange={title => handleChartTitleChange('pareto', title)}
                    onHidePareto={() => setShowParetoPanel(false)}
                    onUploadPareto={onManageFactors}
                    paretoHighlightedCategories={paretoHighlights}
                    onParetoContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                    paretoFindings={chartFindings?.pareto}
                  />
                ) : undefined
              }
              renderSpecEditor={
                showSpecEditor ? (
                  <SpecEditor
                    specs={specs}
                    onSave={setSpecs}
                    onClose={() => setShowSpecEditor(false)}
                    style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
                  />
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {/* AI Narrative Bar */}
      {(narrative || narrativeLoading || narrativeError) && (
        <NarrativeBar
          narrative={narrative ?? null}
          isLoading={narrativeLoading ?? false}
          isCached={narrativeCached ?? false}
          error={narrativeError ?? null}
          onAsk={onNarrativeAsk}
          onRetry={onNarrativeRetry}
        />
      )}
    </div>
  );
};

export default Dashboard;
