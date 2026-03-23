import React, { useRef, useMemo, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  GripVertical,
  Pencil,
} from 'lucide-react';
import { getSpecStatus } from '@variscout/core';
import { useResizablePanel, useDataTablePagination, useHighlightFade } from '@variscout/hooks';
import type { ExclusionReason, DataRow, SpecLimits, DataCellValue } from '@variscout/core';

// Pagination threshold
const ROWS_PER_PAGE = 100;

// Width constraints
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 350;

export interface DataPanelBaseProps {
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Close the panel */
  onClose: () => void;
  /** Row index to highlight (from chart click) */
  highlightRowIndex?: number | null;
  /** Callback when a row is clicked */
  onRowClick?: (index: number) => void;
  /** Set of excluded row indices */
  excludedRowIndices?: Set<number>;
  /** Map of exclusion reasons per row */
  excludedReasons?: Map<number, ExclusionReason[]>;
  /** Map of control violation reasons per row */
  controlViolations?: Map<number, string[]>;
  /** Callback to open the data editor (Azure only) */
  onOpenEditor?: () => void;
  /** Selected point indices for multi-point selection (PWA brushing) */
  selectedIndices?: Set<number>;
  /** Callback to toggle a point in/out of selection */
  onToggleSelection?: (index: number) => void;

  // Data props (passed in instead of reading from context)
  /** Filtered data rows */
  data: DataRow[];
  /** Raw (unfiltered) data rows */
  rawData: DataRow[];
  /** Outcome (measure) column name */
  outcome: string | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Column display aliases */
  columnAliases: Record<string, string>;
  /** Active filters (keys = factor column names) */
  filters: Record<string, (string | number)[]>;
  /** localStorage key for persisting panel width */
  storageKey: string;
}

// --- Helper functions ---

function formatExclusionReason(reasons: ExclusionReason[]): string {
  return reasons
    .map(r => {
      if (r.type === 'missing') return `Missing: ${r.column}`;
      if (r.type === 'non_numeric') return `Invalid: "${r.value}"`;
      return r.type;
    })
    .join(', ');
}

function formatControlViolations(violations: string[]): string {
  return violations.join(', ');
}

function getStatusColor(value: DataCellValue, outcome: string | null, specs: SpecLimits): string {
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
}

const DataPanelBase: React.FC<DataPanelBaseProps> = ({
  isOpen,
  onClose,
  highlightRowIndex,
  onRowClick,
  excludedRowIndices,
  excludedReasons,
  controlViolations,
  onOpenEditor,
  selectedIndices,
  onToggleSelection,
  data,
  rawData,
  outcome,
  specs,
  columnAliases,
  filters,
  storageKey,
}) => {
  // Panel width (persisted to localStorage) + drag resize
  const { width, isDragging, handleMouseDown } = useResizablePanel(
    storageKey,
    MIN_WIDTH,
    MAX_WIDTH,
    DEFAULT_WIDTH
  );

  // Highlight with fade-out
  const { highlightedRow } = useHighlightFade(highlightRowIndex);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  // Create index map from filteredData to rawData using object-reference equality.
  // filteredData rows are the same objects as rawData rows (see useDataState.ts).
  const dataWithIndices = useMemo(() => {
    const rawIndices = new Map<object, number>();
    rawData.forEach((row, idx) => {
      rawIndices.set(row, idx);
    });

    return data.map(row => {
      const originalIndex = rawIndices.get(row) ?? -1;
      return { row, originalIndex };
    });
  }, [data, rawData]);

  // Pagination
  const { currentPage, setCurrentPage, totalPages, needsPagination, pageData } =
    useDataTablePagination(dataWithIndices, ROWS_PER_PAGE);

  // Jump to the correct page when a row is highlighted from a chart click
  useEffect(() => {
    if (highlightedRow !== null) {
      const dataIndex = dataWithIndices.findIndex(d => d.originalIndex === highlightedRow);
      if (dataIndex >= 0) {
        setCurrentPage(Math.floor(dataIndex / ROWS_PER_PAGE));
      }
    }
  }, [highlightedRow, dataWithIndices, setCurrentPage]);

  // Scroll highlighted row into view
  useEffect(() => {
    if (highlightedRow !== null && highlightRowRef.current) {
      const timeout = setTimeout(() => {
        highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [highlightedRow, currentPage]);

  // Scroll to first selected row when selection changes (brushing)
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
    if (data.length === 0) return [];
    const allCols = Object.keys(data[0]);
    const prioritized: string[] = [];
    if (outcome && allCols.includes(outcome)) {
      prioritized.push(outcome);
    }
    // Add factor columns first
    const factorCols = Object.keys(filters).filter(f => allCols.includes(f));
    factorCols.forEach(f => {
      if (!prioritized.includes(f) && prioritized.length < 5) {
        prioritized.push(f);
      }
    });
    // Fill with remaining columns
    allCols.forEach(col => {
      if (!prioritized.includes(col) && prioritized.length < 5) {
        prioritized.push(col);
      }
    });
    return prioritized;
  }, [data, outcome, filters]);

  // Row helper lookups
  const isRowExcluded = (originalIndex: number): boolean => {
    return excludedRowIndices?.has(originalIndex) ?? false;
  };

  const getExclusionReasons = (originalIndex: number): ExclusionReason[] => {
    return excludedReasons?.get(originalIndex) ?? [];
  };

  const hasControlViolation = (originalIndex: number): boolean => {
    return controlViolations?.has(originalIndex) ?? false;
  };

  const getControlViolationReasons = (originalIndex: number): string[] => {
    return controlViolations?.get(originalIndex) ?? [];
  };

  const getColumnLabel = (col: string): string => {
    return columnAliases[col] || col;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Draggable divider */}
      <div
        className={`w-1 bg-edge hover:bg-blue-500 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
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
            <span className="text-sm font-semibold text-content">Data</span>
            <span className="text-xs text-content-secondary">{dataWithIndices.length} rows</span>
          </div>
          <div className="flex items-center gap-1">
            {onOpenEditor && (
              <button
                onClick={onOpenEditor}
                aria-label="Edit data"
                title="Edit Data Table"
                className="p-1 text-content-secondary hover:text-content rounded transition-colors"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close data panel"
              className="p-1 text-content-secondary hover:text-content rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
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
                            col === outcome
                              ? getStatusColor(row[col], outcome, specs)
                              : 'text-content'
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
              aria-label="Previous page"
              className="p-1 text-content-secondary hover:text-content disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-content-secondary">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
              className="p-1 text-content-secondary hover:text-content disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DataPanelBase;
