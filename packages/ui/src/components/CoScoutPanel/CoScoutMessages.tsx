import React, { useEffect, useRef } from 'react';
import type { CoScoutMessage, CoScoutError } from '@variscout/core';

function getErrorText(error: CoScoutError): string {
  switch (error.type) {
    case 'rate-limit':
      return 'Please wait a moment before asking again.';
    case 'content-filter':
      return "I can't answer that question. Try rephrasing.";
    default:
      return 'Something went wrong.';
  }
}

export interface CoScoutMessagesProps {
  messages: CoScoutMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  onRetry?: () => void;
  knowledgeResultCount?: number;
}

const CoScoutMessages: React.FC<CoScoutMessagesProps> = ({
  messages,
  isLoading,
  isStreaming,
  onRetry,
  knowledgeResultCount,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming content
  const lastMessageContent = messages.length > 0 ? messages[messages.length - 1]?.content : '';
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages.length, isLoading, lastMessageContent]);

  const showLoadingDots =
    isLoading &&
    (!isStreaming ||
      (isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === ''));

  return (
    <div
      className="flex-1 overflow-y-auto p-3 space-y-3"
      data-testid="coscout-messages"
      role="log"
      aria-live="polite"
    >
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          data-testid={`coscout-message-${index}`}
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

      {/* Knowledge Base search indicator */}
      {knowledgeResultCount != null && knowledgeResultCount > 0 && isLoading && (
        <div className="flex justify-start" data-testid="coscout-knowledge-indicator">
          <div className="text-[10px] text-violet-400 flex items-center gap-1 px-3">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
            Searching {knowledgeResultCount} related findings...
          </div>
        </div>
      )}

      {/* Loading indicator — show when loading and not yet streaming content */}
      {showLoadingDots && (
        <div className="flex justify-start" data-testid="coscout-loading-dots">
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
  );
};

export { CoScoutMessages };
