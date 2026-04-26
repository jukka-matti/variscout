// src/db/schema.ts

import Dexie from 'dexie';

export interface ProjectRecord {
  name: string;
  location: 'team' | 'personal';
  modified: Date;
  synced: boolean;
  data: unknown;
  /** Lightweight project health metadata (phase, finding counts, etc.) */
  meta?: import('@variscout/core').ProjectMetadata;
}

export interface SyncStateRecord {
  name: string;
  cloudId: string;
  lastSynced: string;
  etag: string;
  /** JSON snapshot of the cloud state at last load — used as merge base */
  baseStateJson?: string;
}

export interface SyncItem {
  id?: number;
  name: string;
  location: 'team' | 'personal';
  project: unknown;
  queuedAt: string;
}

export type ProcessHubRecord = import('@variscout/core').ProcessHub;
export type EvidenceSourceRecord = import('@variscout/core').EvidenceSource;
export type EvidenceSnapshotRecord = import('@variscout/core').EvidenceSnapshot;

class VariScoutDatabase extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>;
  syncQueue!: Dexie.Table<SyncItem, number>;
  syncState!: Dexie.Table<SyncStateRecord, string>;
  processHubs!: Dexie.Table<ProcessHubRecord, string>;
  evidenceSources!: Dexie.Table<EvidenceSourceRecord, string>;
  evidenceSnapshots!: Dexie.Table<EvidenceSnapshotRecord, string>;

  constructor() {
    super('VaRiScoutAzure');
    // Tables retained for Dexie schema version compatibility (ADR-059)
    // Version 1: original schema
    this.version(1).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
    });

    // Version 2: add photo queue for offline photo uploads
    this.version(2).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      photoQueue: '++id, photoId, findingId, queuedAt',
    });

    // Version 3: add channel drive cache + baseStateJson in syncState
    this.version(3).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      photoQueue: '++id, photoId, findingId, queuedAt',
      channelDriveCache: 'channelId',
    });

    // Version 4: Process Hub catalog for Azure Standard local mode
    this.version(4).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      photoQueue: '++id, photoId, findingId, queuedAt',
      channelDriveCache: 'channelId',
      processHubs: 'id, name, updatedAt',
    });

    // Version 5: Process Hub Evidence Sources and Snapshot metadata
    this.version(5).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      photoQueue: '++id, photoId, findingId, queuedAt',
      channelDriveCache: 'channelId',
      processHubs: 'id, name, updatedAt',
      evidenceSources: 'id, hubId, name, profileId, updatedAt',
      evidenceSnapshots: 'id, hubId, sourceId, capturedAt',
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

/** Remove sync queue items older than `daysOld` days (default 30). */
export async function pruneSyncQueue(daysOld = 30): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 86_400_000).toISOString();
  return db.syncQueue.where('queuedAt').below(cutoff).delete();
}
