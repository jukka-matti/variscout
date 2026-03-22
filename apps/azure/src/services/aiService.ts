/**
 * AI Service for Azure AI Foundry integration.
 * Uses the Responses API exclusively (ADR-028).
 *
 * Handles narration, chart insight, and report requests with caching, retry, and auth.
 * CoScout conversations are handled directly via useAICoScout + streamResponsesWithToolLoop.
 */

import type { AIContext, AIErrorType, AITier, Locale, ResponsesApiConfig } from '@variscout/core';
import {
  buildNarrationSystemPrompt,
  buildSummaryPrompt,
  buildChartInsightSystemPrompt,
  sendResponsesTurn,
  extractResponseText,
  narrationResponseSchema,
  chartInsightResponseSchema,
  djb2Hash,
  traceAICall,
} from '@variscout/core';
import { getRuntimeConfig } from '../lib/runtimeConfig';

const CACHE_KEY_PREFIX = 'variscout-ai-cache-';
const CHIP_CACHE_KEY_PREFIX = 'variscout-ai-chip-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  text: string;
  timestamp: number;
}

/**
 * Get a human-readable label for the AI model provider.
 * Returns null if no AI endpoint is configured.
 */
export function getAIProviderLabel(): string | null {
  const endpoint = getAIEndpoint();
  if (!endpoint) return null;
  return 'Azure OpenAI';
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

// DJB2 hash imported from @variscout/core as djb2Hash
const hashString = djb2Hash;

/**
 * Get the AI endpoint from environment variable.
 * Returns null if not configured (AI features hidden).
 */
export function getAIEndpoint(): string | null {
  return getRuntimeConfig()?.aiEndpoint || import.meta.env.VITE_AI_ENDPOINT || null;
}

/**
 * Check if AI features are available.
 * AI is included in all plans — just requires a configured endpoint.
 */
export function isAIAvailable(): boolean {
  return getAIEndpoint() !== null;
}

/**
 * Build Responses API config for a specific model tier.
 *
 * Deployment names ('fast', 'reasoning') are stable — they match the ARM template
 * deployment names. The underlying model (e.g. gpt-5.4-nano) is managed by Azure
 * via `versionUpgradeOption: "OnceCurrentVersionExpired"`.
 *
 * Auth: In production, fetches the EasyAuth bearer token.
 * In dev, falls back to VITE_AI_API_KEY env var.
 */
export async function getResponsesApiConfig(
  tier: AITier = 'reasoning'
): Promise<ResponsesApiConfig | undefined> {
  const endpoint = getAIEndpoint();
  if (!endpoint) return undefined;

  // Extract base endpoint (strip deployment path if present for legacy Chat Completions URLs)
  // Chat Completions URL: https://foo.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=...
  // Responses API needs: https://foo.openai.azure.com
  let baseEndpoint = endpoint;
  const deploymentMatch = endpoint.match(/^(https:\/\/[^/]+)/);
  if (deploymentMatch) {
    baseEndpoint = deploymentMatch[1];
  }

  // Deployment name resolution:
  // 1. Explicit env var override (dev only)
  // 2. Extract from URL (legacy config)
  // 3. Use tier name directly — matches ARM deployment names ('fast' or 'reasoning')
  let deployment = import.meta.env.VITE_RESPONSES_API_DEPLOYMENT || '';
  if (!deployment) {
    const pathMatch = endpoint.match(/\/deployments\/([^/]+)/);
    deployment = pathMatch?.[1] || tier;
  }

  // Auth: try EasyAuth token first (production), fall back to env var (dev)
  let apiKey = '';
  try {
    const tokenResponse = await fetch('/.auth/me');
    if (tokenResponse.ok) {
      const authData = await tokenResponse.json();
      const accessToken = authData?.[0]?.access_token;
      if (accessToken) apiKey = accessToken;
    }
  } catch {
    // Dev mode — no EasyAuth available
  }
  if (!apiKey) {
    apiKey = import.meta.env.VITE_AI_API_KEY || '';
  }

  return {
    endpoint: baseEndpoint,
    deployment,
    apiKey,
  };
}

/**
 * Get cached response from localStorage.
 */
function getCached(prefix: string, key: string): string | null {
  try {
    const raw = localStorage.getItem(`${prefix}${key}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${prefix}${key}`);
      return null;
    }
    return entry.text;
  } catch {
    return null;
  }
}

/**
 * Cache a response.
 */
function setCached(prefix: string, key: string, text: string): void {
  try {
    const entry: CacheEntry = { text, timestamp: Date.now() };
    localStorage.setItem(`${prefix}${key}`, JSON.stringify(entry));
  } catch {
    // Silently fail on quota exceeded
  }
}

/**
 * Classify an error for appropriate UI feedback.
 */
// Re-export AIErrorType from core (canonical definition)
export type { AIErrorType } from '@variscout/core';

export function classifyError(status: number, message?: string): AIErrorType {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  if (status === 0 || message?.includes('fetch')) return 'network';
  if (status >= 500) return 'server';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Public API — Responses API only
// ---------------------------------------------------------------------------

/**
 * Fetch a narration from Azure AI Foundry via the Responses API.
 * Uses structured output (narrationResponseSchema) for guaranteed format.
 */
export async function fetchNarration(context: AIContext): Promise<string> {
  if (!getAIEndpoint()) throw new Error('AI endpoint not configured');

  const systemPrompt = buildNarrationSystemPrompt(context.glossaryFragment, context.locale);
  const userPrompt = buildSummaryPrompt(context);

  // Simple cache key from user prompt hash (includes locale for cache isolation)
  const cacheKeyStr = hashString(`${context.locale || 'en'}:${userPrompt}`);

  // Check cache before resolving API config (avoids unnecessary auth calls)
  const cached = getCached(CACHE_KEY_PREFIX, cacheKeyStr);
  if (cached) return cached;

  const config = await getResponsesApiConfig('fast');
  if (!config) throw new Error('AI endpoint not configured');

  // Retry logic is handled by sendResponsesTurn (retryWithBackoff)
  const { result: text } = await traceAICall({ feature: 'narration' }, async () => {
    const response = await sendResponsesTurn(config, {
      instructions: systemPrompt,
      input: userPrompt,
      store: true,
      prompt_cache_key: 'variscout-narration',
      reasoning: { effort: 'none' },
      text: {
        format: {
          type: 'json_schema',
          name: 'narration_response',
          schema: narrationResponseSchema,
          strict: true,
        },
      },
    });

    const rawText = extractResponseText(response);
    if (!rawText) throw new Error('Empty response from AI');

    // Parse structured output — extract just the text field
    let parsed: string;
    try {
      const obj = JSON.parse(rawText) as { text: string };
      parsed = obj.text;
    } catch {
      // Fallback: use raw text if structured parsing fails
      parsed = rawText;
    }
    if (!parsed) throw new Error('Empty response from AI');

    return {
      result: parsed,
      tokens: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
            cachedTokens: response.usage.input_tokens_details?.cached_tokens,
            reasoningTokens: response.usage.output_tokens_details?.reasoning_tokens,
          }
        : undefined,
    };
  });

  // Cache successful response
  setCached(CACHE_KEY_PREFIX, cacheKeyStr, text);
  return text;
}

/**
 * Fetch an AI-enhanced chart insight via the Responses API.
 * Uses structured output (chartInsightResponseSchema).
 * Single attempt — falls back to deterministic insight on error.
 */
export async function fetchChartInsight(userPrompt: string, locale?: Locale): Promise<string> {
  if (!getAIEndpoint()) throw new Error('AI endpoint not configured');

  // Cache key from user prompt hash (includes locale for cache isolation)
  const cacheKeyStr = `chip-${hashString(`${locale || 'en'}:${userPrompt}`)}`;

  // Check cache before resolving API config (avoids unnecessary auth calls)
  const cached = getCached(CHIP_CACHE_KEY_PREFIX, cacheKeyStr);
  if (cached) return cached;

  const config = await getResponsesApiConfig('fast');
  if (!config) throw new Error('AI endpoint not configured');

  const systemPrompt = buildChartInsightSystemPrompt(locale);

  const { result: text } = await traceAICall({ feature: 'chart-insight' }, async () => {
    const response = await sendResponsesTurn(config, {
      instructions: systemPrompt,
      input: userPrompt,
      store: true,
      prompt_cache_key: 'variscout-chip',
      reasoning: { effort: 'none' },
      text: {
        format: {
          type: 'json_schema',
          name: 'chart_insight_response',
          schema: chartInsightResponseSchema,
          strict: true,
        },
      },
    });

    const rawText = extractResponseText(response);
    if (!rawText) throw new Error('Empty response from AI');

    // Parse structured output — extract just the text field
    let parsed: string;
    try {
      const obj = JSON.parse(rawText) as { text: string };
      parsed = obj.text;
    } catch {
      parsed = rawText;
    }
    if (!parsed) throw new Error('Empty response from AI');

    return {
      result: parsed,
      tokens: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
            cachedTokens: response.usage.input_tokens_details?.cached_tokens,
            reasoningTokens: response.usage.output_tokens_details?.reasoning_tokens,
          }
        : undefined,
    };
  });

  // Cache successful response
  setCached(CHIP_CACHE_KEY_PREFIX, cacheKeyStr, text);
  return text;
}

/**
 * Fetch an AI-generated findings report via the Responses API.
 * Free-form Markdown output (no structured schema).
 * Retry is handled by the underlying sendResponsesTurn (retryWithBackoff).
 */
export async function fetchFindingsReport(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const config = await getResponsesApiConfig('reasoning');
  if (!config) throw new Error('AI endpoint not configured');

  // Separate system/instructions from input messages
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  const instructions = systemMessages.map(m => m.content).join('\n\n');

  // Retry logic is handled by sendResponsesTurn (retryWithBackoff)
  const { result: text } = await traceAICall({ feature: 'report' }, async () => {
    const response = await sendResponsesTurn(config, {
      instructions,
      input: nonSystemMessages,
      store: true,
      prompt_cache_key: 'variscout-report',
      reasoning: { effort: 'low' },
    });

    const responseText = extractResponseText(response);
    if (!responseText) throw new Error('Empty response from AI');

    return {
      result: responseText,
      tokens: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
            cachedTokens: response.usage.input_tokens_details?.cached_tokens,
            reasoningTokens: response.usage.output_tokens_details?.reasoning_tokens,
          }
        : undefined,
    };
  });

  return text;
}
