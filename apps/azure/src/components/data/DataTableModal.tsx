import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Table, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DataTableBase } from '@variscout/ui';
import type { ExclusionReason } from '@variscout/core';

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

  const [localData, setLocalData] = useState<Record<string, any>[]>([]);
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

  const handleCellChange = (rowIndex: number, col: string, value: any) => {
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
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setLocalData(prev => [...prev, newRow]);
    setHasChanges(true);
  };

  const applyChanges = () => {
    setRawData(localData);
    setHasChanges(false);
    onClose();
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
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <Filter size={16} />
                {filterExcluded ? 'Show All' : `Show Excluded (${excludedRowIndices.size})`}
              </button>
            )}
            <button
              onClick={handleAddRow}
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

        {/* Table content */}
        <DataTableBase
          data={localData}
          columns={columns}
          outcome={outcome}
          specs={specs}
          columnAliases={columnAliases}
          onCellChange={handleCellChange}
          onDeleteRow={handleDeleteRow}
          excludedRowIndices={excludedRowIndices}
          excludedReasons={excludedReasons}
          controlViolations={controlViolations}
          filterExcluded={filterExcluded}
          highlightRowIndex={highlightRowIndex}
        />

        {/* Footer with Apply/Cancel */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
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
  );
};

export default DataTableModal;
