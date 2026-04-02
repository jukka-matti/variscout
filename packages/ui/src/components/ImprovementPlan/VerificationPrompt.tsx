import React from 'react';

export interface VerificationPromptProps {
  /** Number of actions currently in progress */
  improvingActionCount: number;
  /** Callback when user confirms this is verification data */
  onConfirmVerification: () => void;
  /** Callback when user says this is not verification data */
  onDismiss: () => void;
}

/**
 * VerificationPrompt - Modal dialog shown when new data is uploaded while
 * findings have status === 'improving'. Asks the user whether the new data
 * is intended to verify improvement effects.
 */
export const VerificationPrompt: React.FC<VerificationPromptProps> = ({
  improvingActionCount,
  onConfirmVerification,
  onDismiss,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      data-testid="verification-prompt-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-prompt-title"
        className="bg-surface rounded-xl border border-edge p-6 max-w-md mx-4 shadow-lg"
        data-testid="verification-prompt"
      >
        <h2
          id="verification-prompt-title"
          className="text-base font-semibold text-content mb-3"
          data-testid="verification-prompt-title"
        >
          Verification Data?
        </h2>

        <p className="text-sm text-content-secondary mb-6" data-testid="verification-prompt-body">
          You have{' '}
          <span className="font-medium text-content" data-testid="verification-prompt-count">
            {improvingActionCount}
          </span>{' '}
          {improvingActionCount === 1 ? 'action' : 'actions'} in progress. Is this new data to check
          their effect?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-edge text-content-secondary hover:bg-surface-secondary transition-colors"
            data-testid="verification-prompt-dismiss"
          >
            No, regular data
          </button>
          <button
            type="button"
            onClick={onConfirmVerification}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            data-testid="verification-prompt-confirm"
          >
            Yes, verify effect
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPrompt;
