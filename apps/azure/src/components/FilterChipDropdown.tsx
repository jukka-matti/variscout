import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useIsMobile } from '@variscout/ui';
import type { FilterChipData } from '@variscout/hooks';

interface FilterChipDropdownProps {
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
}

/**
 * Multi-select dropdown for filter chips
 *
 * Shows all available values for a factor with:
 * - Checkboxes for each value
 * - Contribution bars showing % of total variation
 * - Combined contribution of selected values
 *
 * On mobile: renders as a bottom sheet
 * On desktop: renders as a positioned dropdown
 */
const FilterChipDropdown: React.FC<FilterChipDropdownProps> = ({
  chipData,
  factorLabel,
  onValuesChange,
  onClose,
  anchorRect,
}) => {
  const isMobile = useIsMobile();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localValues, setLocalValues] = useState<Set<string>>(new Set(chipData.values.map(String)));

  // Calculate combined contribution of currently selected values
  const combinedContribution = chipData.availableValues
    .filter(v => localValues.has(String(v.value)))
    .reduce((sum, v) => sum + v.contributionPct, 0);

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
      {chipData.availableValues.map(({ value, contributionPct, isSelected }) => {
        const valueStr = String(value);
        const isChecked = localValues.has(valueStr);

        return (
          <button
            key={valueStr}
            onClick={() => toggleValue(value)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-left
              hover:bg-slate-700/50 transition-colors
              ${isChecked ? 'bg-slate-700/30' : ''}
            `}
          >
            {/* Checkbox */}
            <div
              className={`
                w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                ${isChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}
              `}
            >
              {isChecked && <Check size={12} className="text-white" />}
            </div>

            {/* Value label */}
            <span className="flex-1 text-sm text-white truncate">{valueStr}</span>

            {/* Contribution bar and percentage */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(contributionPct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">
                {Math.round(contributionPct)}%
              </span>
            </div>
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
          className="fixed bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl z-50 animate-slide-up"
        >
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-slate-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
            <span className="text-sm font-medium text-white">{factorLabel}</span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Value list */}
          {renderValueList()}

          {/* Footer with combined contribution */}
          <div className="px-4 py-3 border-t border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Selected contribution:</span>
              <span className="text-blue-400 font-medium">{Math.round(combinedContribution)}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Combined contribution is approximate due to factor interactions.
            </p>
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
        className="z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
          <span className="text-sm font-medium text-white">{factorLabel}</span>
          <button
            onClick={onClose}
            className="p-0.5 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Value list */}
        {renderValueList()}

        {/* Footer with combined contribution */}
        <div className="px-3 py-2 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Selected:</span>
            <span className="text-blue-400 font-medium">
              {Math.round(combinedContribution)}% combined
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterChipDropdown;
