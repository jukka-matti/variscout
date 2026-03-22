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
  fetchFindingsReport,
  getAIProviderLabel,
} from '../aiService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OPENAI_ENDPOINT = 'https://test.openai.azure.com/openai/deployments/gpt-4o/chat/completions';

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

/** Responses API response shape */
function responsesApiResponse(text: string) {
  return {
    id: 'resp_001',
    output: [{ type: 'message', content: [{ type: 'text', text }] }],
    usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
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

// ---------------------------------------------------------------------------
// Tests
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

  it('returns false when no AI endpoint is configured', () => {
    expect(isAIAvailable()).toBe(false);
  });

  it('returns true for any plan when endpoint is configured', () => {
    mockEndpoint(OPENAI_ENDPOINT);
    configurePlan('standard');
    expect(isAIAvailable()).toBe(true);

    configurePlan('team');
    expect(isAIAvailable()).toBe(true);
  });

  it('returns false when endpoint not set regardless of plan', () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    configurePlan('team');
    expect(isAIAvailable()).toBe(false);
  });
});

describe('getAIProviderLabel', () => {
  it('returns null when no endpoint configured', () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    expect(getAIProviderLabel()).toBeNull();
  });

  it('always returns Azure OpenAI when endpoint is configured', () => {
    mockEndpoint(OPENAI_ENDPOINT);
    expect(getAIProviderLabel()).toBe('Azure OpenAI');
  });
});

describe('fetchChartInsight', () => {
  it('throws when AI endpoint not configured', async () => {
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await expect(fetchChartInsight('test prompt')).rejects.toThrow('AI endpoint not configured');
  });
});

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
    // Narration uses structured output — respond with JSON
    const jsonResponse = JSON.stringify({ text: 'Narration text', confidence: 'high' });
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
    );

    const context = makeAIContext({ glossaryFragment: 'gloss' });
    const first = await fetchNarration(context);
    expect(first).toBe('Narration text');

    // Reset fetch to a failing spy — should not be called on cache hit
    const failFetch = vi.fn(() => Promise.reject(new Error('should not be called')));
    globalThis.fetch = failFetch as unknown as typeof globalThis.fetch;

    const second = await fetchNarration(context);
    expect(second).toBe('Narration text');
    // Cache hit returns before any fetch calls (no auth or AI request needed)
    expect(failFetch).not.toHaveBeenCalled();
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    vi.useFakeTimers();
    let callCount = 0;
    const jsonResponse = JSON.stringify({ text: 'Success after retry', confidence: 'moderate' });
    globalThis.fetch = buildFetchMock(() => {
      callCount++;
      if (callCount === 1) {
        return new Response('Responses API error 429: Too Many Requests', { status: 429 });
      }
      return new Response(JSON.stringify(responsesApiResponse(jsonResponse)), {
        status: 200,
      });
    });

    const context = makeAIContext();
    const promise = fetchNarration(context);
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result).toBe('Success after retry');
    expect(callCount).toBe(2);
    vi.useRealTimers();
  });

  it('throws after 3 failed attempts', async () => {
    vi.useFakeTimers();
    globalThis.fetch = buildFetchMock(() => new Response('error', { status: 500 }));

    const context = makeAIContext();
    const promise = fetchNarration(context);
    const assertion = expect(promise).rejects.toThrow('Responses API error 500');
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
    vi.useRealTimers();
  }, 15_000);

  it('throws on empty AI response', async () => {
    globalThis.fetch = buildFetchMock(
      () =>
        new Response(
          JSON.stringify({
            id: 'resp_001',
            output: [{ type: 'message', content: [{ type: 'text', text: '' }] }],
          }),
          { status: 200 }
        )
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
    const jsonResponse = JSON.stringify({ text: 'Cpk trending down' });
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
    );

    const result = await fetchChartInsight('Describe the trend');
    expect(result).toBe('Cpk trending down');
  });

  it('returns cached insight on second call with same prompt', async () => {
    const jsonResponse = JSON.stringify({ text: 'Cached insight' });
    globalThis.fetch = buildFetchMock(
      () => new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
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
      () => new Response(JSON.stringify(responsesApiResponse('Full report here')), { status: 200 })
    );

    const result = await fetchFindingsReport([{ role: 'user', content: 'report' }]);
    expect(result).toBe('Full report here');
  });

  it('retries on 429 with exponential backoff (max 3 attempts)', async () => {
    let callCount = 0;
    globalThis.fetch = buildFetchMock(() => {
      callCount++;
      if (callCount <= 2)
        return new Response('Responses API error 429: rate limit', { status: 429 });
      return new Response(JSON.stringify(responsesApiResponse('Finally')), { status: 200 });
    });

    const result = await fetchFindingsReport([{ role: 'user', content: 'report' }]);
    expect(result).toBe('Finally');
    expect(callCount).toBe(3);
  }, 15_000);

  it('throws on server error', async () => {
    globalThis.fetch = buildFetchMock(() => new Response('error', { status: 500 }));

    const promise = fetchFindingsReport([{ role: 'user', content: 'report' }]);
    const assertion = expect(promise).rejects.toThrow('Responses API error 500');
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
  }, 15_000);
});

describe('Responses API request format', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (getRuntimeConfig as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('sends requests to the Responses API v1 endpoint', async () => {
    mockEndpoint(OPENAI_ENDPOINT);
    let capturedUrl = '';

    const jsonResponse = JSON.stringify({ text: 'ok' });
    globalThis.fetch = vi.fn((url: string | URL | Request, _init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.resolve(
          new Response(JSON.stringify([{ access_token: 'tok' }]), { status: 200 })
        );
      }
      capturedUrl = urlStr;
      return Promise.resolve(
        new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
      );
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    expect(capturedUrl).toBe('https://test.openai.azure.com/openai/v1/responses');
  });

  it('sends structured output format in request body', async () => {
    mockEndpoint(OPENAI_ENDPOINT);
    let capturedBody = '';

    const jsonResponse = JSON.stringify({ text: 'ok' });
    globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.resolve(
          new Response(JSON.stringify([{ access_token: 'tok' }]), { status: 200 })
        );
      }
      capturedBody = (init?.body as string) || '';
      return Promise.resolve(
        new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
      );
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    const body = JSON.parse(capturedBody);
    expect(body.text).toBeDefined();
    expect(body.text.format.type).toBe('json_schema');
    expect(body.text.format.name).toBe('chart_insight_response');
    expect(body.store).toBe(true);
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

  it('includes Bearer token from /.auth/me in AI request (via responsesApi buildHeaders)', async () => {
    let capturedHeaders: Record<string, string> = {};

    const jsonResponse = JSON.stringify({ text: 'ok' });
    globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        return Promise.resolve(
          // EasyAuth returns a JWT-like token
          new Response(
            JSON.stringify([
              {
                access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.signature',
              },
            ]),
            { status: 200 }
          )
        );
      }
      capturedHeaders = Object.fromEntries(Object.entries(init?.headers || {}));
      return Promise.resolve(
        new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
      );
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    // responsesApi.ts buildHeaders detects JWT format and uses Authorization: Bearer
    expect(capturedHeaders['Authorization']).toContain('Bearer ey');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('uses api-key header when token is not a JWT', async () => {
    let capturedHeaders: Record<string, string> = {};

    const jsonResponse = JSON.stringify({ text: 'ok' });
    globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      if (urlStr === '/.auth/me') {
        // Return a non-JWT API key
        return Promise.resolve(
          new Response(JSON.stringify([{ access_token: 'abc123-api-key' }]), { status: 200 })
        );
      }
      capturedHeaders = Object.fromEntries(Object.entries(init?.headers || {}));
      return Promise.resolve(
        new Response(JSON.stringify(responsesApiResponse(jsonResponse)), { status: 200 })
      );
    }) as unknown as typeof globalThis.fetch;

    await fetchChartInsight('test');
    expect(capturedHeaders['api-key']).toBe('abc123-api-key');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });
});
