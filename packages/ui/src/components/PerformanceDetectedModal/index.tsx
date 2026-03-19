/**
 * PerformanceDetectedModal - Auto-detection modal for wide-format data
 *
 * Shown when wide-format data is detected during file upload:
 * - Shows detection confidence and measure list
 * - Allows reviewing/modifying selection before confirming
 * - Label customization option
 * - "Enable Performance Mode" / "Not Now" buttons
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, X, Check, Sparkles } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
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
  const { t, tf } = useTranslation();
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
        return 'text-content-secondary';
    }
  }, [detection.confidence]);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Show modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Handle native dialog close (Escape key handled by browser)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onDecline();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onDecline]);

  const handleEnable = () => {
    if (isValid) {
      onEnable(selectedColumns, label);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm max-w-none max-h-none w-full h-full m-0 p-0 flex items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) onDecline();
      }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-secondary border border-edge rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-edge">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content">{t('performance.detected')}</h2>
              <p className="text-xs text-content-muted">
                <span className={confidenceColor}>{detection.confidence} confidence</span>
              </p>
            </div>
          </div>
          <button
            onClick={onDecline}
            className="text-content-secondary hover:text-content p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
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
              <p className="text-sm text-content">
                {tf('performance.columnsFound', { count: detection.channels.length })}
              </p>
              <p className="text-xs text-content-muted mt-0.5">
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
            <label className="block text-sm font-medium text-content-secondary mb-2">
              {t('performance.labelQuestion')}
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value || 'Measure')}
              placeholder={t('performance.labelExample')}
              className="w-full px-3 py-2 bg-surface-tertiary border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <p className="text-xs text-content-muted mt-1">
              Charts will show "{label} 1", "{label} 2", etc.
            </p>
          </div>

          {/* Advanced: Column selection */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-content-muted hover:text-content flex items-center gap-1 transition-colors"
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
        <div className="flex items-center justify-between gap-3 p-4 border-t border-edge bg-surface-secondary/50">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors text-sm"
          >
            {t('action.cancel')}
          </button>
          <button
            onClick={handleEnable}
            disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Check size={16} />
            {t('performance.enable')}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default PerformanceDetectedModal;
