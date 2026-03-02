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
import { useData } from '../context/DataContext';
import { useDashboardCharts } from '../hooks';
import type { UseFilterNavigationReturn } from '../hooks';
import { EditableChartTitle, ErrorBoundary, FactorSelector, FilterBreadcrumb } from '@variscout/ui';
import {
  SelectionPanel,
  CreateFactorModal,
  FilterContextBar,
  BoxplotDisplayToggle,
  AnnotationContextMenu,
  DashboardChartCard,
  DashboardGrid,
  useIsMobile,
} from '@variscout/ui';
import { BREAKPOINTS } from '@variscout/ui';
import { getColumnNames, createFactorFromSelection } from '@variscout/core';
import { HelpTooltip, useGlossary } from '@variscout/ui';
import { useAnnotations } from '@variscout/hooks';
import {
  Activity,
  BarChart3,
  Layers,
  Gauge,
  ArrowLeft,
  X,
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
  /** Whether presentation mode is active */
  isPresentationMode?: boolean;
  /** Callback to exit presentation mode */
  onExitPresentation?: () => void;
  /** Callback to open ColumnMapping in re-edit mode for factor management */
  onManageFactors?: () => void;
  /** Callback to pin current filter state as a finding (optional note text) */
  onPinFinding?: (noteText?: string) => void;
  /** Callback to share a chart via deep link */
  onShareChart?: (chartType: string) => void;
}

const Dashboard = ({
  onPointClick,
  highlightedPointIndex,
  drillFromPerformance,
  onBackToPerformance,
  onDrillToMeasure,
  filterNav: externalFilterNav,
  initialTab,
  onTabChange,
  initialFocusedChart,
  onFocusedChartChange,
  initialBoxplotFactor,
  initialParetoFactor,
  onBoxplotFactorChange,
  onParetoFactorChange,
  isPresentationMode,
  onExitPresentation,
  onManageFactors,
  onPinFinding,
  onShareChart,
}: DashboardProps) => {
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

  const [activeTab, setActiveTabRaw] = useState<DashboardTab>(initialTab ?? 'analysis');
  const [showCreateFactorModal, setShowCreateFactorModal] = useState(false);
  const [showSpecEditor, setShowSpecEditor] = useState(false);

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
        onClose={() => setShowCreateFactorModal(false)}
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
              boxplotFactor={boxplotFactor}
              paretoFactor={paretoFactor}
              factors={factors}
              onSetBoxplotFactor={setBoxplotFactor}
              onSetParetoFactor={setParetoFactor}
              filters={filters}
              columnAliases={columnAliases}
              filterChipData={filterChipData}
              cumulativeVariationPct={cumulativeVariationPct}
              onUpdateFilterValues={handleUpdateFilterValues}
              onRemoveFilter={handleRemoveFilter}
              onClearAllFilters={handleClearAllFilters}
              onDrillDown={handleDrillDown}
              factorVariations={factorVariations}
              categoryContributions={categoryContributions}
              paretoAggregation={paretoAggregation}
              onToggleParetoAggregation={() =>
                setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
              }
              showParetoComparison={showParetoComparison}
              onToggleParetoComparison={() => setShowParetoComparison(!showParetoComparison)}
              stats={stats}
              specs={specs}
              filteredData={filteredData}
              outcome={outcome}
              onSaveSpecs={setSpecs}
              showCpk={displayOptions.showCpk !== false}
              anovaResult={anovaResult}
              onPinFinding={onPinFinding}
              boxplotData={boxplotData}
              boxplotHighlights={boxplotHighlights}
              paretoHighlights={paretoHighlights}
              onSetHighlight={setHighlight}
            />
          ) : !focusedChart ? (
            <DashboardGrid
              ichartCard={
                <DashboardChartCard
                  id="ichart-card"
                  testId="chart-ichart"
                  chartName="ichart"
                  minHeight="400px"
                  title={
                    <h2 className="text-xl font-bold flex items-center gap-2 text-content">
                      <Activity className="text-blue-400" />
                      <EditableChartTitle
                        defaultTitle={`I-Chart: ${outcome}`}
                        value={chartTitles.ichart || ''}
                        onChange={title => handleChartTitleChange('ichart', title)}
                      />
                    </h2>
                  }
                  controls={
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
                        {/* Stage Column Selector */}
                        {availableStageColumns.length > 0 && (
                          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-edge">
                            <Layers
                              size={16}
                              className={
                                availableStageColumns.length > 0
                                  ? 'text-blue-400'
                                  : 'text-content-muted'
                              }
                            />
                            <select
                              value={stageColumn || ''}
                              onChange={e => setStageColumn(e.target.value || null)}
                              className="bg-surface border border-edge text-sm text-content rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
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
                                className="bg-surface border border-edge text-xs text-content-secondary rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
                                title="Stage ordering method"
                              >
                                <option value="auto">Auto order</option>
                                <option value="data-order">As in data</option>
                              </select>
                            )}
                          </div>
                        )}
                        {onManageFactors && (
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
                        )}
                      </div>
                      {ichartAnnotations.length > 0 && (
                        <button
                          onClick={() => clearAnnotations('ichart')}
                          className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-surface-tertiary transition-colors"
                          title="Clear I-Chart annotations"
                          aria-label="Clear I-Chart annotations"
                        >
                          <X size={12} />
                        </button>
                      )}
                      {/* Stats display */}
                      {stageColumn && stagedStats ? (
                        <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
                          <span className="text-blue-400 font-medium">
                            {stagedStats.stageOrder.length} stages
                          </span>
                          <span className="text-content-secondary">
                            Overall Mean:{' '}
                            <span className="text-content font-mono">
                              {stagedStats.overallStats.mean.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        stats && (
                          <div className="flex gap-4 text-sm bg-surface/50 px-3 py-1.5 rounded-lg border border-edge/50">
                            <span className="text-content-secondary flex items-center gap-1">
                              UCL:{' '}
                              <span className="text-content font-mono">{stats.ucl.toFixed(2)}</span>
                              <HelpTooltip term={getTerm('ucl')} iconSize={12} />
                            </span>
                            <span className="text-content-secondary flex items-center gap-1">
                              Mean:{' '}
                              <span className="text-content font-mono">
                                {stats.mean.toFixed(2)}
                              </span>
                              <HelpTooltip term={getTerm('mean')} iconSize={12} />
                            </span>
                            <span className="text-content-secondary flex items-center gap-1">
                              LCL:{' '}
                              <span className="text-content font-mono">{stats.lcl.toFixed(2)}</span>
                              <HelpTooltip term={getTerm('lcl')} iconSize={12} />
                            </span>
                          </div>
                        )
                      )}
                    </>
                  }
                  filterBar={
                    <FilterContextBar
                      filterChipData={filterChipData}
                      columnAliases={columnAliases}
                      cumulativeVariationPct={cumulativeVariationPct}
                      show={displayOptions.showFilterContext !== false}
                    />
                  }
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                  onMaximize={() => setFocusedChart('ichart')}
                  onShareChart={onShareChart}
                >
                  <ErrorBoundary componentName="I-Chart">
                    <IChart
                      onPointClick={onPointClick}
                      highlightedPointIndex={highlightedPointIndex}
                      onSpecClick={() => setShowSpecEditor(true)}
                      ichartAnnotations={ichartAnnotations}
                      onCreateAnnotation={createIChartAnnotation}
                      onAnnotationsChange={setIChartAnnotations}
                    />
                  </ErrorBoundary>
                </DashboardChartCard>
              }
              boxplotCard={
                <DashboardChartCard
                  id="boxplot-card"
                  testId="chart-boxplot"
                  chartName="boxplot"
                  className="flex-1 min-w-[300px]"
                  title={
                    <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                      <EditableChartTitle
                        defaultTitle={`Boxplot: ${boxplotFactor}`}
                        value={chartTitles.boxplot || ''}
                        onChange={title => handleChartTitleChange('boxplot', title)}
                      />
                    </h3>
                  }
                  controls={
                    <>
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
                          columnAliases={columnAliases}
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
                      />
                      {hasAnnotations && (
                        <button
                          onClick={() => clearAnnotations('boxplot')}
                          className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-surface-tertiary transition-colors"
                          title="Clear boxplot annotations"
                          aria-label="Clear boxplot annotations"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </>
                  }
                  filterBar={
                    <FilterContextBar
                      filterChipData={filterChipData}
                      columnAliases={columnAliases}
                      cumulativeVariationPct={cumulativeVariationPct}
                      show={displayOptions.showFilterContext !== false}
                    />
                  }
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                  onMaximize={() => setFocusedChart('boxplot')}
                  onShareChart={onShareChart}
                >
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
                </DashboardChartCard>
              }
              paretoCard={
                showParetoPanel ? (
                  <DashboardChartCard
                    id="pareto-card"
                    testId="chart-pareto"
                    chartName="pareto"
                    className="flex-1 min-w-[300px]"
                    title={
                      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                        <EditableChartTitle
                          defaultTitle={`Pareto: ${paretoFactor}`}
                          value={chartTitles.pareto || ''}
                          onChange={title => handleChartTitleChange('pareto', title)}
                        />
                      </h3>
                    }
                    controls={
                      <>
                        <FactorSelector
                          factors={factors}
                          selected={paretoFactor}
                          onChange={setParetoFactor}
                          hasActiveFilter={!!filters?.[paretoFactor]?.length}
                          columnAliases={columnAliases}
                        />
                        {((paretoHighlights && Object.keys(paretoHighlights).length > 0) ||
                          paretoAnnotations.length > 0) && (
                          <button
                            onClick={() => clearAnnotations('pareto')}
                            className="p-1 rounded text-content-muted hover:text-red-400 hover:bg-surface-tertiary transition-colors"
                            title="Clear pareto annotations"
                            aria-label="Clear pareto annotations"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </>
                    }
                    filterBar={
                      <FilterContextBar
                        filterChipData={filterChipData}
                        columnAliases={columnAliases}
                        cumulativeVariationPct={cumulativeVariationPct}
                        show={displayOptions.showFilterContext !== false}
                      />
                    }
                    copyFeedback={copyFeedback}
                    onCopyChart={handleCopyChart}
                    onDownloadPng={handleDownloadPng}
                    onDownloadSvg={handleDownloadSvg}
                    onMaximize={() => setFocusedChart('pareto')}
                    onShareChart={onShareChart}
                  >
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
                          annotations={paretoAnnotations}
                          onAnnotationsChange={setParetoAnnotations}
                        />
                      )}
                    </ErrorBoundary>
                  </DashboardChartCard>
                ) : undefined
              }
              statsPanel={
                <StatsPanel
                  stats={stats}
                  specs={specs}
                  filteredData={filteredData}
                  outcome={outcome}
                  onSaveSpecs={setSpecs}
                  showCpk={displayOptions.showCpk !== false}
                />
              }
            />
          ) : (
            <FocusedChartView
              focusedChart={focusedChart}
              onPrev={handlePrevChart}
              onNext={handleNextChart}
              onExit={() => setFocusedChart(null)}
              // Shared props
              displayOptions={displayOptions}
              columnAliases={columnAliases}
              cumulativeVariationPct={cumulativeVariationPct}
              filterChipData={filterChipData}
              copyFeedback={copyFeedback}
              onCopyChart={handleCopyChart}
              onDownloadPng={handleDownloadPng}
              onDownloadSvg={handleDownloadSvg}
              // I-Chart props
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
              ichartAnnotations={ichartAnnotations}
              onCreateIChartAnnotation={createIChartAnnotation}
              onIChartAnnotationsChange={setIChartAnnotations}
              onClearIChartAnnotations={() => clearAnnotations('ichart')}
              // Boxplot props
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
              boxplotAnnotations={boxplotAnnotations}
              onBoxplotAnnotationsChange={setBoxplotAnnotations}
              categoryContributions={categoryContributions?.get(boxplotFactor)}
              // Pareto props
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
              paretoAnnotations={paretoAnnotations}
              onParetoAnnotationsChange={setParetoAnnotations}
            />
          )}
        </div>
      )}

      {/* Annotation Context Menu (right-click on boxplot/pareto elements — desktop only) */}
      {!isPhone && contextMenu.isOpen && (
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

      {/* Spec Editor (opened by clicking spec labels on I-Chart) */}
      {showSpecEditor && (
        <SpecEditor
          specs={specs}
          onSave={setSpecs}
          onClose={() => setShowSpecEditor(false)}
          style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
    </div>
  );
};

export default Dashboard;
