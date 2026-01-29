/**
 * MeasureColumnSelector - Reusable checkbox list for selecting numeric columns as measures
 *
 * Shows all numeric columns from detectChannelColumns() with:
 * - Highlights for auto-detected measures (matched naming pattern)
 * - Preview stats (n, min, max, mean) per column
 * - Select All / Clear All buttons
 * - Minimum 3 measures validation
 */

import React, { useMemo, useCallback } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { ChannelInfo } from '@variscout/core';

export interface MeasureColumnSelectorProps {
  /** Available columns from detectChannelColumns() */
  availableColumns: ChannelInfo[];
  /** Currently selected column IDs */
  selectedColumns: string[];
  /** Callback when selection changes */
  onSelectionChange: (columns: string[]) => void;
  /** Minimum number of columns required (default: 3) */
  minColumns?: number;
}

export const MeasureColumnSelector: React.FC<MeasureColumnSelectorProps> = ({
  availableColumns,
  selectedColumns,
  onSelectionChange,
  minColumns = 3,
}) => {
  // Group columns: matched pattern first, then others
  const sortedColumns = useMemo(() => {
    const matched = availableColumns.filter(c => c.matchedPattern);
    const unmatched = availableColumns.filter(c => !c.matchedPattern);
    return [...matched, ...unmatched];
  }, [availableColumns]);

  const allSelected = selectedColumns.length === availableColumns.length;
  const noneSelected = selectedColumns.length === 0;
  const isValid = selectedColumns.length >= minColumns;

  const toggleColumn = useCallback(
    (columnId: string) => {
      if (selectedColumns.includes(columnId)) {
        onSelectionChange(selectedColumns.filter(id => id !== columnId));
      } else {
        onSelectionChange([...selectedColumns, columnId]);
      }
    },
    [selectedColumns, onSelectionChange]
  );

  const selectAll = useCallback(() => {
    onSelectionChange(availableColumns.map(c => c.id));
  }, [availableColumns, onSelectionChange]);

  const clearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const selectMatched = useCallback(() => {
    const matched = availableColumns.filter(c => c.matchedPattern).map(c => c.id);
    onSelectionChange(matched);
  }, [availableColumns, onSelectionChange]);

  const matchedCount = availableColumns.filter(c => c.matchedPattern).length;

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={selectAll}
          disabled={allSelected}
          className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Select All ({availableColumns.length})
        </button>
        {matchedCount > 0 && matchedCount < availableColumns.length && (
          <button
            onClick={selectMatched}
            className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors flex items-center gap-1"
          >
            <Sparkles size={12} />
            Auto-detected ({matchedCount})
          </button>
        )}
        <button
          onClick={clearAll}
          disabled={noneSelected}
          className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear All
        </button>
        <span className="text-xs text-slate-500 ml-auto">
          {selectedColumns.length} selected
          {!isValid && <span className="text-amber-400 ml-1">(min {minColumns})</span>}
        </span>
      </div>

      {/* Column list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
        {sortedColumns.map(column => {
          const isSelected = selectedColumns.includes(column.id);
          const isMatched = column.matchedPattern;

          return (
            <button
              key={column.id}
              onClick={() => toggleColumn(column.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                  : isMatched
                    ? 'bg-purple-600/10 border-purple-600/30 hover:border-purple-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                }`}
              >
                {isSelected && <Check size={12} className="text-white" />}
              </div>

              {/* Column info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium truncate ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {column.label}
                  </span>
                  {isMatched && (
                    <Sparkles
                      size={12}
                      className="text-purple-400 flex-shrink-0"
                      aria-label="Auto-detected measure pattern"
                    />
                  )}
                </div>

                {/* Preview stats */}
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                  <span>n={column.n}</span>
                  <span>
                    {column.preview.min.toFixed(1)}–{column.preview.max.toFixed(1)}
                  </span>
                  <span>μ={column.preview.mean.toFixed(2)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {availableColumns.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-8">
          No numeric columns detected in your data.
        </div>
      )}
    </div>
  );
};

export default MeasureColumnSelector;
