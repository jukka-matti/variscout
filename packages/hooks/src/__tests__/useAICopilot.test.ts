import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAICopilot } from '../useAICopilot';
import type { AIContext } from '@variscout/core';

const baseContext: AIContext = {
  process: { description: 'Test process' },
  filters: [],
  stats: { mean: 10, stdDev: 1, samples: 50 },
};

describe('useAICopilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with empty messages and no loading', () => {
    const { result } = renderHook(() => useAICopilot({ context: baseContext }));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does nothing when send is called without fetchResponse', async () => {
    const { result } = renderHook(() => useAICopilot({ context: baseContext }));
    await act(async () => {
      result.current.send('Hello');
    });
    expect(result.current.messages).toEqual([]);
  });

  it('send appends user and assistant messages', async () => {
    const fetchResponse = vi.fn().mockResolvedValue('AI response');
    const { result } = renderHook(() => useAICopilot({ context: baseContext, fetchResponse }));

    await act(async () => {
      result.current.send('What is Cpk?');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('What is Cpk?');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].error).toBeUndefined();
    expect(result.current.messages[1].content).toBe('AI response');
    expect(fetchResponse).toHaveBeenCalledOnce();
  });

  it('sets error on fetch failure', async () => {
    const fetchResponse = vi.fn().mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useAICopilot({ context: baseContext, fetchResponse }));

    await act(async () => {
      result.current.send('Question');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.messages).toHaveLength(2); // user + error
    expect(result.current.messages[1].error).toBeDefined();
  });

  it('clear resets all state', async () => {
    const fetchResponse = vi.fn().mockResolvedValue('Response');
    const { result } = renderHook(() => useAICopilot({ context: baseContext, fetchResponse }));

    await act(async () => {
      result.current.send('Question');
    });
    expect(result.current.messages).toHaveLength(2);

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
      useAICopilot({
        context: baseContext,
        initialNarrative: 'Process is stable with Cpk 1.5',
      })
    );

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toBe('Process is stable with Cpk 1.5');
  });

  it('does not seed narrative twice', () => {
    const { result, rerender } = renderHook(props => useAICopilot(props), {
      initialProps: { context: baseContext, initialNarrative: 'Narrative text' },
    });

    expect(result.current.messages).toHaveLength(1);

    rerender({ context: baseContext, initialNarrative: 'Updated narrative' });
    // Should still be 1 message — one-shot seeding
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Narrative text');
  });

  it('does not send empty or whitespace-only messages', async () => {
    const fetchResponse = vi.fn().mockResolvedValue('Response');
    const { result } = renderHook(() => useAICopilot({ context: baseContext, fetchResponse }));

    await act(async () => {
      result.current.send('   ');
    });
    expect(fetchResponse).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('does not send when context is null', async () => {
    const fetchResponse = vi.fn().mockResolvedValue('Response');
    const { result } = renderHook(() => useAICopilot({ context: null, fetchResponse }));

    await act(async () => {
      result.current.send('Question');
    });
    expect(fetchResponse).not.toHaveBeenCalled();
  });

  describe('copyLastResponse', () => {
    it('copies last assistant message to clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      const fetchResponse = vi.fn().mockResolvedValue('AI response text');
      const { result } = renderHook(() => useAICopilot({ context: baseContext, fetchResponse }));

      await act(async () => {
        result.current.send('Question');
      });
      await waitFor(() => expect(result.current.messages).toHaveLength(2));

      let success = false;
      await act(async () => {
        success = await result.current.copyLastResponse();
      });
      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith('AI response text');
    });

    it('returns false when no assistant messages exist', async () => {
      const { result } = renderHook(() => useAICopilot({ context: baseContext }));

      let success = true;
      await act(async () => {
        success = await result.current.copyLastResponse();
      });
      expect(success).toBe(false);
    });

    it('skips error messages and copies last valid response', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      const fetchResponse = vi
        .fn()
        .mockResolvedValueOnce('Good response')
        .mockRejectedValueOnce(new Error('network error'));
      const { result } = renderHook(() => useAICopilot({ context: baseContext, fetchResponse }));

      await act(async () => {
        result.current.send('Q1');
      });
      await waitFor(() => expect(result.current.messages).toHaveLength(2));

      await act(async () => {
        result.current.send('Q2');
      });
      await waitFor(() => expect(result.current.messages).toHaveLength(4));

      let success = false;
      await act(async () => {
        success = await result.current.copyLastResponse();
      });
      expect(success).toBe(true);
      expect(writeText).toHaveBeenCalledWith('Good response');
    });
  });

  describe('streaming', () => {
    it('streams response progressively', async () => {
      const fetchStreamingResponse = vi
        .fn()
        .mockImplementation(async (_msgs: unknown, onChunk: (d: string) => void) => {
          onChunk('Hello');
          onChunk(' world');
        });
      const { result } = renderHook(() =>
        useAICopilot({ context: baseContext, fetchStreamingResponse })
      );

      await act(async () => {
        result.current.send('Question');
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[1].content).toBe('Hello world');
      });
      expect(result.current.isStreaming).toBe(false);
    });

    it('stopStreaming keeps partial content', async () => {
      let resolveStream: () => void;
      const streamPromise = new Promise<void>(r => {
        resolveStream = r;
      });

      const fetchStreamingResponse = vi
        .fn()
        .mockImplementation(
          async (_msgs: unknown, onChunk: (d: string) => void, signal: AbortSignal) => {
            onChunk('Partial');
            // Wait for abort or manual resolve
            await new Promise<void>(r => {
              signal.addEventListener('abort', () => r());
              streamPromise.then(r);
            });
          }
        );

      const { result } = renderHook(() =>
        useAICopilot({ context: baseContext, fetchStreamingResponse })
      );

      // Start sending (don't await — it's still streaming)
      act(() => {
        result.current.send('Question');
      });

      await waitFor(() => expect(result.current.isStreaming).toBe(true));

      act(() => {
        result.current.stopStreaming();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.isLoading).toBe(false);
      // Partial content preserved in messages
      resolveStream!();
    });

    it('falls back to non-streaming when streaming throws', async () => {
      const fetchStreamingResponse = vi
        .fn()
        .mockRejectedValue(new Error('streaming not supported'));
      const fetchResponse = vi.fn().mockResolvedValue('Fallback response');

      const { result } = renderHook(() =>
        useAICopilot({ context: baseContext, fetchResponse, fetchStreamingResponse })
      );

      await act(async () => {
        result.current.send('Question');
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[1].content).toBe('Fallback response');
      });
    });
  });
});
