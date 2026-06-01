import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSasToken,
  listBlobEvidenceSources,
  listBlobEvidenceSnapshots,
  saveBlobEvidenceSnapshot,
  saveBlobEvidenceSource,
  listBlobProcessHubs,
  updateBlobProcessHubs,
  listBlobControlRecords,
  saveBlobControlRecord,
  saveBlobControlReview,
  saveBlobControlHandoff,
  saveBlobPhoto,
  uploadTextBlob,
  listBlobProjects,
  loadBlobProject,
  saveBlobProject,
} from '../blobClient';

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

describe('blobClient same-origin storage adapter', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('keeps getSasToken disabled for broad container SAS access', async () => {
    await expect(getSasToken()).rejects.toThrow(/direct container sas disabled/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('lists saved documents through the server project route', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          projects: [{ projectId: 'p1', name: 'Line 4', updated: '2026-01-01T00:00:00.000Z' }],
        }),
        { status: 200 }
      )
    );

    await expect(listBlobProjects()).resolves.toEqual([
      { projectId: 'p1', name: 'Line 4', updated: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith('/api/storage/projects', expect.any(Object));
  });

  it('loads a project through the server project route', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ project: { id: 'p1' }, etag: '"etag-v1"' }), { status: 200 })
    );

    await expect(loadBlobProject('p1')).resolves.toEqual({ id: 'p1' });
    expect(fetchSpy).toHaveBeenCalledWith('/api/storage/projects/p1', expect.any(Object));
  });

  it('saves a project with If-Match and maps the returned ETag', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ etag: '"etag-v2"' }), { status: 200 })
    );

    const result = await saveBlobProject(
      { id: 'p1' } as never,
      'p1',
      {
        projectId: 'p1',
        name: 'Line 4',
        updated: '2026-01-01T00:00:00.000Z',
        access: { ownerUserId: 'u1', memberUserIds: ['u1'], hubId: 'hub-1', projectId: null },
      },
      '"etag-v1"'
    );

    expect(result).toEqual({ ok: true, etag: '"etag-v2"' });
    const [, init] = fetchSpy.mock.calls[0] as [string, FetchInit];
    expect(fetchSpy).toHaveBeenCalledWith('/api/storage/projects/p1', expect.any(Object));
    expect(init.method).toBe('PUT');
    expect((init.headers as Headers).get('If-Match')).toBe('"etag-v1"');
    expect(JSON.parse(init.body as string)).toMatchObject({
      project: { id: 'p1' },
      metadata: { projectId: 'p1', name: 'Line 4' },
    });
  });

  it('maps project save 412 to precondition-failed', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Precondition failed' }), { status: 412 })
    );

    await expect(
      saveBlobProject({ id: 'p1' } as never, 'p1', {
        projectId: 'p1',
        name: 'Line 4',
        updated: '2026-01-01T00:00:00.000Z',
        access: { ownerUserId: 'u1', memberUserIds: ['u1'], hubId: 'hub-1', projectId: null },
      })
    ).resolves.toEqual({ ok: false, reason: 'precondition-failed' });
  });

  it('lists and updates Process Hub catalog through server routes', async () => {
    const hub = { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null };
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ hubs: [hub] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await expect(listBlobProcessHubs()).resolves.toEqual([hub]);
    await updateBlobProcessHubs([hub]);

    expect(fetchSpy).toHaveBeenNthCalledWith(1, '/api/storage/process-hubs', expect.any(Object));
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      '/api/storage/process-hubs',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('writes evidence source catalog through the hub evidence route', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await saveBlobEvidenceSource({
      id: 'source-1',
      hubId: 'hub-1',
      name: 'Agent review log',
      cadence: 'weekly',
      profileId: 'agent-review-log',
      createdAt: 1745625600000,
      deletedAt: null,
      updatedAt: 1745625600000,
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, FetchInit];
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/storage/hubs/hub-1/evidence-sources',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(JSON.parse(init.body as string).sources[0]).toMatchObject({
      id: 'source-1',
      profileId: 'agent-review-log',
    });
  });

  it('writes Evidence Snapshot metadata with provenance through the snapshots route', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const snapshot = {
      id: 'snapshot-1',
      hubId: 'hub-1',
      sourceId: 'source-1',
      capturedAt: '2026-04-26T12:00:00.000Z',
      rowCount: 3,
      origin: 'evidence-source:source-1',
      importedAt: 1745668800000,
      createdAt: 1745668800000,
      deletedAt: null,
      provenance: [
        {
          id: 'tag-1',
          snapshotId: 'snapshot-1',
          rowKey: 'row-0',
          source: 'paste',
          joinKey: 'row',
          createdAt: 1745668800000,
          deletedAt: null,
        },
      ],
    };

    await saveBlobEvidenceSnapshot(snapshot, 'a,b\n1,2');

    const [, init] = fetchSpy.mock.calls[0] as [string, FetchInit];
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/storage/hubs/hub-1/evidence-sources/source-1/snapshots',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      snapshots: [snapshot],
      sourceCsv: 'a,b\n1,2',
    });
  });

  it('lists Evidence Sources and Snapshot metadata from server route bodies', async () => {
    const source = { id: 'source-1', hubId: 'hub-1', name: 'Source' };
    const snapshot = { id: 'snapshot-1', hubId: 'hub-1', sourceId: 'source-1' };
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ sources: [source] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ snapshots: [snapshot] }), { status: 200 })
      );

    await expect(listBlobEvidenceSources('hub-1')).resolves.toEqual([source]);
    await expect(listBlobEvidenceSnapshots('hub-1', 'source-1')).resolves.toEqual([snapshot]);
  });

  it('uses server routes for control records, reviews, and handoffs', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ records: [{ id: 'rec-1' }] }), { status: 200 })
      )
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      );

    await expect(listBlobControlRecords('hub-1')).resolves.toEqual([{ id: 'rec-1' }]);
    await saveBlobControlRecord({ id: 'rec-1', hubId: 'hub-1' } as never);
    await saveBlobControlReview({ id: 'rev-1', recordId: 'rec-1', hubId: 'hub-1' } as never);
    await saveBlobControlHandoff({ id: 'hoff-1', hubId: 'hub-1' } as never);

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      '/api/storage/hubs/hub-1/control-records',
      expect.any(Object)
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      '/api/storage/hubs/hub-1/control-records',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      '/api/storage/control-reviews',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      4,
      '/api/storage/control-handoffs',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('uploads photos and JSONL text through same-origin routes without storage-token', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: '/api/storage/blob-text?x=1' }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await expect(saveBlobPhoto('project-1', 'finding-1', 'photo-1', new Blob(['x']))).resolves.toBe(
      '/api/storage/blob-text?x=1'
    );
    await uploadTextBlob('project-1/analyze/findings.jsonl', '{}\n');

    expect(fetchSpy).not.toHaveBeenCalledWith('/api/storage-token', expect.anything());
    expect(fetchSpy.mock.calls.map((call: Parameters<typeof fetch>) => call[0])).toEqual([
      '/api/storage/projects/project-1/photos/finding-1/photo-1',
      '/api/storage/blob-text',
    ]);
  });
});
