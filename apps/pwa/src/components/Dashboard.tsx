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
import FilterChips from './FilterChips';
import { useData } from '../context/DataContext';
import { calculateAnova, type AnovaResult, type BreadcrumbItem } from '@variscout/core';
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
} from 'lucide-react';
import { toBlob } from 'html-to-image';

type DashboardTab = 'analysis' | 'regression' | 'gagerr';

const MOBILE_BREAKPOINT = 640; // sm breakpoint

interface DashboardProps {
  onPointClick?: (index: number) => void;
  isPresentationMode?: boolean;
  onExitPresentation?: () => void;
}

const Dashboard = ({ onPointClick, isPresentationMode, onExitPresentation }: DashboardProps) => {
  const {
    outcome,
    factors,
    setOutcome,
    rawData,
    stats,
    specs,
    filteredData,
    filters,
    setFilters,
    columnAliases,
  } = useData();
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

  // Compute ANOVA for the selected boxplot factor
  const anovaResult: AnovaResult | null = useMemo(() => {
    if (!outcome || !boxplotFactor || filteredData.length === 0) return null;
    return calculateAnova(filteredData, outcome, boxplotFactor);
  }, [filteredData, outcome, boxplotFactor]);

  // Convert current filters to breadcrumb items for navigation display
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { id: 'root', label: 'All Data', isActive: false, source: 'ichart' as const },
    ];

    // Guard against undefined filters (e.g., in tests)
    if (!filters) {
      items[0].isActive = true;
      return items;
    }

    const activeFilters = Object.entries(filters).filter(
      ([_, values]) => Array.isArray(values) && values.length > 0
    );

    activeFilters.forEach(([factor, values], index) => {
      const alias = columnAliases[factor] || factor;
      const displayValues = (values as any[]).slice(0, 2).map(String);
      const suffix = values.length > 2 ? ` +${values.length - 2}` : '';
      const label = `${alias}: ${displayValues.join(', ')}${suffix}`;

      items.push({
        id: factor,
        label,
        isActive: index === activeFilters.length - 1,
        source: 'boxplot' as const, // Default source for filter-based navigation
      });
    });

    // Mark root as active if no filters
    if (items.length === 1) {
      items[0].isActive = true;
    }

    return items;
  }, [filters, columnAliases]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback(
    (id: string) => {
      if (id === 'root') {
        // Clear all filters
        setFilters({});
        return;
      }

      // Guard against undefined filters
      if (!filters) return;

      // Find the filter to navigate to, clear all filters after it
      const activeFilters = Object.entries(filters).filter(
        ([_, values]) => Array.isArray(values) && values.length > 0
      );

      const targetIndex = activeFilters.findIndex(([factor]) => factor === id);
      if (targetIndex === -1) return;

      // Keep only filters up to and including the target
      const newFilters: Record<string, any[]> = {};
      activeFilters.slice(0, targetIndex + 1).forEach(([factor, values]) => {
        newFilters[factor] = values;
      });
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Remove a specific filter
  const handleRemoveFilter = useCallback(
    (factor: string) => {
      if (!filters) return;
      const newFilters = { ...filters };
      delete newFilters[factor];
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  // Handle drill-down from chart click - syncs both charts to same factor
  const handleDrillDown = useCallback(
    (factor: string, value: string) => {
      // Guard against undefined filters
      if (!filters) return;

      // Toggle the filter value
      const currentFilters = filters[factor] || [];
      const newFilterValues = currentFilters.includes(value)
        ? currentFilters.filter((v: string) => v !== value)
        : [...currentFilters, value];

      // Update filters
      if (newFilterValues.length === 0) {
        const newFilters = { ...filters };
        delete newFilters[factor];
        setFilters(newFilters);
      } else {
        setFilters({ ...filters, [factor]: newFilterValues });
      }

      // Sync both charts to this factor for cohesive analysis
      setBoxplotFactor(factor);
      setParetoFactor(factor);
    },
    [filters, setFilters]
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
              <IChart />
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
                {boxplotFactor && <Boxplot factor={boxplotFactor} />}
              </ErrorBoundary>
            </div>
          </div>
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pareto: {paretoFactor}
            </h3>
            <div className="flex-1 min-h-0">
              <ErrorBoundary componentName="Pareto Chart">
                {paretoFactor && <ParetoChart factor={paretoFactor} />}
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
        />
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
        {/* Drill Breadcrumb Navigation */}
        <DrillBreadcrumb
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
          onClearAll={handleClearAllFilters}
          onRemove={handleRemoveFilter}
        />

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          columnAliases={columnAliases}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
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
                className="min-h-[400px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col"
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
                  {stats && (
                    <div className="flex gap-4 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400">
                        UCL: <span className="text-white font-mono">{stats.ucl.toFixed(2)}</span>
                      </span>
                      <span className="text-slate-400">
                        Mean: <span className="text-white font-mono">{stats.mean.toFixed(2)}</span>
                      </span>
                      <span className="text-slate-400">
                        LCL: <span className="text-white font-mono">{stats.lcl.toFixed(2)}</span>
                      </span>
                    </div>
                  )}
                </div>
                <div id="ichart-container" className="flex-1 min-h-[300px] w-full">
                  <ErrorBoundary componentName="I-Chart">
                    <IChart onPointClick={onPointClick} />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Bottom Section: Boxplot, Pareto, Stats */}
              <div className="flex flex-col lg:flex-row gap-4 min-h-[350px]">
                {/* Secondary Charts Container */}
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  <div
                    id="boxplot-card"
                    className="flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col"
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
                          <Boxplot factor={boxplotFactor} onDrillDown={handleDrillDown} />
                        )}
                      </ErrorBoundary>
                    </div>
                    {anovaResult && (
                      <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />
                    )}
                  </div>

                  <div
                    id="pareto-card"
                    className="flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col"
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
                          <ParetoChart factor={paretoFactor} onDrillDown={handleDrillDown} />
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
                />
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
                      <IChart onPointClick={onPointClick} />
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
                        <Boxplot factor={boxplotFactor} onDrillDown={handleDrillDown} />
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
                        <ParetoChart factor={paretoFactor} onDrillDown={handleDrillDown} />
                      )}
                    </ErrorBoundary>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
