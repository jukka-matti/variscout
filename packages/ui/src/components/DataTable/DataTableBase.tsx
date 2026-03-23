import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2, ChevronLeft, ChevronRight, AlertTriangle, AlertCircle } from 'lucide-react';
import { getSpecStatus } from '@variscout/core';
import type { DataCellValue, ExclusionReason, SpecLimits } from '@variscout/core';
import { useDataTablePagination, useHighlightFade, useTranslation } from '@variscout/hooks';

const DEFAULT_ROWS_PER_PAGE = 500;

export interface DataTableBaseProps {
  data: Record<string, DataCellValue>[];
  columns: string[];
  outcome: string | null;
  specs: Pick<SpecLimits, 'usl' | 'lsl'>;
  columnAliases?: Record<string, string>;
  onCellChange: (rowIndex: number, col: string, value: DataCellValue) => void;
  onDeleteRow: (rowIndex: number) => void;
  onAddRow?: () => void;
  onBulkPaste?: (startRow: number, startCol: string, grid: string[][]) => void;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
  controlViolations?: Map<number, string[]>;
  filterExcluded?: boolean;
  highlightRowIndex?: number;
  rowsPerPage?: number;
}

const DataTableBase: React.FC<DataTableBaseProps> = ({
  data,
  columns,
  outcome,
  specs,
  columnAliases,
  onCellChange,
  onDeleteRow,
  onAddRow: _onAddRow,
  onBulkPaste,
  excludedRowIndices,
  excludedReasons,
  controlViolations,
  filterExcluded = false,
  highlightRowIndex,
  rowsPerPage = DEFAULT_ROWS_PER_PAGE,
}) => {
  const { t, tf } = useTranslation();

  // Editing state
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Post-paste navigation target (row index to navigate to after data updates)
  const [pasteTarget, setPasteTarget] = useState<number | null>(null);

  // Apply filter to get display data with original indices
  const displayData = useMemo(() => {
    if (!filterExcluded || !excludedRowIndices) {
      return data.map((row, i) => ({ row, originalIndex: i }));
    }
    return data
      .map((row, i) => ({ row, originalIndex: i }))
      .filter(item => excludedRowIndices.has(item.originalIndex));
  }, [data, filterExcluded, excludedRowIndices]);

  // Pagination
  const { currentPage, setCurrentPage, totalPages, needsPagination, pageData } =
    useDataTablePagination(displayData, rowsPerPage);

  // Highlight fade
  const { highlightedRow, setHighlightedRow } = useHighlightFade(undefined);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  // Navigate to highlighted row when it changes
  useEffect(() => {
    if (
      highlightRowIndex !== undefined &&
      highlightRowIndex >= 0 &&
      highlightRowIndex < data.length
    ) {
      const targetPage = Math.floor(highlightRowIndex / rowsPerPage);

      setCurrentPage(targetPage);

      setHighlightedRow(highlightRowIndex);
    }
  }, [highlightRowIndex, data.length, rowsPerPage, setCurrentPage, setHighlightedRow]);

  // Scroll to highlighted row
  useEffect(() => {
    if (highlightedRow !== null && highlightRowRef.current) {
      const scrollTimeout = setTimeout(() => {
        highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      const fadeTimeout = setTimeout(() => {
        setHighlightedRow(null);
      }, 3000);

      return () => {
        clearTimeout(scrollTimeout);
        clearTimeout(fadeTimeout);
      };
    }
  }, [highlightedRow, setHighlightedRow]);

  // Navigate to paste target page after data expands
  useEffect(() => {
    if (pasteTarget !== null && pasteTarget < data.length) {
      const targetPage = Math.floor(pasteTarget / rowsPerPage);

      setCurrentPage(targetPage);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing one-shot paste target after navigation
      setPasteTarget(null);
    }
  }, [pasteTarget, data.length, rowsPerPage, setCurrentPage]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Column label helper
  const getColumnLabel = (col: string): string => columnAliases?.[col] || col;

  // Exclusion helpers
  const isRowExcluded = (originalIndex: number): boolean =>
    excludedRowIndices?.has(originalIndex) ?? false;

  const getExclusionReasons = (originalIndex: number): ExclusionReason[] =>
    excludedReasons?.get(originalIndex) ?? [];

  const formatExclusionReason = (reasons: ExclusionReason[]): string =>
    reasons
      .map(r => {
        if (r.type === 'missing') return `Missing value in ${r.column}`;
        if (r.type === 'non_numeric') return `Non-numeric: "${r.value}"`;
        return r.type;
      })
      .join(', ');

  // Control violation helpers
  const hasControlViolation = (originalIndex: number): boolean =>
    controlViolations?.has(originalIndex) ?? false;

  const formatControlViolations = (violations: string[]): string => violations.join(', ');

  // Spec status helpers
  const getStatusColor = (value: DataCellValue): string => {
    if (!outcome) return 'text-content-secondary';
    const numValue = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
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

  const getStatusBadge = (value: DataCellValue) => {
    if (!outcome) return null;
    const numValue = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
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

  // Editing logic
  const startEditing = (rowIdx: number, col: string) => {
    if (rowIdx >= data.length || !data[rowIdx]) return;
    setEditingCell({ row: rowIdx, col });
    setEditValue(String(data[rowIdx][col] ?? ''));
  };

  const saveEdit = () => {
    if (editingCell) {
      const numValue = parseFloat(editValue);
      const finalValue = !isNaN(numValue) && editValue.trim() !== '' ? numValue : editValue;
      onCellChange(editingCell.row, editingCell.col, finalValue);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    const { row, col } = editingCell;
    const colIdx = columns.indexOf(col);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      saveEdit();
      if (row < data.length - 1) {
        setTimeout(() => startEditing(row + 1, col), 0);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      saveEdit();
      if (row > 0) {
        setTimeout(() => startEditing(row - 1, col), 0);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
      if (row < data.length - 1) {
        setTimeout(() => startEditing(row + 1, col), 0);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit();
      if (e.shiftKey) {
        if (colIdx > 0) {
          setTimeout(() => startEditing(row, columns[colIdx - 1]), 0);
        } else if (row > 0) {
          setTimeout(() => startEditing(row - 1, columns[columns.length - 1]), 0);
        }
      } else {
        if (colIdx < columns.length - 1) {
          setTimeout(() => startEditing(row, columns[colIdx + 1]), 0);
        } else if (row < data.length - 1) {
          setTimeout(() => startEditing(row + 1, columns[0]), 0);
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleCellPaste = (e: React.ClipboardEvent) => {
    if (!editingCell || !onBulkPaste) return;

    const text = e.clipboardData.getData('text/plain');
    const lines = text.split(/\r?\n/);
    // Strip trailing empty line (Excel/Sheets adds one)
    if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    const grid = lines.map(line => line.split('\t'));

    // Single-cell paste: let browser handle it
    if (grid.length === 1 && grid[0].length === 1) return;

    e.preventDefault();
    const lastRow = editingCell.row + grid.length - 1;
    onBulkPaste(editingCell.row, editingCell.col, grid);
    setEditingCell(null);
    setPasteTarget(lastRow);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-content-muted italic">
        {t('table.noData')}
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto p-4">
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
                  {getColumnLabel(col)}
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
            {pageData.map(item => {
              const { row, originalIndex } = item;
              const isHighlighted = originalIndex === highlightedRow;
              const isExcluded = isRowExcluded(originalIndex);
              const exclusionReasons = getExclusionReasons(originalIndex);
              const hasViolation = hasControlViolation(originalIndex);
              const violationReasons = controlViolations?.get(originalIndex) ?? [];
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
                      {hasViolation && (
                        <span
                          className="text-red-500"
                          title={formatControlViolations(violationReasons)}
                        >
                          <AlertCircle size={12} />
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
                          id={`datatable-${col}-${originalIndex}`}
                          name={col}
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          onPaste={handleCellPaste}
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
                      onClick={() => onDeleteRow(originalIndex)}
                      className="text-content-muted hover:text-red-400 transition-colors p-1"
                      title={t('table.deleteRow')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with help text and pagination */}
      <div className="px-6 py-3 border-t border-edge flex items-center gap-4">
        <div className="text-xs text-content-muted">{t('table.editHint')}</div>
        {needsPagination && (
          <div className="flex items-center gap-2 text-xs ml-auto">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 text-content-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-content-secondary">
              {tf('table.page', { page: currentPage + 1, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-1 text-content-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-content-muted ml-2">
              ({rowsPerPage} {t('table.rowsPerPage')})
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default DataTableBase;
