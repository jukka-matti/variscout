import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable modal dialog component with consistent styling
 *
 * @example
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Settings"
 *   maxWidth="max-w-lg"
 * >
 *   <ModalContent />
 * </Modal>
 */

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when modal should close (X button or backdrop click) */
  onClose: () => void;
  /** Modal title displayed in header */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional Tailwind max-width class (default: max-w-lg) */
  maxWidth?: string;
  /** Optional footer content (rendered below body) */
  footer?: React.ReactNode;
  /** Optional: disable backdrop click to close */
  closeOnBackdropClick?: boolean;
}

/**
 * Modal dialog wrapper with backdrop, header, scrollable body, and optional footer
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  footer,
  closeOnBackdropClick = true,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-slate-800 border border-slate-700 rounded-2xl w-full ${maxWidth} shadow-2xl flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="border-t border-slate-700 p-4 flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;

/**
 * Predefined button styles for modal footers
 */
export const ModalButton = {
  Primary: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
    >
      {children}
    </button>
  ),
  Secondary: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
    >
      {children}
    </button>
  ),
  Danger: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
    >
      {children}
    </button>
  ),
};
