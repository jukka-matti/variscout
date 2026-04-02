// Static file server for Azure App Service built on Express.
// Serves the Vite build output from ./dist/ with SPA fallback routing.
// Migrated from raw Node HTTP to Express in ADR-060 to support upcoming KB endpoints
// (file upload via multer, JSON body parsing, cleaner route definitions).

import express from 'express';
import multer from 'multer';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '8080', 10);
const PLAN = process.env.VITE_VARISCOUT_PLAN || 'standard';
// LOCAL_DEV bypass is blocked on App Service (WEBSITE_SITE_NAME set by Azure)
const LOCAL_DEV = process.env.LOCAL_DEV && !process.env.WEBSITE_SITE_NAME;

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

// ── Knowledge Base API (Team plan only, ADR-060) ──────────────────────────────

// Multer: store uploads in memory (max 10 MB), single file field named 'file'
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Shared middleware: require EasyAuth token + Team plan
function requireTeamPlan(req, res, next) {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    res.setHeader('Content-Type', 'application/json');
    res.status(401).end(JSON.stringify({ error: 'Authentication required' }));
    return;
  }
  if (PLAN !== 'team') {
    res.setHeader('Content-Type', 'application/json');
    res.status(403).end(JSON.stringify({ error: 'Team plan required' }));
    return;
  }
  next();
}

// Helper: resolve Blob Storage client + container name
async function getBlobContainerClient() {
  const { BlobServiceClient } = await import('@azure/storage-blob');
  const { DefaultAzureCredential } = await import('@azure/identity');

  const acctName = process.env.STORAGE_ACCOUNT_NAME;
  const containerName = process.env.STORAGE_CONTAINER_NAME || 'variscout-projects';
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  let blobServiceClient;
  if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    if (!acctName) throw new Error('STORAGE_ACCOUNT_NAME not configured');
    blobServiceClient = new BlobServiceClient(
      `https://${acctName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );
  }
  return blobServiceClient.getContainerClient(containerName);
}

// POST /api/kb-upload — upload a reference document to Blob Storage
app.post('/api/kb-upload', requireTeamPlan, upload.single('file'), async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (!req.file) {
    res.status(400).end(JSON.stringify({ error: 'No file provided' }));
    return;
  }
  const { projectId } = req.body;
  if (!projectId) {
    res.status(400).end(JSON.stringify({ error: 'projectId is required' }));
    return;
  }

  try {
    const docId = randomUUID();
    const blobPath = `${projectId}/documents/${docId}-${req.file.originalname}`;
    const containerClient = await getBlobContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const uploadedBy = (() => {
      try {
        const raw = req.headers['x-ms-client-principal'];
        if (!raw) return 'unknown';
        const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
        return decoded.userId || decoded.userDetails || 'unknown';
      } catch {
        return 'unknown';
      }
    })();

    res.status(200).end(JSON.stringify({
      id: docId,
      fileName: req.file.originalname,
      blobPath,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    }));
  } catch (err) {
    console.error('[kb-upload]', err.message || err);
    res.status(500).end(JSON.stringify({ error: 'Upload failed' }));
  }
});

// POST /api/kb-search — full-text search against Foundry IQ knowledge index
app.post('/api/kb-search', requireTeamPlan, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const { projectId, query, topK } = req.body;
  if (!projectId || !query) {
    res.status(400).end(JSON.stringify({ error: 'projectId and query are required' }));
    return;
  }

  const searchEndpoint = process.env.AI_SEARCH_ENDPOINT;
  const searchAdminKey = process.env.AI_SEARCH_ADMIN_KEY;

  if (!searchEndpoint || !searchAdminKey) {
    // Graceful degradation: KB search not yet configured
    res.status(200).end(JSON.stringify({ results: [] }));
    return;
  }

  try {
    const top = typeof topK === 'number' && topK > 0 ? topK : 5;
    const url = `${searchEndpoint}/knowledgebases/variscout-kb/retrieve?api-version=2025-11-01-preview`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': searchAdminKey,
      },
      body: JSON.stringify({
        search: query,
        top,
        filter: `projectId eq '${projectId}'`,
      }),
    });

    if (!response.ok) {
      // Foundry IQ unavailable — return empty results rather than erroring
      console.warn('[kb-search] Search endpoint returned', response.status);
      res.status(200).end(JSON.stringify({ results: [] }));
      return;
    }

    const data = await response.json();
    res.status(200).end(JSON.stringify({ results: data.value ?? data.results ?? [] }));
  } catch (err) {
    console.error('[kb-search]', err.message || err);
    // Graceful degradation: return empty results so CoScout still works
    res.status(200).end(JSON.stringify({ results: [] }));
  }
});

// GET /api/kb-list — list uploaded documents for a project
app.get('/api/kb-list', requireTeamPlan, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const { projectId } = req.query;
  if (!projectId) {
    res.status(400).end(JSON.stringify({ error: 'projectId query param is required' }));
    return;
  }

  try {
    const containerClient = await getBlobContainerClient();
    const prefix = `${projectId}/documents/`;
    const documents = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      // Blob name pattern: {projectId}/documents/{docId}-{fileName}
      const blobName = blob.name.slice(prefix.length); // strip prefix
      const dashIdx = blobName.indexOf('-');
      const id = dashIdx >= 0 ? blobName.slice(0, dashIdx) : blobName;
      const fileName = dashIdx >= 0 ? blobName.slice(dashIdx + 1) : blobName;

      documents.push({
        id,
        fileName,
        blobPath: blob.name,
        fileSize: blob.properties.contentLength ?? 0,
        uploadedAt: blob.properties.createdOn?.toISOString() ?? null,
      });
    }

    res.status(200).end(JSON.stringify({ documents }));
  } catch (err) {
    console.error('[kb-list]', err.message || err);
    res.status(500).end(JSON.stringify({ error: 'Failed to list documents' }));
  }
});

// DELETE /api/kb-delete — remove a document from Blob Storage
app.delete('/api/kb-delete', requireTeamPlan, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const { projectId, documentId, fileName } = req.body;
  if (!projectId || !documentId || !fileName) {
    res.status(400).end(JSON.stringify({ error: 'projectId, documentId and fileName are required' }));
    return;
  }

  try {
    const blobPath = `${projectId}/documents/${documentId}-${fileName}`;
    const containerClient = await getBlobContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.delete();

    res.status(200).end(JSON.stringify({ deleted: true }));
  } catch (err) {
    console.error('[kb-delete]', err.message || err);
    res.status(500).end(JSON.stringify({ error: 'Delete failed' }));
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
