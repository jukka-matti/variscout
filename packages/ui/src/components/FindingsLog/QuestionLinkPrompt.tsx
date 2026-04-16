import React, { useState, useEffect, useRef } from 'react';
import { X, Link2 } from 'lucide-react';
import { useIsMobile } from '../../hooks';

export interface QuestionLinkPromptProps {
  /** Whether the prompt is open. */
  isOpen: boolean;
  /**
   * The finding that was just created. The wrapper typically closes over this
   * when constructing `onLink` so the callback knows which finding to link.
   * This prop is not used internally by the component — it's part of the public
   * API for wrapper clarity and future extension (e.g., showing the finding's
   * category in the prompt header).
   */
  findingId: string;
  /** Open questions from the investigation store, to show in the picker. */
  questions: ReadonlyArray<{ id: string; text: string; status: string }>;
  /** Called when user picks a question. Wrapper calls investigationStore.linkFindingToQuestion. */
  onLink: (questionId: string) => void;
  /** Called when user clicks Skip (this time only). */
  onSkip: () => void;
  /** Called when user checks "Don't ask again" AND clicks Skip. Wrapper calls sessionStore.setSkipQuestionLinkPrompt(true). */
  onSkipForever: () => void;
  /** Called to close (backdrop click, Escape, or after any action). */
  onClose: () => void;
}

// Inner component mounts only when open — ensures checkbox resets each time
type QuestionLinkPromptInnerProps = Omit<QuestionLinkPromptProps, 'isOpen' | 'findingId'>;

const QuestionLinkPromptInner: React.FC<QuestionLinkPromptInnerProps> = ({
  questions,
  onLink,
  onSkip,
  onSkipForever,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const [skipForever, setSkipForever] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Capture previous focus on mount; restore on unmount. Focus the first
  // interactive element (question button or Skip) via rAF to avoid a setTimeout race.
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    requestAnimationFrame(() => {
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      } else {
        containerRef.current?.focus();
      }
    });
    return () => {
      if (previousFocusRef.current && 'focus' in previousFocusRef.current) {
        (previousFocusRef.current as HTMLElement).focus();
      }
    };
  }, []);

  // Escape + Tab focus-trap key handler (merged into a single listener)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const openQuestions = questions.filter(q => q.status === 'open');

  const handleSkip = () => {
    if (skipForever) {
      onSkipForever();
    } else {
      onSkip();
    }
    onClose();
  };

  const handleLink = (questionId: string) => {
    onLink(questionId);
    onClose();
  };

  // TODO: Add "Create question from observation" button (follow-up; out of scope for this task)

  const dialog = (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qlp-title"
      className="flex flex-col gap-3 bg-surface-secondary border border-edge rounded-lg shadow-xl p-4 w-full max-w-sm outline-none"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <span id="qlp-title" className="text-sm font-medium text-content">
            Link this observation to a question?
          </span>
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="text-content-muted hover:text-content transition-colors flex-shrink-0 -mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-content-muted leading-snug">
        Questions anchor your investigation. You can always link later.
      </p>

      {/* Question picker */}
      {openQuestions.length > 0 ? (
        <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {openQuestions.map(q => (
            <li key={q.id}>
              <button
                className="w-full text-left text-xs px-3 py-2 rounded border border-edge bg-surface hover:bg-surface-tertiary hover:border-blue-500/50 text-content transition-colors"
                onClick={() => handleLink(q.id)}
              >
                {q.text}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-content-muted italic px-1">
          No open questions yet. Add one from the Questions tab.
        </p>
      )}

      {/* Footer: Don't ask again + Skip */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-edge/50">
        <label className="flex items-center gap-1.5 text-xs text-content-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={skipForever}
            onChange={e => setSkipForever(e.target.checked)}
            className="accent-blue-500"
          />
          Don&apos;t ask again
        </label>
        <button
          onClick={handleSkip}
          className="text-xs px-3 py-1.5 rounded border border-edge text-content-muted hover:text-content hover:border-blue-500/50 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        onClick={onClose}
      >
        <div className="w-full max-w-lg px-4 pb-4 pt-2">{dialog}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {dialog}
    </div>
  );
};

/**
 * Lightweight prompt shown after a Finding is created from a chart observation,
 * asking whether the analyst wants to link it to an open investigation question.
 *
 * Non-blocking: skipping is always valid. "Don't ask again" persists the
 * preference via onSkipForever → sessionStore.setSkipQuestionLinkPrompt(true).
 */
export const QuestionLinkPrompt: React.FC<QuestionLinkPromptProps> = ({
  isOpen,
  findingId: _findingId,
  ...rest
}) => {
  if (!isOpen) return null;
  return <QuestionLinkPromptInner {...rest} />;
};

export default QuestionLinkPrompt;
