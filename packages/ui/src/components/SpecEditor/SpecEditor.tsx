import React, { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { gradeColors } from '../../colors';
import { useIsMobile } from '../../hooks';
import type { SpecEditorColorScheme, SpecEditorProps } from './types';

const MOBILE_BREAKPOINT = 640;

export const specEditorDefaultColorScheme: SpecEditorColorScheme = {
  label: 'block text-[10px] sm:text-xs text-content-secondary mb-1',
  input:
    'w-full bg-surface border border-edge rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500',
  addButton:
    'text-xs bg-surface-tertiary hover:bg-surface-elevated text-white px-3 py-1.5 sm:px-2 sm:py-0.5 rounded flex items-center gap-1 transition-colors touch-feedback',
  removeButton: 'p-2 sm:p-0 text-content-muted hover:text-red-400 transition-colors touch-feedback',
  gradesEmpty:
    'text-center p-4 border border-dashed border-edge rounded text-content-muted text-xs italic',
  gradesHeader: 'hidden sm:flex gap-2 text-[10px] text-content-muted px-1',
  mobileSheet:
    'fixed inset-x-0 bottom-0 z-50 bg-surface-secondary border-t border-edge-secondary rounded-t-2xl shadow-2xl animate-slide-up',
  mobileDragHandle: 'w-10 h-1 bg-surface-elevated rounded-full',
  mobileHeaderBorder: 'flex justify-between items-center border-b border-edge px-4 pb-3',
  mobileCloseButton: 'p-2 text-content-secondary hover:text-white touch-feedback rounded-lg',
  desktopContainer:
    'absolute z-50 bg-surface-secondary border border-edge-secondary rounded-lg shadow-2xl p-4 flex flex-col gap-4 w-80',
  desktopHeaderBorder: 'flex justify-between items-center border-b border-edge pb-3',
  desktopCloseButton: 'text-content-secondary hover:text-white',
};

export const specEditorAzureColorScheme: SpecEditorColorScheme = {
  label: 'block text-[10px] sm:text-xs text-slate-400 mb-1',
  input:
    'w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500',
  addButton:
    'text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 sm:px-2 sm:py-0.5 rounded flex items-center gap-1 transition-colors touch-feedback',
  removeButton: 'p-2 sm:p-0 text-slate-500 hover:text-red-400 transition-colors touch-feedback',
  gradesEmpty:
    'text-center p-4 border border-dashed border-slate-700 rounded text-slate-600 text-xs italic',
  gradesHeader: 'hidden sm:flex gap-2 text-[10px] text-slate-500 px-1',
  mobileSheet:
    'fixed inset-x-0 bottom-0 z-50 bg-slate-800 border-t border-slate-600 rounded-t-2xl shadow-2xl animate-slide-up',
  mobileDragHandle: 'w-10 h-1 bg-slate-600 rounded-full',
  mobileHeaderBorder: 'flex justify-between items-center border-b border-slate-700 px-4 pb-3',
  mobileCloseButton: 'p-2 text-slate-400 hover:text-white touch-feedback rounded-lg',
  desktopContainer:
    'absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 flex flex-col gap-4 w-80',
  desktopHeaderBorder: 'flex justify-between items-center border-b border-slate-700 pb-3',
  desktopCloseButton: 'text-slate-400 hover:text-white',
};

const SpecEditor = ({
  specs,
  grades,
  onSave,
  onClose,
  style,
  colorScheme = specEditorDefaultColorScheme,
}: SpecEditorProps) => {
  const cs = colorScheme;
  const [localSpecs, setLocalSpecs] = useState<{ usl: string; lsl: string; target: string }>({
    usl: specs.usl?.toString() || '',
    lsl: specs.lsl?.toString() || '',
    target: specs.target?.toString() || '',
  });
  const [localGrades, setLocalGrades] = useState(grades || []);
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  const handleSave = () => {
    const parsedSpecs = {
      usl: localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
      lsl: localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
      target: localSpecs.target ? parseFloat(localSpecs.target) : undefined,
    };
    const sortedGrades = [...localGrades].sort((a, b) => a.max - b.max);
    onSave(parsedSpecs, sortedGrades);
    onClose();
  };

  const addGrade = () => {
    setLocalGrades([...localGrades, { max: 0, label: 'New Grade', color: gradeColors.default }]);
  };

  const updateGrade = (index: number, field: keyof (typeof localGrades)[0], value: any) => {
    const newGrades = [...localGrades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setLocalGrades(newGrades);
  };

  const removeGrade = (index: number) => {
    setLocalGrades(localGrades.filter((_, i) => i !== index));
  };

  const formContent = (
    <>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar scroll-touch">
        {/* Standard Limits */}
        <div>
          <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            Limits
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={cs.label}>LSL (Min)</label>
              <input
                type="number"
                step="any"
                value={localSpecs.lsl}
                onChange={e => setLocalSpecs({ ...localSpecs, lsl: e.target.value })}
                className={cs.input}
                style={{ minHeight: isMobile ? 44 : undefined }}
                aria-label="Lower specification limit"
              />
            </div>
            <div>
              <label className={cs.label}>Target</label>
              <input
                type="number"
                step="any"
                value={localSpecs.target}
                onChange={e => setLocalSpecs({ ...localSpecs, target: e.target.value })}
                className={cs.input}
                style={{ minHeight: isMobile ? 44 : undefined }}
                aria-label="Target specification"
              />
            </div>
            <div>
              <label className={cs.label}>USL (Max)</label>
              <input
                type="number"
                step="any"
                value={localSpecs.usl}
                onChange={e => setLocalSpecs({ ...localSpecs, usl: e.target.value })}
                className={cs.input}
                style={{ minHeight: isMobile ? 44 : undefined }}
                aria-label="Upper specification limit"
              />
            </div>
          </div>
        </div>

        {/* Grades */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Grades</h4>
            <button
              onClick={addGrade}
              className={cs.addButton}
              style={{ minHeight: isMobile ? 36 : undefined }}
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {localGrades.length === 0 ? (
            <div className={cs.gradesEmpty}>No grades defined.</div>
          ) : (
            <div className="space-y-3 sm:space-y-2">
              <div className={cs.gradesHeader}>
                <span className="flex-1">Label</span>
                <span className="w-12 text-right">Max</span>
                <span className="w-6"></span>
                <span className="w-4"></span>
              </div>
              {localGrades.map((grade, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={grade.label}
                    onChange={e => updateGrade(idx, 'label', e.target.value)}
                    className={`flex-1 ${cs.input}`}
                    placeholder="Name"
                    style={{ minHeight: isMobile ? 44 : undefined }}
                  />
                  <input
                    type="number"
                    step="any"
                    value={grade.max}
                    onChange={e => updateGrade(idx, 'max', parseFloat(e.target.value))}
                    className={`w-16 sm:w-12 ${cs.input} text-right`}
                    style={{ minHeight: isMobile ? 44 : undefined }}
                  />
                  <input
                    type="color"
                    value={grade.color}
                    onChange={e => updateGrade(idx, 'color', e.target.value)}
                    className="w-10 h-10 sm:w-6 sm:h-6 rounded cursor-pointer border-none bg-transparent p-0"
                  />
                  <button
                    onClick={() => removeGrade(idx)}
                    aria-label="Remove grade"
                    className={cs.removeButton}
                    style={{
                      minWidth: isMobile ? 44 : undefined,
                      minHeight: isMobile ? 44 : undefined,
                    }}
                  >
                    <Trash2 size={isMobile ? 18 : 12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 sm:py-2 rounded flex justify-center items-center gap-2 transition-colors shadow-lg touch-feedback"
        style={{ minHeight: isMobile ? 48 : undefined }}
      >
        <Save size={16} /> Save Changes
      </button>
    </>
  );

  // Mobile: Bottom sheet with backdrop
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

        {/* Bottom Sheet */}
        <div
          className={cs.mobileSheet}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className={cs.mobileDragHandle} />
          </div>

          {/* Header */}
          <div className={cs.mobileHeaderBorder}>
            <h3 className="text-base font-bold text-white">Edit Specifications</h3>
            <button
              onClick={onClose}
              className={cs.mobileCloseButton}
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label="Close specification editor"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-4">{formContent}</div>
        </div>
      </>
    );
  }

  // Desktop: Absolute positioned popup
  return (
    <div className={cs.desktopContainer} style={style}>
      <div className={cs.desktopHeaderBorder}>
        <h3 className="text-sm font-bold text-white">Edit Specifications</h3>
        <button
          onClick={onClose}
          className={cs.desktopCloseButton}
          aria-label="Close specification editor"
        >
          <X size={16} />
        </button>
      </div>

      {formContent}
    </div>
  );
};

export default SpecEditor;
