import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

/**
 * Color scheme for YAxisPopover component
 * Allows customization for different app themes (PWA vs Azure)
 */
export interface YAxisPopoverColorScheme {
  /** Container background (e.g., 'bg-surface-secondary' or 'bg-slate-800') */
  background: string;
  /** Container border (e.g., 'border-edge' or 'border-slate-600') */
  border: string;
  /** Header text (e.g., 'text-content-secondary' or 'text-slate-400') */
  headerText: string;
  /** Close button default (e.g., 'text-content-muted' or 'text-slate-500') */
  closeButtonDefault: string;
  /** Close button hover (e.g., 'hover:text-content' or 'hover:text-white') */
  closeButtonHover: string;
  /** Label text (e.g., 'text-content-secondary' or 'text-slate-400') */
  labelText: string;
  /** Auto value text (e.g., 'text-content-muted' or 'text-slate-500') */
  autoValueText: string;
  /** Input background (e.g., 'bg-surface' or 'bg-slate-900') */
  inputBackground: string;
  /** Input border (e.g., 'border-edge' or 'border-slate-700') */
  inputBorder: string;
  /** Reset button background (e.g., 'bg-surface-tertiary' or 'bg-slate-700') */
  resetButtonBg: string;
  /** Reset button hover background (e.g., 'hover:bg-surface-elevated' or 'hover:bg-slate-600') */
  resetButtonHoverBg: string;
  /** Reset button text (e.g., 'text-content-secondary' or 'text-slate-400') */
  resetButtonText: string;
  /** Reset button hover text (e.g., 'hover:text-content' or 'hover:text-white') */
  resetButtonHoverText: string;
  /** Disabled button background (e.g., 'bg-surface-tertiary' or 'bg-slate-700') */
  disabledButtonBg: string;
  /** Disabled button text (e.g., 'text-content-muted' or 'text-slate-500') */
  disabledButtonText: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: YAxisPopoverColorScheme = {
  background: 'bg-surface-secondary',
  border: 'border-edge',
  headerText: 'text-content-secondary',
  closeButtonDefault: 'text-content-muted',
  closeButtonHover: 'hover:text-content',
  labelText: 'text-content-secondary',
  autoValueText: 'text-content-muted',
  inputBackground: 'bg-surface',
  inputBorder: 'border-edge',
  resetButtonBg: 'bg-surface-tertiary',
  resetButtonHoverBg: 'hover:bg-surface-elevated',
  resetButtonText: 'text-content-secondary',
  resetButtonHoverText: 'hover:text-content',
  disabledButtonBg: 'bg-surface-tertiary',
  disabledButtonText: 'text-content-muted',
};

export interface YAxisPopoverProps {
  /** Whether the popover is visible */
  isOpen: boolean;
  /** Callback when popover should close */
  onClose: () => void;
  /** Current custom minimum value (undefined = auto) */
  currentMin?: number;
  /** Current custom maximum value (undefined = auto) */
  currentMax?: number;
  /** Auto-calculated minimum value */
  autoMin: number;
  /** Auto-calculated maximum value */
  autoMax: number;
  /** Callback when settings are saved */
  onSave: (settings: { min?: number; max?: number }) => void;
  /** Position for the popover */
  anchorPosition?: { top: number; left: number };
  /** Color scheme for styling (defaults to PWA semantic tokens) */
  colorScheme?: YAxisPopoverColorScheme;
}

/**
 * Y-Axis scale configuration popover
 *
 * Allows users to set custom min/max values for chart Y-axis.
 * Includes validation and reset to auto functionality.
 *
 * @example
 * ```tsx
 * // Using PWA semantic tokens (default)
 * <YAxisPopover
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   autoMin={0}
 *   autoMax={100}
 *   onSave={(settings) => setAxisSettings(settings)}
 * />
 *
 * ```
 */
const YAxisPopover: React.FC<YAxisPopoverProps> = ({
  isOpen,
  onClose,
  currentMin,
  currentMax,
  autoMin,
  autoMax,
  onSave,
  anchorPosition,
  colorScheme = defaultColorScheme,
}) => {
  const { formatStat } = useTranslation();
  const [localMin, setLocalMin] = useState<string>('');
  const [localMax, setLocalMax] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync local state when popover opens or props change
  useEffect(() => {
    if (isOpen) {
      setLocalMin(currentMin !== undefined ? currentMin.toString() : '');
      setLocalMax(currentMax !== undefined ? currentMax.toString() : '');
      setValidationError(null);
    }
  }, [isOpen, currentMin, currentMax]);

  // Track changes
  useEffect(() => {
    const newMin = localMin ? parseFloat(localMin) : undefined;
    const newMax = localMax ? parseFloat(localMax) : undefined;
    const changed = newMin !== currentMin || newMax !== currentMax;
    setHasChanges(changed);

    // Validate min < max
    if (newMin !== undefined && newMax !== undefined && newMin >= newMax) {
      setValidationError('Min must be less than Max');
    } else {
      setValidationError(null);
    }
  }, [localMin, localMax, currentMin, currentMax]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (popoverRef.current && target && !popoverRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApply = useCallback(() => {
    if (validationError) return;

    const newSettings = {
      min: localMin ? parseFloat(localMin) : undefined,
      max: localMax ? parseFloat(localMax) : undefined,
    };
    onSave(newSettings);
    onClose();
  }, [localMin, localMax, validationError, onSave, onClose]);

  const handleReset = useCallback(() => {
    onSave({});
    onClose();
  }, [onSave, onClose]);

  if (!isOpen) return null;

  const isAutoScale = currentMin === undefined && currentMax === undefined;

  return (
    <div
      ref={popoverRef}
      className={`fixed z-50 w-48 ${colorScheme.background} border ${colorScheme.border} rounded-lg shadow-2xl animate-fade-in`}
      style={{
        top: anchorPosition?.top ?? 40,
        left: anchorPosition?.left ?? 10,
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${colorScheme.border}`}>
        <h4 className={`text-xs font-semibold ${colorScheme.headerText} uppercase tracking-wider`}>
          Y-Axis Scale
        </h4>
        <button
          onClick={onClose}
          className={`p-1 ${colorScheme.closeButtonDefault} ${colorScheme.closeButtonHover} rounded transition-colors`}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inputs */}
      <div className="p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="yaxis-max" className={`text-[10px] ${colorScheme.labelText} uppercase`}>
              Max
            </label>
            <span className={`text-[10px] ${colorScheme.autoValueText}`}>
              Auto: {formatStat(autoMax)}
            </span>
          </div>
          <input
            id="yaxis-max"
            name="yaxis-max"
            type="number"
            step="any"
            value={localMax}
            onChange={e => setLocalMax(e.target.value)}
            placeholder={formatStat(autoMax)}
            className={`w-full ${colorScheme.inputBackground} border ${colorScheme.inputBorder} rounded px-2 py-1.5 text-sm text-white text-right outline-none focus:border-blue-500 transition-colors`}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="yaxis-min" className={`text-[10px] ${colorScheme.labelText} uppercase`}>
              Min
            </label>
            <span className={`text-[10px] ${colorScheme.autoValueText}`}>
              Auto: {formatStat(autoMin)}
            </span>
          </div>
          <input
            id="yaxis-min"
            name="yaxis-min"
            type="number"
            step="any"
            value={localMin}
            onChange={e => setLocalMin(e.target.value)}
            placeholder={formatStat(autoMin)}
            className={`w-full ${colorScheme.inputBackground} border ${colorScheme.inputBorder} rounded px-2 py-1.5 text-sm text-white text-right outline-none focus:border-blue-500 transition-colors`}
          />
        </div>

        {/* Validation Error */}
        {validationError && <p className="text-xs text-red-400">{validationError}</p>}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 space-y-2">
        {/* Auto Reset Button */}
        {!isAutoScale && (
          <button
            onClick={handleReset}
            className={`w-full py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${colorScheme.resetButtonBg} ${colorScheme.resetButtonHoverBg} ${colorScheme.resetButtonText} ${colorScheme.resetButtonHoverText}`}
          >
            <RotateCcw size={12} />
            Reset to Auto
          </button>
        )}

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={!hasChanges || !!validationError}
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${
            hasChanges && !validationError
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : `${colorScheme.disabledButtonBg} ${colorScheme.disabledButtonText} cursor-not-allowed`
          }`}
        >
          {hasChanges ? 'Apply Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  );
};

export default YAxisPopover;
