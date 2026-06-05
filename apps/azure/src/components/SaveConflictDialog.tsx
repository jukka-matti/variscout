import React, { useEffect, useId, useRef } from 'react';

export interface SaveConflictDialogProps {
  isOpen: boolean;
  documentName: string;
  /** Load the cloud version — discards unsaved local changes (the lossy choice, stated in the copy). */
  onReload: () => void;
  /** Keep the local version as a new "(conflict copy)" document (the lossless choice — primary). */
  onBranch: () => void;
  /** Defer the decision: "Not now" / ESC / backdrop. Autosave stays suspended; a manual save re-opens. */
  onDismiss: () => void;
}

/**
 * SaveConflictDialog — PO-8b explicit reload-or-branch resolution for a 412
 * cloud conflict (replaces the silent auto-conflict-copy; spec §9.4 as amended
 * by §17). Mirrors the packages/ui ConfirmDialog native-<dialog> conventions
 * (showModal focus trap, ESC → cancel event, backdrop click) with a third
 * action — azure-local because the copy and flow are Azure-cloud-sync
 * specific. Deliberately a React component, never window.confirm: native
 * dialogs wedge CDP and cannot be test- or chrome-driven (PO-3/PO-5 lesson).
 * English literals match the shipped azure-sync toast convention (no
 * MessageCatalog keys — those are all-or-nothing across 32 locales).
 */
export const SaveConflictDialog: React.FC<SaveConflictDialogProps> = ({
  isOpen,
  documentName,
  onReload,
  onBranch,
  onDismiss,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
    } else if (!isOpen && el.open) {
      el.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onDismiss();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={onDismiss}
      onClick={handleBackdropClick}
      data-testid="save-conflict-dialog"
      className="rounded-lg bg-surface-primary shadow-xl backdrop:bg-black/30 p-0 border-0"
    >
      <div className="flex flex-col gap-4 px-6 py-5 min-w-72 max-w-md">
        <h2 id={titleId} className="text-lg font-semibold text-content">
          Cloud copy has changed
        </h2>
        <p id={messageId} className="text-sm text-content-muted">
          Someone else saved &ldquo;{documentName}&rdquo; after you last synced. Load the cloud
          version (your unsaved changes are discarded), or keep your version as a separate copy.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onReload}
            className="px-4 py-2 text-sm text-content-secondary border border-edge hover:bg-surface-secondary rounded-lg transition-colors"
          >
            Load cloud version
          </button>
          <button
            type="button"
            onClick={onBranch}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Keep mine as a copy
          </button>
        </div>
      </div>
    </dialog>
  );
};
