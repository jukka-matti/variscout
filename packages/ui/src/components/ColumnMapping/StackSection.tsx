/**
 * StackSection — Wide-form data stacking UI within ColumnMapping
 *
 * When many numeric columns are detected, this section lets users
 * select which columns to stack (unpivot) into a single measure + label column.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Layers, Search, X } from 'lucide-react';
import type { ColumnAnalysis, StackConfig } from '@variscout/core';
import type { StackSuggestion } from '@variscout/core';

export interface StackSectionProps {
  /** Stack suggestion from detectColumns() */
  suggestedStack: StackSuggestion;
  /** Column analysis for all columns */
  columnAnalysis: ColumnAnalysis[];
  /** Total row count of the original data */
  totalRows: number;
  /** Platform row limit for warning */
  rowLimit?: number;
  /** Current stack config (for controlled state) */
  stackConfig: StackConfig | null;
  /** Callback when stack config changes */
  onStackConfigChange: (config: StackConfig | null) => void;
  /** Initial stack config (from persistence) */
  initialStackConfig?: StackConfig | null;
}

export const StackSection: React.FC<StackSectionProps> = ({
  suggestedStack,
  columnAnalysis,
  totalRows,
  rowLimit = 50000,
  stackConfig,
  onStackConfigChange,
}) => {
  const isEnabled = stackConfig !== null;
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // All numeric columns (candidates for stacking)
  const numericColumns = useMemo(
    () => columnAnalysis.filter(c => c.type === 'numeric'),
    [columnAnalysis]
  );

  // Current selection (from config or suggestion)
  const selectedColumns = useMemo(
    () => new Set(stackConfig?.columnsToStack ?? suggestedStack.columnsToStack),
    [stackConfig, suggestedStack]
  );

  // Columns NOT selected for stacking
  const keptColumns = useMemo(
    () => columnAnalysis.filter(c => !selectedColumns.has(c.name)).map(c => c.name),
    [columnAnalysis, selectedColumns]
  );

  // Projected output
  const projectedRows = totalRows * selectedColumns.size;
  const exceedsLimit = projectedRows > rowLimit;

  // Filtered columns for the selection modal
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return numericColumns;
    const term = searchTerm.toLowerCase();
    return numericColumns.filter(c => c.name.toLowerCase().includes(term));
  }, [numericColumns, searchTerm]);

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      onStackConfigChange(null);
    } else {
      onStackConfigChange({
        columnsToStack: suggestedStack.columnsToStack,
        measureName: suggestedStack.measureName ?? '',
        labelName: suggestedStack.labelName ?? '',
      });
    }
  }, [isEnabled, onStackConfigChange, suggestedStack]);

  const toggleColumn = useCallback(
    (colName: string) => {
      if (!stackConfig) return;
      const current = new Set(stackConfig.columnsToStack);
      if (current.has(colName)) {
        current.delete(colName);
      } else {
        current.add(colName);
      }
      onStackConfigChange({
        ...stackConfig,
        columnsToStack: Array.from(current),
      });
    },
    [stackConfig, onStackConfigChange]
  );

  const selectAll = useCallback(() => {
    if (!stackConfig) return;
    onStackConfigChange({
      ...stackConfig,
      columnsToStack: numericColumns.map(c => c.name),
    });
  }, [stackConfig, numericColumns, onStackConfigChange]);

  const deselectAll = useCallback(() => {
    if (!stackConfig) return;
    onStackConfigChange({
      ...stackConfig,
      columnsToStack: [],
    });
  }, [stackConfig, onStackConfigChange]);

  const updateName = useCallback(
    (field: 'measureName' | 'labelName', value: string) => {
      if (!stackConfig) return;
      onStackConfigChange({ ...stackConfig, [field]: value });
    },
    [stackConfig, onStackConfigChange]
  );

  return (
    <div
      className={`rounded-lg border-2 transition-colors ${
        isEnabled ? 'border-purple-500/40 bg-purple-950/20' : 'border-slate-700 bg-slate-900/30'
      }`}
      data-testid="stack-section"
    >
      {/* Header with toggle */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Layers size={18} className={isEnabled ? 'text-purple-400' : 'text-slate-500'} />
          <div>
            <div
              className={`font-semibold text-sm ${isEnabled ? 'text-purple-300' : 'text-slate-400'}`}
            >
              Stack Columns
            </div>
            <div className="text-xs text-slate-500">
              Combine {suggestedStack.columnsToStack.length} columns into one measure + one label
            </div>
          </div>
        </div>
        <div
          className={`w-10 h-5 rounded-full transition-colors relative ${
            isEnabled ? 'bg-purple-500' : 'bg-slate-600'
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
              isEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </div>
      </button>

      {/* Expanded content when enabled */}
      {isEnabled && stackConfig && (
        <div className="px-4 pb-4 space-y-3">
          {/* Selected columns summary */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Columns to stack ({selectedColumns.size} of {numericColumns.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectionOpen(!selectionOpen)}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                {selectionOpen ? 'Close' : 'Edit selection...'}
              </button>
            </div>

            {/* Compact chip display */}
            {!selectionOpen && (
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {stackConfig.columnsToStack.slice(0, 8).map(col => (
                  <span
                    key={col}
                    className="text-xs bg-purple-900/40 border border-purple-700/30 text-purple-300 px-2 py-0.5 rounded"
                  >
                    {col}
                  </span>
                ))}
                {stackConfig.columnsToStack.length > 8 && (
                  <span className="text-xs text-slate-500 px-1">
                    +{stackConfig.columnsToStack.length - 8} more
                  </span>
                )}
              </div>
            )}

            {/* Expanded selection list */}
            {selectionOpen && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={14}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Filter columns..."
                      className="w-full pl-7 pr-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    None
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredColumns.map(col => (
                    <label
                      key={col.name}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(col.name)}
                        onChange={() => toggleColumn(col.name)}
                        className="rounded border-slate-600 text-purple-500 focus:ring-purple-500/30"
                      />
                      <span className="text-xs text-slate-300 flex-1 truncate">{col.name}</span>
                      <span className="text-xs text-slate-600 tabular-nums">
                        {col.sampleValues.slice(0, 2).join(', ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kept columns (not stacked) */}
          {keptColumns.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Not stacked (kept as columns)
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {keptColumns.map(col => (
                  <span
                    key={col}
                    className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Naming inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide block mb-1">
                Measure name
              </label>
              <input
                type="text"
                value={stackConfig.measureName}
                onChange={e => updateName('measureName', e.target.value)}
                placeholder="e.g. Arrivals, Score, Temperature"
                className="w-full text-sm bg-slate-800/70 border border-slate-600 rounded px-2.5 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                data-testid="stack-measure-name"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide block mb-1">
                Label name
              </label>
              <input
                type="text"
                value={stackConfig.labelName}
                onChange={e => updateName('labelName', e.target.value)}
                placeholder="e.g. Country, Question, Sensor"
                className="w-full text-sm bg-slate-800/70 border border-slate-600 rounded px-2.5 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                data-testid="stack-label-name"
              />
            </div>
          </div>

          {/* Validation messages */}
          {(!stackConfig.measureName.trim() || !stackConfig.labelName.trim()) && (
            <p className="text-xs text-amber-400">Name the stacked columns to continue.</p>
          )}

          {/* Preview */}
          <div className="bg-slate-900/50 border border-slate-700 rounded px-3 py-2">
            <div className="text-xs text-slate-500">
              {totalRows.toLocaleString()} rows × {selectedColumns.size} columns ={' '}
              <span className={exceedsLimit ? 'text-amber-400 font-semibold' : 'text-purple-300'}>
                {projectedRows.toLocaleString()} rows
              </span>
              {' × '}
              {keptColumns.length + 2} columns
            </div>
            {exceedsLimit && (
              <p className="text-xs text-amber-400 mt-1">
                Projected rows exceed the {rowLimit.toLocaleString()} row limit. Consider
                deselecting some columns.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StackSection;
