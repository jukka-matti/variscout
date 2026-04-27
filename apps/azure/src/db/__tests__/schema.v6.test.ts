import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db, openDb } from '../schema';

describe('IndexedDB schema v6', () => {
  beforeEach(async () => {
    await db.delete();
  });

  it('opens at version 6 from clean state with sustainment stores', async () => {
    await openDb();
    const storeNames = Array.from(db.tables.map(t => t.name));
    expect(storeNames).toContain('sustainmentRecords');
    expect(storeNames).toContain('sustainmentReviews');
    expect(storeNames).toContain('controlHandoffs');
  });

  it('upgrades from v5 to v6 without data loss in pre-existing stores', async () => {
    const v5 = new Dexie('VaRiScoutAzure');
    v5.version(5).stores({
      projects: 'name, location, modified, synced',
      processHubs: 'id, name',
      evidenceSources: 'id, hubId',
    });
    await v5.open();
    await v5.table('processHubs').put({ id: 'hub-1', name: 'Line 4' });
    v5.close();

    await openDb();
    const hub = await db.table('processHubs').get('hub-1');
    expect(hub?.name).toBe('Line 4');
  });
});
