/**
 * Shared Graph API fetch wrapper with 429 throttle handling.
 *
 * All Graph API calls should use `graphFetch` instead of raw `fetch()`.
 * Handles Retry-After header parsing and throws GraphError on 429.
 *
 * Extracted from storage.ts to eliminate raw fetch() calls across services.
 */

// ── Graph API base URL ──────────────────────────────────────────────────

export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// ── Graph API errors ────────────────────────────────────────────────────

export class GraphError extends Error {
  retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'GraphError';
    this.retryAfterMs = retryAfterMs;
  }
}

/** Parse the Retry-After header value into milliseconds.
 *  The value can be seconds (integer) or an HTTP date string. */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  // Try as integer seconds first
  const seconds = parseInt(value, 10);
  if (!isNaN(seconds) && String(seconds) === value.trim()) {
    return seconds * 1000;
  }

  // Try as HTTP date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const ms = date.getTime() - Date.now();
    return ms > 0 ? ms : 1000; // at least 1s if date is in the past
  }

  return undefined;
}

/** Perform a Graph API fetch, throwing GraphError with retryAfterMs on 429. */
export async function graphFetch(url: string, init: globalThis.RequestInit): Promise<Response> {
  const response = await fetch(url, init);

  if (response.status === 429) {
    const retryAfterMs = parseRetryAfter(response.headers.get('Retry-After'));
    const body = await response.json().catch(() => ({}));
    const message = body.error?.message || `Graph API throttled: 429`;
    throw new GraphError(message, retryAfterMs);
  }

  return response;
}
