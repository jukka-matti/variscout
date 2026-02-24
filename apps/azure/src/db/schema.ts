// src/db/schema.ts

import Dexie from 'dexie';

export interface ProjectRecord {
  name: string;
  location: 'team' | 'personal';
  modified: Date;
  synced: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface SyncStateRecord {
  name: string;
  cloudId: string;
  lastSynced: string;
  etag: string;
}

export interface SyncItem {
  id?: number;
  name: string;
  location: 'team' | 'personal';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any;
  queuedAt: string;
}

class VariScoutDatabase extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>;
  syncQueue!: Dexie.Table<SyncItem, number>;
  syncState!: Dexie.Table<SyncStateRecord, string>;

  constructor() {
    super('VaRiScoutAzure');
    this.version(1).stores({
      // Local cache of projects
      projects: 'name, location, modified, synced',

      // Sync queue for offline changes
      syncQueue: '++id, name, location, queuedAt',

      // Track what's been synced
      syncState: 'name, cloudId, lastSynced, etag',
    });
  }
}

export const db = new VariScoutDatabase();

// Sync queue operations
export async function addToSyncQueue(item: Omit<SyncItem, 'id' | 'queuedAt'>) {
  await db.syncQueue.put({
    name: item.name,
    location: item.location,
    project: item.project,
    queuedAt: new Date().toISOString(),
  });
}

export async function getPendingSyncItems(): Promise<SyncItem[]> {
  return await db.syncQueue.toArray();
}

export async function removeFromSyncQueue(name: string) {
  await db.syncQueue.where('name').equals(name).delete();
}
