import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Table,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getSpecStatus } from '../lib/export';
import type { ExclusionReason } from '../logic/parser';

// Pagination threshold - show pagination for datasets larger than this
const ROWS_PER_PAGE = 500;

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number; // Row to scroll to and highlight (0-indexed)
  // Validation integration
  showExcludedOnly?: boolean; // Filter to show only excluded rows
  excludedRowIndices?: Set<number>; // Rows to highlight as excluded
  excludedReasons?: Map<number, ExclusionReason[]>; // Reason lookup by row index
}

const DataTableModal = ({
  isOpen,
  onClose,
  highlightRowIndex,
  showExcludedOnly = false,
  excludedRowIndices,
  excludedReasons,
}: DataTableModalProps) => {
  const { rawData, outcome, specs, setRawData } = useData();

  // Local copy of data for editing (don't mutate context until Apply)
  const [localData, setLocalData] = useState<Record<string, any>[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Track which cell is being edited
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Filter toggle for showing only excluded rows
  const [filterExcluded, setFilterExcluded] = useState(showExcludedOnly);

  // Apply filter to get display data with original indices
  const displayData = useMemo(() => {
    if (!filterExcluded || !excludedRowIndices) {
      return localData.map((row, i) => ({ row, originalIndex: i }));
    }
    return localData
      .map((row, i) => ({ row, originalIndex: i }))
      .filter(item => excludedRowIndices.has(item.originalIndex));
  }, [localData, filterExcluded, excludedRowIndices]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(displayData.length / ROWS_PER_PAGE);
  const needsPagination = displayData.length > ROWS_PER_PAGE;

  // Highlight animation state
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  // Get current page data (from displayData which may be filtered)
  const pageData = useMemo(() => {
    if (!needsPagination) return displayData;
    const start = currentPage * ROWS_PER_PAGE;
    return displayData.slice(start, start + ROWS_PER_PAGE);
  }, [displayData, currentPage, needsPagination]);

  // Refs for keyboard navigation
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local data when modal opens or rawData changes
  useEffect(() => {
    if (isOpen) {
      setLocalData(rawData.map(row => ({ ...row })));
      setHasChanges(false);
      setEditingCell(null);

      // If highlighting a specific row, navigate to its page
      if (
        highlightRowIndex !== undefined &&
        highlightRowIndex >= 0 &&
        highlightRowIndex < rawData.length
      ) {
        const targetPage = Math.floor(highlightRowIndex / ROWS_PER_PAGE);
        setCurrentPage(targetPage);
        setHighlightedRow(highlightRowIndex);
      } else {
        setCurrentPage(0);
        setHighlightedRow(null);
      }
    }
  }, [isOpen, rawData, highlightRowIndex]);

  // Scroll to highlighted row and fade out animation
  useEffect(() => {
    if (highlightedRow !== null && highlightRowRef.current) {
      // Small delay to ensure DOM is ready
      const scrollTimeout = setTimeout(() => {
        highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      // Clear highlight after animation
      const fadeTimeout = setTimeout(() => {
        setHighlightedRow(null);
      }, 3000);

      return () => {
        clearTimeout(scrollTimeout);
        clearTimeout(fadeTimeout);
      };
    }
  }, [highlightedRow]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  if (!isOpen) return null;

  // Get columns from data
  const columns = localData.length > 0 ? Object.keys(localData[0]) : [];

  // Get the original index from pageData item
  const getOriginalIndex = (pageRowIdx: number): number => {
    const item = pageData[pageRowIdx];
    return item ? item.originalIndex : pageRowIdx;
  };

  // Check if a row is excluded
  const isRowExcluded = (originalIndex: number): boolean => {
    return excludedRowIndices?.has(originalIndex) ?? false;
  };

  // Get exclusion reasons for a row
  const getExclusionReasons = (originalIndex: number): ExclusionReason[] => {
    return excludedReasons?.get(originalIndex) ?? [];
  };

  // Format exclusion reason for display
  const formatExclusionReason = (reasons: ExclusionReason[]): string => {
    return reasons
      .map(r => {
        if (r.type === 'missing') return `Missing value in ${r.column}`;
        if (r.type === 'non_numeric') return `Non-numeric: "${r.value}"`;
        return r.type;
      })
      .join(', ');
  };

  // Start editing a cell (uses absolute index)
  const startEditing = (rowIdx: number, col: string) => {
    // Safety check for async state updates
    if (rowIdx >= localData.length || !localData[rowIdx]) return;
    setEditingCell({ row: rowIdx, col });
    setEditValue(String(localData[rowIdx][col] ?? ''));
  };

  // Save edit to local state
  const saveEdit = () => {
    if (editingCell) {
      const newData = [...localData];
      // Try to parse as number if it looks numeric
      const numValue = parseFloat(editValue);
      newData[editingCell.row] = {
        ...newData[editingCell.row],
        [editingCell.col]: !isNaN(numValue) && editValue.trim() !== '' ? numValue : editValue,
      };
      setLocalData(newData);
      setHasChanges(true);
    }
    setEditingCell(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    const { row, col } = editingCell;
    const colIdx = columns.indexOf(col);

    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
      // Move to next row, same column
      if (row < localData.length - 1) {
        setTimeout(() => startEditing(row + 1, col), 0);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit();
      if (e.shiftKey) {
        // Move to previous cell
        if (colIdx > 0) {
          setTimeout(() => startEditing(row, columns[colIdx - 1]), 0);
        } else if (row > 0) {
          setTimeout(() => startEditing(row - 1, columns[columns.length - 1]), 0);
        }
      } else {
        // Move to next cell
        if (colIdx < columns.length - 1) {
          setTimeout(() => startEditing(row, columns[colIdx + 1]), 0);
        } else if (row < localData.length - 1) {
          setTimeout(() => startEditing(row + 1, columns[0]), 0);
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Add new row
  const addRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    const newIndex = localData.length; // Capture before state update
    setLocalData(prev => [...prev, newRow]);
    setHasChanges(true);
    // Start editing first cell of new row (use captured index)
    setTimeout(() => startEditing(newIndex, columns[0]), 0);
  };

  // Delete row
  const deleteRow = (rowIdx: number) => {
    const newData = localData.filter((_, i) => i !== rowIdx);
    setLocalData(newData);
    setHasChanges(true);
    setEditingCell(null);
  };

  // Apply changes to context
  const applyChanges = () => {
    setRawData(localData);
    setHasChanges(false);
    onClose();
  };

  // Get status color for outcome column
  const getStatusColor = (value: any): string => {
    if (!outcome) return 'text-content-secondary';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'text-content-secondary';

    const status = getSpecStatus(numValue, specs);
    switch (status) {
      case 'PASS':
        return 'text-green-500';
      case 'FAIL_USL':
        return 'text-red-400';
      case 'FAIL_LSL':
        return 'text-amber-500';
      default:
        return 'text-content-secondary';
    }
  };

  // Get status badge
  const getStatusBadge = (value: any) => {
    if (!outcome) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return <span className="text-content-muted text-xs">-</span>;

    const status = getSpecStatus(numValue, specs);
    switch (status) {
      case 'PASS':
        return <span className="text-green-500 text-xs font-medium">PASS</span>;
      case 'FAIL_USL':
        return <span className="text-red-400 text-xs font-medium">USL</span>;
      case 'FAIL_LSL':
        return <span className="text-amber-500 text-xs font-medium">LSL</span>;
      default:
        return <span className="text-content-muted text-xs">-</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-secondary border border-edge rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-edge">
          <div className="flex items-center gap-3">
            <Table size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Data Table</h2>
            <span className="text-sm text-content-secondary">
              {filterExcluded && excludedRowIndices
                ? `${displayData.length} excluded rows`
                : `${localData.length} rows`}
              {hasChanges && <span className="text-amber-400 ml-2">(unsaved changes)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter toggle for excluded rows */}
            {excludedRowIndices && excludedRowIndices.size > 0 && (
              <button
                onClick={() => setFilterExcluded(!filterExcluded)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterExcluded
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-surface-tertiary hover:bg-surface-elevated text-white'
                }`}
              >
                <Filter size={16} />
                {filterExcluded ? 'Show All' : `Show Excluded (${excludedRowIndices.size})`}
              </button>
            )}
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-surface-tertiary hover:bg-surface-elevated text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Row
            </button>
            <button
              onClick={onClose}
              className="text-content-secondary hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4">
          {localData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-content-muted italic">
              No data loaded. Import a file or add rows manually.
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-surface-secondary z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-content-secondary font-semibold border-b border-edge w-12">
                    #
                  </th>
                  {columns.map(col => (
                    <th
                      key={col}
                      className={`px-3 py-2 text-left font-semibold border-b border-edge ${
                        col === outcome ? 'text-blue-400' : 'text-content-secondary'
                      }`}
                    >
                      {col}
                      {col === outcome && <span className="text-xs ml-1">(Y)</span>}
                    </th>
                  ))}
                  {outcome && (
                    <th className="px-3 py-2 text-left text-content-secondary font-semibold border-b border-edge w-16">
                      Status
                    </th>
                  )}
                  <th className="px-3 py-2 text-center text-content-secondary font-semibold border-b border-edge w-16"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((item, pageRowIdx) => {
                  const { row, originalIndex } = item;
                  const isHighlighted = originalIndex === highlightedRow;
                  const isExcluded = isRowExcluded(originalIndex);
                  const exclusionReasons = getExclusionReasons(originalIndex);
                  return (
                    <tr
                      key={originalIndex}
                      ref={isHighlighted ? highlightRowRef : undefined}
                      className={`hover:bg-surface-tertiary/30 transition-colors duration-1000 ${
                        isHighlighted
                          ? 'bg-blue-500/30 animate-pulse'
                          : isExcluded
                            ? 'bg-amber-500/10'
                            : ''
                      }`}
                    >
                      <td className="px-3 py-1.5 text-content-muted border-b border-edge/50 font-mono text-xs">
                        <span className="flex items-center gap-1">
                          {originalIndex + 1}
                          {isExcluded && (
                            <span
                              className="text-amber-500"
                              title={formatExclusionReason(exclusionReasons)}
                            >
                              <AlertTriangle size={12} />
                            </span>
                          )}
                        </span>
                      </td>
                      {columns.map(col => (
                        <td
                          key={col}
                          className={`px-1 py-0.5 border-b border-edge/50 ${
                            col === outcome ? getStatusColor(row[col]) : 'text-content'
                          }`}
                          onClick={() => startEditing(originalIndex, col)}
                        >
                          {editingCell?.row === originalIndex && editingCell?.col === col ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 bg-surface border border-blue-500 rounded text-white outline-none"
                            />
                          ) : (
                            <div className="px-2 py-1 cursor-pointer hover:bg-surface-tertiary/50 rounded min-h-[28px]">
                              {row[col] !== '' && row[col] !== undefined ? (
                                String(row[col])
                              ) : (
                                <span className="text-content-muted">-</span>
                              )}
                            </div>
                          )}
                        </td>
                      ))}
                      {outcome && (
                        <td className="px-3 py-1.5 border-b border-edge/50 text-center">
                          {isExcluded ? (
                            <span className="text-amber-500 text-xs font-medium">EXCL</span>
                          ) : (
                            getStatusBadge(row[outcome])
                          )}
                        </td>
                      )}
                      <td className="px-3 py-1.5 border-b border-edge/50 text-center">
                        <button
                          onClick={() => deleteRow(originalIndex)}
                          className="text-content-muted hover:text-red-400 transition-colors p-1"
                          title="Delete row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-edge flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-xs text-content-muted">
              Click a cell to edit. Tab/Enter to navigate. Escape to cancel.
            </div>
            {needsPagination && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 text-content-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-content-secondary">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1 text-content-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-content-muted ml-2">({ROWS_PER_PAGE} rows/page)</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-content-secondary hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={applyChanges}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-bold ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-surface-tertiary text-content-muted cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTableModal;
