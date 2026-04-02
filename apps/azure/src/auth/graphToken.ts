/**
 * Graph API token acquisition — EasyAuth only (ADR-059).
 *
 * Teams SSO and OBO exchange removed. Token comes from EasyAuth token store.
 * Includes in-memory caching to avoid redundant /.auth/me calls.
 */

import { getAccessToken, isLocalDev } from './easyAuth';
import { AuthError } from './types';

const CACHE_MARGIN_MS = 5 * 60 * 1000; // 5 min before expiry

// ── Token cache ─────────────────────────────────────────────────────────

interface CachedToken {
  token: string;
  expiry: number;
}

let cachedToken: CachedToken | null = null;

function getCachedToken(): string | null {
  if (cachedToken && Date.now() < cachedToken.expiry - CACHE_MARGIN_MS) {
    return cachedToken.token;
  }
  return null;
}

function setCachedToken(token: string): void {
  // EasyAuth tokens typically last 1 hour; cache for 55 min (minus 5 min margin)
  cachedToken = { token, expiry: Date.now() + 3600_000 };
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Get a Graph API access token via EasyAuth.
 */
export async function getGraphToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;

  if (isLocalDev()) {
    throw new AuthError('Graph API not available locally', 'local_dev');
  }

  const token = await getAccessToken();
  setCachedToken(token);
  return token;
}

/** Clear the cached token (e.g. on logout). */
export function clearGraphTokenCache(): void {
  cachedToken = null;
}
