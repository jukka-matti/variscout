import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';

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
  const [factorName, setFactorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Suggest default name on first open
      if (!factorName) {
        setFactorName('Selected Points');
      }
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFactorName('');
      setError(null);
    }
  }, [isOpen]);

  // Validate factor name
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Factor name cannot be empty';
    }
    if (existingFactors.includes(name.trim())) {
      return 'A factor with this name already exists';
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
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isValid = factorName.trim() && !error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-tertiary border border-edge rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-white">Create Factor from Selection</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-white transition-colors"
            aria-label="Close modal"
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
              Factor Name
            </label>
            <input
              ref={inputRef}
              id="factor-name"
              type="text"
              value={factorName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., High Temperature Events"
              className={`
                w-full px-3 py-2 rounded
                bg-surface-secondary border
                ${error ? 'border-red-400' : 'border-edge'}
                text-white placeholder-content-muted
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
              {selectedCount} {selectedCount === 1 ? 'point' : 'points'} will be marked as:
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
          <p className="text-xs text-content-muted">
            The view will automatically filter to show only the selected points.
          </p>
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
            Cancel
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
            Create & Filter
          </button>
        </div>
      </div>
    </div>
  );
};
