import React, { useMemo } from 'react';
import { X, Tag } from 'lucide-react';
import type { DataRow } from '@variscout/core';

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
 * SelectionPanel - Shows selected points with details
 *
 * Appears below FilterBreadcrumb when points are brushed in IChart.
 * Shows first 5 selected points with their values and factors.
 *
 * Design:
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │ 12 points selected       [Clear] [Create Factor] │
 * ├─────────────────────────────────────────────────┤
 * │ #23: Value=45.2, Operator=A, Time=09:15        │
 * │ #47: Value=43.8, Operator=B, Time=09:30        │
 * │ #52: Value=44.1, Operator=A, Time=09:35        │
 * │ ... and 9 more points                           │
 * └─────────────────────────────────────────────────┘
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
  // Convert Set to sorted array of indices
  const sortedIndices = useMemo(() => {
    return Array.from(selectedIndices).sort((a, b) => a - b);
  }, [selectedIndices]);

  // Get first 5 points for display
  const displayPoints = useMemo(() => {
    return sortedIndices.slice(0, 5).map(index => {
      const row = data[index];
      if (!row) return null;

      // Get outcome value
      const value = outcome ? row[outcome] : null;

      // Get factor values
      const factorValues = factors.map(f => ({
        name: columnAliases[f] || f,
        value: formatValue(row[f]),
      }));

      // Get time value
      const timeValue = timeColumn ? formatValue(row[timeColumn]) : null;

      return {
        index,
        rowNumber: index + 1, // 1-based for user display
        value: value !== null && value !== undefined ? Number(value).toFixed(1) : '—',
        factors: factorValues,
        time: timeValue,
      };
    });
  }, [sortedIndices, data, outcome, factors, timeColumn, columnAliases]);

  const remainingCount = sortedIndices.length - 5;

  return (
    <div className="flex flex-col bg-blue-500/10 border-b border-blue-500/30">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-blue-500/20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-300">
            {sortedIndices.length} {sortedIndices.length === 1 ? 'point' : 'points'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear button */}
          <button
            onClick={onClearSelection}
            className="
              flex items-center gap-1 px-2 py-1
              text-xs text-content-secondary
              hover:text-red-400 hover:bg-red-400/10
              rounded transition-colors
            "
            aria-label="Clear selection"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Create Factor button */}
          <button
            onClick={onCreateFactor}
            className="
              flex items-center gap-1.5 px-3 py-1.5
              bg-blue-500/20 text-blue-300
              hover:bg-blue-500/30
              rounded text-xs font-medium
              transition-colors
            "
            aria-label="Create factor from selection"
          >
            <Tag size={14} />
            <span>Create Factor</span>
          </button>
        </div>
      </div>

      {/* Point details */}
      <div className="px-4 sm:px-6 py-2 space-y-1">
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
              {point.factors.map((f, i) => (
                <span key={i}>
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
    </div>
  );
};
