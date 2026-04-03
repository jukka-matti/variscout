import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useIsMobile, BREAKPOINTS } from '../../hooks';
import type { FilterChipData } from '../filterTypes';

/**
 * Color scheme for FilterChipDropdown component
 */
export interface FilterChipDropdownColorScheme {
  /** Secondary background (e.g., 'bg-surface-secondary' or 'bg-slate-800') */
  secondaryBg: string;
  /** Tertiary background (e.g., 'bg-surface-tertiary/50' or 'bg-slate-700/50') */
  tertiaryBg: string;
  /** Surface background (e.g., 'bg-surface' or 'bg-slate-900') */
  surfaceBg: string;
  /** Border color (e.g., 'border-edge' or 'border-slate-700') */
  border: string;
  /** Secondary border (e.g., 'border-edge' or 'border-slate-600') */
  borderSecondary: string;
  /** Secondary text (e.g., 'text-content-secondary' or 'text-slate-400') */
  textSecondary: string;
  /** Muted text (e.g., 'text-content-muted' or 'text-slate-500') */
  textMuted: string;
  /** Hover background (e.g., 'hover:bg-surface-tertiary/50' or 'hover:bg-slate-700/50') */
  hoverBg: string;
  /** Selected row background (e.g., 'bg-surface-tertiary/30' or 'bg-slate-700/30') */
  selectedBg: string;
  /** Progress bar background (e.g., 'bg-surface-tertiary' or 'bg-slate-700') */
  progressBg: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: FilterChipDropdownColorScheme = {
  secondaryBg: 'bg-surface-secondary',
  tertiaryBg: 'bg-surface-tertiary/50',
  surfaceBg: 'bg-surface',
  border: 'border-edge',
  borderSecondary: 'border-edge',
  textSecondary: 'text-content-secondary',
  textMuted: 'text-content-muted',
  hoverBg: 'hover:bg-surface-tertiary/50',
  selectedBg: 'bg-surface-tertiary/30',
  progressBg: 'bg-surface-tertiary',
};

export interface FilterChipDropdownProps {
  /** Chip data with available values and contributions */
  chipData: FilterChipData;
  /** Display label for the factor (may be aliased) */
  factorLabel: string;
  /** Called when values are toggled */
  onValuesChange: (factor: string, newValues: (string | number)[]) => void;
  /** Called when dropdown is closed */
  onClose: () => void;
  /** Anchor element position for desktop dropdown */
  anchorRect?: DOMRect;
  /** Color scheme for styling */
  colorScheme?: FilterChipDropdownColorScheme;
}

/**
 * Multi-select dropdown for filter chips
 *
 * Shows all available values for a factor with:
 * - Checkboxes for each value
 * - Sample count (n=X) per value
 * - Combined sample count of selected values
 *
 * On mobile: renders as a bottom sheet
 * On desktop: renders as a positioned dropdown
 *
 * @example
 * ```tsx
 * // Using PWA semantic tokens (default)
 * <FilterChipDropdown
 *   chipData={chipData}
 *   factorLabel="Shift"
 *   onValuesChange={handleValuesChange}
 *   onClose={handleClose}
 *   anchorRect={anchorRect}
 * />
 *
 * // Using Azure color scheme
 * <FilterChipDropdown
 *   chipData={chipData}
 *   factorLabel="Shift"
 *   onValuesChange={handleValuesChange}
 *   onClose={handleClose}
 *   anchorRect={anchorRect}
 * />
 * ```
 */
const FilterChipDropdown: React.FC<FilterChipDropdownProps> = ({
  chipData,
  factorLabel,
  onValuesChange,
  onClose,
  anchorRect,
  colorScheme = defaultColorScheme,
}) => {
  const isMobile = useIsMobile(BREAKPOINTS.phone);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localValues, setLocalValues] = useState<Set<string>>(new Set(chipData.values.map(String)));

  // Calculate combined sample count of currently selected values
  const combinedCount = chipData.availableValues
    .filter(v => localValues.has(String(v.value)))
    .reduce((sum, v) => sum + v.count, 0);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Toggle a value
  const toggleValue = useCallback(
    (value: string | number) => {
      const valueStr = String(value);
      const newValues = new Set(localValues);

      if (newValues.has(valueStr)) {
        newValues.delete(valueStr);
      } else {
        newValues.add(valueStr);
      }

      setLocalValues(newValues);

      // Convert back to original types based on chipData
      const newValuesArray = chipData.availableValues
        .filter(v => newValues.has(String(v.value)))
        .map(v => v.value);

      onValuesChange(chipData.factor, newValuesArray);
    },
    [localValues, chipData, onValuesChange]
  );

  // Render the value list
  const renderValueList = () => (
    <div className="max-h-64 overflow-y-auto">
      {chipData.availableValues.map(({ value, count }) => {
        const valueStr = String(value);
        const isChecked = localValues.has(valueStr);

        return (
          <button
            key={valueStr}
            onClick={() => toggleValue(value)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-left
              ${colorScheme.hoverBg} transition-colors
              ${isChecked ? colorScheme.selectedBg : ''}
            `}
          >
            {/* Checkbox */}
            <div
              className={`
                w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                ${isChecked ? 'bg-blue-500 border-blue-500' : colorScheme.borderSecondary}
              `}
            >
              {isChecked && <Check size={12} className="text-white" />}
            </div>

            {/* Value label */}
            <span className="flex-1 text-sm text-white truncate">{valueStr}</span>

            {/* Sample count */}
            <span className={`text-xs ${colorScheme.textSecondary} flex-shrink-0`}>n={count}</span>
          </button>
        );
      })}
    </div>
  );

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

        {/* Bottom sheet */}
        <div
          ref={dropdownRef}
          className={`fixed bottom-0 left-0 right-0 ${colorScheme.secondaryBg} rounded-t-2xl z-50 animate-slide-up`}
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div
              className={`w-10 h-1 ${colorScheme.border.replace('border-', 'bg-')} rounded-full`}
            />
          </div>

          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-2 border-b ${colorScheme.border}`}
          >
            <span className="text-sm font-medium text-white">{factorLabel}</span>
            <button
              onClick={onClose}
              className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center ${colorScheme.textSecondary} hover:text-white rounded transition-colors`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Value list */}
          {renderValueList()}

          {/* Footer with selected count */}
          <div className={`px-4 py-3 border-t ${colorScheme.border} ${colorScheme.surfaceBg}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={colorScheme.textSecondary}>Selected:</span>
              <span className="text-blue-400 font-medium">n={combinedCount}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop: Positioned dropdown
  const dropdownStyle: React.CSSProperties = anchorRect
    ? {
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - 280)),
        minWidth: Math.max(200, anchorRect.width),
        maxWidth: 320,
      }
    : {};

  return (
    <>
      {/* Backdrop (transparent, for click outside) */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        style={dropdownStyle}
        className={`z-50 ${colorScheme.secondaryBg} border ${colorScheme.border} rounded-lg shadow-xl shadow-black/30 overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b ${colorScheme.border}`}
        >
          <span className="text-sm font-medium text-white">{factorLabel}</span>
          <button
            onClick={onClose}
            className={`p-0.5 ${colorScheme.textSecondary} hover:text-white rounded transition-colors`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Value list */}
        {renderValueList()}

        {/* Footer with selected count */}
        <div className={`px-3 py-2 border-t ${colorScheme.border} ${colorScheme.surfaceBg}/50`}>
          <div className="flex items-center justify-between text-xs">
            <span className={colorScheme.textSecondary}>Selected:</span>
            <span className="text-blue-400 font-medium">n={combinedCount}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterChipDropdown;
