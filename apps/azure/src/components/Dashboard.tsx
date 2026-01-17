import React, { useState, useEffect, useMemo, useCallback } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import AnovaResults from './AnovaResults';
import RegressionPanel from './RegressionPanel';
import GageRRPanel from './GageRRPanel';
import ErrorBoundary from './ErrorBoundary';
import DrillBreadcrumb from './DrillBreadcrumb';
import FactorSelector from './FactorSelector';
import FilterChips from './FilterChips';
import { useData } from '../context/DataContext';
import {
  calculateAnova,
  type AnovaResult,
  type BreadcrumbItem,
  getEtaSquared,
  getNextDrillFactor,
} from '@variscout/core';
import {
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
} from 'lucide-react';
import type { StageOrderMode } from '@variscout/core';

type DashboardTab = 'analysis' | 'regression' | 'gagerr';

interface DashboardProps {
  onPointClick?: (index: number) => void;
}

const Dashboard = ({ onPointClick }: DashboardProps) => {
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
    stageColumn,
    stageOrderMode,
    stagedStats,
    setStageColumn,
    setStageOrderMode,
  } = useData();

  const [activeTab, setActiveTab] = useState<DashboardTab>('analysis');

  // Local state for chart configuration
  const [boxplotFactor, setBoxplotFactor] = useState<string>('');
  const [paretoFactor, setParetoFactor] = useState<string>('');
  const [focusedChart, setFocusedChart] = useState<'ichart' | 'boxplot' | 'pareto' | null>(null);
  // Toggle for showing full population comparison (ghost bars) on Pareto
  const [showParetoComparison, setShowParetoComparison] = useState(false);

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

  // Derive available numeric outcomes
  const availableOutcomes = useMemo(() => {
    if (rawData.length === 0) return [];
    const row = rawData[0];
    return Object.keys(row).filter(key => typeof row[key] === 'number');
  }, [rawData]);

  // Derive available stage columns (categorical with 2-10 unique values)
  const availableStageColumns = useMemo(() => {
    if (rawData.length === 0) return [];

    const columns = Object.keys(rawData[0]);
    return columns.filter(col => {
      // Skip the outcome column
      if (col === outcome) return false;

      // Get unique values
      const uniqueValues = new Set(rawData.map(row => row[col]));
      const uniqueCount = uniqueValues.size;

      // Suitable for stages: 2-10 unique values (categorical-like)
      return uniqueCount >= 2 && uniqueCount <= 10;
    });
  }, [rawData, outcome]);

  // Initialize/Update defaults when factors change
  useEffect(() => {
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
  const { breadcrumbItems, cumulativeVariationPct, factorVariations } = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        id: 'root',
        label: 'All Data',
        isActive: false,
        source: 'ichart' as const,
        localVariationPct: 100,
        cumulativeVariationPct: 100,
      },
    ];

    if (!filters || !outcome) {
      items[0].isActive = true;
      return { breadcrumbItems: items, cumulativeVariationPct: null, factorVariations: new Map() };
    }

    const activeFilters = Object.entries(filters).filter(
      ([_, values]) => Array.isArray(values) && values.length > 0
    );

    let cumulative = 100;
    let currentData = rawData;

    activeFilters.forEach(([factor, values], index) => {
      const alias = columnAliases[factor] || factor;
      const displayValues = (values as any[]).slice(0, 2).map(String);
      const suffix = values.length > 2 ? ` +${values.length - 2}` : '';
      const label = `${alias}: ${displayValues.join(', ')}${suffix}`;

      let localPct: number | undefined;
      if (currentData.length >= 2 && outcome) {
        const etaSq = getEtaSquared(currentData, factor, outcome);
        localPct = etaSq * 100;
        cumulative = (cumulative * localPct) / 100;
        currentData = currentData.filter(row => {
          const cellValue = row[factor];
          return (
            cellValue !== undefined &&
            cellValue !== null &&
            values.includes(cellValue as string | number)
          );
        });
      }

      items.push({
        id: factor,
        label,
        isActive: index === activeFilters.length - 1,
        source: 'boxplot' as const,
        localVariationPct: localPct,
        cumulativeVariationPct: cumulative,
      });
    });

    if (items.length === 1) {
      items[0].isActive = true;
    }

    const variations = new Map<string, number>();
    if (filteredData.length >= 2 && outcome) {
      for (const factor of factors) {
        const isAlreadyFiltered = activeFilters.some(([f]) => f === factor);
        if (isAlreadyFiltered) continue;

        const etaSq = getEtaSquared(filteredData, factor, outcome);
        if (etaSq > 0) {
          variations.set(factor, etaSq * 100);
        }
      }
    }

    return {
      breadcrumbItems: items,
      cumulativeVariationPct: activeFilters.length > 0 ? cumulative : null,
      factorVariations: variations,
    };
  }, [filters, columnAliases, rawData, filteredData, outcome, factors]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback(
    (id: string) => {
      if (id === 'root') {
        setFilters({});
        return;
      }

      if (!filters) return;

      const activeFilters = Object.entries(filters).filter(
        ([_, values]) => Array.isArray(values) && values.length > 0
      );

      const targetIndex = activeFilters.findIndex(([factor]) => factor === id);
      if (targetIndex === -1) return;

      const newFilters: Record<string, any[]> = {};
      activeFilters.slice(0, targetIndex + 1).forEach(([factor, values]) => {
        newFilters[factor] = values;
      });
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const handleRemoveFilter = useCallback(
    (factor: string) => {
      if (!filters) return;
      const newFilters = { ...filters };
      delete newFilters[factor];
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  // Handle drill-down from chart click - auto-switches to highest variation factor
  const handleDrillDown = useCallback(
    (factor: string, value: string) => {
      if (!filters) return;

      const currentFilters = filters[factor] || [];
      const newFilterValues = currentFilters.includes(value)
        ? currentFilters.filter((v: string | number) => v !== value)
        : [...currentFilters, value];

      if (newFilterValues.length === 0) {
        const newFilters = { ...filters };
        delete newFilters[factor];
        setFilters(newFilters);
      } else {
        setFilters({ ...filters, [factor]: newFilterValues });
      }

      // Auto-switch to factor with highest variation in filtered data
      const nextFactor = getNextDrillFactor(factorVariations, factor);
      if (nextFactor) {
        setBoxplotFactor(nextFactor);
        setParetoFactor(nextFactor);
      } else {
        setBoxplotFactor(factor);
        setParetoFactor(factor);
      }
    },
    [filters, setFilters, factorVariations]
  );

  if (!outcome) return null;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-900 relative">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-slate-900">
        <DrillBreadcrumb
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
          onClearAll={handleClearAllFilters}
          onRemove={handleRemoveFilter}
          cumulativeVariationPct={cumulativeVariationPct}
        />

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
              <div className="min-h-[400px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col">
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
                    <button
                      onClick={() => setFocusedChart('ichart')}
                      className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Maximize Chart"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  {/* Stats display - show staged info when staging is active */}
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
                <div className="flex-1 min-h-[300px] w-full">
                  <ErrorBoundary componentName="I-Chart">
                    <IChart onPointClick={onPointClick} />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Bottom Section: Boxplot, Pareto, Stats */}
              <div className="flex flex-col lg:flex-row gap-4 min-h-[350px]">
                {/* Secondary Charts Container */}
                <div className="flex flex-1 flex-col md:flex-row gap-4">
                  <div className="flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col">
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
                          onClick={() => setFocusedChart('boxplot')}
                          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Maximize Chart"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[180px]">
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

                  <div className="flex-1 min-h-[280px] bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col">
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
                          onClick={() => setFocusedChart('pareto')}
                          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Maximize Chart"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[180px]">
                      <ErrorBoundary componentName="Pareto Chart">
                        {paretoFactor && (
                          <ParetoChart
                            factor={paretoFactor}
                            onDrillDown={handleDrillDown}
                            showComparison={showParetoComparison}
                            onToggleComparison={() => setShowParetoComparison(prev => !prev)}
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
                <div className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
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
                <div className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
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
                <div className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
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
    </div>
  );
};

export default Dashboard;
