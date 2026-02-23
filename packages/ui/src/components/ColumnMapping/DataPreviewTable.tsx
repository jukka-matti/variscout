/**
 * DataPreviewTable — Collapsible mini table showing first few rows of data
 * with color-coded column headers matching type badges.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Table } from 'lucide-react';
import type { ColumnAnalysis } from '@variscout/core';
import type { DataRow } from '@variscout/core';

export interface DataPreviewTableProps {
  rows: DataRow[];
  columnAnalysis: ColumnAnalysis[];
  totalRows?: number;
}

const HEADER_COLORS: Record<ColumnAnalysis['type'], string> = {
  numeric: 'text-blue-400',
  categorical: 'text-emerald-400',
  date: 'text-amber-400',
  text: 'text-slate-400',
};

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  rows,
  columnAnalysis,
  totalRows,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0 || columnAnalysis.length === 0) return null;

  const columns = columnAnalysis.map(c => c.name);
  const typeMap = new Map(columnAnalysis.map(c => [c.name, c.type]));
  const displayRows = rows.slice(0, 5);
  const rowCount = totalRows ?? rows.length;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
        type="button"
        data-testid="preview-toggle"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-600/20 text-slate-400">
          <Table size={14} />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
          Preview Data
        </h3>
        <span className="text-xs text-slate-500 ml-auto mr-2">
          {rowCount.toLocaleString()} rows &middot; {columns.length} columns
        </span>
        {expanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {expanded && (
        <div
          className="mt-3 rounded-lg bg-slate-800/50 border border-slate-700 overflow-x-auto"
          data-testid="preview-table"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-2 py-1.5 text-left text-slate-600 font-normal w-8">#</th>
                {columns.map(col => (
                  <th
                    key={col}
                    className={`px-2 py-1.5 text-left font-medium ${HEADER_COLORS[typeMap.get(col) || 'text']}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr
                  key={i}
                  className={i < displayRows.length - 1 ? 'border-b border-slate-800' : ''}
                >
                  <td className="px-2 py-1 text-slate-600">{i + 1}</td>
                  {columns.map(col => (
                    <td
                      key={col}
                      className="px-2 py-1 text-slate-400 font-mono truncate max-w-[120px]"
                    >
                      {row[col] != null ? (
                        String(row[col])
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataPreviewTable;
