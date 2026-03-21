/**
 * YamazumiDetectedModal - Auto-detection modal for Yamazumi time study data
 *
 * Shown when Yamazumi format data is detected during file upload:
 * - Shows detection confidence and suggested column roles
 * - Takt time input
 * - "Enable Yamazumi Mode" / "Use Standard Mode" buttons
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { Timer, X, Check, BarChart3 } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { YamazumiDetection } from '@variscout/core';

export interface YamazumiDetectedModalProps {
  /** Detection result from detectYamazumiFormat() */
  detection: YamazumiDetection;
  /** Callback when user enables Yamazumi mode */
  onEnable: (taktTime?: number) => void;
  /** Callback when user declines (use standard mode) */
  onDecline: () => void;
}

export const YamazumiDetectedModal: React.FC<YamazumiDetectedModalProps> = ({
  detection,
  onEnable,
  onDecline,
}) => {
  const { t } = useTranslation();
  const [taktTime, setTaktTime] = useState<string>('');
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  // Show modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Handle native dialog close (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onDecline();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onDecline]);

  const handleEnable = () => {
    const parsed = parseFloat(taktTime);
    onEnable(parsed > 0 ? parsed : undefined);
  };

  const { suggestedMapping } = detection;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm max-w-none max-h-none w-full h-full m-0 p-0 flex items-center justify-center"
    >
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          fallbackFocus: '[role="dialog"]',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="bg-surface-primary border border-edge rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <BarChart3 size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-content">
                  {t?.('yamazumi.detected.title') ?? 'Time Study Data Detected'}
                </h3>
                <p className={`text-sm ${confidenceColor}`}>
                  {detection.confidence === 'high' ? 'High' : 'Medium'}{' '}
                  {t?.('yamazumi.detected.confidence') ?? 'confidence'}
                </p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="p-1 text-content-secondary hover:text-content rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-content-secondary mb-4">
            {t?.('yamazumi.detected.description') ??
              'Your data contains activity type classifications (VA, NVA, Waste, Wait). Enable Yamazumi mode to visualize cycle time composition across process steps.'}
          </p>

          {/* Detected columns */}
          <div className="bg-surface-secondary rounded-lg p-3 mb-4 space-y-1.5">
            {suggestedMapping.activityTypeColumn && (
              <div className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-green-400 shrink-0" />
                <span className="text-content-secondary">
                  {t?.('yamazumi.detected.activityType') ?? 'Activity Type'}:
                </span>
                <span className="text-content font-medium">
                  {suggestedMapping.activityTypeColumn}
                </span>
              </div>
            )}
            {suggestedMapping.cycleTimeColumn && (
              <div className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-green-400 shrink-0" />
                <span className="text-content-secondary">
                  {t?.('yamazumi.detected.cycleTime') ?? 'Cycle Time'}:
                </span>
                <span className="text-content font-medium">{suggestedMapping.cycleTimeColumn}</span>
              </div>
            )}
            {suggestedMapping.stepColumn && (
              <div className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-green-400 shrink-0" />
                <span className="text-content-secondary">
                  {t?.('yamazumi.detected.step') ?? 'Process Step'}:
                </span>
                <span className="text-content font-medium">{suggestedMapping.stepColumn}</span>
              </div>
            )}
            {suggestedMapping.reasonColumn && (
              <div className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-blue-400 shrink-0" />
                <span className="text-content-secondary">
                  {t?.('yamazumi.detected.reason') ?? 'Waste Reason'}:
                </span>
                <span className="text-content font-medium">{suggestedMapping.reasonColumn}</span>
              </div>
            )}
          </div>

          {/* Takt time input */}
          <div className="mb-5">
            <label className="block text-sm text-content-secondary mb-1.5">
              <Timer size={14} className="inline mr-1 -mt-0.5" />
              {t?.('yamazumi.detected.taktTime') ?? 'Takt Time (optional)'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={taktTime}
              onChange={e => setTaktTime(e.target.value)}
              placeholder={t?.('yamazumi.detected.taktPlaceholder') ?? 'e.g., 120 seconds'}
              className="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-content text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-2.5 text-sm text-content-secondary bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-lg transition-colors"
            >
              {t?.('yamazumi.detected.decline') ?? 'Use Standard Mode'}
            </button>
            <button
              onClick={handleEnable}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition-colors"
            >
              {t?.('yamazumi.detected.enable') ?? 'Enable Yamazumi Mode'}
            </button>
          </div>
        </div>
      </FocusTrap>
    </dialog>
  );
};
