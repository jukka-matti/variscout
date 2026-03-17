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
} from 'lucide-react';
import type { CoScoutMessage, CoScoutError } from '@variscout/core';
import { useResizablePanel, useTranslation } from '@variscout/hooks';
import { CoScoutMessages, type KnowledgeDocumentResult } from './CoScoutMessages';

export interface CoScoutPanelResizeConfig {
  storageKey: string;
  min?: number;
  max?: number;
  defaultWidth?: number;
}

/** Customizable classes for app-specific styling of the CoScout panel. */
export interface CoScoutPanelColorScheme {
  container: string;
  headerBg: string;
}

export const defaultCoScoutPanelColorScheme: CoScoutPanelColorScheme = {
  container: 'bg-surface-secondary border-l border-edge',
  headerBg: 'border-b border-edge',
};

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
  onSend: (text: string) => void;
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
  /** Customizable color scheme (defaults to defaultCoScoutPanelColorScheme) */
  colorScheme?: Partial<CoScoutPanelColorScheme>;
  /** ADR-026: On-demand knowledge search */
  knowledgeAvailable?: boolean;
  knowledgeSearching?: boolean;
  knowledgeDocuments?: KnowledgeDocumentResult[];
  onSearchKnowledge?: () => void;
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
  colorScheme: csOverride,
  knowledgeAvailable,
  knowledgeSearching,
  knowledgeDocuments,
  onSearchKnowledge,
}) => {
  const { t } = useTranslation();
  const cs = { ...defaultCoScoutPanelColorScheme, ...csOverride };
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyConvFeedback, setCopyConvFeedback] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
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
    if (!text || isLoading) return;
    onSend(text);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend]);

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
        className={`flex-shrink-0 ${cs.container} flex flex-col overflow-hidden`}
        style={{ width }}
        data-testid="coscout-panel"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${cs.headerBg}`}>
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
              <li>Investigate root causes using progressive stratification</li>
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
        <div className="border-t border-edge p-3">
          <div className="flex items-end gap-2">
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
