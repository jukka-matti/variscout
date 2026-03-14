/**
 * useAICopilot - Session-only conversational AI state management.
 * Manages message history, send/retry/clear, and abort control.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AIContext, CopilotMessage, CopilotError, AIErrorType } from '@variscout/core';
import { buildCopilotMessages } from '@variscout/core';

export interface UseAICopilotOptions {
  /** Current analysis context */
  context: AIContext | null;
  /** Injected fetch function (from aiService.ts) */
  fetchResponse?: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  /** Seed the conversation with the current narration */
  initialNarrative?: string | null;
}

export interface UseAICopilotReturn {
  messages: CopilotMessage[];
  send: (text: string) => void;
  retry: () => void;
  isLoading: boolean;
  error: CopilotError | null;
  clear: () => void;
}

let nextId = 0;
function generateId(): string {
  return `cop-${Date.now()}-${nextId++}`;
}

function classifyErrorToCopilotError(err: unknown): CopilotError {
  const message = err instanceof Error ? err.message : String(err);
  let type: AIErrorType = 'unknown';
  if (message.includes('rate-limit') || message.includes('429')) type = 'rate-limit';
  else if (message.includes('auth') || message.includes('401') || message.includes('403'))
    type = 'auth';
  else if (message.includes('content-filter')) type = 'content-filter';
  else if (message.includes('network') || message.includes('fetch')) type = 'network';
  else if (message.includes('500') || message.includes('server')) type = 'server';

  const retryable = type !== 'rate-limit' && type !== 'content-filter';
  return { type, message: message.slice(0, 200), retryable };
}

export function useAICopilot(options: UseAICopilotOptions): UseAICopilotReturn {
  const { context, fetchResponse, initialNarrative } = options;

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CopilotError | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const narrativeSeeded = useRef(false);
  // Ref to always have current messages for async operations
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Seed initial narrative as first assistant message (one-shot)
  useEffect(() => {
    if (narrativeSeeded.current || !initialNarrative) return;
    narrativeSeeded.current = true;
    setMessages(prev => {
      if (prev.length > 0) return prev;
      return [
        {
          id: generateId(),
          role: 'assistant',
          content: initialNarrative,
          timestamp: Date.now(),
        },
      ];
    });
  }, [initialNarrative]);

  const send = useCallback(
    async (text: string) => {
      if (!context || !fetchResponse || !text.trim()) return;

      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: CopilotMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Use ref for current history; buildCopilotMessages appends the user message
        const apiMessages = buildCopilotMessages(context, messagesRef.current, text.trim());
        const result = await fetchResponse(apiMessages);
        if (controller.signal.aborted) return;

        const assistantMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: result,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const copilotError = classifyErrorToCopilotError(err);
        setError(copilotError);
        const errorMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          error: copilotError,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [context, fetchResponse]
  );

  const retry = useCallback(() => {
    const msgs = messagesRef.current;
    // Find the last user message
    const lastUserIdx = [...msgs].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const lastUser = msgs[msgs.length - 1 - lastUserIdx];

    // Remove trailing error messages and the last user message (send will re-add)
    setMessages(prev => {
      const trimmed = [...prev];
      while (trimmed.length > 0 && trimmed[trimmed.length - 1].error) {
        trimmed.pop();
      }
      if (trimmed.length > 0 && trimmed[trimmed.length - 1].role === 'user') {
        trimmed.pop();
      }
      return trimmed;
    });
    setError(null);

    // Let state update, then re-send
    setTimeout(() => send(lastUser.content), 0);
  }, [send]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
    setError(null);
    narrativeSeeded.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { messages, send, retry, isLoading, error, clear };
}
