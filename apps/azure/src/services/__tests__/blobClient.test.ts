import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSasToken,
  _resetSasCache,
  blobUrl,
  listBlobProcessHubs,
  updateBlobProcessHubs,
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
        { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
      ]);

      expect(fetchSpy).toHaveBeenLastCalledWith(
        'https://acct.blob.core.windows.net/container/_process_hubs.json?sig=test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify([
            { id: 'line-4', name: 'Line 4', createdAt: '2026-04-25T00:00:00.000Z' },
          ]),
        })
      );
    });
  });
});
