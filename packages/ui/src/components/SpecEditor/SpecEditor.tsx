import React, { useState } from 'react';
import { X, Save, MoveVertical, ArrowDown, ArrowUp } from 'lucide-react';
import { inferCharacteristicType, type CharacteristicType } from '@variscout/core';
import { useIsMobile } from '../../hooks';
import type { SpecEditorColorScheme, SpecEditorProps } from './types';

const MOBILE_BREAKPOINT = 640;

export const specEditorDefaultColorScheme: SpecEditorColorScheme = {
  label: 'block text-[10px] sm:text-xs text-content-secondary mb-1',
  input:
    'w-full bg-surface border border-edge rounded px-2 py-2 sm:py-1 text-sm sm:text-xs text-white outline-none focus:border-blue-500',
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

const TYPE_ICONS: {
  value: CharacteristicType;
  icon: typeof MoveVertical;
  label: string;
  description: string;
}[] = [
  {
    value: 'nominal',
    icon: MoveVertical,
    label: 'Nominal',
    description: 'Target-centered (e.g. fill weight)',
  },
  {
    value: 'smaller',
    icon: ArrowDown,
    label: 'Smaller is better',
    description: 'Lower is better (e.g. defects)',
  },
  {
    value: 'larger',
    icon: ArrowUp,
    label: 'Larger is better',
    description: 'Higher is better (e.g. yield)',
  },
];

const SpecEditor = ({
  specs,
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
  const [typeSelection, setTypeSelection] = useState<CharacteristicType | null>(
    specs.characteristicType ?? null
  );
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  // Compute what "Auto" would infer for display hint
  const autoInferred = inferCharacteristicType({
    usl: localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
    lsl: localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
  });

  const handleSave = () => {
    const parsedSpecs = {
      usl: localSpecs.usl ? parseFloat(localSpecs.usl) : undefined,
      lsl: localSpecs.lsl ? parseFloat(localSpecs.lsl) : undefined,
      target: localSpecs.target ? parseFloat(localSpecs.target) : undefined,
      characteristicType: typeSelection ?? undefined,
    };
    onSave(parsedSpecs);
    onClose();
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
              <label htmlFor="spec-lsl" className={cs.label}>
                LSL (Min)
              </label>
              <input
                id="spec-lsl"
                name="spec-lsl"
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
              <label htmlFor="spec-target" className={cs.label}>
                Target
              </label>
              <input
                id="spec-target"
                name="spec-target"
                type="number"
                step="any"
                value={localSpecs.target}
                onChange={e => setLocalSpecs({ ...localSpecs, target: e.target.value })}
                className={cs.input}
                style={{ minHeight: isMobile ? 44 : undefined }}
                aria-label="Target specification"
              />
              {/* Characteristic type icons below Target */}
              <div
                className="flex justify-center gap-1 mt-1.5"
                role="radiogroup"
                aria-label="Characteristic type"
              >
                {TYPE_ICONS.map(opt => {
                  const Icon = opt.icon;
                  const isExplicit = typeSelection === opt.value;
                  const isInferred = !typeSelection && autoInferred === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isExplicit}
                      aria-label={`${opt.label} — ${opt.description}`}
                      onClick={() => setTypeSelection(isExplicit ? null : opt.value)}
                      title={`${opt.label} — ${opt.description}`}
                      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                        isExplicit
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : isInferred
                            ? 'border border-dashed border-blue-400/50 text-blue-400/60'
                            : 'border border-edge text-content-muted hover:border-blue-500/50'
                      }`}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
              {!typeSelection && (localSpecs.usl || localSpecs.lsl) && (
                <p className="mt-1 text-[10px] text-content-muted text-center">
                  detected: <span className="text-content-secondary">{autoInferred}</span>
                </p>
              )}
            </div>
            <div>
              <label htmlFor="spec-usl" className={cs.label}>
                USL (Max)
              </label>
              <input
                id="spec-usl"
                name="spec-usl"
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
