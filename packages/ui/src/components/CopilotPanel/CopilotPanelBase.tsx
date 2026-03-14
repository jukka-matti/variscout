import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, X, Send, RotateCw } from 'lucide-react';
import type { CopilotMessage, CopilotError } from '@variscout/core';
import { useResizablePanel } from '@variscout/hooks';

export interface CopilotPanelResizeConfig {
  storageKey: string;
  min?: number;
  max?: number;
  defaultWidth?: number;
}

export interface CopilotPanelBaseProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CopilotMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  error?: CopilotError | null;
  onRetry?: () => void;
  onClear?: () => void;
  resizeConfig: CopilotPanelResizeConfig;
}

function getErrorText(error: CopilotError): string {
  switch (error.type) {
    case 'rate-limit':
      return 'Please wait a moment before asking again.';
    case 'content-filter':
      return "I can't answer that question. Try rephrasing.";
    default:
      return 'Something went wrong.';
  }
}

const CopilotPanelBase: React.FC<CopilotPanelBaseProps> = ({
  isOpen,
  onClose,
  messages,
  onSend,
  isLoading,
  error: _error,
  onRetry,
  onClear,
  resizeConfig,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { width, isDragging, handleMouseDown } = useResizablePanel(
    resizeConfig.storageKey,
    resizeConfig.min ?? 320,
    resizeConfig.max ?? 600,
    resizeConfig.defaultWidth ?? 384
  );

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

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
        data-testid="copilot-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
          <h2 className="text-sm font-semibold text-content">Copilot</h2>
          <div className="flex items-center gap-1">
            {onClear && messages.length > 0 && (
              <button
                onClick={onClear}
                className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <RotateCw size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-content-secondary hover:text-content hover:bg-surface-tertiary rounded-lg transition-colors"
              title="Close"
              aria-label="Close copilot panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              data-testid={`copilot-message-${index}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.error ? (
                <div className="max-w-[90%] bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-400">{getErrorText(msg.error)}</p>
                  {msg.error.retryable && onRetry && (
                    <button
                      onClick={onRetry}
                      className="mt-2 text-[11px] text-red-300 hover:text-red-200 underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : msg.role === 'user' ? (
                <div className="max-w-[85%] bg-surface-tertiary rounded-lg p-3">
                  <p className="text-xs text-content leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className="max-w-[90%] border border-edge rounded-lg p-3">
                  <p className="text-xs text-content-secondary leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="border border-edge rounded-lg p-3">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <div className="border-t border-edge p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              data-testid="copilot-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your analysis..."
              rows={1}
              className="flex-1 resize-none bg-surface border border-edge rounded-lg px-3 py-2 text-xs text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              title="Send"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export { CopilotPanelBase };
