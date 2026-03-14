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
 * Environment variables:
 *   CLIENT_ID      — Azure AD App Registration client ID
 *   CLIENT_SECRET  — Azure AD App Registration client secret
 *   TENANT_ID      — Azure AD tenant ID
 *   ALLOWED_ORIGIN — CORS allowed origin (defaults to '*' for dev)
 *   FUNCTION_KEY   — Optional function-level auth key (skipped if unset)
 */

const msal = require('@azure/msal-node');

const config = {
  auth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
  },
};

let cca;

function getClient() {
  if (!cca) {
    cca = new msal.ConfidentialClientApplication(config);
  }
  return cca;
}

/**
 * Validate that the JWT's audience matches our app's CLIENT_ID.
 * Prevents the function from exchanging tokens issued for other apps.
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
  'https://graph.microsoft.com/ChannelMessage.Send',
  'https://graph.microsoft.com/People.Read',
]);

const DEFAULT_SCOPES = ['https://graph.microsoft.com/Files.ReadWrite.All'];

/**
 * CORS headers applied to every response.
 */
function getCorsHeaders() {
  const origin = process.env.ALLOWED_ORIGIN || '*';
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

  // Function-level auth check (skip if FUNCTION_KEY is not configured)
  const functionKey = process.env.FUNCTION_KEY;
  if (functionKey && req.headers['x-functions-key'] !== functionKey) {
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
