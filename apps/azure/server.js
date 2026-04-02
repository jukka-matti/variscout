// Static file server for Azure App Service built on Express.
// Serves the Vite build output from ./dist/ with SPA fallback routing.
// Migrated from raw Node HTTP to Express in ADR-060 to support upcoming KB endpoints
// (file upload via multer, JSON body parsing, cleaner route definitions).

import express from 'express';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '8080', 10);

// Build dynamic connect-src for external services.
// Graph API and SharePoint removed per ADR-059.
let connectSrc = "'self' https://login.microsoftonline.com";
const aiEndpoint = process.env.AI_ENDPOINT || '';
const searchEndpoint = process.env.AI_SEARCH_ENDPOINT || '';
if (aiEndpoint) {
  try { connectSrc += ` ${new URL(aiEndpoint).origin}`; } catch { /* ignore */ }
}
if (searchEndpoint) {
  try { connectSrc += ` ${new URL(searchEndpoint).origin}`; } catch { /* ignore */ }
}
// Blob Storage endpoint for Team plan cloud sync
const storageAccountForCsp = process.env.STORAGE_ACCOUNT_NAME || '';
if (storageAccountForCsp) {
  connectSrc += ` https://${storageAccountForCsp}.blob.core.windows.net`;
}
// App Insights ingestion endpoint — connection string is write-only (telemetry ingestion,
// not a secret). The browser SDK requires it to send telemetry. Each customer's telemetry
// goes to their own App Insights instance via their Azure deployment.
const aiConnString = process.env.APPINSIGHTS_CONNECTION_STRING || process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '';
const aiIngestMatch = aiConnString.match(/IngestionEndpoint=(https:\/\/[^;]+)/);
if (aiIngestMatch) {
  try { connectSrc += ` ${new URL(aiIngestMatch[1]).origin}`; } catch { /* ignore */ }
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

const app = express();
app.use(express.json());

// Apply security headers to every response
app.use((_req, res, next) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  next();
});

// Health endpoint for App Service health checks
app.get('/health', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).end('ok');
});

// OBO token exchange proxy removed per ADR-059 (Graph API removed, EasyAuth only)

// Runtime configuration endpoint — serves env vars as JSON.
// Required for Marketplace deployments where Vite env vars are baked at build time.
app.get('/config', (_req, res) => {
  const config = {
    plan: process.env.VITE_VARISCOUT_PLAN || 'standard',
    // functionUrl removed — token exchange now proxied through /api/token-exchange (same-origin)
    aiEndpoint: process.env.AI_ENDPOINT || '',
    aiSearchEndpoint: process.env.AI_SEARCH_ENDPOINT || '',
    aiSearchIndex: process.env.AI_SEARCH_INDEX || 'findings',
    appInsightsConnectionString: process.env.APPINSIGHTS_CONNECTION_STRING || process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    storageAccountName: process.env.STORAGE_ACCOUNT_NAME || '',
    storageContainerName: process.env.STORAGE_CONTAINER_NAME || 'variscout-projects',
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).end(JSON.stringify(config));
});

// SAS token generation for Blob Storage (Team plan cloud sync)
app.post('/api/storage-token', async (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  // LOCAL_DEV bypass blocked on App Service (WEBSITE_SITE_NAME is set by Azure)
  const isLocalDev = process.env.LOCAL_DEV && !process.env.WEBSITE_SITE_NAME;
  if (!principal && !isLocalDev) {
    res.setHeader('Content-Type', 'application/json');
    res.status(401).end(JSON.stringify({ error: 'Not authenticated' }));
    return;
  }

  try {
    const acctName = process.env.STORAGE_ACCOUNT_NAME;
    const containerName = process.env.STORAGE_CONTAINER_NAME || 'variscout-projects';

    if (!acctName) {
      res.setHeader('Content-Type', 'application/json');
      res.status(503).end(JSON.stringify({ error: 'Blob Storage not configured' }));
      return;
    }

    const { BlobServiceClient, generateBlobSASQueryParameters, ContainerSASPermissions, StorageSharedKeyCredential, SASProtocol } = await import('@azure/storage-blob');
    const { DefaultAzureCredential } = await import('@azure/identity');

    const blobServiceUrl = `https://${acctName}.blob.core.windows.net`;
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000);
    const startsOn = new Date(Date.now() - 5 * 60 * 1000);

    let sasUrl;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (connectionString) {
      // Local dev: use connection string
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
      if (!keyMatch) throw new Error('AccountKey not found in connection string');
      const sharedKeyCredential = new StorageSharedKeyCredential(blobServiceClient.accountName, keyMatch[1]);

      const sasToken = generateBlobSASQueryParameters({
        containerName,
        permissions: ContainerSASPermissions.parse('rwl'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      }, sharedKeyCredential).toString();

      sasUrl = `${blobServiceUrl}/${containerName}?${sasToken}`;
    } else {
      // Production: managed identity + user delegation key
      const credential = new DefaultAzureCredential();
      const blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);
      const delegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

      const sasToken = generateBlobSASQueryParameters({
        containerName,
        permissions: ContainerSASPermissions.parse('rwl'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      }, delegationKey, acctName).toString();

      sasUrl = `${blobServiceUrl}/${containerName}?${sasToken}`;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).end(JSON.stringify({ sasUrl, expiresOn: expiresOn.toISOString() }));
  } catch (err) {
    console.error('[storage-token]', err.message || err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).end(JSON.stringify({ error: 'Failed to generate storage token' }));
  }
});

// Static file serving + SPA fallback
// Express static middleware is not used here because we need the exact same routing logic
// as the original: files with extensions that don't exist → 404 (not SPA fallback),
// paths without extensions → SPA fallback.
app.get('*', async (req, res) => {
  const pathname = req.path;
  const ext = extname(pathname);
  const filePath = ext ? join(DIST, pathname) : null;

  try {
    if (filePath) {
      const data = await readFile(filePath);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', cacheHeader(pathname));
      res.status(200).end(data);
      return;
    }
  } catch {
    // File with extension not found → 404 (don't serve index.html for missing .js/.css/etc)
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).end('Not Found');
    return;
  }

  // SPA fallback: serve index.html for all non-file routes (no extension)
  try {
    const html = await readFile(join(DIST, 'index.html'));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).end(html);
  } catch {
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).end('index.html not found');
  }
});

const server = app.listen(PORT, () => {
  console.log(`VariScout serving from ${DIST} on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
