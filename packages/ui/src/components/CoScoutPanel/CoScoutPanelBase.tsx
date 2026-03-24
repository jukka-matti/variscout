import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GripVertical,
  X,
  Send,
  MoreVertical,
  Square,
  Copy,
  RotateCw,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Paperclip,
} from 'lucide-react';
import type { CoScoutMessage, CoScoutError, ActionProposal } from '@variscout/core';
import { validateImageFile, fileToDataUrl, MAX_IMAGES_PER_MESSAGE } from '@variscout/core/ai';
import { useResizablePanel, useTranslation } from '@variscout/hooks';
import { CoScoutMessages, type KnowledgeDocumentResult } from './CoScoutMessages';
import { ImagePreview, type ImagePreviewItem } from './ImagePreview';

export interface CoScoutPanelResizeConfig {
  storageKey: string;
  min?: number;
  max?: number;
  defaultWidth?: number;
}

/** Summary of AI context for transparency disclosure */
export interface AIContextSummary {
  stats: string;
  filterCount: number;
  findingCount: number;
  phase?: string;
}

export interface CoScoutPanelBaseProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CoScoutMessage[];
  onSend: (text: string, images?: ImagePreviewItem[]) => void;
  isLoading: boolean;
  error?: CoScoutError | null;
  onRetry?: () => void;
  onClear?: () => void;
  onCopyLastResponse?: () => void;
  /** Copy entire conversation to clipboard */
  onCopyConversation?: () => void;
  resizeConfig: CoScoutPanelResizeConfig;
  suggestedQuestions?: string[];
  onSuggestedQuestionClick?: (question: string) => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  /** AI model provider label (e.g. "Claude", "Azure OpenAI") */
  providerLabel?: string;
  /** AI context summary for transparency disclosure card */
  aiContextSummary?: AIContextSummary | null;
  /** ADR-026: On-demand knowledge search */
  knowledgeAvailable?: boolean;
  knowledgeSearching?: boolean;
  knowledgeDocuments?: KnowledgeDocumentResult[];
  onSearchKnowledge?: () => void;
  /** Friendly label for the KB search scope (e.g., folder name) */
  knowledgeSearchScope?: string;
  /** Timestamp of last KB search completion */
  knowledgeSearchTimestamp?: number;
  /** Show warning when SharePoint admin consent is missing */
  knowledgePermissionWarning?: boolean;
  /** ADR-029: Action proposals for inline confirmation */
  actionProposals?: ActionProposal[];
  onExecuteAction?: (proposal: ActionProposal, editedText?: string) => void;
  onDismissAction?: (proposalId: string) => void;
  /** ADR-049: Insight capture — save message as finding or comment */
  onSaveAsNewFinding?: (text: string, sourceMessageId: string) => void;
  onAddCommentToFinding?: (findingId: string, text: string) => void;
  onAddCommentToHypothesis?: (hypothesisId: string, text: string) => void;
  /** Existing findings for insight dialog target selection */
  insightFindings?: Array<{ id: string; text: string }>;
  /** Existing hypotheses for insight dialog target selection */
  insightHypotheses?: Array<{ id: string; text: string }>;
}

const CoScoutPanelBase: React.FC<CoScoutPanelBaseProps> = ({
  isOpen,
  onClose,
  messages,
  onSend,
  isLoading,
  error: _error,
  onRetry,
  onClear,
  onCopyLastResponse,
  onCopyConversation,
  resizeConfig,
  suggestedQuestions,
  onSuggestedQuestionClick,
  isStreaming,
  onStopStreaming,
  providerLabel,
  aiContextSummary,
  knowledgeAvailable,
  knowledgeSearching,
  knowledgeDocuments,
  onSearchKnowledge,
  knowledgeSearchScope,
  knowledgeSearchTimestamp,
  knowledgePermissionWarning,
  actionProposals,
  onExecuteAction,
  onDismissAction,
  onSaveAsNewFinding,
  onAddCommentToFinding,
  onAddCommentToHypothesis,
  insightFindings,
  insightHypotheses,
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyConvFeedback, setCopyConvFeedback] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [pendingImages, setPendingImages] = useState<ImagePreviewItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { width, isDragging, handleMouseDown } = useResizablePanel(
    resizeConfig.storageKey,
    resizeConfig.min ?? 320,
    resizeConfig.max ?? 600,
    resizeConfig.defaultWidth ?? 384
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (overflowOpen) {
          setOverflowOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, overflowOpen]);

  // Close overflow on click outside
  useEffect(() => {
    if (!overflowOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [overflowOpen]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Cleanup blur timeout
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if ((!text && pendingImages.length === 0) || isLoading) return;
    if (!text) return; // text is still required even with images
    if (pendingImages.length > 0) {
      onSend(text, pendingImages);
    } else {
      onSend(text);
    }
    setInput('');
    setPendingImages([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend, pendingImages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-grow textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'; // max ~4 rows
  }, []);

  const handleInputFocus = useCallback(() => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setInputFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Delay hiding chips so click can register
    blurTimeoutRef.current = setTimeout(() => setInputFocused(false), 200);
  }, []);

  const addImageFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      const valid = await validateImageFile(file);
      if (!valid) continue;

      const dataUrl = await fileToDataUrl(file);
      setPendingImages(prev => {
        if (prev.length >= MAX_IMAGES_PER_MESSAGE) return prev;
        const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : `img-${Date.now()}`;
        return [...prev, { id, dataUrl, filename: file.name, mimeType: file.type }];
      });
    }
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        await addImageFiles(imageFiles);
      }
    },
    [addImageFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const hasImages = Array.from(e.dataTransfer.items).some(i => i.type.startsWith('image/'));
    if (hasImages) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        await addImageFiles(files);
      }
    },
    [addImageFiles]
  );

  const handleRemoveImage = useCallback((id: string) => {
    setPendingImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const handleClearWithConfirm = useCallback(() => {
    setOverflowOpen(false);
    if (window.confirm('Clear conversation?')) {
      onClear?.();
    }
  }, [onClear]);

  const handleCopyLastResponse = useCallback(() => {
    setOverflowOpen(false);
    onCopyLastResponse?.();
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [onCopyLastResponse]);

  const handleCopyConversation = useCallback(() => {
    setOverflowOpen(false);
    onCopyConversation?.();
    setCopyConvFeedback(true);
    setTimeout(() => setCopyConvFeedback(false), 1500);
  }, [onCopyConversation]);

  if (!isOpen) return null;

  const showSuggestions =
    suggestedQuestions &&
    suggestedQuestions.length > 0 &&
    !inputFocused &&
    !isLoading &&
    !isStreaming;

  return (
    <>
      {/* Draggable divider */}
      <div
        className={`w-1 bg-surface-tertiary hover:bg-blue-500 cursor-col-resize flex-shrink-0 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical size={12} className="text-content-muted" />
      </div>

      {/* Panel */}
      <div
        className="flex-shrink-0 bg-surface-secondary border-l border-edge flex flex-col overflow-hidden"
        style={{ width }}
        data-testid="coscout-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <div>
            <h2 className="text-sm font-semibold text-content">CoScout</h2>
            {providerLabel && (
              <span className="text-[10px] text-content-muted">{providerLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Overflow menu */}
            {(onClear || onCopyLastResponse || onCopyConversation) && messages.length > 0 && (
              <div className="relative" ref={overflowRef}>
                <button
                  onClick={() => setOverflowOpen(prev => !prev)}
                  className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
                  title="More options"
                  aria-label="More options"
                  data-testid="coscout-overflow-menu"
                >
                  <MoreVertical size={14} />
                </button>
                {overflowOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-surface-secondary border border-edge rounded-lg shadow-xl z-50 min-w-[180px]">
                    {onClear && (
                      <button
                        onClick={handleClearWithConfirm}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors rounded-t-lg"
                        data-testid="coscout-menu-clear"
                      >
                        <RotateCw size={12} />
                        {t('coscout.clear')}
                      </button>
                    )}
                    {onCopyConversation && (
                      <button
                        onClick={handleCopyConversation}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
                        data-testid="coscout-menu-copy-conversation"
                      >
                        {copyConvFeedback ? <Check size={12} /> : <ClipboardCopy size={12} />}
                        {copyConvFeedback ? 'Copied!' : t('action.copyAll')}
                      </button>
                    )}
                    {onCopyLastResponse && (
                      <button
                        onClick={handleCopyLastResponse}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors rounded-b-lg"
                        data-testid="coscout-menu-copy"
                      >
                        {copyFeedback ? <Check size={12} /> : <Copy size={12} />}
                        {copyFeedback ? 'Copied!' : t('action.copy')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
              title="Close"
              aria-label="Close CoScout panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Context disclosure card (T1) */}
        {aiContextSummary && (
          <div className="px-3 pt-2">
            <button
              onClick={() => setContextExpanded(prev => !prev)}
              className="flex items-center gap-1 text-[10px] text-content-muted hover:text-content-secondary transition-colors"
              aria-expanded={contextExpanded}
              data-testid="coscout-context-toggle"
            >
              {contextExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              AI context
            </button>
            {contextExpanded && (
              <div
                className="mt-1 px-2 py-1.5 bg-surface-tertiary/50 rounded text-[10px] text-content-muted space-y-0.5"
                data-testid="coscout-context-details"
              >
                <div>Stats: {aiContextSummary.stats}</div>
                <div>Filters: {aiContextSummary.filterCount}</div>
                <div>Findings: {aiContextSummary.findingCount}</div>
                {aiContextSummary.phase && <div>Phase: {aiContextSummary.phase}</div>}
              </div>
            )}
          </div>
        )}

        {/* Empty state with capabilities (T12) */}
        {messages.length === 0 && !isLoading && (
          <div className="px-4 py-6 text-center" data-testid="coscout-empty-state">
            <p className="text-xs font-medium text-content-secondary mb-3">I can help you:</p>
            <ul className="text-[11px] text-content-muted space-y-1.5 text-left max-w-[240px] mx-auto">
              <li>Understand patterns in your process data</li>
              <li>Investigate suspected causes using progressive stratification</li>
              <li>Interpret capability metrics and Contribution %</li>
              <li>Suggest next steps in your investigation</li>
            </ul>
          </div>
        )}

        {/* Messages */}
        <CoScoutMessages
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onRetry={onRetry}
          knowledgeAvailable={knowledgeAvailable}
          knowledgeSearching={knowledgeSearching}
          knowledgeDocuments={knowledgeDocuments}
          onSearchKnowledge={onSearchKnowledge}
          knowledgeSearchScope={knowledgeSearchScope}
          knowledgeSearchTimestamp={knowledgeSearchTimestamp}
          knowledgePermissionWarning={knowledgePermissionWarning}
          actionProposals={actionProposals}
          onExecuteAction={onExecuteAction}
          onDismissAction={onDismissAction}
          onSaveAsNewFinding={onSaveAsNewFinding}
          onAddCommentToFinding={onAddCommentToFinding}
          onAddCommentToHypothesis={onAddCommentToHypothesis}
          insightFindings={insightFindings}
          insightHypotheses={insightHypotheses}
        />

        {/* Suggested question chips */}
        {showSuggestions && (
          <div
            className="overflow-x-auto flex gap-2 px-3 py-2 border-t border-edge"
            data-testid="coscout-suggested-questions"
          >
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                data-testid={`coscout-suggestion-${i}`}
                onClick={() => onSuggestedQuestionClick?.(q)}
                className="bg-surface-tertiary text-content-secondary text-xs px-3 py-1.5 whitespace-nowrap rounded-full hover:bg-surface-tertiary/80 hover:text-content transition-colors flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input footer */}
        <div
          className={`border-t border-edge${isDragOver ? ' ring-2 ring-blue-400 ring-inset' : ''}`}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="coscout-input-footer"
        >
          {pendingImages.length > 0 && (
            <div className="pt-2">
              <ImagePreview images={pendingImages} onRemove={handleRemoveImage} />
            </div>
          )}
          <div className="flex items-end gap-2 p-3">
            <textarea
              ref={textareaRef}
              data-testid="coscout-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Ask about your analysis..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-surface border border-edge rounded-lg px-3 py-2 text-xs text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            {pendingImages.length < MAX_IMAGES_PER_MESSAGE && !isStreaming && (
              <label
                className="p-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors flex-shrink-0 cursor-pointer"
                title="Attach image (or paste / drag-drop)"
                aria-label="Attach image"
                data-testid="coscout-attach-image"
              >
                <Paperclip size={14} />
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="sr-only"
                  onChange={e => {
                    if (e.target.files) {
                      void addImageFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            )}
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex-shrink-0"
                title={t('coscout.stop')}
                aria-label={t('coscout.stop')}
                data-testid="coscout-stop-button"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title={t('coscout.send')}
                aria-label={t('coscout.send')}
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export { CoScoutPanelBase };
