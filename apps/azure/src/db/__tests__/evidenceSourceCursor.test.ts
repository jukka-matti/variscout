import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../schema';

describe('evidenceSourceCursors table', () => {
  beforeEach(async () => {
    await db.evidenceSourceCursors.clear();
  });

  it('persists evidence source cursor and reads it back by [hubId, sourceId]', async () => {
    await db.evidenceSourceCursors.put({
      id: 'cursor-h1-s1',
      createdAt: 1746352800000,
      deletedAt: null,
      hubId: 'h1',
      sourceId: 's1',
      lastSeenSnapshotId: 'snap-5',
      lastSeenAt: 1746352800000,
    });
    const cursor = await db.evidenceSourceCursors.get(['h1', 's1']);
    expect(cursor?.lastSeenSnapshotId).toBe('snap-5');
  });

  it('keys are independent — different hubs and sources have separate cursors', async () => {
    await db.evidenceSourceCursors.put({
      id: 'cursor-h1-s1',
      createdAt: 1746352800000,
      deletedAt: null,
      hubId: 'h1',
      sourceId: 's1',
      lastSeenSnapshotId: 'snap-A',
      lastSeenAt: 1746352800000,
    });
    await db.evidenceSourceCursors.put({
      id: 'cursor-h1-s2',
      createdAt: 1746352800000,
      deletedAt: null,
      hubId: 'h1',
      sourceId: 's2',
      lastSeenSnapshotId: 'snap-B',
      lastSeenAt: 1746352800000,
    });
    await db.evidenceSourceCursors.put({
      id: 'cursor-h2-s1',
      createdAt: 1746352800000,
      deletedAt: null,
      hubId: 'h2',
      sourceId: 's1',
      lastSeenSnapshotId: 'snap-C',
      lastSeenAt: 1746352800000,
    });
    const a = await db.evidenceSourceCursors.get(['h1', 's1']);
    const b = await db.evidenceSourceCursors.get(['h1', 's2']);
    const c = await db.evidenceSourceCursors.get(['h2', 's1']);
    expect(a?.lastSeenSnapshotId).toBe('snap-A');
    expect(b?.lastSeenSnapshotId).toBe('snap-B');
    expect(c?.lastSeenSnapshotId).toBe('snap-C');
  });
});
