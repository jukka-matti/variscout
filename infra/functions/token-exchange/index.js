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
 *   CLIENT_ID     — Azure AD App Registration client ID
 *   CLIENT_SECRET — Azure AD App Registration client secret
 *   TENANT_ID     — Azure AD tenant ID
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

module.exports = async function (context, req) {
  // Only accept POST
  if (req.method !== 'POST') {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
    return;
  }

  const token = req.body?.token;
  if (!token || typeof token !== 'string') {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Missing or invalid token in request body' },
    };
    return;
  }

  // Validate audience before exchanging
  if (!validateAudience(token)) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Token audience mismatch' },
    };
    return;
  }

  try {
    const client = getClient();
    const result = await client.acquireTokenOnBehalfOf({
      oboAssertion: token,
      scopes: ['https://graph.microsoft.com/Files.ReadWrite.All'],
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        accessToken: result.accessToken,
        expiresOn: result.expiresOn?.toISOString(),
      },
    };
  } catch (err) {
    context.log.error('OBO token exchange failed:', err.message);
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Token exchange failed: ' + err.message },
    };
  }
};
