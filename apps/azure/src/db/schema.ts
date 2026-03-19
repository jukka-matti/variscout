// src/db/schema.ts

import Dexie from 'dexie';

export interface ProjectRecord {
  name: string;
  location: 'team' | 'personal';
  modified: Date;
  synced: boolean;
  data: unknown;
}

export interface SyncStateRecord {
  name: string;
  cloudId: string;
  lastSynced: string;
  etag: string;
  /** JSON snapshot of the cloud state at last load — used as merge base */
  baseStateJson?: string;
}

export interface ChannelDriveCacheRecord {
  channelId: string;
  driveId: string;
  folderId: string;
  folderWebUrl?: string;
  resolvedAt: string;
}

export interface SyncItem {
  id?: number;
  name: string;
  location: 'team' | 'personal';
  project: unknown;
  queuedAt: string;
}

export interface PhotoQueueItem {
  id?: number;
  photoId: string;
  findingId: string;
  commentId: string;
  analysisId: string;
  filename: string;
  blob: Blob;
  queuedAt: string;
}

class VariScoutDatabase extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>;
  syncQueue!: Dexie.Table<SyncItem, number>;
  syncState!: Dexie.Table<SyncStateRecord, string>;
  photoQueue!: Dexie.Table<PhotoQueueItem, number>;
  channelDriveCache!: Dexie.Table<ChannelDriveCacheRecord, string>;

  constructor() {
    super('VaRiScoutAzure');
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

// Photo queue operations
export async function addToPhotoQueue(item: Omit<PhotoQueueItem, 'id' | 'queuedAt'>) {
  await db.photoQueue.put({
    ...item,
    queuedAt: new Date().toISOString(),
  });
}

export async function getPendingPhotos(): Promise<PhotoQueueItem[]> {
  return await db.photoQueue.toArray();
}

export async function removeFromPhotoQueue(photoId: string) {
  await db.photoQueue.where('photoId').equals(photoId).delete();
}
