import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface YAxisPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentMin?: number;
  currentMax?: number;
  autoMin: number;
  autoMax: number;
  onSave: (settings: { min?: number; max?: number }) => void;
  anchorPosition?: { top: number; left: number };
}

const YAxisPopover: React.FC<YAxisPopoverProps> = ({
  isOpen,
  onClose,
  currentMin,
  currentMax,
  autoMin,
  autoMax,
  onSave,
  anchorPosition,
}) => {
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
      className="absolute z-50 w-48 bg-surface-secondary border border-edge rounded-lg shadow-2xl animate-fade-in"
      style={{
        top: anchorPosition?.top ?? 40,
        left: anchorPosition?.left ?? 10,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge">
        <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Y-Axis Scale
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-content-muted hover:text-content rounded transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inputs */}
      <div className="p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-content-secondary uppercase">Max</label>
            <span className="text-[10px] text-content-muted">Auto: {autoMax.toFixed(2)}</span>
          </div>
          <input
            type="number"
            step="any"
            value={localMax}
            onChange={e => setLocalMax(e.target.value)}
            placeholder={autoMax.toFixed(2)}
            className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-sm text-white text-right outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-content-secondary uppercase">Min</label>
            <span className="text-[10px] text-content-muted">Auto: {autoMin.toFixed(2)}</span>
          </div>
          <input
            type="number"
            step="any"
            value={localMin}
            onChange={e => setLocalMin(e.target.value)}
            placeholder={autoMin.toFixed(2)}
            className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-sm text-white text-right outline-none focus:border-blue-500 transition-colors"
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
            className="w-full py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 bg-surface-tertiary hover:bg-surface-elevated text-content-secondary hover:text-content"
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
              : 'bg-surface-tertiary text-content-muted cursor-not-allowed'
          }`}
        >
          {hasChanges ? 'Apply Changes' : 'No Changes'}
        </button>
      </div>
    </div>
  );
};

export default YAxisPopover;
