// src/db/schema.ts

import Dexie from 'dexie';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

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
      controlRecords: 'id, investigationId, hubId, nextReviewDue, updatedAt, tombstoneAt',
      controlReviews: 'id, recordId, investigationId, hubId, reviewedAt',
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
    // controlRecords: rename indexed field tombstoneAt → deletedAt (EntityBase alignment).
    // All timestamps (createdAt, updatedAt, deletedAt) are now Unix ms numbers.
    this.version(9).stores({
      controlRecords: 'id, investigationId, hubId, nextReviewDue, updatedAt, deletedAt',
    });

    // Version 10: PR-RPS-5 — ImprovementProject dedicated table.
    // Mirrors the controlRecords pattern (dedicated table per entity, hubId-indexed).
    // No upgrade callback needed — new empty table; existing data unaffected.
    this.version(10).stores({
      improvementProjects: 'id, hubId, deletedAt, status, updatedAt',
    });

    // Version 11: PR-RPS-8 — ActionItem dedicated table for Quick Action audit trail.
    this.version(11).stores({
      actionItems:
        'id, hubId, stepId, parentImprovementProjectId, parentImprovementIdeaId, status, deletedAt, createdAt',
    });

    // Version 12: PR-WV1-3 — MeasurementPlan dedicated table for Investigation Wall plans.
    this.version(12).stores({
      measurementPlans: 'id, hypothesisId, status, deletedAt',
    });

    // Version 13: PR-WV1-NAV — Sustainment → Control vocabulary rename.
    // Earlier version statements have been rewritten to declare 'controlRecords' /
    // 'controlReviews' (the new table names) in their stores definitions. For
    // any existing on-disk v12 database that physically holds tables named
    // 'sustainmentRecords' / 'sustainmentReviews', Dexie will detect the
    // schema mismatch and re-initialize on next open.
    // Per wedge V1 no-back-compat policy (feedback_wedge_v1_no_migration_no_backcompat),
    // NO upgrade callback is provided — existing v12 rows in the old tables
    // become unreachable. Accepted because wedge V1 has no real Azure
    // customers yet. This empty stores() call bumps the version to flush any
    // cached schema and forces Dexie to re-read the final declared shape.
    this.version(13).stores({});

    // Version 14: PR-CCJ-E1 — ImprovementProject extended with issueStatement +
    // 3 Canvas-state binding fields (stepTimings, formulaBindings,
    // timeDecompositionBindings; processSteps was added here but removed in v16).
    // Stored shape changes but Dexie indexes are
    // unchanged (the new fields are in-row, not indexed).
    // Per wedge V1 no-back-compat policy (feedback_wedge_v1_no_migration_no_backcompat),
    // NO upgrade callback is provided — existing v13 rows that lack the new
    // fields read back with `undefined` for them, which the optional type allows.
    // Bumping the version flushes any cached schema; no destructive re-init
    // required because the shape changes are additive.
    this.version(14).stores({});

    // Version 15: IM-0a — Hub↔Project 1:1 collapse. The improvementProjects
    // Dexie table is unchanged (still keyed by id, hubId-indexed); the 1:1
    // invariant is now enforced at the logical layer (ProcessHub.improvementProject
    // is singular). No schema migration needed — the table shape is identical.
    // Bumping the version flushes any cached schema.
    this.version(15).stores({});

    // Version 16: IM-0b — process-step model reconciliation (ADR-087). The rich
    // ProcessMap (on ProcessContext.processMap, inside the hub blob) becomes the
    // single canonical step structure. IP.processSteps was removed from the
    // ImprovementProject type (it was vestigial — no write path ever persisted
    // it; the derived projection via deriveProcessSteps is the only read path).
    // The improvementProjects Dexie table shape is otherwise unchanged; the
    // field is gone from the type so it can no longer be accidentally written.
    // Per wedge V1 no-users / no-migration stance (ADR-082), NO upgrade
    // callback. The bump flushes cached schema; no destructive re-init.
    this.version(16).stores({});
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
