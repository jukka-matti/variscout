/**
 * CapabilitySuggestionModal - Contextual modal suggesting capability view
 *
 * Shown when specification limits are set during data import:
 * - Suggests starting with Capability view to check Cpk target
 * - Auto-selects best subgroup method (time-extracted > first factor > fixed n=5)
 * - "Start with Capability View" / "Standard View" buttons
 */

import React, { useRef, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { BarChart3, X } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

export interface CapabilitySuggestionModalProps {
  onStartCapability: (subgroupConfig: {
    method: 'column' | 'fixed-size';
    column?: string;
    size?: number;
  }) => void;
  onStartStandard: () => void;
  factorColumns: string[];
}

export const CapabilitySuggestionModal: React.FC<CapabilitySuggestionModalProps> = ({
  onStartCapability,
  onStartStandard,
  factorColumns,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Show modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Handle native dialog close (Escape key handled by browser)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onStartStandard();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onStartStandard]);

  const handleStartCapability = () => {
    // Auto-select: prefer time-extracted column, else first factor, else fixed n=5
    const timeExtracted = factorColumns.find(c =>
      /_(?:Hour|Year|Month|Week|DayOfWeek|\d+min)$/.test(c)
    );
    if (timeExtracted) {
      onStartCapability({ method: 'column', column: timeExtracted });
    } else if (factorColumns.length > 0) {
      onStartCapability({ method: 'column', column: factorColumns[0] });
    } else {
      onStartCapability({ method: 'fixed-size', size: 5 });
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm max-w-none max-h-none w-full h-full m-0 p-0 flex items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) onStartStandard();
      }}
    >
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          fallbackFocus: '[role="dialog"]',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-surface-secondary border border-edge rounded-2xl shadow-2xl flex flex-col animate-fade-in"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600/20">
                  <BarChart3 size={20} className="text-green-400" />
                </div>
                <h2 className="text-base font-semibold text-content">
                  {t('capability.suggestion.title', 'Specification limits set')}
                </h2>
              </div>
              <button
                onClick={onStartStandard}
                className="text-content-secondary hover:text-content p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-content-muted mb-4">
              {t(
                'capability.suggestion.description',
                'Would you like to start with the Capability view to check if your subgroups are meeting the Cpk target?'
              )}
            </p>

            <div className="bg-surface-tertiary rounded-lg p-3 mb-4 text-xs text-content-muted space-y-1">
              <div className="font-medium text-content text-xs mb-1">
                {t('capability.suggestion.whatYouSee', "What you'll see:")}
              </div>
              <div>
                {t('capability.suggestion.bullet1', 'I-Chart plotting Cp and Cpk per subgroup')}
              </div>
              <div>
                {t(
                  'capability.suggestion.bullet2',
                  'Whether subgroups consistently meet your target'
                )}
              </div>
              <div>
                {t('capability.suggestion.bullet3', 'Centering loss (gap between Cp and Cpk)')}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStartCapability}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t('capability.suggestion.startCapability', 'Start with Capability View')}
              </button>
              <button
                onClick={onStartStandard}
                className="flex-1 px-4 py-2 bg-surface-tertiary hover:bg-surface-elevated text-content border border-edge rounded-lg text-sm font-medium transition-colors"
              >
                {t('capability.suggestion.standardView', 'Standard View')}
              </button>
            </div>

            <p className="text-[10px] text-content-muted text-center mt-3">
              {t(
                'capability.suggestion.footer',
                'You can switch anytime using the toggle in the I-Chart header.'
              )}
            </p>
          </div>
        </div>
      </FocusTrap>
    </dialog>
  );
};
