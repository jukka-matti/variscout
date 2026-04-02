// @vitest-environment node
/**
 * Integration tests for apps/azure/server.js Express endpoints.
 *
 * Uses supertest to send real HTTP requests through the Express middleware
 * chain without binding to a port (NODE_ENV=test skips app.listen()).
 * Azure SDK imports (@azure/storage-blob, @azure/identity) are mocked to
 * avoid real Azure infrastructure requirements.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';

// ── Azure SDK mocks ──────────────────────────────────────────────────────────
// server.js imports these lazily via dynamic import(); vi.mock() hoists
// these to module scope so the stubs are in place before the server loads.

const mockUploadData = vi.fn().mockResolvedValue({});
const mockDelete = vi.fn().mockResolvedValue({});

// Async iterator for listBlobsFlat — yields two blobs
function makeBlobIterator() {
  const blobs = [
    {
      name: 'test-project-id/documents/doc-abc123-report.pdf',
      properties: { contentLength: 12345, createdOn: new Date('2026-01-01T10:00:00Z') },
    },
    {
      name: 'test-project-id/documents/doc-def456-notes.txt',
      properties: { contentLength: 512, createdOn: new Date('2026-01-02T09:30:00Z') },
    },
  ];
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        next: async () =>
          i < blobs.length ? { value: blobs[i++], done: false } : { value: undefined, done: true },
      };
    },
  };
}

const mockGetBlockBlobClient = vi.fn(() => ({
  uploadData: mockUploadData,
  delete: mockDelete,
}));

const mockListBlobsFlat = vi.fn(() => makeBlobIterator());

const mockGetContainerClient = vi.fn(() => ({
  getBlockBlobClient: mockGetBlockBlobClient,
  listBlobsFlat: mockListBlobsFlat,
}));

const mockGetUserDelegationKey = vi.fn().mockResolvedValue({ value: 'delegation-key' });

const mockBlobServiceClient = {
  getContainerClient: mockGetContainerClient,
  getUserDelegationKey: mockGetUserDelegationKey,
};

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn(() => mockBlobServiceClient),
    prototype: {},
  },
  generateBlobSASQueryParameters: vi.fn(() => ({ toString: () => 'sv=mock&sig=mock' })),
  ContainerSASPermissions: { parse: vi.fn(() => ({})) },
  BlobSASPermissions: { parse: vi.fn(() => ({})) },
  StorageSharedKeyCredential: vi.fn(),
  SASProtocol: { Https: 'https' },
}));

vi.mock('@azure/identity', () => ({
  DefaultAzureCredential: vi.fn(),
}));

// ── Module-level env setup ───────────────────────────────────────────────────
// Must happen before importing server so module-level constants pick up values.
// Use Object.assign to set process.env keys before the dynamic import below.

const VALID_UUID = 'a1b2c3d4-e5f6-4789-ab12-cd34ef567890';

// Encoded principal: { "userId": "user-123", "userDetails": "test@example.com" }
const VALID_PRINCIPAL = Buffer.from(
  JSON.stringify({ userId: 'user-123', userDetails: 'test@example.com' }),
  'utf8'
).toString('base64');

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  // Set env vars so module-level constants in server.js have correct values
  process.env.NODE_ENV = 'test';
  process.env.VITE_VARISCOUT_PLAN = 'standard';
  process.env.STORAGE_ACCOUNT_NAME = 'teststorage';
  process.env.STORAGE_CONTAINER_NAME = 'test-container';
  // Use connection string path so we avoid DefaultAzureCredential flow
  process.env.AZURE_STORAGE_CONNECTION_STRING =
    'DefaultEndpointsProtocol=https;AccountName=teststorage;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net';

  // Dynamically import so mocks are active before server.js runs
  const { app } = (await import('../../server.js')) as { app: Express };
  request = supertest(app);
});

afterAll(() => {
  delete process.env.NODE_ENV;
  delete process.env.VITE_VARISCOUT_PLAN;
  delete process.env.STORAGE_ACCOUNT_NAME;
  delete process.env.STORAGE_CONTAINER_NAME;
  delete process.env.AZURE_STORAGE_CONNECTION_STRING;
});

// ── Health & Config ──────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with body "ok"', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('includes security headers', async () => {
    const res = await request.get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toMatch(/max-age/);
  });
});

describe('GET /config', () => {
  it('returns 200 with JSON config shape', async () => {
    const res = await request.get('/config');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('plan');
    expect(body).toHaveProperty('aiEndpoint');
    expect(body).toHaveProperty('storageAccountName');
  });

  it('sets Cache-Control: no-cache', async () => {
    const res = await request.get('/config');
    expect(res.headers['cache-control']).toBe('no-cache');
  });
});

// ── Auth Validation ──────────────────────────────────────────────────────────

describe('POST /api/storage-token — auth validation', () => {
  it('returns 401 without x-ms-client-principal header', async () => {
    const res = await request.post('/api/storage-token').send({});
    expect(res.status).toBe(401);
    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('error');
  });

  it('returns 401 for KB upload without auth header', async () => {
    const res = await request.post('/api/kb-upload').field('projectId', VALID_UUID);
    expect(res.status).toBe(401);
  });

  it('returns 401 for KB search without auth header', async () => {
    const res = await request.post('/api/kb-search').send({ projectId: VALID_UUID, query: 'test' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for KB list without auth header', async () => {
    const res = await request.get(`/api/kb-list?projectId=${VALID_UUID}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for KB delete without auth header', async () => {
    const res = await request
      .delete('/api/kb-delete')
      .send({ projectId: VALID_UUID, documentId: VALID_UUID, fileName: 'test.pdf' });
    expect(res.status).toBe(401);
  });
});

// ── Team Tier Enforcement ────────────────────────────────────────────────────

describe('KB endpoints — team plan enforcement (VITE_VARISCOUT_PLAN=standard)', () => {
  // plan is already 'standard' from beforeAll; these calls supply auth header

  it('POST /api/kb-upload with auth but non-team plan → 403', async () => {
    const res = await request
      .post('/api/kb-upload')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .field('projectId', VALID_UUID);
    expect(res.status).toBe(403);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/team plan/i);
  });

  it('POST /api/kb-search with auth but non-team plan → 403', async () => {
    const res = await request
      .post('/api/kb-search')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: VALID_UUID, query: 'quality control' });
    expect(res.status).toBe(403);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/team plan/i);
  });

  it('GET /api/kb-list with auth but non-team plan → 403', async () => {
    const res = await request
      .get(`/api/kb-list?projectId=${VALID_UUID}`)
      .set('x-ms-client-principal', VALID_PRINCIPAL);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/kb-delete with auth but non-team plan → 403', async () => {
    const res = await request
      .delete('/api/kb-delete')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: VALID_UUID, documentId: VALID_UUID, fileName: 'test.pdf' });
    expect(res.status).toBe(403);
  });
});

// ── UUID Validation ──────────────────────────────────────────────────────────
// Temporarily switch to team plan to reach UUID validation logic

describe('UUID validation on KB endpoints', () => {
  beforeAll(() => {
    process.env.VITE_VARISCOUT_PLAN = 'team';
  });

  afterAll(() => {
    process.env.VITE_VARISCOUT_PLAN = 'standard';
  });

  it('POST /api/kb-search with invalid projectId → 400 with message', async () => {
    const res = await request
      .post('/api/kb-search')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'not-a-uuid', query: 'test' });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/invalid projectId format/i);
  });

  it('GET /api/kb-list with invalid projectId → 400', async () => {
    const res = await request
      .get('/api/kb-list?projectId=bad-id')
      .set('x-ms-client-principal', VALID_PRINCIPAL);
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/invalid projectId format/i);
  });

  it('DELETE /api/kb-delete with invalid projectId → 400', async () => {
    const res = await request
      .delete('/api/kb-delete')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'INVALID', documentId: VALID_UUID, fileName: 'test.pdf' });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/invalid projectId format/i);
  });

  it('POST /api/kb-upload with invalid projectId → 400', async () => {
    const res = await request
      .post('/api/kb-upload')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .field('projectId', 'not-valid-uuid')
      .attach('file', Buffer.from('hello world'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/invalid projectId format/i);
  });
});

// ── Happy Paths (team plan + mocked Blob) ───────────────────────────────────

describe('KB happy paths with team plan + mocked Blob Storage', () => {
  beforeAll(() => {
    process.env.VITE_VARISCOUT_PLAN = 'team';
  });

  afterAll(() => {
    process.env.VITE_VARISCOUT_PLAN = 'standard';
    vi.clearAllMocks();
  });

  it('GET /api/kb-list → 200 with documents array', async () => {
    const projectId = VALID_UUID;
    // The mock iterator uses a fixed prefix "test-project-id/documents/",
    // so listing returns documents from the mock regardless of the projectId param.
    const res = await request
      .get(`/api/kb-list?projectId=${projectId}`)
      .set('x-ms-client-principal', VALID_PRINCIPAL);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('documents');
    expect(Array.isArray(body.documents)).toBe(true);
  });

  it('DELETE /api/kb-delete with valid params → 200 deleted: true', async () => {
    const res = await request
      .delete('/api/kb-delete')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({
        projectId: VALID_UUID,
        documentId: VALID_UUID,
        fileName: 'report.pdf',
      });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.deleted).toBe(true);
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it('POST /api/kb-upload with valid file + projectId → 200 with doc metadata', async () => {
    const res = await request
      .post('/api/kb-upload')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .field('projectId', VALID_UUID)
      .attach('file', Buffer.from('PDF content here'), {
        filename: 'manual.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('fileName', 'manual.pdf');
    expect(body).toHaveProperty('blobPath');
    expect(body).toHaveProperty('uploadedAt');
    expect(body).toHaveProperty('uploadedBy');
    expect(mockUploadData).toHaveBeenCalledOnce();
  });

  it('POST /api/kb-search without search endpoint configured → 200 empty results', async () => {
    // AI_SEARCH_ENDPOINT not set — server returns graceful degradation
    const res = await request
      .post('/api/kb-search')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: VALID_UUID, query: 'variation analysis' });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
  });
});

// ── Missing required fields ──────────────────────────────────────────────────

describe('KB endpoints — missing required fields', () => {
  beforeAll(() => {
    process.env.VITE_VARISCOUT_PLAN = 'team';
  });

  afterAll(() => {
    process.env.VITE_VARISCOUT_PLAN = 'standard';
  });

  it('POST /api/kb-search without query → 400', async () => {
    const res = await request
      .post('/api/kb-search')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: VALID_UUID });
    expect(res.status).toBe(400);
  });

  it('POST /api/kb-search without projectId → 400', async () => {
    const res = await request
      .post('/api/kb-search')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ query: 'test' });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/kb-delete without fileName → 400', async () => {
    const res = await request
      .delete('/api/kb-delete')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: VALID_UUID, documentId: VALID_UUID });
    expect(res.status).toBe(400);
  });
});
