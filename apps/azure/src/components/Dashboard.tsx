import React, { useState, useCallback, useEffect, useMemo } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import CapabilityHistogram from './charts/CapabilityHistogram';
import ProbabilityPlot from './charts/ProbabilityPlot';
import { useProbabilityPlotData } from '@variscout/hooks';
import MobileChartCarousel from './MobileChartCarousel';
import PerformanceDashboard from './PerformanceDashboard';
import YamazumiDashboard from './YamazumiDashboard';
import SpecEditor from './settings/SpecEditor';
import FocusedChartView from './views/FocusedChartView';
import { useProjectStore } from '@variscout/stores';
import { useFilteredData, useAnalysisStats, useStagedAnalysis } from '@variscout/hooks';
import { resolveMode } from '@variscout/core/strategy';
import type { ResolvedMode } from '@variscout/core/strategy';
import { useDashboardCharts } from '../hooks';
import type { UseFilterNavigationReturn } from '../hooks';
import {
  ErrorBoundary,
  ProcessHealthBar,
  VerificationCard,
  NarrativeBar,
  SelectionPanel,
  CreateFactorModal,
  DashboardLayoutBase,
  DashboardChartCard,
  FocusedViewOverlay,
  CapabilityMetricToggle,
  SubgroupConfigPopover,
  useIsMobile,
  useGlossary,
  BREAKPOINTS,
} from '@variscout/ui';
import { getColumnNames, getEtaSquared } from '@variscout/core';
import { getScopedFindings, formatFindingFilters } from '@variscout/core/findings';
import type { Finding } from '@variscout/core';
import type { AzureFindingsCallbacks, FilterChipData } from '@variscout/ui';
import {
  useAnnotations,
  useFilterHandlers,
  useCreateFactorModal,
  useDashboardInsights,
  useProcessProjection,
  useJourneyPhase,
  useCapabilityIChartData,
} from '@variscout/hooks';
import type { AIContext } from '@variscout/core';
import type { ViewState } from '@variscout/hooks';
import { Activity, BarChart3, Gauge, Timer, ArrowLeft, Settings2 } from 'lucide-react';

type DashboardTab = 'analysis' | 'performance' | 'yamazumi';

/** Mode-dispatched tab configuration (ADR-047 pattern). */
interface ModeTab {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ size: number }>;
  activeColor: string;
}

const modeTabs: Record<ResolvedMode, ModeTab[]> = {
  standard: [{ id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' }],
  capability: [{ id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' }],
  performance: [
    { id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' },
    { id: 'performance', label: 'Performance', icon: Gauge, activeColor: 'bg-blue-600' },
  ],
  yamazumi: [
    { id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' },
    { id: 'yamazumi', label: 'Yamazumi', icon: Timer, activeColor: 'bg-amber-600' },
  ],
  defect: [{ id: 'analysis', label: 'Analysis', icon: BarChart3, activeColor: 'bg-blue-600' }],
};

/** Default tab when switching to a mode (undefined = keep current). */
const modeDefaultTab: Record<ResolvedMode, DashboardTab | undefined> = {
  standard: undefined,
  capability: undefined,
  performance: undefined,
  yamazumi: 'yamazumi',
  defect: undefined,
};

interface DashboardPerformanceProps {
  drillFromPerformance?: string | null;
  onBackToPerformance?: () => void;
  onDrillToMeasure?: (measureId: string) => void;
}

interface DashboardAIProps {
  fetchChartInsight?: (userPrompt: string) => Promise<string>;
  aiContext?: AIContext | null;
  aiEnabled?: boolean;
  narrative?: string | null;
  narrativeLoading?: boolean;
  narrativeCached?: boolean;
  narrativeError?: string | null;
  onNarrativeAsk?: () => void;
  onNarrativeRetry?: () => void;
  onAskCoScoutFromCategory?: (focusContext: {
    chartType: 'boxplot' | 'pareto';
    category: { name: string; mean?: number; etaSquaredPct?: number };
  }) => void;
}

interface DashboardProps {
  // Core
  onPointClick?: (index: number) => void;
  highlightedPointIndex?: number | null;
  filterNav?: UseFilterNavigationReturn;
  onManageFactors?: () => void;
  onPinFinding?: (noteText?: string) => void;
  onShareChart?: (chartType: string) => void;
  findingsCallbacks?: AzureFindingsCallbacks;
  findings?: Finding[];
  /** Factor Intelligence: callback when user clicks "Investigate" on a significant factor */
  onInvestigateFactor?: (effect: import('@variscout/core/stats').FactorMainEffect) => void;
  /** External factor switch request (from question click) — sets boxplot + pareto factor */
  requestedFactor?: { factor: string; seq: number } | null;
  // Persistence
  initialViewState?: ViewState;
  onViewStateChange?: (partial: Partial<ViewState>) => void;
  // Domain groups
  performance?: DashboardPerformanceProps;
  ai?: DashboardAIProps;
  /** Projected Cpk map from improvement workspace (finding ID -> projected Cpk) */
  projectedCpkMap?: Record<string, number>;
}

const Dashboard = ({
  onPointClick,
  highlightedPointIndex,
  filterNav: externalFilterNav,
  initialViewState,
  onViewStateChange,
  onManageFactors,
  onPinFinding,
  onShareChart,
  findingsCallbacks,
  findings: allFindings,
  onInvestigateFactor,
  requestedFactor,
  performance = {},
  ai = {},
  projectedCpkMap: externalProjectedCpkMap,
}: DashboardProps) => {
  const { drillFromPerformance, onBackToPerformance, onDrillToMeasure } = performance;
  const {
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
  } = ai;
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
  const analysisMode = useProjectStore(s => s.analysisMode);
  const yamazumiMapping = useProjectStore(s => s.yamazumiMapping);
  const columnAliases = useProjectStore(s => s.columnAliases);
  const stageColumn = useProjectStore(s => s.stageColumn);
  const stageOrderMode = useProjectStore(s => s.stageOrderMode);
  const setStageColumn = useProjectStore(s => s.setStageColumn);
  const setStageOrderMode = useProjectStore(s => s.setStageOrderMode);
  const paretoAggregation = useProjectStore(s => s.paretoAggregation);
  const setParetoAggregation = useProjectStore(s => s.setParetoAggregation);
  const chartTitles = useProjectStore(s => s.chartTitles);
  const timeColumn = useProjectStore(s => s.timeColumn);
  const displayOptions = useProjectStore(s => s.displayOptions);
  const setDisplayOptions = useProjectStore(s => s.setDisplayOptions);
  const subgroupConfig = useProjectStore(s => s.subgroupConfig);
  const setSubgroupConfig = useProjectStore(s => s.setSubgroupConfig);
  const cpkTarget = useProjectStore(s => s.cpkTarget);
  const setCpkTarget = useProjectStore(s => s.setCpkTarget);
  const selectedPoints = useProjectStore(s => s.selectedPoints);
  const clearSelection = useProjectStore(s => s.clearSelection);
  const { filteredData } = useFilteredData();
  const { stats, isComputing } = useAnalysisStats();
  const { stagedStats } = useStagedAnalysis();
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

  // Resolved analysis mode (ADR-047)
  const resolvedMode = resolveMode(analysisMode, {
    standardIChartMetric: displayOptions.standardIChartMetric,
  });

  // Initialize focused chart from persisted view state (one-time on mount)
  const [hasRestoredFocusedChart, setHasRestoredFocusedChart] = useState(false);

  // Auto-switch to analysis tab when drilling from performance mode
  useEffect(() => {
    if (drillFromPerformance) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to external navigation event (performance drill-down)
      setActiveTab('analysis');
    }
  }, [drillFromPerformance, setActiveTab]);

  // Auto-switch tab when analysis mode changes (e.g., yamazumi → yamazumi tab)
  useEffect(() => {
    const defaultTab = modeDefaultTab[resolvedMode];
    if (defaultTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to external analysis mode change
      setActiveTab(defaultTab);
    }
  }, [resolvedMode, setActiveTab]);

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
    filterStack,
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

  // Apply external factor switch (from question click)
  useEffect(() => {
    if (requestedFactor && factors.includes(requestedFactor.factor)) {
      setBoxplotFactor(requestedFactor.factor);
      setParetoFactor(requestedFactor.factor);
    }
  }, [requestedFactor, factors, setBoxplotFactor, setParetoFactor]);

  // Restore persisted focused chart (one-time after hook initializes)
  useEffect(() => {
    if (!hasRestoredFocusedChart && initialViewState?.focusedChart) {
      const chart = initialViewState.focusedChart;
      // FocusedChart only covers standard charts; skip yamazumi (handled by YamazumiDashboard)
      if (chart === 'ichart' || chart === 'boxplot' || chart === 'pareto') {
        setFocusedChart(chart);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restoration from persisted view state
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

  // Process projection intelligence (Phase 2-4)
  const journeyPhase = useJourneyPhase(!!rawData?.length, allFindings ?? []);
  const projectedCpkMap = externalProjectedCpkMap ?? {};

  const scopedFindings = useMemo(
    () => (allFindings ? getScopedFindings(allFindings) : undefined),
    [allFindings]
  );
  const benchmarkData = useMemo(() => {
    const bm = allFindings?.find(f => f.role === 'benchmark' && f.benchmarkStats);
    if (!bm?.benchmarkStats) return null;
    return {
      stats: bm.benchmarkStats,
      label: formatFindingFilters(bm.context, columnAliases),
    };
  }, [allFindings, columnAliases]);
  const improvementData = useMemo(() => {
    const entries = Object.values(projectedCpkMap);
    if (entries.length === 0) return { cpk: null, label: '' };
    const bestCpk = Math.max(...entries);
    return { cpk: bestCpk, label: `${entries.length} scoped` };
  }, [projectedCpkMap]);
  const { centeringOpportunity, specSuggestion, activeProjection } = useProcessProjection({
    rawData: rawData ?? [],
    filteredData: filteredData ?? [],
    outcome,
    specs,
    stats,
    filterStack,
    scopedFindings,
    benchmark: benchmarkData,
    journeyPhase,
    improvementProjectedCpk: improvementData.cpk,
    improvementLabel: improvementData.label,
  });

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

  // Histogram data for standalone chart cards (grid mode)
  const histogramData = useMemo(() => {
    if (!outcome || !filteredData || filteredData.length === 0) return [];
    return filteredData
      .map((d: Record<string, unknown>) => Number(d[outcome]))
      .filter((v: number) => !isNaN(v));
  }, [filteredData, outcome]);

  // Probability plot series — linked to boxplot factor for multi-series grouping
  const probabilitySeries = useProbabilityPlotData({
    values: histogramData,
    factorColumn: boxplotFactor,
    rows: filteredData,
  });

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
    onFactorCreated: name => {
      setBoxplotFactor(name);
      setParetoFactor(name);
    },
  });

  // Compute η² per factor for insight chips (replaces deleted useVariationTracking)
  const factorVariations = useMemo(() => {
    if (!outcome || !filteredData?.length || !factors?.length) return new Map<string, number>();
    return new Map(factors.map(f => [f, getEtaSquared(filteredData, f, outcome) * 100]));
  }, [filteredData, factors, outcome]);

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
    filteredData,
    outcome,
    specs,
    cpkTarget,
    factorVariations,
    boxplotFactor,
    paretoFactor,
    displayOptions,
    setDisplayOptions,
    subgroupConfig,
    aiEnabled: aiEnabled ?? false,
    aiContext,
    fetchChartInsight,
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

  if (!outcome) return null;

  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto lg:overflow-hidden bg-surface relative"
    >
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-surface flex-shrink-0">
        {/* Process Health Bar — replaces FilterBreadcrumb + Toolbar */}
        {!isPhone && (
          <ProcessHealthBar
            stats={stats}
            specs={specs}
            cpkTarget={cpkTarget}
            onCpkTargetChange={setCpkTarget}
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
        )}

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
          {modeTabs[resolvedMode].map(({ id, label, icon: Icon, activeColor }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? `${activeColor} text-white`
                  : 'bg-surface-secondary text-content-secondary hover:text-content hover:bg-surface-tertiary'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
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

      {/* Yamazumi Tab */}
      {activeTab === 'yamazumi' && yamazumiMapping && (
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary componentName="Yamazumi Dashboard">
            <YamazumiDashboard
              mapping={yamazumiMapping}
              onBarClick={key => handleDrillDown(yamazumiMapping.stepColumn, key)}
            />
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
              onInvestigateFactor={onInvestigateFactor}
            />
          ) : (
            <div className="flex flex-1 min-h-0">
              <DashboardLayoutBase
                outcome={outcome}
                factors={factors}
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
                controlStats={
                  isCapabilityMode && capabilityIChartData?.cpkStats
                    ? capabilityIChartData.cpkStats
                    : stats
                }
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
                  <div className="flex items-center gap-2">
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
                }
                // Boxplot factor wrapper (visual feedback removed with variation tracking)
                boxplotFactorWrapper={selector => (
                  <div className="rounded-lg transition-all duration-300">{selector}</div>
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
                        highlightedCategories={boxplotHighlights}
                        onContextMenu={(key, event) => handleContextMenu('boxplot', key, event)}
                        findings={chartFindings?.boxplot}
                        onEditFinding={onEditFinding}
                        onDeleteFinding={onDeleteFinding}
                        isComputing={isComputing}
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
                        isComputing={isComputing}
                      />
                    )}
                  </ErrorBoundary>
                }
                /* Stats panel removed from grid — key stats now in ProcessHealthBar toolbar.
                   Stats sidebar (left) provides detailed view when toggled. */
                renderVerificationCard={
                  histogramData.length > 0 && stats ? (
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
                          <CapabilityHistogram
                            data={histogramData}
                            specs={specs}
                            mean={stats.mean}
                          />
                        ) : focusedChart === 'probability-plot' &&
                          histogramData.length > 0 &&
                          stats ? (
                          <ProbabilityPlot series={probabilitySeries} />
                        ) : null}
                      </DashboardChartCard>
                    </FocusedViewOverlay>
                  ) : focusedChart ? (
                    <FocusedChartView
                      focusedChart={focusedChart as 'ichart' | 'boxplot' | 'pareto'}
                      onPrev={handlePrevChart}
                      onNext={handleNextChart}
                      onExit={() => setFocusedChart(null)}
                      displayOptions={displayOptions}
                      columnAliases={columnAliases}
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
                      anovaResult={anovaResult}
                      boxplotData={boxplotData}
                      boxplotChartTitle={chartTitles.boxplot || ''}
                      onSetBoxplotFactor={setBoxplotFactor}
                      onDrillDown={handleDrillDown}
                      onBoxplotTitleChange={title => handleChartTitleChange('boxplot', title)}
                      boxplotHighlightedCategories={boxplotHighlights}
                      onBoxplotContextMenu={(key, event) =>
                        handleContextMenu('boxplot', key, event)
                      }
                      boxplotFindings={chartFindings?.boxplot}
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
            </div>
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
