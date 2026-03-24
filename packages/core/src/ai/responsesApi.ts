/**
 * Azure AI Foundry Responses API client for CoScout.
 *
 * Replaces the Chat Completions message array pattern with stateful multi-turn
 * conversations via `previous_response_id`. The API manages conversation state
 * server-side, significantly simplifying client-side conversation management.
 *
 * Ref: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses
 *
 * @module
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface ResponsesApiConfig {
  /** Azure AI Foundry / OpenAI endpoint (e.g., https://myresource.openai.azure.com) */
  endpoint: string;
  /** Model deployment name (passed as 'model' in the request body) */
  deployment: string;
  /** API key or Entra ID bearer token for authentication */
  apiKey: string;
}

export interface ToolDefinition {
  type: 'function';
  /** Function name — v1 API uses flat format (not nested under function) */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON Schema describing the function parameters */
  parameters: Record<string, unknown> & { strict?: boolean };
}

/** A single content part within a multimodal message */
export interface InputContentPart {
  type: 'input_text' | 'input_image';
  text?: string;
  image_url?: string;
  detail?: 'auto' | 'low' | 'high';
}

/** Message content — plain string or multimodal content parts */
export type MessageContent = string | InputContentPart[];

export interface ResponsesApiRequest {
  /** User input — text string or structured messages */
  input: string | Array<{ role: string; content: MessageContent } | FunctionCallOutput>;
  /** System prompt / instructions */
  instructions?: string;
  /** Previous response ID for multi-turn continuity */
  previous_response_id?: string;
  /** Tool definitions for function calling */
  tools?: ToolDefinition[];
  /** Whether to stream the response */
  stream?: boolean;
  /** Model deployment (passed as 'model' in the body) */
  model: string;
  /** Enable server-side conversation storage for prompt caching */
  store?: boolean;
  /** Tool choice: 'auto' | 'none' | 'required' | { type: 'function', name: string } */
  tool_choice?: string | { type: 'function'; name: string };
  /** Structured output format for text responses */
  text?: { format: TextFormat };
  /** Prompt cache key for server-side caching of system prompts */
  prompt_cache_key?: string;
  /** Reasoning configuration for GPT-5.4 models */
  reasoning?: {
    effort?: 'none' | 'low' | 'medium' | 'high';
    summary?: 'auto' | 'concise' | 'detailed';
  };
  /** Truncation strategy for long contexts */
  truncation?: string;
}

/** Structured output format — JSON Schema */
export interface TextFormat {
  type: 'json_schema';
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

/** Function call output sent back to the model after executing a tool */
export interface FunctionCallOutput {
  type: 'function_call_output';
  call_id: string;
  output: string;
}

/** Map of tool name → handler function for the tool call loop */
export type ToolHandlerMap = Record<string, (args: Record<string, unknown>) => Promise<string>>;

export interface ResponseOutput {
  type: 'message' | 'function_call';
  /** For type='message': the content items */
  content?: Array<{ type: string; text?: string }>;
  /** For type='function_call': the function details */
  name?: string;
  arguments?: string;
  call_id?: string;
}

export interface ResponsesApiResponse {
  id: string;
  output: ResponseOutput[];
  /** Usage statistics */
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_tokens_details?: { cached_tokens?: number };
    output_tokens_details?: { reasoning_tokens?: number };
  };
}

// ── Typed Error ──────────────────────────────────────────────────────────

/** Typed error for Responses API failures */
export class ResponsesApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string
  ) {
    super(`Responses API error ${status}: ${body}`);
    this.name = 'ResponsesApiError';
  }

  get isRateLimit(): boolean {
    return this.status === 429;
  }
  get isServerError(): boolean {
    return this.status >= 500;
  }
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
  get isRetryable(): boolean {
    return this.isRateLimit || this.isServerError;
  }
}

// ── Retry Logic ──────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Retry a fetch-based operation with exponential backoff + jitter.
 * Only retries on ResponsesApiError where isRetryable is true (429, 5xx).
 * Respects Retry-After header when present.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  signal?: AbortSignal
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !(err instanceof ResponsesApiError) || !err.isRetryable) {
        throw err;
      }

      if (signal?.aborted) throw err;

      // Calculate delay: respect Retry-After or use exponential backoff + jitter
      let delayMs: number;
      const retryAfter = parseRetryAfter(err.body);
      if (retryAfter !== null) {
        delayMs = retryAfter;
      } else {
        const exponential = BASE_DELAY_MS * Math.pow(2, attempt);
        const jitter = Math.random() * BASE_DELAY_MS;
        delayMs = exponential + jitter;
      }

      await sleep(delayMs, signal);
    }
  }
  throw lastError; // unreachable, but satisfies TS
}

/** Parse Retry-After from error body (JSON { retry_after: seconds } or header-style) */
function parseRetryAfter(body: string): number | null {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.error?.retry_after === 'number') {
      return parsed.error.retry_after * 1000;
    }
    if (typeof parsed?.retry_after === 'number') {
      return parsed.retry_after * 1000;
    }
  } catch {
    // Not JSON — ignore
  }
  return null;
}

/** Abortable sleep */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true }
    );
  });
}

// ── API Client ───────────────────────────────────────────────────────────

/**
 * Build the v1 API URL. The v1 format uses /openai/v1/responses (not deployment-based).
 * The deployment name is passed as 'model' in the request body instead.
 * Ref: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses
 */
function buildUrl(config: ResponsesApiConfig): string {
  return `${config.endpoint}/openai/v1/responses`;
}

/** Build auth headers — supports both API key and Entra ID bearer token */
function buildHeaders(config: ResponsesApiConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Entra ID tokens are JWTs (three dot-separated segments starting with 'ey'),
  // API keys are shorter hex strings without dots.
  const isJwt = config.apiKey.split('.').length === 3 && config.apiKey.startsWith('ey');
  if (isJwt) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  } else {
    headers['api-key'] = config.apiKey;
  }
  return headers;
}

/**
 * Send a single CoScout conversation turn via the Responses API.
 * Returns the full response including the response ID for multi-turn chaining.
 */
export async function sendResponsesTurn(
  config: ResponsesApiConfig,
  request: Omit<ResponsesApiRequest, 'model' | 'stream'>
): Promise<ResponsesApiResponse> {
  return retryWithBackoff(async () => {
    const url = buildUrl(config);

    const body: ResponsesApiRequest = {
      ...request,
      model: config.deployment,
      stream: false,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new ResponsesApiError(res.status, res.statusText, errorText);
    }

    return res.json() as Promise<ResponsesApiResponse>;
  });
}

/** Internal result from a single streaming turn — may be text or function calls */
interface StreamTurnResult {
  response: ResponsesApiResponse;
  /** Pending function calls that need execution before continuing */
  functionCalls: Array<{ name: string; arguments: string; call_id: string }>;
}

/**
 * Stream a single Responses API turn via SSE.
 * Calls `onChunk` with each text delta as it arrives.
 * Returns both the response and any pending function calls.
 */
export async function streamResponsesTurn(
  config: ResponsesApiConfig,
  request: Omit<ResponsesApiRequest, 'model' | 'stream'>,
  onChunk: (delta: string) => void,
  signal: AbortSignal
): Promise<ResponsesApiResponse> {
  const result = await streamSingleTurn(config, request, onChunk, signal);
  return result.response;
}

async function streamSingleTurn(
  config: ResponsesApiConfig,
  request: Omit<ResponsesApiRequest, 'model' | 'stream'>,
  onChunk: (delta: string) => void,
  signal: AbortSignal
): Promise<StreamTurnResult> {
  // Retry only the HTTP request — once streaming starts, retrying would duplicate output
  const res = await retryWithBackoff(
    async () => {
      const url = buildUrl(config);

      const body: ResponsesApiRequest = {
        ...request,
        model: config.deployment,
        stream: true,
      };

      const r = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify(body),
        signal,
      });

      if (!r.ok) {
        const errorText = await r.text().catch(() => 'Unknown error');
        throw new ResponsesApiError(r.status, r.statusText, errorText);
      }

      return r;
    },
    MAX_RETRIES,
    signal
  );

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  let responseId = '';
  let fullText = '';
  const usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
  const functionCalls: Array<{ name: string; arguments: string; call_id: string }> = [];
  // Track in-progress function call argument assembly
  const pendingArgs: Record<string, string> = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;

        try {
          const data = JSON.parse(line.slice(6));

          // Capture response ID from first event
          if (data.id && !responseId) responseId = data.id;

          // Extract text deltas
          if (data.type === 'response.output_text.delta' && data.delta) {
            fullText += data.delta;
            onChunk(data.delta);
          }

          // Function call argument deltas
          if (data.type === 'response.function_call_arguments.delta' && data.delta) {
            const itemId = data.item_id || 'default';
            pendingArgs[itemId] = (pendingArgs[itemId] || '') + data.delta;
          }

          // Function call completed
          if (data.type === 'response.function_call_arguments.done') {
            const itemId = data.item_id || 'default';
            functionCalls.push({
              name: data.name || '',
              arguments: pendingArgs[itemId] || data.arguments || '',
              call_id: data.call_id || '',
            });
            delete pendingArgs[itemId];
          }

          // Also capture function calls from response.output_item.done
          if (data.type === 'response.output_item.done' && data.item?.type === 'function_call') {
            const item = data.item;
            // Only add if not already captured via arguments.done
            if (!functionCalls.some(fc => fc.call_id === item.call_id)) {
              functionCalls.push({
                name: item.name || '',
                arguments: item.arguments || '',
                call_id: item.call_id || '',
              });
            }
          }

          // Capture usage from completed event
          if (data.type === 'response.completed' && data.response?.usage) {
            Object.assign(usage, data.response.usage);
            if (data.response.id) responseId = data.response.id;
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const output: ResponseOutput[] = [];
  if (fullText) {
    output.push({ type: 'message', content: [{ type: 'text', text: fullText }] });
  }
  for (const fc of functionCalls) {
    output.push({
      type: 'function_call',
      name: fc.name,
      arguments: fc.arguments,
      call_id: fc.call_id,
    });
  }
  if (output.length === 0) {
    output.push({ type: 'message', content: [{ type: 'text', text: fullText }] });
  }

  return {
    response: { id: responseId, output, usage },
    functionCalls,
  };
}

/**
 * Stream a Responses API conversation with automatic tool call loop.
 *
 * Streams the first turn, and if the model calls functions, executes them
 * via the provided handlers and sends the results back. Continues until
 * the model produces a text response (no more function calls).
 *
 * Max 5 tool call rounds to prevent infinite loops.
 */
export async function streamResponsesWithToolLoop(
  config: ResponsesApiConfig,
  request: Omit<ResponsesApiRequest, 'model' | 'stream'>,
  toolHandlers: ToolHandlerMap,
  onChunk: (delta: string) => void,
  signal: AbortSignal
): Promise<ResponsesApiResponse> {
  const MAX_ROUNDS = 5;
  let currentRequest = { ...request };
  let lastResponse: ResponsesApiResponse | undefined;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    if (signal.aborted) break;

    const turnResult = await streamSingleTurn(config, currentRequest, onChunk, signal);
    lastResponse = turnResult.response;

    // No function calls — we have a text response, done
    if (turnResult.functionCalls.length === 0) {
      return lastResponse;
    }

    // Execute function calls and build output for next turn
    const functionOutputs: FunctionCallOutput[] = [];
    for (const fc of turnResult.functionCalls) {
      const handler = toolHandlers[fc.name];
      let output: string;
      if (handler) {
        try {
          const args = JSON.parse(fc.arguments || '{}') as Record<string, unknown>;
          output = await handler(args);
        } catch (err) {
          output = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
        }
      } else {
        output = JSON.stringify({ error: `Unknown tool: ${fc.name}` });
      }
      functionOutputs.push({ type: 'function_call_output', call_id: fc.call_id, output });
    }

    // Send function outputs as the next turn input, chained via previous_response_id
    currentRequest = {
      ...request,
      input: functionOutputs,
      previous_response_id: lastResponse.id,
    };
  }

  // Exhausted rounds — return whatever we have
  return (
    lastResponse || {
      id: '',
      output: [],
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    }
  );
}

/**
 * Extract the text content from a Responses API response.
 */
export function extractResponseText(response: ResponsesApiResponse): string {
  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const c of item.content) {
        if (c.type === 'text' && c.text) return c.text;
      }
    }
  }
  return '';
}

/**
 * Client-side conversation history backup.
 *
 * Maintains a parallel record of the conversation alongside the server-side
 * previous_response_id chain. If the server session expires, toFallbackInput()
 * provides the message history for replay.
 */
export class ConversationHistory {
  messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  previousResponseId: string | null = null;

  addUserMessage(content: string): void {
    this.messages.push({ role: 'user', content });
  }

  addAssistantMessage(content: string, responseId: string): void {
    this.messages.push({ role: 'assistant', content });
    this.previousResponseId = responseId;
  }

  /** Fallback input for when previous_response_id session has expired */
  toFallbackInput(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return this.messages.map(m => ({ role: m.role, content: m.content }));
  }

  clear(): void {
    this.messages = [];
    this.previousResponseId = null;
  }
}
