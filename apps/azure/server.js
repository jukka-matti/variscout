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
// Blob Storage endpoint for cloud sync
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

function isVoiceInputEnabled() {
  return process.env.VOICE_INPUT_ENABLED === 'true';
}

function getPermissionsPolicy() {
  return `camera=(self), microphone=${isVoiceInputEnabled() ? '(self)' : '()'}, geolocation=(), payment=()`;
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
app.use(express.json({ limit: '10mb' }));

// Apply security headers to every response
app.use((_req, res, next) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  res.setHeader('Permissions-Policy', getPermissionsPolicy());
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
    plan: 'enterprise',
    // functionUrl removed — token exchange now proxied through /api/token-exchange (same-origin)
    aiEndpoint: process.env.AI_ENDPOINT || '',
    aiSearchEndpoint: process.env.AI_SEARCH_ENDPOINT || '',
    aiSearchIndex: process.env.AI_SEARCH_INDEX || 'findings',
    appInsightsConnectionString: process.env.APPINSIGHTS_CONNECTION_STRING || process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    voiceInputEnabled: isVoiceInputEnabled(),
    speechToTextDeployment: process.env.AI_SPEECH_TO_TEXT_DEPLOYMENT || '',
    storageAccountName: process.env.STORAGE_ACCOUNT_NAME || '',
    storageContainerName: process.env.STORAGE_CONTAINER_NAME || 'variscout-projects',
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).end(JSON.stringify(config));
});

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

function parseClientPrincipal(req) {
  const rawHeader = req.headers['x-ms-client-principal'];
  const raw = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (!raw) {
    return LOCAL_DEV ? { userId: 'local-dev', email: 'local-dev@localhost' } : null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    const claims = Array.isArray(decoded.claims) ? decoded.claims : [];
    const claim = (...types) => {
      const found = claims.find(c => types.includes(c.typ) || types.includes(c.type));
      return found?.val || found?.value || '';
    };
    const email =
      decoded.userDetails ||
      decoded.email ||
      claim(
        'emails',
        'email',
        'preferred_username',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'
      );
    const userId =
      decoded.userId ||
      decoded.user_id ||
      decoded.oid ||
      claim(
        'oid',
        'http://schemas.microsoft.com/identity/claims/objectidentifier',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ) ||
      email;

    if (!userId && !email) return null;
    return { userId: userId || email, email: email || userId };
  } catch {
    return null;
  }
}

function hasAccessForPrincipal(access, principal) {
  if (!access || !principal) return false;
  const identities = new Set([principal.userId, principal.email].filter(Boolean));
  if (identities.has(access.ownerUserId)) return true;
  const members = Array.isArray(access.memberUserIds) ? access.memberUserIds : [];
  return members.some(memberUserId => identities.has(memberUserId));
}

function isNotFoundError(err) {
  return err?.statusCode === 404 || err?.status === 404 || err?.details?.errorCode === 'BlobNotFound';
}

function isConflictError(err) {
  return err?.statusCode === 412 || err?.status === 412;
}

function safePathSegment(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
}

function validateBlobPath(blobPath) {
  if (!blobPath || typeof blobPath !== 'string') return false;
  if (blobPath.startsWith('/') || blobPath.includes('..') || blobPath.includes('\\')) return false;
  return true;
}

function validateProjectBlobPath(projectId, blobPath) {
  return validateBlobPath(blobPath) && blobPath.startsWith(`${safePathSegment(projectId)}/`);
}

async function getBlockBlobClient(blobPath) {
  const containerClient = await getBlobContainerClient();
  return containerClient.getBlockBlobClient(blobPath);
}

async function readBlobBuffer(blobPath) {
  const client = await getBlockBlobClient(blobPath);
  try {
    const [buffer, properties] = await Promise.all([
      client.downloadToBuffer(),
      client.getProperties().catch(() => ({})),
    ]);
    return { buffer, properties };
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

async function readJsonBlob(blobPath) {
  const loaded = await readBlobBuffer(blobPath);
  if (!loaded) return null;
  return {
    value: JSON.parse(loaded.buffer.toString('utf8')),
    etag: loaded.properties?.etag ?? null,
    properties: loaded.properties ?? {},
  };
}

async function writeBlob(blobPath, content, options = {}) {
  const client = await getBlockBlobClient(blobPath);
  const uploadOptions = {
    blobHTTPHeaders: { blobContentType: options.contentType || 'application/json' },
  };
  if (options.ifMatch) {
    uploadOptions.conditions = { ifMatch: options.ifMatch };
  }
  const result = await client.uploadData(
    Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8'),
    uploadOptions
  );
  const etag = result?.etag || (await client.getProperties().catch(() => ({})))?.etag || '';
  return { etag };
}

async function writeJsonBlob(blobPath, value, options = {}) {
  return writeBlob(blobPath, JSON.stringify(value), {
    ...options,
    contentType: 'application/json',
  });
}

async function loadProjectMetadata(projectId) {
  return readJsonBlob(`${safePathSegment(projectId)}/metadata.json`);
}

async function checkProjectAccess(req, res, projectId, options = {}) {
  const principal = req.user || parseClientPrincipal(req);
  if (!principal) {
    json(res, 401, { error: 'Authentication required' });
    return null;
  }
  req.user = principal;

  try {
    const loaded = await loadProjectMetadata(projectId);
    if (!loaded) {
      if (options.allowCreateWithSubmittedAccess) {
        const submittedAccess = options.submittedAccess;
        if (hasAccessForPrincipal(submittedAccess, principal)) {
          return { principal, metadata: null, etag: null };
        }
      }
      json(res, 404, { error: 'Project not found' });
      return null;
    }

    if (!hasAccessForPrincipal(loaded.value?.access, principal)) {
      json(res, 403, { error: 'Forbidden' });
      return null;
    }
    return { principal, metadata: loaded.value, etag: loaded.etag };
  } catch (err) {
    console.error('[storage-access]', err.message || err);
    json(res, 503, { error: 'Blob Storage unavailable' });
    return null;
  }
}

// SAS token generation for Blob Storage (cloud sync)
app.post('/api/storage-token', async (req, res) => {
  const principal = parseClientPrincipal(req);
  if (!principal) {
    json(res, 401, { error: 'Not authenticated' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  json(res, 410, { error: 'Direct container SAS disabled. Use same-origin storage APIs.' });
});

function requireStorageAuth(req, res, next) {
  const principal = parseClientPrincipal(req);
  if (!principal) {
    json(res, 401, { error: 'Authentication required' });
    return;
  }
  req.user = principal;
  next();
}

async function listProjectIndex() {
  const loaded = await readJsonBlob('_index.json');
  return Array.isArray(loaded?.value) ? loaded.value : [];
}

async function writeProjectIndex(projects) {
  await writeJsonBlob('_index.json', projects);
}

function upsertProjectIndexEntry(index, metadata) {
  const next = Array.isArray(index) ? [...index] : [];
  const existing = next.findIndex(entry => entry?.projectId === metadata.projectId);
  if (existing >= 0) next[existing] = metadata;
  else next.push(metadata);
  return next;
}

async function getAccessibleProjectEntries(principal) {
  const index = await listProjectIndex();
  const projects = [];
  for (const entry of index) {
    if (!entry?.projectId) continue;
    const loaded = await loadProjectMetadata(entry.projectId);
    if (loaded?.value && hasAccessForPrincipal(loaded.value.access, principal)) {
      projects.push(loaded.value);
    }
  }
  return projects;
}

async function checkHubAccess(req, res, hubId) {
  const principal = req.user || parseClientPrincipal(req);
  if (!principal) {
    json(res, 401, { error: 'Authentication required' });
    return null;
  }
  req.user = principal;

  try {
    const entries = await getAccessibleProjectEntries(principal);
    const allowed = entries.some(entry => entry?.access?.hubId === hubId);
    if (!allowed) {
      json(res, 403, { error: 'Forbidden' });
      return null;
    }
    return { principal, entries };
  } catch (err) {
    console.error('[storage-hub-access]', err.message || err);
    json(res, 503, { error: 'Blob Storage unavailable' });
    return null;
  }
}

async function safeReadJson(blobPath, fallback) {
  const loaded = await readJsonBlob(blobPath);
  return loaded?.value ?? fallback;
}

async function sendStorageError(res, err, fallbackMessage = 'Storage operation failed') {
  if (isConflictError(err)) {
    json(res, 412, { error: 'Precondition failed' });
    return;
  }
  if (isNotFoundError(err)) {
    json(res, 404, { error: 'Not found' });
    return;
  }
  console.error('[storage-api]', err.message || err);
  json(res, 503, { error: fallbackMessage });
}

// ── Same-origin Blob Storage APIs (R6e server-enforced boundary) ────────────

app.get('/api/storage/projects', requireStorageAuth, async (req, res) => {
  try {
    const projects = await getAccessibleProjectEntries(req.user);
    res.setHeader('Cache-Control', 'no-store');
    json(res, 200, { projects });
  } catch (err) {
    await sendStorageError(res, err, 'Blob Storage unavailable');
  }
});

app.get('/api/storage/projects/:projectId', requireStorageAuth, async (req, res) => {
  const projectId = safePathSegment(req.params.projectId);
  const access = await checkProjectAccess(req, res, projectId);
  if (!access) return;

  try {
    const loaded = await readJsonBlob(`${projectId}/analysis.json`);
    if (!loaded) {
      json(res, 404, { error: 'Project analysis not found' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    json(res, 200, {
      project: loaded.value,
      metadata: access.metadata,
      etag: loaded.etag,
    });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to load project');
  }
});

app.put('/api/storage/projects/:projectId', requireStorageAuth, async (req, res) => {
  const projectId = safePathSegment(req.params.projectId);
  const { project, metadata } = req.body ?? {};
  if (!project || !metadata?.access) {
    json(res, 400, { error: 'project and metadata.access are required' });
    return;
  }

  const access = await checkProjectAccess(req, res, projectId, {
    allowCreateWithSubmittedAccess: true,
    submittedAccess: metadata.access,
  });
  if (!access) return;

  try {
    const analysisWrite = await writeJsonBlob(`${projectId}/analysis.json`, project, {
      ifMatch: req.headers['if-match'],
    });
    const normalizedMetadata = { ...metadata, projectId };
    await writeJsonBlob(`${projectId}/metadata.json`, normalizedMetadata);

    const index = await listProjectIndex();
    await writeProjectIndex(upsertProjectIndexEntry(index, normalizedMetadata));

    res.setHeader('ETag', analysisWrite.etag);
    json(res, 200, { ok: true, etag: analysisWrite.etag });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save project');
  }
});

app.get('/api/storage/process-hubs', requireStorageAuth, async (req, res) => {
  try {
    const hubs = await safeReadJson('_process_hubs.json', []);
    const entries = await getAccessibleProjectEntries(req.user);
    const allowedHubIds = new Set(entries.map(entry => entry?.access?.hubId).filter(Boolean));
    json(res, 200, { hubs: hubs.filter(hub => allowedHubIds.has(hub?.id)) });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to list process hubs');
  }
});

app.put('/api/storage/process-hubs', requireStorageAuth, async (req, res) => {
  const hubs = Array.isArray(req.body?.hubs) ? req.body.hubs : null;
  if (!hubs) {
    json(res, 400, { error: 'hubs array is required' });
    return;
  }

  try {
    const entries = await getAccessibleProjectEntries(req.user);
    const allowedHubIds = new Set(entries.map(entry => entry?.access?.hubId).filter(Boolean));
    if (hubs.some(hub => !allowedHubIds.has(hub?.id))) {
      json(res, 403, { error: 'Forbidden' });
      return;
    }
    await writeJsonBlob('_process_hubs.json', hubs);
    json(res, 200, { ok: true });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save process hubs');
  }
});

app.get('/api/storage/hubs/:hubId/evidence-sources', requireStorageAuth, async (req, res) => {
  const hubId = safePathSegment(req.params.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;

  try {
    const sources = await safeReadJson(`process-hubs/${hubId}/evidence-sources/_sources.json`, []);
    json(res, 200, { sources });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to list evidence sources');
  }
});

app.put('/api/storage/hubs/:hubId/evidence-sources', requireStorageAuth, async (req, res) => {
  const hubId = safePathSegment(req.params.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;
  const sources = Array.isArray(req.body?.sources) ? req.body.sources : null;
  if (!sources) {
    json(res, 400, { error: 'sources array is required' });
    return;
  }

  try {
    for (const source of sources) {
      if (source?.id) {
        await writeJsonBlob(
          `process-hubs/${hubId}/evidence-sources/${safePathSegment(source.id)}/source.json`,
          source
        );
      }
    }
    await writeJsonBlob(`process-hubs/${hubId}/evidence-sources/_sources.json`, sources);
    json(res, 200, { ok: true });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save evidence sources');
  }
});

app.get(
  '/api/storage/hubs/:hubId/evidence-sources/:sourceId/snapshots',
  requireStorageAuth,
  async (req, res) => {
    const hubId = safePathSegment(req.params.hubId);
    const sourceId = safePathSegment(req.params.sourceId);
    if (!(await checkHubAccess(req, res, hubId))) return;

    try {
      const loaded = await readJsonBlob(
        `process-hubs/${hubId}/evidence-sources/${sourceId}/snapshots/_snapshots.json`
      );
      json(res, 200, { snapshots: loaded?.value ?? [], etag: loaded?.etag ?? null });
    } catch (err) {
      await sendStorageError(res, err, 'Failed to list evidence snapshots');
    }
  }
);

app.put(
  '/api/storage/hubs/:hubId/evidence-sources/:sourceId/snapshots',
  requireStorageAuth,
  async (req, res) => {
    const hubId = safePathSegment(req.params.hubId);
    const sourceId = safePathSegment(req.params.sourceId);
    if (!(await checkHubAccess(req, res, hubId))) return;
    const snapshots = Array.isArray(req.body?.snapshots) ? req.body.snapshots : null;
    if (!snapshots) {
      json(res, 400, { error: 'snapshots array is required' });
      return;
    }

    try {
      const catalogPath = `process-hubs/${hubId}/evidence-sources/${sourceId}/snapshots/_snapshots.json`;
      for (const snapshot of snapshots) {
        if (snapshot?.id) {
          const snapshotId = safePathSegment(snapshot.id);
          await writeJsonBlob(
            `process-hubs/${hubId}/evidence-sources/${sourceId}/snapshots/${snapshotId}/snapshot.json`,
            snapshot
          );
          if (typeof req.body?.sourceCsv === 'string') {
            await writeBlob(
              `process-hubs/${hubId}/evidence-sources/${sourceId}/snapshots/${snapshotId}/source.csv`,
              req.body.sourceCsv,
              { contentType: 'text/csv' }
            );
          }
        }
      }
      const result = await writeJsonBlob(catalogPath, snapshots, {
        ifMatch: req.headers['if-match'],
      });
      res.setHeader('ETag', result.etag);
      json(res, 200, { ok: true, etag: result.etag });
    } catch (err) {
      await sendStorageError(res, err, 'Failed to save evidence snapshots');
    }
  }
);

app.get('/api/storage/hubs/:hubId/control-records', requireStorageAuth, async (req, res) => {
  const hubId = safePathSegment(req.params.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;
  try {
    const records = await safeReadJson(`process-hubs/${hubId}/sustainment/_index.json`, []);
    json(res, 200, { records });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to list control records');
  }
});

app.put('/api/storage/hubs/:hubId/control-records', requireStorageAuth, async (req, res) => {
  const hubId = safePathSegment(req.params.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;
  const records = Array.isArray(req.body?.records) ? req.body.records : null;
  if (!records) {
    json(res, 400, { error: 'records array is required' });
    return;
  }

  try {
    for (const record of records) {
      if (record?.id) {
        await writeJsonBlob(
          `process-hubs/${hubId}/sustainment/records/${safePathSegment(record.id)}.json`,
          record
        );
      }
    }
    await writeJsonBlob(`process-hubs/${hubId}/sustainment/_index.json`, records);
    json(res, 200, { ok: true });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save control records');
  }
});

app.post('/api/storage/control-reviews', requireStorageAuth, async (req, res) => {
  const review = req.body?.review;
  if (!review?.hubId || !review?.recordId || !review?.id) {
    json(res, 400, { error: 'review with hubId, recordId, and id is required' });
    return;
  }
  const hubId = safePathSegment(review.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;

  try {
    await writeJsonBlob(
      `process-hubs/${hubId}/sustainment/reviews/${safePathSegment(review.recordId)}/${safePathSegment(review.id)}.json`,
      review
    );
    json(res, 200, { ok: true });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save control review');
  }
});

app.post('/api/storage/control-handoffs', requireStorageAuth, async (req, res) => {
  const handoff = req.body?.handoff;
  if (!handoff?.hubId || !handoff?.id) {
    json(res, 400, { error: 'handoff with hubId and id is required' });
    return;
  }
  const hubId = safePathSegment(handoff.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;

  try {
    await writeJsonBlob(
      `process-hubs/${hubId}/sustainment/handoffs/${safePathSegment(handoff.id)}.json`,
      handoff
    );
    json(res, 200, { ok: true });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save control handoff');
  }
});

app.get('/api/storage/hubs/:hubId/viewport', requireStorageAuth, async (req, res) => {
  const hubId = safePathSegment(req.params.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;
  try {
    const loaded = await readJsonBlob(`hubs/${hubId}/viewport.json`);
    if (!loaded) {
      json(res, 404, { error: 'Viewport not found' });
      return;
    }
    json(res, 200, { snapshot: loaded.value, etag: loaded.etag });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to load viewport');
  }
});

app.put('/api/storage/hubs/:hubId/viewport', requireStorageAuth, async (req, res) => {
  const hubId = safePathSegment(req.params.hubId);
  if (!(await checkHubAccess(req, res, hubId))) return;
  if (!req.body?.snapshot) {
    json(res, 400, { error: 'snapshot is required' });
    return;
  }
  try {
    const result = await writeJsonBlob(`hubs/${hubId}/viewport.json`, req.body.snapshot, {
      ifMatch: req.headers['if-match'],
    });
    res.setHeader('ETag', result.etag);
    json(res, 200, { ok: true, etag: result.etag });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to save viewport');
  }
});

app.post(
  '/api/storage/projects/:projectId/photos/:findingId/:photoId',
  requireStorageAuth,
  express.raw({ type: '*/*', limit: '10mb' }),
  async (req, res) => {
    const projectId = safePathSegment(req.params.projectId);
    const findingId = safePathSegment(req.params.findingId);
    const photoId = safePathSegment(req.params.photoId);
    if (!(await checkProjectAccess(req, res, projectId))) return;

    try {
      const path = `${projectId}/photos/${findingId}/${photoId}.jpg`;
      await writeBlob(path, Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? ''), {
        contentType: req.headers['content-type'] || 'image/jpeg',
      });
      json(res, 200, { url: `/api/storage/blob-text?projectId=${projectId}&blobPath=${encodeURIComponent(path)}` });
    } catch (err) {
      await sendStorageError(res, err, 'Failed to save photo');
    }
  }
);

app.get('/api/storage/blob-text', requireStorageAuth, async (req, res) => {
  const projectId = safePathSegment(req.query.projectId);
  const blobPath = String(req.query.blobPath || '');
  if (!projectId || !validateBlobPath(blobPath)) {
    json(res, 400, { error: 'projectId and safe blobPath are required' });
    return;
  }
  if (!blobPath.startsWith(`${projectId}/`)) {
    json(res, 403, { error: 'Forbidden' });
    return;
  }
  if (!(await checkProjectAccess(req, res, projectId))) return;

  try {
    const loaded = await readBlobBuffer(blobPath);
    if (!loaded) {
      json(res, 404, { error: 'Blob not found' });
      return;
    }
    json(res, 200, {
      text: loaded.buffer.toString('utf8'),
      contentType: loaded.properties?.contentType || 'text/plain',
      etag: loaded.properties?.etag ?? null,
    });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to read blob');
  }
});

app.put('/api/storage/blob-text', requireStorageAuth, async (req, res) => {
  const { projectId: rawProjectId, blobPath, text, contentType } = req.body ?? {};
  const projectId = safePathSegment(rawProjectId);
  if (!projectId || !validateBlobPath(blobPath) || typeof text !== 'string') {
    json(res, 400, { error: 'projectId, safe blobPath, and text are required' });
    return;
  }
  if (!blobPath.startsWith(`${projectId}/`)) {
    json(res, 403, { error: 'Forbidden' });
    return;
  }
  if (!(await checkProjectAccess(req, res, projectId))) return;

  try {
    const result = await writeBlob(blobPath, text, {
      contentType: contentType || 'text/plain',
      ifMatch: req.headers['if-match'],
    });
    res.setHeader('ETag', result.etag);
    json(res, 200, { ok: true, etag: result.etag });
  } catch (err) {
    await sendStorageError(res, err, 'Failed to write blob');
  }
});

// ── Knowledge Base API (ADR-060) ─────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Multer: store uploads in memory (max 10 MB), single file field named 'file'
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Shared middleware: require EasyAuth token.
// Single SKU — no plan gate; all authenticated users can access KB endpoints.
function requireAuth(req, res, next) {
  const principal = parseClientPrincipal(req);
  if (!principal) {
    json(res, 401, { error: 'Authentication required' });
    return;
  }
  req.user = principal;
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
app.post('/api/kb-upload', requireAuth, upload.single('file'), async (req, res) => {
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
  if (!UUID_REGEX.test(projectId)) {
    res.status(400).end(JSON.stringify({ error: 'Invalid projectId format' }));
    return;
  }

  const access = await checkProjectAccess(req, res, projectId);
  if (!access) return;

  try {
    const docId = randomUUID();
    const blobPath = `${projectId}/documents/${docId}-${req.file.originalname}`;
    const containerClient = await getBlobContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const uploadedBy = req.user?.userId || req.user?.email || 'unknown';

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
    res.status(503).end(JSON.stringify({ error: 'Upload failed' }));
  }
});

// POST /api/kb-search — full-text search against Foundry IQ knowledge index
app.post('/api/kb-search', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const { projectId, query, topK } = req.body;
  if (!projectId || !query) {
    res.status(400).end(JSON.stringify({ error: 'projectId and query are required' }));
    return;
  }
  if (!UUID_REGEX.test(projectId)) {
    res.status(400).end(JSON.stringify({ error: 'Invalid projectId format' }));
    return;
  }

  const access = await checkProjectAccess(req, res, projectId);
  if (!access) return;

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
app.get('/api/kb-list', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const { projectId } = req.query;
  if (!projectId) {
    res.status(400).end(JSON.stringify({ error: 'projectId query param is required' }));
    return;
  }
  if (!UUID_REGEX.test(projectId)) {
    res.status(400).end(JSON.stringify({ error: 'Invalid projectId format' }));
    return;
  }

  const access = await checkProjectAccess(req, res, projectId);
  if (!access) return;

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
    res.status(503).end(JSON.stringify({ error: 'Failed to list documents' }));
  }
});

// DELETE /api/kb-delete — remove a document from Blob Storage
app.delete('/api/kb-delete', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const { projectId, documentId, fileName } = req.body;
  if (!projectId || !documentId || !fileName) {
    res.status(400).end(JSON.stringify({ error: 'projectId, documentId and fileName are required' }));
    return;
  }
  if (!UUID_REGEX.test(projectId)) {
    res.status(400).end(JSON.stringify({ error: 'Invalid projectId format' }));
    return;
  }

  const access = await checkProjectAccess(req, res, projectId);
  if (!access) return;

  try {
    const blobPath = `${projectId}/documents/${documentId}-${fileName}`;
    const containerClient = await getBlobContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.delete();

    res.status(200).end(JSON.stringify({ deleted: true }));
  } catch (err) {
    console.error('[kb-delete]', err.message || err);
    res.status(503).end(JSON.stringify({ error: 'Delete failed' }));
  }
});

// GET /api/kb-download — generate a read-only SAS URL for a document download
app.get('/api/kb-download', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const { projectId, documentId, fileName } = req.query;
  if (!projectId || !documentId || !fileName) {
    res.status(400).end(JSON.stringify({ error: 'projectId, documentId and fileName are required' }));
    return;
  }
  if (!UUID_REGEX.test(projectId)) {
    res.status(400).end(JSON.stringify({ error: 'Invalid projectId format' }));
    return;
  }
  if (!UUID_REGEX.test(documentId)) {
    res.status(400).end(JSON.stringify({ error: 'Invalid documentId format' }));
    return;
  }

  const access = await checkProjectAccess(req, res, projectId);
  if (!access) return;

  try {
    const acctName = process.env.STORAGE_ACCOUNT_NAME;
    const containerName = process.env.STORAGE_CONTAINER_NAME || 'variscout-projects';

    if (!acctName) {
      res.status(503).end(JSON.stringify({ error: 'Blob Storage not configured' }));
      return;
    }

    const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential, SASProtocol } = await import('@azure/storage-blob');
    const { DefaultAzureCredential } = await import('@azure/identity');

    const blobServiceUrl = `https://${acctName}.blob.core.windows.net`;
    const blobName = `${projectId}/documents/${documentId}-${fileName}`;
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
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
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      }, sharedKeyCredential).toString();

      sasUrl = `${blobServiceUrl}/${containerName}/${blobName}?${sasToken}`;
    } else {
      // Production: managed identity + user delegation key
      const credential = new DefaultAzureCredential();
      const blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);
      const delegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

      const sasToken = generateBlobSASQueryParameters({
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      }, delegationKey, acctName).toString();

      sasUrl = `${blobServiceUrl}/${containerName}/${blobName}?${sasToken}`;
    }

    res.status(200).end(JSON.stringify({ url: sasUrl }));
  } catch (err) {
    console.error('[kb-download]', err.message || err);
    res.status(503).end(JSON.stringify({ error: 'Failed to generate download URL' }));
  }
});

// ─── Brainstorm Sessions (SSE-based collaboration) ───────────────────────────

const brainstormSessions = new Map(); // sessionId → session object
const brainstormClients = new Map();  // sessionId → Set<res>

// Create a new brainstorm session
app.post('/api/brainstorm/create', express.json(), (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { projectId, questionId, causeName } = req.body;
  if (!projectId || !questionId) {
    return res.status(400).json({ error: 'projectId and questionId required' });
  }
  const sessionId = randomUUID();
  const userId = principal
    ? JSON.parse(Buffer.from(principal, 'base64').toString()).userId || 'local'
    : 'local-dev';
  const session = {
    sessionId,
    projectId,
    questionId,
    causeName: causeName || '',
    createdBy: userId,
    ideas: [],
    phase: 'brainstorm',
    participants: [userId],
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  brainstormSessions.set(sessionId, session);
  brainstormClients.set(sessionId, new Set());
  res.json({ sessionId, projectId });
});

// Add or update an idea in a session
app.post('/api/brainstorm/idea', express.json(), (req, res) => {
  const { sessionId, id, text, direction, aiGenerated } = req.body;
  const session = brainstormSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (!text || !direction) {
    return res.status(400).json({ error: 'text and direction required' });
  }
  const validDirections = ['prevent', 'detect', 'simplify', 'eliminate'];
  if (!validDirections.includes(direction)) {
    return res.status(400).json({ error: 'Invalid direction' });
  }

  const existing = session.ideas.find(i => i.id === id);
  if (existing) {
    existing.text = text;
  } else {
    session.ideas.push({
      id: id || randomUUID(),
      text,
      direction,
      aiGenerated: aiGenerated || false,
      votes: [],
      voteCount: 0,
    });
  }

  // Broadcast to all SSE clients
  const broadcastIdea = existing || session.ideas[session.ideas.length - 1];
  const clients = brainstormClients.get(sessionId);
  if (clients) {
    const event = JSON.stringify({ type: 'idea', idea: broadcastIdea });
    for (const client of clients) {
      client.write(`data: ${event}\n\n`);
    }
  }
  res.json({ ok: true });
});

// SSE stream for live updates
app.get('/api/brainstorm/stream', (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sessionId = req.query.sessionId;
  const session = brainstormSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current state
  res.write(`data: ${JSON.stringify({ type: 'init', session })}\n\n`);

  // Add to client set
  const clients = brainstormClients.get(sessionId);
  if (clients) clients.add(res);

  // Add participant
  if (principal) {
    try {
      const userId = JSON.parse(Buffer.from(principal, 'base64').toString()).userId;
      if (userId && !session.participants.includes(userId)) {
        session.participants.push(userId);
      }
    } catch { /* ignore parse errors */ }
  }

  req.on('close', () => {
    if (clients) clients.delete(res);
  });
});

// Check for active session on a project
app.get('/api/brainstorm/active', (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const projectId = req.query.projectId;
  const now = Date.now();
  for (const [, session] of brainstormSessions) {
    if (session.projectId === projectId && session.expiresAt > now) {
      return res.json({
        sessionId: session.sessionId,
        causeName: session.causeName,
        participantCount: session.participants.length,
        phase: session.phase,
      });
    }
  }
  res.json(null);
});

// ─── Hub Comments (Investigation Wall — per-hub SSE collaboration) ───────────
//
// Mirrors the brainstorm SSE pattern above. Each hypothesis hub (Hypothesis)
// on the Investigation Wall can host a live comment thread. Clients subscribe
// per `${projectId}:${hubId}` and receive `init` + `comment` events. Storage is
// in-memory (ephemeral, per-pod) with a 24h TTL — customer-owned persistence
// stays in IndexedDB / Blob Storage per ADR-059. The server only relays the
// live collaboration stream; durable history is the client's responsibility.
//
// Key format: `${projectId}:${hubId}` — same-shape string key used for both
// comments and subscriber Sets so cleanup is symmetric with brainstorm.

const hubCommentsByKey = new Map();   // `${projectId}:${hubId}` → Comment[]
const hubCommentClients = new Map();  // `${projectId}:${hubId}` → Set<res>
const hubCommentTouchedAt = new Map(); // `${projectId}:${hubId}` → last-touched epoch ms

const HUB_COMMENT_TTL_MS = 24 * 60 * 60 * 1000;

function hubCommentKey(projectId, hubId) {
  return `${projectId}:${hubId}`;
}

// Append a comment to a hub and broadcast to SSE subscribers
app.post('/api/hub-comments/append', express.json(), (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { projectId, hubId, text, author, id } = req.body;
  if (!projectId || !hubId || !text) {
    return res.status(400).json({ error: 'projectId, hubId, and text required' });
  }

  const userId = principal
    ? JSON.parse(Buffer.from(principal, 'base64').toString()).userId || 'local'
    : 'local-dev';

  const comment = {
    id: id || randomUUID(),
    text,
    author: author || userId,
    createdAt: Date.now(),
  };

  const key = hubCommentKey(projectId, hubId);
  const list = hubCommentsByKey.get(key) || [];
  // Dedup by id — idempotent re-send is a no-op (still broadcasts so clients resync)
  if (!list.some(c => c.id === comment.id)) {
    list.push(comment);
    hubCommentsByKey.set(key, list);
  }
  hubCommentTouchedAt.set(key, Date.now());

  const clients = hubCommentClients.get(key);
  if (clients) {
    const event = JSON.stringify({ type: 'comment', comment });
    for (const client of clients) {
      client.write(`data: ${event}\n\n`);
    }
  }

  res.json({ ok: true, comment });
});

// SSE stream of comments for a single hub
app.get('/api/hub-comments/stream', (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const projectId = req.query.projectId;
  const hubId = req.query.hubId;
  if (!projectId || !hubId) {
    return res.status(400).json({ error: 'projectId and hubId query params required' });
  }

  const key = hubCommentKey(projectId, hubId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current state
  const comments = hubCommentsByKey.get(key) || [];
  res.write(`data: ${JSON.stringify({ type: 'init', projectId, hubId, comments })}\n\n`);

  // Register client
  let clients = hubCommentClients.get(key);
  if (!clients) {
    clients = new Set();
    hubCommentClients.set(key, clients);
  }
  clients.add(res);
  hubCommentTouchedAt.set(key, Date.now());

  req.on('close', () => {
    const set = hubCommentClients.get(key);
    if (set) {
      set.delete(res);
      if (set.size === 0) hubCommentClients.delete(key);
    }
  });
});

// Aggregate comment counts for every hub in a project — sidebar/badge feed
app.get('/api/hub-comments/active', (req, res) => {
  const principal = req.headers['x-ms-client-principal'];
  if (!principal && !LOCAL_DEV) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const projectId = req.query.projectId;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId required' });
  }

  const counts = {};
  const prefix = `${projectId}:`;
  for (const [key, list] of hubCommentsByKey) {
    if (key.startsWith(prefix)) {
      const hubId = key.slice(prefix.length);
      counts[hubId] = list.length;
    }
  }
  res.json(counts);
});

// Cleanup expired sessions + hub comments periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of brainstormSessions) {
    if (session.expiresAt < now) {
      brainstormSessions.delete(id);
      brainstormClients.delete(id);
    }
  }
  // Expire hub-comment buckets that haven't been touched for 24h. Active SSE
  // subscribers keep the bucket alive via touch-on-append; idle buckets drop
  // their comment history to bound memory.
  for (const [key, touchedAt] of hubCommentTouchedAt) {
    if (now - touchedAt > HUB_COMMENT_TTL_MS && !hubCommentClients.has(key)) {
      hubCommentsByKey.delete(key);
      hubCommentTouchedAt.delete(key);
    }
  }
}, 60 * 60 * 1000); // Every hour

// Static file serving + SPA fallback
// Express static middleware is not used here because we need the exact same routing logic
// as the original: files with extensions that don't exist → 404 (not SPA fallback),
// paths without extensions → SPA fallback.
// Express 5 requires named wildcards: '/*path' instead of bare '*'.
app.get('/*path', async (req, res) => {
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

// Export app for integration tests (supertest). The listen() call is skipped
// when NODE_ENV=test so tests can import the app without binding to a port.
export { app };

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`VariScout serving from ${DIST} on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}
