import { describe, it, expect, beforeEach } from 'vitest';
import { traceAICall, getRecentTraces, clearTraces, getTraceStats } from '../tracing';
import type { TokenUsage, AIFeature } from '../tracing';

describe('traceAICall', () => {
  beforeEach(() => {
    clearTraces();
  });

  it('records a successful trace', async () => {
    const { result, trace } = await traceAICall(
      { feature: 'narration', model: 'gpt-4o' },
      async () => ({ result: 'Hello' })
    );

    expect(result).toBe('Hello');
    expect(trace.success).toBe(true);
    expect(trace.feature).toBe('narration');
    expect(trace.model).toBe('gpt-4o');
    expect(trace.durationMs).toBeGreaterThanOrEqual(0);
    expect(trace.endTime).toBeGreaterThanOrEqual(trace.startTime);
    expect(trace.id).toMatch(/^trace-/);
  });

  it('records token usage when provided', async () => {
    const tokens: TokenUsage = {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    };

    const { trace } = await traceAICall({ feature: 'coscout', model: 'gpt-4o' }, async () => ({
      result: 'text',
      tokens,
    }));

    expect(trace.tokens).toBeDefined();
    expect(trace.tokens!.inputTokens).toBe(100);
    expect(trace.tokens!.outputTokens).toBe(50);
    expect(trace.tokens!.totalTokens).toBe(150);
  });

  it('records a failed trace and re-throws the error', async () => {
    const error = new Error('API timeout');

    await expect(
      traceAICall({ feature: 'chart-insight', model: 'gpt-4o' }, async () => {
        throw error;
      })
    ).rejects.toThrow('API timeout');

    const traces = getRecentTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].success).toBe(false);
    expect(traces[0].error).toBe('API timeout');
    expect(traces[0].feature).toBe('chart-insight');
  });

  it('records non-Error thrown values as strings', async () => {
    await expect(
      traceAICall({ feature: 'narration' }, async () => {
        throw 'string error';
      })
    ).rejects.toBe('string error');

    const traces = getRecentTraces();
    expect(traces[0].error).toBe('string error');
  });

  it('uses "unknown" when model is not specified', async () => {
    const { trace } = await traceAICall({ feature: 'report' }, async () => ({
      result: 'ok',
    }));

    expect(trace.model).toBe('unknown');
  });

  it('generates unique trace IDs', async () => {
    const { trace: t1 } = await traceAICall({ feature: 'narration' }, async () => ({
      result: 'a',
    }));
    const { trace: t2 } = await traceAICall({ feature: 'narration' }, async () => ({
      result: 'b',
    }));

    expect(t1.id).not.toBe(t2.id);
  });
});

describe('getRecentTraces', () => {
  beforeEach(() => {
    clearTraces();
  });

  it('returns empty array when no traces', () => {
    expect(getRecentTraces()).toHaveLength(0);
  });

  it('returns traces in insertion order', async () => {
    await traceAICall({ feature: 'narration' }, async () => ({
      result: 'first',
    }));
    await traceAICall({ feature: 'coscout' }, async () => ({
      result: 'second',
    }));

    const traces = getRecentTraces();
    expect(traces).toHaveLength(2);
    expect(traces[0].feature).toBe('narration');
    expect(traces[1].feature).toBe('coscout');
  });
});

describe('clearTraces', () => {
  it('removes all traces', async () => {
    await traceAICall({ feature: 'narration' }, async () => ({
      result: 'x',
    }));
    expect(getRecentTraces().length).toBeGreaterThan(0);

    clearTraces();
    expect(getRecentTraces()).toHaveLength(0);
  });
});

describe('getTraceStats', () => {
  beforeEach(() => {
    clearTraces();
  });

  it('returns default stats when no traces', () => {
    const stats = getTraceStats();
    expect(stats.totalCalls).toBe(0);
    expect(stats.successRate).toBe(1);
    expect(stats.avgDurationMs).toBe(0);
    expect(stats.p95DurationMs).toBe(0);
    expect(stats.totalInputTokens).toBe(0);
    expect(stats.totalOutputTokens).toBe(0);
  });

  it('computes correct stats for successful calls', async () => {
    const tokens: TokenUsage = {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    };

    await traceAICall({ feature: 'narration' }, async () => ({
      result: 'a',
      tokens,
    }));
    await traceAICall({ feature: 'narration' }, async () => ({
      result: 'b',
      tokens: { inputTokens: 200, outputTokens: 80, totalTokens: 280 },
    }));

    const stats = getTraceStats();
    expect(stats.totalCalls).toBe(2);
    expect(stats.successRate).toBe(1);
    expect(stats.totalInputTokens).toBe(300);
    expect(stats.totalOutputTokens).toBe(130);
  });

  it('computes success rate including failures', async () => {
    await traceAICall({ feature: 'coscout' }, async () => ({
      result: 'ok',
    }));
    try {
      await traceAICall({ feature: 'coscout' }, async () => {
        throw new Error('fail');
      });
    } catch {
      // expected
    }

    const stats = getTraceStats();
    expect(stats.totalCalls).toBe(2);
    expect(stats.successRate).toBeCloseTo(0.5);
  });

  it('filters stats by feature', async () => {
    await traceAICall({ feature: 'narration' }, async () => ({
      result: 'a',
      tokens: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    }));
    await traceAICall({ feature: 'coscout' }, async () => ({
      result: 'b',
      tokens: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    }));

    const narrationStats = getTraceStats('narration');
    expect(narrationStats.totalCalls).toBe(1);
    expect(narrationStats.totalInputTokens).toBe(10);

    const coscoutStats = getTraceStats('coscout');
    expect(coscoutStats.totalCalls).toBe(1);
    expect(coscoutStats.totalInputTokens).toBe(100);
  });

  it('returns zero tokens when traces have no token data', async () => {
    await traceAICall({ feature: 'narration' }, async () => ({
      result: 'x',
    }));

    const stats = getTraceStats();
    expect(stats.totalInputTokens).toBe(0);
    expect(stats.totalOutputTokens).toBe(0);
  });

  it('returns zero stats for nonexistent feature', () => {
    const stats = getTraceStats('chart-insight' as AIFeature);
    expect(stats.totalCalls).toBe(0);
  });
});
