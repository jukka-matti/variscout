import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadBlobCanvasViewport, saveBlobCanvasViewport, _resetSasCache } from '../blobClient';
import type { LoadedViewport, ViewportBlobShape } from '../blobClient';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockSasResponse = {
  sasUrl: 'https://acct.blob.core.windows.net/container?sig=test',
  expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const HUB_ID = 'hub-viewport-001';
const EXPECTED_PATH = `hubs/${HUB_ID}/viewport.json`;
const EXPECTED_BLOB_URL = `https://acct.blob.core.windows.net/container/${EXPECTED_PATH}?sig=test`;

const MOCK_SNAPSHOT: ViewportBlobShape = {
  zoom: 1.5,
  pan: { x: 10, y: -20 },
  currentLevel: 'l2',
  nodePositions: { 'node-1': { x: 100, y: 200 } },
  groupByTributary: false,
  updatedAt: 1700000000000,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function responseWithEtag(status: number, etag: string, body?: unknown): Response {
  return new Response(body !== undefined ? JSON.stringify(body) : '', {
    status,
    headers: { ETag: etag },
  });
}

function responseWithStatus(status: number): Response {
  return new Response('', { status });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('loadBlobCanvasViewport', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetSasCache();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns null on 404', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // GET → 404
      .mockResolvedValueOnce(responseWithStatus(404));

    const result = await loadBlobCanvasViewport(HUB_ID);

    expect(result).toBeNull();

    const getCall = fetchSpy.mock.calls.find(
      (call: unknown[]) => (call as [string])[0] === EXPECTED_BLOB_URL
    );
    expect(getCall).toBeDefined();
  });

  it('returns snapshot and ETag on 200', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // GET → 200 with ETag + body
      .mockResolvedValueOnce(responseWithEtag(200, '"etag-v1"', MOCK_SNAPSHOT));

    const result = await loadBlobCanvasViewport(HUB_ID);

    expect(result).not.toBeNull();
    expect(result).toMatchObject<LoadedViewport>({
      snapshot: MOCK_SNAPSHOT,
      etag: '"etag-v1"',
    });
  });

  it('returns null when GET response is not ok (non-404)', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      .mockResolvedValueOnce(responseWithStatus(500));

    const result = await loadBlobCanvasViewport(HUB_ID);
    expect(result).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await loadBlobCanvasViewport(HUB_ID);
    expect(result).toBeNull();
  });

  it('returns null when getSasToken fails', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('503 Blob Storage not configured'));

    const result = await loadBlobCanvasViewport(HUB_ID);
    expect(result).toBeNull();
  });
});

describe('saveBlobCanvasViewport', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetSasCache();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ── Test: first write (priorEtag=null) → PUT without If-Match ─────────────

  it('first write: priorEtag=null → PUT without If-Match header', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // PUT → 201
      .mockResolvedValueOnce(responseWithEtag(201, '"new-etag-v1"'));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toEqual({ ok: true, etag: '"new-etag-v1"' });

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

  // ── Test: subsequent write with valid ETag → PUT with If-Match ────────────

  it('subsequent write: valid priorEtag → PUT with If-Match, returns new ETag', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // PUT → 200
      .mockResolvedValueOnce(responseWithEtag(200, '"new-etag-v2"'));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, '"etag-v1"');

    expect(result).toEqual({ ok: true, etag: '"new-etag-v2"' });

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

  // ── Test: stale ETag → 412 → precondition-failed ──────────────────────────

  it('stale ETag → 412 → returns { ok: false, reason: "precondition-failed" }', async () => {
    fetchSpy
      // SAS token
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // PUT → 412
      .mockResolvedValueOnce(responseWithStatus(412));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, '"stale-etag"');

    expect(result).toMatchObject({ ok: false, reason: 'precondition-failed', status: 412 });
  });

  // ── Test: auth error ───────────────────────────────────────────────────────

  it('403 response → returns { ok: false, reason: "auth" }', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      .mockResolvedValueOnce(responseWithStatus(403));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, '"etag-v1"');

    expect(result).toMatchObject({ ok: false, reason: 'auth', status: 403 });
  });

  it('401 response → returns { ok: false, reason: "auth" }', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      .mockResolvedValueOnce(responseWithStatus(401));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toMatchObject({ ok: false, reason: 'auth', status: 401 });
  });

  // ── Test: network error ────────────────────────────────────────────────────

  it('network error (fetch throws) → returns { ok: false, reason: "network" }', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toMatchObject({ ok: false, reason: 'network' });
  });

  // ── Test: PUT 204 (no content) also accepted ──────────────────────────────

  it('204 response is treated as success', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
      // 204 No Content — body must be null/undefined per fetch spec.
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toMatchObject({ ok: true });
  });
});
