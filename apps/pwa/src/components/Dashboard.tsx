import React, { useState, useEffect, useMemo } from 'react';
import IChart from './charts/IChart';
import Boxplot from './charts/Boxplot';
import ParetoChart from './charts/ParetoChart';
import StatsPanel from './StatsPanel';
import MobileDashboard from './MobileDashboard';
import AnovaResults from './AnovaResults';
import ErrorBoundary from './ErrorBoundary';
import { useData } from '../context/DataContext';
import { calculateAnova, type AnovaResult } from '@variscout/core';
import { Activity, Copy, Check } from 'lucide-react';
import { toBlob } from 'html-to-image';

const MOBILE_BREAKPOINT = 640; // sm breakpoint

interface DashboardProps {
  onPointClick?: (index: number) => void;
}

const Dashboard = ({ onPointClick }: DashboardProps) => {
  const { outcome, factors, setOutcome, rawData, stats, specs, filteredData } = useData();
  const [isMobile, setIsMobile] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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
      {/* Top Section: I-Chart */}
      <div
        id="ichart-card"
        className="flex-none lg:flex-1 min-h-[400px] bg-slate-800 border border-slate-700 m-4 p-6 rounded-2xl shadow-xl shadow-black/20"
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
        <div id="ichart-container" className="h-[300px] lg:h-[calc(100%-3rem)] w-full">
          <ErrorBoundary componentName="I-Chart">
            <IChart onPointClick={onPointClick} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Bottom Section: Boxplot & Pareto + Stats */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[350px] gap-4 px-4 pb-4">
        {/* Secondary Charts Container */}
        <div className="flex flex-1 flex-col md:flex-row gap-4">
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
        <StatsPanel stats={stats} specs={specs} filteredData={filteredData} outcome={outcome} />
      </div>
    </div>
  );
};

export default Dashboard;
