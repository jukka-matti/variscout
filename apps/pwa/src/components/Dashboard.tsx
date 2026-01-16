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
import { useData } from '../context/DataContext';
import { calculateAnova, type AnovaResult, getNextDrillFactor } from '@variscout/core';
import useVariationTracking from '../hooks/useVariationTracking';
import useDrillDown from '../hooks/useDrillDown';
import {
  Activity,
  Copy,
  Check,
  BarChart3,
  TrendingUp,
  Target,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  Plus,
} from 'lucide-react';
import type { StageOrderMode } from '@variscout/core';
import { toBlob } from 'html-to-image';

import type { ChartId, HighlightIntensity } from '../hooks/useEmbedMessaging';

type DashboardTab = 'analysis' | 'regression' | 'gagerr';

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
  const [isMobile, setIsMobile] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('analysis');

  // Detect mobile/desktop on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedChart) return;
      if (e.key === 'ArrowRight') handleNextChart();
      if (e.key === 'ArrowLeft') handlePrevChart();
      if (e.key === 'Escape') setFocusedChart(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedChart, handleNextChart, handlePrevChart]);

  // Keyboard handler for Presentation Mode
  useEffect(() => {
    if (!isPresentationMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onExitPresentation) {
        onExitPresentation();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPresentationMode, onExitPresentation]);

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
  React.useEffect(() => {
    if (factors.length > 0) {
      if (!boxplotFactor || !factors.includes(boxplotFactor)) {
        setBoxplotFactor(factors[0]);
      }
      if (!paretoFactor || !factors.includes(paretoFactor)) {
        setParetoFactor(factors[1] || factors[0]);
      }
    }
  }, [factors, boxplotFactor, paretoFactor]);

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
        setTimeout(() => setCopyFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy chart', err);
    }
  };

  if (!outcome) return null;

  // Presentation Mode - Fullscreen overlay with all charts
  if (isPresentationMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-4 gap-4">
        {/* I-Chart - top section */}
        <div className="flex-[45] min-h-0 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Activity className="text-blue-400" size={20} />
              I-Chart: {outcome}
            </h2>
            {stats && (
              <div className="flex gap-4 text-sm text-slate-400 ml-auto">
                <span className="flex items-center gap-1">
                  UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                  <span className="tooltip-wrapper">
                    <HelpCircle
                      size={12}
                      className="text-slate-500 hover:text-slate-300 cursor-help"
                    />
                    <span className="tooltip">
                      Upper Control Limit. Points above this indicate special cause variation.
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  Mean: <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                  <span className="tooltip-wrapper">
                    <HelpCircle
                      size={12}
                      className="text-slate-500 hover:text-slate-300 cursor-help"
                    />
                    <span className="tooltip">
                      Process average. The center line on the I-Chart.
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
                  <span className="tooltip-wrapper">
                    <HelpCircle
                      size={12}
                      className="text-slate-500 hover:text-slate-300 cursor-help"
                    />
                    <span className="tooltip">
                      Lower Control Limit. Points below this indicate special cause variation.
                    </span>
                  </span>
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ErrorBoundary componentName="I-Chart">
              <IChart onSpecClick={() => setShowSpecEditor(true)} />
            </ErrorBoundary>
          </div>
        </div>

        {/* Bottom section - Boxplot, Pareto, Stats */}
        <div className="flex-[55] min-h-0 flex gap-4">
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Boxplot: {boxplotFactor}
            </h3>
            <div className="flex-1 min-h-0">
              <ErrorBoundary componentName="Boxplot">
                {boxplotFactor && (
                  <Boxplot
                    factor={boxplotFactor}
                    variationPct={factorVariations.get(boxplotFactor)}
                  />
                )}
              </ErrorBoundary>
            </div>
          </div>
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pareto: {paretoFactor}
            </h3>
            <div className="flex-1 min-h-0">
              <ErrorBoundary componentName="Pareto Chart">
                {paretoFactor && (
                  <ParetoChart
                    factor={paretoFactor}
                    showComparison={showParetoComparison}
                    onToggleComparison={() => setShowParetoComparison(prev => !prev)}
                    availableFactors={factors}
                  />
                )}
              </ErrorBoundary>
            </div>
          </div>
          <div className="w-80 bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <StatsPanel stats={stats} specs={specs} filteredData={filteredData} outcome={outcome} />
          </div>
        </div>

        {/* Exit hint */}
        <div className="absolute bottom-4 right-4 text-slate-600 text-xs">Press Escape to exit</div>
      </div>
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
          onBreadcrumbNavigate={handleBreadcrumbNavigate}
          onHideParetoPanel={() => setShowParetoPanel(false)}
          onUploadPareto={onOpenColumnMapping}
        />
      </div>
    );
  }

  // Embed Focus Mode - render only the specified chart (for iframe embeds)
  if (embedFocusChart) {
    return (
      <div className="h-full w-full bg-slate-900 p-4 flex flex-col">
        {embedFocusChart === 'ichart' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="text-blue-400" size={20} />
              <span className="text-lg font-bold text-white">I-Chart: {outcome}</span>
              {stats && (
                <div className="flex gap-4 text-xs text-slate-400 ml-auto">
                  <span>
                    UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                  </span>
                  <span>
                    Mean: <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                  </span>
                  <span>
                    LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <ErrorBoundary componentName="I-Chart">
                <IChart onPointClick={onPointClick} onSpecClick={() => setShowSpecEditor(true)} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {embedFocusChart === 'boxplot' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-bold text-white">Boxplot</span>
              <FactorSelector
                factors={factors}
                selected={boxplotFactor}
                onChange={setBoxplotFactor}
                hasActiveFilter={!!filters?.[boxplotFactor]?.length}
              />
            </div>
            <div className="flex-1 min-h-0">
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
          </div>
        )}

        {embedFocusChart === 'pareto' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-bold text-white">Pareto</span>
              <FactorSelector
                factors={factors}
                selected={paretoFactor}
                onChange={setParetoFactor}
                hasActiveFilter={!!filters?.[paretoFactor]?.length}
              />
            </div>
            <div className="flex-1 min-h-0">
              <ErrorBoundary componentName="Pareto Chart">
                {paretoFactor && (
                  <ParetoChart
                    factor={paretoFactor}
                    onDrillDown={handleDrillDown}
                    showComparison={showParetoComparison}
                    onToggleComparison={() => setShowParetoComparison(prev => !prev)}
                    onSelectFactor={handleParetoSelectFactor}
                    onUploadPareto={onOpenColumnMapping}
                    availableFactors={factors}
                  />
                )}
              </ErrorBoundary>
            </div>
          </div>
        )}

        {embedFocusChart === 'stats' && (
          <div className="flex-1 min-h-0">
            <StatsPanel
              stats={stats}
              specs={specs}
              filteredData={filteredData}
              outcome={outcome}
              defaultTab={embedStatsTab || undefined}
              className="w-full h-full lg:w-full border-none shadow-none rounded-none"
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div
      id="dashboard-export-container"
      className="flex flex-col h-full overflow-y-auto bg-slate-900 relative"
    >
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-slate-900">
        {/* Drill Breadcrumb Navigation with Variation Tracking */}
        <DrillBreadcrumb
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
          onClearAll={handleClearAllFilters}
          onRemove={handleRemoveFilter}
          cumulativeVariationPct={cumulativeVariationPct}
        />

        {/* Tab Navigation */}
        <div className="flex-none flex items-center gap-2 px-4 pt-4 pb-2">
          <button
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
          <button
            onClick={() => setActiveTab('gagerr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'gagerr'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Target size={16} />
            Gage R&R
          </button>
        </div>
      </div>

      {/* Regression Tab */}
      {activeTab === 'regression' && (
        <div className="flex-1 m-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
          <ErrorBoundary componentName="Regression Panel">
            <RegressionPanel />
          </ErrorBoundary>
        </div>
      )}

      {/* Gage R&R Tab */}
      {activeTab === 'gagerr' && (
        <div className="flex-1 m-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
          <ErrorBoundary componentName="Gage R&R Panel">
            <GageRRPanel />
          </ErrorBoundary>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="flex-1 flex flex-col min-h-0">
          {!focusedChart ? (
            // Scrollable Layout
            <div className="flex flex-col gap-4 p-4">
              {/* I-Chart Section */}
              <div
                id="ichart-card"
                data-chart-id="ichart"
                onClick={() => handleChartWrapperClick('ichart')}
                className={`min-h-[400px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col transition-all ${getHighlightClass('ichart')}`}
              >
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Activity className="text-blue-400" />
                      I-Chart:
                    </h2>
                    <select
                      value={outcome}
                      onChange={e => setOutcome(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-lg font-bold text-white rounded px-3 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      {availableOutcomes.map(o => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>

                    {/* Stage Column Selector - always visible for discoverability */}
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                      <span
                        className="tooltip-wrapper"
                        title="Divide chart into stages (e.g., Before/After, Phase 1/2/3)"
                      >
                        <Layers
                          size={16}
                          className={
                            availableStageColumns.length > 0 ? 'text-blue-400' : 'text-slate-600'
                          }
                        />
                      </span>
                      {availableStageColumns.length > 0 ? (
                        <>
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
                              onChange={e => setStageOrderMode(e.target.value as StageOrderMode)}
                              className="bg-slate-900 border border-slate-700 text-xs text-slate-400 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-800 transition-colors"
                              title="Stage ordering method"
                            >
                              <option value="auto">Auto order</option>
                              <option value="data-order">As in data</option>
                            </select>
                          )}
                        </>
                      ) : (
                        <span
                          className="text-xs text-slate-500 cursor-help"
                          title="Staging requires a column with 2-10 unique categorical values"
                        >
                          No stage columns
                        </span>
                      )}
                    </div>

                    {/* + Specs / + Target buttons */}
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                      {!specs?.usl && !specs?.lsl && (
                        <button
                          onClick={() => setShowSpecEditor(true)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
                          title="Add specification limits"
                        >
                          <Plus size={12} />
                          Specs
                        </button>
                      )}
                      {!specs?.target && (specs?.usl !== undefined || specs?.lsl !== undefined) && (
                        <button
                          onClick={() => setShowSpecEditor(true)}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
                          title="Add target value"
                        >
                          <Plus size={12} />
                          Target
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyChart('ichart-card', 'ichart')}
                      className={`p-1.5 rounded transition-all ${
                        copyFeedback === 'ichart'
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-slate-500 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Copy I-Chart to clipboard"
                    >
                      {copyFeedback === 'ichart' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => setFocusedChart('ichart')}
                      className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Maximize Chart"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  {/* Stats display - show staged info or overall stats */}
                  {stageColumn && stagedStats ? (
                    <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Layers size={12} className="text-blue-400" />
                        <span className="text-blue-400 font-medium">
                          {stagedStats.stageOrder.length} stages
                        </span>
                        <span className="tooltip-wrapper">
                          <HelpCircle
                            size={12}
                            className="text-slate-500 hover:text-slate-300 cursor-help"
                          />
                          <span className="tooltip">
                            Control limits calculated separately for each stage. Stage boundaries
                            shown as vertical lines.
                          </span>
                        </span>
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
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
                          UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                          <span className="tooltip-wrapper">
                            <HelpCircle
                              size={12}
                              className="text-slate-500 hover:text-slate-300 cursor-help"
                            />
                            <span className="tooltip">
                              Upper Control Limit. Points above this indicate special cause
                              variation.
                            </span>
                          </span>
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          Mean:{' '}
                          <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                          <span className="tooltip-wrapper">
                            <HelpCircle
                              size={12}
                              className="text-slate-500 hover:text-slate-300 cursor-help"
                            />
                            <span className="tooltip">
                              Process average. The center line on the I-Chart.
                            </span>
                          </span>
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
                          <span className="tooltip-wrapper">
                            <HelpCircle
                              size={12}
                              className="text-slate-500 hover:text-slate-300 cursor-help"
                            />
                            <span className="tooltip">
                              Lower Control Limit. Points below this indicate special cause
                              variation.
                            </span>
                          </span>
                        </span>
                      </div>
                    )
                  )}
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
                    className={`flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col transition-all ${getHighlightClass('boxplot')}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Boxplot
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
                              : 'text-slate-500 hover:text-white hover:bg-slate-700'
                          }`}
                          title="Copy Boxplot to clipboard"
                        >
                          {copyFeedback === 'boxplot' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => setFocusedChart('boxplot')}
                          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
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
                      className={`flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col transition-all ${getHighlightClass('pareto')}`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                          Pareto
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
                                : 'text-slate-500 hover:text-white hover:bg-slate-700'
                            }`}
                            title="Copy Pareto Chart to clipboard"
                          >
                            {copyFeedback === 'pareto' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => setFocusedChart('pareto')}
                            className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
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
            <div className="flex-1 flex p-4 h-full relative group/focus">
              {/* Navigation Buttons (Overlay) */}
              <button
                onClick={handlePrevChart}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-700 opacity-0 group-hover/focus:opacity-100 transition-opacity"
                title="Previous Chart (Left Arrow)"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextChart}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-700 opacity-0 group-hover/focus:opacity-100 transition-opacity"
                title="Next Chart (Right Arrow)"
              >
                <ChevronRight size={24} />
              </button>

              {focusedChart === 'ichart' && (
                <div
                  id="ichart-focus"
                  className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full"
                >
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Activity className="text-blue-400" size={24} />
                        I-Chart:
                      </h2>
                      <select
                        value={outcome}
                        onChange={e => setOutcome(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xl font-bold text-white rounded px-3 py-1.5 outline-none focus:border-blue-500"
                      >
                        {availableOutcomes.map(o => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setFocusedChart(null)}
                        className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-4 bg-slate-700/50"
                        title="Exit Focus Mode"
                      >
                        <Minimize2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 w-full">
                    <ErrorBoundary componentName="I-Chart">
                      <IChart
                        onPointClick={onPointClick}
                        onSpecClick={() => setShowSpecEditor(true)}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              )}

              {focusedChart === 'boxplot' && (
                <div
                  id="boxplot-focus"
                  className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-200 uppercase tracking-wider">
                      Boxplot
                    </h3>
                    <div className="flex items-center gap-4">
                      <FactorSelector
                        factors={factors}
                        selected={boxplotFactor}
                        onChange={setBoxplotFactor}
                        hasActiveFilter={!!filters?.[boxplotFactor]?.length}
                        size="md"
                      />
                      <button
                        onClick={() => setFocusedChart(null)}
                        className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
                        title="Exit Focus Mode"
                      >
                        <Minimize2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
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
                  {anovaResult && <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />}
                </div>
              )}

              {focusedChart === 'pareto' && (
                <div
                  id="pareto-focus"
                  className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-200 uppercase tracking-wider">
                      Pareto
                    </h3>
                    <div className="flex items-center gap-4">
                      <FactorSelector
                        factors={factors}
                        selected={paretoFactor}
                        onChange={setParetoFactor}
                        hasActiveFilter={!!filters?.[paretoFactor]?.length}
                        size="md"
                      />
                      <button
                        onClick={() => setFocusedChart(null)}
                        className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
                        title="Exit Focus Mode"
                      >
                        <Minimize2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ErrorBoundary componentName="Pareto Chart">
                      {paretoFactor && (
                        <ParetoChart
                          factor={paretoFactor}
                          onDrillDown={handleDrillDown}
                          showComparison={showParetoComparison}
                          onToggleComparison={() => setShowParetoComparison(prev => !prev)}
                          onHide={() => {
                            setShowParetoPanel(false);
                            setFocusedChart(null);
                          }}
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
