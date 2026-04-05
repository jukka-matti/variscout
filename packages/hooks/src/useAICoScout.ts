/**
 * useAICoScout - Session-only conversational AI state management.
 * Uses the Responses API exclusively with automatic tool call loop (ADR-028).
 * Manages message history, send/retry/clear, streaming, and abort control.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  AIContext,
  CoScoutMessage,
  CoScoutError,
  AIErrorType,
  ResponsesApiConfig,
  ToolHandlerMap,
  BuildCoScoutToolsOptions,
} from '@variscout/core';
import {
  buildCoScoutInput,
  buildCoScoutTools,
  streamResponsesWithToolLoop,
  traceAICall,
  getCoScoutReasoningEffort,
} from '@variscout/core';

export interface UseAICoScoutOptions {
  /** Current analysis context */
  context: AIContext | null;
  /** Seed the conversation with the current narration */
  initialNarrative?: string | null;
  /** Responses API config — required for sending messages */
  responsesApiConfig?: ResponsesApiConfig;
  /** Tool handlers for function calling */
  toolHandlers?: ToolHandlerMap;
  /** Phase-gating options for tool availability (ADR-029) */
  toolsOptions?: BuildCoScoutToolsOptions;
}

export interface UseAICoScoutReturn {
  messages: CoScoutMessage[];
  send: (text: string, images?: Array<{ id: string; dataUrl: string; mimeType: string }>) => void;
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
  const { context, initialNarrative, responsesApiConfig, toolHandlers, toolsOptions } = options;

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
    async (text: string, images?: Array<{ id: string; dataUrl: string; mimeType: string }>) => {
      if (!context || !responsesApiConfig || !text.trim()) return;

      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: CoScoutMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
        ...(images?.length
          ? {
              images: images.map(img => ({
                id: img.id,
                dataUrl: img.dataUrl,
                mimeType: img.mimeType as 'image/jpeg' | 'image/png',
                sizeBytes: Math.round(img.dataUrl.length * 0.75), // approximate decoded size
              })),
            }
          : {}),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const hasImages = images && images.length > 0;

      try {
        // Build Responses API input (pass journeyPhase so tool routing instructions reach the LLM)
        const { instructions, input } = buildCoScoutInput(
          context,
          messagesRef.current,
          text.trim(),
          {
            journeyPhase: toolsOptions?.phase,
            isTeamPlan: toolsOptions?.isTeamPlan,
            ...(hasImages ? { images: images.map(img => ({ dataUrl: img.dataUrl })) } : {}),
          }
        );
        const tools = buildCoScoutTools(toolsOptions);

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
          const resp = await streamResponsesWithToolLoop(
            responsesApiConfig,
            {
              input,
              instructions,
              tools,
              previous_response_id: previousResponseIdRef.current,
              store: !hasImages,
              prompt_cache_key: 'variscout-coscout',
              reasoning: {
                effort: getCoScoutReasoningEffort(
                  toolsOptions?.phase,
                  toolsOptions?.investigationPhase,
                  context?.stagedComparison != null
                ),
              },
            },
            toolHandlers || {},
            (delta: string) => {
              streamingContentRef.current += delta;
              const content = streamingContentRef.current;
              setMessages(prev => prev.map(m => (m.id === placeholderId ? { ...m, content } : m)));
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
                  cachedTokens: resp.usage.input_tokens_details?.cached_tokens,
                  reasoningTokens: resp.usage.output_tokens_details?.reasoning_tokens,
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
    [context, responsesApiConfig, toolHandlers, toolsOptions]
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
