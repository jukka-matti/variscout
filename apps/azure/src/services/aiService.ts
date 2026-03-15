/**
 * AI Service for Azure AI Foundry integration.
 * Handles narration requests with caching, retry, and auth.
 */

import type { AIContext, AIErrorType } from '@variscout/core';
import { buildNarrationSystemPrompt, buildSummaryPrompt, isTeamAIPlan } from '@variscout/core';

const CACHE_KEY_PREFIX = 'variscout-ai-cache-';
const CHIP_CACHE_KEY_PREFIX = 'variscout-ai-chip-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  text: string;
  timestamp: number;
}

/**
 * DJB2 hash for cache keys.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return String(hash);
}

/**
 * Get the AI endpoint from environment variable.
 * Returns null if not configured (AI features hidden).
 */
export function getAIEndpoint(): string | null {
  return import.meta.env.VITE_AI_ENDPOINT || null;
}

/**
 * Check if AI features are available.
 * Requires Team AI plan and a configured AI endpoint.
 */
export function isAIAvailable(): boolean {
  return isTeamAIPlan() && getAIEndpoint() !== null;
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

/**
 * Get auth headers for AI requests.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const tokenResponse = await fetch('/.auth/me');
    if (tokenResponse.ok) {
      const authData = await tokenResponse.json();
      const accessToken = authData?.[0]?.access_token;
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }
  } catch {
    // Dev mode — no auth needed
  }
  return headers;
}

/**
 * Fetch a narration from Azure AI Foundry.
 * Used as the `fetchNarration` callback for useNarration hook.
 */
export async function fetchNarration(context: AIContext): Promise<string> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  // Build the prompt — glossary in system prompt for prompt caching
  const systemPrompt = buildNarrationSystemPrompt(context.glossaryFragment);
  const userPrompt = buildSummaryPrompt(context);

  // Simple cache key from user prompt hash
  const cacheKeyStr = hashString(userPrompt);

  // Check cache
  const cached = getCached(CACHE_KEY_PREFIX, cacheKeyStr);
  if (cached) return cached;

  const headers = await getAuthHeaders();

  // Retry with exponential backoff (max 3 attempts)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorType = classifyError(response.status);
        if (errorType === 'rate-limit' && attempt < 2) continue;
        throw new Error(`AI request failed (${errorType}): ${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('Empty response from AI');

      // Cache successful response
      setCached(CACHE_KEY_PREFIX, cacheKeyStr, text);
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 2) throw lastError;
    }
  }

  throw lastError || new Error('AI request failed');
}

/**
 * Fetch an AI-enhanced chart insight.
 * Lighter than fetchNarration: shorter output, lower temperature, no retry on rate-limit.
 * Falls back to deterministic insight (caller handles this) on any error.
 */
export async function fetchChartInsight(userPrompt: string): Promise<string> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  // Cache key from user prompt hash
  const cacheKeyStr = `chip-${hashString(userPrompt)}`;

  // Check cache
  const cached = getCached(CHIP_CACHE_KEY_PREFIX, cacheKeyStr);
  if (cached) return cached;

  const headers = await getAuthHeaders();

  // Single attempt — no retry (fall back to deterministic instead)
  const systemPrompt = `You are a quality engineering assistant for VariScout.
Enhance the provided deterministic insight with process context.
Respond in exactly one sentence, under 120 characters.
Be specific and actionable. Never invent data.`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 80,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI chip request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from AI');

  // Cache successful response
  setCached(CHIP_CACHE_KEY_PREFIX, cacheKeyStr, text);
  return text;
}

/**
 * Fetch a CoScout conversational response from Azure AI Foundry.
 * Used as the `fetchResponse` callback for useAICoScout hook.
 * No caching (conversations are contextual). Single retry on 429.
 */
export async function fetchCoScoutResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  const headers = await getAuthHeaders();

  // Single retry on 429
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          max_tokens: 800,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errorType = classifyError(response.status);
        if (errorType === 'rate-limit' && attempt < 1) continue;
        throw new Error(`AI request failed (${errorType}): ${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('Empty response from AI');

      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 1) throw lastError;
    }
  }

  throw lastError || new Error('AI request failed');
}

/**
 * Fetch a streaming CoScout response from Azure AI Foundry.
 * Calls onChunk for each token delta. Falls back to non-streaming on error.
 */
export async function fetchCoScoutStreamingResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  onChunk: (delta: string) => void,
  signal: AbortSignal
): Promise<void> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  const headers = await getAuthHeaders();

  // Single retry on 429
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (signal.aborted) return;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          messages,
          max_tokens: 800,
          temperature: 0.4,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorType = classifyError(response.status);
        if (errorType === 'rate-limit' && attempt < 1) continue;
        throw new Error(`AI request failed (${errorType}): ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (signal.aborted) return;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              onChunk(delta);
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }

      return;
    } catch (err) {
      if (signal.aborted) return;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 1) throw lastError;
    }
  }

  throw lastError || new Error('AI streaming request failed');
}
