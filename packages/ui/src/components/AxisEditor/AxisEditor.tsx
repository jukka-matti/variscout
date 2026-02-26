import React, { useState } from 'react';
import { Type, Edit2, Check, X, RotateCcw } from 'lucide-react';

/**
 * Color scheme for AxisEditor component
 */
export interface AxisEditorColorScheme {
  /** Container background */
  container: string;
  /** Container border */
  containerBorder: string;
  /** Header border */
  headerBorder: string;
  /** Close button text */
  closeButton: string;
  /** Label text */
  label: string;
  /** Muted text */
  muted: string;
  /** Input classes */
  input: string;
  /** Section border */
  sectionBorder: string;
  /** Arrow separator */
  arrow: string;
  /** Reset button */
  resetButton: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const defaultColorScheme: AxisEditorColorScheme = {
  container: 'bg-surface-secondary border-edge-secondary',
  containerBorder: '',
  headerBorder: 'border-edge',
  closeButton: 'text-content-secondary hover:text-white',
  label: 'text-content-secondary',
  muted: 'text-content-muted',
  input: 'bg-surface border-edge',
  sectionBorder: 'border-edge',
  arrow: 'text-content-muted',
  resetButton: 'bg-surface-tertiary hover:bg-surface-elevated',
};

export interface AxisEditorProps {
  title: string;
  originalName: string;
  alias: string;
  /** For categorical axes (like boxplot X-axis) */
  values?: string[];
  valueLabels?: Record<string, string>;
  onSave: (alias: string, valueLabels?: Record<string, string>) => void;
  onClose: () => void;
  style?: React.CSSProperties;
  /** Color scheme for styling (defaults to PWA semantic tokens) */
  colorScheme?: AxisEditorColorScheme;
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
  colorScheme = defaultColorScheme,
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
    const finalAlias = newAlias.trim() === originalName ? '' : newAlias.trim();

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
      className={`absolute z-50 ${colorScheme.container} rounded-lg shadow-xl p-3 flex flex-col gap-3 w-64`}
      style={style}
    >
      <div
        className={`flex justify-between items-center border-b ${colorScheme.headerBorder} pb-2`}
      >
        <span className="text-xs font-bold text-white flex items-center gap-1">
          <Edit2 size={12} /> {title}
        </span>
        <button
          onClick={onClose}
          className={colorScheme.closeButton}
          aria-label="Close axis editor"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {/* Main Axis Name */}
        <div>
          <label
            htmlFor="axis-display-name"
            className={`text-[10px] ${colorScheme.label} uppercase block mb-1`}
          >
            Display Name
          </label>
          <div className="relative">
            <Type size={12} className={`absolute left-2 top-2 ${colorScheme.muted}`} />
            <input
              id="axis-display-name"
              name="axis-display-name"
              type="text"
              value={newAlias}
              onChange={e => setNewAlias(e.target.value)}
              placeholder={originalName}
              className={`w-full ${colorScheme.input} rounded pl-7 pr-2 py-1 text-xs text-white outline-none focus:border-blue-500`}
              aria-label="Axis display name"
            />
          </div>
          {originalName !== newAlias && (
            <div className={`text-[10px] ${colorScheme.muted} mt-1 pl-1`}>
              Original: {originalName}
            </div>
          )}
        </div>

        {/* Category Value Labels (if provided) */}
        {values.length > 0 && (
          <div className={`border-t ${colorScheme.sectionBorder} pt-2`}>
            <label className={`text-[10px] ${colorScheme.label} uppercase block mb-1`}>
              Category Labels
            </label>
            <div className="space-y-1">
              {values.map(val => (
                <div key={val} className="flex items-center gap-2">
                  <span className={`text-[10px] ${colorScheme.muted} w-1/3 truncate`} title={val}>
                    {val}
                  </span>
                  <span className={colorScheme.arrow}>&rarr;</span>
                  <input
                    id={`axis-label-${val}`}
                    name={`axis-label-${val}`}
                    type="text"
                    value={localValueLabels[val] !== undefined ? localValueLabels[val] : val}
                    onChange={e => handleValueChange(val, e.target.value)}
                    className={`flex-1 ${colorScheme.input} rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500`}
                    aria-label={`Label for ${val}`}
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
          className={`flex-1 ${colorScheme.resetButton} text-white text-xs py-1 rounded flex justify-center items-center gap-1`}
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
