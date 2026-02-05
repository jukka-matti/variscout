import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ScaleMode } from '@variscout/hooks';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const {
    rawData,
    outcome,
    factors,
    axisSettings,
    displayOptions,
    isPerformanceMode,
    setOutcome,
    setFactors,
    setAxisSettings,
    setDisplayOptions,
  } = useData();

  // Local state for form inputs
  const [localOutcome, setLocalOutcome] = useState<string>('');
  const [localFactors, setLocalFactors] = useState<string[]>([]);
  const [localAxis, setLocalAxis] = useState<{ min: string; max: string; scaleMode: ScaleMode }>({
    min: '',
    max: '',
    scaleMode: 'auto',
  });
  const [localDisplayOptions, setLocalDisplayOptions] = useState<{
    showCp: boolean;
    showCpk: boolean;
    showSpecs?: boolean;
    lockYAxisToFullData?: boolean;
    showControlLimits?: boolean;
  }>({
    showCp: false,
    showCpk: true,
    showSpecs: true,
    lockYAxisToFullData: true,
    showControlLimits: true,
  });

  // Populate local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalOutcome(outcome || '');
      setLocalFactors(factors || []);
      setLocalAxis({
        min: axisSettings.min !== undefined ? axisSettings.min.toString() : '',
        max: axisSettings.max !== undefined ? axisSettings.max.toString() : '',
        scaleMode: axisSettings.scaleMode ?? 'auto',
      });
      setLocalDisplayOptions(displayOptions);
    }
  }, [isOpen, outcome, factors, axisSettings, displayOptions]);

  if (!isOpen) return null;

  const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  const handleSave = () => {
    setOutcome(localOutcome);
    setFactors(localFactors);
    setAxisSettings({
      min: localAxis.min ? parseFloat(localAxis.min) : undefined,
      max: localAxis.max ? parseFloat(localAxis.max) : undefined,
      scaleMode: localAxis.scaleMode,
    });
    setDisplayOptions(localDisplayOptions);
    onClose();
  };

  const toggleFactor = (col: string) => {
    if (localFactors.includes(col)) {
      setLocalFactors(localFactors.filter(f => f !== col));
    } else {
      if (localFactors.length < 3) {
        setLocalFactors([...localFactors, col]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-secondary border border-edge rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-edge">
          <h2 className="text-xl font-bold text-white">Analysis Settings</h2>
          <button
            onClick={onClose}
            className="text-content-secondary hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section 1: Column Mapping */}
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
              1. Data Mapping
            </h3>

            <div className="mb-4">
              <label className="block text-sm text-content-secondary mb-1">
                Outcome Column (Numeric)
              </label>
              <select
                value={localOutcome}
                onChange={e => setLocalOutcome(e.target.value)}
                className="w-full bg-surface border border-edge rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" disabled>
                  Select outcome...
                </option>
                {availableColumns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-content-secondary mb-2">
                Factor Columns (Categorical) - Max 3
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColumns.map(col => (
                  <button
                    key={col}
                    onClick={() => toggleFactor(col)}
                    disabled={!localFactors.includes(col) && localFactors.length >= 3}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      localFactors.includes(col)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-surface border-edge text-content-secondary hover:border-edge'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Visualization Settings */}
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 border-t border-edge pt-6">
              2. Visualization
            </h3>

            {/* Display Options */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-content mb-2">
                Capability Metrics Display
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localDisplayOptions.showCp}
                    onChange={e =>
                      setLocalDisplayOptions({ ...localDisplayOptions, showCp: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Show Cp{' '}
                    <span className="text-content-muted text-xs">(requires both USL and LSL)</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localDisplayOptions.showCpk}
                    onChange={e =>
                      setLocalDisplayOptions({ ...localDisplayOptions, showCpk: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Show Cpk
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localDisplayOptions.showSpecs !== false}
                    onChange={e =>
                      setLocalDisplayOptions({
                        ...localDisplayOptions,
                        showSpecs: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Show Spec Limits (USL/LSL/Target)
                  </span>
                </label>
              </div>
            </div>

            {/* Control Limits Toggle */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-content mb-2">Control Limits</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localDisplayOptions.showControlLimits !== false}
                    onChange={e =>
                      setLocalDisplayOptions({
                        ...localDisplayOptions,
                        showControlLimits: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Show Control Limits (UCL/Mean/LCL)
                  </span>
                </label>
                <p className="text-[10px] text-content-muted ml-7">
                  Statistical process control limits based on 3-sigma rule.
                </p>
              </div>
            </div>

            {/* Y-Axis Lock */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-content mb-2">Filtering Behavior</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localDisplayOptions.lockYAxisToFullData !== false}
                    onChange={e =>
                      setLocalDisplayOptions({
                        ...localDisplayOptions,
                        lockYAxisToFullData: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Lock Y-axis to full data range when filtering
                  </span>
                </label>
                <p className="text-[10px] text-content-muted ml-7">
                  Keeps chart scale consistent for visual comparison. Control limits still
                  recalculate.
                </p>
              </div>
            </div>

            {/* Y-Axis Scale Mode */}
            <div className="mb-2">
              <h4 className="text-xs font-semibold text-content mb-2">Y-Axis Scale Mode</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="scaleMode"
                    checked={localAxis.scaleMode === 'auto'}
                    onChange={() => setLocalAxis({ ...localAxis, scaleMode: 'auto' })}
                    className="w-4 h-4 border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Auto (fit data + specs)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="scaleMode"
                    checked={localAxis.scaleMode === 'clampZero'}
                    onChange={() => setLocalAxis({ ...localAxis, scaleMode: 'clampZero' })}
                    className="w-4 h-4 border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Start at Zero (min = 0)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="scaleMode"
                    checked={localAxis.scaleMode === 'manual'}
                    onChange={() => setLocalAxis({ ...localAxis, scaleMode: 'manual' })}
                    className="w-4 h-4 border-edge-secondary bg-surface text-blue-500 focus:ring-blue-500 focus:ring-offset-surface-secondary"
                  />
                  <span className="text-sm text-content group-hover:text-white transition-colors">
                    Manual (set min/max)
                  </span>
                </label>
              </div>

              {/* Manual min/max inputs - only show when manual mode is selected */}
              {localAxis.scaleMode === 'manual' && (
                <div className="mt-3 ml-7 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-content-secondary mb-1">Min Y</label>
                    <input
                      type="number"
                      step="any"
                      value={localAxis.min}
                      onChange={e => setLocalAxis({ ...localAxis, min: e.target.value })}
                      className="w-full bg-surface border border-edge rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                      placeholder="Required"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-content-secondary mb-1">Max Y</label>
                    <input
                      type="number"
                      step="any"
                      value={localAxis.max}
                      onChange={e => setLocalAxis({ ...localAxis, max: e.target.value })}
                      className="w-full bg-surface border border-edge rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                      placeholder="Required"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-edge flex justify-end gap-3 rounded-b-2xl bg-surface-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 text-content-secondary hover:text-white dark:hover:bg-surface-tertiary rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold shadow-lg shadow-blue-900/20"
          >
            <Save size={18} />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
