import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@variscout/hooks';
import { useIsMobile } from '../../hooks';
import { VoiceDraftButton, appendVoiceDraftText, type VoiceInputConfig } from '../VoiceInput';

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
  /** Optional Azure-only voice input that transcribes into the editor draft */
  voiceInput?: VoiceInputConfig;
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
  voiceInput,
}) => {
  const { t, locale } = useTranslation();
  const isMobile = useIsMobile();
  const resolvedPlaceholder = placeholder ?? t('finding.placeholder');
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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
    <div ref={editorRef} className="space-y-1">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={e => {
          if (editorRef.current?.contains(e.relatedTarget as Node | null)) {
            return;
          }
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
      <VoiceDraftButton
        voiceInput={voiceInput}
        mode={isMobile ? 'hold' : 'tap'}
        language={locale}
        onTranscript={transcript => {
          setText(prev => appendVoiceDraftText(prev, transcript));
          requestAnimationFrame(() => textareaRef.current?.focus());
        }}
        testIdPrefix="finding-editor-voice"
        className="flex items-center justify-end"
        buttonClassName="p-1 rounded text-content-muted hover:text-content transition-colors"
        cancelButtonClassName="p-1 rounded text-content-muted hover:text-content transition-colors"
        statusClassName="text-[0.625rem] text-content-muted"
        iconSize={12}
      />
    </div>
  );
};

export default FindingEditor;
