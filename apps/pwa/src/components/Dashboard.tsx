import React, { useCallback, useMemo } from 'react';
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
  SelectionPanel,
  CreateFactorModal,
  DashboardLayoutBase,
  CapabilityMetricToggle,
  SubgroupConfigPopover,
  useIsMobile,
  useGlossary,
  BREAKPOINTS,
  type ChartId,
} from '@variscout/ui';
import {
  useKeyboardNavigation,
  useAnnotations,
  useFilterHandlers,
  useCreateFactorModal,
  useDashboardInsights,
} from '@variscout/hooks';
import { useData } from '../context/DataContext';
import { useDashboardCharts } from '../hooks/useDashboardCharts';
import type { UseFilterNavigationReturn } from '../hooks/useFilterNavigation';
import { Activity, Copy, Check, Download, Settings2, LayoutGrid, List } from 'lucide-react';
import { getColumnNames, type SpecLimits, type Finding } from '@variscout/core';

import type { HighlightIntensity } from '../hooks/useEmbedMessaging';
import type { FindingsCallbacks } from '@variscout/ui';

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
  onManageFactors?: () => void;
  openSpecEditorRequested?: boolean;
  onSpecEditorOpened?: () => void;
  highlightedPointIndex?: number | null;
  filterNav?: UseFilterNavigationReturn;
  onPinFinding?: (noteText?: string) => void;
  findingsCallbacks?: FindingsCallbacks;
  /** All findings (for methodology coach phase detection) */
  findings?: Finding[];
  /** When true, omit stats panel from grid (rendered as sidebar instead) */
  hideStatsInGrid?: boolean;
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
  findingsCallbacks,
  findings: _allFindings,
  hideStatsInGrid = false,
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
    subgroupConfig,
    setSubgroupConfig,
    cpkTarget,
    setCpkTarget,
    // Selection state
    selectedPoints,
    clearSelection,
  } = useData();

  const { getTerm } = useGlossary();

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
  const isMobile = useIsMobile(BREAKPOINTS.phone);

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

  // Helper to update chart titles (must be before early returns — rules-of-hooks)
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...chartTitles, [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  // Accessible live region text for screen readers
  const liveRegionText = useMemo(() => {
    const filterCount = Object.keys(filters || {}).length;
    const parts = [`Showing ${filteredData.length} of ${rawData.length} data points`];
    if (filterCount > 0) {
      parts.push(`${filterCount} filter${filterCount > 1 ? 's' : ''} active`);
    }
    return parts.join('. ');
  }, [filteredData.length, rawData.length, filters]);

  // --- Chart Insight Chips + Capability mode (shared hook) ---
  const {
    ichartInsight,
    boxplotInsight,
    paretoInsight,
    statsInsight,
    handleCpkClick,
    isCapabilityMode,
    capabilityData,
  } = useDashboardInsights({
    stats,
    filteredData,
    outcome,
    specs,
    cpkTarget,
    factorVariations,
    boxplotFactor,
    paretoFactor,
    categoryContributions,
    displayOptions,
    setDisplayOptions,
    subgroupConfig,
  });

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
      className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-surface relative"
    >
      {/* Accessible live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveRegionText}
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-surface flex-shrink-0">
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
          {!focusedChart && (
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

        {/* Toolbar */}
        {onManageFactors && factors.length > 0 && (
          <div className="flex items-center px-4 pt-3 pb-2">
            {/* Layout toggle — desktop only */}
            <div
              className="hidden lg:flex items-center bg-surface-tertiary rounded-lg p-0.5"
              data-export-hide
            >
              <button
                onClick={() => setDisplayOptions({ ...displayOptions, dashboardLayout: 'grid' })}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  (displayOptions.dashboardLayout ?? 'grid') === 'grid'
                    ? 'bg-surface-elevated text-content font-medium shadow-sm'
                    : 'text-content-muted hover:text-content'
                }`}
                title="Grid layout — all charts in viewport"
                aria-label="Grid layout"
              >
                <LayoutGrid size={12} />
                Grid
              </button>
              <button
                onClick={() => setDisplayOptions({ ...displayOptions, dashboardLayout: 'scroll' })}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  displayOptions.dashboardLayout === 'scroll'
                    ? 'bg-surface-elevated text-content font-medium shadow-sm'
                    : 'text-content-muted hover:text-content'
                }`}
                title="Scroll layout — full-width stacked charts"
                aria-label="Scroll layout"
              >
                <List size={12} />
                Scroll
              </button>
            </div>

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
          </div>
        )}

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
        onClose={handleCloseCreateFactorModal}
        selectedCount={selectedPoints.size}
        existingFactors={getColumnNames(rawData)}
        onCreateFactor={handleCreateFactor}
      />

      {/* Dashboard View */}
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
        layout={displayOptions.dashboardLayout ?? 'grid'}
        focusedChart={focusedChart}
        setFocusedChart={setFocusedChart}
        filterChipData={filterChipData}
        cumulativeVariationPct={cumulativeVariationPct}
        annotations={{
          contextMenu,
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
        // Embed mode highlight/click
        ichartHighlightClass={getHighlightClass('ichart')}
        onIChartCardClick={() => handleChartWrapperClick('ichart')}
        boxplotHighlightClass={getHighlightClass('boxplot')}
        onBoxplotCardClick={() => handleChartWrapperClick('boxplot')}
        paretoHighlightClass={getHighlightClass('pareto')}
        onParetoCardClick={() => handleChartWrapperClick('pareto')}
        onStatsPanelClick={() => handleChartWrapperClick('stats')}
        statsPanelHighlightClass={getHighlightClass('stats')}
        ichartObservationCount={chartFindings?.ichart?.length}
        boxplotObservationCount={chartFindings?.boxplot?.length}
        paretoObservationCount={chartFindings?.pareto?.length}
        // PWA-specific: VARISCOUT branding in I-Chart title
        ichartTitleSlot={
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
        // PWA-specific: SpecsPopover in I-Chart controls
        ichartExtraControls={
          <div className="pl-2 border-l border-edge">
            <SpecsPopover
              specs={specs}
              onSave={newSpecs => setSpecs(newSpecs)}
              onOpenAdvanced={() => setShowSpecEditor(true)}
              cpkTarget={cpkTarget}
              onCpkTargetChange={setCpkTarget}
            />
          </div>
        }
        ichartHeaderExtra={
          <div className="flex items-center gap-1">
            <CapabilityMetricToggle
              metric={displayOptions.standardIChartMetric ?? 'measurement'}
              onMetricChange={m =>
                setDisplayOptions({ ...displayOptions, standardIChartMetric: m })
              }
              disabled={specs.usl === undefined && specs.lsl === undefined}
            />
            {displayOptions.standardIChartMetric === 'capability' && (
              <SubgroupConfigPopover
                config={subgroupConfig}
                onConfigChange={setSubgroupConfig}
                availableColumns={factors}
                columnAliases={columnAliases}
              />
            )}
          </div>
        }
        // Render slots
        renderIChartContent={
          <ErrorBoundary componentName="I-Chart">
            <IChart
              onPointClick={onPointClick}
              onSpecClick={() => setShowSpecEditor(true)}
              showBranding={false}
              ichartFindings={chartFindings?.ichart}
              onCreateObservation={
                onAddChartObservation
                  ? (ax: number, ay: number) =>
                      onAddChartObservation('ichart', undefined, undefined, ax, ay)
                  : undefined
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
                showBranding={false}
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
        }
        renderStatsPanel={
          hideStatsInGrid ? undefined : (
            <ErrorBoundary componentName="Stats Panel">
              <StatsPanel
                stats={stats}
                specs={specs}
                filteredData={filteredData}
                outcome={outcome}
                cpkTarget={cpkTarget}
                onCpkClick={!isCapabilityMode ? handleCpkClick : undefined}
                subgroupsMeetingTarget={
                  isCapabilityMode ? capabilityData.subgroupsMeetingTarget : undefined
                }
                subgroupCount={isCapabilityMode ? capabilityData.subgroupResults.length : undefined}
              />
            </ErrorBoundary>
          )
        }
        renderFocusedView={
          focusedChart ? (
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
                  ? (ax: number, ay: number) =>
                      onAddChartObservation('ichart', undefined, undefined, ax, ay)
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
          ) : undefined
        }
        renderSpecEditor={
          showSpecEditor ? (
            <SpecEditor
              specs={specs}
              onSave={handleSaveSpecs}
              onClose={() => setShowSpecEditor(false)}
              style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
            />
          ) : undefined
        }
      />
    </div>
  );
};

export default Dashboard;
