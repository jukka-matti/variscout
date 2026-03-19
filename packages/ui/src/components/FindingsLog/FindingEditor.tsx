import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@variscout/hooks';

export interface FindingEditorProps {
  /** Initial text value */
  initialText?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Called when the user saves (Enter) */
  onSave: (text: string) => void;
  /** Called when the user cancels (Escape) */
  onCancel: () => void;
  /** Auto-focus the textarea on mount */
  autoFocus?: boolean;
}

/**
 * Inline textarea editor for finding notes.
 * Enter = save, Escape = cancel, Shift+Enter = newline.
 */
const FindingEditor: React.FC<FindingEditorProps> = ({
  initialText = '',
  placeholder,
  onSave,
  onCancel,
  autoFocus = true,
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('finding.placeholder');
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed) {
        onSave(trimmed);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={e => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const trimmed = text.trim();
        if (trimmed) {
          onSave(trimmed);
        } else {
          onCancel();
        }
      }}
      placeholder={resolvedPlaceholder}
      rows={2}
      className="w-full bg-surface border border-edge rounded px-2 py-1.5 text-xs text-content placeholder:text-content-muted outline-none focus:border-blue-500 resize-none"
      aria-label={t('finding.note')}
    />
  );
};

export default FindingEditor;
