import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db, openDb } from '../schema';

describe('IndexedDB schema v6', () => {
  beforeEach(async () => {
    await db.delete();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('opens at version 6 from clean state with sustainment stores', async () => {
    await openDb();
    const storeNames = Array.from(db.tables.map(t => t.name));
    expect(storeNames).toContain('sustainmentRecords');
    expect(storeNames).toContain('sustainmentReviews');
    expect(storeNames).toContain('controlHandoffs');
  });

  it('upgrades from v5 to v6 without data loss in any pre-existing store', async () => {
    const v5 = new Dexie('VaRiScoutAzure');
    v5.version(5).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      photoQueue: '++id, photoId, findingId, queuedAt',
      channelDriveCache: 'channelId',
      processHubs: 'id, name, updatedAt',
      evidenceSources: 'id, hubId, name, profileId, updatedAt',
      evidenceSnapshots: 'id, hubId, sourceId, capturedAt',
    });
    await v5.open();

    await v5.table('projects').put({
      name: 'project-a',
      location: 'team',
      modified: new Date('2026-04-26T00:00:00.000Z'),
      synced: true,
      data: { findings: [] },
    });
    await v5.table('syncQueue').put({
      name: 'project-a',
      location: 'team',
      project: { findings: [] },
      queuedAt: '2026-04-26T00:00:00.000Z',
    });
    await v5.table('syncState').put({
      name: 'project-a',
      cloudId: 'cloud-1',
      lastSynced: '2026-04-26T00:00:00.000Z',
      etag: 'etag-1',
    });
    await v5.table('photoQueue').put({
      photoId: 'photo-1',
      findingId: 'finding-1',
      queuedAt: '2026-04-26T00:00:00.000Z',
    });
    await v5.table('channelDriveCache').put({
      channelId: 'channel-1',
      driveId: 'drive-1',
      cachedAt: '2026-04-26T00:00:00.000Z',
    });
    await v5.table('processHubs').put({
      id: 'hub-1',
      name: 'Line 4',
      createdAt: '2026-04-26T00:00:00.000Z',
    });
    await v5.table('evidenceSources').put({
      id: 'source-1',
      hubId: 'hub-1',
      name: 'Audit',
      cadence: 'shiftly',
      createdAt: '2026-04-26T00:00:00.000Z',
    });
    await v5.table('evidenceSnapshots').put({
      id: 'snapshot-1',
      hubId: 'hub-1',
      sourceId: 'source-1',
      capturedAt: '2026-04-26T00:00:00.000Z',
      rowCount: 42,
    });
    v5.close();

    await openDb();

    const project = await db.table('projects').get('project-a');
    expect(project?.location).toBe('team');
    expect(project?.synced).toBe(true);

    const sync = await db.table('syncState').get('project-a');
    expect(sync?.cloudId).toBe('cloud-1');

    const queued = await db.table('syncQueue').toArray();
    expect(queued).toHaveLength(1);
    expect(queued[0]?.name).toBe('project-a');

    const photos = await db.table('photoQueue').toArray();
    expect(photos).toHaveLength(1);
    expect(photos[0]?.photoId).toBe('photo-1');

    const channel = await db.table('channelDriveCache').get('channel-1');
    expect(channel?.driveId).toBe('drive-1');

    const hub = await db.table('processHubs').get('hub-1');
    expect(hub?.name).toBe('Line 4');

    const source = await db.table('evidenceSources').get('source-1');
    expect(source?.cadence).toBe('shiftly');

    const snapshot = await db.table('evidenceSnapshots').get('snapshot-1');
    expect(snapshot?.rowCount).toBe(42);
  });
});
