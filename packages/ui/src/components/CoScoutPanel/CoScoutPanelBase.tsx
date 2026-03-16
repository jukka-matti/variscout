import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, X, Send, MoreVertical, Square, Copy, RotateCw, Check } from 'lucide-react';
import type { CoScoutMessage, CoScoutError } from '@variscout/core';
import { useResizablePanel } from '@variscout/hooks';
import { CoScoutMessages } from './CoScoutMessages';

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
  resizeConfig: CoScoutPanelResizeConfig;
  suggestedQuestions?: string[];
  onSuggestedQuestionClick?: (question: string) => void;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  /** Customizable color scheme (defaults to defaultCoScoutPanelColorScheme) */
  colorScheme?: Partial<CoScoutPanelColorScheme>;
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
  resizeConfig,
  suggestedQuestions,
  onSuggestedQuestionClick,
  isStreaming,
  onStopStreaming,
  colorScheme: csOverride,
}) => {
  const cs = { ...defaultCoScoutPanelColorScheme, ...csOverride };
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
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
          <h2 className="text-sm font-semibold text-content">CoScout</h2>
          <div className="flex items-center gap-1">
            {/* Overflow menu */}
            {(onClear || onCopyLastResponse) && messages.length > 0 && (
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
                        Clear conversation
                      </button>
                    )}
                    {onCopyLastResponse && (
                      <button
                        onClick={handleCopyLastResponse}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors rounded-b-lg"
                        data-testid="coscout-menu-copy"
                      >
                        {copyFeedback ? <Check size={12} /> : <Copy size={12} />}
                        {copyFeedback ? 'Copied!' : 'Copy last response'}
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

        {/* Messages */}
        <CoScoutMessages
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onRetry={onRetry}
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
                title="Stop"
                aria-label="Stop streaming"
                data-testid="coscout-stop-button"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title="Send"
                aria-label="Send message"
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
