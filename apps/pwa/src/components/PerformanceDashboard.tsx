/**
 * PerformanceDashboard - Main layout for performance mode
 *
 * Displays multi-channel performance analysis with:
 * - Summary bar with health counts
 * - I-Chart showing Cpk by channel
 * - Boxplot for selected channel or worst channels
 * - Pareto ranking channels by Cpk
 * - Capability histogram for selected channel
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PerformanceSummary from './PerformanceSummary';
import PerformanceIChart from './charts/PerformanceIChart';
import PerformanceBoxplot from './charts/PerformanceBoxplot';
import PerformancePareto from './charts/PerformancePareto';
import PerformanceCapability from './charts/PerformanceCapability';
import PerformanceSetupPanel from './PerformanceSetupPanel';
import ErrorBoundary from './ErrorBoundary';
import {
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PerformanceDashboardProps {
  /** Callback when exiting performance mode */
  onExitPerformanceMode?: () => void;
  /** Callback when drilling to standard I-Chart for a measure */
  onDrillToMeasure?: (measureId: string) => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  onExitPerformanceMode,
  onDrillToMeasure,
}) => {
  const {
    performanceResult,
    selectedMeasure,
    setSelectedMeasure,
    specs,
    measureColumns,
    cpkThresholds,
  } = useData();

  // Cp/Cpk toggle state
  const [capabilityMetric, setCapabilityMetric] = useState<'cp' | 'cpk'>('cpk');

  // Focus mode state
  type FocusedChart = 'ichart' | 'boxplot' | 'pareto' | 'capability' | null;
  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);

  // Chart order for navigation
  const chartOrder: FocusedChart[] = ['ichart', 'boxplot', 'pareto', 'capability'];

  const handleNextChart = useCallback(() => {
    if (!focusedChart) return;
    const currentIndex = chartOrder.indexOf(focusedChart);
    const nextIndex = (currentIndex + 1) % chartOrder.length;
    setFocusedChart(chartOrder[nextIndex]);
  }, [focusedChart]);

  const handlePrevChart = useCallback(() => {
    if (!focusedChart) return;
    const currentIndex = chartOrder.indexOf(focusedChart);
    const prevIndex = (currentIndex - 1 + chartOrder.length) % chartOrder.length;
    setFocusedChart(chartOrder[prevIndex]);
  }, [focusedChart]);

  // Keyboard navigation for focus mode
  useEffect(() => {
    if (!focusedChart) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedChart(null);
      } else if (e.key === 'ArrowRight') {
        handleNextChart();
      } else if (e.key === 'ArrowLeft') {
        handlePrevChart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedChart, handleNextChart, handlePrevChart]);

  const handleMeasureClick = useCallback(
    (measureId: string) => {
      // Toggle selection - clicking again deselects
      setSelectedMeasure(selectedMeasure === measureId ? null : measureId);
    },
    [selectedMeasure, setSelectedMeasure]
  );

  // Show setup panel if no measures configured
  if (!performanceResult || measureColumns.length === 0) {
    return (
      <div className="h-full bg-slate-900 overflow-auto">
        <PerformanceSetupPanel variant="inline" />
      </div>
    );
  }

  // Show warning if no specs defined (but still show charts - they just won't have Cpk)
  const noSpecs = specs.usl === undefined && specs.lsl === undefined;

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Warning banner if no specs */}
      {noSpecs && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 border-b border-amber-600/30 text-amber-300 text-sm">
          <AlertTriangle size={16} />
          <span>Set specification limits (USL/LSL) to enable Cpk calculations</span>
        </div>
      )}

      {/* Summary bar */}
      <PerformanceSummary />

      {/* Chart area - either focused view or grid */}
      {focusedChart ? (
        /* Focused single chart view */
        <div className="flex-1 flex p-4 h-full relative group/focus min-h-0">
          {/* Navigation Buttons (Overlay) */}
          <button
            onClick={handlePrevChart}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-600 opacity-0 group-hover/focus:opacity-100 transition-opacity"
            title="Previous Chart (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNextChart}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg border border-slate-600 opacity-0 group-hover/focus:opacity-100 transition-opacity"
            title="Next Chart (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>

          {focusedChart === 'ichart' && (
            <div className="flex-1 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-300">
                  {capabilityMetric === 'cp' ? 'Cp' : 'Cpk'} by Measure
                  {selectedMeasure && (
                    <span className="ml-2 text-slate-500">(Selected: {selectedMeasure})</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Cp/Cpk Toggle */}
                  <div className="flex rounded overflow-hidden border border-slate-600">
                    <button
                      onClick={() => setCapabilityMetric('cpk')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cpk'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cpk
                    </button>
                    <button
                      onClick={() => setCapabilityMetric('cp')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cp'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cp
                    </button>
                  </div>
                  {selectedMeasure && onDrillToMeasure && (
                    <button
                      onClick={() => onDrillToMeasure(selectedMeasure)}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                      View in I-Chart
                      <ArrowRight size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setFocusedChart(null)}
                    className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
                    title="Exit Focus Mode (Escape)"
                  >
                    <Minimize2 size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary componentName="PerformanceIChart">
                  <PerformanceIChart
                    onChannelClick={handleMeasureClick}
                    capabilityMetric={capabilityMetric}
                    cpkThresholds={cpkThresholds}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {focusedChart === 'boxplot' && (
            <div className="flex-1 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-300">
                  {selectedMeasure
                    ? `${selectedMeasure} Distribution`
                    : 'All Measures Distribution'}
                </h3>
                <button
                  onClick={() => setFocusedChart(null)}
                  className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
                  title="Exit Focus Mode (Escape)"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary componentName="PerformanceBoxplot">
                  <PerformanceBoxplot onChannelClick={handleMeasureClick} maxDisplayed={Infinity} />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {focusedChart === 'pareto' && (
            <div className="flex-1 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-300">
                  Measure Ranking (Worst First)
                </h3>
                <button
                  onClick={() => setFocusedChart(null)}
                  className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
                  title="Exit Focus Mode (Escape)"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary componentName="PerformancePareto">
                  <PerformancePareto
                    onChannelClick={handleMeasureClick}
                    cpkThresholds={cpkThresholds}
                    maxDisplayed={50}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {focusedChart === 'capability' && (
            <div className="flex-1 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-300">
                  {selectedMeasure ? `${selectedMeasure} Capability` : 'Measure Capability'}
                </h3>
                <button
                  onClick={() => setFocusedChart(null)}
                  className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors bg-slate-700/50"
                  title="Exit Focus Mode (Escape)"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary componentName="PerformanceCapability">
                  <PerformanceCapability />
                </ErrorBoundary>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Normal grid layout */
        <div className="flex-1 grid grid-rows-2 grid-cols-1 lg:grid-cols-3 gap-2 p-2 min-h-0">
          {/* Top row: I-Chart spanning full width */}
          <div className="lg:col-span-3 min-h-0 bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-slate-400">
                  {capabilityMetric === 'cp' ? 'Cp' : 'Cpk'} by Measure
                  {selectedMeasure && (
                    <span className="ml-2 text-slate-500">(Selected: {selectedMeasure})</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Cp/Cpk Toggle */}
                  <div className="flex rounded overflow-hidden border border-slate-600">
                    <button
                      onClick={() => setCapabilityMetric('cpk')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cpk'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cpk
                    </button>
                    <button
                      onClick={() => setCapabilityMetric('cp')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cp'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Cp
                    </button>
                  </div>
                  {/* Drill to I-Chart button */}
                  {selectedMeasure && onDrillToMeasure && (
                    <button
                      onClick={() => onDrillToMeasure(selectedMeasure)}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                      View in I-Chart
                      <ArrowRight size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setFocusedChart('ichart')}
                    className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Maximize Chart"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
              <div className="h-[calc(100%-1.5rem)]">
                <ErrorBoundary componentName="PerformanceIChart">
                  <PerformanceIChart
                    onChannelClick={handleMeasureClick}
                    capabilityMetric={capabilityMetric}
                    cpkThresholds={cpkThresholds}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Bottom row: Three charts */}
          <div className="min-h-0 bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-slate-400">
                  {selectedMeasure ? `${selectedMeasure} Distribution` : 'Worst Measures'}
                </h3>
                <button
                  onClick={() => setFocusedChart('boxplot')}
                  className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Maximize Chart"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <div className="h-[calc(100%-1.5rem)]">
                <ErrorBoundary componentName="PerformanceBoxplot">
                  <PerformanceBoxplot onChannelClick={handleMeasureClick} />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          <div className="min-h-0 bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-slate-400">
                  Measure Ranking (Worst First)
                </h3>
                <button
                  onClick={() => setFocusedChart('pareto')}
                  className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Maximize Chart"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <div className="h-[calc(100%-1.5rem)]">
                <ErrorBoundary componentName="PerformancePareto">
                  <PerformancePareto
                    onChannelClick={handleMeasureClick}
                    cpkThresholds={cpkThresholds}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          <div className="min-h-0 bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-slate-400">
                  {selectedMeasure ? `${selectedMeasure} Capability` : 'Measure Capability'}
                </h3>
                <button
                  onClick={() => setFocusedChart('capability')}
                  className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Maximize Chart"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <div className="h-[calc(100%-1.5rem)]">
                <ErrorBoundary componentName="PerformanceCapability">
                  <PerformanceCapability />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
