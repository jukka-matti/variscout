import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { gradeColors } from '@variscout/ui';

const MOBILE_BREAKPOINT = 640;

interface SpecEditorProps {
  specs: { usl?: number; lsl?: number; target?: number };
  grades: { max: number; label: string; color: string }[];
  onSave: (
    specs: { usl?: number; lsl?: number; target?: number },
    grades: { max: number; label: string; color: string }[]
  ) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

const SpecEditor = ({ specs, grades, onSave, onClose, style }: SpecEditorProps) => {
  const [localSpecs, setLocalSpecs] = useState<{ usl: string; lsl: string; target: string }>({
    usl: specs.usl?.toString() || '',
    lsl: specs.lsl?.toString() || '',
    target: specs.target?.toString() || '',
  });
  const [localGrades, setLocalGrades] = useState(grades || []);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSave = () => {
    const parsedSpecs = {
      usl: localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
      lsl: localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
      target: localSpecs.target ? parseFloat(localSpecs.target) : undefined,
    };
    // Sort grades by max value to ensure correct banding
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

  // Form content shared between mobile and desktop
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
              <label className="block text-[10px] sm:text-xs text-content-secondary mb-1">
                LSL (Min)
              </label>
              <input
                type="number"
                step="any"
                value={localSpecs.lsl}
                onChange={e => setLocalSpecs({ ...localSpecs, lsl: e.target.value })}
                className="w-full bg-surface border border-edge rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500"
                style={{ minHeight: isMobile ? 44 : undefined }}
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-content-secondary mb-1">
                Target
              </label>
              <input
                type="number"
                step="any"
                value={localSpecs.target}
                onChange={e => setLocalSpecs({ ...localSpecs, target: e.target.value })}
                className="w-full bg-surface border border-edge rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500"
                style={{ minHeight: isMobile ? 44 : undefined }}
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-content-secondary mb-1">
                USL (Max)
              </label>
              <input
                type="number"
                step="any"
                value={localSpecs.usl}
                onChange={e => setLocalSpecs({ ...localSpecs, usl: e.target.value })}
                className="w-full bg-surface border border-edge rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500"
                style={{ minHeight: isMobile ? 44 : undefined }}
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
              className="text-xs bg-surface-tertiary hover:bg-surface-elevated text-white px-3 py-1.5 sm:px-2 sm:py-0.5 rounded flex items-center gap-1 transition-colors touch-feedback"
              style={{ minHeight: isMobile ? 36 : undefined }}
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {localGrades.length === 0 ? (
            <div className="text-center p-4 border border-dashed border-edge rounded text-content-muted text-xs italic">
              No grades defined.
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-2">
              <div className="hidden sm:flex gap-2 text-[10px] text-content-muted px-1">
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
                    className="flex-1 bg-surface border border-edge rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500"
                    placeholder="Name"
                    style={{ minHeight: isMobile ? 44 : undefined }}
                  />
                  <input
                    type="number"
                    step="any"
                    value={grade.max}
                    onChange={e => updateGrade(idx, 'max', parseFloat(e.target.value))}
                    className="w-16 sm:w-12 bg-surface border border-edge rounded px-2 sm:px-1 py-2 sm:py-1 text-sm sm:text-xs text-white text-right outline-none focus:border-blue-500"
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
                    className="p-2 sm:p-0 text-content-muted hover:text-red-400 transition-colors touch-feedback"
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
          className="fixed inset-x-0 bottom-0 z-50 bg-surface-secondary border-t border-edge-secondary rounded-t-2xl shadow-2xl animate-slide-up"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-surface-elevated rounded-full" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-center border-b border-edge px-4 pb-3">
            <h3 className="text-base font-bold text-white">Edit Specifications</h3>
            <button
              onClick={onClose}
              className="p-2 text-content-secondary hover:text-white touch-feedback rounded-lg"
              style={{ minWidth: 44, minHeight: 44 }}
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
    <div
      className="absolute z-50 bg-surface-secondary border border-edge-secondary rounded-lg shadow-2xl p-4 flex flex-col gap-4 w-80"
      style={style}
    >
      <div className="flex justify-between items-center border-b border-edge pb-3">
        <h3 className="text-sm font-bold text-white">Edit Specifications</h3>
        <button onClick={onClose} className="text-content-secondary hover:text-white">
          <X size={16} />
        </button>
      </div>

      {formContent}
    </div>
  );
};

export default SpecEditor;
