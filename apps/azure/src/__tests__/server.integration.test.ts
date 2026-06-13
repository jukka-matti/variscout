// @vitest-environment node
/**
 * Integration tests for apps/azure/server.js Express endpoints.
 *
 * Uses supertest to send real HTTP requests through the Express middleware
 * chain on an ephemeral in-memory port (NODE_ENV=test skips server.js app.listen()).
 * Azure SDK imports (@azure/storage-blob, @azure/identity) are mocked to
 * avoid real Azure infrastructure requirements.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import type { Express } from 'express';

// ── Azure SDK mocks ──────────────────────────────────────────────────────────
// server.js imports these lazily via dynamic import(); vi.mock() hoists
// these to module scope so the stubs are in place before the server loads.

type MockBlob = {
  body: Buffer;
  contentType: string;
  etag: string;
  createdOn: Date;
};

const mockBlobStore = new Map<string, MockBlob>();
let mockEtagCounter = 1;

function seedMockBlob(
  name: string,
  value: unknown,
  options?: { contentType?: string; etag?: string; createdOn?: Date }
) {
  const body = Buffer.from(typeof value === 'string' ? value : JSON.stringify(value), 'utf8');
  mockBlobStore.set(name, {
    body,
    contentType: options?.contentType ?? 'application/json',
    etag: options?.etag ?? `"seed-${mockEtagCounter++}"`,
    createdOn: options?.createdOn ?? new Date('2026-01-01T10:00:00Z'),
  });
}

function readMockJsonBlob<T>(name: string): T {
  const blob = mockBlobStore.get(name);
  if (!blob) throw new Error(`Missing mock blob ${name}`);
  return JSON.parse(blob.body.toString('utf8')) as T;
}

function makeAzureError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

const mockUploadData = vi.fn(
  async (
    blobName: string,
    data: Buffer | string,
    options?: { conditions?: { ifMatch?: string }; blobHTTPHeaders?: { blobContentType?: string } }
  ) => {
    const current = mockBlobStore.get(blobName);
    const ifMatch = options?.conditions?.ifMatch;
    if (ifMatch && current?.etag !== ifMatch) {
      throw makeAzureError('ConditionNotMet', 412);
    }

    const body = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
    mockBlobStore.set(blobName, {
      body,
      contentType: options?.blobHTTPHeaders?.blobContentType ?? 'application/json',
      etag: `"mock-${mockEtagCounter++}"`,
      createdOn: current?.createdOn ?? new Date('2026-01-01T10:00:00Z'),
    });
    return {};
  }
);
const mockDelete = vi.fn(async (blobName: string) => {
  mockBlobStore.delete(blobName);
  return {};
});

// Async iterator for listBlobsFlat — yields blobs from the in-memory store.
function makeBlobIterator(prefix = '') {
  const blobs = Array.from(mockBlobStore.entries())
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, blob]) => ({
      name,
      properties: { contentLength: blob.body.length, createdOn: blob.createdOn },
    }));
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

const mockListBlobsFlat = vi.fn((options?: { prefix?: string }) =>
  makeBlobIterator(options?.prefix)
);

const mockGetContainerClient = vi.fn(() => ({
  getBlockBlobClient: vi.fn((blobName: string) => ({
    uploadData: (
      data: Buffer | string,
      options?: {
        conditions?: { ifMatch?: string };
        blobHTTPHeaders?: { blobContentType?: string };
      }
    ) => mockUploadData(blobName, data, options),
    delete: () => mockDelete(blobName),
    downloadToBuffer: async () => {
      const blob = mockBlobStore.get(blobName);
      if (!blob) throw makeAzureError('BlobNotFound', 404);
      return blob.body;
    },
    getProperties: async () => {
      const blob = mockBlobStore.get(blobName);
      if (!blob) throw makeAzureError('BlobNotFound', 404);
      return {
        etag: blob.etag,
        contentLength: blob.body.length,
        contentType: blob.contentType,
        createdOn: blob.createdOn,
      };
    },
  })),
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
const MEMBER_UUID = 'b1b2c3d4-e5f6-4789-ab12-cd34ef567890';
const OUTSIDER_UUID = 'c1b2c3d4-e5f6-4789-ab12-cd34ef567890';

// Encoded principal: { "userId": "user-123", "userDetails": "test@example.com" }
const VALID_PRINCIPAL = Buffer.from(
  JSON.stringify({ userId: 'user-123', userDetails: 'test@example.com' }),
  'utf8'
).toString('base64');
const MEMBER_PRINCIPAL = Buffer.from(
  JSON.stringify({ userId: 'member-456', userDetails: 'member@example.com' }),
  'utf8'
).toString('base64');
const OUTSIDER_PRINCIPAL = Buffer.from(
  JSON.stringify({ userId: 'outsider-789', userDetails: 'outsider@example.com' }),
  'utf8'
).toString('base64');

function projectMetadata(
  projectId = VALID_UUID,
  access = {
    ownerUserId: 'user-123',
    memberUserIds: ['member-456'],
  }
) {
  return {
    projectId,
    name: `Project ${projectId.slice(0, 4)}`,
    updated: '2026-01-02T09:30:00.000Z',
    access,
  };
}

function seedAccessibleProject(
  projectId = VALID_UUID,
  access = {
    ownerUserId: 'user-123',
    memberUserIds: ['member-456'],
  }
) {
  const metadata = projectMetadata(projectId, access);
  seedMockBlob(`${projectId}/metadata.json`, metadata, { etag: '"metadata-etag"' });
  seedMockBlob(
    `${projectId}/analysis.json`,
    { id: projectId, title: metadata.name },
    {
      etag: '"analysis-etag"',
    }
  );
  return metadata;
}

let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  // Set env vars so module-level constants in server.js have correct values.
  process.env.NODE_ENV = 'test';
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
  delete process.env.STORAGE_ACCOUNT_NAME;
  delete process.env.STORAGE_CONTAINER_NAME;
  delete process.env.AZURE_STORAGE_CONNECTION_STRING;
});

beforeEach(() => {
  vi.clearAllMocks();
  mockBlobStore.clear();
  mockEtagCounter = 1;
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
    expect(body).not.toHaveProperty('voiceInputEnabled');
    expect(body).not.toHaveProperty('speechToTextDeployment');
  });

  it('sets Cache-Control: no-cache', async () => {
    const res = await request.get('/config');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('keeps microphone permissions disabled', async () => {
    const res = await request.get('/config');
    const body = JSON.parse(res.text);

    expect(body).not.toHaveProperty('voiceInputEnabled');
    expect(body).not.toHaveProperty('speechToTextDeployment');
    expect(res.headers['permissions-policy']).toContain('microphone=()');
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

  it('returns 410 for authenticated callers because direct container SAS is disabled', async () => {
    const res = await request
      .post('/api/storage-token')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({});

    expect(res.status).toBe(410);
    const body = JSON.parse(res.text);
    expect(body.error).toMatch(/direct container sas disabled/i);
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

// ── Server-enforced storage boundary ────────────────────────────────────────

describe('same-origin storage APIs — project access', () => {
  it('GET /api/storage/projects filters the central index to accessible projects', async () => {
    const allowed = projectMetadata(VALID_UUID);
    const memberAllowed = projectMetadata(MEMBER_UUID, {
      ownerUserId: 'other-owner',
      memberUserIds: ['user-123'],
    });
    const denied = projectMetadata(OUTSIDER_UUID, {
      ownerUserId: 'other-owner',
      memberUserIds: ['other-member'],
    });
    const missingAccess = { projectId: 'no-access', name: 'No access', updated: '2026-01-01' };
    seedMockBlob('_index.json', [allowed, memberAllowed, denied, missingAccess]);
    seedMockBlob(`${VALID_UUID}/metadata.json`, allowed);
    seedMockBlob(`${MEMBER_UUID}/metadata.json`, memberAllowed);
    seedMockBlob(`${OUTSIDER_UUID}/metadata.json`, denied);
    seedMockBlob('no-access/metadata.json', missingAccess);

    const res = await request
      .get('/api/storage/projects')
      .set('x-ms-client-principal', VALID_PRINCIPAL);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text) as { projects: Array<{ projectId: string }> };
    expect(body.projects.map(project => project.projectId)).toEqual([VALID_UUID, MEMBER_UUID]);
  });

  it('GET /api/storage/projects/:projectId returns project data only after metadata access passes', async () => {
    seedAccessibleProject();

    const res = await request
      .get(`/api/storage/projects/${VALID_UUID}`)
      .set('x-ms-client-principal', MEMBER_PRINCIPAL);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.project).toEqual({ id: VALID_UUID, title: 'Project a1b2' });
    expect(body.metadata.projectId).toBe(VALID_UUID);
    expect(body.etag).toBe('"analysis-etag"');
  });

  it('GET /api/storage/projects/:projectId returns 403 when metadata access excludes the caller', async () => {
    seedAccessibleProject();

    const res = await request
      .get(`/api/storage/projects/${VALID_UUID}`)
      .set('x-ms-client-principal', OUTSIDER_PRINCIPAL);

    expect(res.status).toBe(403);
  });

  it('PUT /api/storage/projects/:projectId allows creation when submitted access includes the caller', async () => {
    const res = await request
      .put(`/api/storage/projects/${VALID_UUID}`)
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({
        project: { id: VALID_UUID, title: 'Created server-side' },
        metadata: projectMetadata(VALID_UUID),
      });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.etag).toMatch(/^"mock-/);
    expect(readMockJsonBlob(`${VALID_UUID}/analysis.json`)).toEqual({
      id: VALID_UUID,
      title: 'Created server-side',
    });
    expect(readMockJsonBlob(`${VALID_UUID}/metadata.json`)).toMatchObject({
      projectId: VALID_UUID,
      access: { ownerUserId: 'user-123', memberUserIds: ['member-456'] },
    });
  });

  it('PUT /api/storage/projects/:projectId returns 412 when If-Match does not match the analysis blob', async () => {
    seedAccessibleProject();

    const res = await request
      .put(`/api/storage/projects/${VALID_UUID}`)
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .set('If-Match', '"stale-etag"')
      .send({
        project: { id: VALID_UUID, title: 'Conflicting update' },
        metadata: projectMetadata(VALID_UUID),
      });

    expect(res.status).toBe(412);
  });
});

describe('same-origin storage APIs — generic blob text', () => {
  it('PUT and GET /api/storage/blob-text round-trip text after project access passes', async () => {
    seedAccessibleProject();

    const put = await request
      .put('/api/storage/blob-text')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({
        projectId: VALID_UUID,
        blobPath: `${VALID_UUID}/artifacts/report.jsonl`,
        text: '{"ok":true}\n',
        contentType: 'application/x-ndjson',
      });
    expect(put.status).toBe(200);

    const get = await request
      .get('/api/storage/blob-text')
      .query({ projectId: VALID_UUID, blobPath: `${VALID_UUID}/artifacts/report.jsonl` })
      .set('x-ms-client-principal', MEMBER_PRINCIPAL);

    expect(get.status).toBe(200);
    expect(JSON.parse(get.text)).toMatchObject({
      text: '{"ok":true}\n',
      contentType: 'application/x-ndjson',
    });
  });

  it('PUT /api/storage/blob-text returns 403 when project metadata excludes the caller', async () => {
    seedAccessibleProject();

    const res = await request
      .put('/api/storage/blob-text')
      .set('x-ms-client-principal', OUTSIDER_PRINCIPAL)
      .send({
        projectId: VALID_UUID,
        blobPath: `${VALID_UUID}/artifacts/report.jsonl`,
        text: 'nope',
      });

    expect(res.status).toBe(403);
  });
});

// ── UUID Validation ──────────────────────────────────────────────────────────

describe('UUID validation on KB endpoints', () => {
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

// ── Happy Paths (mocked Blob) ────────────────────────────────────────────────

describe('KB happy paths with mocked Blob Storage', () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  it('GET /api/kb-list → 200 with documents array', async () => {
    const projectId = VALID_UUID;
    seedAccessibleProject(projectId);
    seedMockBlob(`${projectId}/documents/docabc123-report.pdf`, 'PDF content', {
      contentType: 'application/pdf',
      createdOn: new Date('2026-01-01T10:00:00Z'),
    });
    seedMockBlob(`${projectId}/documents/docdef456-notes.txt`, 'notes', {
      contentType: 'text/plain',
      createdOn: new Date('2026-01-02T09:30:00Z'),
    });

    const res = await request
      .get(`/api/kb-list?projectId=${projectId}`)
      .set('x-ms-client-principal', VALID_PRINCIPAL);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body).toHaveProperty('documents');
    expect(Array.isArray(body.documents)).toBe(true);
    expect(body.documents.map((doc: { fileName: string }) => doc.fileName)).toEqual([
      'report.pdf',
      'notes.txt',
    ]);
  });

  it('DELETE /api/kb-delete with valid params → 200 deleted: true', async () => {
    seedAccessibleProject();
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
    seedAccessibleProject();
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
    seedAccessibleProject();
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

  it('GET /api/kb-download returns a short-lived blob SAS after project access passes', async () => {
    seedAccessibleProject();

    const res = await request
      .get('/api/kb-download')
      .query({ projectId: VALID_UUID, documentId: VALID_UUID, fileName: 'report.pdf' })
      .set('x-ms-client-principal', MEMBER_PRINCIPAL);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    expect(body.url).toContain(`${VALID_UUID}/documents/${VALID_UUID}-report.pdf`);
    expect(body.url).toContain('sv=mock&sig=mock');
  });

  it('GET /api/kb-download returns 403 when project access fails', async () => {
    seedAccessibleProject();

    const res = await request
      .get('/api/kb-download')
      .query({ projectId: VALID_UUID, documentId: VALID_UUID, fileName: 'report.pdf' })
      .set('x-ms-client-principal', OUTSIDER_PRINCIPAL);

    expect(res.status).toBe(403);
  });
});

// ── Missing required fields ──────────────────────────────────────────────────

describe('KB endpoints — missing required fields', () => {
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

// ── Hub comments SSE (Investigation Wall) ────────────────────────────────────
// Mirrors the brainstorm SSE shape — append / active endpoints round-trip.
// No plan gate (all tiers can collaborate) and no UUID gate (hub IDs are
// client-generated with whatever id scheme the client uses).

describe('POST /api/hub-comments/append — auth + validation', () => {
  it('returns 401 without auth header', async () => {
    const res = await request
      .post('/api/hub-comments/append')
      .send({ projectId: 'p1', hubId: 'h1', text: 'hi' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ hubId: 'h1', text: 'hi' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when hubId is missing', async () => {
    const res = await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'p1', text: 'hi' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when text is missing', async () => {
    const res = await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'p1', hubId: 'h1' });
    expect(res.status).toBe(400);
  });

  it('appends comment with body echo when valid', async () => {
    const res = await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({
        projectId: 'proj-a',
        hubId: 'hub-a',
        text: 'Nozzle wear hypothesis',
        author: 'Jane',
      });
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text) as {
      ok: boolean;
      comment: { id: string; text: string; author: string; createdAt: number };
    };
    expect(body.ok).toBe(true);
    expect(body.comment.text).toBe('Nozzle wear hypothesis');
    expect(body.comment.author).toBe('Jane');
    expect(typeof body.comment.id).toBe('string');
    expect(body.comment.id.length).toBeGreaterThan(0);
    expect(typeof body.comment.createdAt).toBe('number');
  });

  it('is idempotent when the same id is re-sent', async () => {
    const res1 = await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({
        projectId: 'proj-idem',
        hubId: 'hub-idem',
        text: 'only once',
        id: 'fixed-comment-id',
      });
    expect(res1.status).toBe(200);

    const res2 = await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({
        projectId: 'proj-idem',
        hubId: 'hub-idem',
        text: 'only once',
        id: 'fixed-comment-id',
      });
    expect(res2.status).toBe(200);

    // Active endpoint confirms only one comment is stored for this hub.
    const active = await request
      .get('/api/hub-comments/active?projectId=proj-idem')
      .set('x-ms-client-principal', VALID_PRINCIPAL);
    const counts = JSON.parse(active.text) as Record<string, number>;
    expect(counts['hub-idem']).toBe(1);
  });
});

describe('GET /api/hub-comments/active', () => {
  it('returns 401 without auth', async () => {
    const res = await request.get('/api/hub-comments/active?projectId=x');
    expect(res.status).toBe(401);
  });

  it('returns 400 without projectId', async () => {
    const res = await request
      .get('/api/hub-comments/active')
      .set('x-ms-client-principal', VALID_PRINCIPAL);
    expect(res.status).toBe(400);
  });

  it('returns per-hub counts for the given project', async () => {
    // Seed two comments on hub-A, one on hub-B under a different project.
    await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'proj-counts', hubId: 'hub-A', text: 'c1' });
    await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'proj-counts', hubId: 'hub-A', text: 'c2' });
    await request
      .post('/api/hub-comments/append')
      .set('x-ms-client-principal', VALID_PRINCIPAL)
      .send({ projectId: 'proj-counts', hubId: 'hub-B', text: 'c3' });

    const res = await request
      .get('/api/hub-comments/active?projectId=proj-counts')
      .set('x-ms-client-principal', VALID_PRINCIPAL);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text) as Record<string, number>;
    expect(body['hub-A']).toBe(2);
    expect(body['hub-B']).toBe(1);
  });
});

describe('GET /api/hub-comments/stream — validation', () => {
  it('returns 401 without auth', async () => {
    const res = await request.get('/api/hub-comments/stream?projectId=p&hubId=h');
    expect(res.status).toBe(401);
  });

  it('returns 400 when projectId or hubId missing', async () => {
    const res = await request
      .get('/api/hub-comments/stream?projectId=p')
      .set('x-ms-client-principal', VALID_PRINCIPAL);
    expect(res.status).toBe(400);
  });
});
