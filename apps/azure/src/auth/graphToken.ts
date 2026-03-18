/**
 * Shared Graph API token acquisition.
 *
 * Tries Teams SSO → OBO exchange first (silent, no redirect).
 * Falls back to EasyAuth for Standard plan or when OBO is unavailable.
 * Includes in-memory token caching to avoid redundant OBO calls.
 */

import { getAccessToken, isLocalDev, AuthError } from './easyAuth';
import { getTeamsSsoToken, isInTeams } from '../teams/teamsContext';
import { getRuntimeConfig } from '../lib/runtimeConfig';

function getFunctionKey(): string {
  return import.meta.env.VITE_FUNCTION_KEY || '';
}

function getFunctionUrl(): string {
  return getRuntimeConfig()?.functionUrl || import.meta.env.VITE_FUNCTION_URL || '';
}

const CACHE_MARGIN_MS = 5 * 60 * 1000; // 5 min before expiry

let cachedToken: string | null = null;
let cachedExpiry = 0;

/**
 * Get a Graph API access token.
 * Teams SSO → OBO → EasyAuth fallback chain.
 */
export async function getGraphToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedExpiry - CACHE_MARGIN_MS) {
    return cachedToken;
  }

  if (isLocalDev()) {
    throw new AuthError('Graph API not available locally', 'local_dev');
  }

  // Try Teams SSO → OBO exchange
  if (isInTeams() && getFunctionUrl()) {
    const ssoToken = await getTeamsSsoToken();
    if (ssoToken) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const functionKey = getFunctionKey();
        if (functionKey) headers['x-functions-key'] = functionKey;

        const res = await fetch(`${getFunctionUrl()}/api/token-exchange`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ token: ssoToken }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            cachedToken = data.accessToken;
            cachedExpiry = data.expiresOn
              ? new Date(data.expiresOn).getTime()
              : Date.now() + 3600_000;
            return data.accessToken;
          }
        }
      } catch (err) {
        console.warn('[GraphToken] OBO exchange failed, falling back to EasyAuth:', err);
      }
    }
  }

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
  if (isLocalDev()) {
    throw new AuthError('Graph API not available locally', 'local_dev');
  }

  // Try Teams SSO → OBO exchange with specific scopes
  if (isInTeams() && getFunctionUrl()) {
    const ssoToken = await getTeamsSsoToken();
    if (ssoToken) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const functionKey = getFunctionKey();
        if (functionKey) headers['x-functions-key'] = functionKey;

        const res = await fetch(`${getFunctionUrl()}/api/token-exchange`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ token: ssoToken, scopes }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            return data.accessToken;
          }
        }
      } catch (err) {
        console.warn('[GraphToken] Scoped OBO exchange failed:', err);
      }
    }
  }

  // Fallback to standard token (may not have the requested scopes)
  return getGraphToken();
}

/** Clear the cached token (e.g. on logout). */
export function clearGraphTokenCache(): void {
  cachedToken = null;
  cachedExpiry = 0;
}
