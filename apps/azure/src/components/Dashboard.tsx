import React, { useState, useCallback, useEffect, useMemo } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import RegressionPanel from './RegressionPanel';
import PerformanceDashboard from './PerformanceDashboard';
import ErrorBoundary from './ErrorBoundary';
import FilterBreadcrumb from './FilterBreadcrumb';
import FactorSelector from './FactorSelector';
import FactorManagerPopover from './FactorManagerPopover';
import SpecsPopover from './settings/SpecsPopover';
import FocusedIChartView from './views/FocusedIChartView';
import FocusedBoxplotView from './views/FocusedBoxplotView';
import FocusedParetoView from './views/FocusedParetoView';
import { useData } from '../context/DataContext';
import { useDashboardCharts } from '../hooks';
import type { UseFilterNavigationReturn } from '../hooks';
import { EditableChartTitle } from '@variscout/charts';
import {
  SelectionPanel,
  CreateFactorModal,
  FilterContextBar,
  filterContextBarAzureColorScheme,
  BoxplotDisplayToggle,
  boxplotDisplayToggleAzureColorScheme,
  AnnotationContextMenu,
  ChartDownloadMenu,
  chartDownloadMenuAzureColorScheme,
} from '@variscout/ui';
import {
  getColumnNames,
  createFactorFromSelection,
  type MultiRegressionResult,
} from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { useAnnotations } from '@variscout/hooks';
import {
  Activity,
  BarChart3,
  TrendingUp,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Gauge,
  ArrowLeft,
  X,
  Copy,
  Check,
  Download,
} from 'lucide-react';

type DashboardTab = 'analysis' | 'regression' | 'performance';

interface DashboardProps {
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  drillFromPerformance?: string | null;
  onBackToPerformance?: () => void;
  onDrillToMeasure?: (measureId: string) => void;
  filterNav?: UseFilterNavigationReturn;
  regressionInitialFactors?: string[];
  onClearRegressionFactors?: () => void;
  onNavigateToWhatIfWithModel?: (model: MultiRegressionResult) => void;
  /** Initial tab from persisted view state */
  initialTab?: DashboardTab;
  /** Report tab changes for persistence */
  onTabChange?: (tab: DashboardTab) => void;
  /** Initial focused chart from persisted view state */
  initialFocusedChart?: 'ichart' | 'boxplot' | 'pareto' | null;
  /** Report focused chart changes for persistence */
  onFocusedChartChange?: (chart: string | null) => void;
  /** Initial boxplot factor from persisted view state */
  initialBoxplotFactor?: string;
  /** Initial pareto factor from persisted view state */
  initialParetoFactor?: string;
  /** Report boxplot factor changes for persistence */
  onBoxplotFactorChange?: (factor: string) => void;
  /** Report pareto factor changes for persistence */
  onParetoFactorChange?: (factor: string) => void;
}

const Dashboard = ({
  onPointClick,
  highlightedPointIndex,
  drillFromPerformance,
  onBackToPerformance,
  onDrillToMeasure,
  filterNav: externalFilterNav,
  regressionInitialFactors,
  onClearRegressionFactors,
  onNavigateToWhatIfWithModel,
  initialTab,
  onTabChange,
  initialFocusedChart,
  onFocusedChartChange,
  initialBoxplotFactor,
  initialParetoFactor,
  onBoxplotFactorChange,
  onParetoFactorChange,
}: DashboardProps) => {
  const {
    outcome,
    factors,
    setOutcome,
    setFactors,
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
    filterStack: ctxFilterStack,
    setFilterStack: ctxSetFilterStack,
  } = useData();
  const { getTerm } = useGlossary();

  const [activeTab, setActiveTabRaw] = useState<DashboardTab>(initialTab ?? 'analysis');
  const [showCreateFactorModal, setShowCreateFactorModal] = useState(false);

  // Wrap setActiveTab to report changes for persistence
  const setActiveTab = useCallback(
    (tab: DashboardTab) => {
      setActiveTabRaw(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  // Initialize focused chart from persisted view state (one-time on mount)
  const [hasRestoredFocusedChart, setHasRestoredFocusedChart] = useState(false);

  // Auto-switch to analysis tab when drilling from performance mode
  useEffect(() => {
    if (drillFromPerformance) {
      setActiveTab('analysis');
    }
  }, [drillFromPerformance, setActiveTab]);

  // Auto-switch to regression tab when external factors arrive (investigation bridge)
  useEffect(() => {
    if (regressionInitialFactors && regressionInitialFactors.length > 0) {
      setActiveTab('regression');
    }
  }, [regressionInitialFactors, setActiveTab]);

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
    initialBoxplotFactor,
    initialParetoFactor,
    onBoxplotFactorChange,
    onParetoFactorChange,
  });

  // Restore persisted focused chart (one-time after hook initializes)
  useEffect(() => {
    if (!hasRestoredFocusedChart && initialFocusedChart) {
      setFocusedChart(initialFocusedChart);
      setHasRestoredFocusedChart(true);
    } else if (!hasRestoredFocusedChart) {
      setHasRestoredFocusedChart(true);
    }
  }, [hasRestoredFocusedChart, initialFocusedChart, setFocusedChart]);

  // Report focused chart changes for persistence
  useEffect(() => {
    if (hasRestoredFocusedChart) {
      onFocusedChartChange?.(focusedChart);
    }
  }, [focusedChart, hasRestoredFocusedChart, onFocusedChartChange]);

  // Annotations (right-click context menu, no mode toggle)
  const dataFingerprint = useMemo(
    () =>
      `${filteredData.length}-${JSON.stringify(filters)}-${displayOptions.boxplotSortBy}-${displayOptions.boxplotSortDirection}`,
    [
      filteredData.length,
      filters,
      displayOptions.boxplotSortBy,
      displayOptions.boxplotSortDirection,
    ]
  );
  const {
    hasAnnotations,
    clearAnnotations,
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    boxplotHighlights,
    paretoHighlights,
    setHighlight,
    boxplotAnnotations,
    paretoAnnotations,
    createAnnotation,
    setBoxplotAnnotations,
    setParetoAnnotations,
    ichartAnnotations,
    createIChartAnnotation,
    setIChartAnnotations,
  } = useAnnotations({ displayOptions, setDisplayOptions, dataFingerprint });

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

  const handleClearAllFilters = useCallback(() => clearFilters(), [clearFilters]);
  const handleRemoveFilter = useCallback((factor: string) => removeFilter(factor), [removeFilter]);
  const handleUpdateFilterValues = useCallback(
    (factor: string, newValues: (string | number)[]) => updateFilterValues(factor, newValues),
    [updateFilterValues]
  );

  // Create Factor handlers
  const handleOpenCreateFactorModal = useCallback(() => {
    setShowCreateFactorModal(true);
  }, []);

  const handleCreateFactor = useCallback(
    (factorName: string) => {
      const updatedData = createFactorFromSelection(rawData, selectedPoints, factorName);
      setRawData(updatedData);
      setFilters({ ...filters, [factorName]: [factorName] });
      clearSelection();
      setShowCreateFactorModal(false);
    },
    [rawData, selectedPoints, filters, setRawData, setFilters, clearSelection]
  );

  if (!outcome) return null;

  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto bg-slate-900 relative"
    >
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-slate-900">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <FilterBreadcrumb
              filterChipData={filterChipData}
              columnAliases={columnAliases}
              onUpdateFilterValues={handleUpdateFilterValues}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
              cumulativeVariationPct={cumulativeVariationPct}
            />
          </div>
          {activeTab === 'analysis' && !focusedChart && (
            <div className="flex items-center gap-1 px-3 flex-shrink-0" data-export-hide>
              <button
                onClick={() => handleCopyChart('dashboard-export-container', 'dashboard')}
                className={`p-1.5 rounded transition-all ${
                  copyFeedback === 'dashboard'
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-slate-500 hover:text-white hover:bg-slate-700'
                }`}
                title="Copy dashboard to clipboard"
                aria-label="Copy dashboard to clipboard"
              >
                {copyFeedback === 'dashboard' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => handleDownloadPng('dashboard-export-container', 'dashboard')}
                className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                title="Download dashboard as PNG"
                aria-label="Download dashboard as PNG"
              >
                <Download size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Selection Panel */}
        {selectedPoints.size > 0 && (
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
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <BarChart3 size={16} />
            Analysis
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'regression'}
            onClick={() => setActiveTab('regression')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'regression'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <TrendingUp size={16} />
            Regression
          </button>
          {isPerformanceMode && (
            <button
              role="tab"
              aria-selected={activeTab === 'performance'}
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
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
        onClose={() => setShowCreateFactorModal(false)}
        selectedCount={selectedPoints.size}
        existingFactors={getColumnNames(rawData)}
        onCreateFactor={handleCreateFactor}
      />

      {/* Regression Tab */}
      {activeTab === 'regression' && (
        <div className="flex-1 m-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
          <ErrorBoundary componentName="Regression Panel">
            <RegressionPanel
              initialPredictors={regressionInitialFactors}
              onNavigateToWhatIf={onNavigateToWhatIfWithModel}
            />
          </ErrorBoundary>
        </div>
      )}

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
                  Viewing: <span className="font-medium text-white">{drillFromPerformance}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  onBackToPerformance?.();
                  setActiveTab('performance');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-300 hover:text-white hover:bg-blue-600/30 rounded transition-colors"
              >
                <ArrowLeft size={12} />
                Back to Performance
              </button>
            </div>
          )}

          {!focusedChart ? (
            // Scrollable grid layout
            <div className="flex flex-col gap-4 p-4">
              {/* I-Chart Section */}
              <div
                id="ichart-card"
                data-testid="chart-ichart"
                className="min-h-[400px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col"
              >
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Activity className="text-blue-400" />
                      <EditableChartTitle
                        defaultTitle={`I-Chart: ${outcome}`}
                        value={chartTitles.ichart || ''}
                        onChange={title => handleChartTitleChange('ichart', title)}
                      />
                    </h2>
                    <div className="flex items-center gap-4" data-export-hide>
                      <select
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        aria-label="Select outcome variable"
                        className="bg-slate-900 border border-slate-700 text-sm font-medium text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        {availableOutcomes.map(o => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      {/* Stage Column Selector */}
                      {availableStageColumns.length > 0 && (
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                          <Layers
                            size={16}
                            className={
                              availableStageColumns.length > 0 ? 'text-blue-400' : 'text-slate-600'
                            }
                          />
                          <select
                            value={stageColumn || ''}
                            onChange={e => setStageColumn(e.target.value || null)}
                            className="bg-slate-900 border border-slate-700 text-sm text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                            title="Select a column to divide the chart into stages"
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
                              onChange={e =>
                                setStageOrderMode(e.target.value as typeof stageOrderMode)
                              }
                              className="bg-slate-900 border border-slate-700 text-xs text-slate-400 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                              title="Stage ordering method"
                            >
                              <option value="auto">Auto order</option>
                              <option value="data-order">As in data</option>
                            </select>
                          )}
                        </div>
                      )}
                      <SpecsPopover specs={specs} onSave={setSpecs} />
                      <FactorManagerPopover
                        rawData={rawData}
                        outcome={outcome}
                        factors={factors}
                        filters={filters}
                        onFactorsChange={setFactors}
                        onFiltersChange={setFilters}
                        factorVariations={factorVariations}
                        filterStack={ctxFilterStack}
                        onFilterStackChange={ctxSetFilterStack}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2" data-export-hide>
                    {ichartAnnotations.length > 0 && (
                      <button
                        onClick={() => clearAnnotations('ichart')}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                        title="Clear I-Chart annotations"
                        aria-label="Clear I-Chart annotations"
                      >
                        <X size={12} />
                      </button>
                    )}
                    {/* Stats display */}
                    {stageColumn && stagedStats ? (
                      <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <span className="text-blue-400 font-medium">
                          {stagedStats.stageOrder.length} stages
                        </span>
                        <span className="text-slate-400">
                          Overall Mean:{' '}
                          <span className="text-white font-mono">
                            {stagedStats.overallStats.mean.toFixed(2)}
                          </span>
                        </span>
                      </div>
                    ) : (
                      stats && (
                        <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                          <span className="text-slate-400 flex items-center gap-1">
                            UCL:{' '}
                            <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                            <HelpTooltip term={getTerm('ucl')} iconSize={12} />
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            Mean:{' '}
                            <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                            <HelpTooltip term={getTerm('mean')} iconSize={12} />
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            LCL:{' '}
                            <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
                            <HelpTooltip term={getTerm('lcl')} iconSize={12} />
                          </span>
                        </div>
                      )
                    )}
                    <button
                      onClick={() => handleCopyChart('ichart-card', 'ichart')}
                      className={`p-1.5 rounded transition-all ${
                        copyFeedback === 'ichart'
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-slate-500 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Copy I-Chart to clipboard"
                      aria-label="Copy I-Chart to clipboard"
                      data-export-hide
                    >
                      {copyFeedback === 'ichart' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <ChartDownloadMenu
                      containerId="ichart-card"
                      chartName="ichart"
                      onDownloadPng={handleDownloadPng}
                      onDownloadSvg={handleDownloadSvg}
                      colorScheme={chartDownloadMenuAzureColorScheme}
                    />
                    <button
                      onClick={() => setFocusedChart('ichart')}
                      className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                      aria-label="Maximize chart"
                      title="Maximize Chart"
                    >
                      <Maximize2 size={16} />
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
                <div className="flex-1 min-h-[300px] w-full">
                  <ErrorBoundary componentName="I-Chart">
                    <IChart
                      onPointClick={onPointClick}
                      highlightedPointIndex={highlightedPointIndex}
                      ichartAnnotations={ichartAnnotations}
                      onCreateAnnotation={createIChartAnnotation}
                      onAnnotationsChange={setIChartAnnotations}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Bottom Section: Boxplot, Pareto, Stats */}
              <div className="flex flex-col lg:flex-row gap-4 min-h-[350px]">
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  {/* Boxplot */}
                  <div
                    id="boxplot-card"
                    data-testid="chart-boxplot"
                    className="flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        <EditableChartTitle
                          defaultTitle={`Boxplot: ${boxplotFactor}`}
                          value={chartTitles.boxplot || ''}
                          onChange={title => handleChartTitleChange('boxplot', title)}
                        />
                      </h3>
                      <div className="flex items-center gap-2" data-export-hide>
                        <div
                          className={`rounded-lg transition-all duration-300 ${
                            lastAdvancedFactor && lastAdvancedFactor === boxplotFactor
                              ? 'ring-2 ring-blue-400'
                              : ''
                          }`}
                        >
                          <FactorSelector
                            factors={factors}
                            selected={boxplotFactor}
                            onChange={setBoxplotFactor}
                            hasActiveFilter={!!filters?.[boxplotFactor]?.length}
                          />
                        </div>
                        <BoxplotDisplayToggle
                          showViolin={displayOptions.showViolin ?? false}
                          showContributionLabels={displayOptions.showContributionLabels ?? false}
                          onToggleViolin={value =>
                            setDisplayOptions({ ...displayOptions, showViolin: value })
                          }
                          onToggleContributionLabels={value =>
                            setDisplayOptions({ ...displayOptions, showContributionLabels: value })
                          }
                          sortBy={displayOptions.boxplotSortBy ?? 'name'}
                          sortDirection={displayOptions.boxplotSortDirection ?? 'asc'}
                          onSortChange={(sortBy, direction) =>
                            setDisplayOptions({
                              ...displayOptions,
                              boxplotSortBy: sortBy,
                              boxplotSortDirection: direction,
                            })
                          }
                          colorScheme={boxplotDisplayToggleAzureColorScheme}
                        />
                        {hasAnnotations && (
                          <button
                            onClick={() => clearAnnotations('boxplot')}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                            title="Clear boxplot annotations"
                            aria-label="Clear boxplot annotations"
                          >
                            <X size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyChart('boxplot-card', 'boxplot')}
                          className={`p-1.5 rounded transition-all ${
                            copyFeedback === 'boxplot'
                              ? 'bg-green-500/20 text-green-400'
                              : 'text-slate-500 hover:text-white hover:bg-slate-700'
                          }`}
                          title="Copy Boxplot to clipboard"
                          aria-label="Copy Boxplot to clipboard"
                          data-export-hide
                        >
                          {copyFeedback === 'boxplot' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <ChartDownloadMenu
                          containerId="boxplot-card"
                          chartName="boxplot"
                          onDownloadPng={handleDownloadPng}
                          onDownloadSvg={handleDownloadSvg}
                          colorScheme={chartDownloadMenuAzureColorScheme}
                        />
                        <button
                          onClick={() => setFocusedChart('boxplot')}
                          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                          aria-label="Maximize chart"
                          title="Maximize Chart"
                        >
                          <Maximize2 size={14} />
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
                    <div className="flex-1 min-h-[180px]">
                      <ErrorBoundary componentName="Boxplot">
                        {boxplotFactor && (
                          <Boxplot
                            factor={boxplotFactor}
                            onDrillDown={handleDrillDown}
                            variationPct={factorVariations.get(boxplotFactor)}
                            categoryContributions={categoryContributions?.get(boxplotFactor)}
                            highlightedCategories={boxplotHighlights}
                            onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                            annotations={boxplotAnnotations}
                            onAnnotationsChange={setBoxplotAnnotations}
                          />
                        )}
                      </ErrorBoundary>
                    </div>
                  </div>

                  {/* Pareto */}
                  <div
                    id="pareto-card"
                    data-testid="chart-pareto"
                    className="flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        <EditableChartTitle
                          defaultTitle={`Pareto: ${paretoFactor}`}
                          value={chartTitles.pareto || ''}
                          onChange={title => handleChartTitleChange('pareto', title)}
                        />
                      </h3>
                      <div className="flex items-center gap-2" data-export-hide>
                        <FactorSelector
                          factors={factors}
                          selected={paretoFactor}
                          onChange={setParetoFactor}
                          hasActiveFilter={!!filters?.[paretoFactor]?.length}
                        />
                        {((paretoHighlights && Object.keys(paretoHighlights).length > 0) ||
                          paretoAnnotations.length > 0) && (
                          <button
                            onClick={() => clearAnnotations('pareto')}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                            title="Clear pareto annotations"
                            aria-label="Clear pareto annotations"
                          >
                            <X size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyChart('pareto-card', 'pareto')}
                          className={`p-1.5 rounded transition-all ${
                            copyFeedback === 'pareto'
                              ? 'bg-green-500/20 text-green-400'
                              : 'text-slate-500 hover:text-white hover:bg-slate-700'
                          }`}
                          title="Copy Pareto to clipboard"
                          aria-label="Copy Pareto to clipboard"
                          data-export-hide
                        >
                          {copyFeedback === 'pareto' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <ChartDownloadMenu
                          containerId="pareto-card"
                          chartName="pareto"
                          onDownloadPng={handleDownloadPng}
                          onDownloadSvg={handleDownloadSvg}
                          colorScheme={chartDownloadMenuAzureColorScheme}
                        />
                        <button
                          onClick={() => setFocusedChart('pareto')}
                          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                          aria-label="Maximize chart"
                          title="Maximize Chart"
                        >
                          <Maximize2 size={14} />
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
                    <div className="flex-1 min-h-[180px]">
                      <ErrorBoundary componentName="Pareto Chart">
                        {paretoFactor && (
                          <ParetoChart
                            factor={paretoFactor}
                            onDrillDown={handleDrillDown}
                            showComparison={showParetoComparison}
                            onToggleComparison={() =>
                              setShowParetoComparison(!showParetoComparison)
                            }
                            aggregation={paretoAggregation}
                            onToggleAggregation={() =>
                              setParetoAggregation(
                                paretoAggregation === 'count' ? 'value' : 'count'
                              )
                            }
                            highlightedCategories={paretoHighlights}
                            onContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                            annotations={paretoAnnotations}
                            onAnnotationsChange={setParetoAnnotations}
                          />
                        )}
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <StatsPanel
                  stats={stats}
                  specs={specs}
                  filteredData={filteredData}
                  outcome={outcome}
                  onSaveSpecs={setSpecs}
                />
              </div>
            </div>
          ) : (
            // FOCUSED MODE — outer wrapper with navigation overlay
            <div className="flex-1 flex p-4 h-full relative group/focus">
              {/* Navigation Buttons (Overlay) */}
              <button
                onClick={handlePrevChart}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-700 opacity-0 group-hover/focus:opacity-100 transition-opacity"
                aria-label="Previous chart"
                title="Previous Chart (Left Arrow)"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextChart}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-700 opacity-0 group-hover/focus:opacity-100 transition-opacity"
                aria-label="Next chart"
                title="Next Chart (Right Arrow)"
              >
                <ChevronRight size={24} />
              </button>

              {focusedChart === 'ichart' && (
                <FocusedIChartView
                  outcome={outcome}
                  availableOutcomes={availableOutcomes}
                  stageColumn={stageColumn}
                  availableStageColumns={availableStageColumns}
                  stageOrderMode={stageOrderMode}
                  stagedStats={stagedStats}
                  stats={stats}
                  specs={specs}
                  chartTitle={chartTitles.ichart || ''}
                  displayOptions={displayOptions}
                  columnAliases={columnAliases}
                  cumulativeVariationPct={cumulativeVariationPct}
                  filterChipData={filterChipData}
                  onSetOutcome={setOutcome}
                  onSetStageColumn={setStageColumn}
                  onSetStageOrderMode={setStageOrderMode}
                  onSaveSpecs={setSpecs}
                  onChartTitleChange={title => handleChartTitleChange('ichart', title)}
                  onExit={() => setFocusedChart(null)}
                  onPointClick={onPointClick}
                  highlightedPointIndex={highlightedPointIndex}
                  ichartAnnotations={ichartAnnotations}
                  onCreateIChartAnnotation={createIChartAnnotation}
                  onIChartAnnotationsChange={setIChartAnnotations}
                  onClearIChartAnnotations={() => clearAnnotations('ichart')}
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                />
              )}

              {focusedChart === 'boxplot' && (
                <FocusedBoxplotView
                  boxplotFactor={boxplotFactor}
                  factors={factors}
                  filters={filters}
                  factorVariations={factorVariations}
                  anovaResult={anovaResult}
                  boxplotData={boxplotData}
                  chartTitle={chartTitles.boxplot || ''}
                  displayOptions={displayOptions}
                  columnAliases={columnAliases}
                  cumulativeVariationPct={cumulativeVariationPct}
                  filterChipData={filterChipData}
                  onSetBoxplotFactor={setBoxplotFactor}
                  onDrillDown={handleDrillDown}
                  onChartTitleChange={title => handleChartTitleChange('boxplot', title)}
                  onExit={() => setFocusedChart(null)}
                  highlightedCategories={boxplotHighlights}
                  onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                  annotations={boxplotAnnotations}
                  onAnnotationsChange={setBoxplotAnnotations}
                  categoryContributions={categoryContributions?.get(boxplotFactor)}
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                />
              )}

              {focusedChart === 'pareto' && (
                <FocusedParetoView
                  paretoFactor={paretoFactor}
                  factors={factors}
                  filters={filters}
                  showParetoComparison={showParetoComparison}
                  paretoAggregation={paretoAggregation}
                  chartTitle={chartTitles.pareto || ''}
                  displayOptions={displayOptions}
                  columnAliases={columnAliases}
                  cumulativeVariationPct={cumulativeVariationPct}
                  filterChipData={filterChipData}
                  onSetParetoFactor={setParetoFactor}
                  onDrillDown={handleDrillDown}
                  onToggleComparison={() => setShowParetoComparison(!showParetoComparison)}
                  onToggleAggregation={() =>
                    setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                  }
                  onChartTitleChange={title => handleChartTitleChange('pareto', title)}
                  onExit={() => setFocusedChart(null)}
                  highlightedCategories={paretoHighlights}
                  onContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                  annotations={paretoAnnotations}
                  onAnnotationsChange={setParetoAnnotations}
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Annotation Context Menu (right-click on boxplot/pareto elements) */}
      {contextMenu.isOpen && (
        <AnnotationContextMenu
          categoryKey={contextMenu.categoryKey}
          currentHighlight={
            contextMenu.chartType === 'boxplot'
              ? boxplotHighlights[contextMenu.categoryKey]
              : paretoHighlights[contextMenu.categoryKey]
          }
          hasAnnotation={
            contextMenu.chartType === 'boxplot'
              ? boxplotAnnotations.some(a => a.anchorCategory === contextMenu.categoryKey)
              : paretoAnnotations.some(a => a.anchorCategory === contextMenu.categoryKey)
          }
          position={contextMenu.position}
          onSetHighlight={color =>
            setHighlight(contextMenu.chartType, contextMenu.categoryKey, color)
          }
          onAddNote={() => createAnnotation(contextMenu.chartType, contextMenu.categoryKey)}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default Dashboard;
