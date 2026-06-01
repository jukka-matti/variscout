import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadBlobCanvasViewport, saveBlobCanvasViewport, _resetSasCache } from '../blobClient';
import type { LoadedViewport, ViewportBlobShape } from '../blobClient';

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const HUB_ID = 'hub-viewport-001';
const EXPECTED_API_URL = `/api/storage/hubs/${HUB_ID}/viewport`;

const MOCK_SNAPSHOT: ViewportBlobShape = {
  zoom: 1.5,
  pan: { x: 10, y: -20 },
  currentLevel: 'l2',
  nodePositions: { 'node-1': { x: 100, y: 200 } },
  groupByTributary: false,
  updatedAt: 1700000000000,
};

function responseWithEtag(status: number, etag: string, body?: unknown): Response {
  return new Response(body !== undefined ? JSON.stringify(body) : '', {
    status,
    headers: { ETag: etag },
  });
}

function responseWithStatus(status: number): Response {
  return new Response('', { status });
}

function expectNoStorageTokenCall(fetchSpy: ReturnType<typeof vi.spyOn>): void {
  expect(
    fetchSpy.mock.calls.some((call: Parameters<typeof fetch>) => call[0] === '/api/storage-token')
  ).toBe(false);
}

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
    fetchSpy.mockResolvedValueOnce(responseWithStatus(404));

    const result = await loadBlobCanvasViewport(HUB_ID);

    expect(result).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(EXPECTED_API_URL, expect.any(Object));
    expectNoStorageTokenCall(fetchSpy);
  });

  it('returns snapshot and ETag on 200', async () => {
    fetchSpy.mockResolvedValueOnce(
      responseWithEtag(200, '"etag-v1"', { snapshot: MOCK_SNAPSHOT, etag: '"etag-v1"' })
    );

    const result = await loadBlobCanvasViewport(HUB_ID);

    expect(result).toMatchObject<LoadedViewport>({
      snapshot: MOCK_SNAPSHOT,
      etag: '"etag-v1"',
    });
    expectNoStorageTokenCall(fetchSpy);
  });

  it('returns null when GET response is not ok (non-404)', async () => {
    fetchSpy.mockResolvedValueOnce(responseWithStatus(500));

    const result = await loadBlobCanvasViewport(HUB_ID);
    expect(result).toBeNull();
    expectNoStorageTokenCall(fetchSpy);
  });

  it('returns null when fetch throws a network error', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await loadBlobCanvasViewport(HUB_ID);
    expect(result).toBeNull();
    expectNoStorageTokenCall(fetchSpy);
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

  it('first write: priorEtag=null sends PUT without If-Match header', async () => {
    fetchSpy.mockResolvedValueOnce(responseWithEtag(201, '"new-etag-v1"'));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toEqual({ ok: true, etag: '"new-etag-v1"' });
    const [, putInit] = fetchSpy.mock.calls[0] as [string, FetchInit];
    expect(fetchSpy).toHaveBeenCalledWith(
      EXPECTED_API_URL,
      expect.objectContaining({ method: 'PUT' })
    );
    expect((putInit.headers as Headers).get('If-Match')).toBeNull();
    expect(JSON.parse(putInit.body as string)).toEqual({ snapshot: MOCK_SNAPSHOT });
    expectNoStorageTokenCall(fetchSpy);
  });

  it('subsequent write sends If-Match and returns new ETag', async () => {
    fetchSpy.mockResolvedValueOnce(responseWithEtag(200, '"new-etag-v2"'));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, '"etag-v1"');

    expect(result).toEqual({ ok: true, etag: '"new-etag-v2"' });
    const [, putInit] = fetchSpy.mock.calls[0] as [string, FetchInit];
    expect((putInit.headers as Headers).get('If-Match')).toBe('"etag-v1"');
    expectNoStorageTokenCall(fetchSpy);
  });

  it('stale ETag maps 412 to precondition-failed', async () => {
    fetchSpy.mockResolvedValueOnce(responseWithStatus(412));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, '"stale-etag"');

    expect(result).toMatchObject({ ok: false, reason: 'precondition-failed', status: 412 });
    expectNoStorageTokenCall(fetchSpy);
  });

  it('403 response maps to auth denial', async () => {
    fetchSpy.mockResolvedValueOnce(responseWithStatus(403));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, '"etag-v1"');

    expect(result).toMatchObject({ ok: false, reason: 'auth', status: 403 });
    expectNoStorageTokenCall(fetchSpy);
  });

  it('401 response maps to auth denial', async () => {
    fetchSpy.mockResolvedValueOnce(responseWithStatus(401));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toMatchObject({ ok: false, reason: 'auth', status: 401 });
    expectNoStorageTokenCall(fetchSpy);
  });

  it('network error maps to network', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toMatchObject({ ok: false, reason: 'network' });
    expectNoStorageTokenCall(fetchSpy);
  });

  it('204 response is treated as success', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204, headers: { ETag: '"e"' } }));

    const result = await saveBlobCanvasViewport(HUB_ID, MOCK_SNAPSHOT, null);

    expect(result).toMatchObject({ ok: true, etag: '"e"' });
    expectNoStorageTokenCall(fetchSpy);
  });
});
