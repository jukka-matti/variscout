import React, { useState, useCallback, useMemo } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import MobileDashboard from './MobileDashboard';
import RegressionPanel from './RegressionPanel';
import GageRRPanel from './GageRRPanel';
import SpecEditor from './settings/SpecEditor';
import SpecsPopover from './settings/SpecsPopover';
import { PresentationView, EmbedFocusView, FocusedChartView } from './views';
import { EditableChartTitle } from '@variscout/charts';
import {
  AnovaResults,
  ErrorBoundary,
  FilterBreadcrumb,
  FactorSelector,
  SelectionPanel,
  CreateFactorModal,
  useIsMobile,
} from '@variscout/ui';
import { useKeyboardNavigation } from '@variscout/hooks';
import { useData } from '../context/DataContext';
import { useDashboardCharts } from '../hooks/useDashboardCharts';
import { Activity, Copy, Check, Maximize2, Layers } from 'lucide-react';
import { createFactorFromSelection, getColumnNames, type StageOrderMode } from '@variscout/core';

import type { ChartId, HighlightIntensity } from '../hooks/useEmbedMessaging';

type AnalysisView = 'dashboard' | 'regression' | 'gagerr';

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
  // Callback to open column mapping dialog (for Pareto upload)
  onOpenColumnMapping?: () => void;
  // External trigger to open spec editor (from MobileMenu)
  openSpecEditorRequested?: boolean;
  onSpecEditorOpened?: () => void;
  // Analysis view controlled from settings
  activeView?: AnalysisView;
  // Highlighted point index from data panel (bi-directional sync)
  highlightedPointIndex?: number | null;
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
  onOpenColumnMapping,
  openSpecEditorRequested,
  onSpecEditorOpened,
  activeView = 'dashboard',
  highlightedPointIndex,
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
    grades,
    setGrades,
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
    // Selection state
    selectedPoints,
    clearSelection,
  } = useData();

  // Modal state for Create Factor
  const [showCreateFactorModal, setShowCreateFactorModal] = useState(false);

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
    // Copy feedback
    copyFeedback,
    handleCopyChart,
    // Pareto factor selector ref
    paretoFactorSelectorRef,
    // Embed mode helpers
    getHighlightClass,
    handleChartWrapperClick,
    // Computed data
    availableOutcomes,
    availableStageColumns,
    anovaResult,
    boxplotData,
    // Filter navigation state
    filterStack,
    applyFilter,
    navigateTo,
    clearFilters,
    updateFilterValues,
    removeFilter,
    // Variation tracking
    breadcrumbItems,
    cumulativeVariationPct,
    factorVariations,
    categoryContributions,
    filterChipData,
    // Filter handler
    handleDrillDown,
  } = useDashboardCharts({
    openSpecEditorRequested,
    onSpecEditorOpened,
    highlightedChart:
      highlightedChart === 'regression'
        ? null
        : (highlightedChart as 'ichart' | 'boxplot' | 'pareto' | 'stats' | null | undefined),
    highlightIntensity,
    onChartClick,
  });

  // Responsive mobile detection
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  // Callback to focus Pareto factor selector (used by ParetoEmptyState)
  const handleParetoSelectFactor = useCallback(() => {
    paretoFactorSelectorRef.current?.focus();
    paretoFactorSelectorRef.current?.click();
  }, [paretoFactorSelectorRef]);

  // Handler for saving specs from SpecEditor
  const handleSaveSpecs = useCallback(
    (
      newSpecs: { usl?: number; lsl?: number; target?: number },
      newGrades: { max: number; label: string; color: string }[]
    ) => {
      setSpecs(newSpecs);
      setGrades(newGrades);
    },
    [setSpecs, setGrades]
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

  // Handle breadcrumb navigation (delegates to hook)
  const handleBreadcrumbNavigate = useCallback((id: string) => navigateTo(id), [navigateTo]);

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

  if (!outcome) return null;

  // Helper to update chart titles
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...chartTitles, [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

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
        onSelectParetoFactor={handleParetoSelectFactor}
        onOpenColumnMapping={onOpenColumnMapping}
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
          onUploadPareto={onOpenColumnMapping}
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
      {/* Sticky Navigation - Breadcrumbs only (tabs moved to Settings) */}
      <div className="sticky top-0 z-30 bg-surface">
        {/* Filter Breadcrumb Navigation with Variation Tracking */}
        <FilterBreadcrumb
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          onUpdateFilterValues={handleUpdateFilterValues}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          cumulativeVariationPct={cumulativeVariationPct}
        />

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

      {/* Regression View */}
      {activeView === 'regression' && (
        <div className="flex-1 m-4 bg-surface-secondary border border-edge rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
          <ErrorBoundary componentName="Regression Panel">
            <RegressionPanel />
          </ErrorBoundary>
        </div>
      )}

      {/* Gage R&R View */}
      {activeView === 'gagerr' && (
        <div className="flex-1 m-4 bg-surface-secondary border border-edge rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
          <ErrorBoundary componentName="Gage R&R Panel">
            <GageRRPanel />
          </ErrorBoundary>
        </div>
      )}

      {/* Dashboard View (default) */}
      {activeView === 'dashboard' && (
        <div className="flex-1 flex flex-col min-h-0">
          {!focusedChart ? (
            // Scrollable Layout
            <div className="flex flex-col gap-4 p-4">
              {/* I-Chart Section */}
              <div
                id="ichart-card"
                data-chart-id="ichart"
                onClick={() => handleChartWrapperClick('ichart')}
                className={`min-h-[400px] bg-surface-secondary border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 flex flex-col transition-all ${getHighlightClass('ichart')}`}
              >
                <div className="flex justify-between items-center mb-2 gap-4">
                  {/* Left: Editable Title */}
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Activity className="text-blue-400" />
                    <EditableChartTitle
                      defaultTitle={`I-Chart: ${outcome}`}
                      value={chartTitles.ichart || ''}
                      onChange={title => setChartTitles({ ...chartTitles, ichart: title })}
                    />
                  </h2>

                  {/* Right: All Controls */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
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

                    {/* Stage Stats (if active) */}
                    {stageColumn && stagedStats && (
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
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 pl-2 border-l border-edge">
                      <button
                        onClick={() => handleCopyChart('ichart-card', 'ichart')}
                        className={`p-1.5 rounded transition-all ${
                          copyFeedback === 'ichart'
                            ? 'bg-green-500/20 text-green-400'
                            : 'text-content-muted hover:text-white hover:bg-surface-tertiary'
                        }`}
                        title="Copy I-Chart to clipboard"
                        aria-label="Copy I-Chart to clipboard"
                      >
                        {copyFeedback === 'ichart' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => setFocusedChart('ichart')}
                        className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                        title="Maximize Chart"
                        aria-label="Maximize chart"
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div id="ichart-container" className="flex-1 min-h-[300px] w-full">
                  <ErrorBoundary componentName="I-Chart">
                    <IChart
                      onPointClick={onPointClick}
                      onSpecClick={() => setShowSpecEditor(true)}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Bottom Section: Boxplot, Pareto, Stats */}
              <div className="flex flex-col lg:flex-row gap-4 min-h-[350px]">
                {/* Secondary Charts Container */}
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  <div
                    id="boxplot-card"
                    data-chart-id="boxplot"
                    onClick={() => handleChartWrapperClick('boxplot')}
                    className={`flex-1 min-h-[280px] bg-surface-secondary border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col transition-all ${getHighlightClass('boxplot')}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                        <EditableChartTitle
                          defaultTitle={`Boxplot: ${boxplotFactor}`}
                          value={chartTitles.boxplot || ''}
                          onChange={title => setChartTitles({ ...chartTitles, boxplot: title })}
                        />
                      </h3>
                      <div className="flex items-center gap-2">
                        <FactorSelector
                          factors={factors}
                          selected={boxplotFactor}
                          onChange={setBoxplotFactor}
                          hasActiveFilter={!!filters?.[boxplotFactor]?.length}
                        />
                        <button
                          onClick={() => handleCopyChart('boxplot-card', 'boxplot')}
                          className={`p-1.5 rounded transition-all ${
                            copyFeedback === 'boxplot'
                              ? 'bg-green-500/20 text-green-400'
                              : 'text-content-muted hover:text-white hover:bg-surface-tertiary'
                          }`}
                          title="Copy Boxplot to clipboard"
                          aria-label="Copy Boxplot to clipboard"
                        >
                          {copyFeedback === 'boxplot' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => setFocusedChart('boxplot')}
                          className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                          title="Maximize Chart"
                          aria-label="Maximize chart"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div id="boxplot-container" className="flex-1 min-h-[180px]">
                      <ErrorBoundary componentName="Boxplot">
                        {boxplotFactor && (
                          <Boxplot
                            factor={boxplotFactor}
                            onDrillDown={handleDrillDown}
                            variationPct={factorVariations.get(boxplotFactor)}
                            categoryContributions={categoryContributions?.get(boxplotFactor)}
                          />
                        )}
                      </ErrorBoundary>
                    </div>
                  </div>

                  {showParetoPanel && (
                    <div
                      id="pareto-card"
                      data-chart-id="pareto"
                      onClick={() => handleChartWrapperClick('pareto')}
                      className={`flex-1 min-h-[280px] bg-surface-secondary border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col transition-all ${getHighlightClass('pareto')}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                          <EditableChartTitle
                            defaultTitle={`Pareto: ${paretoFactor}`}
                            value={chartTitles.pareto || ''}
                            onChange={title => setChartTitles({ ...chartTitles, pareto: title })}
                          />
                        </h3>
                        <div className="flex items-center gap-2">
                          <FactorSelector
                            factors={factors}
                            selected={paretoFactor}
                            onChange={setParetoFactor}
                            hasActiveFilter={!!filters?.[paretoFactor]?.length}
                          />
                          <button
                            onClick={() => handleCopyChart('pareto-card', 'pareto')}
                            className={`p-1.5 rounded transition-all ${
                              copyFeedback === 'pareto'
                                ? 'bg-green-500/20 text-green-400'
                                : 'text-content-muted hover:text-white hover:bg-surface-tertiary'
                            }`}
                            title="Copy Pareto Chart to clipboard"
                            aria-label="Copy Pareto chart to clipboard"
                          >
                            {copyFeedback === 'pareto' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => setFocusedChart('pareto')}
                            className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                            title="Maximize Chart"
                            aria-label="Maximize chart"
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div id="pareto-container" className="flex-1 min-h-[180px]">
                        <ErrorBoundary componentName="Pareto Chart">
                          {paretoFactor && (
                            <ParetoChart
                              factor={paretoFactor}
                              onDrillDown={handleDrillDown}
                              showComparison={showParetoComparison}
                              onToggleComparison={() => toggleParetoComparison()}
                              onHide={() => setShowParetoPanel(false)}
                              onSelectFactor={handleParetoSelectFactor}
                              onUploadPareto={onOpenColumnMapping}
                              availableFactors={factors}
                              aggregation={paretoAggregation}
                              onToggleAggregation={() =>
                                setParetoAggregation(
                                  paretoAggregation === 'count' ? 'value' : 'count'
                                )
                              }
                            />
                          )}
                        </ErrorBoundary>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Panel */}
                <div
                  data-chart-id="stats"
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
              </div>
            </div>
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
              onSetOutcome={setOutcome}
              onSetBoxplotFactor={setBoxplotFactor}
              onSetParetoFactor={setParetoFactor}
              onDrillDown={handleDrillDown}
              onToggleParetoComparison={() => toggleParetoComparison()}
              onHideParetoPanel={() => setShowParetoPanel(false)}
              onSelectParetoFactor={handleParetoSelectFactor}
              onOpenColumnMapping={onOpenColumnMapping}
              onPointClick={onPointClick}
              onSpecClick={() => setShowSpecEditor(true)}
              onNextChart={handleNextChart}
              onPrevChart={handlePrevChart}
              onExitFocus={() => setFocusedChart(null)}
              paretoAggregation={paretoAggregation}
              onToggleParetoAggregation={() =>
                setParetoAggregation(paretoAggregation === 'count' ? 'value' : 'count')
              }
            />
          )}
        </div>
      )}

      {/* Spec Editor Popover */}
      {showSpecEditor && (
        <SpecEditor
          specs={specs}
          grades={grades}
          onSave={handleSaveSpecs}
          onClose={() => setShowSpecEditor(false)}
          style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
    </div>
  );
};

export default Dashboard;
