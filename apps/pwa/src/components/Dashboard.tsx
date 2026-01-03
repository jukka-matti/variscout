import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import MobileDashboard from './MobileDashboard';
import AnovaResults from './AnovaResults';
import RegressionPanel from './RegressionPanel';
import GageRRPanel from './GageRRPanel';
import ErrorBoundary from './ErrorBoundary';
import { useData } from '../context/DataContext';
import { calculateAnova, type AnovaResult } from '@variscout/core';
import { Activity, Copy, Check, BarChart3, TrendingUp, Target, GripHorizontal } from 'lucide-react';
import { toBlob } from 'html-to-image';

const PANEL_LAYOUT_KEY = 'variscout-panel-layout';

type DashboardTab = 'analysis' | 'regression' | 'gagerr';

const MOBILE_BREAKPOINT = 640; // sm breakpoint

interface DashboardProps {
  onPointClick?: (index: number) => void;
}

const Dashboard = ({ onPointClick }: DashboardProps) => {
  const { outcome, factors, setOutcome, rawData, stats, specs, filteredData } = useData();
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

  // Load saved panel layout
  const getDefaultLayout = useCallback(() => {
    try {
      const saved = localStorage.getItem(PANEL_LAYOUT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) {
          return parsed as [number, number];
        }
      }
    } catch {
      // Ignore parse errors
    }
    return [40, 60] as [number, number]; // Default: 40% I-Chart, 60% bottom
  }, []);

  const handleLayoutChange = useCallback((layout: Record<string, number>) => {
    const sizes = Object.values(layout);
    if (sizes.length === 2) {
      localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(sizes));
    }
  }, []);

  // Local state for chart configuration
  // Default to first factor for Boxplot, second (or first) for Pareto
  const [boxplotFactor, setBoxplotFactor] = React.useState<string>('');
  const [paretoFactor, setParetoFactor] = React.useState<string>('');

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
          onSetBoxplotFactor={setBoxplotFactor}
          onSetParetoFactor={setParetoFactor}
          onPointClick={onPointClick}
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
      {/* Tab Navigation */}
      <div className="flex-none flex items-center gap-2 px-4 pt-4">
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
        <PanelGroup orientation="vertical" onLayoutChange={handleLayoutChange} className="flex-1">
          {/* Top Section: I-Chart */}
          <Panel defaultSize={getDefaultLayout()[0]} minSize={20}>
            <div
              id="ichart-card"
              className="h-full bg-slate-800 border border-slate-700 m-4 mb-0 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col"
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
              <div id="ichart-container" className="flex-1 min-h-0 w-full">
                <ErrorBoundary componentName="I-Chart">
                  <IChart onPointClick={onPointClick} />
                </ErrorBoundary>
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="h-4 flex items-center justify-center group cursor-row-resize mx-4">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors">
              <GripHorizontal size={14} className="text-slate-500 group-hover:text-slate-300" />
            </div>
          </PanelResizeHandle>

          {/* Bottom Section: Boxplot & Pareto + Stats */}
          <Panel defaultSize={getDefaultLayout()[1]} minSize={20}>
            <div className="h-full flex flex-col lg:flex-row gap-4 px-4 pb-4">
              {/* Secondary Charts Container */}
              <div className="flex flex-1 flex-col md:flex-row gap-4 min-h-0">
                <div
                  id="boxplot-card"
                  className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      Boxplot Analysis
                    </h3>
                    <select
                      value={boxplotFactor}
                      onChange={e => setBoxplotFactor(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                    >
                      {factors.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
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
                  </div>
                  <div id="boxplot-container" className="flex-1 min-h-0">
                    <ErrorBoundary componentName="Boxplot">
                      {boxplotFactor && <Boxplot factor={boxplotFactor} />}
                    </ErrorBoundary>
                  </div>
                  {anovaResult && <AnovaResults result={anovaResult} factorLabel={boxplotFactor} />}
                </div>

                <div
                  id="pareto-card"
                  className="flex-1 bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 min-w-[300px] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      Pareto
                    </h3>
                    <select
                      value={paretoFactor}
                      onChange={e => setParetoFactor(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                    >
                      {factors.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
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
                  </div>
                  <div id="pareto-container" className="flex-1 min-h-0">
                    <ErrorBoundary componentName="Pareto Chart">
                      {paretoFactor && <ParetoChart factor={paretoFactor} />}
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
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
};

export default Dashboard;
