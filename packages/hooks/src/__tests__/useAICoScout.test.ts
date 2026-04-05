import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAICoScout } from '../useAICoScout';
import type { AIContext, ResponsesApiConfig } from '@variscout/core';

// Use vi.hoisted so the mock references are available in the vi.mock factory.
const { mockStreamFn, mockTraceAICall } = vi.hoisted(() => ({
  mockStreamFn: vi.fn(),
  mockTraceAICall: vi.fn(
    async (_meta: unknown, fn: () => Promise<{ result: unknown; tokens?: unknown }>) => {
      const { result, tokens } = await fn();
      return { result, trace: { id: 'trace-1', feature: 'coscout', tokens, success: true } };
    }
  ),
}));

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Stub new assembler API (prompt building is tested in @variscout/core)
    assembleCoScoutPrompt: () => ({
      tier1Static: 'test-tier1',
      tier2SemiStatic: 'test-tier2',
      tier3Dynamic: '',
      tools: [],
    }),
    buildCoScoutMessageInput: (_history: unknown, userMessage: string) => [
      { role: 'user', content: userMessage },
    ],
    // Mocked side-effect functions
    streamResponsesWithToolLoop: mockStreamFn,
    traceAICall: mockTraceAICall,
  };
});

const baseContext: AIContext = {
  process: { description: 'Test process' },
  filters: [],
  stats: { mean: 10, stdDev: 1, samples: 50 },
};

const mockConfig: ResponsesApiConfig = {
  endpoint: 'https://test.openai.azure.com',
  deployment: 'gpt-4o',
  apiKey: 'test-key',
};

describe('useAICoScout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with empty messages and no loading', () => {
    const { result } = renderHook(() => useAICoScout({ context: baseContext }));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does nothing when send is called without responsesApiConfig', async () => {
    const { result } = renderHook(() => useAICoScout({ context: baseContext }));
    await act(async () => {
      result.current.send('Hello');
    });
    expect(result.current.messages).toEqual([]);
  });

  it('send appends user and assistant messages via Responses API', async () => {
    mockStreamFn.mockImplementation(
      async (_config: unknown, _req: unknown, _handlers: unknown, onChunk: (d: string) => void) => {
        onChunk('AI response');
        return {
          id: 'resp_001',
          output: [{ type: 'message', content: [{ type: 'text', text: 'AI response' }] }],
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        };
      }
    );

    const { result } = renderHook(() =>
      useAICoScout({ context: baseContext, responsesApiConfig: mockConfig })
    );

    await act(async () => {
      await result.current.send('What is Cpk?');
    });

    expect(mockStreamFn).toHaveBeenCalledOnce();
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('What is Cpk?');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].error).toBeUndefined();
  });

  it('sets error on fetch failure', async () => {
    mockStreamFn.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() =>
      useAICoScout({ context: baseContext, responsesApiConfig: mockConfig })
    );

    await act(async () => {
      result.current.send('Question');
    });

    expect(result.current.error).not.toBeNull();
    const errorMsgs = result.current.messages.filter(m => m.error);
    expect(errorMsgs.length).toBeGreaterThan(0);
  });

  it('clear resets all state', async () => {
    mockStreamFn.mockImplementation(
      async (_config: unknown, _req: unknown, _handlers: unknown, onChunk: (d: string) => void) => {
        onChunk('Response');
        return {
          id: 'resp_001',
          output: [{ type: 'message', content: [{ type: 'text', text: 'Response' }] }],
        };
      }
    );

    const { result } = renderHook(() =>
      useAICoScout({ context: baseContext, responsesApiConfig: mockConfig })
    );

    await act(async () => {
      await result.current.send('Question');
    });
    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clear();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('seeds initial narrative as first assistant message', () => {
    const { result } = renderHook(() =>
      useAICoScout({
        context: baseContext,
        initialNarrative: 'Process is stable with Cpk 1.5',
      })
    );

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toBe('Process is stable with Cpk 1.5');
  });

  it('does not seed narrative twice', () => {
    const { result, rerender } = renderHook(props => useAICoScout(props), {
      initialProps: { context: baseContext, initialNarrative: 'Narrative text' },
    });

    expect(result.current.messages).toHaveLength(1);

    rerender({ context: baseContext, initialNarrative: 'Updated narrative' });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Narrative text');
  });

  it('does not send empty or whitespace-only messages', async () => {
    const { result } = renderHook(() =>
      useAICoScout({ context: baseContext, responsesApiConfig: mockConfig })
    );

    await act(async () => {
      result.current.send('   ');
    });
    expect(mockStreamFn).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('does not send when context is null', async () => {
    const { result } = renderHook(() =>
      useAICoScout({ context: null, responsesApiConfig: mockConfig })
    );

    await act(async () => {
      result.current.send('Question');
    });
    expect(mockStreamFn).not.toHaveBeenCalled();
  });

  describe('copyLastResponse', () => {
    it('copies last assistant message to clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      mockStreamFn.mockImplementation(
        async (
          _config: unknown,
          _req: unknown,
          _handlers: unknown,
          onChunk: (d: string) => void
        ) => {
          onChunk('AI response text');
          return {
            id: 'resp_001',
            output: [{ type: 'message', content: [{ type: 'text', text: 'AI response text' }] }],
          };
        }
      );

      const { result } = renderHook(() =>
        useAICoScout({ context: baseContext, responsesApiConfig: mockConfig })
      );

      await act(async () => {
        await result.current.send('Question');
      });

      expect(result.current.messages).toHaveLength(2);

      let success = false;
      await act(async () => {
        success = await result.current.copyLastResponse();
      });
      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith('AI response text');
    });

    it('returns false when no assistant messages exist', async () => {
      const { result } = renderHook(() => useAICoScout({ context: baseContext }));

      let success = true;
      await act(async () => {
        success = await result.current.copyLastResponse();
      });
      expect(success).toBe(false);
    });
  });

  describe('tool handlers', () => {
    it('passes tool handlers to streamResponsesWithToolLoop', async () => {
      mockStreamFn.mockImplementation(
        async (
          _config: unknown,
          _req: unknown,
          _handlers: unknown,
          onChunk: (d: string) => void
        ) => {
          onChunk('Response');
          return {
            id: 'resp_001',
            output: [{ type: 'message', content: [{ type: 'text', text: 'Response' }] }],
          };
        }
      );

      const toolHandlers = {
        get_chart_data: vi.fn(async () => '{}'),
        search_knowledge_base: vi.fn(async () => '[]'),
      };

      const { result } = renderHook(() =>
        useAICoScout({
          context: baseContext,
          responsesApiConfig: mockConfig,
          toolHandlers,
        })
      );

      await act(async () => {
        await result.current.send('Tell me about the process');
      });

      expect(mockStreamFn).toHaveBeenCalledOnce();
      // The third argument to streamResponsesWithToolLoop is the tool handlers
      const passedHandlers = mockStreamFn.mock.calls[0][2];
      expect(passedHandlers).toBe(toolHandlers);
    });

    it('stores previous_response_id for multi-turn chaining', async () => {
      let callCount = 0;
      mockStreamFn.mockImplementation(
        async (
          _config: unknown,
          _req: unknown,
          _handlers: unknown,
          onChunk: (d: string) => void
        ) => {
          callCount++;
          onChunk(`Response ${callCount}`);
          return {
            id: `resp_00${callCount}`,
            output: [
              { type: 'message', content: [{ type: 'text', text: `Response ${callCount}` }] },
            ],
          };
        }
      );

      const { result } = renderHook(() =>
        useAICoScout({ context: baseContext, responsesApiConfig: mockConfig })
      );

      // First message
      await act(async () => {
        await result.current.send('First question');
      });
      expect(result.current.messages).toHaveLength(2);

      // Second message — should chain with previous_response_id
      await act(async () => {
        await result.current.send('Follow-up');
      });
      expect(result.current.messages).toHaveLength(4);

      expect(mockStreamFn).toHaveBeenCalledTimes(2);
      const secondCallRequest = mockStreamFn.mock.calls[1][1] as Record<string, unknown>;
      expect(secondCallRequest.previous_response_id).toBe('resp_001');
    });
  });
});
