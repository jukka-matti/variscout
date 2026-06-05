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
    expect(storeNames).toContain('controlRecords');
    expect(storeNames).toContain('controlReviews');
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

describe('IndexedDB schema v14 (E1)', () => {
  beforeEach(async () => {
    await db.delete();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('opens at version 17 from clean state', async () => {
    await openDb();
    // Dexie reports `verno` as the highest declared version after open().
    expect(db.verno).toBe(17);
  });

  it('opens cleanly without erroring on the v17 statement', async () => {
    // The v17 statement drops the phantom `investigationId` index from the
    // control tables (PO-7), with no upgrade callback (per wedge V1
    // no-back-compat policy). If a stale upgrade callback were registered or the
    // version statement were malformed, openDb() would throw here. Successful
    // open + correct verno is the implicit proof.
    await expect(openDb()).resolves.toBeDefined();
    expect(db.verno).toBe(17);
  });

  it('round-trips an ImprovementProject blob with the new E1 fields through the dedicated improvementProjects table', async () => {
    // IPs live in the dedicated `improvementProjects` Dexie table (1:1 with a hub per IM-0a).
    // Exercise that the blob write/read survives the v17 version bump.
    // processSteps is no longer a stored field (removed per IM-0b / ADR-087 —
    // the canonical step structure lives in ProcessMap; processSteps was a
    // vestigial read-only projection that no write path ever persisted).
    await openDb();
    const ipRecord = {
      id: 'ip-e1',
      hubId: 'hub-e1',
      status: 'draft' as const,
      metadata: { title: 'E1 round-trip' },
      goal: { outcomeGoals: [{ outcomeSpecId: 'outcome-1', target: 1.33 }] },
      sections: {
        background: {},
        approach: {},
        outcomeReference: {},
      },
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      // E1 additive fields:
      issueStatement: 'yields dropping',
      stepTimings: [
        {
          kind: 'paired' as const,
          stepId: 'step-1',
          startColumn: 'start_ts',
          endColumn: 'end_ts',
        },
      ],
      formulaBindings: [
        {
          id: 'f-1',
          name: 'Yield_pct',
          numerator: [{ kind: 'column' as const, column: 'good', sign: '+' as const }],
          denominator: [{ kind: 'column' as const, column: 'total', sign: '+' as const }],
          multiplier: 100,
        },
      ],
      timeDecompositionBindings: [
        { id: 'td-1', sourceColumn: 'date', dimensions: ['year', 'month'] },
      ],
    };
    await db.table('improvementProjects').put(ipRecord);

    const ip = await db.table('improvementProjects').get('ip-e1');
    expect(ip?.issueStatement).toBe('yields dropping');
    expect(ip?.stepTimings?.[0]?.kind).toBe('paired');
    expect(ip?.formulaBindings?.[0]?.name).toBe('Yield_pct');
    expect(ip?.timeDecompositionBindings?.[0]?.dimensions).toEqual(['year', 'month']);
  });
});
