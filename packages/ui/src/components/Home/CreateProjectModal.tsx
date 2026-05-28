import React, { useEffect, useRef, useState } from 'react';
import FocusTrap from 'focus-trap-react';

export interface CreateProjectModalProps {
  /** Called with the trimmed Title and (optionally) trimmed Issue Statement when
   *  the user clicks Create. The `issueStatement` key is OMITTED entirely when
   *  the textarea is empty or whitespace-only — consumers can rely on
   *  `'issueStatement' in payload` as the present/absent signal. */
  onSave: (project: { title: string; issueStatement?: string }) => void;
  /** Called on Cancel, Escape, and backdrop click. */
  onClose: () => void;
}

const TITLE_MAX_LENGTH = 80;
const ISSUE_STATEMENT_MAX_LENGTH = 500;

/**
 * CreateProjectModal — lightweight Create Project flow at Home (PR-CCJ-E1).
 *
 * T4 extends the T3 skeleton with the optional Issue Statement field. The
 * modal stays presentational — the Home CTA wiring (also T4) owns IP
 * creation, store mutation, and navigation; this component only assembles
 * the title + optional issue-statement payload and hands it off via
 * `onSave`.
 *
 * Mirrors the D-series modal shell — FocusTrap + role="dialog" +
 * aria-labelledby + Escape / backdrop close + Cancel/Create footer.
 */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState<string>('');
  const [issueStatement, setIssueStatement] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus dialog on mount.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape closes.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const trimmedTitle = title.trim();
  const trimmedIssueStatement = issueStatement.trim();
  const createDisabled = trimmedTitle.length === 0;

  const handleCreate = () => {
    if (createDisabled) return;
    // Omit `issueStatement` from the payload when whitespace-only — keep the
    // door open for `expect.not.objectContaining({ issueStatement })` and
    // `'issueStatement' in payload` consumer checks.
    if (trimmedIssueStatement.length === 0) {
      onSave({ title: trimmedTitle });
    } else {
      onSave({ title: trimmedTitle, issueStatement: trimmedIssueStatement });
    }
  };

  return (
    <div
      data-testid="create-project-modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          // T3 reviewer nit: focus the Title input on activate so keyboard
          // users land directly on the primary field instead of the dialog
          // shell. The selector matches the input by its stable id.
          fallbackFocus: '#create-project-modal-title-input',
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-modal-title"
          tabIndex={-1}
          className="bg-surface rounded-xl border border-edge p-6 max-w-md w-full mx-4 shadow-lg max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <h2 id="create-project-modal-title" className="text-base font-semibold text-content mb-4">
            New project
          </h2>

          {/* Body — Title field + optional Issue Statement */}
          <div className="flex-1 overflow-auto flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="create-project-modal-title-input"
                className="text-sm font-medium text-content"
              >
                Title
              </label>
              <input
                id="create-project-modal-title-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                aria-required="true"
                maxLength={TITLE_MAX_LENGTH}
                className="border border-edge rounded-lg px-3 py-2 text-sm text-content bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-content-secondary mt-1">
                {title.length}/{TITLE_MAX_LENGTH}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="create-project-modal-issue-statement-input"
                className="text-sm font-medium text-content"
              >
                Issue Statement
              </label>
              <p className="text-xs text-content-secondary">
                What&apos;s happening? Brief description of the situation you&apos;re investigating.
              </p>
              <textarea
                id="create-project-modal-issue-statement-input"
                value={issueStatement}
                onChange={e => setIssueStatement(e.target.value)}
                maxLength={ISSUE_STATEMENT_MAX_LENGTH}
                rows={3}
                className="border border-edge rounded-lg px-3 py-2 text-sm text-content bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <p className="text-xs text-content-secondary mt-1">
                {issueStatement.length}/{ISSUE_STATEMENT_MAX_LENGTH}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-edge">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createDisabled}
              aria-disabled={createDisabled}
              onClick={handleCreate}
              className={`px-4 py-2 text-sm bg-blue-500 text-white rounded-lg transition-colors ${
                createDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
            >
              Create →
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
