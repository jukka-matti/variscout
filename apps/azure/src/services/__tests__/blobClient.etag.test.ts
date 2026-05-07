import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateBlobEvidenceSnapshotsConditional, _resetSasCache } from '../blobClient';
import type { UpdateBlobConditionalResult } from '../blobClient';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockSasResponse = {
  sasUrl: 'https://acct.blob.core.windows.net/container?sig=test',
  expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const HUB_ID = 'hub-001';
const SOURCE_ID = 'src-abc';
const EXPECTED_PATH = `process-hubs/${HUB_ID}/evidence-sources/${SOURCE_ID}/snapshots/_snapshots.json`;
const EXPECTED_BLOB_URL = `https://acct.blob.core.windows.net/container/${EXPECTED_PATH}?sig=test`;

const MOCK_SNAPSHOT = {
  id: 'snap-1',
  hubId: HUB_ID,
  sourceId: SOURCE_ID,
  capturedAt: '2024-01-15T00:00:00.000Z',
  rowCount: 0,
  origin: 'paste',
  importedAt: 1700000000000,
  createdAt: 1700000000000,
  deletedAt: null,
};

/** A sleep mock that resolves immediately — no real delays in tests. */
const noopSleep = (_ms: number): Promise<void> => Promise.resolve();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a Response whose headers map includes ETag. */
function responseWithEtag(status: number, etag: string): Response {
  return new Response('', { status, headers: { ETag: etag } });
}

/** Build a Response without an ETag header. */
function responseWithStatus(status: number): Response {
  return new Response('', { status });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('updateBlobEvidenceSnapshotsConditional', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetSasCache();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ── Test 1: First-time write (HEAD 404 → no If-Match → PUT 201) ────────────

  it('first-time write: HEAD 404 → PUT without If-Match → returns { ok: true, etag }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // HEAD → 404 (blob does not exist yet)
      .mockResolvedValueOnce(responseWithStatus(404))
      // PUT → 201
      .mockResolvedValueOnce(responseWithEtag(201, '"first-etag"'));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: true, etag: '"first-etag"' });

    // PUT must NOT have sent an If-Match header (no prior ETag)
    type FetchInit = Parameters<typeof fetch>[1];
    const putCall = fetchSpy.mock.calls.find((call: unknown[]) => {
      const [url, opts] = call as [string, FetchInit];
      return url === EXPECTED_BLOB_URL && (opts as FetchInit)?.method === 'PUT';
    });
    expect(putCall).toBeDefined();
    const putInit = putCall![1] as FetchInit;
    const putHeaders = putInit?.headers as Record<string, string>;
    expect(putHeaders['If-Match']).toBeUndefined();
  });

  // ── Test 2: Subsequent write with current ETag → success ──────────────────

  it('subsequent write: HEAD 200 with ETag → PUT with If-Match → returns { ok: true, etag }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // HEAD → 200 with existing ETag
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-v1"'))
      // PUT → 200 with new ETag
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-v2"'));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: true, etag: '"etag-v2"' });

    type FetchInit = Parameters<typeof fetch>[1];
    const putCall = fetchSpy.mock.calls.find((call: unknown[]) => {
      const [url, opts] = call as [string, FetchInit];
      return url === EXPECTED_BLOB_URL && (opts as FetchInit)?.method === 'PUT';
    });
    expect(putCall).toBeDefined();
    const putInit = putCall![1] as FetchInit;
    const putHeaders = putInit?.headers as Record<string, string>;
    expect(putHeaders['If-Match']).toBe('"etag-v1"');
  });

  // ── Test 3: 412 on first attempt → retry → eventual success ───────────────

  it('412 on first attempt → HEAD again → PUT succeeds on retry → returns { ok: true, etag }', async () => {
    fetchSpy
      // SAS token (used once; cached for all calls)
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // Attempt 1 — HEAD returns stale ETag
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-stale"'))
      // Attempt 1 — PUT 412 (someone else wrote)
      .mockResolvedValueOnce(responseWithStatus(412))
      // Attempt 2 (retry) — HEAD returns updated ETag
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-current"'))
      // Attempt 2 — PUT 200
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-after-retry"'));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: true, etag: '"etag-after-retry"' });
  });

  // ── Test 4: 3 consecutive 412s → concurrency-exhausted ───────────────────

  it('3 consecutive 412s → returns { ok: false, reason: "concurrency-exhausted" }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // Attempt 1: HEAD → 412 cycle
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-a"'))
      .mockResolvedValueOnce(responseWithStatus(412))
      // Attempt 2: HEAD → 412 cycle
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-b"'))
      .mockResolvedValueOnce(responseWithStatus(412))
      // Attempt 3: HEAD → 412 cycle
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-c"'))
      .mockResolvedValueOnce(responseWithStatus(412));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { maxRetries: 3, sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({
      ok: false,
      reason: 'concurrency-exhausted',
    });
  });

  // ── Test 5: Network error → returns { ok: false, reason: 'network' } ──────

  it('network error (fetch throws) → returns { ok: false, reason: "network" }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // HEAD throws a network error
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: false, reason: 'network' });
  });

  // ── Test 6: Auth error → returns { ok: false, reason: 'auth' } ───────────

  it('auth error on PUT (403) → returns { ok: false, reason: "auth" }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // HEAD → 200 with ETag
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-v1"'))
      // PUT → 403 Forbidden
      .mockResolvedValueOnce(responseWithStatus(403));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: false, reason: 'auth' });
  });

  it('auth error on HEAD (401) → returns { ok: false, reason: "auth" }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // HEAD → 401 Unauthorized
      .mockResolvedValueOnce(responseWithStatus(401));

    const result = await updateBlobEvidenceSnapshotsConditional(
      HUB_ID,
      SOURCE_ID,
      [MOCK_SNAPSHOT],
      { sleep: noopSleep }
    );

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: false, reason: 'auth' });
  });
});
