import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { configurePlan } from '@variscout/core';

vi.mock('../../lib/runtimeConfig', () => ({
  getRuntimeConfig: vi.fn(() => null),
}));

import { getRuntimeConfig } from '../../lib/runtimeConfig';
import {
  classifyError,
  isAIAvailable,
  fetchChartInsight,
  fetchNarration,
  fetchCoScoutResponse,
  fetchCoScoutStreamingResponse,
  fetchFindingsReport,
} from '../aiService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OPENAI_ENDPOINT = 'https://test.openai.azure.com/openai/deployments/gpt-4o/chat/completions';
const ANTHROPIC_ENDPOINT = 'https://test.services.ai.azure.com';

/** Minimal valid AIContext for fetchNarration. */
function makeAIContext(overrides?: Record<string, unknown>) {
  return {
    process: { description: 'Coffee fill weight' },
    stats: { mean: 250.5, stdDev: 1.23, samples: 100 },
    filters: [],
    glossaryFragment: '',
    ...overrides,
  };
}

function mockEndpoint(endpoint: string) {
  (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue({
    aiEndpoint: endpoint,
  });
}

function openAIResponse(text: string) {
  return {
    choices: [{ message: { content: text } }],
  };
}

function anthropicResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  };
}

/** Build a fetch mock that handles /.auth/me and delegates AI calls to `handler`. */
function buildFetchMock(
  handler: (url: string, init: Record<string, unknown>) => Response | Promise<Response>
) {
  return vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    if (urlStr === '/.auth/me') {
      return Promise.resolve(
        new Response(JSON.stringify([{ access_token: 'tok' }]), { status: 200 })
      );
    }
    return Promise.resolve(handler(urlStr, init ?? ({} as Record<string, unknown>)));
  }) as unknown as typeof globalThis.fetch;
}

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Existing tests
// ---------------------------------------------------------------------------

describe('classifyError', () => {
  it('classifies 401 as auth', () => {
    expect(classifyError(401)).toBe('auth');
  });

  it('classifies 403 as auth', () => {
    expect(classifyError(403)).toBe('auth');
  });

  it('classifies 429 as rate-limit', () => {
    expect(classifyError(429)).toBe('rate-limit');
  });

  it('classifies 500 as server', () => {
    expect(classifyError(500)).toBe('server');
  });

  it('classifies 0 as network', () => {
    expect(classifyError(0)).toBe('network');
  });

  it('classifies fetch error as network', () => {
    expect(classifyError(0, 'fetch failed')).toBe('network');
  });

  it('classifies unknown status as unknown', () => {
    expect(classifyError(418)).toBe('unknown');
  });
});

describe('isAIAvailable', () => {
  beforeEach(() => {
    configurePlan(null);
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('returns false when VITE_AI_ENDPOINT is not set', () => {
    expect(isAIAvailable()).toBe(false);
  });

  it('returns false for standard plan even if endpoint were set', () => {
    configurePlan('standard');
    expect(isAIAvailable()).toBe(false);
  });

  it('returns false for team plan (AI requires team-ai)', () => {
    configurePlan('team');
    expect(isAIAvailable()).toBe(false);
  });

  it('returns false for team-ai plan when endpoint not set', () => {
    configurePlan('team-ai');
    expect(isAIAvailable()).toBe(false);
  });
});

describe('fetchChartInsight', () => {
  it('throws when AI endpoint not configured', async () => {
    await expect(fetchChartInsight('test prompt')).rejects.toThrow('AI endpoint not configured');
  });
});

// ---------------------------------------------------------------------------
// New comprehensive tests
// ---------------------------------------------------------------------------

describe('fetchNarration', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockEndpoint(OPENAI_ENDPOINT);
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('throws when AI endpoint not configured', async () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const context = makeAIContext();
    await expect(fetchNarration(context)).rejects.toThrow('AI endpoint not configured');
  });

  it('returns cached response on cache hit', async () => {
    // Pre-populate cache — the key is hash-based so we call once to populate, then verify second call skips fetch
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(openAIResponse('Narration text')), { status: 200 })
    );

    const context = makeAIContext({ glossaryFragment: 'gloss' });
    const first = await fetchNarration(context);
    expect(first).toBe('Narration text');

    // Reset fetch to a failing spy — should not be called on cache hit
    const failFetch = vi.fn(() => Promise.reject(new Error('should not be called')));
    globalThis.fetch = failFetch as unknown as typeof globalThis.fetch;

    const second = await fetchNarration(context);
    expect(second).toBe('Narration text');
    // Only /.auth/me would be called if fetch were used, but cache prevents any call
    expect(failFetch).not.toHaveBeenCalled();
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    let callCount = 0;
    globalThis.fetch = buildFetchMock(() => {
      callCount++;
      if (callCount === 1) {
        return new Response('Too Many Requests', { status: 429 });
      }
      return new Response(JSON.stringify(openAIResponse('Success after retry')), {
        status: 200,
      });
    });

    const context = makeAIContext();
    const result = await fetchNarration(context);
    expect(result).toBe('Success after retry');
    expect(callCount).toBe(2);
  });

  it('throws after 3 failed attempts', async () => {
    globalThis.fetch = buildFetchMock(() => new Response('error', { status: 500 }));

    const context = makeAIContext();
    await expect(fetchNarration(context)).rejects.toThrow('AI request failed (server): 500');
  }, 15_000);

  it('uses Anthropic response format when endpoint is Anthropic', async () => {
    mockEndpoint(ANTHROPIC_ENDPOINT);
    globalThis.fetch = buildFetchMock(
      () =>
        new Response(JSON.stringify(anthropicResponse('Anthropic narration')), {
          status: 200,
        })
    );

    const context = makeAIContext();
    const result = await fetchNarration(context);
    expect(result).toBe('Anthropic narration');
  });

  it('throws on empty AI response', async () => {
    globalThis.fetch = buildFetchMock(
      () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), { status: 200 })
    );

    const context = makeAIContext();
    await expect(fetchNarration(context)).rejects.toThrow('Empty response from AI');
  }, 15_000);
});

describe('fetchChartInsight (with endpoint)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockEndpoint(OPENAI_ENDPOINT);
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('returns AI-enhanced insight text', async () => {
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(openAIResponse('Cpk trending down')), { status: 200 })
    );

    const result = await fetchChartInsight('Describe the trend');
    expect(result).toBe('Cpk trending down');
  });

  it('does not retry on error (single attempt)', async () => {
    let callCount = 0;
    globalThis.fetch = buildFetchMock(() => {
      callCount++;
      return new Response('error', { status: 429 });
    });

    await expect(fetchChartInsight('prompt')).rejects.toThrow('AI chip request failed: 429');
    expect(callCount).toBe(1);
  });

  it('returns cached insight on second call with same prompt', async () => {
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(openAIResponse('Cached insight')), { status: 200 })
    );

    const first = await fetchChartInsight('same prompt');
    expect(first).toBe('Cached insight');

    const failFetch = vi.fn(() => Promise.reject(new Error('should not call')));
    globalThis.fetch = failFetch as unknown as typeof globalThis.fetch;

    const second = await fetchChartInsight('same prompt');
    expect(second).toBe('Cached insight');
    expect(failFetch).not.toHaveBeenCalled();
  });
});

describe('fetchCoScoutResponse', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockEndpoint(OPENAI_ENDPOINT);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('throws when AI endpoint not configured', async () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await expect(fetchCoScoutResponse([{ role: 'user', content: 'hello' }])).rejects.toThrow(
      'AI endpoint not configured'
    );
  });

  it('returns response text on success', async () => {
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(openAIResponse('CoScout reply')), { status: 200 })
    );

    const result = await fetchCoScoutResponse([{ role: 'user', content: 'hello' }]);
    expect(result).toBe('CoScout reply');
  });

  it('retries once on 429 then succeeds', async () => {
    let callCount = 0;
    globalThis.fetch = buildFetchMock(() => {
      callCount++;
      if (callCount === 1) return new Response('rate limit', { status: 429 });
      return new Response(JSON.stringify(openAIResponse('ok')), { status: 200 });
    });

    const result = await fetchCoScoutResponse([{ role: 'user', content: 'hi' }]);
    expect(result).toBe('ok');
    expect(callCount).toBe(2);
  });

  it('throws after both attempts fail on 429', async () => {
    globalThis.fetch = buildFetchMock(() => new Response('rate limit', { status: 429 }));

    await expect(fetchCoScoutResponse([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      'AI request failed (rate-limit): 429'
    );
  });
});

describe('fetchCoScoutStreamingResponse', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockEndpoint(OPENAI_ENDPOINT);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('throws when AI endpoint not configured', async () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const controller = new AbortController();
    await expect(
      fetchCoScoutStreamingResponse([{ role: 'user', content: 'hi' }], vi.fn(), controller.signal)
    ).rejects.toThrow('AI endpoint not configured');
  });

  it('parses OpenAI SSE chunks and calls onChunk', async () => {
    const sseChunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    globalThis.fetch = buildFetchMock(
      () =>
        new Response(createMockStream(sseChunks), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        })
    );

    const chunks: string[] = [];
    const controller = new AbortController();
    await fetchCoScoutStreamingResponse(
      [{ role: 'user', content: 'hi' }],
      delta => chunks.push(delta),
      controller.signal
    );

    expect(chunks).toEqual(['Hello', ' world']);
  });

  it('throws when response has no body', async () => {
    globalThis.fetch = buildFetchMock(() => new Response(null, { status: 200 }));

    const controller = new AbortController();
    await expect(
      fetchCoScoutStreamingResponse([{ role: 'user', content: 'hi' }], vi.fn(), controller.signal)
    ).rejects.toThrow('No response body for streaming');
  });

  it('returns silently when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    // Fetch will throw on abort, but streaming function should handle it
    globalThis.fetch = buildFetchMock(() => {
      throw new DOMException('aborted', 'AbortError');
    });

    // Should not throw — returns silently on abort
    await fetchCoScoutStreamingResponse(
      [{ role: 'user', content: 'hi' }],
      vi.fn(),
      controller.signal
    );
  });
});

describe('fetchFindingsReport', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockEndpoint(OPENAI_ENDPOINT);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('throws when AI endpoint not configured', async () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await expect(fetchFindingsReport([{ role: 'user', content: 'report' }])).rejects.toThrow(
      'AI endpoint not configured'
    );
  });

  it('returns report text on success', async () => {
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(openAIResponse('Full report here')), { status: 200 })
    );

    const result = await fetchFindingsReport([{ role: 'user', content: 'report' }]);
    expect(result).toBe('Full report here');
  });

  it('retries on 429 with exponential backoff (max 3 attempts)', async () => {
    let callCount = 0;
    globalThis.fetch = buildFetchMock(() => {
      callCount++;
      if (callCount <= 2) return new Response('rate limit', { status: 429 });
      return new Response(JSON.stringify(openAIResponse('Finally')), { status: 200 });
    });

    const result = await fetchFindingsReport([{ role: 'user', content: 'report' }]);
    expect(result).toBe('Finally');
    expect(callCount).toBe(3);
  }, 15_000);

  it('throws on server error without retry', async () => {
    globalThis.fetch = buildFetchMock(() => new Response('error', { status: 500 }));

    await expect(fetchFindingsReport([{ role: 'user', content: 'report' }])).rejects.toThrow(
      'AI report request failed (server): 500'
    );
  }, 15_000);
});

describe('provider detection and request formatting', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('sends request to Anthropic messages endpoint when provider is Anthropic', async () => {
    mockEndpoint(ANTHROPIC_ENDPOINT);
    let capturedUrl = '';
    let capturedBody = '';

    globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.resolve(
          new Response(JSON.stringify([{ access_token: 'tok' }]), { status: 200 })
        );
      }
      capturedUrl = urlStr;
      capturedBody = (init?.body as string) || '';
      return Promise.resolve(
        new Response(JSON.stringify(anthropicResponse('ok')), { status: 200 })
      );
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    expect(capturedUrl).toBe(`${ANTHROPIC_ENDPOINT}/anthropic/v1/messages`);

    const body = JSON.parse(capturedBody);
    expect(body.model).toBe('claude-sonnet-4-20250514');
    // System message should be in top-level `system` field, not in messages array
    expect(body.system).toBeDefined();
    expect(body.messages.every((m: { role: string }) => m.role !== 'system')).toBe(true);
  });

  it('sends request directly to OpenAI endpoint', async () => {
    mockEndpoint(OPENAI_ENDPOINT);
    let capturedUrl = '';

    globalThis.fetch = vi.fn((url: string | URL | Request, _init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.resolve(
          new Response(JSON.stringify([{ access_token: 'tok' }]), { status: 200 })
        );
      }
      capturedUrl = urlStr;
      return Promise.resolve(new Response(JSON.stringify(openAIResponse('ok')), { status: 200 }));
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    expect(capturedUrl).toBe(OPENAI_ENDPOINT);
  });
});

describe('auth headers', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockEndpoint(OPENAI_ENDPOINT);
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('includes Bearer token from /.auth/me in AI request', async () => {
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.resolve(
          new Response(JSON.stringify([{ access_token: 'my-secret-token' }]), { status: 200 })
        );
      }
      capturedHeaders = Object.fromEntries(Object.entries(init?.headers || {}));
      return Promise.resolve(new Response(JSON.stringify(openAIResponse('ok')), { status: 200 }));
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    expect(capturedHeaders['Authorization']).toBe('Bearer my-secret-token');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('sends request without Authorization when /.auth/me fails', async () => {
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.reject(new Error('auth not available'));
      }
      capturedHeaders = Object.fromEntries(Object.entries(init?.headers || {}));
      return Promise.resolve(new Response(JSON.stringify(openAIResponse('ok')), { status: 200 }));
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    expect(capturedHeaders['Authorization']).toBeUndefined();
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });
});
