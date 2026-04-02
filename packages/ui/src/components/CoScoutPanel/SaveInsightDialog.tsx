import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SaveInsightDialogProps {
  isOpen: boolean;
  messageText: string;
  messageId: string;
  /** Image attachments on the source message, passed through to onSaveAsNewFinding */
  messageImages?: Array<{ dataUrl: string; mimeType: string }>;
  /** Existing findings to add comments to */
  findings?: Array<{ id: string; text: string }>;
  /** Existing questions to add comments to */
  questions?: Array<{ id: string; text: string }>;
  /** Called when saving as new finding */
  onSaveAsNewFinding: (
    text: string,
    sourceMessageId: string,
    images?: Array<{ dataUrl: string; mimeType: string }>
  ) => void;
  /** Called when adding comment to existing finding */
  onAddCommentToFinding?: (findingId: string, text: string) => void;
  /** Called when adding comment to existing question */
  onAddCommentToQuestion?: (questionId: string, text: string) => void;
  onClose: () => void;
}

type SaveMode = 'new-finding' | 'comment-finding' | 'comment-question';

function truncateText(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

const SaveInsightDialog: React.FC<SaveInsightDialogProps> = ({
  isOpen,
  messageText,
  messageId,
  messageImages,
  findings,
  questions,
  onSaveAsNewFinding,
  onAddCommentToFinding,
  onAddCommentToQuestion,
  onClose,
}) => {
  // Derive initial values from props (reset when messageId changes)
  const initialText = truncateText(messageText, 200);
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState<SaveMode>('new-finding');
  const [selectedFindingId, setSelectedFindingId] = useState(findings?.[0]?.id ?? '');
  const [selectedQuestionId, setSelectedQuestionId] = useState(questions?.[0]?.id ?? '');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageIdRef = useRef(messageId);

  // Reset state when a different message is selected
  if (messageId !== prevMessageIdRef.current) {
    prevMessageIdRef.current = messageId;
    setText(initialText);
    setMode('new-finding');
    setSelectedFindingId(findings?.[0]?.id ?? '');
    setSelectedQuestionId(questions?.[0]?.id ?? '');
  }

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escape key closes dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: keep focus inside dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleFocusTrap = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, textarea, select, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen]);

  const handleSave = useCallback((): void => {
    const trimmed = text.trim();
    if (!trimmed) return;

    switch (mode) {
      case 'new-finding':
        onSaveAsNewFinding(trimmed, messageId, messageImages);
        break;
      case 'comment-finding':
        if (selectedFindingId && onAddCommentToFinding) {
          onAddCommentToFinding(selectedFindingId, trimmed);
        }
        break;
      case 'comment-question':
        if (selectedQuestionId && onAddCommentToQuestion) {
          onAddCommentToQuestion(selectedQuestionId, trimmed);
        }
        break;
    }
    onClose();
  }, [
    text,
    mode,
    messageId,
    messageImages,
    selectedFindingId,
    selectedQuestionId,
    onSaveAsNewFinding,
    onAddCommentToFinding,
    onAddCommentToQuestion,
    onClose,
  ]);

  if (!isOpen) return null;

  const hasFindings = findings && findings.length > 0 && onAddCommentToFinding;
  const hasQuestions = questions && questions.length > 0 && onAddCommentToQuestion;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Save insight"
    >
      <div
        ref={dialogRef}
        className="bg-surface-secondary border border-edge rounded-xl shadow-2xl w-full max-w-md mx-4 p-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-content mb-3">Save Insight</h3>

        {/* Editable text */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full resize-none bg-surface border border-edge rounded-lg px-3 py-2 text-xs text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
          rows={4}
          data-testid="save-insight-text"
        />

        {/* Save mode radio group */}
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Save destination</legend>

          {/* New finding option */}
          <label className="flex items-center gap-2 text-xs text-content cursor-pointer">
            <input
              type="radio"
              name="save-mode"
              value="new-finding"
              checked={mode === 'new-finding'}
              onChange={() => setMode('new-finding')}
              className="accent-blue-500"
            />
            Save as new finding
          </label>

          {/* Comment on finding option */}
          {hasFindings && (
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-content cursor-pointer">
                <input
                  type="radio"
                  name="save-mode"
                  value="comment-finding"
                  checked={mode === 'comment-finding'}
                  onChange={() => setMode('comment-finding')}
                  className="accent-blue-500"
                />
                Add as comment to finding
              </label>
              {mode === 'comment-finding' && (
                <select
                  value={selectedFindingId}
                  onChange={e => setSelectedFindingId(e.target.value)}
                  className="ml-6 w-[calc(100%-1.5rem)] bg-surface border border-edge rounded-lg px-2 py-1 text-xs text-content focus:outline-none focus:border-blue-500"
                  data-testid="save-insight-finding-select"
                >
                  {findings!.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.text.length > 60 ? f.text.slice(0, 60) + '...' : f.text}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Comment on question option */}
          {hasQuestions && (
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-content cursor-pointer">
                <input
                  type="radio"
                  name="save-mode"
                  value="comment-question"
                  checked={mode === 'comment-question'}
                  onChange={() => setMode('comment-question')}
                  className="accent-blue-500"
                />
                Add as comment to question
              </label>
              {mode === 'comment-question' && (
                <select
                  value={selectedQuestionId}
                  onChange={e => setSelectedQuestionId(e.target.value)}
                  className="ml-6 w-[calc(100%-1.5rem)] bg-surface border border-edge rounded-lg px-2 py-1 text-xs text-content focus:outline-none focus:border-blue-500"
                  data-testid="save-insight-question-select"
                >
                  {questions!.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.text.length > 60 ? h.text.slice(0, 60) + '...' : h.text}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </fieldset>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export { SaveInsightDialog };
