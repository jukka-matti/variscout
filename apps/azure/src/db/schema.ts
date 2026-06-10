// src/db/schema.ts

import Dexie from 'dexie';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
import type { DocumentSnapshot } from '@variscout/stores';

export interface DocumentAccess {
  ownerUserId: string;
  memberUserIds: string[];
  hubId: string | null;
  projectId: string | null;
}

export interface ProjectRecord {
  name: string;
  location: 'team' | 'personal';
  modified: Date;
  synced: boolean;
  data: DocumentSnapshot;
  /** Lightweight project health metadata (phase, finding counts, etc.) */
  meta?: import('@variscout/core').ProjectMetadata;
  access?: DocumentAccess;
}

export interface SyncStateRecord {
  name: string;
  cloudId: string;
  lastSynced: string;
  etag: string;
  /** JSON snapshot of the cloud state at last load - used as merge base */
  baseStateJson?: string;
}

export interface SyncItem {
  id?: number;
  name: string;
  location: 'team' | 'personal';
  project: DocumentSnapshot;
  queuedAt: string;
}

import type { EvidenceSourceCursor } from '@variscout/core';

export type { EvidenceSourceCursor };
export type ProcessHubRecord = import('@variscout/core').ProcessHub;
export type EvidenceSourceRecord = import('@variscout/core').EvidenceSource;
export type EvidenceSnapshotRecord = import('@variscout/core').EvidenceSnapshot;
export type ImprovementProjectRecord =
  import('@variscout/core/improvementProject').ImprovementProject;
export type ActionItemRecord = import('@variscout/core/findings').ActionItem & {
  hubId: import('@variscout/core').ProcessHub['id'];
};

export class VariScoutDatabase extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>;
  syncQueue!: Dexie.Table<SyncItem, number>;
  syncState!: Dexie.Table<SyncStateRecord, string>;
  processHubs!: Dexie.Table<ProcessHubRecord, string>;
  evidenceSources!: Dexie.Table<EvidenceSourceRecord, string>;
  evidenceSnapshots!: Dexie.Table<EvidenceSnapshotRecord, string>;
  controlRecords!: Dexie.Table<import('@variscout/core').ControlRecord, string>;
  controlReviews!: Dexie.Table<import('@variscout/core').ControlReview, string>;
  controlHandoffs!: Dexie.Table<import('@variscout/core').ControlHandoff, string>;
  evidenceSourceCursors!: Dexie.Table<EvidenceSourceCursor, [string, string]>;
  improvementProjects!: Dexie.Table<ImprovementProjectRecord, string>;
  actionItems!: Dexie.Table<ActionItemRecord, string>;
  measurementPlans!: Dexie.Table<MeasurementPlan, string>;

  constructor() {
    super('VaRiScoutAzureV1');
    // Clean pre-launch schema. Azure keeps its document/cloud-sync overlay
    // stores alongside the current hub-domain stores.
    this.version(1).stores({
      projects: 'name, location, modified, synced',
      syncQueue: '++id, name, location, queuedAt',
      syncState: 'name, cloudId, lastSynced, etag',
      processHubs: 'id, name, updatedAt',
      evidenceSources: 'id, hubId, name, profileId, updatedAt',
      evidenceSnapshots: 'id, hubId, sourceId, capturedAt',
      controlRecords: 'id, hubId, nextReviewDue, updatedAt, deletedAt',
      controlReviews: 'id, recordId, hubId, reviewedAt',
      controlHandoffs: 'id, hubId, handoffDate',
      evidenceSourceCursors: '[hubId+sourceId]',
      improvementProjects: 'id, hubId, deletedAt, status, updatedAt',
      actionItems:
        'id, hubId, stepId, parentImprovementProjectId, parentImprovementIdeaId, status, deletedAt, createdAt',
      measurementPlans: 'id, hypothesisId, status, deletedAt',
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
