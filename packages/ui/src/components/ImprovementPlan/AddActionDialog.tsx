import React, { useState, useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';

export interface AddActionDialogProps {
  findings: Array<{ id: string; text: string }>;
  onSubmit: (findingId: string, text: string, dueDate?: string) => void;
  onClose: () => void;
}

/**
 * AddActionDialog - Dialog for adding a new action to a finding from the Track view.
 *
 * Structure:
 * ```
 * Fixed backdrop
 * └── Centered dialog
 *     ├── Header: "Add Action"
 *     ├── Finding selector: <select> dropdown
 *     ├── Action text: <input>
 *     ├── Due date: <input type="date"> (optional)
 *     └── Buttons: [Cancel] [Add Action]
 * ```
 */
export const AddActionDialog: React.FC<AddActionDialogProps> = ({
  findings,
  onSubmit,
  onClose,
}) => {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    findings.length > 0 ? findings[0].id : ''
  );
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus text input on mount
  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  // Escape key closes dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    onSubmit(selectedFindingId, trimmedText, dueDate || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const isSubmitEnabled = text.trim().length > 0;

  return (
    <div
      data-testid="add-action-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
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
          aria-labelledby="add-action-dialog-title"
          className="bg-surface rounded-xl border border-edge p-6 max-w-md w-full mx-4 shadow-lg"
        >
          {/* Header */}
          <h2 id="add-action-dialog-title" className="text-base font-semibold text-content mb-4">
            Add Action
          </h2>

          <div className="space-y-4">
            {/* Finding selector */}
            {findings.length > 0 && (
              <div>
                <label
                  htmlFor="add-action-finding"
                  className="block text-xs font-medium text-content-secondary mb-1"
                >
                  Finding
                </label>
                <select
                  id="add-action-finding"
                  value={selectedFindingId}
                  onChange={e => setSelectedFindingId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {findings.map(finding => (
                    <option key={finding.id} value={finding.id}>
                      {finding.text}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action text */}
            <div>
              <label
                htmlFor="add-action-text"
                className="block text-xs font-medium text-content-secondary mb-1"
              >
                Action
              </label>
              <input
                ref={textInputRef}
                id="add-action-text"
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-sm text-content placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Due date (optional) */}
            <div>
              <label
                htmlFor="add-action-due-date"
                className="block text-xs font-medium text-content-secondary mb-1"
              >
                Due date <span className="text-content-muted font-normal">(optional)</span>
              </label>
              <input
                id="add-action-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isSubmitEnabled}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg disabled:opacity-40 hover:bg-blue-600 transition-colors"
            >
              Add Action
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
