import React, { useState, useEffect, useMemo, useCallback } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import MobileDashboard from './MobileDashboard';
import AnovaResults from './AnovaResults';
import RegressionPanel from './RegressionPanel';
import GageRRPanel from './GageRRPanel';
import ErrorBoundary from './ErrorBoundary';
import DrillBreadcrumb from './DrillBreadcrumb';
import FactorSelector from './FactorSelector';
import SpecEditor from './SpecEditor';
import SpecsPopover from './SpecsPopover';
import { PresentationView, EmbedFocusView, FocusedChartView } from './views';
import { EditableChartTitle } from '@variscout/charts';
import { useIsMobile } from '@variscout/ui';
import { useKeyboardNavigation } from '@variscout/hooks';
import { useData } from '../context/DataContext';
import { calculateAnova, type AnovaResult, getNextDrillFactor } from '@variscout/core';
import useVariationTracking from '../hooks/useVariationTracking';
import useDrillDown from '../hooks/useDrillDown';
import { Activity, Copy, Check, Maximize2, Layers } from 'lucide-react';
import type { StageOrderMode } from '@variscout/core';
import { toBlob } from 'html-to-image';

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
    stats,
    specs,
    setSpecs,
    grades,
    setGrades,
    filteredData,
    filters,
    columnAliases,
    stageColumn,
    setStageColumn,
    stageOrderMode,
    setStageOrderMode,
    stagedStats,
    chartTitles,
    setChartTitles,
  } = useData();

  // Drill-down navigation with browser history and URL sync
  const { drillStack, drillDown, drillTo, clearDrill } = useDrillDown({
    enableHistory: true,
    enableUrlSync: true,
  });

  // Variation tracking for breadcrumbs and drill suggestions
  const {
    breadcrumbsWithVariation: breadcrumbItems,
    cumulativeVariationPct,
    factorVariations,
  } = useVariationTracking(rawData, drillStack, outcome, factors);

  // Responsive mobile detection
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Local state for chart configuration
  // Default to first factor for Boxplot, second (or first) for Pareto
  const [boxplotFactor, setBoxplotFactor] = React.useState<string>('');
  const [paretoFactor, setParetoFactor] = React.useState<string>('');
  const [focusedChart, setFocusedChart] = useState<'ichart' | 'boxplot' | 'pareto' | null>(null);
  // Toggle for showing full population comparison (ghost bars) on Pareto
  const [showParetoComparison, setShowParetoComparison] = useState(false);
  // State for spec editor popover in I-Chart header
  const [showSpecEditor, setShowSpecEditor] = useState(false);
  // Toggle for showing/hiding Pareto panel (resets on data change)
  const [showParetoPanel, setShowParetoPanel] = useState(true);
  // Ref for Pareto factor selector to allow focusing from empty state
  const paretoFactorSelectorRef = React.useRef<HTMLSelectElement>(null);
  // Ref for copy feedback timeout cleanup
  const copyFeedbackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open spec editor when requested from MobileMenu
  useEffect(() => {
    if (openSpecEditorRequested) {
      setShowSpecEditor(true);
      onSpecEditorOpened?.();
    }
  }, [openSpecEditorRequested, onSpecEditorOpened]);

  // Cleanup copy feedback timeout on unmount
  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  // Callback to focus Pareto factor selector (used by ParetoEmptyState)
  const handleParetoSelectFactor = useCallback(() => {
    paretoFactorSelectorRef.current?.focus();
    paretoFactorSelectorRef.current?.click();
  }, []);

  // Determine focused chart navigation
  const CHART_ORDER = ['ichart', 'boxplot', 'pareto'] as const;

  const handleNextChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current as any);
      const nextIndex = (index + 1) % CHART_ORDER.length;
      return CHART_ORDER[nextIndex];
    });
  }, []);

  const handlePrevChart = useCallback(() => {
    setFocusedChart(current => {
      if (!current) return null;
      const index = CHART_ORDER.indexOf(current as any);
      const prevIndex = (index - 1 + CHART_ORDER.length) % CHART_ORDER.length;
      return CHART_ORDER[prevIndex];
    });
  }, []);

  // Helper to get highlight classes for embed mode
  const getHighlightClass = useCallback(
    (chartId: ChartId): string => {
      if (highlightedChart !== chartId) return '';
      return `chart-highlight-${highlightIntensity}`;
    },
    [highlightedChart, highlightIntensity]
  );

  // Helper to create chart click handler for embed mode
  const handleChartWrapperClick = useCallback(
    (chartId: ChartId) => {
      if (onChartClick) {
        onChartClick(chartId);
      }
    },
    [onChartClick]
  );

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

  // Derive available numeric outcomes
  const availableOutcomes = React.useMemo(() => {
    if (rawData.length === 0) return [];
    const row = rawData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [rawData]);

  // Derive potential stage columns (categorical with 2-10 unique values)
  const availableStageColumns = React.useMemo(() => {
    if (rawData.length === 0) return [];
    const candidates: string[] = [];
    const columns = Object.keys(rawData[0] || {});

    for (const col of columns) {
      // Skip the outcome column
      if (col === outcome) continue;

      // Get unique values
      const uniqueValues = new Set<string>();
      for (const row of rawData) {
        const val = row[col];
        if (val !== undefined && val !== null && val !== '') {
          uniqueValues.add(String(val));
        }
        // Early exit if too many unique values
        if (uniqueValues.size > 10) break;
      }

      // Valid stage column: 2-10 unique values
      if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
        candidates.push(col);
      }
    }

    return candidates;
  }, [rawData, outcome]);

  // Initialize/Update defaults when factors change
  // Use functional updates to avoid including state in dependencies
  React.useEffect(() => {
    if (factors.length > 0) {
      setBoxplotFactor(prev => (!prev || !factors.includes(prev) ? factors[0] : prev));
      setParetoFactor(prev => (!prev || !factors.includes(prev) ? factors[1] || factors[0] : prev));
    }
  }, [factors]);

  // Reset Pareto panel visibility when data changes
  React.useEffect(() => {
    setShowParetoPanel(true);
  }, [rawData, factors]);

  // Compute ANOVA for the selected boxplot factor
  const anovaResult: AnovaResult | null = useMemo(() => {
    if (!outcome || !boxplotFactor || filteredData.length === 0) return null;
    return calculateAnova(filteredData, outcome, boxplotFactor);
  }, [filteredData, outcome, boxplotFactor]);

  // Handle breadcrumb navigation (delegates to hook)
  const handleBreadcrumbNavigate = useCallback((id: string) => drillTo(id), [drillTo]);

  // Clear all filters (delegates to hook)
  const handleClearAllFilters = useCallback(() => clearDrill(), [clearDrill]);

  // Remove a specific filter by drilling to root then re-applying remaining filters
  const handleRemoveFilter = useCallback(
    (factor: string) => {
      if (!filters) return;
      // Find all drill actions except the one for this factor, then re-drill
      // Since drillDown handles toggle, we just drill with same values to toggle off
      const currentValues = filters[factor];
      if (currentValues && currentValues.length > 0) {
        drillDown({
          type: 'filter',
          source: 'boxplot',
          factor,
          values: currentValues,
        });
      }
    },
    [filters, drillDown]
  );

  // Handle drill-down from chart click - auto-switches to highest variation factor
  const handleDrillDown = useCallback(
    (factor: string, value: string) => {
      // Use the hook's drillDown which handles toggle behavior
      drillDown({
        type: 'filter',
        source: 'boxplot',
        factor,
        values: [value],
      });

      // Auto-switch to factor with highest variation in filtered data
      // This guides users through a "variation funnel"
      const nextFactor = getNextDrillFactor(factorVariations, factor);
      if (nextFactor) {
        // Switch both charts to the next most impactful factor
        setBoxplotFactor(nextFactor);
        setParetoFactor(nextFactor);
      } else {
        // No significant remaining factors - stay on current
        setBoxplotFactor(factor);
        setParetoFactor(factor);
      }
    },
    [drillDown, factorVariations]
  );

  const handleCopyChart = async (containerId: string, chartName: string) => {
    const node = document.getElementById(containerId);
    if (!node) return;

    try {
      const blob = await toBlob(node, {
        cacheBust: true,
        backgroundColor: '#0f172a',
      });
      if (blob) {
        // eslint-disable-next-line no-undef
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopyFeedback(chartName);
        // Clear any existing timeout before setting a new one
        if (copyFeedbackTimeoutRef.current) {
          clearTimeout(copyFeedbackTimeoutRef.current);
        }
        copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy chart', err);
    }
  };

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
        onToggleParetoComparison={() => setShowParetoComparison(prev => !prev)}
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
        onToggleParetoComparison={() => setShowParetoComparison(prev => !prev)}
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
          breadcrumbItems={breadcrumbItems}
          cumulativeVariationPct={cumulativeVariationPct}
          factorVariations={factorVariations}
          onBreadcrumbNavigate={handleBreadcrumbNavigate}
          onHideParetoPanel={() => setShowParetoPanel(false)}
          onUploadPareto={onOpenColumnMapping}
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
        {/* Drill Breadcrumb Navigation with Variation Tracking */}
        <DrillBreadcrumb
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
          onClearAll={handleClearAllFilters}
          onRemove={handleRemoveFilter}
          cumulativeVariationPct={cumulativeVariationPct}
        />
      </div>

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
                className={`min-h-[400px] bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col transition-all ${getHighlightClass('ichart')}`}
              >
                <div className="flex justify-between items-center mb-4 gap-4">
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
                      >
                        {copyFeedback === 'ichart' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => setFocusedChart('ichart')}
                        className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                        title="Maximize Chart"
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div id="ichart-container" className="flex-1 min-h-[300px] w-full">
                <ErrorBoundary componentName="I-Chart">
                  <IChart onPointClick={onPointClick} onSpecClick={() => setShowSpecEditor(true)} />
                </ErrorBoundary>
              </div>

              {/* Bottom Section: Boxplot, Pareto, Stats */}
              <div className="flex flex-col lg:flex-row gap-4 min-h-[350px]">
                {/* Secondary Charts Container */}
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  <div
                    id="boxplot-card"
                    data-chart-id="boxplot"
                    onClick={() => handleChartWrapperClick('boxplot')}
                    className={`flex-1 min-h-[280px] bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col transition-all ${getHighlightClass('boxplot')}`}
                  >
                    <div className="flex justify-between items-center mb-4">
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
                        >
                          {copyFeedback === 'boxplot' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => setFocusedChart('boxplot')}
                          className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                          title="Maximize Chart"
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
                          />
                        )}
                      </ErrorBoundary>
                    </div>
                    {anovaResult && (
                      <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />
                    )}
                  </div>

                  {showParetoPanel && (
                    <div
                      id="pareto-card"
                      data-chart-id="pareto"
                      onClick={() => handleChartWrapperClick('pareto')}
                      className={`flex-1 min-h-[280px] bg-surface-secondary border border-edge p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col transition-all ${getHighlightClass('pareto')}`}
                    >
                      <div className="flex justify-between items-center mb-4">
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
                          >
                            {copyFeedback === 'pareto' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => setFocusedChart('pareto')}
                            className="p-1.5 rounded text-content-muted hover:text-white hover:bg-surface-tertiary transition-colors"
                            title="Maximize Chart"
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
                              onToggleComparison={() => setShowParetoComparison(prev => !prev)}
                              onHide={() => setShowParetoPanel(false)}
                              onSelectFactor={handleParetoSelectFactor}
                              onUploadPareto={onOpenColumnMapping}
                              availableFactors={factors}
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
              onSetOutcome={setOutcome}
              onSetBoxplotFactor={setBoxplotFactor}
              onSetParetoFactor={setParetoFactor}
              onDrillDown={handleDrillDown}
              onToggleParetoComparison={() => setShowParetoComparison(prev => !prev)}
              onHideParetoPanel={() => setShowParetoPanel(false)}
              onSelectParetoFactor={handleParetoSelectFactor}
              onOpenColumnMapping={onOpenColumnMapping}
              onPointClick={onPointClick}
              onSpecClick={() => setShowSpecEditor(true)}
              onNextChart={handleNextChart}
              onPrevChart={handlePrevChart}
              onExitFocus={() => setFocusedChart(null)}
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
