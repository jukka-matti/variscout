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
  parameters: Record<string, unknown>;
}

export interface ResponsesApiRequest {
  /** User input — text string or structured messages */
  input: string | Array<{ role: string; content: string }>;
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
}

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
  };
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
    throw new Error(`Responses API error ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<ResponsesApiResponse>;
}

/**
 * Stream a CoScout conversation turn via the Responses API (SSE).
 * Calls `onChunk` with each text delta as it arrives.
 */
export async function streamResponsesTurn(
  config: ResponsesApiConfig,
  request: Omit<ResponsesApiRequest, 'model' | 'stream'>,
  onChunk: (delta: string) => void,
  signal: AbortSignal
): Promise<ResponsesApiResponse> {
  const url = buildUrl(config);

  const body: ResponsesApiRequest = {
    ...request,
    model: config.deployment,
    stream: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Responses API error ${res.status}: ${errorText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  let responseId = '';
  let fullText = '';
  const usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

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

  return {
    id: responseId,
    output: [{ type: 'message', content: [{ type: 'text', text: fullText }] }],
    usage,
  };
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
