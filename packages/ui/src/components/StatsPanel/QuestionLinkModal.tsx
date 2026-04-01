import React, { useEffect, useRef } from 'react';

export interface QuestionLinkModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Link callback — receives the selected question's id */
  onLink: (questionId: string) => void;
  /** Available questions to link to */
  questions: Array<{ id: string; factor?: string; text: string }>;
}

/**
 * QuestionLinkModal - A picker dialog for linking an observation to a question.
 *
 * Shows a clickable list of questions. Clicking one selects it and closes.
 * Follows the CreateFactorModal native <dialog> pattern.
 */
export const QuestionLinkModal: React.FC<QuestionLinkModalProps> = ({
  isOpen,
  onClose,
  onLink,
  questions,
}) => {
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
    const handleClose = (): void => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleSelect = (questionId: string): void => {
    onLink(questionId);
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
        aria-label="Link to question"
        className="relative bg-surface-tertiary border border-edge rounded-lg shadow-xl w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-content">Link to question</h2>
        </div>

        {/* Question list */}
        <div className="max-h-64 overflow-y-auto">
          {questions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-content-muted">No questions available</div>
          ) : (
            questions.map(q => (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelect(q.id)}
                className="w-full text-left px-4 py-2.5 text-xs text-content hover:bg-surface-secondary transition-colors border-b border-edge/40 last:border-b-0"
              >
                {q.factor ? (
                  <span>
                    <span className="font-medium text-blue-400">{q.factor}</span>
                    <span className="text-content-muted"> — {q.text}</span>
                  </span>
                ) : (
                  <span>{q.text}</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-edge">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-content-secondary hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default QuestionLinkModal;
