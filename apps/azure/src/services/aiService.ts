/**
 * AI Service for Azure AI Foundry integration.
 * Handles narration requests with caching, retry, and auth.
 */

import type { AIContext, AIErrorType } from '@variscout/core';
import { buildNarrationSystemPrompt, buildSummaryPrompt } from '@variscout/core';

const CACHE_KEY_PREFIX = 'variscout-ai-cache-';
const CHIP_CACHE_KEY_PREFIX = 'variscout-ai-chip-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  text: string;
  timestamp: number;
}

/**
 * Get the AI endpoint from environment variable.
 * Returns null if not configured (AI features hidden).
 */
export function getAIEndpoint(): string | null {
  return import.meta.env.VITE_AI_ENDPOINT || null;
}

/**
 * Check if AI features are available (endpoint configured).
 */
export function isAIAvailable(): boolean {
  return getAIEndpoint() !== null;
}

/**
 * Get cached response from localStorage.
 */
function getCachedResponse(key: string): string | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
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
function setCachedResponse(key: string, text: string): void {
  try {
    const entry: CacheEntry = { text, timestamp: Date.now() };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));
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
 * Fetch a narration from Azure AI Foundry.
 * Used as the `fetchNarration` callback for useNarration hook.
 */
export async function fetchNarration(context: AIContext): Promise<string> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  // Build the prompt
  const systemPrompt = buildNarrationSystemPrompt();
  const userPrompt = buildSummaryPrompt(context);

  // Simple cache key from user prompt hash
  let cacheKey = 0;
  for (let i = 0; i < userPrompt.length; i++) {
    cacheKey = ((cacheKey << 5) - cacheKey + userPrompt.charCodeAt(i)) | 0;
  }
  const cacheKeyStr = String(cacheKey);

  // Check cache
  const cached = getCachedResponse(cacheKeyStr);
  if (cached) return cached;

  // Get auth token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    // Try EasyAuth token for Cognitive Services scope
    const tokenResponse = await fetch('/.auth/me');
    if (tokenResponse.ok) {
      const authData = await tokenResponse.json();
      const accessToken = authData?.[0]?.access_token;
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }
  } catch {
    // Dev mode — no auth header needed for local endpoints
  }

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
      setCachedResponse(cacheKeyStr, text);
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 2) throw lastError;
    }
  }

  throw lastError || new Error('AI request failed');
}

/**
 * Get cached chip response from localStorage.
 */
function getCachedChipResponse(key: string): string | null {
  try {
    const raw = localStorage.getItem(`${CHIP_CACHE_KEY_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${CHIP_CACHE_KEY_PREFIX}${key}`);
      return null;
    }
    return entry.text;
  } catch {
    return null;
  }
}

/**
 * Cache a chip response.
 */
function setCachedChipResponse(key: string, text: string): void {
  try {
    const entry: CacheEntry = { text, timestamp: Date.now() };
    localStorage.setItem(`${CHIP_CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Silently fail on quota exceeded
  }
}

/**
 * Fetch an AI-enhanced chart insight.
 * Lighter than fetchNarration: shorter output, lower temperature, no retry on rate-limit.
 * Falls back to deterministic insight (caller handles this) on any error.
 */
export async function fetchChartInsight(
  systemPromptKey: string,
  userPrompt: string
): Promise<string> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  // Cache key from user prompt hash
  let cacheKey = 0;
  for (let i = 0; i < userPrompt.length; i++) {
    cacheKey = ((cacheKey << 5) - cacheKey + userPrompt.charCodeAt(i)) | 0;
  }
  const cacheKeyStr = `chip-${String(cacheKey)}`;

  // Check cache (reuse same TTL, different prefix)
  const cached = getCachedChipResponse(cacheKeyStr);
  if (cached) return cached;

  // Auth header
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
  setCachedChipResponse(cacheKeyStr, text);
  return text;
}

/**
 * Fetch a copilot conversational response from Azure AI Foundry.
 * Used as the `fetchResponse` callback for useAICopilot hook.
 * No caching (conversations are contextual). Single retry on 429.
 */
export async function fetchCopilotResponse(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const endpoint = getAIEndpoint();
  if (!endpoint) throw new Error('AI endpoint not configured');

  // Auth header
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
