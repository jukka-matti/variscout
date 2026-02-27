/**
 * OBO Token Exchange Azure Function
 *
 * Exchanges a Teams SSO token for a Graph API access token via
 * the On-Behalf-Of (OBO) flow. This enables the client to access
 * OneDrive (photo uploads) without an EasyAuth redirect.
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

  try {
    const client = getClient();
    const result = await client.acquireTokenOnBehalfOf({
      oboAssertion: token,
      scopes: ['https://graph.microsoft.com/Files.ReadWrite'],
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { accessToken: result.accessToken },
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
