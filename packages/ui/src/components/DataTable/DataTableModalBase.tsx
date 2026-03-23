import React, { useState, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { X, Plus, Save, Table, Filter, ClipboardPaste } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';
import DataTableBase from './DataTableBase';
import type { ExclusionReason, DataRow, DataCellValue, SpecLimits } from '@variscout/core';

export interface DataTableModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: DataRow[]) => void;
  rawData: DataRow[];
  outcome: string | null;
  specs: Pick<SpecLimits, 'usl' | 'lsl'>;
  columnAliases?: Record<string, string>;
  highlightRowIndex?: number;
  initialFilterExcluded?: boolean;
  excludedRowIndices?: Set<number>;
  excludedReasons?: Map<number, ExclusionReason[]>;
  controlViolations?: Map<number, string[]>;
}

const DataTableModalBase: React.FC<DataTableModalBaseProps> = ({
  isOpen,
  onClose,
  onApply,
  rawData,
  outcome,
  specs,
  columnAliases,
  highlightRowIndex,
  initialFilterExcluded = false,
  excludedRowIndices,
  excludedReasons,
  controlViolations,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [localData, setLocalData] = useState<DataRow[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [filterExcluded, setFilterExcluded] = useState(initialFilterExcluded);

  // Sync local data when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting modal local state when it opens (controlled by parent)
      setLocalData(rawData.map(row => ({ ...row })));

      setHasChanges(false);

      setFilterExcluded(initialFilterExcluded);
    }
  }, [isOpen, rawData, initialFilterExcluded]);

  // Native <dialog> open/close management
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Listen for native close event (Escape key or dialog.close())
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

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
    onApply(localData);
    setHasChanges(false);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm max-w-none max-h-none w-full h-full m-0 p-0"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <FocusTrap
        active={isOpen}
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          fallbackFocus: '[role="dialog"]',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="flex items-center justify-center p-4 w-full h-full"
        >
          <div className="relative bg-surface-secondary border border-edge rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-edge">
              <div className="flex items-center gap-3">
                <Table size={20} className="text-blue-400" />
                <h2 className="text-xl font-bold text-content">{t('panel.dataTable')}</h2>
                <span className="text-sm text-content-secondary">
                  {filterExcluded && excludedRowIndices
                    ? `${excludedRowIndices.size} excluded rows`
                    : `${localData.length} rows`}
                  {hasChanges && (
                    <span className="text-amber-400 ml-2">({t('table.unsavedChanges')})</span>
                  )}
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
                  {t('table.addRow')}
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
                {t('action.cancel')}
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
                {t('action.apply')}
              </button>
            </div>
          </div>
        </div>
      </FocusTrap>
    </dialog>
  );
};

export default DataTableModalBase;
