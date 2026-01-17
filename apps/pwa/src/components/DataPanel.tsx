import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle, GripVertical } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getSpecStatus } from '../lib/export';
import type { ExclusionReason } from '../logic/parser';

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
}

const DataPanel: React.FC<DataPanelProps> = ({
  isOpen,
  onClose,
  highlightRowIndex,
  onRowClick,
  excludedRowIndices,
  excludedReasons,
}) => {
  const { filteredData, rawData, outcome, specs, columnAliases, filters } = useData();

  // Panel width state (persisted to localStorage)
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.min(Math.max(parseInt(saved, 10), MIN_WIDTH), MAX_WIDTH) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Highlighted row with fade-out
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  // Create index map from filteredData to rawData
  const dataWithIndices = useMemo(() => {
    // Create a map of row content to indices for matching
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

  const totalPages = Math.ceil(dataWithIndices.length / ROWS_PER_PAGE);
  const needsPagination = dataWithIndices.length > ROWS_PER_PAGE;

  // Get current page data
  const pageData = useMemo(() => {
    const start = currentPage * ROWS_PER_PAGE;
    return dataWithIndices.slice(start, start + ROWS_PER_PAGE);
  }, [dataWithIndices, currentPage]);

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, width.toString());
  }, [width]);

  // Handle highlight changes from chart
  useEffect(() => {
    if (highlightRowIndex !== null && highlightRowIndex !== undefined) {
      // Find the row in the filtered/paginated data
      const dataIndex = dataWithIndices.findIndex(d => d.originalIndex === highlightRowIndex);
      if (dataIndex >= 0) {
        const targetPage = Math.floor(dataIndex / ROWS_PER_PAGE);
        setCurrentPage(targetPage);
        setHighlightedRow(highlightRowIndex);

        // Fade out after a delay
        const timeout = setTimeout(() => setHighlightedRow(null), 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [highlightRowIndex, dataWithIndices]);

  // Scroll to highlighted row
  useEffect(() => {
    if (highlightedRow !== null && highlightRowRef.current) {
      const timeout = setTimeout(() => {
        highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [highlightedRow, currentPage]);

  // Drag handlers for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Get columns (limited selection for panel view)
  const columns = useMemo(() => {
    if (filteredData.length === 0) return [];
    const allCols = Object.keys(filteredData[0]);
    // Prioritize outcome column, then up to 4 other columns
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
                  const isExcluded = isRowExcluded(originalIndex);
                  const exclusionReasons = getExclusionReasons(originalIndex);

                  return (
                    <tr
                      key={`${originalIndex}-${pageRowIdx}`}
                      ref={isHighlighted ? highlightRowRef : undefined}
                      onClick={() => onRowClick?.(originalIndex)}
                      className={`cursor-pointer transition-colors duration-1000 ${
                        isHighlighted
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
