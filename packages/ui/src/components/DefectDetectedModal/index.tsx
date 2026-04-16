/**
 * DefectDetectedModal - Auto-detection modal for defect analysis data
 *
 * Shown when defect-shaped data is detected during file upload:
 * - Shows detection confidence and data shape
 * - Detected column role dropdowns (defect type, count, result, units produced)
 * - Aggregation unit selector
 * - "Enable Defect Mode" / "Use Standard Mode" buttons
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { AlertTriangle, X, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import type { DefectDetection, DefectMapping, DefectDataShape } from '@variscout/core';

export interface DefectDetectedModalProps {
  /** Detection result from detectDefectFormat() */
  detection: DefectDetection;
  /** All available column names for dropdown selection */
  columnNames: string[];
  /** Callback when user enables Defect mode */
  onEnable: (mapping: DefectMapping) => void;
  /** Callback when user declines (use standard mode) */
  onDismiss: () => void;
}

const DATA_SHAPE_LABELS: Record<DefectDataShape, string> = {
  'event-log': 'Event Log',
  'pre-aggregated': 'Pre-aggregated Counts',
  'pass-fail': 'Pass/Fail',
};

interface ColumnDropdownProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: string[];
  allowNone?: boolean;
  icon?: React.ReactNode;
}

const ColumnDropdown: React.FC<ColumnDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  allowNone = false,
  icon,
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="shrink-0">{icon}</span>
    <span className="text-content-secondary whitespace-nowrap">{label}:</span>
    <div className="relative flex-1 min-w-0">
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        className="w-full appearance-none bg-surface-primary border border-edge rounded px-2 py-1 pr-6 text-content text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 truncate"
      >
        {allowNone && <option value="">None</option>}
        {options.map(col => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-content-secondary pointer-events-none"
      />
    </div>
  </div>
);

export const DefectDetectedModal: React.FC<DefectDetectedModalProps> = ({
  detection,
  columnNames,
  onEnable,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Initialize form state from detection
  const [defectTypeColumn, setDefectTypeColumn] = useState<string | undefined>(
    detection.suggestedMapping.defectTypeColumn
  );
  const [countColumn, setCountColumn] = useState<string | undefined>(
    detection.suggestedMapping.countColumn
  );
  const [resultColumn, setResultColumn] = useState<string | undefined>(
    detection.suggestedMapping.resultColumn
  );
  const [unitsProducedColumn, setUnitsProducedColumn] = useState<string | undefined>(
    detection.suggestedMapping.unitsProducedColumn
  );
  const [aggregationUnit, setAggregationUnit] = useState<string>(
    detection.suggestedMapping.aggregationUnit ?? columnNames[0] ?? ''
  );

  const confidenceBadgeColor = useMemo(() => {
    switch (detection.confidence) {
      case 'high':
        return 'bg-green-500/10 text-green-400';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400';
      default:
        return 'bg-surface-secondary text-content-secondary';
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
    const handleClose = () => onDismiss();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onDismiss]);

  const handleEnable = () => {
    const mapping: DefectMapping = {
      dataShape: detection.dataShape,
      defectTypeColumn,
      countColumn,
      resultColumn,
      aggregationUnit,
      unitsProducedColumn,
    };
    onEnable(mapping);
  };

  const checkIcon = <Check size={14} className="text-green-400 shrink-0" />;

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
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-content">
                  {t?.('defect.detected.title') ?? 'Defect Data Detected'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${confidenceBadgeColor}`}
                  >
                    {detection.confidence === 'high' ? 'High' : 'Medium'}{' '}
                    {t?.('defect.detected.confidence') ?? 'confidence'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 text-content-secondary hover:text-content rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* Data shape indicator */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-surface-secondary rounded-lg">
            <span className="text-xs text-content-secondary">
              {t?.('defect.detected.dataShape') ?? 'Data shape'}:
            </span>
            <span className="text-sm text-content font-medium">
              {DATA_SHAPE_LABELS[detection.dataShape]}
            </span>
          </div>

          {/* Detected column roles */}
          <div className="bg-surface-secondary rounded-lg p-3 mb-4 space-y-2.5">
            {/* Defect type column - shown for event-log and pre-aggregated */}
            {(detection.dataShape === 'event-log' || detection.dataShape === 'pre-aggregated') && (
              <ColumnDropdown
                label={t?.('defect.detected.defectType') ?? 'Defect type'}
                value={defectTypeColumn}
                onChange={setDefectTypeColumn}
                options={columnNames}
                icon={checkIcon}
              />
            )}

            {/* Count column - shown for pre-aggregated */}
            {detection.dataShape === 'pre-aggregated' && (
              <ColumnDropdown
                label={t?.('defect.detected.count') ?? 'Count'}
                value={countColumn}
                onChange={setCountColumn}
                options={columnNames}
                icon={checkIcon}
              />
            )}

            {/* Result column - shown for pass/fail */}
            {detection.dataShape === 'pass-fail' && (
              <ColumnDropdown
                label={t?.('defect.detected.result') ?? 'Result'}
                value={resultColumn}
                onChange={setResultColumn}
                options={columnNames}
                icon={checkIcon}
              />
            )}

            {/* Units produced - always shown, optional */}
            <ColumnDropdown
              label={t?.('defect.detected.unitsProduced') ?? 'Units produced'}
              value={unitsProducedColumn}
              onChange={setUnitsProducedColumn}
              options={columnNames}
              allowNone
              icon={<Check size={14} className="text-blue-400 shrink-0" />}
            />
          </div>

          {/* Aggregation unit selector */}
          <div className="mb-5">
            <label className="block text-sm text-content-secondary mb-1.5">
              {t?.('defect.detected.aggregationUnit') ?? 'Group defects by'}
            </label>
            <div className="relative">
              <select
                value={aggregationUnit}
                onChange={e => setAggregationUnit(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-content text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-8"
              >
                {columnNames.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-secondary pointer-events-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-2.5 text-sm text-content-secondary bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded-lg transition-colors"
            >
              {t?.('defect.detected.dismiss') ?? 'Use Standard Mode'}
            </button>
            <button
              onClick={handleEnable}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
            >
              {t?.('defect.detected.enable') ?? 'Enable Defect Mode'}
            </button>
          </div>
        </div>
      </FocusTrap>
    </dialog>
  );
};
