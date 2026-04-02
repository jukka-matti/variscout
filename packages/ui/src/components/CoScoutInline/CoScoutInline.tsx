import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Send, Square } from 'lucide-react';
import type { CoScoutMessage, CoScoutError, InvestigationPhase } from '@variscout/core';
import { formatForMobile } from '@variscout/core/ai';
import { InvestigationPhaseBadge } from '../InvestigationPhaseBadge';
import { CoScoutMessages, type KnowledgeDocumentResult } from '../CoScoutPanel/CoScoutMessages';
import { useIsMobile } from '../../hooks';

export interface CoScoutInlineProps {
  messages: CoScoutMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  error?: CoScoutError | null;
  onRetry?: () => void;
  phase?: InvestigationPhase;
  suggestedQuestions?: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  /** ADR-026: On-demand knowledge search */
  knowledgeAvailable?: boolean;
  knowledgeSearching?: boolean;
  knowledgeDocuments?: KnowledgeDocumentResult[];
  onSearchKnowledge?: () => void;
}

const CoScoutInline: React.FC<CoScoutInlineProps> = ({
  messages,
  onSend,
  isLoading,
  isStreaming,
  onStopStreaming,
  error: _error,
  onRetry,
  phase,
  suggestedQuestions,
  isExpanded,
  onToggleExpand,
  knowledgeAvailable,
  knowledgeSearching,
  knowledgeDocuments,
  onSearchKnowledge,
}) => {
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCount = useRef(messages.length);

  // Auto-expand when new messages arrive while collapsed
  useEffect(() => {
    if (!isExpanded && messages.length > prevMessageCount.current) {
      onToggleExpand();
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, isExpanded, onToggleExpand]);

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    onSend(text);
    setInput('');
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }, []);

  const handleChipClick = useCallback(
    (question: string) => {
      onSend(question);
      if (!isExpanded) {
        onToggleExpand();
      }
    },
    [onSend, isExpanded, onToggleExpand]
  );

  const showQuestionChips =
    suggestedQuestions && suggestedQuestions.length > 0 && !isLoading && !isStreaming;

  return (
    <div
      className="border-t border-edge bg-surface-secondary flex flex-col"
      data-testid="coscout-inline"
    >
      {/* Header bar — always visible */}
      <button
        onClick={onToggleExpand}
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-surface-tertiary/50 transition-colors"
        data-testid="coscout-inline-toggle"
      >
        <span className="text-[0.6875rem] font-medium text-content-secondary">CoScout</span>
        {phase && <InvestigationPhaseBadge phase={phase} />}
        <span className="flex-1" />
        {isExpanded ? (
          <ChevronDown size={12} className="text-content-muted" />
        ) : (
          <ChevronUp size={12} className="text-content-muted" />
        )}
      </button>

      {/* Collapsed: horizontal question chips */}
      {!isExpanded && showQuestionChips && (
        <div
          className="overflow-x-auto flex gap-1.5 px-3 pb-2"
          data-testid="coscout-inline-suggestions"
        >
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              data-testid={`coscout-inline-suggestion-${i}`}
              onClick={() => handleChipClick(q)}
              className="bg-surface-tertiary text-content-secondary text-[0.625rem] px-2.5 py-1 whitespace-nowrap rounded-full hover:bg-surface-tertiary/80 hover:text-content transition-colors flex-shrink-0"
            >
              {isMobile ? formatForMobile(q) : q}
            </button>
          ))}
        </div>
      )}

      {/* Expanded: messages + input */}
      {isExpanded && (
        <div className="flex flex-col min-h-0" style={{ maxHeight: '50%' }}>
          {/* Messages area */}
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

          {/* Suggested question chips (expanded) */}
          {showQuestionChips && (
            <div
              className="overflow-x-auto flex gap-1.5 px-3 py-1.5 border-t border-edge"
              data-testid="coscout-inline-suggestions"
            >
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  data-testid={`coscout-inline-suggestion-${i}`}
                  onClick={() => handleChipClick(q)}
                  className="bg-surface-tertiary text-content-secondary text-[0.625rem] px-2.5 py-1 whitespace-nowrap rounded-full hover:bg-surface-tertiary/80 hover:text-content transition-colors flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-edge p-2">
            <div className="flex items-end gap-1.5">
              <textarea
                ref={textareaRef}
                data-testid="coscout-inline-input"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask CoScout..."
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none bg-surface border border-edge rounded-lg px-2.5 py-1.5 text-xs text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
              {isStreaming ? (
                <button
                  onClick={onStopStreaming}
                  className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex-shrink-0"
                  title="Stop"
                  aria-label="Stop streaming"
                  data-testid="coscout-inline-stop"
                >
                  <Square size={12} />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Send"
                  aria-label="Send message"
                >
                  <Send size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { CoScoutInline };
