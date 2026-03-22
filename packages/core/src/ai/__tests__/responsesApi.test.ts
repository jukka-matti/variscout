import { vi, describe, it, expect, afterEach } from 'vitest';
import {
  sendResponsesTurn,
  streamResponsesTurn,
  streamResponsesWithToolLoop,
  extractResponseText,
  ConversationHistory,
} from '../responsesApi';
import type { ResponsesApiConfig, ResponsesApiResponse, ToolHandlerMap } from '../responsesApi';

// ── Test helpers ──────────────────────────────────────────────────────────

const baseConfig: ResponsesApiConfig = {
  endpoint: 'https://test.openai.azure.com',
  deployment: 'gpt-4o',
  apiKey: 'test-api-key-123',
};

const jwtConfig: ResponsesApiConfig = {
  endpoint: 'https://test.openai.azure.com',
  deployment: 'gpt-4o',
  apiKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.signature',
};

function makeResponse(text: string, id = 'resp_001'): ResponsesApiResponse {
  return {
    id,
    output: [{ type: 'message', content: [{ type: 'text', text }] }],
    usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
  };
}

/**
 * Create a ReadableStream that emits SSE-formatted events.
 */
function createSSEStream(events: Array<Record<string, unknown>>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

function mockFetch(handler: (url: string, init: Record<string, unknown>) => Response) {
  globalThis.fetch = vi.fn((url: string | URL | Request, init?: Record<string, unknown>) => {
    const urlStr =
      typeof url === 'string'
        ? url
        : url instanceof URL
          ? url.toString()
          : (url as { url: string }).url;
    return Promise.resolve(handler(urlStr, init ?? {}));
  }) as unknown as typeof globalThis.fetch;
}

// ── Tests ─────────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ── Request construction ──────────────────────────────────────────────────

describe('request construction', () => {
  it('builds correct URL from endpoint', async () => {
    let capturedUrl = '';
    mockFetch(url => {
      capturedUrl = url;
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    await sendResponsesTurn(baseConfig, { input: 'hello' });
    expect(capturedUrl).toBe('https://test.openai.azure.com/openai/v1/responses');
  });

  it('uses api-key header for non-JWT keys', async () => {
    let capturedHeaders: Record<string, string> = {};
    mockFetch((_url, init) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init.headers as Record<string, string>) || {})
      );
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    await sendResponsesTurn(baseConfig, { input: 'hello' });
    expect(capturedHeaders['api-key']).toBe('test-api-key-123');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedHeaders['Authorization']).toBeUndefined();
  });

  it('uses Authorization Bearer header for JWT tokens', async () => {
    let capturedHeaders: Record<string, string> = {};
    mockFetch((_url, init) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init.headers as Record<string, string>) || {})
      );
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    await sendResponsesTurn(jwtConfig, { input: 'hello' });
    expect(capturedHeaders['Authorization']).toContain('Bearer ey');
    expect(capturedHeaders['api-key']).toBeUndefined();
  });

  it('includes model and stream=false in request body', async () => {
    let capturedBody: Record<string, unknown> = {};
    mockFetch((_url, init) => {
      capturedBody = JSON.parse(init.body as string);
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    await sendResponsesTurn(baseConfig, { input: 'test' });
    expect(capturedBody.model).toBe('gpt-4o');
    expect(capturedBody.stream).toBe(false);
    expect(capturedBody.input).toBe('test');
  });

  it('includes tools in request body when provided', async () => {
    let capturedBody: Record<string, unknown> = {};
    mockFetch((_url, init) => {
      capturedBody = JSON.parse(init.body as string);
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    const tools = [
      {
        type: 'function' as const,
        name: 'get_data',
        description: 'Get data',
        parameters: { type: 'object', properties: {}, strict: true },
      },
    ];

    await sendResponsesTurn(baseConfig, { input: 'test', tools });
    expect(capturedBody.tools).toHaveLength(1);
    expect((capturedBody.tools as Array<Record<string, unknown>>)[0].name).toBe('get_data');
  });

  it('includes previous_response_id when provided', async () => {
    let capturedBody: Record<string, unknown> = {};
    mockFetch((_url, init) => {
      capturedBody = JSON.parse(init.body as string);
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    await sendResponsesTurn(baseConfig, {
      input: 'follow up',
      previous_response_id: 'resp_001',
    });
    expect(capturedBody.previous_response_id).toBe('resp_001');
  });

  it('includes instructions when provided', async () => {
    let capturedBody: Record<string, unknown> = {};
    mockFetch((_url, init) => {
      capturedBody = JSON.parse(init.body as string);
      return new Response(JSON.stringify(makeResponse('ok')), { status: 200 });
    });

    await sendResponsesTurn(baseConfig, {
      input: 'test',
      instructions: 'You are a helpful assistant',
    });
    expect(capturedBody.instructions).toBe('You are a helpful assistant');
  });
});

// ── sendResponsesTurn ─────────────────────────────────────────────────────

describe('sendResponsesTurn', () => {
  it('returns parsed response on success', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify(makeResponse('Hello world', 'resp_abc')), {
          status: 200,
        })
    );

    const response = await sendResponsesTurn(baseConfig, { input: 'hi' });
    expect(response.id).toBe('resp_abc');
    expect(response.output).toHaveLength(1);
    expect(response.output[0].content![0].text).toBe('Hello world');
    expect(response.usage!.total_tokens).toBe(15);
  });

  it('throws on HTTP 400 error', async () => {
    mockFetch(() => new Response('Bad request', { status: 400 }));

    await expect(sendResponsesTurn(baseConfig, { input: 'bad' })).rejects.toThrow(
      'Responses API error 400: Bad request'
    );
  });

  it('throws on HTTP 500 error', async () => {
    mockFetch(() => new Response('Internal server error', { status: 500 }));

    await expect(sendResponsesTurn(baseConfig, { input: 'fail' })).rejects.toThrow(
      'Responses API error 500'
    );
  });

  it('throws on HTTP 429 rate limit', async () => {
    mockFetch(() => new Response('Too many requests', { status: 429 }));

    await expect(sendResponsesTurn(baseConfig, { input: 'spam' })).rejects.toThrow(
      'Responses API error 429'
    );
  });
});

// ── streamResponsesTurn ───────────────────────────────────────────────────

describe('streamResponsesTurn', () => {
  it('calls onChunk for each text delta event', async () => {
    const events = [
      { type: 'response.output_text.delta', delta: 'Hello ' },
      { type: 'response.output_text.delta', delta: 'world' },
      {
        type: 'response.completed',
        response: {
          id: 'resp_stream',
          usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 },
        },
      },
    ];

    mockFetch(
      () =>
        new Response(createSSEStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        })
    );

    const chunks: string[] = [];
    const controller = new AbortController();
    const response = await streamResponsesTurn(
      baseConfig,
      { input: 'hi' },
      delta => chunks.push(delta),
      controller.signal
    );

    expect(chunks).toEqual(['Hello ', 'world']);
    expect(response.id).toBe('resp_stream');
    expect(response.output[0].content![0].text).toBe('Hello world');
    expect(response.usage!.total_tokens).toBe(30);
  });

  it('handles response.completed event with usage', async () => {
    const events = [
      { type: 'response.output_text.delta', delta: 'Done' },
      {
        type: 'response.completed',
        response: {
          id: 'resp_usage',
          usage: {
            input_tokens: 50,
            output_tokens: 25,
            total_tokens: 75,
          },
        },
      },
    ];

    mockFetch(() => new Response(createSSEStream(events), { status: 200 }));

    const controller = new AbortController();
    const response = await streamResponsesTurn(
      baseConfig,
      { input: 'test' },
      () => {},
      controller.signal
    );

    expect(response.usage!.input_tokens).toBe(50);
    expect(response.usage!.output_tokens).toBe(25);
  });

  it('throws on HTTP error before streaming', async () => {
    mockFetch(() => new Response('Service unavailable', { status: 503 }));

    const controller = new AbortController();
    await expect(
      streamResponsesTurn(baseConfig, { input: 'fail' }, () => {}, controller.signal)
    ).rejects.toThrow('Responses API error 503');
  });

  it('captures response ID from first event', async () => {
    const events = [
      { id: 'resp_first', type: 'response.output_text.delta', delta: 'hi' },
      {
        type: 'response.completed',
        response: {
          id: 'resp_first',
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
        },
      },
    ];

    mockFetch(() => new Response(createSSEStream(events), { status: 200 }));

    const controller = new AbortController();
    const response = await streamResponsesTurn(
      baseConfig,
      { input: 'test' },
      () => {},
      controller.signal
    );

    expect(response.id).toBe('resp_first');
  });

  it('handles empty stream gracefully', async () => {
    // No text delta events, just DONE
    mockFetch(() => new Response(createSSEStream([]), { status: 200 }));

    const controller = new AbortController();
    const response = await streamResponsesTurn(
      baseConfig,
      { input: 'empty' },
      () => {},
      controller.signal
    );

    // Should produce an empty text message
    expect(response.output).toHaveLength(1);
    expect(response.output[0].type).toBe('message');
  });

  it('skips malformed SSE lines', async () => {
    // Create a stream with a mix of valid and invalid JSON
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: not-json\n\n'));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'response.output_text.delta', delta: 'ok' })}\n\n`
          )
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    mockFetch(() => new Response(stream, { status: 200 }));

    const chunks: string[] = [];
    const controller = new AbortController();
    await streamResponsesTurn(
      baseConfig,
      { input: 'test' },
      delta => chunks.push(delta),
      controller.signal
    );

    expect(chunks).toEqual(['ok']);
  });

  it('sets stream=true in request body', async () => {
    let capturedBody: Record<string, unknown> = {};
    mockFetch((_url, init) => {
      capturedBody = JSON.parse(init.body as string);
      return new Response(createSSEStream([]), { status: 200 });
    });

    const controller = new AbortController();
    await streamResponsesTurn(baseConfig, { input: 'test' }, () => {}, controller.signal);

    expect(capturedBody.stream).toBe(true);
  });
});

// ── streamResponsesWithToolLoop ───────────────────────────────────────────

describe('streamResponsesWithToolLoop', () => {
  it('returns text directly when model produces no tool calls', async () => {
    const events = [
      { type: 'response.output_text.delta', delta: 'Direct answer' },
      {
        type: 'response.completed',
        response: {
          id: 'resp_direct',
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        },
      },
    ];

    mockFetch(() => new Response(createSSEStream(events), { status: 200 }));

    const chunks: string[] = [];
    const controller = new AbortController();
    const response = await streamResponsesWithToolLoop(
      baseConfig,
      { input: 'question' },
      {},
      delta => chunks.push(delta),
      controller.signal
    );

    expect(chunks).toEqual(['Direct answer']);
    expect(response.output[0].content![0].text).toBe('Direct answer');
  });

  it('executes tool call and sends result back', async () => {
    let callCount = 0;
    let capturedBodies: Array<Record<string, unknown>> = [];

    mockFetch((_url, init) => {
      callCount++;
      capturedBodies.push(JSON.parse(init.body as string));

      if (callCount === 1) {
        // First turn: model calls a function
        const events = [
          {
            type: 'response.function_call_arguments.done',
            name: 'get_data',
            arguments: '{"query":"test"}',
            call_id: 'call_001',
            item_id: 'item_1',
          },
          {
            type: 'response.completed',
            response: {
              id: 'resp_tool',
              usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
            },
          },
        ];
        return new Response(createSSEStream(events), { status: 200 });
      }
      // Second turn: model produces text
      const events = [
        { type: 'response.output_text.delta', delta: 'Result: 42' },
        {
          type: 'response.completed',
          response: {
            id: 'resp_final',
            usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 },
          },
        },
      ];
      return new Response(createSSEStream(events), { status: 200 });
    });

    const toolHandlers: ToolHandlerMap = {
      get_data: vi.fn(async () => '42'),
    };

    const chunks: string[] = [];
    const controller = new AbortController();
    const response = await streamResponsesWithToolLoop(
      baseConfig,
      { input: 'what is the answer?' },
      toolHandlers,
      delta => chunks.push(delta),
      controller.signal
    );

    // Tool handler was called
    expect(toolHandlers.get_data).toHaveBeenCalledWith({ query: 'test' });

    // Second request chains via previous_response_id
    expect(capturedBodies[1].previous_response_id).toBe('resp_tool');

    // Second request sends function output
    const input = capturedBodies[1].input as Array<Record<string, unknown>>;
    expect(input[0].type).toBe('function_call_output');
    expect(input[0].call_id).toBe('call_001');
    expect(input[0].output).toBe('42');

    // Final response has text
    expect(chunks).toEqual(['Result: 42']);
    expect(response.id).toBe('resp_final');
  });

  it('handles tool handler errors gracefully', async () => {
    let callCount = 0;

    mockFetch(() => {
      callCount++;
      if (callCount === 1) {
        const events = [
          {
            type: 'response.function_call_arguments.done',
            name: 'failing_tool',
            arguments: '{}',
            call_id: 'call_err',
            item_id: 'item_err',
          },
          {
            type: 'response.completed',
            response: {
              id: 'resp_err',
              usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
            },
          },
        ];
        return new Response(createSSEStream(events), { status: 200 });
      }
      const events = [
        { type: 'response.output_text.delta', delta: 'Handled error' },
        {
          type: 'response.completed',
          response: {
            id: 'resp_recovered',
            usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
          },
        },
      ];
      return new Response(createSSEStream(events), { status: 200 });
    });

    const toolHandlers: ToolHandlerMap = {
      failing_tool: async () => {
        throw new Error('Database connection lost');
      },
    };

    let capturedSecondBody: Record<string, unknown> = {};
    mockFetch((_url, init) => {
      callCount++;
      if (callCount === 1) {
        const events = [
          {
            type: 'response.function_call_arguments.done',
            name: 'failing_tool',
            arguments: '{}',
            call_id: 'call_err',
            item_id: 'item_err',
          },
          {
            type: 'response.completed',
            response: {
              id: 'resp_err',
              usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
            },
          },
        ];
        return new Response(createSSEStream(events), { status: 200 });
      }
      capturedSecondBody = JSON.parse(init.body as string);
      const events = [
        { type: 'response.output_text.delta', delta: 'Error handled' },
        {
          type: 'response.completed',
          response: {
            id: 'resp_ok',
            usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
          },
        },
      ];
      return new Response(createSSEStream(events), { status: 200 });
    });

    const controller = new AbortController();
    const response = await streamResponsesWithToolLoop(
      baseConfig,
      { input: 'test' },
      toolHandlers,
      () => {},
      controller.signal
    );

    // Error should have been serialized and sent back
    const input = capturedSecondBody.input as Array<Record<string, unknown>>;
    expect(input[0].output).toContain('Database connection lost');
    expect(response.id).toBe('resp_ok');
  });

  it('handles unknown tool names gracefully', async () => {
    let callCount = 0;
    let capturedSecondBody: Record<string, unknown> = {};

    mockFetch((_url, init) => {
      callCount++;
      if (callCount === 1) {
        const events = [
          {
            type: 'response.function_call_arguments.done',
            name: 'nonexistent_tool',
            arguments: '{}',
            call_id: 'call_unknown',
            item_id: 'item_unknown',
          },
          {
            type: 'response.completed',
            response: {
              id: 'resp_1',
              usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
            },
          },
        ];
        return new Response(createSSEStream(events), { status: 200 });
      }
      capturedSecondBody = JSON.parse(init.body as string);
      const events = [
        { type: 'response.output_text.delta', delta: 'ok' },
        {
          type: 'response.completed',
          response: {
            id: 'resp_2',
            usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
          },
        },
      ];
      return new Response(createSSEStream(events), { status: 200 });
    });

    const controller = new AbortController();
    await streamResponsesWithToolLoop(
      baseConfig,
      { input: 'test' },
      {}, // empty tool handlers
      () => {},
      controller.signal
    );

    const input = capturedSecondBody.input as Array<Record<string, unknown>>;
    expect(input[0].output).toContain('Unknown tool: nonexistent_tool');
  });

  it('stops after MAX_ROUNDS (5) to prevent infinite loops', async () => {
    let callCount = 0;

    mockFetch(() => {
      callCount++;
      // Always return a function call — never produce text
      const events = [
        {
          type: 'response.function_call_arguments.done',
          name: 'looping_tool',
          arguments: '{}',
          call_id: `call_${callCount}`,
          item_id: `item_${callCount}`,
        },
        {
          type: 'response.completed',
          response: {
            id: `resp_${callCount}`,
            usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 },
          },
        },
      ];
      return new Response(createSSEStream(events), { status: 200 });
    });

    const toolHandlers: ToolHandlerMap = {
      looping_tool: async () => 'continue',
    };

    const controller = new AbortController();
    const response = await streamResponsesWithToolLoop(
      baseConfig,
      { input: 'loop' },
      toolHandlers,
      () => {},
      controller.signal
    );

    // Should have made exactly 5 calls (MAX_ROUNDS)
    expect(callCount).toBe(5);
    // Returns the last response
    expect(response.id).toBe('resp_5');
  });
});

// ── extractResponseText ───────────────────────────────────────────────────

describe('extractResponseText', () => {
  it('extracts text from message output', () => {
    const response = makeResponse('Hello world');
    expect(extractResponseText(response)).toBe('Hello world');
  });

  it('returns empty string for function call output (no message)', () => {
    const response: ResponsesApiResponse = {
      id: 'resp_fc',
      output: [
        {
          type: 'function_call',
          name: 'get_data',
          arguments: '{}',
          call_id: 'call_1',
        },
      ],
    };
    expect(extractResponseText(response)).toBe('');
  });

  it('returns empty string for empty output', () => {
    const response: ResponsesApiResponse = { id: 'resp_empty', output: [] };
    expect(extractResponseText(response)).toBe('');
  });

  it('returns first text content when multiple items exist', () => {
    const response: ResponsesApiResponse = {
      id: 'resp_multi',
      output: [
        { type: 'message', content: [{ type: 'text', text: 'first' }] },
        { type: 'message', content: [{ type: 'text', text: 'second' }] },
      ],
    };
    expect(extractResponseText(response)).toBe('first');
  });

  it('skips non-text content items', () => {
    const response: ResponsesApiResponse = {
      id: 'resp_mixed',
      output: [
        {
          type: 'message',
          content: [
            { type: 'image', text: undefined },
            { type: 'text', text: 'actual text' },
          ],
        },
      ],
    };
    expect(extractResponseText(response)).toBe('actual text');
  });
});

// ── ConversationHistory ───────────────────────────────────────────────────

describe('ConversationHistory', () => {
  it('starts with empty messages', () => {
    const history = new ConversationHistory();
    expect(history.messages).toHaveLength(0);
    expect(history.previousResponseId).toBeNull();
  });

  it('addUserMessage stores user messages', () => {
    const history = new ConversationHistory();
    history.addUserMessage('hello');
    expect(history.messages).toHaveLength(1);
    expect(history.messages[0]).toEqual({ role: 'user', content: 'hello' });
  });

  it('addAssistantMessage stores assistant messages and response ID', () => {
    const history = new ConversationHistory();
    history.addAssistantMessage('hi there', 'resp_123');
    expect(history.messages).toHaveLength(1);
    expect(history.messages[0]).toEqual({
      role: 'assistant',
      content: 'hi there',
    });
    expect(history.previousResponseId).toBe('resp_123');
  });

  it('tracks multi-turn conversation', () => {
    const history = new ConversationHistory();
    history.addUserMessage('What is Cpk?');
    history.addAssistantMessage('Cpk measures process capability', 'resp_1');
    history.addUserMessage('How to improve it?');
    history.addAssistantMessage('Reduce variation or center the process', 'resp_2');

    expect(history.messages).toHaveLength(4);
    expect(history.previousResponseId).toBe('resp_2');
  });

  it('toFallbackInput returns message copies', () => {
    const history = new ConversationHistory();
    history.addUserMessage('question');
    history.addAssistantMessage('answer', 'resp_1');

    const fallback = history.toFallbackInput();
    expect(fallback).toHaveLength(2);
    expect(fallback[0]).toEqual({ role: 'user', content: 'question' });
    expect(fallback[1]).toEqual({ role: 'assistant', content: 'answer' });
  });

  it('clear resets all state', () => {
    const history = new ConversationHistory();
    history.addUserMessage('test');
    history.addAssistantMessage('reply', 'resp_1');

    history.clear();
    expect(history.messages).toHaveLength(0);
    expect(history.previousResponseId).toBeNull();
  });

  it('toFallbackInput returns empty array after clear', () => {
    const history = new ConversationHistory();
    history.addUserMessage('test');
    history.clear();

    expect(history.toFallbackInput()).toEqual([]);
  });
});
