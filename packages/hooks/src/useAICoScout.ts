/**
 * useAICoScout - Session-only conversational AI state management.
 * Manages message history, send/retry/clear, streaming, and abort control.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  AIContext,
  CoScoutMessage,
  CoScoutError,
  AIErrorType,
  ResponsesApiConfig,
} from '@variscout/core';
import {
  buildCoScoutMessages,
  buildCoScoutSystemPrompt,
  buildCoScoutTools,
  streamResponsesTurn,
  traceAICall,
} from '@variscout/core';

export interface UseAICoScoutOptions {
  /** Current analysis context */
  context: AIContext | null;
  /** Injected fetch function (from aiService.ts) */
  fetchResponse?: (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) => Promise<string>;
  /** Injected streaming fetch function */
  fetchStreamingResponse?: (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    onChunk: (delta: string) => void,
    signal: AbortSignal
  ) => Promise<void>;
  /** Seed the conversation with the current narration */
  initialNarrative?: string | null;
  /** Called before building API messages — allows enriching context (e.g., Knowledge Base) */
  onBeforeSend?: (text: string, context: AIContext) => Promise<void>;
  /**
   * Optional Responses API config. When provided, uses the v1 Responses API
   * with stateful multi-turn via `previous_response_id` instead of the
   * injected fetch functions. Feature-flagged migration path.
   */
  responsesApiConfig?: ResponsesApiConfig;
}

export interface UseAICoScoutReturn {
  messages: CoScoutMessage[];
  send: (text: string) => void;
  retry: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  error: CoScoutError | null;
  clear: () => void;
  stopStreaming: () => void;
  copyLastResponse: () => Promise<boolean>;
}

let nextId = 0;
function generateId(): string {
  return `cos-${Date.now()}-${nextId++}`;
}

function classifyErrorToCoScoutError(err: unknown): CoScoutError {
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

export function useAICoScout(options: UseAICoScoutOptions): UseAICoScoutReturn {
  const {
    context,
    fetchResponse,
    fetchStreamingResponse,
    initialNarrative,
    onBeforeSend,
    responsesApiConfig,
  } = options;

  const [messages, setMessages] = useState<CoScoutMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<CoScoutError | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const narrativeSeeded = useRef(false);
  const streamingContentRef = useRef('');
  // Ref to always have current messages for async operations
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // Responses API: track previous response ID for multi-turn chaining
  const previousResponseIdRef = useRef<string | undefined>(undefined);

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
      const hasLegacyFetch = fetchResponse || fetchStreamingResponse;
      if (!context || (!hasLegacyFetch && !responsesApiConfig) || !text.trim()) return;

      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: CoScoutMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Allow enriching context before building messages (e.g., Knowledge Base search)
        if (onBeforeSend && context) {
          await onBeforeSend(text.trim(), context);
        }

        // Use ref for current history; buildCoScoutMessages appends the user message
        const apiMessages = buildCoScoutMessages(context, messagesRef.current, text.trim());

        // ── Responses API path (when configured) ──────────────────────────
        if (responsesApiConfig) {
          const instructions = buildCoScoutSystemPrompt(context);
          const tools = buildCoScoutTools();
          const placeholderId = generateId();
          const placeholder: CoScoutMessage = {
            id: placeholderId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, placeholder]);
          setIsStreaming(true);
          streamingContentRef.current = '';

          const { result: response } = await traceAICall({ feature: 'coscout' }, async () => {
            const resp = await streamResponsesTurn(
              responsesApiConfig,
              {
                input: text.trim(),
                instructions,
                tools,
                previous_response_id: previousResponseIdRef.current,
              },
              (delta: string) => {
                streamingContentRef.current += delta;
                const content = streamingContentRef.current;
                setMessages(prev =>
                  prev.map(m => (m.id === placeholderId ? { ...m, content } : m))
                );
              },
              controller.signal
            );
            return {
              result: resp,
              tokens: resp.usage
                ? {
                    inputTokens: resp.usage.input_tokens,
                    outputTokens: resp.usage.output_tokens,
                    totalTokens: resp.usage.total_tokens,
                  }
                : undefined,
            };
          });

          if (controller.signal.aborted) return;

          // Store response ID for multi-turn chaining
          previousResponseIdRef.current = response.id;
          setIsStreaming(false);
          setIsLoading(false);
          setError(null);
          return;
        }

        // ── Legacy Chat Completions path ───────────────────────────────────
        if (fetchStreamingResponse) {
          const placeholderId = generateId();
          const placeholder: CoScoutMessage = {
            id: placeholderId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, placeholder]);
          setIsStreaming(true);
          streamingContentRef.current = '';

          try {
            await traceAICall({ feature: 'coscout' }, async () => {
              await fetchStreamingResponse(
                apiMessages,
                (delta: string) => {
                  streamingContentRef.current += delta;
                  const content = streamingContentRef.current;
                  setMessages(prev =>
                    prev.map(m => (m.id === placeholderId ? { ...m, content } : m))
                  );
                },
                controller.signal
              );
              return { result: undefined };
            });
            if (controller.signal.aborted) return;
            setIsStreaming(false);
            setIsLoading(false);
            setError(null);
            return;
          } catch (streamErr) {
            if (controller.signal.aborted) return;
            // If streaming had partial content, keep it
            if (streamingContentRef.current) {
              setIsStreaming(false);
              setIsLoading(false);
              return;
            }
            // Remove the empty placeholder and fall through to non-streaming
            setMessages(prev => prev.filter(m => m.id !== placeholderId));
            setIsStreaming(false);
            // Fall through to non-streaming if available
            if (!fetchResponse) throw streamErr;
          }
        }

        // Non-streaming path
        if (fetchResponse) {
          const { result } = await traceAICall({ feature: 'coscout' }, async () => ({
            result: await fetchResponse(apiMessages),
          }));
          if (controller.signal.aborted) return;

          const assistantMessage: CoScoutMessage = {
            id: generateId(),
            role: 'assistant',
            content: result,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          setError(null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const coscoutError = classifyErrorToCoScoutError(err);
        setError(coscoutError);
        const errorMessage: CoScoutMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          error: coscoutError,
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsStreaming(false);
        }
      }
    },
    [context, fetchResponse, fetchStreamingResponse, onBeforeSend, responsesApiConfig]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

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
    setIsStreaming(false);
    setError(null);
    narrativeSeeded.current = false;
    previousResponseIdRef.current = undefined;
  }, []);

  const copyLastResponse = useCallback(async (): Promise<boolean> => {
    const msgs = messagesRef.current;
    // Find last non-error assistant message
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant' && !msgs[i].error && msgs[i].content) {
        try {
          await navigator.clipboard.writeText(msgs[i].content);
          return true;
        } catch {
          return false;
        }
      }
    }
    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    messages,
    send,
    retry,
    isLoading,
    isStreaming,
    error,
    clear,
    stopStreaming,
    copyLastResponse,
  };
}
