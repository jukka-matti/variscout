// Zero-dependency static file server for Azure App Service.
// Serves the Vite build output from ./dist/ with SPA fallback routing.
// Uses only Node.js built-in modules — no npm install needed at runtime.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '8080', 10);

// Build dynamic connect-src for external services.
// Token exchange goes through same-origin /api/token-exchange proxy (no external Function URL needed in CSP).
let connectSrc = "'self' https://graph.microsoft.com https://*.sharepoint.com https://login.microsoftonline.com";
const aiEndpoint = process.env.AI_ENDPOINT || '';
const searchEndpoint = process.env.AI_SEARCH_ENDPOINT || '';
if (aiEndpoint) {
  try { connectSrc += ` ${new URL(aiEndpoint).origin}`; } catch { /* ignore */ }
}
if (searchEndpoint) {
  try { connectSrc += ` ${new URL(searchEndpoint).origin}`; } catch { /* ignore */ }
}

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    // Allow Teams to embed the app in an iframe
    "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com https://*.skype.com https://*.office.com https://*.cloud.microsoft",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // X-Frame-Options removed: CSP frame-ancestors supersedes it and supports multiple origins.
  // Teams requires iframe embedding which X-Frame-Options: DENY would block.
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=()',
};

function writeResponse(res, statusCode, headers) {
  res.writeHead(statusCode, { ...SECURITY_HEADERS, ...headers });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};

function cacheHeader(urlPath) {
  // Vite hashed assets get long-term immutable cache
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  return 'no-cache';
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Health endpoint for App Service health checks
  if (pathname === '/health') {
    writeResponse(res, 200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  // Proxy for OBO token exchange — keeps Function key server-side (not in client bundle).
  // The client calls /api/token-exchange (same-origin), this server injects the Function key
  // and forwards to the actual Azure Function.
  if (pathname === '/api/token-exchange' && req.method === 'POST') {
    const functionUrlEnv = process.env.FUNCTION_URL;
    if (!functionUrlEnv) {
      writeResponse(res, 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Token exchange not configured' }));
      return;
    }

    // Read request body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // Forward to Azure Function with server-side Function key
    const targetUrl = new URL('/api/token-exchange', functionUrlEnv);
    const proxyHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': body.length.toString(),
    };
    const functionKey = process.env.FUNCTION_KEY || '';
    if (functionKey) proxyHeaders['x-functions-key'] = functionKey;

    try {
      const proxyRes = await fetch(targetUrl, {
        method: 'POST',
        headers: proxyHeaders,
        body,
      });
      const responseBody = await proxyRes.text();
      writeResponse(res, proxyRes.status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(responseBody);
    } catch (err) {
      writeResponse(res, 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Token exchange proxy failed' }));
    }
    return;
  }

  // Runtime configuration endpoint — serves env vars as JSON.
  // Required for Marketplace deployments where Vite env vars are baked at build time.
  if (pathname === '/config') {
    const config = {
      plan: process.env.VITE_VARISCOUT_PLAN || 'standard',
      // functionUrl removed — token exchange now proxied through /api/token-exchange (same-origin)
      aiEndpoint: process.env.AI_ENDPOINT || '',
      aiSearchEndpoint: process.env.AI_SEARCH_ENDPOINT || '',
      aiSearchIndex: process.env.AI_SEARCH_INDEX || 'findings',
      appInsightsConnectionString: process.env.APPINSIGHTS_CONNECTION_STRING || process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    };
    writeResponse(res, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(JSON.stringify(config));
    return;
  }

  // Try to serve the exact file, fall back to index.html for SPA routing
  const ext = extname(pathname);
  const filePath = ext ? join(DIST, pathname) : null;

  try {
    if (filePath) {
      const data = await readFile(filePath);
      writeResponse(res, 200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': cacheHeader(pathname),
      });
      res.end(data);
      return;
    }
  } catch {
    // File with extension not found → 404 (don't serve index.html for missing .js/.css/etc)
    writeResponse(res, 404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // SPA fallback: serve index.html for all non-file routes (no extension)
  try {
    const html = await readFile(join(DIST, 'index.html'));
    writeResponse(res, 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    res.end(html);
  } catch {
    writeResponse(res, 500, { 'Content-Type': 'text/plain' });
    res.end('index.html not found');
  }
});

server.listen(PORT, () => {
  console.log(`VariScout serving from ${DIST} on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
