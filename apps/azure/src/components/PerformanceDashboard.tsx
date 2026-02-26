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
import CapabilityMetricToggle, {
  type CapabilityMetric,
} from './performance/CapabilityMetricToggle';
import PerformanceSpecsControls from './performance/PerformanceSpecsControls';
import { usePerformanceFocus } from '../hooks/usePerformanceFocus';
import { useDrillConfirmation } from '../hooks/useDrillConfirmation';
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
  onExitPerformanceMode: _onExitPerformanceMode,
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
  const [capabilityMetric, setCapabilityMetric] = useState<CapabilityMetric>('cpk');

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

  // Focus mode state + keyboard navigation
  const { focusedChart, setFocusedChart, handleNextChart, handlePrevChart } = usePerformanceFocus();

  const handleMeasureClick = useCallback(
    (measureId: string) => {
      setSelectedMeasure(selectedMeasure === measureId ? null : measureId);
    },
    [selectedMeasure, setSelectedMeasure]
  );

  // Drill confirmation state + keyboard handling
  const { drillConfirmMeasure, handleBoxplotClick, handleConfirmDrill, handleCancelDrill } =
    useDrillConfirmation(onDrillToMeasure);

  // Shared spec change handlers
  const handleLSLChange = useCallback(
    (value: string) => {
      setLocalLSL(value);
      const val = parseFloat(value);
      if (!isNaN(val)) {
        setSpecs({ ...specs, lsl: val });
      }
    },
    [specs, setSpecs]
  );

  const handleUSLChange = useCallback(
    (value: string) => {
      setLocalUSL(value);
      const val = parseFloat(value);
      if (!isNaN(val)) {
        setSpecs({ ...specs, usl: val });
      }
    },
    [specs, setSpecs]
  );

  const handleLSLBlur = useCallback(() => {
    if (localLSL === '') setLocalLSL(specs.lsl?.toString() || '');
  }, [localLSL, specs.lsl]);

  const handleUSLBlur = useCallback(() => {
    if (localUSL === '') setLocalUSL(specs.usl?.toString() || '');
  }, [localUSL, specs.usl]);

  // Show setup panel if no measures configured
  if (!performanceResult || measureColumns.length === 0) {
    return (
      <div className="h-full bg-surface overflow-auto">
        <PerformanceSetupPanel variant="inline" />
      </div>
    );
  }

  const channelCount = measureColumns.length;

  // Show warning if no specs defined (but still show charts - they just won't have Cpk)
  const noSpecs = specs.usl === undefined && specs.lsl === undefined;

  const specsControlsProps = {
    localLSL,
    localUSL,
    cpkTarget,
    specs,
    onLSLChange: handleLSLChange,
    onUSLChange: handleUSLChange,
    onCpkTargetChange: setCpkTarget,
    onLSLBlur: handleLSLBlur,
    onUSLBlur: handleUSLBlur,
  };

  const metricLabel =
    capabilityMetric === 'cp' ? 'Cp' : capabilityMetric === 'cpk' ? 'Cpk' : 'Cp & Cpk';

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header bar with channel count */}
      <div className="flex items-center px-4 py-2 bg-surface-secondary/50 border-b border-edge">
        <span className="text-xs text-content-muted">{channelCount} channels</span>
      </div>

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
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-surface-secondary/80 hover:bg-surface-tertiary text-content-secondary hover:text-content rounded-full shadow-lg border border-edge-secondary opacity-0 group-hover/focus:opacity-100 transition-opacity"
            aria-label="Previous chart"
            title="Previous Chart (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNextChart}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-50 p-3 bg-surface-secondary/80 hover:bg-surface-tertiary text-content-secondary hover:text-content rounded-full shadow-lg border border-edge-secondary opacity-0 group-hover/focus:opacity-100 transition-opacity"
            aria-label="Next chart"
            title="Next Chart (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>

          {focusedChart === 'ichart' && (
            <div className="flex-1 bg-surface-secondary/50 border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-content">
                  {metricLabel} by Measure
                  {selectedMeasure && (
                    <span className="ml-2 text-content-muted">(Selected: {selectedMeasure})</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <CapabilityMetricToggle
                    metric={capabilityMetric}
                    onChange={setCapabilityMetric}
                  />
                  <PerformanceSpecsControls idPrefix="focused" {...specsControlsProps} />
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
                    className="p-2 rounded text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors bg-surface-tertiary/50"
                    aria-label="Exit focus mode"
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
            <div className="flex-1 bg-surface-secondary/50 border border-edge p-4 rounded-2xl shadow-xl shadow-black/20 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-content">
                  Worst 30 Measures (Click to Analyze)
                </h3>
                <button
                  onClick={() => setFocusedChart(null)}
                  className="p-2 rounded text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors bg-surface-tertiary/50"
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
          <div className="col-span-full min-h-0 bg-surface-secondary/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-medium text-content-secondary">
                    {metricLabel} by Measure
                    {selectedMeasure && (
                      <span className="ml-2 text-content-muted">(Selected: {selectedMeasure})</span>
                    )}
                  </h3>
                  <span
                    className="text-xs text-content-muted cursor-help"
                    title="Measures ranked by Cpk (lowest first). Click point to analyze in detail."
                  >
                    ⓘ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CapabilityMetricToggle
                    metric={capabilityMetric}
                    onChange={setCapabilityMetric}
                  />
                  <PerformanceSpecsControls idPrefix="grid" {...specsControlsProps} />
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
                    className="p-1.5 rounded text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
                    aria-label="Maximize chart"
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
          <div className="col-span-full min-h-0 bg-surface-secondary/50 rounded-lg overflow-hidden">
            <div className="h-full p-2">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-content-secondary">
                  Worst 15 Measures (Click to Analyze)
                </h3>
                <button
                  onClick={() => setFocusedChart('boxplot')}
                  className="p-1.5 rounded text-content-muted hover:text-content hover:bg-surface-tertiary transition-colors"
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
          <div className="bg-surface-secondary border border-edge rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-content mb-3">Analyze in Detail?</h3>
            <p className="text-sm text-content mb-6">
              Switch to standard Dashboard view to analyze{' '}
              <strong className="text-content">{drillConfirmMeasure}</strong> with full I-Chart,
              Boxplot, and Pareto analysis?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDrill}
                className="px-4 py-2 text-sm font-medium text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
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
