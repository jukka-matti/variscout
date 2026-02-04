import React, { useState, useEffect } from 'react';
import { X, Save, Key, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getEdition } from '../lib/edition';
import {
  hasValidLicense,
  getStoredLicenseKey,
  storeLicenseKey,
  removeLicenseKey,
  isValidLicenseFormat,
} from '../lib/license';
import { CPK_THRESHOLDS, validateThresholds, type CpkThresholds } from '@variscout/core';
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
    cpkThresholds,
    isPerformanceMode,
    setOutcome,
    setFactors,
    setAxisSettings,
    setDisplayOptions,
    setCpkThresholds,
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

  // Cpk thresholds state
  const [localThresholds, setLocalThresholds] = useState<CpkThresholds>(CPK_THRESHOLDS);

  // License state
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [edition, setEdition] = useState<string>('community');

  // Check license status on mount
  useEffect(() => {
    const currentEdition = getEdition();
    setEdition(currentEdition);
    const storedKey = getStoredLicenseKey();
    if (storedKey) {
      setLicenseKey(storedKey);
      setLicenseStatus(hasValidLicense() ? 'valid' : 'invalid');
    }
  }, [isOpen]);

  const handleActivateLicense = () => {
    if (storeLicenseKey(licenseKey)) {
      setLicenseStatus('valid');
      setEdition('licensed');
    } else {
      setLicenseStatus('invalid');
    }
  };

  const handleRemoveLicense = () => {
    removeLicenseKey();
    setLicenseKey('');
    setLicenseStatus('none');
    setEdition('community');
  };

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
      setLocalThresholds(cpkThresholds || CPK_THRESHOLDS);
    }
  }, [isOpen, outcome, factors, axisSettings, displayOptions, cpkThresholds]);

  if (!isOpen) return null;

  const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  const handleSave = () => {
    // Validate and save thresholds
    if (validateThresholds(localThresholds)) {
      setCpkThresholds(localThresholds);
      localStorage.setItem('variscout_cpk_thresholds', JSON.stringify(localThresholds));
    } else {
      // Validation failed - reset to current valid thresholds
      setLocalThresholds(cpkThresholds || CPK_THRESHOLDS);
      alert('Invalid threshold ordering: Critical < Warning < Capable required');
    }

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

        {/* Section 3: Performance Mode Thresholds */}
        {isPerformanceMode && (
          <div className="border-t border-edge pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                  3. Performance Mode Thresholds
                </h3>
                <div className="group relative">
                  <Info size={14} className="text-content-muted cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-surface border border-edge rounded-lg text-xs text-content-secondary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    Customize Cpk health classification thresholds to match your organization's
                    capability standards. Industry default: 1.0 (critical), 1.33 (warning), 1.67
                    (capable).
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLocalThresholds(CPK_THRESHOLDS)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-content-secondary mb-1">Critical (&lt;)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={localThresholds.critical}
                  onChange={e =>
                    setLocalThresholds({ ...localThresholds, critical: parseFloat(e.target.value) })
                  }
                  className="w-full bg-surface border border-edge rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-content-secondary mb-1">Warning (&lt;)</label>
                <input
                  type="number"
                  step="0.1"
                  min={localThresholds.critical + 0.1}
                  value={localThresholds.warning}
                  onChange={e =>
                    setLocalThresholds({ ...localThresholds, warning: parseFloat(e.target.value) })
                  }
                  className="w-full bg-surface border border-edge rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-content-secondary mb-1">Capable (&lt;)</label>
                <input
                  type="number"
                  step="0.1"
                  min={localThresholds.warning + 0.1}
                  value={localThresholds.capable}
                  onChange={e =>
                    setLocalThresholds({ ...localThresholds, capable: parseFloat(e.target.value) })
                  }
                  className="w-full bg-surface border border-edge rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Visual preview */}
            <div className="flex items-center gap-2 text-xs mt-3">
              <span className="text-red-400">
                Critical &lt;{localThresholds.critical.toFixed(2)}
              </span>
              <span className="text-content-muted">→</span>
              <span className="text-amber-500">&lt;{localThresholds.warning.toFixed(2)}</span>
              <span className="text-content-muted">→</span>
              <span className="text-green-500">&lt;{localThresholds.capable.toFixed(2)}</span>
              <span className="text-content-muted">→</span>
              <span className="text-green-400">Excellent</span>
            </div>

            {!validateThresholds(localThresholds) && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle size={14} className="text-red-400" />
                <p className="text-xs text-red-400">
                  Invalid ordering: Critical &lt; Warning &lt; Capable required
                </p>
              </div>
            )}
          </div>
        )}

        {/* Section 4: License */}
        <div className="border-t border-edge pt-6 px-6 pb-6">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
            {isPerformanceMode ? '4' : '3'}. License
          </h3>

          <div className="bg-surface/50 rounded-lg p-4 border border-edge">
            {/* Current Status */}
            <div className="flex items-center gap-3 mb-4">
              {edition === 'licensed' ? (
                <>
                  <CheckCircle size={20} className="text-green-500" />
                  <div>
                    <div className="text-white font-medium">Licensed Edition</div>
                    <div className="text-xs text-content-muted">Branding removed</div>
                  </div>
                </>
              ) : (
                <>
                  <Key size={20} className="text-content-muted" />
                  <div>
                    <div className="text-white font-medium">Community Edition</div>
                    <div className="text-xs text-content-muted">
                      Free with VariScout Lite branding
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* License Key Input (only for community edition) */}
            {edition === 'community' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-content-secondary mb-1">License Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={e => {
                        setLicenseKey(e.target.value.toUpperCase());
                        setLicenseStatus('none');
                      }}
                      placeholder="VSL-XXXX-XXXX-XXXX"
                      className="flex-1 bg-surface border border-edge rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleActivateLicense}
                      disabled={!licenseKey || licenseKey.length < 19}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-surface-tertiary disabled:text-content-muted text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Activate
                    </button>
                  </div>
                  {licenseStatus === 'invalid' && (
                    <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
                      <AlertCircle size={12} />
                      Invalid license key format
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-content-muted">
                  Purchase a license to remove chart branding.{' '}
                  <a href="#" className="text-blue-400 hover:underline">
                    Get Pro →
                  </a>
                </p>
              </div>
            )}

            {/* Remove License (only for licensed with license) */}
            {edition === 'licensed' && licenseStatus === 'valid' && (
              <button
                onClick={handleRemoveLicense}
                className="text-xs text-content-muted hover:text-red-400 transition-colors"
              >
                Remove license key
              </button>
            )}
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
