import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Table, Filter, ClipboardPaste } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DataTableBase } from '@variscout/ui';
import type { ExclusionReason, DataRow, DataCellValue } from '@variscout/core';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightRowIndex?: number;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
  controlViolations?: Map<number, string[]>;
}

const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  highlightRowIndex,
  excludedRowIndices,
  excludedReasons,
  controlViolations,
}) => {
  const { rawData, outcome, specs, columnAliases, setRawData } = useData();

  const [localData, setLocalData] = useState<DataRow[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [filterExcluded, setFilterExcluded] = useState(false);

  // Sync local data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalData(rawData.map(row => ({ ...row })));
      setHasChanges(false);
      setFilterExcluded(false);
    }
  }, [isOpen, rawData]);

  if (!isOpen) return null;

  const columns = localData.length > 0 ? Object.keys(localData[0]) : [];

  const handleCellChange = (rowIndex: number, col: string, value: DataCellValue) => {
    const newData = [...localData];
    newData[rowIndex] = { ...newData[rowIndex], [col]: value };
    setLocalData(newData);
    setHasChanges(true);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setLocalData(prev => prev.filter((_, i) => i !== rowIndex));
    setHasChanges(true);
  };

  const handleAddRow = () => {
    const newRow: DataRow = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setLocalData(prev => [...prev, newRow]);
    setHasChanges(true);
  };

  const handleBulkPaste = (startRow: number, startCol: string, grid: string[][]) => {
    const colIdx = columns.indexOf(startCol);
    if (colIdx === -1) return;

    const newData = localData.map(row => ({ ...row }));

    for (let r = 0; r < grid.length; r++) {
      const targetRow = startRow + r;
      // Auto-expand rows if paste extends beyond existing data
      while (targetRow >= newData.length) {
        const emptyRow: DataRow = {};
        columns.forEach(col => {
          emptyRow[col] = '';
        });
        newData.push(emptyRow);
      }
      for (let c = 0; c < grid[r].length; c++) {
        const targetCol = colIdx + c;
        if (targetCol >= columns.length) break; // Cap at existing columns
        const cellText = grid[r][c];
        const numValue = parseFloat(cellText);
        newData[targetRow][columns[targetCol]] =
          !isNaN(numValue) && cellText.trim() !== '' ? numValue : cellText;
      }
    }

    setLocalData(newData);
    setHasChanges(true);
  };

  const handleHeaderPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split(/\r?\n/);
      if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      const grid = lines.map(line => line.split('\t'));
      if (grid.length > 0 && grid[0].length > 0 && columns.length > 0) {
        handleBulkPaste(0, columns[0], grid);
      }
    } catch {
      // Clipboard API not available or permission denied — ignore
    }
  };

  const applyChanges = () => {
    setRawData(localData);
    setHasChanges(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-secondary border border-edge rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-edge">
          <div className="flex items-center gap-3">
            <Table size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold text-content">Data Table</h2>
            <span className="text-sm text-content-secondary">
              {filterExcluded && excludedRowIndices
                ? `${excludedRowIndices.size} excluded rows`
                : `${localData.length} rows`}
              {hasChanges && <span className="text-amber-400 ml-2">(unsaved changes)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {excludedRowIndices && excludedRowIndices.size > 0 && (
              <button
                onClick={() => setFilterExcluded(!filterExcluded)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterExcluded
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-surface-tertiary hover:bg-surface-tertiary/80 text-content'
                }`}
              >
                <Filter size={16} />
                {filterExcluded ? 'Show All' : `Show Excluded (${excludedRowIndices.size})`}
              </button>
            )}
            <button
              onClick={handleHeaderPaste}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-surface-tertiary hover:bg-surface-tertiary/80 text-content rounded-lg transition-colors"
              title="Paste tab-delimited data from clipboard"
            >
              <ClipboardPaste size={16} />
              Paste
            </button>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-surface-tertiary hover:bg-surface-tertiary/80 text-content rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Row
            </button>
            <button
              onClick={onClose}
              className="text-content-secondary hover:text-content transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Table content */}
        <DataTableBase
          data={localData}
          columns={columns}
          outcome={outcome}
          specs={specs}
          columnAliases={columnAliases}
          onCellChange={handleCellChange}
          onDeleteRow={handleDeleteRow}
          onBulkPaste={handleBulkPaste}
          excludedRowIndices={excludedRowIndices}
          excludedReasons={excludedReasons}
          controlViolations={controlViolations}
          filterExcluded={filterExcluded}
          highlightRowIndex={highlightRowIndex}
        />

        {/* Footer with Apply/Cancel */}
        <div className="p-6 border-t border-edge flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors font-medium"
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
  );
};

export default DataTableModal;
