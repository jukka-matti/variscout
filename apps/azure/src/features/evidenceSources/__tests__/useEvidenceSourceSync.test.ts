import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock BEFORE imports.
vi.mock('../../../services/cloudSync', () => ({
  listEvidenceSnapshotsFromCloud: vi.fn(),
}));
vi.mock('../../../db/schema', () => ({
  db: {
    evidenceSourceCursors: {
      get: vi.fn(),
      put: vi.fn(),
    },
  },
}));

import { renderHook, waitFor } from '@testing-library/react';
import { useEvidenceSourceSync } from '../useEvidenceSourceSync';
import { listEvidenceSnapshotsFromCloud } from '../../../services/cloudSync';
import { db } from '../../../db/schema';
import type { EvidenceSnapshot } from '@variscout/core';

const mockedList = vi.mocked(listEvidenceSnapshotsFromCloud);
const mockedGet = vi.mocked(db.evidenceSourceCursors.get);
const mockedPut = vi.mocked(db.evidenceSourceCursors.put);

const makeSnap = (id: string, capturedAt: string): EvidenceSnapshot => ({
  id,
  hubId: 'h1',
  sourceId: 's1',
  capturedAt,
  rowCount: 100,
  origin: `evidence-source:s1`,
  importedAt: new Date(capturedAt).getTime(),
  createdAt: new Date(capturedAt).getTime(),
  deletedAt: null,
});

describe('useEvidenceSourceSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 new when no snapshots from cloud', async () => {
    mockedGet.mockResolvedValue(undefined);
    mockedList.mockResolvedValue([]);
    const { result } = renderHook(() => useEvidenceSourceSync('h1', 's1', 'token-abc'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.newCount).toBe(0);
    expect(result.current.newSnapshotIds).toEqual([]);
  });

  it('returns all snapshots as new when no cursor exists', async () => {
    mockedGet.mockResolvedValue(undefined);
    const snaps = [
      makeSnap('s-1', '2026-05-01T00:00:00Z'),
      makeSnap('s-2', '2026-05-02T00:00:00Z'),
    ];
    mockedList.mockResolvedValue(snaps);
    const { result } = renderHook(() => useEvidenceSourceSync('h1', 's1', 'token-abc'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.newCount).toBe(2);
    expect(result.current.newSnapshotIds).toEqual(['s-1', 's-2']);
  });

  it('returns only snapshots after lastSeenAt when cursor exists', async () => {
    mockedGet.mockResolvedValue({
      id: 'cursor-h1-s1',
      createdAt: 1746352800000,
      deletedAt: null,
      hubId: 'h1',
      sourceId: 's1',
      lastSeenSnapshotId: 's-1',
      lastSeenAt: new Date('2026-05-01T12:00:00Z').getTime(),
    });
    mockedList.mockResolvedValue([
      makeSnap('s-1', '2026-05-01T00:00:00Z'), // before cursor — old
      makeSnap('s-2', '2026-05-02T00:00:00Z'), // after — new
      makeSnap('s-3', '2026-05-03T00:00:00Z'), // after — new
    ]);
    const { result } = renderHook(() => useEvidenceSourceSync('h1', 's1', 'token-abc'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.newCount).toBe(2);
    expect(result.current.newSnapshotIds).toEqual(['s-2', 's-3']);
  });

  it('skips fetching when token is undefined', async () => {
    const { result } = renderHook(() => useEvidenceSourceSync('h1', 's1', undefined));
    expect(mockedList).not.toHaveBeenCalled();
    expect(result.current.newCount).toBe(0);
  });

  it('markSeen advances the cursor to the most recent snapshot', async () => {
    mockedGet.mockResolvedValue(undefined);
    mockedList.mockResolvedValue([
      makeSnap('s-1', '2026-05-01T00:00:00Z'),
      makeSnap('s-2', '2026-05-02T00:00:00Z'),
    ]);
    mockedPut.mockResolvedValue([0, 0] as never);
    const { result } = renderHook(() => useEvidenceSourceSync('h1', 's1', 'token-abc'));
    await waitFor(() => expect(result.current.newCount).toBe(2));

    await result.current.markSeen();

    expect(mockedPut).toHaveBeenCalledWith(
      expect.objectContaining({
        hubId: 'h1',
        sourceId: 's1',
        lastSeenSnapshotId: 's-2',
        lastSeenAt: new Date('2026-05-02T00:00:00Z').getTime(),
        deletedAt: null,
      })
    );
  });
});
