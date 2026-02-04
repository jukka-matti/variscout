/**
 * PerformanceDashboard - Main layout for performance mode
 *
 * Displays multi-channel performance analysis with:
 * - Summary bar with health counts
 * - I-Chart showing Cpk by channel (full width)
 * - Boxplot showing worst 15 channels (full width)
 *
 * Optimized for 100+ column datasets - click any chart to drill to standard Dashboard.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PerformanceSummary from './PerformanceSummary';
import PerformanceIChart from './charts/PerformanceIChart';
import PerformanceBoxplot from './charts/PerformanceBoxplot';
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
    setSpecs,
    measureColumns,
  } = useData();

  // Cp/Cpk toggle state (includes 'both' option)
  const [capabilityMetric, setCapabilityMetric] = useState<'cp' | 'cpk' | 'both'>('cpk');

  // Cpk target threshold state
  const [cpkTarget, setCpkTarget] = useState<number>(1.33);

  // Global specs editing (local state for input fields)
  const [localLSL, setLocalLSL] = useState<string>(specs.lsl?.toString() || '');
  const [localUSL, setLocalUSL] = useState<string>(specs.usl?.toString() || '');

  // Sync local state when specs change externally
  useEffect(() => {
    setLocalLSL(specs.lsl?.toString() || '');
    setLocalUSL(specs.usl?.toString() || '');
  }, [specs.lsl, specs.usl]);

  // Focus mode state
  type FocusedChart = 'ichart' | 'boxplot' | null;
  const [focusedChart, setFocusedChart] = useState<FocusedChart>(null);

  // Chart order for navigation
  const chartOrder: FocusedChart[] = ['ichart', 'boxplot'];

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

  // Confirmation modal state for drilling to measure
  const [drillConfirmMeasure, setDrillConfirmMeasure] = useState<string | null>(null);

  const handleBoxplotClick = useCallback((measureId: string) => {
    // Show confirmation modal
    setDrillConfirmMeasure(measureId);
  }, []);

  const handleConfirmDrill = useCallback(() => {
    if (drillConfirmMeasure) {
      onDrillToMeasure?.(drillConfirmMeasure);
      setDrillConfirmMeasure(null);
    }
  }, [drillConfirmMeasure, onDrillToMeasure]);

  const handleCancelDrill = useCallback(() => {
    setDrillConfirmMeasure(null);
  }, []);

  // Keyboard handling for drill confirmation modal
  useEffect(() => {
    if (!drillConfirmMeasure) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelDrill();
      } else if (e.key === 'Enter') {
        handleConfirmDrill();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drillConfirmMeasure, handleCancelDrill, handleConfirmDrill]);

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
                  {capabilityMetric === 'cp'
                    ? 'Cp'
                    : capabilityMetric === 'cpk'
                      ? 'Cpk'
                      : 'Cp & Cpk'}{' '}
                  by Measure
                  {selectedMeasure && (
                    <span className="ml-2 text-slate-500">(Selected: {selectedMeasure})</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Cp/Cpk/Both Toggle */}
                  <div className="flex rounded overflow-hidden border border-slate-600">
                    <button
                      onClick={() => setCapabilityMetric('cpk')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cpk'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      Cpk
                    </button>
                    <button
                      onClick={() => setCapabilityMetric('cp')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cp'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-purple-800 hover:text-white'
                      }`}
                    >
                      Cp
                    </button>
                    <button
                      onClick={() => setCapabilityMetric('both')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'both'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Both
                    </button>
                  </div>

                  {/* Cpk Target Adjustment */}
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="cpk-target-focused" className="text-slate-400">
                      Target Cpk:
                    </label>
                    <input
                      id="cpk-target-focused"
                      type="number"
                      min="0.5"
                      max="3.0"
                      step="0.01"
                      value={cpkTarget}
                      onChange={e => setCpkTarget(parseFloat(e.target.value) || 1.33)}
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-center"
                      title="Industry standard: 1.33 (4σ), 1.67 (5σ), 2.00 (6σ)"
                    />
                  </div>

                  {/* LSL Input */}
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="lsl-input-focused" className="text-slate-400">
                      LSL:
                    </label>
                    <input
                      id="lsl-input-focused"
                      type="number"
                      value={localLSL}
                      onChange={e => {
                        setLocalLSL(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setSpecs({ ...specs, lsl: val });
                        }
                      }}
                      onBlur={() => {
                        if (localLSL === '') setLocalLSL(specs.lsl?.toString() || '');
                      }}
                      placeholder="Lower"
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-center"
                    />
                  </div>

                  {/* USL Input */}
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="usl-input-focused" className="text-slate-400">
                      USL:
                    </label>
                    <input
                      id="usl-input-focused"
                      type="number"
                      value={localUSL}
                      onChange={e => {
                        setLocalUSL(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setSpecs({ ...specs, usl: val });
                        }
                      }}
                      onBlur={() => {
                        if (localUSL === '') setLocalUSL(specs.usl?.toString() || '');
                      }}
                      placeholder="Upper"
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-center"
                    />
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
                    cpkTarget={cpkTarget}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {focusedChart === 'boxplot' && (
            <div className="flex-1 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-300">
                  Worst 30 Measures (Click to Analyze)
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
                  <PerformanceBoxplot onChannelClick={handleBoxplotClick} maxDisplayed={Infinity} />
                </ErrorBoundary>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Normal grid layout */
        <div className="flex-1 grid grid-rows-2 gap-2 p-2 min-h-0">
          {/* Top row: I-Chart spanning full width */}
          <div className="col-span-full min-h-0 bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-medium text-slate-400">
                    {capabilityMetric === 'cp'
                      ? 'Cp'
                      : capabilityMetric === 'cpk'
                        ? 'Cpk'
                        : 'Cp & Cpk'}{' '}
                    by Measure
                    {selectedMeasure && (
                      <span className="ml-2 text-slate-500">(Selected: {selectedMeasure})</span>
                    )}
                  </h3>
                  <span
                    className="text-xs text-slate-500 cursor-help"
                    title="Measures ranked by Cpk (lowest first). Click point to analyze in detail."
                  >
                    ⓘ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cp/Cpk/Both Toggle */}
                  <div className="flex rounded overflow-hidden border border-slate-600">
                    <button
                      onClick={() => setCapabilityMetric('cpk')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cpk'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      Cpk
                    </button>
                    <button
                      onClick={() => setCapabilityMetric('cp')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'cp'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-purple-800 hover:text-white'
                      }`}
                    >
                      Cp
                    </button>
                    <button
                      onClick={() => setCapabilityMetric('both')}
                      className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        capabilityMetric === 'both'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Both
                    </button>
                  </div>

                  {/* Cpk Target Adjustment */}
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="cpk-target-grid" className="text-slate-400">
                      Target Cpk:
                    </label>
                    <input
                      id="cpk-target-grid"
                      type="number"
                      min="0.5"
                      max="3.0"
                      step="0.01"
                      value={cpkTarget}
                      onChange={e => setCpkTarget(parseFloat(e.target.value) || 1.33)}
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-center"
                      title="Industry standard: 1.33 (4σ), 1.67 (5σ), 2.00 (6σ)"
                    />
                  </div>

                  {/* LSL Input */}
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="lsl-input-grid" className="text-slate-400">
                      LSL:
                    </label>
                    <input
                      id="lsl-input-grid"
                      type="number"
                      value={localLSL}
                      onChange={e => {
                        setLocalLSL(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setSpecs({ ...specs, lsl: val });
                        }
                      }}
                      onBlur={() => {
                        if (localLSL === '') setLocalLSL(specs.lsl?.toString() || '');
                      }}
                      placeholder="Lower"
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-center"
                    />
                  </div>

                  {/* USL Input */}
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="usl-input-grid" className="text-slate-400">
                      USL:
                    </label>
                    <input
                      id="usl-input-grid"
                      type="number"
                      value={localUSL}
                      onChange={e => {
                        setLocalUSL(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setSpecs({ ...specs, usl: val });
                        }
                      }}
                      onBlur={() => {
                        if (localUSL === '') setLocalUSL(specs.usl?.toString() || '');
                      }}
                      placeholder="Upper"
                      className="w-20 px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded text-center"
                    />
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
                    cpkTarget={cpkTarget}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Bottom row: Single Boxplot chart */}
          <div className="col-span-full min-h-0 bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-slate-400">
                  Worst 15 Measures (Click to Analyze)
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
                  <PerformanceBoxplot onChannelClick={handleBoxplotClick} maxDisplayed={15} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drill Confirmation Modal */}
      {drillConfirmMeasure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-3">Analyze in Detail?</h3>
            <p className="text-sm text-slate-300 mb-6">
              Switch to standard Dashboard view to analyze{' '}
              <strong className="text-white">{drillConfirmMeasure}</strong> with full I-Chart,
              Boxplot, and Pareto analysis?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDrill}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDrill}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
