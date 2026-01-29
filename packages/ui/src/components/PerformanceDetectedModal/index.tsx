/**
 * PerformanceDetectedModal - Auto-detection modal for wide-format data
 *
 * Shown when wide-format data is detected during file upload:
 * - Shows detection confidence and measure list
 * - Allows reviewing/modifying selection before confirming
 * - Label customization option
 * - "Enable Performance Mode" / "Not Now" buttons
 */

import React, { useState, useMemo } from 'react';
import { Activity, X, Check, Sparkles } from 'lucide-react';
import { MeasureColumnSelector } from '../MeasureColumnSelector';
import type { WideFormatDetection, ChannelInfo } from '@variscout/core';

export interface PerformanceDetectedModalProps {
  /** Detection result from detectWideFormat() */
  detection: WideFormatDetection;
  /** Callback when user enables performance mode */
  onEnable: (columns: string[], label: string) => void;
  /** Callback when user declines */
  onDecline: () => void;
}

export const PerformanceDetectedModal: React.FC<PerformanceDetectedModalProps> = ({
  detection,
  onEnable,
  onDecline,
}) => {
  // Local state for selection and label
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    detection.channels.map((c: ChannelInfo) => c.id)
  );
  const [label, setLabel] = useState('Measure');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isValid = selectedColumns.length >= 3;

  const confidenceColor = useMemo(() => {
    switch (detection.confidence) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  }, [detection.confidence]);

  const handleEnable = () => {
    if (isValid) {
      onEnable(selectedColumns, label);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Multi-Measure Data Detected</h2>
              <p className="text-xs text-slate-500">
                <span className={confidenceColor}>{detection.confidence} confidence</span>
              </p>
            </div>
          </div>
          <button
            onClick={onDecline}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Detection summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-600/10 border border-blue-600/30">
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white">
                Found <span className="font-bold">{detection.channels.length} measure columns</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {detection.channels
                  .slice(0, 5)
                  .map((c: ChannelInfo) => c.label)
                  .join(', ')}
                {detection.channels.length > 5 && ` and ${detection.channels.length - 5} more`}
              </p>
            </div>
          </div>

          {/* Quick label input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              What should we call these? (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value || 'Measure')}
              placeholder="e.g., Head, Valve, Nozzle, Cavity"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Charts will show "{label} 1", "{label} 2", etc.
            </p>
          </div>

          {/* Advanced: Column selection */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              {showAdvanced ? '− Hide' : '+ Show'} column selection
            </button>

            {showAdvanced && (
              <div className="mt-3">
                <MeasureColumnSelector
                  availableColumns={detection.channels}
                  selectedColumns={selectedColumns}
                  onSelectionChange={setSelectedColumns}
                  minColumns={3}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Check size={16} />
            Enable Performance Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetectedModal;
