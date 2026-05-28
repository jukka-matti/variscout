import React, { useEffect, useId, useRef } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Label for the confirm button. Defaults to 'Confirm'. */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** When true the confirm button is styled with a destructive red fill. */
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog — a lightweight confirmation primitive backed by native `<dialog>`.
 *
 * Structure:
 * ```
 * <dialog role="alertdialog" aria-labelledby aria-describedby>
 *   <div>  ← content container (clicks here do NOT reach dialog backdrop handler)
 *     <h2>  title
 *     <p>   message
 *     <div> ← action row
 *       <button> Cancel   (rendered first → gets initial focus)
 *       <button> Confirm
 * ```
 *
 * - ESC: native `cancel` event → `onCancel`
 * - Backdrop click: `onClick` on `<dialog>` with `event.target === dialogRef.current` guard
 * - Focus trap + restore: native `<dialog>` semantics via `showModal()`
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
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
      onCancel();
    }
  };

  const confirmButtonClass = isDestructive
    ? 'px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors'
    : 'px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors';

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={onCancel}
      onClick={handleBackdropClick}
      className="rounded-lg bg-surface-primary shadow-xl backdrop:bg-black/30 p-0 border-0"
    >
      <div className="flex flex-col gap-4 px-6 py-5 min-w-72 max-w-md">
        <h2 id={titleId} className="text-lg font-semibold text-content">
          {title}
        </h2>
        <p id={messageId} className="text-sm text-content-muted">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          {/* Cancel rendered first so it receives initial focus from the dialog */}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={confirmButtonClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};
