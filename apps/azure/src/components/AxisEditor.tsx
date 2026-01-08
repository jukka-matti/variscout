import React, { useState } from 'react';
import { Type, Edit2, Check, X, RotateCcw } from 'lucide-react';

interface AxisEditorProps {
  title: string;
  originalName: string;
  alias: string;
  // For categorical axes (like boxplot X-axis)
  values?: string[];
  valueLabels?: Record<string, string>;
  onSave: (alias: string, valueLabels?: Record<string, string>) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

const AxisEditor = ({
  title,
  originalName,
  alias,
  values = [],
  valueLabels = {},
  onSave,
  onClose,
  style,
}: AxisEditorProps) => {
  const [newAlias, setNewAlias] = useState(alias || originalName);
  const [localValueLabels, setLocalValueLabels] = useState<Record<string, string>>({
    ...valueLabels,
  });

  const handleValueChange = (original: string, newLabel: string) => {
    setLocalValueLabels(prev => ({
      ...prev,
      [original]: newLabel,
    }));
  };

  const handleSave = () => {
    // If alias matches original, clear it to keep data clean
    const finalAlias = newAlias.trim() === originalName ? '' : newAlias.trim();

    // Clean up value labels (remove identical ones)
    const finalValueLabels: Record<string, string> = {};
    Object.entries(localValueLabels).forEach(([key, val]) => {
      if (val && val.trim() !== key) {
        finalValueLabels[key] = val.trim();
      }
    });

    onSave(finalAlias, finalValueLabels);
    onClose();
  };

  const handleReset = () => {
    setNewAlias(originalName);
    setLocalValueLabels({});
  };

  return (
    <div
      className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 flex flex-col gap-3 w-64"
      style={style}
    >
      <div className="flex justify-between items-center border-b border-slate-700 pb-2">
        <span className="text-xs font-bold text-white flex items-center gap-1">
          <Edit2 size={12} /> {title}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {/* Main Axis Name */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1">Display Name</label>
          <div className="relative">
            <Type size={12} className="absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              value={newAlias}
              onChange={e => setNewAlias(e.target.value)}
              placeholder={originalName}
              className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>
          {originalName !== newAlias && (
            <div className="text-[10px] text-slate-500 mt-1 pl-1">Original: {originalName}</div>
          )}
        </div>

        {/* Category Value Labels (if provided) */}
        {values.length > 0 && (
          <div className="border-t border-slate-700 pt-2">
            <label className="text-[10px] text-slate-400 uppercase block mb-1">
              Category Labels
            </label>
            <div className="space-y-1">
              {values.map(val => (
                <div key={val} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-1/3 truncate" title={val}>
                    {val}
                  </span>
                  <span className="text-slate-600">→</span>
                  <input
                    type="text"
                    value={localValueLabels[val] !== undefined ? localValueLabels[val] : val}
                    onChange={e => handleValueChange(val, e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleReset}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 rounded flex justify-center items-center gap-1"
          title="Reset to Original"
        >
          <RotateCcw size={10} /> Reset
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded flex justify-center items-center gap-1"
        >
          <Check size={10} /> Save
        </button>
      </div>
    </div>
  );
};

export default AxisEditor;
