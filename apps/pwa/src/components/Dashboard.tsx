import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { FilterChipData } from '@variscout/ui';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import { useProbabilityPlotData } from '@variscout/hooks';
import MobileDashboard from './MobileDashboard';
import SpecEditor from './settings/SpecEditor';
import SpecsPopover from './settings/SpecsPopover';
import { EmbedFocusView, FocusedChartView } from './views';
import { EditableChartTitle } from '@variscout/ui';
import {
  ErrorBoundary,
  ProcessHealthBar,
  VerificationCard,
  SelectionPanel,
  CreateFactorModal,
  DashboardLayoutBase,
  DashboardChartCard,
  FocusedViewOverlay,
  CapabilityMetricToggle,
  SubgroupConfigPopover,
  DefectSummary,
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
  useProcessProjection,
  useJourneyPhase,
  useCapabilityIChartData,
  useDefectTransform,
  useDefectSummary,
} from '@variscout/hooks';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData, useAnalysisStats, useStagedAnalysis } from '@variscout/hooks';
import { useDashboardCharts } from '../hooks/useDashboardCharts';
import type { UseFilterNavigationReturn } from '../hooks/useFilterNavigation';
import { Activity } from 'lucide-react';
import { getColumnNames, getEtaSquared, type SpecLimits, type Finding } from '@variscout/core';
import { resolveMode as resolveModeUtil } from '@variscout/core/strategy';
import { useProjectionStore } from '../features/projection/projectionStore';

import type { HighlightIntensity } from '../hooks/useEmbedMessaging';
import type { FindingsCallbacks } from '@variscout/ui';

interface DashboardProps {
  onPointClick?: (index: number) => void;
  // Embed mode highlight props
  highlightedChart?: ChartId | null;
  highlightIntensity?: HighlightIntensity;
  onChartClick?: (chartId: ChartId) => void;
  // Embed focus: when set, render only this single chart (for iframe embeds)
  embedFocusChart?: 'ichart' | 'boxplot' | 'pareto' | 'stats' | null;
  // Embed stats tab: when set, auto-selects this tab in PI Panel
  embedStatsTab?: 'summary' | 'data' | 'whatif' | null;
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
  /** Export CSV callback (for toolbar) */
  onExportCSV?: () => void;
  /** Export image callback (for toolbar) */
  onExportImage?: () => void;
  /** External factor switch request (from question click) — sets boxplot + pareto factor */
  requestedFactor?: { factor: string; seq: number } | null;
}

const Dashboard = ({
  onPointClick,
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
  hideStatsInGrid: _hideStatsInGrid = false,
  onExportCSV,
  onExportImage: _onExportImage,
  requestedFactor,
}: DashboardProps) => {
  const { onAddChartObservation, chartFindings, onEditFinding, onDeleteFinding } =
    findingsCallbacks ?? {};
  const outcome = useProjectStore(s => s.outcome);
  const factors = useProjectStore(s => s.factors);
  const setOutcome = useProjectStore(s => s.setOutcome);
  const rawData = useProjectStore(s => s.rawData);
  const setRawData = useProjectStore(s => s.setRawData);
  const specs = useProjectStore(s => s.specs);
  const setSpecs = useProjectStore(s => s.setSpecs);
  const filters = useProjectStore(s => s.filters);
  const setFilters = useProjectStore(s => s.setFilters);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const stageColumn = useProjectStore(s => s.stageColumn);
  const setStageColumn = useProjectStore(s => s.setStageColumn);
  const stageOrderMode = useProjectStore(s => s.stageOrderMode);
  const setStageOrderMode = useProjectStore(s => s.setStageOrderMode);
  const chartTitles = useProjectStore(s => s.chartTitles);
  const setChartTitles = useProjectStore(s => s.setChartTitles);
  const paretoAggregation = useProjectStore(s => s.paretoAggregation);
  const setParetoAggregation = useProjectStore(s => s.setParetoAggregation);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const setSubgroupConfig = useProjectStore(s => s.setSubgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const setCpkTarget = useProjectStore(s => s.setCpkTarget);
  const selectedPoints = useProjectStore(s => s.selectedPoints);
  const clearSelection = useProjectStore(s => s.clearSelection);
  const analysisMode = useProjectStore(s => s.analysisMode);
  const defectMapping = useProjectStore(s => s.defectMapping);
  const { filteredData } = useFilteredData();
  const { stats, isComputing } = useAnalysisStats();
  const { stagedStats } = useStagedAnalysis();

  // Defect mode: transform filtered data into aggregated defect rates
  const isDefectMode = resolveModeUtil(analysisMode) === 'defect';
  const defectResult = useDefectTransform(filteredData, defectMapping, analysisMode);

  // When in defect mode, override data + outcome + factors from the transform result
  const effectiveData = isDefectMode && defectResult ? defectResult.data : filteredData;
  const effectiveOutcome = isDefectMode && defectResult ? defectResult.outcomeColumn : outcome;
  const effectiveFactors = isDefectMode && defectResult ? defectResult.factors : factors;

  // In defect mode + value aggregation, use cost/duration column for Pareto Σ mode
  const defectParetoOutcome = (() => {
    if (!isDefectMode || !defectResult || paretoAggregation !== 'value') return undefined;
    // Prefer cost column, fall back to duration, then to default outcome
    if (defectResult.costColumn) return defectResult.costColumn;
    if (defectResult.durationColumn) return defectResult.durationColumn;
    return undefined; // fall back to effectiveOutcome
  })();

  // Compute DefectSummary props from transformed data (extracted hook)
  const defectSummaryProps = useDefectSummary(isDefectMode ? defectResult : null, defectMapping);

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
    filterStack,
    clearFilters,
    updateFilterValues,
    removeFilter,
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

  // Apply external factor switch (from question click)
  useEffect(() => {
    if (requestedFactor && effectiveFactors.includes(requestedFactor.factor)) {
      setBoxplotFactor(requestedFactor.factor);
      setParetoFactor(requestedFactor.factor);
    }
  }, [requestedFactor, effectiveFactors, setBoxplotFactor, setParetoFactor]);

  // Defect mode drill-down: auto-switch Boxplot/Pareto to next best factor
  // When user filters to a specific defect type, grouping by defect type is redundant.
  const prevDefectFilterRef = useRef(false);
  useEffect(() => {
    if (!isDefectMode || !defectMapping?.defectTypeColumn) {
      prevDefectFilterRef.current = false;
      return;
    }
    const defectCol = defectMapping.defectTypeColumn;
    const hasDefectFilter = defectCol in (filters ?? {});
    const wasFiltered = prevDefectFilterRef.current;
    prevDefectFilterRef.current = hasDefectFilter;

    // Only auto-switch on entering the drill (filter added), not on removal
    if (hasDefectFilter && !wasFiltered) {
      const nextFactor = effectiveFactors.find(f => f !== defectCol);
      if (nextFactor) {
        setBoxplotFactor(nextFactor);
        setParetoFactor(nextFactor);
      }
    }
  }, [isDefectMode, defectMapping, filters, effectiveFactors, setBoxplotFactor, setParetoFactor]);

  // Build filter chip data from filter stack for breadcrumb display
  const filterChipData: FilterChipData[] = useMemo(() => {
    if (!filterStack || filterStack.length === 0 || !rawData?.length) return [];
    return filterStack
      .filter((f): f is typeof f & { factor: string } => !!f.factor)
      .map(filter => {
        const allValues = [...new Set(rawData.map(row => row[filter.factor]))];
        return {
          factor: filter.factor,
          values: filter.values,
          availableValues: allValues.map(val => ({
            value: val as string | number,
            count: rawData.filter(row => row[filter.factor] === val).length,
            isSelected: filter.values.includes(val as string | number),
          })),
        };
      });
  }, [filterStack, rawData]);

  // Responsive mobile detection
  const isMobile = useIsMobile(BREAKPOINTS.phone);

  // Process projection intelligence (Phase 2-4)
  const journeyPhase = useJourneyPhase(!!rawData?.length, _allFindings ?? []);
  const projectionResult = useProcessProjection({
    rawData: rawData ?? [],
    filteredData: filteredData ?? [],
    outcome,
    specs,
    stats,
    filterStack,
    journeyPhase,
  });
  const { centeringOpportunity, specSuggestion, activeProjection } = projectionResult;

  // Sync projection data to store (consumed by sidebar)
  useEffect(() => {
    useProjectionStore.setState({
      activeProjection: projectionResult.activeProjection,
      drillProjection: projectionResult.drillProjection,
      benchmarkProjection: projectionResult.benchmarkProjection,
      cumulativeProjection: projectionResult.cumulativeProjection,
      centeringOpportunity: projectionResult.centeringOpportunity,
      specSuggestion: projectionResult.specSuggestion,
    });
  }, [
    projectionResult.activeProjection,
    projectionResult.drillProjection,
    projectionResult.benchmarkProjection,
    projectionResult.cumulativeProjection,
    projectionResult.centeringOpportunity,
    projectionResult.specSuggestion,
  ]);

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
    onFactorCreated: name => {
      setBoxplotFactor(name);
      setParetoFactor(name);
    },
  });

  // Helper to update chart titles (must be before early returns — rules-of-hooks)
  const handleChartTitleChange = useCallback(
    (chart: 'ichart' | 'boxplot' | 'pareto', title: string) => {
      setChartTitles({ ...chartTitles, [chart]: title });
    },
    [chartTitles, setChartTitles]
  );

  // Histogram data for standalone chart cards (grid mode)
  const histogramData = useMemo(() => {
    if (!effectiveOutcome || !effectiveData || effectiveData.length === 0) return [];
    return effectiveData
      .map((d: Record<string, unknown>) => Number(d[effectiveOutcome]))
      .filter((v: number) => !isNaN(v));
  }, [effectiveData, effectiveOutcome]);

  // Probability plot series — linked to boxplot factor for multi-series grouping
  const probabilitySeries = useProbabilityPlotData({
    values: histogramData,
    factorColumn: boxplotFactor,
    rows: filteredData,
  });

  // Accessible live region text for screen readers
  const liveRegionText = useMemo(() => {
    const filterCount = Object.keys(filters || {}).length;
    const parts = [`Showing ${filteredData.length} of ${rawData.length} data points`];
    if (filterCount > 0) {
      parts.push(`${filterCount} filter${filterCount > 1 ? 's' : ''} active`);
    }
    return parts.join('. ');
  }, [filteredData.length, rawData.length, filters]);

  // Compute η² per factor for insight chips (replaces deleted useVariationTracking)
  const factorVariations = useMemo(() => {
    if (!effectiveOutcome || !effectiveData?.length || !effectiveFactors?.length)
      return new Map<string, number>();
    return new Map(
      effectiveFactors.map(f => [f, getEtaSquared(effectiveData, f, effectiveOutcome) * 100])
    );
  }, [effectiveData, effectiveFactors, effectiveOutcome]);

  // --- Chart Insight Chips + Capability mode (shared hook) ---
  const {
    ichartInsight,
    boxplotInsight,
    paretoInsight,
    statsInsight,
    handleCpkClick,
    isCapabilityMode,
  } = useDashboardInsights({
    stats,
    filteredData: effectiveData,
    outcome: effectiveOutcome,
    specs,
    cpkTarget,
    factorVariations,
    boxplotFactor,
    paretoFactor,
    displayOptions,
    setDisplayOptions,
    subgroupConfig,
  });

  // Capability I-Chart data for ProcessHealthBar stats
  const capabilityIChartData = useCapabilityIChartData({
    filteredData,
    outcome: outcome ?? '',
    specs,
    subgroupConfig,
    cpkTarget,
    enabled: isCapabilityMode,
  });

  const capabilityStats =
    isCapabilityMode && capabilityIChartData.subgroupResults.length > 0
      ? {
          subgroupsMeetingTarget: capabilityIChartData.subgroupsMeetingTarget ?? 0,
          totalSubgroups: capabilityIChartData.subgroupResults.length,
        }
      : undefined;

  if (!effectiveOutcome) return null;

  // Embed Focus Mode - render only the specified chart (for iframe embeds)
  if (embedFocusChart) {
    return (
      <EmbedFocusView
        focusChart={embedFocusChart}
        outcome={effectiveOutcome}
        boxplotFactor={boxplotFactor}
        paretoFactor={paretoFactor}
        factors={effectiveFactors}
        stats={stats}
        specs={specs}
        filteredData={filteredData}
        filters={filters}
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
          outcome={effectiveOutcome}
          factors={effectiveFactors}
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
          onUpdateFilterValues={handleUpdateFilterValues}
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
        {/* Process Health Bar — replaces FilterBreadcrumb + Toolbar */}
        <ProcessHealthBar
          stats={stats}
          specs={specs}
          cpkTarget={cpkTarget}
          sampleCount={filteredData?.length ?? 0}
          filterChipData={filterChipData}
          columnAliases={columnAliases}
          onUpdateFilterValues={handleUpdateFilterValues}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          onPinFinding={onPinFinding}
          layout={displayOptions.dashboardLayout ?? 'grid'}
          onLayoutChange={l => setDisplayOptions({ ...displayOptions, dashboardLayout: l })}
          factorCount={factors.length}
          onManageFactors={onManageFactors}
          onExportCSV={onExportCSV}
          onSetSpecs={() => setShowSpecEditor(true)}
          onCpkClick={!isCapabilityMode ? handleCpkClick : undefined}
          centeringOpportunity={centeringOpportunity}
          specSuggestion={specSuggestion}
          activeProjection={activeProjection}
          onAcceptSpecSuggestion={(lsl, usl) => {
            setSpecs({ ...specs, lsl, usl });
            setShowSpecEditor(true);
          }}
          isCapabilityMode={isCapabilityMode}
          capabilityStats={capabilityStats}
        />

        {/* Selection Panel - Shows when points are brushed in IChart */}
        {selectedPoints.size > 0 && (
          <SelectionPanel
            selectedIndices={selectedPoints}
            data={effectiveData}
            outcome={effectiveOutcome}
            columnAliases={columnAliases}
            factors={effectiveFactors}
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
        outcome={effectiveOutcome}
        factors={effectiveFactors}
        columnAliases={columnAliases}
        filters={filters}
        showFilterContext={displayOptions.showFilterContext !== false}
        showViolin={displayOptions.showViolin ?? false}
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
        onPIPanelClick={() => handleChartWrapperClick('stats')}
        piPanelHighlightClass={getHighlightClass('stats')}
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
                  defaultTitle={`I-Chart: ${effectiveOutcome}`}
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
              dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
              outcomeOverride={isDefectMode && defectResult ? effectiveOutcome : undefined}
            />
          </ErrorBoundary>
        }
        renderBoxplotContent={
          <ErrorBoundary componentName="Boxplot">
            {boxplotFactor && (
              <Boxplot
                factor={boxplotFactor}
                onDrillDown={handleDrillDown}
                showBranding={false}
                highlightedCategories={boxplotHighlights}
                onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                findings={chartFindings?.boxplot}
                onEditFinding={onEditFinding}
                onDeleteFinding={onDeleteFinding}
                isComputing={isComputing}
                dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
                outcomeOverride={isDefectMode && defectResult ? effectiveOutcome : undefined}
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
                availableFactors={effectiveFactors}
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
                isComputing={isComputing}
                dataOverride={isDefectMode && defectResult ? effectiveData : undefined}
                outcomeOverride={
                  isDefectMode && defectResult
                    ? (defectParetoOutcome ?? effectiveOutcome)
                    : undefined
                }
                onFactorSwitch={isDefectMode ? setParetoFactor : undefined}
              />
            )}
          </ErrorBoundary>
        }
        /* Stats panel removed from grid — key stats now in ProcessHealthBar toolbar.
           Stats sidebar (Azure) or Stats toggle provides detailed view when needed. */
        renderVerificationCard={
          isDefectMode && defectSummaryProps ? (
            <DefectSummary {...defectSummaryProps} />
          ) : histogramData.length > 0 && stats ? (
            <VerificationCard
              renderHistogram={
                <CapabilityHistogram data={histogramData} specs={specs} mean={stats.mean} />
              }
              renderProbabilityPlot={<ProbabilityPlot series={probabilitySeries} />}
            />
          ) : undefined
        }
        renderFocusedView={
          focusedChart === 'histogram' || focusedChart === 'probability-plot' ? (
            <FocusedViewOverlay onPrev={handlePrevChart} onNext={handleNextChart}>
              <DashboardChartCard
                id={`${focusedChart}-focused`}
                testId={`chart-${focusedChart}-focused`}
                chartName={focusedChart}
                onMaximize={() => setFocusedChart(null)}
                copyFeedback={copyFeedback}
                onCopyChart={handleCopyChart}
                onDownloadPng={handleDownloadPng}
                onDownloadSvg={handleDownloadSvg}
                title={
                  <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    {focusedChart === 'histogram' ? 'Histogram' : 'Probability Plot'}
                  </h3>
                }
              >
                {focusedChart === 'histogram' && histogramData.length > 0 && stats ? (
                  <CapabilityHistogram data={histogramData} specs={specs} mean={stats.mean} />
                ) : focusedChart === 'probability-plot' && histogramData.length > 0 && stats ? (
                  <ProbabilityPlot series={probabilitySeries} />
                ) : null}
              </DashboardChartCard>
            </FocusedViewOverlay>
          ) : focusedChart ? (
            <FocusedChartView
              focusedChart={focusedChart as 'ichart' | 'boxplot' | 'pareto'}
              outcome={effectiveOutcome}
              availableOutcomes={availableOutcomes}
              boxplotFactor={boxplotFactor}
              paretoFactor={paretoFactor}
              factors={effectiveFactors}
              filters={filters}
              showParetoComparison={showParetoComparison}
              anovaResult={anovaResult}
              boxplotData={boxplotData}
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
