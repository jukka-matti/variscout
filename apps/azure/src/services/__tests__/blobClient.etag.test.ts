import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateBlobEvidenceSnapshotsConditional } from '../blobClient';
import type { UpdateBlobConditionalResult } from '../blobClient';
import type { EvidenceSnapshot } from '@variscout/core';

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const HUB_ID = 'hub-001';
const SOURCE_ID = 'src-abc';

function makeCatalog(): EvidenceSnapshot[] {
  return [
    {
      id: 'snap-1',
      hubId: HUB_ID,
      sourceId: SOURCE_ID,
      capturedAt: '2024-01-15T00:00:00.000Z',
      rowCount: 0,
      origin: 'paste',
      importedAt: 1700000000000,
      createdAt: 1700000000000,
      deletedAt: null,
    },
  ];
}

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('updateBlobEvidenceSnapshotsConditional', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('first-time write: GET 404 then PUT without If-Match', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(jsonResponse(200, { etag: '"first-etag"' }));

    const result = await updateBlobEvidenceSnapshotsConditional(HUB_ID, SOURCE_ID, makeCatalog());

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: true, etag: '"first-etag"' });
    const [, putInit] = fetchSpy.mock.calls[1] as [string, FetchInit];
    expect((putInit.headers as Headers).get('If-Match')).toBeNull();
  });

  it('subsequent write: GET ETag then PUT with If-Match', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"etag-v1"' }))
      .mockResolvedValueOnce(jsonResponse(200, { etag: '"etag-v2"' }));

    const result = await updateBlobEvidenceSnapshotsConditional(HUB_ID, SOURCE_ID, makeCatalog());

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: true, etag: '"etag-v2"' });
    const [, putInit] = fetchSpy.mock.calls[1] as [string, FetchInit];
    expect((putInit.headers as Headers).get('If-Match')).toBe('"etag-v1"');
  });

  it('412 retries by re-reading the latest ETag before PUT succeeds', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"stale"' }))
      .mockResolvedValueOnce(jsonResponse(412, { error: 'Precondition failed' }))
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"fresh"' }))
      .mockResolvedValueOnce(jsonResponse(200, { etag: '"after-retry"' }));

    const result = await updateBlobEvidenceSnapshotsConditional(HUB_ID, SOURCE_ID, makeCatalog(), {
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: true, etag: '"after-retry"' });
    const [, retryPutInit] = fetchSpy.mock.calls[3] as [string, FetchInit];
    expect((retryPutInit.headers as Headers).get('If-Match')).toBe('"fresh"');
  });

  it('returns concurrency-exhausted after repeated 412s', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"a"' }))
      .mockResolvedValueOnce(jsonResponse(412, { error: 'Precondition failed' }))
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"b"' }))
      .mockResolvedValueOnce(jsonResponse(412, { error: 'Precondition failed' }))
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"c"' }))
      .mockResolvedValueOnce(jsonResponse(412, { error: 'Precondition failed' }));

    const result = await updateBlobEvidenceSnapshotsConditional(HUB_ID, SOURCE_ID, makeCatalog(), {
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    expect(result).toEqual<UpdateBlobConditionalResult>({
      ok: false,
      reason: 'concurrency-exhausted',
    });
  });

  it('maps 403 to auth', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { snapshots: [], etag: '"etag-v1"' }))
      .mockResolvedValueOnce(jsonResponse(403, { error: 'Forbidden' }));

    const result = await updateBlobEvidenceSnapshotsConditional(HUB_ID, SOURCE_ID, makeCatalog());

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: false, reason: 'auth' });
  });

  it('maps thrown fetch failures to network', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await updateBlobEvidenceSnapshotsConditional(HUB_ID, SOURCE_ID, makeCatalog());

    expect(result).toEqual<UpdateBlobConditionalResult>({ ok: false, reason: 'network' });
  });
});
