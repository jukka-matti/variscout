import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import type { DataRow } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';

export interface SelectionPanelProps {
  /** Selected point indices in filteredData */
  selectedIndices: Set<number>;
  /** Filtered data array */
  data: DataRow[];
  /** Outcome column name */
  outcome: string | null;
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** Factor columns to show in point details */
  factors?: string[];
  /** Time column name (if any) */
  timeColumn?: string | null;
  /** Clear selection callback */
  onClearSelection: () => void;
  /** Create factor callback */
  onCreateFactor: () => void;
}

/**
 * Format a value for display (truncate long strings)
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const str = String(value);
  return str.length > 20 ? str.slice(0, 20) + '...' : str;
}

/**
 * SelectionPanel - Compact bar with expandable point details
 *
 * Collapsed (default): Single-line bar with count + actions (~36px)
 * Expanded (click chevron): Absolute dropdown overlaying chart with point list
 *
 * Design:
 * ```
 * ┌──────────────────────────────────────────────────┐
 * │ ● 6 selected (Esc)  [✕ Clear] [+ Create Factor] ▼│
 * └──────────────────────────────────────────────────┘
 *
 * Expanded (overlays chart, doesn't push it down):
 * ┌──────────────────────────────────────────────────┐
 * │ ● 6 selected (Esc)  [✕ Clear] [+ Create Factor] ▲│
 * ├──────────────────────────────────────────────────┤
 * │ #16: Moisture_pct=10.4, Drying_Bed=Bed B         │
 * │ ... and 1 more                                    │
 * └──────────────────────────────────────────────────┘
 * ```
 */
export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  selectedIndices,
  data,
  outcome,
  columnAliases = {},
  factors = [],
  timeColumn,
  onClearSelection,
  onCreateFactor,
}) => {
  const { t, formatStat } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Convert Set to sorted array of indices
  const sortedIndices = useMemo(() => {
    return Array.from(selectedIndices).sort((a, b) => a - b);
  }, [selectedIndices]);

  // Get first 5 points for display
  const displayPoints = useMemo(() => {
    return sortedIndices.slice(0, 5).map(index => {
      const row = data[index];
      if (!row) return null;

      const value = outcome ? row[outcome] : null;
      const factorValues = factors.map(f => ({
        name: columnAliases[f] || f,
        value: formatValue(row[f]),
      }));
      const timeValue = timeColumn ? formatValue(row[timeColumn]) : null;

      return {
        index,
        rowNumber: index + 1,
        value: value !== null && value !== undefined ? formatStat(Number(value), 1) : '—',
        factors: factorValues,
        time: timeValue,
      };
    });
  }, [sortedIndices, data, outcome, factors, timeColumn, columnAliases, formatStat]);

  const remainingCount = sortedIndices.length - 5;

  // Close dropdown on click outside
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        barRef.current &&
        !barRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Collapse when selection is cleared
  useEffect(() => {
    if (selectedIndices.size === 0) setIsExpanded(false);
  }, [selectedIndices.size]);

  return (
    <div className="relative bg-blue-500/10 border-b border-blue-500/30" ref={barRef}>
      {/* Compact bar — always visible */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-1.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:bg-blue-500/10 rounded px-1 -ml-1 py-0.5 transition-colors"
          aria-expanded={isExpanded}
          aria-label={`${sortedIndices.length} points selected. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-300">
            {sortedIndices.length} {sortedIndices.length === 1 ? 'point' : 'points'} selected
          </span>
          <span className="text-xs text-content-muted hidden sm:inline">(Esc to clear)</span>
          {isExpanded ? (
            <ChevronUp size={14} className="text-content-muted" />
          ) : (
            <ChevronDown size={14} className="text-content-muted" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 px-2 py-1 text-xs text-content-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
            aria-label="Clear selection"
          >
            <X size={14} />
            <span className="hidden sm:inline">{t('action.clear')}</span>
          </button>

          <button
            onClick={onCreateFactor}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded text-xs font-medium transition-colors"
            aria-label="Create factor from selection"
          >
            <Tag size={14} />
            <span>Create Factor</span>
          </button>
        </div>
      </div>

      {/* Expandable dropdown — overlays chart, doesn't push content */}
      {isExpanded && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 bg-surface-secondary border border-blue-500/30 border-t-0 rounded-b-lg shadow-xl px-4 sm:px-6 py-2 space-y-1"
        >
          {displayPoints.map(point => {
            if (!point) return null;

            return (
              <div key={point.index} className="text-xs text-content-secondary">
                <span className="text-blue-300 font-medium">#{point.rowNumber}:</span>
                {outcome && (
                  <>
                    {' '}
                    <span className="text-content-muted">{columnAliases[outcome] || outcome}=</span>
                    <span className="text-white">{point.value}</span>
                  </>
                )}
                {point.factors.map(f => (
                  <span key={f.name}>
                    {', '}
                    <span className="text-content-muted">{f.name}=</span>
                    <span className="text-white">{f.value}</span>
                  </span>
                ))}
                {point.time && (
                  <>
                    {', '}
                    <span className="text-content-muted">
                      {columnAliases[timeColumn!] || timeColumn}=
                    </span>
                    <span className="text-white">{point.time}</span>
                  </>
                )}
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div className="text-xs text-content-muted italic pt-1">
              ... and {remainingCount} more {remainingCount === 1 ? 'point' : 'points'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
