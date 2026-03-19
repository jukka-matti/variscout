import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from '@variscout/hooks';

export interface CreateFactorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Number of selected points */
  selectedCount: number;
  /** Existing factor/column names (for validation) */
  existingFactors: string[];
  /** Create factor callback (receives user-entered name) */
  onCreateFactor: (factorName: string) => void;
}

/**
 * CreateFactorModal - Modal for naming a new factor from selection
 *
 * Appears when user clicks "Create Factor" in SelectionPanel.
 * User enters a custom name, system creates column with:
 * - Selected points → factorName value
 * - Unselected points → "Other" value
 *
 * Design:
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │  Create Factor from Selection                   │
 * ├─────────────────────────────────────────────────┤
 * │  Factor Name: [High Temperature Events______]   │
 * │  ⚠ Factor name must be unique                   │
 * │                                                 │
 * │  12 points will be marked as:                   │
 * │  • "High Temperature Events" (selected)         │
 * │  • "Other" (unselected)                         │
 * │                                                 │
 * │  The view will automatically filter to show     │
 * │  only the selected points.                      │
 * │                                                 │
 * │             [Cancel]  [Create & Filter]         │
 * └─────────────────────────────────────────────────┘
 * ```
 */
export const CreateFactorModal: React.FC<CreateFactorModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  existingFactors,
  onCreateFactor,
}) => {
  const { t, tf } = useTranslation();
  const [factorName, setFactorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens — only run when isOpen changes (not on every keystroke)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Suggest default name on first open
      if (!factorName) {
        setFactorName('Selected Points');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFactorName('');
      setError(null);
    }
  }, [isOpen]);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close dialog based on isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle native dialog close (Escape key handled by browser)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Validate factor name
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return t('factor.nameEmpty');
    }
    if (existingFactors.includes(name.trim())) {
      return t('factor.nameExists');
    }
    return null;
  };

  // Handle input change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFactorName(newName);
    setError(validateName(newName));
  };

  // Handle create button click
  const handleCreate = () => {
    const trimmedName = factorName.trim();
    const validationError = validateName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    onCreateFactor(trimmedName);
    onClose();
  };

  // Handle Enter key in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const isValid = factorName.trim() && !error;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/60 max-w-none max-h-none w-full h-full m-0 p-0 flex items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div className="relative bg-surface-tertiary border border-edge rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-content">{t('factor.create')}</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors"
            aria-label={t('action.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Factor name input */}
          <div>
            <label
              htmlFor="factor-name"
              className="block text-sm font-medium text-content-muted mb-2"
            >
              {t('factor.name')}
            </label>
            <input
              ref={inputRef}
              id="factor-name"
              type="text"
              value={factorName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder={t('factor.example')}
              className={`
                w-full px-3 py-2 rounded
                bg-surface-secondary border
                ${error ? 'border-red-400' : 'border-edge'}
                text-content placeholder-content-muted
                focus:outline-none focus:ring-2
                ${error ? 'focus:ring-red-400/50' : 'focus:ring-blue-500/50'}
              `}
            />
            {error && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-surface-secondary/50 border border-edge rounded px-4 py-3 space-y-2">
            <p className="text-sm text-content-secondary">
              {tf('factor.pointsMarked', { count: selectedCount })}
            </p>
            <ul className="text-sm text-content-muted space-y-1 ml-4">
              <li className="list-disc">
                <span className="text-blue-300 font-medium">
                  "{factorName.trim() || 'Factor Name'}"
                </span>{' '}
                (selected)
              </li>
              <li className="list-disc">
                <span className="text-content-secondary">"Other"</span> (unselected)
              </li>
            </ul>
          </div>

          {/* Info text */}
          <p className="text-xs text-content-muted">{t('factor.filterExplanation')}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-edge">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded
              text-sm text-content-secondary
              hover:bg-surface-secondary
              transition-colors
            "
          >
            {t('action.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className={`
              px-4 py-2 rounded text-sm font-medium
              transition-colors
              ${
                isValid
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-surface-secondary text-content-muted cursor-not-allowed'
              }
            `}
          >
            {t('factor.createAndFilter')}
          </button>
        </div>
      </div>
    </dialog>
  );
};
