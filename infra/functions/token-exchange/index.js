/**
 * OBO Token Exchange Azure Function
 *
 * Exchanges a Teams SSO token for a Graph API access token via
 * the On-Behalf-Of (OBO) flow. This enables the client to access
 * OneDrive (sync, photo uploads) without an EasyAuth redirect.
 *
 * Security: Validates that the incoming SSO token's audience matches
 * the app's CLIENT_ID before performing the exchange.
 *
 * ## Token Cache Strategy
 *
 * By default, MSAL uses an in-memory cache scoped to the singleton
 * ConfidentialClientApplication instance. This works well for single-
 * instance deployments because the Azure Functions host keeps the
 * process alive between invocations, so cached tokens survive across
 * requests within the same instance.
 *
 * For scaled-out deployments (multiple Function App instances behind a
 * load balancer), each instance has its own isolated in-memory cache.
 * This means a token cached on instance A is invisible to instance B,
 * causing redundant token exchanges and increased latency.
 *
 * ### Enabling Distributed Cache
 *
 * Set the `MSAL_CACHE_LOCATION` environment variable to a writable
 * directory path (e.g., `/home/data/msal-cache`) to enable file-based
 * persistence via `@azure/msal-node-extensions`. On Azure Functions
 * (Consumption/Premium plans), `/home/` is a shared SMB mount across
 * all instances, so the cache file is accessible from every instance.
 *
 * When `MSAL_CACHE_LOCATION` is not set, behavior is identical to
 * the previous in-memory-only implementation — zero change for
 * existing deployments.
 *
 * Environment variables:
 *   CLIENT_ID            — Azure AD App Registration client ID
 *   CLIENT_SECRET        — Azure AD App Registration client secret
 *   TENANT_ID            — Azure AD tenant ID
 *   ALLOWED_ORIGIN       — CORS allowed origin (defaults to '*' for dev)
 *   FUNCTION_KEY         — Optional function-level auth key (skipped if unset)
 *   MSAL_CACHE_LOCATION  — Optional directory for persistent token cache.
 *                           Set to a shared mount (e.g., /home/data/msal-cache)
 *                           for multi-instance scaling. Omit for in-memory only.
 */

const msal = require('@azure/msal-node');
const path = require('path');
const fs = require('fs');

const config = {
  auth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
  },
};

/** @type {msal.ConfidentialClientApplication | null} */
let cca;

/** @type {boolean} */
let cacheInitialized = false;

/**
 * Build a cache plugin that persists the MSAL token cache to a JSON file.
 *
 * Uses the low-level `ICachePlugin` interface from @azure/msal-node so that
 * the cache is loaded before and saved after every token operation. The file
 * is stored on a shared mount (e.g., /home/ on Azure Functions) so all
 * scaled-out instances share the same cache.
 *
 * @param {string} cacheDir - Directory to store the cache file
 * @returns {msal.ICachePlugin} MSAL cache plugin
 */
function buildFileCachePlugin(cacheDir) {
  const cacheFilePath = path.join(cacheDir, 'msal-token-cache.json');

  return {
    /**
     * Called before MSAL accesses the cache. Reads persisted data from disk
     * and deserializes it into the in-memory cache.
     * @param {msal.TokenCacheContext} cacheContext
     */
    async beforeCacheAccess(cacheContext) {
      try {
        if (fs.existsSync(cacheFilePath)) {
          const data = fs.readFileSync(cacheFilePath, 'utf-8');
          cacheContext.tokenCache.deserialize(data);
        }
      } catch (err) {
        // Non-fatal: fall back to empty cache if file is corrupt or unreadable
        if (process.env.NODE_ENV !== 'test') {
          console.warn('MSAL cache read failed, starting with empty cache:', err.message);
        }
      }
    },

    /**
     * Called after MSAL modifies the cache. Serializes the in-memory cache
     * and writes it to disk if the cache has changed.
     * @param {msal.TokenCacheContext} cacheContext
     */
    async afterCacheAccess(cacheContext) {
      if (cacheContext.cacheHasChanged) {
        try {
          const data = cacheContext.tokenCache.serialize();
          fs.writeFileSync(cacheFilePath, data, 'utf-8');
        } catch (err) {
          // Non-fatal: tokens will still work in-memory for this invocation
          if (process.env.NODE_ENV !== 'test') {
            console.warn('MSAL cache write failed:', err.message);
          }
        }
      }
    },
  };
}

/**
 * Get or create the MSAL ConfidentialClientApplication singleton.
 *
 * On first call, checks whether `MSAL_CACHE_LOCATION` is set. If so,
 * creates the directory (if needed) and attaches a file-based cache plugin.
 * Otherwise, uses the default in-memory cache.
 *
 * @returns {msal.ConfidentialClientApplication}
 */
function getClient() {
  if (!cca) {
    const cacheLocation = process.env.MSAL_CACHE_LOCATION;

    if (cacheLocation && !cacheInitialized) {
      try {
        // Ensure the cache directory exists
        fs.mkdirSync(cacheLocation, { recursive: true });

        const cachePlugin = buildFileCachePlugin(cacheLocation);
        config.cache = { cachePlugin };
        cacheInitialized = true;
      } catch (err) {
        // If we cannot create the directory, fall back to in-memory cache
        console.warn(
          'MSAL persistent cache setup failed, falling back to in-memory:',
          err.message
        );
      }
    }

    cca = new msal.ConfidentialClientApplication(config);
  }
  return cca;
}

/**
 * Validate that the JWT's audience matches our app's CLIENT_ID.
 * Pre-check only — MSAL performs full cryptographic token validation during
 * OBO exchange. This prevents unnecessary OBO calls for tokens issued to other apps.
 */
function validateAudience(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload.aud === process.env.CLIENT_ID;
  } catch {
    return false;
  }
}

/**
 * Allowlist of Graph scopes the client can request via OBO.
 * The client sends a `scopes` array; any scope not in this set is rejected.
 */
const ALLOWED_SCOPES = new Set([
  'https://graph.microsoft.com/Files.ReadWrite.All',
  'https://graph.microsoft.com/Sites.Read.All',
  'https://graph.microsoft.com/ChannelMessage.Send',
  'https://graph.microsoft.com/People.Read',
]);

const DEFAULT_SCOPES = ['https://graph.microsoft.com/Files.ReadWrite.All'];

/**
 * CORS headers applied to every response.
 */
function getCorsHeaders() {
  const origin = process.env.ALLOWED_ORIGIN;
  if (!origin) throw new Error('ALLOWED_ORIGIN environment variable is required');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Functions-Key',
  };
}

/**
 * Validate that all requested scopes are in the allowlist.
 * Returns the validated scopes array, or null if any scope is invalid.
 */
function validateScopes(requestedScopes) {
  if (!requestedScopes || !Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return DEFAULT_SCOPES;
  }
  for (const scope of requestedScopes) {
    if (typeof scope !== 'string' || !ALLOWED_SCOPES.has(scope)) {
      return null;
    }
  }
  return requestedScopes;
}

module.exports = async function (context, req) {
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    context.res = { status: 405, headers: corsHeaders, body: { error: 'Method not allowed' } };
    return;
  }

  // Function-level auth check
  const functionKey = process.env.FUNCTION_KEY;
  if (!functionKey) throw new Error('FUNCTION_KEY environment variable is required');
  if (req.headers['x-functions-key'] !== functionKey) {
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Unauthorized' },
    };
    return;
  }

  const token = req.body?.token;
  if (!token || typeof token !== 'string') {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Missing or invalid token in request body' },
    };
    return;
  }

  // Validate audience before exchanging
  if (!validateAudience(token)) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Token audience mismatch' },
    };
    return;
  }

  // Validate and resolve scopes
  const scopes = validateScopes(req.body?.scopes);
  if (scopes === null) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Invalid or disallowed scope requested' },
    };
    return;
  }

  try {
    const client = getClient();
    const result = await client.acquireTokenOnBehalfOf({
      oboAssertion: token,
      scopes,
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: {
        accessToken: result.accessToken,
        expiresOn: result.expiresOn?.toISOString(),
      },
    };
  } catch (err) {
    context.log.error('OBO token exchange failed:', err.message);
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: { error: 'Token exchange failed' },
    };
  }
};
