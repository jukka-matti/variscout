import React, { useState, useEffect, useRef } from 'react';

export interface QuestionInputModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Submit callback with the entered text */
  onSubmit: (text: string) => void;
  /** Dialog title (e.g. "Add Question" or "Add Observation") */
  title: string;
  /** Input placeholder text */
  placeholder: string;
  /** Submit button label (default: "Add") */
  submitLabel?: string;
}

/**
 * QuestionInputModal - A compact text input modal using native <dialog>.
 *
 * Used for quick-entry of questions and observations in the PI panel.
 * Follows the CreateFactorModal pattern.
 */
export const QuestionInputModal: React.FC<QuestionInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
  submitLabel = 'Add',
}) => {
  const [text, setText] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const handleClose = (): void => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear input on close
  useEffect(() => {
    if (!isOpen) {
      setText('');
    }
  }, [isOpen]);

  const handleSubmit = (): void => {
    const trimmed = text.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent backdrop:bg-black/50 max-w-none max-h-none w-full h-full m-0 p-0 flex items-center justify-center"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-surface-tertiary border border-edge rounded-lg shadow-xl w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-content">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded bg-surface-secondary border border-edge text-content text-sm placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-edge">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-content-secondary hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              text.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-surface-secondary text-content-muted cursor-not-allowed'
            }`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default QuestionInputModal;
