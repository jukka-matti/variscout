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

import type { EvidenceSourceCursor } from '@variscout/core';

export type { EvidenceSourceCursor };
export type ProcessHubRecord = import('@variscout/core').ProcessHub;
export type EvidenceSourceRecord = import('@variscout/core').EvidenceSource;
export type EvidenceSnapshotRecord = import('@variscout/core').EvidenceSnapshot;

export class VariScoutDatabase extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>;
  syncQueue!: Dexie.Table<SyncItem, number>;
  syncState!: Dexie.Table<SyncStateRecord, string>;
  processHubs!: Dexie.Table<ProcessHubRecord, string>;
  evidenceSources!: Dexie.Table<EvidenceSourceRecord, string>;
  evidenceSnapshots!: Dexie.Table<EvidenceSnapshotRecord, string>;
  sustainmentRecords!: Dexie.Table<import('@variscout/core').SustainmentRecord, string>;
  sustainmentReviews!: Dexie.Table<import('@variscout/core').SustainmentReview, string>;
  controlHandoffs!: Dexie.Table<import('@variscout/core').ControlHandoff, string>;
  evidenceSourceCursors!: Dexie.Table<EvidenceSourceCursor, [string, string]>;

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

    // Version 6: Phase 6 sustainment — review scheduling and control handoff tracking
    this.version(6).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      photoQueue: '++id, photoId, findingId, queuedAt',
      channelDriveCache: 'channelId',
      processHubs: 'id, name, updatedAt',
      evidenceSources: 'id, hubId, name, profileId, updatedAt',
      evidenceSnapshots: 'id, hubId, sourceId, capturedAt',
      sustainmentRecords: 'id, investigationId, hubId, nextReviewDue, updatedAt, tombstoneAt',
      sustainmentReviews: 'id, recordId, investigationId, hubId, reviewedAt',
      controlHandoffs: 'id, investigationId, hubId, handoffDate',
    });

    // Version 7: Framing Layer V1 Slice 1 — no-op schema bump.
    // Task 1 added optional ProcessHub fields (processGoal, outcomes,
    // primaryScopeDimensions). These are TypeScript-only additions; Dexie
    // stores them transparently because `processHubs` uses `id` as the only
    // declared index. The empty-stores object signals "no schema change" and
    // flushes any cached schema for the bumped version.
    this.version(7).stores({});

    // Version 8: Framing Layer V1 Slice 3 — per-(hubId, sourceId) cursor for
    // diff-on-open polling (D8). Compound primary key tracks the most-recently
    // seen snapshot so the goal banner can show "X new snapshots ↑" without
    // re-fetching the full history on every open.
    this.version(8).stores({
      evidenceSourceCursors: '[hubId+sourceId]',
    });

    // Version 9: F1 data-flow foundation — P1.4b.
    // sustainmentRecords: rename indexed field tombstoneAt → deletedAt (EntityBase alignment).
    // All timestamps (createdAt, updatedAt, deletedAt) are now Unix ms numbers.
    this.version(9).stores({
      sustainmentRecords: 'id, investigationId, hubId, nextReviewDue, updatedAt, deletedAt',
    });
  }
}

export const db = new VariScoutDatabase();

export async function openDb(): Promise<VariScoutDatabase> {
  await db.open();
  return db;
}

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
