import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import { inferCharacteristicType, type CharacteristicType } from '@variscout/core';
import { useTranslation } from '@variscout/hooks';
import { useIsMobile, BREAKPOINTS } from '../../hooks';
import CharacteristicTypeSelector from '../CharacteristicTypeSelector';
import type { SpecEditorColorScheme, SpecEditorProps } from './types';

export const specEditorDefaultColorScheme: SpecEditorColorScheme = {
  label: 'block text-[0.625rem] sm:text-xs text-content-secondary mb-1',
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

const SpecEditor = ({
  specs,
  onSave,
  onClose,
  style,
  colorScheme = specEditorDefaultColorScheme,
}: SpecEditorProps) => {
  const { t } = useTranslation();
  const cs = colorScheme;
  const [localSpecs, setLocalSpecs] = useState<{ usl: string; lsl: string; target: string }>({
    usl: specs.usl?.toString() || '',
    lsl: specs.lsl?.toString() || '',
    target: specs.target?.toString() || '',
  });
  const [typeSelection, setTypeSelection] = useState<CharacteristicType | null>(
    specs.characteristicType ?? null
  );
  const isMobile = useIsMobile(BREAKPOINTS.phone);

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
              <CharacteristicTypeSelector
                value={typeSelection}
                onChange={setTypeSelection}
                autoInferred={autoInferred}
                className="flex justify-center gap-1 mt-1.5"
              />
              {!typeSelection && (localSpecs.usl || localSpecs.lsl) && (
                <p className="mt-1 text-[0.625rem] text-content-muted text-center">
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
        <Save size={16} /> {t('action.save')}
      </button>
    </>
  );

  // Mobile: Bottom sheet as native dialog
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Show/hide dialog for mobile
  useEffect(() => {
    if (!isMobile) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isMobile]);

  // Handle native dialog close on mobile
  useEffect(() => {
    if (!isMobile) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [isMobile, onClose]);

  if (isMobile) {
    return (
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 max-w-none max-h-none w-full h-full m-0 p-0"
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
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
            <h3 className="text-base font-bold text-white">{t('specs.editTitle')}</h3>
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
      </dialog>
    );
  }

  // Desktop: Absolute positioned popup
  return (
    <div className={cs.desktopContainer} style={style}>
      <div className={cs.desktopHeaderBorder}>
        <h3 className="text-sm font-bold text-white">{t('specs.editTitle')}</h3>
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
