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
});
