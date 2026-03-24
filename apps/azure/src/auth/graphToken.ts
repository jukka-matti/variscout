/**
 * Shared Graph API token acquisition.
 *
 * Tries Teams SSO → OBO exchange first (silent, no redirect).
 * Falls back to EasyAuth for Standard plan or when OBO is unavailable.
 * Includes in-memory token caching to avoid redundant OBO calls.
 */

import { getAccessToken, isLocalDev } from './easyAuth';
import { AuthError } from './types';
import { getTeamsSsoToken, isInTeams } from '../teams/teamsContext';

const CACHE_MARGIN_MS = 5 * 60 * 1000; // 5 min before expiry

// ── Token cache ─────────────────────────────────────────────────────────
// Keyed by scope string ('' for default, sorted scopes for scoped tokens)

interface CachedToken {
  token: string;
  expiry: number;
}

const tokenCache = new Map<string, CachedToken>();

function getCacheKey(scopes?: string[]): string {
  if (!scopes || scopes.length === 0) return '';
  return [...scopes].sort().join(' ');
}

function getCachedToken(scopes?: string[]): string | null {
  const key = getCacheKey(scopes);
  const cached = tokenCache.get(key);
  if (cached && Date.now() < cached.expiry - CACHE_MARGIN_MS) {
    return cached.token;
  }
  return null;
}

function setCachedToken(token: string, expiresOn: string | undefined, scopes?: string[]): void {
  const key = getCacheKey(scopes);
  const expiry = expiresOn ? new Date(expiresOn).getTime() : Date.now() + 3600_000;
  tokenCache.set(key, { token, expiry });
}

// ── Shared OBO exchange ─────────────────────────────────────────────────

/**
 * Exchange a Teams SSO token for a Graph API token via the server-side OBO proxy.
 * The proxy at /api/token-exchange injects the Function key server-side,
 * keeping it out of the client bundle.
 * Returns null if exchange fails or is unavailable.
 */
async function exchangeOboToken(scopes?: string[]): Promise<string | null> {
  if (!isInTeams()) return null;

  const ssoToken = await getTeamsSsoToken();
  if (!ssoToken) return null;

  try {
    const body: Record<string, unknown> = { token: ssoToken };
    if (scopes && scopes.length > 0) body.scopes = scopes;

    const res = await fetch('/api/token-exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        setCachedToken(data.accessToken, data.expiresOn, scopes);
        return data.accessToken;
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[GraphToken] OBO exchange failed:', err);
    }
  }

  return null;
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Get a Graph API access token.
 * Teams SSO → OBO → EasyAuth fallback chain.
 */
export async function getGraphToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;

  if (isLocalDev()) {
    throw new AuthError('Graph API not available locally', 'local_dev');
  }

  const oboToken = await exchangeOboToken();
  if (oboToken) return oboToken;

  // Fallback to EasyAuth
  return getAccessToken();
}

/**
 * Get a Graph API access token with specific scopes.
 * Used for @mention workflow which needs ChannelMessage.Send.
 *
 * Scopes are sent to the OBO function which validates against an allowlist.
 * Falls back to standard getGraphToken() if OBO is unavailable.
 */
export async function getGraphTokenWithScopes(scopes: string[]): Promise<string> {
  const cached = getCachedToken(scopes);
  if (cached) return cached;

  if (isLocalDev()) {
    throw new AuthError('Graph API not available locally', 'local_dev');
  }

  const oboToken = await exchangeOboToken(scopes);
  if (oboToken) return oboToken;

  // Fallback to standard token (may not have the requested scopes)
  return getGraphToken();
}

/**
 * Get a token for a specific resource (e.g., SharePoint site URL).
 * Used by OneDrive File Picker v8 which requests resource-scoped tokens.
 * OBO exchange with `{resource}/.default` scope.
 */
export async function getTokenForResource(resource: string): Promise<string> {
  const scopes = [`${resource}/.default`];
  const cached = getCachedToken(scopes);
  if (cached) return cached;

  if (isLocalDev()) {
    throw new AuthError('Token exchange not available locally', 'local_dev');
  }

  const oboToken = await exchangeOboToken(scopes);
  if (oboToken) return oboToken;

  // Fallback to standard token
  return getGraphToken();
}

/** Clear the cached token (e.g. on logout). */
export function clearGraphTokenCache(): void {
  tokenCache.clear();
}
