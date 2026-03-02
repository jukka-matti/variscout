import React, { useRef, useMemo, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getSpecStatus } from '@variscout/core';
import { useDataTablePagination, useHighlightFade, useResizablePanel } from '@variscout/hooks';
import type { ExclusionReason, DataCellValue } from '@variscout/core';

// Pagination threshold
const ROWS_PER_PAGE = 100;

// Width constraints
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 350;
const STORAGE_KEY = 'variscout-data-panel-width';

interface DataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number | null;
  onRowClick?: (index: number) => void;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
  controlViolations?: Map<number, string[]>;
  /** Selected point indices for multi-point selection (Phase 3: Brushing) */
  selectedIndices?: Set<number>;
  /** Callback to toggle a point in/out of selection */
  onToggleSelection?: (index: number) => void;
}

const DataPanel: React.FC<DataPanelProps> = ({
  isOpen,
  onClose,
  highlightRowIndex,
  onRowClick,
  excludedRowIndices,
  excludedReasons,
  controlViolations,
  selectedIndices,
  onToggleSelection,
}) => {
  const { filteredData, rawData, outcome, specs, columnAliases, filters } = useData();

  // Panel width (persisted to localStorage) + drag resize
  const { width, isDragging, handleMouseDown } = useResizablePanel(
    STORAGE_KEY,
    MIN_WIDTH,
    MAX_WIDTH,
    DEFAULT_WIDTH
  );

  // Create index map from filteredData to rawData
  const dataWithIndices = useMemo(() => {
    const rawIndices = new Map<string, number>();
    rawData.forEach((row, idx) => {
      const key = JSON.stringify(row);
      if (!rawIndices.has(key)) {
        rawIndices.set(key, idx);
      }
    });

    return filteredData.map(row => {
      const key = JSON.stringify(row);
      const originalIndex = rawIndices.get(key) ?? -1;
      return { row, originalIndex };
    });
  }, [filteredData, rawData]);

  // Pagination
  const { currentPage, setCurrentPage, totalPages, needsPagination, pageData } =
    useDataTablePagination(dataWithIndices, ROWS_PER_PAGE);

  // Highlight with fade-out (manages state + timeout)
  const { highlightedRow, setHighlightedRow } = useHighlightFade(undefined);

  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  // Handle highlight changes from chart (also navigates page)
  useEffect(() => {
    if (highlightRowIndex !== null && highlightRowIndex !== undefined) {
      const dataIndex = dataWithIndices.findIndex(d => d.originalIndex === highlightRowIndex);
      if (dataIndex >= 0) {
        const targetPage = Math.floor(dataIndex / ROWS_PER_PAGE);
        setCurrentPage(targetPage);
        setHighlightedRow(highlightRowIndex);

        const timeout = setTimeout(() => setHighlightedRow(null), 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [highlightRowIndex, dataWithIndices, setCurrentPage, setHighlightedRow]);

  // Scroll to highlighted row
  useEffect(() => {
    if (highlightedRow !== null && highlightRowRef.current) {
      const timeout = setTimeout(() => {
        highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [highlightedRow, currentPage]);

  // Scroll to first selected row when selection changes (Phase 3: Brushing)
  useEffect(() => {
    if (selectedIndices && selectedIndices.size > 0) {
      const firstSelectedOriginalIndex = Array.from(selectedIndices).sort((a, b) => a - b)[0];
      const dataIndex = dataWithIndices.findIndex(
        d => d.originalIndex === firstSelectedOriginalIndex
      );

      if (dataIndex >= 0) {
        const targetPage = Math.floor(dataIndex / ROWS_PER_PAGE);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }
    }
  }, [selectedIndices, dataWithIndices, currentPage, setCurrentPage]);

  // Get columns (limited selection for panel view)
  const columns = useMemo(() => {
    if (filteredData.length === 0) return [];
    const allCols = Object.keys(filteredData[0]);
    const prioritized: string[] = [];
    if (outcome && allCols.includes(outcome)) {
      prioritized.push(outcome);
    }
    const factorCols = Object.keys(filters).filter(f => allCols.includes(f));
    factorCols.forEach(f => {
      if (!prioritized.includes(f) && prioritized.length < 5) {
        prioritized.push(f);
      }
    });
    allCols.forEach(col => {
      if (!prioritized.includes(col) && prioritized.length < 5) {
        prioritized.push(col);
      }
    });
    return prioritized;
  }, [filteredData, outcome, filters]);

  // Helper functions
  const isRowExcluded = (originalIndex: number): boolean => {
    return excludedRowIndices?.has(originalIndex) ?? false;
  };

  const getExclusionReasons = (originalIndex: number): ExclusionReason[] => {
    return excludedReasons?.get(originalIndex) ?? [];
  };

  const formatExclusionReason = (reasons: ExclusionReason[]): string => {
    return reasons
      .map(r => {
        if (r.type === 'missing') return `Missing: ${r.column}`;
        if (r.type === 'non_numeric') return `Invalid: "${r.value}"`;
        return r.type;
      })
      .join(', ');
  };

  const hasControlViolation = (originalIndex: number): boolean => {
    return controlViolations?.has(originalIndex) ?? false;
  };

  const getControlViolationReasons = (originalIndex: number): string[] => {
    return controlViolations?.get(originalIndex) ?? [];
  };

  const formatControlViolations = (violations: string[]): string => {
    return violations.join(', ');
  };

  const getStatusColor = (value: DataCellValue): string => {
    if (!outcome) return 'text-content-secondary';
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
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

  const getColumnLabel = (col: string): string => {
    return columnAliases[col] || col;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Draggable divider */}
      <div
        className={`w-1 bg-surface-tertiary hover:bg-blue-500 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical size={12} className="text-content-muted" />
      </div>

      {/* Panel */}
      <div
        className="flex-shrink-0 bg-surface-secondary border-l border-edge flex flex-col overflow-hidden"
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-edge bg-surface-secondary/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Data</span>
            <span className="text-xs text-content-muted">{dataWithIndices.length} rows</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-content-secondary hover:text-white rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {dataWithIndices.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-content-muted text-sm italic">
              No data to display
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-surface-secondary z-10">
                <tr>
                  <th className="px-2 py-1.5 text-left text-content-muted font-medium border-b border-edge w-8">
                    #
                  </th>
                  {columns.map(col => (
                    <th
                      key={col}
                      className={`px-2 py-1.5 text-left font-medium border-b border-edge truncate max-w-[80px] ${
                        col === outcome ? 'text-blue-400' : 'text-content-secondary'
                      }`}
                      title={getColumnLabel(col)}
                    >
                      {getColumnLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((item, pageRowIdx) => {
                  const { row, originalIndex } = item;
                  const isHighlighted = originalIndex === highlightedRow;
                  const isSelected = selectedIndices?.has(originalIndex) ?? false;
                  const isExcluded = isRowExcluded(originalIndex);
                  const exclusionReasons = getExclusionReasons(originalIndex);
                  const hasViolation = hasControlViolation(originalIndex);
                  const violationReasons = getControlViolationReasons(originalIndex);

                  const handleRowClick = () => {
                    if (onToggleSelection) {
                      onToggleSelection(originalIndex);
                    } else {
                      onRowClick?.(originalIndex);
                    }
                  };

                  return (
                    <tr
                      key={`${originalIndex}-${pageRowIdx}`}
                      ref={isHighlighted ? highlightRowRef : undefined}
                      onClick={handleRowClick}
                      className={`cursor-pointer transition-colors duration-1000 ${
                        isSelected
                          ? 'bg-blue-500/20 hover:bg-blue-500/30'
                          : isHighlighted
                            ? 'bg-blue-500/30'
                            : isExcluded
                              ? 'bg-amber-500/10 hover:bg-amber-500/20'
                              : 'hover:bg-surface-tertiary/50'
                      }`}
                    >
                      <td className="px-2 py-1 text-content-muted border-b border-edge/50 font-mono">
                        <span className="flex items-center gap-1">
                          {originalIndex + 1}
                          {isExcluded && (
                            <span
                              className="text-amber-500"
                              title={formatExclusionReason(exclusionReasons)}
                            >
                              <AlertTriangle size={10} />
                            </span>
                          )}
                          {hasViolation && (
                            <span
                              className="text-red-500"
                              title={formatControlViolations(violationReasons)}
                            >
                              <AlertCircle size={10} />
                            </span>
                          )}
                        </span>
                      </td>
                      {columns.map(col => (
                        <td
                          key={col}
                          className={`px-2 py-1 border-b border-edge/50 truncate max-w-[80px] ${
                            col === outcome ? getStatusColor(row[col]) : 'text-content'
                          }`}
                          title={String(row[col] ?? '')}
                        >
                          {row[col] !== '' && row[col] !== undefined ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {needsPagination && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-edge bg-surface-secondary/80">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 text-content-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-content-muted">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-1 text-content-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DataPanel;
