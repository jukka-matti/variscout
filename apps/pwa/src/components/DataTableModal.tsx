import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Trash2, Save, Table, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getSpecStatus } from '../lib/export';

// Pagination threshold - show pagination for datasets larger than this
const ROWS_PER_PAGE = 500;

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number; // Row to scroll to and highlight (0-indexed)
}

const DataTableModal = ({ isOpen, onClose, highlightRowIndex }: DataTableModalProps) => {
  const { rawData, outcome, specs, setRawData } = useData();

  // Local copy of data for editing (don't mutate context until Apply)
  const [localData, setLocalData] = useState<Record<string, any>[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Track which cell is being edited
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(localData.length / ROWS_PER_PAGE);
  const needsPagination = localData.length > ROWS_PER_PAGE;

  // Highlight animation state
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  // Get current page data
  const pageData = useMemo(() => {
    if (!needsPagination) return localData;
    const start = currentPage * ROWS_PER_PAGE;
    return localData.slice(start, start + ROWS_PER_PAGE);
  }, [localData, currentPage, needsPagination]);

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

  // Convert page-relative index to absolute index
  const toAbsoluteIndex = (pageRowIdx: number) => {
    return needsPagination ? currentPage * ROWS_PER_PAGE + pageRowIdx : pageRowIdx;
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
    if (!outcome) return 'text-slate-400';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'text-slate-400';

    const status = getSpecStatus(numValue, specs);
    switch (status) {
      case 'PASS':
        return 'text-green-500';
      case 'FAIL_USL':
        return 'text-red-400';
      case 'FAIL_LSL':
        return 'text-amber-500';
      default:
        return 'text-slate-400';
    }
  };

  // Get status badge
  const getStatusBadge = (value: any) => {
    if (!outcome) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return <span className="text-slate-500 text-xs">-</span>;

    const status = getSpecStatus(numValue, specs);
    switch (status) {
      case 'PASS':
        return <span className="text-green-500 text-xs font-medium">PASS</span>;
      case 'FAIL_USL':
        return <span className="text-red-400 text-xs font-medium">USL</span>;
      case 'FAIL_LSL':
        return <span className="text-amber-500 text-xs font-medium">LSL</span>;
      default:
        return <span className="text-slate-500 text-xs">-</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Table size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Data Table</h2>
            <span className="text-sm text-slate-400">
              {localData.length} rows
              {hasChanges && <span className="text-amber-400 ml-2">(unsaved changes)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Row
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4">
          {localData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 italic">
              No data loaded. Import a file or add rows manually.
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-400 font-semibold border-b border-slate-700 w-12">
                    #
                  </th>
                  {columns.map(col => (
                    <th
                      key={col}
                      className={`px-3 py-2 text-left font-semibold border-b border-slate-700 ${
                        col === outcome ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {col}
                      {col === outcome && <span className="text-xs ml-1">(Y)</span>}
                    </th>
                  ))}
                  {outcome && (
                    <th className="px-3 py-2 text-left text-slate-400 font-semibold border-b border-slate-700 w-16">
                      Status
                    </th>
                  )}
                  <th className="px-3 py-2 text-center text-slate-400 font-semibold border-b border-slate-700 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, pageRowIdx) => {
                  const absoluteIdx = toAbsoluteIndex(pageRowIdx);
                  const isHighlighted = absoluteIdx === highlightedRow;
                  return (
                    <tr
                      key={absoluteIdx}
                      ref={isHighlighted ? highlightRowRef : undefined}
                      className={`hover:bg-slate-700/30 transition-colors duration-1000 ${
                        isHighlighted ? 'bg-blue-500/30 animate-pulse' : ''
                      }`}
                    >
                      <td className="px-3 py-1.5 text-slate-500 border-b border-slate-700/50 font-mono text-xs">
                        {absoluteIdx + 1}
                      </td>
                      {columns.map(col => (
                        <td
                          key={col}
                          className={`px-1 py-0.5 border-b border-slate-700/50 ${
                            col === outcome ? getStatusColor(row[col]) : 'text-slate-300'
                          }`}
                          onClick={() => startEditing(absoluteIdx, col)}
                        >
                          {editingCell?.row === absoluteIdx && editingCell?.col === col ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 bg-slate-900 border border-blue-500 rounded text-white outline-none"
                            />
                          ) : (
                            <div className="px-2 py-1 cursor-pointer hover:bg-slate-700/50 rounded min-h-[28px]">
                              {row[col] !== '' && row[col] !== undefined ? (
                                String(row[col])
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </div>
                          )}
                        </td>
                      ))}
                      {outcome && (
                        <td className="px-3 py-1.5 border-b border-slate-700/50 text-center">
                          {getStatusBadge(row[outcome])}
                        </td>
                      )}
                      <td className="px-3 py-1.5 border-b border-slate-700/50 text-center">
                        <button
                          onClick={() => deleteRow(absoluteIdx)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
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
        <div className="p-6 border-t border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500">
              Click a cell to edit. Tab/Enter to navigate. Escape to cancel.
            </div>
            {needsPagination && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-slate-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-slate-500 ml-2">({ROWS_PER_PAGE} rows/page)</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={applyChanges}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-bold ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
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
