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

// Build dynamic connect-src to include Azure Function URL for OBO token exchange
const functionUrl = process.env.FUNCTION_URL || '';
let connectSrc = "'self' https://graph.microsoft.com";
if (functionUrl) {
  try {
    connectSrc += ` ${new URL(functionUrl).origin}`;
  } catch {
    // Invalid FUNCTION_URL — ignore, CSP stays without it
  }
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
    "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com https://*.skype.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // X-Frame-Options removed: CSP frame-ancestors supersedes it and supports multiple origins.
  // Teams requires iframe embedding which X-Frame-Options: DENY would block.
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
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
