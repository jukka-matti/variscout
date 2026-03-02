import React, { useState, useCallback } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import MobileDashboard from './MobileDashboard';
import SpecEditor from './settings/SpecEditor';
import SpecsPopover from './settings/SpecsPopover';
import { PresentationView, EmbedFocusView, FocusedChartView } from './views';
import { EditableChartTitle } from '@variscout/ui';
import {
  ErrorBoundary,
  FilterBreadcrumb,
  FilterContextBar,
  FactorSelector,
  SelectionPanel,
  CreateFactorModal,
  BoxplotDisplayToggle,
  AnnotationContextMenu,
  DashboardChartCard,
  DashboardGrid,
  HelpTooltip,
  useIsMobile,
  useGlossary,
} from '@variscout/ui';
import { useKeyboardNavigation, useAnnotations } from '@variscout/hooks';
import { useData } from '../context/DataContext';
import { useDashboardCharts } from '../hooks/useDashboardCharts';
import type { UseFilterNavigationReturn } from '../hooks/useFilterNavigation';
import { Activity, BarChart3, Layers, X, Copy, Check, Download, Settings2 } from 'lucide-react';
import {
  createFactorFromSelection,
  getColumnNames,
  type StageOrderMode,
  type SpecLimits,
  type Finding,
} from '@variscout/core';

import type { ChartId, HighlightIntensity } from '../hooks/useEmbedMessaging';

type AnalysisView = 'dashboard';

const MOBILE_BREAKPOINT = 640; // sm breakpoint

interface DashboardProps {
  onPointClick?: (index: number) => void;
  isPresentationMode?: boolean;
  onExitPresentation?: () => void;
  // Embed mode highlight props
  highlightedChart?: ChartId | null;
  highlightIntensity?: HighlightIntensity;
  onChartClick?: (chartId: ChartId) => void;
  // Embed focus: when set, render only this single chart (for iframe embeds)
  embedFocusChart?: 'ichart' | 'boxplot' | 'pareto' | 'stats' | null;
  // Embed stats tab: when set, auto-selects this tab in StatsPanel
  embedStatsTab?: 'summary' | 'histogram' | 'normality' | null;
  // Callback to open ColumnMapping in re-edit mode for factor management
  onManageFactors?: () => void;
  // External trigger to open spec editor (from MobileMenu)
  openSpecEditorRequested?: boolean;
  onSpecEditorOpened?: () => void;
  // Highlighted point index from data panel (bi-directional sync)
  highlightedPointIndex?: number | null;
  // External filter navigation (shared with findings panel for synchronized drills)
  filterNav?: UseFilterNavigationReturn;
  // Callback to pin current filter state as a finding
  onPinFinding?: () => void;
  // Chart observation/finding props (findings-based annotation system)
  onAddChartObservation?: (
    chartType: 'boxplot' | 'pareto' | 'ichart',
    categoryKey?: string,
    anchorX?: number,
    anchorY?: number
  ) => void;
  chartFindings?: { boxplot: Finding[]; pareto: Finding[]; ichart: Finding[] };
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
}

const Dashboard = ({
  onPointClick,
  isPresentationMode,
  onExitPresentation,
  highlightedChart,
  highlightIntensity = 'pulse',
  onChartClick,
  embedFocusChart,
  embedStatsTab,
  onManageFactors,
  openSpecEditorRequested,
  onSpecEditorOpened,
  highlightedPointIndex: _highlightedPointIndex,
  filterNav,
  onPinFinding,
  onAddChartObservation,
  chartFindings,
  onEditFinding,
  onDeleteFinding,
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
    columnAliases,
    stageColumn,
    setStageColumn,
    stageOrderMode,
    setStageOrderMode,
    stagedStats,
    chartTitles,
    setChartTitles,
    paretoAggregation,
    setParetoAggregation,
    timeColumn,
    displayOptions,
    setDisplayOptions,
    // Selection state
    selectedPoints,
    clearSelection,
  } = useData();

  const { getTerm } = useGlossary();

  // Internal tab navigation state
  const [activeView, setActiveView] = useState<AnalysisView>('dashboard');

  // Modal state for Create Factor
  const [showCreateFactorModal, setShowCreateFactorModal] = useState(false);

  // Annotations (right-click context menu for highlights)
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

  // Use the consolidated chart state hook
  const {
    // Factor selection
    boxplotFactor,
    setBoxplotFactor,
    paretoFactor,
    setParetoFactor,
    // Focus mode
    focusedChart,
    setFocusedChart,
    handleNextChart,
    handlePrevChart,
    // Panel toggles
    showParetoPanel,
    setShowParetoPanel,
    showParetoComparison,
    toggleParetoComparison,
    showSpecEditor,
    setShowSpecEditor,
    // Chart export
    copyFeedback,
    handleCopyChart,
    handleDownloadPng,
    handleDownloadSvg,
    // Embed mode helpers
    getHighlightClass,
    handleChartWrapperClick,
    // Computed data
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    // Filter navigation state
    clearFilters,
    updateFilterValues,
    removeFilter,
    // Variation tracking
    cumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,
    // Filter handler
    handleDrillDown,
  } = useDashboardCharts({
    externalFilterNav: filterNav,
    openSpecEditorRequested,
    onSpecEditorOpened,
    highlightedChart: highlightedChart as
      | 'ichart'
      | 'boxplot'
      | 'pareto'
      | 'stats'
      | null
      | undefined,
    highlightIntensity,
    onChartClick,
  });

  // Responsive mobile detection
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  // Handler for saving specs from SpecEditor
  const handleSaveSpecs = useCallback(
    (newSpecs: SpecLimits) => {
      setSpecs(newSpecs);
    },
    [setSpecs]
  );

  // Keyboard navigation for Focus Mode
  useKeyboardNavigation({
    focusedItem: focusedChart,
    onNext: handleNextChart,
    onPrev: handlePrevChart,
    onEscape: () => setFocusedChart(null),
  });

  // Keyboard handler for Presentation Mode
  useKeyboardNavigation({
    focusedItem: isPresentationMode ? 'presentation' : null,
    onEscape: onExitPresentation,
  });

  // Keyboard handler for Selection clearing (Phase 5: Polish)
  useKeyboardNavigation({
    focusedItem: selectedPoints.size > 0 ? 'selection' : null,
    onEscape: clearSelection,
  });

  // Clear all filters (delegates to hook)
  const handleClearAllFilters = useCallback(() => clearFilters(), [clearFilters]);

  // Remove a specific filter
  const handleRemoveFilter = useCallback(
    (factor: string) => {
      removeFilter(factor);
    },
    [removeFilter]
  );

  // Update filter values (for multi-select in filter chips)
  const handleUpdateFilterValues = useCallback(
    (factor: string, newValues: (string | number)[]) => {
      updateFilterValues(factor, newValues);
    },
    [updateFilterValues]
  );

  // Handle Create Factor button click in SelectionPanel
  const handleOpenCreateFactorModal = useCallback(() => {
    setShowCreateFactorModal(true);
  }, []);

  // Handle factor creation from modal
  const handleCreateFactor = useCallback(
    (factorName: string) => {
      // Create new column with factor values
      const updatedData = createFactorFromSelection(rawData, selectedPoints, factorName);
      setRawData(updatedData);

      // Auto-apply filter to show only selected points
      setFilters({
        ...filters,
        [factorName]: [factorName],
      });

      // Clear selection (now using filter instead)
      clearSelection();

      // Close modal
      setShowCreateFactorModal(false);
    },
    [rawData, selectedPoints, filters, setRawData, setFilters, clearSelection]
  );

  // Helper to update chart titles (must be before early returns — rules-of-hooks)
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...chartTitles, [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  if (!outcome) return null;

  // Presentation Mode - Fullscreen overlay with all charts
  if (isPresentationMode) {
    return (
      <PresentationView
        outcome={outcome}
        boxplotFactor={boxplotFactor}
        paretoFactor={paretoFactor}
        factors={factors}
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        factorVariations={factorVariations}
        showParetoComparison={showParetoComparison}
        onToggleParetoComparison={() => toggleParetoComparison()}
        paretoAggregation={paretoAggregation}
        onToggleParetoAggregation={() =>
          setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
        }
        chartTitles={chartTitles}
        onChartTitleChange={handleChartTitleChange}
        onSpecClick={() => setShowSpecEditor(true)}
      />
    );
  }

  // Embed Focus Mode - render only the specified chart (for iframe embeds)
  if (embedFocusChart) {
    return (
      <EmbedFocusView
        focusChart={embedFocusChart}
        outcome={outcome}
        boxplotFactor={boxplotFactor}
        paretoFactor={paretoFactor}
        factors={factors}
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        filters={filters}
        factorVariations={factorVariations}
        showParetoComparison={showParetoComparison}
        onToggleParetoComparison={() => toggleParetoComparison()}
        paretoAggregation={paretoAggregation}
        onToggleParetoAggregation={() =>
          setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
        }
        chartTitles={chartTitles}
        onChartTitleChange={handleChartTitleChange}
        onBoxplotFactorChange={setBoxplotFactor}
        onParetoFactorChange={setParetoFactor}
        onDrillDown={handleDrillDown}
        onPointClick={onPointClick}
        onSpecClick={() => setShowSpecEditor(true)}
        onManageFactors={onManageFactors}
        embedStatsTab={embedStatsTab}
      />
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div id="dashboard-export-container" className="h-full">
        <MobileDashboard
          outcome={outcome}
          factors={factors}
          stats={stats}
          specs={specs}
          boxplotFactor={boxplotFactor}
          paretoFactor={paretoFactor}
          filteredData={filteredData}
          anovaResult={anovaResult}
          filters={filters}
          columnAliases={columnAliases}
          onSetBoxplotFactor={setBoxplotFactor}
          onSetParetoFactor={setParetoFactor}
          onPointClick={onPointClick}
          onDrillDown={handleDrillDown}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
          filterChipData={filterChipData}
          cumulativeVariationPct={cumulativeVariationPct}
          onUpdateFilterValues={handleUpdateFilterValues}
          factorVariations={factorVariations}
          onHideParetoPanel={() => setShowParetoPanel(false)}
          onUploadPareto={onManageFactors}
          paretoAggregation={paretoAggregation}
          onToggleParetoAggregation={() =>
            setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
          }
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto bg-surface relative"
    >
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-surface">
        {/* Filter Breadcrumb Navigation with Variation Tracking */}
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <FilterBreadcrumb
              filterChipData={filterChipData}
              columnAliases={columnAliases}
              onUpdateFilterValues={handleUpdateFilterValues}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
              cumulativeVariationPct={cumulativeVariationPct}
              onPinFinding={onPinFinding}
            />
          </div>
          {activeView === 'dashboard' && !focusedChart && (
            <div className="flex items-center gap-1 px-3 flex-shrink-0" data-export-hide>
              <button
                onClick={() => handleCopyChart('dashboard-export-container', 'dashboard')}
                className={`p-1.5 rounded transition-all ${
                  copyFeedback === 'dashboard'
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-content-muted hover:text-white hover:bg-surface-tertiary'
                }`}
                title="Copy dashboard to clipboard"
                aria-label="Copy dashboard to clipboard"
              >
                {copyFeedback === 'dashboard' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => handleDownloadPng('dashboard-export-container', 'dashboard')}
                className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                title="Download dashboard as PNG"
                aria-label="Download dashboard as PNG"
              >
                <Download size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center gap-2 px-4 pt-3 pb-2"
          role="tablist"
          aria-label="Dashboard tabs"
        >
          <button
            role="tab"
            aria-selected={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-surface-tertiary text-content-secondary hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <BarChart3 size={16} />
            Dashboard
          </button>
          {onManageFactors && factors.length > 0 && (
            <button
              onClick={onManageFactors}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ml-auto text-content-secondary hover:text-white hover:bg-surface-elevated transition-colors"
              title="Manage analysis factors"
              aria-label="Manage factors"
              data-testid="btn-manage-factors"
            >
              <Settings2 size={14} />
              Factors ({factors.length})
            </button>
          )}
        </div>

        {/* Selection Panel - Shows when points are brushed in IChart */}
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
      </div>

      {/* Create Factor Modal */}
      <CreateFactorModal
        isOpen={showCreateFactorModal}
        onClose={() => setShowCreateFactorModal(false)}
        selectedCount={selectedPoints.size}
        existingFactors={getColumnNames(rawData)}
        onCreateFactor={handleCreateFactor}
      />

      {/* Dashboard View (default) */}
      {activeView === 'dashboard' && (
        <div className="flex-1 flex flex-col min-h-0">
          {!focusedChart ? (
            // Scrollable Layout
            <DashboardGrid
              ichartCard={
                <DashboardChartCard
                  id="ichart-card"
                  testId="chart-ichart"
                  chartName="ichart"
                  minHeight="400px"
                  highlightClass={getHighlightClass('ichart')}
                  onClick={() => handleChartWrapperClick('ichart')}
                  onMaximize={() => setFocusedChart('ichart')}
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                  observationCount={chartFindings?.ichart?.length}
                  title={
                    <div className="flex items-center gap-2">
                      <Activity className="text-blue-400 self-start mt-1" />
                      <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-white leading-none">
                          <EditableChartTitle
                            defaultTitle={`I-Chart: ${outcome}`}
                            value={chartTitles.ichart || ''}
                            onChange={title => setChartTitles({ ...chartTitles, ichart: title })}
                          />
                        </h2>
                        <span className="text-xs font-bold text-blue-400 opacity-80 tracking-widest mt-1">
                          VARISCOUT
                        </span>
                      </div>
                    </div>
                  }
                  controls={
                    <>
                      {/* Outcome Selector */}
                      <select
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        aria-label="Select outcome variable"
                        className="bg-surface border border-edge text-sm font-medium text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
                      >
                        {availableOutcomes.map(o => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>

                      {/* Stage Controls */}
                      {availableStageColumns.length > 0 && (
                        <div className="flex items-center gap-1 pl-2 border-l border-edge">
                          <Layers size={14} className="text-blue-400" />
                          <select
                            value={stageColumn || ''}
                            onChange={e => setStageColumn(e.target.value || null)}
                            className="bg-surface border border-edge text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
                            title="Divide chart into stages"
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
                              onChange={e => setStageOrderMode(e.target.value as StageOrderMode)}
                              className="bg-surface border border-edge text-xs text-content-secondary rounded px-1 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-surface-secondary transition-colors"
                              aria-label="Stage order mode"
                            >
                              <option value="auto">Auto</option>
                              <option value="data-order">Data order</option>
                            </select>
                          )}
                        </div>
                      )}

                      {/* Specs */}
                      <div className="pl-2 border-l border-edge">
                        <SpecsPopover
                          specs={specs}
                          onSave={newSpecs => setSpecs(newSpecs)}
                          onOpenAdvanced={() => setShowSpecEditor(true)}
                        />
                      </div>

                      {/* I-Chart stats */}
                      {stageColumn && stagedStats ? (
                        <div className="flex gap-2 text-xs bg-surface/50 px-2 py-1 rounded border border-edge/50 pl-2 border-l border-edge">
                          <span className="text-blue-400 font-medium">
                            {stagedStats.stageOrder.length} stages
                          </span>
                          <span className="text-content-secondary">
                            μ:{' '}
                            <span className="text-white font-mono">
                              {stagedStats.overallStats.mean.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      ) : (
                        stats && (
                          <div className="flex gap-2 text-xs bg-surface/50 px-2 py-1 rounded border border-edge/50">
                            <span className="text-content-secondary flex items-center gap-1">
                              UCL:{' '}
                              <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                              <HelpTooltip term={getTerm('ucl')} iconSize={12} />
                            </span>
                            <span className="text-content-secondary flex items-center gap-1">
                              Mean:{' '}
                              <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                              <HelpTooltip term={getTerm('mean')} iconSize={12} />
                            </span>
                            <span className="text-content-secondary flex items-center gap-1">
                              LCL:{' '}
                              <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
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
                >
                  <ErrorBoundary componentName="I-Chart">
                    <IChart
                      onPointClick={onPointClick}
                      onSpecClick={() => setShowSpecEditor(true)}
                      showBranding={false}
                      ichartFindings={chartFindings?.ichart}
                      onCreateObservation={
                        onAddChartObservation
                          ? (ax: number, ay: number) =>
                              onAddChartObservation('ichart', undefined, ax, ay)
                          : undefined
                      }
                      onEditFinding={onEditFinding}
                      onDeleteFinding={onDeleteFinding}
                    />
                  </ErrorBoundary>
                </DashboardChartCard>
              }
              boxplotCard={
                <DashboardChartCard
                  id="boxplot-card"
                  testId="chart-boxplot"
                  chartName="boxplot"
                  highlightClass={getHighlightClass('boxplot')}
                  onClick={() => handleChartWrapperClick('boxplot')}
                  onMaximize={() => setFocusedChart('boxplot')}
                  copyFeedback={copyFeedback}
                  onCopyChart={handleCopyChart}
                  onDownloadPng={handleDownloadPng}
                  onDownloadSvg={handleDownloadSvg}
                  observationCount={chartFindings?.boxplot?.length}
                  className="flex-1 min-w-[300px]"
                  title={
                    <div className="flex flex-col">
                      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider leading-none">
                        <EditableChartTitle
                          defaultTitle={`Boxplot: ${boxplotFactor}`}
                          value={chartTitles.boxplot || ''}
                          onChange={title => setChartTitles({ ...chartTitles, boxplot: title })}
                        />
                      </h3>
                      <span className="text-[10px] font-bold text-blue-400 opacity-80 tracking-widest mt-1">
                        VARISCOUT
                      </span>
                    </div>
                  }
                  controls={
                    <>
                      <FactorSelector
                        factors={factors}
                        selected={boxplotFactor}
                        onChange={setBoxplotFactor}
                        hasActiveFilter={!!filters?.[boxplotFactor]?.length}
                        columnAliases={columnAliases}
                      />
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
                >
                  <ErrorBoundary componentName="Boxplot">
                    {boxplotFactor && (
                      <Boxplot
                        factor={boxplotFactor}
                        onDrillDown={handleDrillDown}
                        variationPct={factorVariations.get(boxplotFactor)}
                        categoryContributions={categoryContributions?.get(boxplotFactor)}
                        showBranding={false}
                        highlightedCategories={boxplotHighlights}
                        onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                        findings={chartFindings?.boxplot}
                        onEditFinding={onEditFinding}
                        onDeleteFinding={onDeleteFinding}
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
                    highlightClass={getHighlightClass('pareto')}
                    onClick={() => handleChartWrapperClick('pareto')}
                    onMaximize={() => setFocusedChart('pareto')}
                    copyFeedback={copyFeedback}
                    onCopyChart={handleCopyChart}
                    onDownloadPng={handleDownloadPng}
                    onDownloadSvg={handleDownloadSvg}
                    observationCount={chartFindings?.pareto?.length}
                    className="flex-1 min-w-[300px]"
                    title={
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider leading-none">
                          <EditableChartTitle
                            defaultTitle={`Pareto: ${paretoFactor}`}
                            value={chartTitles.pareto || ''}
                            onChange={title => setChartTitles({ ...chartTitles, pareto: title })}
                          />
                        </h3>
                        <span className="text-[10px] font-bold text-blue-400 opacity-80 tracking-widest mt-1">
                          VARISCOUT
                        </span>
                      </div>
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
                    }
                    filterBar={
                      <FilterContextBar
                        filterChipData={filterChipData}
                        columnAliases={columnAliases}
                        cumulativeVariationPct={cumulativeVariationPct}
                        show={displayOptions.showFilterContext !== false}
                      />
                    }
                  >
                    <ErrorBoundary componentName="Pareto Chart">
                      {paretoFactor && (
                        <ParetoChart
                          factor={paretoFactor}
                          onDrillDown={handleDrillDown}
                          showComparison={showParetoComparison}
                          onToggleComparison={() => toggleParetoComparison()}
                          onHide={() => setShowParetoPanel(false)}
                          onUploadPareto={onManageFactors}
                          availableFactors={factors}
                          aggregation={paretoAggregation}
                          onToggleAggregation={() =>
                            setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
                          }
                          showBranding={false}
                          highlightedCategories={paretoHighlights}
                          onContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
                          findings={chartFindings?.pareto}
                          onEditFinding={onEditFinding}
                          onDeleteFinding={onDeleteFinding}
                        />
                      )}
                    </ErrorBoundary>
                  </DashboardChartCard>
                ) : undefined
              }
              statsPanel={
                <div
                  data-testid="chart-stats"
                  onClick={() => handleChartWrapperClick('stats')}
                  className={`transition-all ${getHighlightClass('stats')}`}
                >
                  <StatsPanel
                    stats={stats}
                    specs={specs}
                    filteredData={filteredData}
                    outcome={outcome}
                  />
                </div>
              }
            />
          ) : (
            // FOCUSED MODE
            <FocusedChartView
              focusedChart={focusedChart}
              outcome={outcome}
              availableOutcomes={availableOutcomes}
              boxplotFactor={boxplotFactor}
              paretoFactor={paretoFactor}
              factors={factors}
              filters={filters}
              factorVariations={factorVariations}
              showParetoComparison={showParetoComparison}
              anovaResult={anovaResult}
              boxplotData={boxplotData}
              boxplotCategoryContributions={categoryContributions?.get(boxplotFactor)}
              stats={stats}
              stagedStats={stagedStats}
              stageColumn={stageColumn}
              onSetOutcome={setOutcome}
              onSetBoxplotFactor={setBoxplotFactor}
              onSetParetoFactor={setParetoFactor}
              onDrillDown={handleDrillDown}
              onToggleParetoComparison={() => toggleParetoComparison()}
              onHideParetoPanel={() => setShowParetoPanel(false)}
              onManageFactors={onManageFactors}
              onPointClick={onPointClick}
              onSpecClick={() => setShowSpecEditor(true)}
              onNextChart={handleNextChart}
              onPrevChart={handlePrevChart}
              onExitFocus={() => setFocusedChart(null)}
              chartTitles={chartTitles}
              onChartTitleChange={handleChartTitleChange}
              ichartFindings={chartFindings?.ichart}
              onCreateObservation={
                onAddChartObservation
                  ? (ax: number, ay: number) => onAddChartObservation('ichart', undefined, ax, ay)
                  : undefined
              }
              onEditFinding={onEditFinding}
              onDeleteFinding={onDeleteFinding}
              paretoAggregation={paretoAggregation}
              onToggleParetoAggregation={() =>
                setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
              }
              filterChipData={filterChipData}
              columnAliases={columnAliases}
              cumulativeVariationPct={cumulativeVariationPct}
              showFilterContext={displayOptions.showFilterContext !== false}
              boxplotHighlights={boxplotHighlights}
              onBoxplotContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
              boxplotFindings={chartFindings?.boxplot}
              onBoxplotEditFinding={onEditFinding}
              onBoxplotDeleteFinding={onDeleteFinding}
              paretoHighlights={paretoHighlights}
              onParetoContextMenu={(key, event) => handleContextMenu('pareto', key, event)}
              paretoFindings={chartFindings?.pareto}
              onParetoEditFinding={onEditFinding}
              onParetoDeleteFinding={onDeleteFinding}
              copyFeedback={copyFeedback}
              onCopyChart={handleCopyChart}
              onDownloadPng={handleDownloadPng}
              onDownloadSvg={handleDownloadSvg}
            />
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
          hasFinding={
            chartFindings
              ? contextMenu.chartType === 'boxplot'
                ? chartFindings.boxplot.some(f => f.source?.category === contextMenu.categoryKey)
                : chartFindings.pareto.some(f => f.source?.category === contextMenu.categoryKey)
              : false
          }
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

      {/* Spec Editor Popover */}
      {showSpecEditor && (
        <SpecEditor
          specs={specs}
          onSave={handleSaveSpecs}
          onClose={() => setShowSpecEditor(false)}
          style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
    </div>
  );
};

export default Dashboard;
