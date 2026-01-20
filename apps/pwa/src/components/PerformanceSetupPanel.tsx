/**
 * PerformanceSetupPanel - Main setup panel for performance mode
 *
 * Works inline (in PerformanceDashboard) or as modal content:
 * - Measure selection via MeasureColumnSelector
 * - Label customization input (default: "Measure")
 * - Specs guidance: warning if no specs, link to set them
 * - "Re-detect Measures" button
 * - Cancel / Enable buttons
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Activity, AlertTriangle, RefreshCw, Settings, X } from 'lucide-react';
import MeasureColumnSelector from './MeasureColumnSelector';
import { useData } from '../context/DataContext';
import { detectChannelColumns } from '@variscout/core';

interface PerformanceSetupPanelProps {
  /** 'inline' for PerformanceDashboard, 'modal' for dialog */
  variant?: 'inline' | 'modal';
  /** Initial selection (for modal) */
  initialSelection?: string[];
  /** Initial label (for modal) */
  initialLabel?: string;
  /** Callback when setup is confirmed */
  onEnable?: (columns: string[], label: string) => void;
  /** Callback when cancelled (modal only) */
  onCancel?: () => void;
  /** Callback to navigate to settings */
  onOpenSettings?: () => void;
}

const PerformanceSetupPanel: React.FC<PerformanceSetupPanelProps> = ({
  variant = 'inline',
  initialSelection,
  initialLabel,
  onEnable,
  onCancel,
  onOpenSettings,
}) => {
  const {
    rawData,
    specs,
    measureColumns: currentMeasureColumns,
    measureLabel: currentMeasureLabel,
    cpkTarget: currentCpkTarget,
    setMeasureColumns,
    setMeasureLabel,
    setPerformanceMode,
    setCpkTarget,
  } = useData();

  // Local state for editing
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    initialSelection ?? currentMeasureColumns ?? []
  );
  const [label, setLabel] = useState(initialLabel ?? currentMeasureLabel ?? 'Measure');
  const [targetValue, setTargetValue] = useState(currentCpkTarget ?? 1.33);

  // Detect available numeric columns
  const availableColumns = useMemo(() => {
    if (rawData.length === 0) return [];
    return detectChannelColumns(rawData);
  }, [rawData]);

  // Auto-select matched columns on first render if nothing selected
  React.useEffect(() => {
    if (selectedColumns.length === 0 && availableColumns.length > 0) {
      const matched = availableColumns.filter(c => c.matchedPattern).map(c => c.id);
      if (matched.length >= 3) {
        setSelectedColumns(matched);
      }
    }
  }, [availableColumns, selectedColumns.length]);

  const hasSpecs = specs.usl !== undefined || specs.lsl !== undefined;
  const isValid = selectedColumns.length >= 3;

  const handleRedetect = useCallback(() => {
    const matched = availableColumns.filter(c => c.matchedPattern).map(c => c.id);
    setSelectedColumns(matched.length >= 3 ? matched : availableColumns.map(c => c.id));
  }, [availableColumns]);

  const handleEnable = useCallback(() => {
    if (onEnable) {
      onEnable(selectedColumns, label);
    } else {
      setMeasureColumns(selectedColumns);
      setMeasureLabel(label);
      setCpkTarget(targetValue);
      setPerformanceMode(true);
    }
  }, [
    selectedColumns,
    label,
    targetValue,
    onEnable,
    setMeasureColumns,
    setMeasureLabel,
    setCpkTarget,
    setPerformanceMode,
  ]);

  // No data loaded
  if (rawData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Activity className="w-12 h-12 text-slate-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Performance Mode</h2>
        <p className="text-slate-400 max-w-md mb-4">
          Load data with multiple numeric columns to analyze multi-measure performance (e.g., fill
          heads, cavities, nozzles).
        </p>
      </div>
    );
  }

  // No numeric columns found
  if (availableColumns.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Insufficient Numeric Columns</h2>
        <p className="text-slate-400 max-w-md mb-4">
          Performance mode requires at least 3 numeric columns. Your data has{' '}
          {availableColumns.length} numeric column(s).
        </p>
        <p className="text-slate-500 text-sm">
          Load wide-format data with multiple measurement columns (e.g., H1, H2, H3... or Valve_1,
          Valve_2, etc.)
        </p>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Measure label input */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-2">
          Measure Label
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g., Valve, Head, Nozzle"
            className="flex-1 px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-white placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-xs text-content-muted whitespace-nowrap">
            e.g., "{label} 1", "{label} 2"
          </span>
        </div>
        <p className="text-xs text-content-muted mt-1">
          Customize how measures are displayed in charts and summaries
        </p>
      </div>

      {/* Cpk Target input */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-2">Cpk Target</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={targetValue}
            onChange={e => setTargetValue(Number(e.target.value) || 1.33)}
            min={0.5}
            max={3.0}
            step={0.01}
            className="w-24 px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-xs text-content-muted">
            Target line shown on I-Chart (default: 1.33)
          </span>
        </div>
        <p className="text-xs text-content-muted mt-1">
          1.33 = ~63 PPM defects | 1.67 = ~1 PPM defects
        </p>
      </div>

      {/* Specs warning */}
      {!hasSpecs && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-600/10 border border-amber-600/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-300">No specification limits set</p>
            <p className="text-xs text-content-muted mt-1">
              Cpk calculation requires at least USL or LSL. You can still enable performance mode,
              but capability metrics won't be available.
            </p>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-xs text-amber-400 hover:text-amber-300 underline mt-2 flex items-center gap-1"
              >
                <Settings size={12} />
                Set specification limits
              </button>
            )}
          </div>
        </div>
      )}

      {/* Column selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-content-secondary">
            Select Measure Columns
          </label>
          <button
            onClick={handleRedetect}
            className="text-xs text-content-muted hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} />
            Re-detect
          </button>
        </div>
        <MeasureColumnSelector
          availableColumns={availableColumns}
          selectedColumns={selectedColumns}
          onSelectionChange={setSelectedColumns}
          minColumns={3}
        />
      </div>
    </div>
  );

  // Inline variant (for PerformanceDashboard)
  if (variant === 'inline') {
    return (
      <div className="flex flex-col h-full p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configure Performance Mode</h2>
            <p className="text-sm text-content-secondary">
              Select which columns to analyze as measures
            </p>
          </div>
        </div>

        {content}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-edge">
          <button
            onClick={handleEnable}
            disabled={!isValid}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enable Performance Mode
          </button>
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-edge">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Activity size={20} />
          </div>
          <h2 className="text-lg font-bold text-white">Configure Performance Mode</h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-content-secondary hover:text-white p-1 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">{content}</div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t border-edge">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleEnable}
          disabled={!isValid}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enable
        </button>
      </div>
    </div>
  );
};

export default PerformanceSetupPanel;
