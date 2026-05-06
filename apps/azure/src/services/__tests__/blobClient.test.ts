import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSasToken,
  _resetSasCache,
  blobUrl,
  listBlobEvidenceSources,
  listBlobEvidenceSnapshots,
  saveBlobEvidenceSnapshot,
  saveBlobEvidenceSource,
  listBlobProcessHubs,
  updateBlobProcessHubs,
  listBlobSustainmentRecords,
  saveBlobSustainmentRecord,
  saveBlobSustainmentReview,
  saveBlobControlHandoff,
} from '../blobClient';

const mockSasResponse = {
  sasUrl: 'https://acct.blob.core.windows.net/container?sig=test',
  expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

describe('blobClient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetSasCache();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // ── blobUrl helper ────────────────────────────────────────────────────

  describe('blobUrl', () => {
    it('inserts blob path between base and query string', () => {
      const sas = 'https://acct.blob.core.windows.net/container?sig=abc';
      expect(blobUrl(sas, 'project-1/analysis.json')).toBe(
        'https://acct.blob.core.windows.net/container/project-1/analysis.json?sig=abc'
      );
    });

    it('appends path when no query string', () => {
      const sas = 'https://acct.blob.core.windows.net/container';
      expect(blobUrl(sas, '_index.json')).toBe(
        'https://acct.blob.core.windows.net/container/_index.json'
      );
    });
  });

  // ── getSasToken ───────────────────────────────────────────────────────

  describe('getSasToken', () => {
    it('fetches a SAS token from the server', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockSasResponse), { status: 200 })
      );

      const result = await getSasToken();
      expect(result).toBe(mockSasResponse.sasUrl);
      expect(fetchSpy).toHaveBeenCalledWith('/api/storage-token', { method: 'POST' });
    });

    it('returns cached token on subsequent calls', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(mockSasResponse), { status: 200 })
      );

      const first = await getSasToken();
      const second = await getSasToken();

      expect(first).toBe(second);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when token is near expiry (<5 min)', async () => {
      // First call: token that expires in 3 minutes (below 5-min margin)
      const nearExpiryResponse = {
        sasUrl: 'https://acct.blob.core.windows.net/container?sig=old',
        expiresOn: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      };
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify(nearExpiryResponse), { status: 200 })
      );

      await getSasToken();

      // Second call: should re-fetch because cached token is within 5-min margin
      const freshResponse = {
        sasUrl: 'https://acct.blob.core.windows.net/container?sig=new',
        expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(freshResponse), { status: 200 }));

      const result = await getSasToken();
      expect(result).toBe(freshResponse.sasUrl);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('throws on 401 Unauthorized', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
      );

      await expect(getSasToken()).rejects.toThrow('401');
    });

    it('throws on 503 Storage not configured', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Blob Storage not configured' }), { status: 503 })
      );

      await expect(getSasToken()).rejects.toThrow('503');
    });

    it('throws on other server errors', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
      );

      await expect(getSasToken()).rejects.toThrow('500');
    });
  });

  // ── Process Hub catalog ───────────────────────────────────────────────

  describe('Process Hub catalog', () => {
    it('returns empty catalog when _process_hubs.json does not exist', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 404 }));

      await expect(listBlobProcessHubs()).resolves.toEqual([]);
      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/_process_hubs.json?sig=test'
      );
    });

    it('writes Process Hub catalog to _process_hubs.json', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }));

      await updateBlobProcessHubs([
        { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
      ]);

      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/_process_hubs.json?sig=test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify([
            { id: 'line-4', name: 'Line 4', createdAt: 1745539200000, deletedAt: null },
          ]),
        })
      );
    });
  });

  // ── Process Hub evidence sources and snapshots ───────────────────────

  describe('Evidence Source snapshots', () => {
    it('writes Evidence Source metadata under the reserved Process Hub path', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }));

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

      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/evidence-sources/source-1/source.json?sig=test',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"profileId":"agent-review-log"'),
        })
      );
    });

    it('writes Evidence Snapshot metadata and profile application under the snapshot path', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }));

      await saveBlobEvidenceSnapshot(
        {
          id: 'snapshot-1',
          hubId: 'hub-1',
          sourceId: 'source-1',
          capturedAt: '2026-04-26T12:00:00.000Z',
          rowCount: 3,
          origin: 'evidence-source:source-1',
          importedAt: 1745668800000,
          createdAt: 1745668800000,
          deletedAt: null,
          profileApplication: {
            profileId: 'agent-review-log',
            profileVersion: 1,
            mapping: { flagColor: 'flagColor' },
            validation: { ok: true, errors: [], warnings: [] },
            derivedColumns: ['GreenPassThrough'],
            derivedRows: [],
          },
        },
        'a,b\n1,2'
      );

      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/evidence-sources/source-1/snapshots/snapshot-1/snapshot.json?sig=test',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(fetchSpy).toHaveBeenNthCalledWith(
        3,
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/evidence-sources/source-1/snapshots/snapshot-1/source.csv?sig=test',
        expect.objectContaining({ method: 'PUT', body: 'a,b\n1,2' })
      );
    });

    it('lists Evidence Sources and Snapshot metadata from catalog blobs', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                id: 'source-1',
                hubId: 'hub-1',
                name: 'Agent review log',
                cadence: 'weekly',
                createdAt: '2026-04-26T00:00:00.000Z',
              },
            ]),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                id: 'snapshot-1',
                hubId: 'hub-1',
                sourceId: 'source-1',
                capturedAt: '2026-04-26T12:00:00.000Z',
                rowCount: 3,
              },
            ]),
            { status: 200 }
          )
        );

      await expect(listBlobEvidenceSources('hub-1')).resolves.toHaveLength(1);
      await expect(listBlobEvidenceSnapshots('hub-1', 'source-1')).resolves.toHaveLength(1);
    });
  });

  // ── Sustainment blobs ─────────────────────────────────────────────────

  describe('Sustainment blobs', () => {
    it('PUTs a SustainmentRecord to the correct path', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }));

      await saveBlobSustainmentRecord({
        id: 'rec-1',
        hubId: 'hub-1',
        investigationId: 'inv-1',
        cadence: 'monthly',
        createdAt: 1745712000000, // 2026-04-27T00:00:00.000Z
        updatedAt: 1745712000000,
        deletedAt: null,
      });

      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/sustainment/records/rec-1.json?sig=test',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'x-ms-blob-type': 'BlockBlob' }),
        })
      );
    });

    it('GETs the catalog path and returns parsed records', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                id: 'rec-1',
                hubId: 'hub-1',
                investigationId: 'inv-1',
                cadence: 'monthly',
                createdAt: 1745712000000,
                updatedAt: 1745712000000,
                deletedAt: null,
              },
            ]),
            { status: 200 }
          )
        );

      const result = await listBlobSustainmentRecords('hub-1');

      expect(result).toHaveLength(1);
      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/sustainment/_index.json?sig=test'
      );
    });

    it('PUTs a SustainmentReview to the per-recordId/reviewId path', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }));

      await saveBlobSustainmentReview({
        id: 'rev-1',
        recordId: 'rec-1',
        hubId: 'hub-1',
        investigationId: 'inv-1',
        reviewedAt: 1745712000000, // 2026-04-27T00:00:00.000Z
        createdAt: 1745712000000,
        deletedAt: null,
        reviewer: { userId: 'u1', displayName: 'Alice' },
        verdict: 'holding',
      });

      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/sustainment/reviews/rec-1/rev-1.json?sig=test',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('PUTs a ControlHandoff to the handoffs path', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response(JSON.stringify(mockSasResponse), { status: 200 }))
        .mockResolvedValueOnce(new Response('', { status: 201 }));

      await saveBlobControlHandoff({
        id: 'hoff-1',
        investigationId: 'inv-1',
        hubId: 'hub-1',
        surface: 'qms-procedure',
        systemName: 'QMS-101',
        operationalOwner: { userId: 'u2', displayName: 'Bob' },
        handoffDate: 1745712000000, // 2026-04-27
        description: 'Procedure handoff',
        retainSustainmentReview: true,
        createdAt: 1745712000000, // formerly recordedAt
        deletedAt: null,
        recordedBy: { userId: 'u1', displayName: 'Alice' },
      });

      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/process-hubs/hub-1/sustainment/handoffs/hoff-1.json?sig=test',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
});
