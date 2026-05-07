// src/services/cloudSync.ts
// Cloud sync via Blob Storage (ADR-059 Phase 2).
// Wraps blobClient.ts operations for the storage.ts orchestrator.

import { DEFAULT_PROCESS_HUB } from '@variscout/core';
import type {
  ControlHandoff,
  EvidenceSnapshot,
  EvidenceSource,
  ProcessHub,
  ProjectMetadata,
  SustainmentRecord,
  SustainmentReview,
} from '@variscout/core';
import { AuthError } from '../auth/easyAuth';
import { db } from '../db/schema';
import type { Project } from './localDb';
import {
  saveBlobProject,
  loadBlobProject,
  loadBlobMetadata,
  listBlobProjects,
  updateBlobIndex,
  listBlobProcessHubs,
  updateBlobProcessHubs,
  listBlobEvidenceSources,
  listBlobEvidenceSnapshots,
  saveBlobEvidenceSnapshot,
  saveBlobEvidenceSource,
  updateBlobEvidenceSources,
  updateBlobEvidenceSnapshots,
  listBlobSustainmentRecords,
  saveBlobSustainmentRecord,
  updateBlobSustainmentCatalog,
  saveBlobSustainmentReview,
  saveBlobControlHandoff,
} from './blobClient';
import type { BlobProjectMetadata } from './blobClient';

// ── Fallback error ─────────────────────────────────────────────────────

/** Thrown when Blob Storage is not configured (503 from server) or feature not applicable. */
export class CloudSyncUnavailableError extends Error {
  constructor(message = 'Cloud sync unavailable — Blob Storage not configured') {
    super(message);
    this.name = 'CloudSyncUnavailableError';
  }
}

// ── Shared types (preserved for downstream consumers) ──────────────────

export type StorageLocation = 'team' | 'personal';

export interface SyncStatus {
  status: 'saved' | 'offline' | 'syncing' | 'synced' | 'conflict' | 'error';
  message: string;
  pendingChanges?: number;
  lastSynced?: Date;
}

export interface CloudProject {
  id: string;
  name: string;
  modified: string;
  modifiedBy?: string;
  location: StorageLocation;
  etag?: string;
  /** Lightweight project health summary from .meta.json sidecar */
  metadata?: ProjectMetadata;
}

export interface SyncNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  action?: { label: string; onClick: () => void };
  dismissAfter?: number; // ms, undefined = persistent
}

// ── Error Classification ────────────────────────────────────────────────

export type SyncErrorCategory =
  | 'auth'
  | 'forbidden'
  | 'plan-mismatch'
  | 'network'
  | 'throttle'
  | 'server'
  | 'not_found'
  | 'unknown';

export interface ClassifiedError {
  category: SyncErrorCategory;
  retryable: boolean;
  message: string;
}

export function classifySyncError(error: unknown): ClassifiedError {
  if (error instanceof CloudSyncUnavailableError) {
    return { category: 'unknown', retryable: false, message: error.message };
  }
  if (error instanceof AuthError) {
    return { category: 'auth', retryable: false, message: error.message };
  }

  const msg = error instanceof Error ? error.message : String(error);
  const status = extractStatusCode(msg);

  if (status === 401 || /unauthorized/i.test(msg)) {
    return { category: 'auth', retryable: false, message: 'Authentication expired' };
  }
  if (status === 403 || /forbidden/i.test(msg)) {
    return { category: 'forbidden', retryable: false, message: 'Access denied' };
  }
  if (status === 404) {
    return { category: 'not_found', retryable: false, message: 'Resource not found' };
  }
  if (status === 429 || /throttl/i.test(msg)) {
    return { category: 'throttle', retryable: true, message: 'Rate limited, will retry' };
  }
  if (status >= 500 || /server/i.test(msg)) {
    return { category: 'server', retryable: true, message: 'Server error, will retry' };
  }
  if (/network|fetch|timeout|abort/i.test(msg) || !navigator.onLine) {
    return { category: 'network', retryable: true, message: 'Network error, will retry' };
  }

  return { category: 'unknown', retryable: true, message: msg || 'Unknown error' };
}

function extractStatusCode(msg: string): number {
  const match = msg.match(/\b(\d{3})\b/);
  return match ? parseInt(match[1], 10) : 0;
}

// ── GraphError stub (for type compatibility with storage.ts re-exports) ─

/** Minimal stub — Graph API removed per ADR-059. */
export class GraphError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'GraphError';
    this.status = status;
  }
}

/** Wrap blobClient calls: convert 503 (not configured) into CloudSyncUnavailableError. */
async function wrapBlobCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/503/.test(msg)) {
      throw new CloudSyncUnavailableError();
    }
    // Strip SAS tokens from error messages before propagating
    if (error instanceof Error && error.message.includes('sig=')) {
      error.message = error.message.replace(/\?.*$/, '?[SAS_REDACTED]');
    }
    throw error;
  }
}

/** Fire-and-forget index update — data is safe even if this fails. */
async function updateIndex(projectId: string, metadata: BlobProjectMetadata): Promise<void> {
  const index = await listBlobProjects();
  const existing = index.findIndex(p => p.projectId === projectId);
  if (existing >= 0) index[existing] = metadata;
  else index.push(metadata);
  await updateBlobIndex(index);
}

// ── Cloud operations (backed by Blob Storage) ──────────────────────────

export async function saveToCloud(
  _token: string,
  project: Project,
  name: string,
  _location: StorageLocation,
  projectMetadata?: ProjectMetadata
): Promise<{ id: string; etag: string }> {
  // Use stable UUID from syncState, or generate a new one (C-1)
  const syncState = await db.syncState.get(name);
  const projectId = syncState?.cloudId ?? crypto.randomUUID();
  const now = new Date().toISOString();

  const metadata: BlobProjectMetadata = {
    projectId,
    name,
    updated: now,
    metadata: projectMetadata,
  };

  await wrapBlobCall(async () => {
    await saveBlobProject(project, projectId, metadata);
  });

  // Fire-and-forget index update — data is safe even if this fails (C-2)
  updateIndex(projectId, metadata).catch(err => {
    if (import.meta.env.DEV) console.warn('[cloudSync] Index update failed:', err);
  });

  return { id: projectId, etag: now };
}

export async function listProcessHubsFromCloud(_token: string): Promise<ProcessHub[]> {
  const hubs = await wrapBlobCall(() => listBlobProcessHubs());
  return hubs.length > 0 ? hubs : [DEFAULT_PROCESS_HUB];
}

export async function saveProcessHubToCloud(_token: string, hub: ProcessHub): Promise<void> {
  const hubs = await listProcessHubsFromCloud(_token);
  const next = hubs.some(existing => existing.id === hub.id)
    ? hubs.map(existing => (existing.id === hub.id ? hub : existing))
    : [...hubs, hub];
  await wrapBlobCall(() => updateBlobProcessHubs(next));
}

export async function listEvidenceSourcesFromCloud(
  _token: string,
  hubId: string
): Promise<EvidenceSource[]> {
  return wrapBlobCall(() => listBlobEvidenceSources(hubId));
}

export async function saveEvidenceSourceToCloud(
  _token: string,
  source: EvidenceSource
): Promise<void> {
  const existing = await listEvidenceSourcesFromCloud(_token, source.hubId);
  const next = existing.some(item => item.id === source.id)
    ? existing.map(item => (item.id === source.id ? source : item))
    : [...existing, source];
  await wrapBlobCall(async () => {
    await saveBlobEvidenceSource(source);
    await updateBlobEvidenceSources(source.hubId, next);
  });
}

export async function listEvidenceSnapshotsFromCloud(
  _token: string,
  hubId: string,
  sourceId: string
): Promise<EvidenceSnapshot[]> {
  return wrapBlobCall(() => listBlobEvidenceSnapshots(hubId, sourceId));
}

/**
 * Upload an EvidenceSnapshot envelope (including `provenance?: RowProvenanceTag[]`) to
 * Blob Storage via a single atomic PUT (F3.6-β D1 / ADR-077 amendment 2026-05-07).
 *
 * Serialization path: `saveBlobEvidenceSnapshot` → `putJsonBlob` → `JSON.stringify(snapshot)`.
 * No replacer is applied, so every field present on the snapshot — including `provenance` —
 * is preserved verbatim in the uploaded blob. Snapshot id is the path key, making the PUT
 * idempotent: transient-failure retries re-upload the same object.
 */
export async function saveEvidenceSnapshotToCloud(
  _token: string,
  snapshot: EvidenceSnapshot,
  sourceCsv?: string
): Promise<void> {
  const existing = await listEvidenceSnapshotsFromCloud(_token, snapshot.hubId, snapshot.sourceId);
  const next = existing.some(item => item.id === snapshot.id)
    ? existing.map(item => (item.id === snapshot.id ? snapshot : item))
    : [...existing, snapshot];
  await wrapBlobCall(async () => {
    await saveBlobEvidenceSnapshot(snapshot, sourceCsv);
    await updateBlobEvidenceSnapshots(snapshot.hubId, snapshot.sourceId, next);
  });
}

export async function loadFromCloud(
  _token: string,
  name: string,
  _location: StorageLocation
): Promise<Project | null> {
  const syncState = await db.syncState.get(name);
  if (!syncState?.cloudId) return null;
  return wrapBlobCall(() => loadBlobProject(syncState.cloudId));
}

export async function listFromCloud(
  _token: string,
  _location: StorageLocation
): Promise<CloudProject[]> {
  const entries = await wrapBlobCall(() => listBlobProjects());
  return entries.map(entry => ({
    id: entry.projectId,
    name: entry.name,
    modified: entry.updated,
    location: 'personal' as StorageLocation,
    metadata: entry.metadata,
  }));
}

export async function getCloudModifiedDate(
  _token: string,
  name: string,
  _location: StorageLocation
): Promise<string | null> {
  const syncState = await db.syncState.get(name);
  if (!syncState?.cloudId) return null;
  const meta = await wrapBlobCall(() => loadBlobMetadata(syncState.cloudId));
  return meta?.updated ?? null;
}

export async function saveSidecarToCloud(
  _token: string,
  _meta: ProjectMetadata,
  _name: string,
  _location: StorageLocation
): Promise<void> {
  // No-op: metadata is written atomically alongside analysis in saveBlobProject
}

export async function loadSidecarFromCloud(
  _token: string,
  _name: string,
  _location: StorageLocation
): Promise<ProjectMetadata | null> {
  // No-op: metadata is part of the metadata blob, read via loadBlobMetadata
  return null;
}

export async function downloadFileFromGraph(
  _endpoint: string,
  _driveId: string,
  _itemId: string
): Promise<File> {
  throw new CloudSyncUnavailableError('downloadFileFromGraph not applicable to Blob Storage');
}

export async function saveToCustomLocation(
  _driveId: string,
  _folderId: string,
  _fileName: string,
  _data: string | Blob
): Promise<{ webUrl: string }> {
  throw new CloudSyncUnavailableError('saveToCustomLocation not applicable to Blob Storage');
}

export async function updateLastViewedAt(
  projectName: string,
  _location: StorageLocation,
  userId: string
): Promise<void> {
  // Update IndexedDB only (lightweight operation, no cloud round-trip)
  try {
    const record = await db.projects.get(projectName);
    if (record) {
      const existingMeta = record.meta;
      const updatedLastViewed = { ...existingMeta?.lastViewedAt, [userId]: Date.now() };
      const newMeta: ProjectMetadata = existingMeta
        ? { ...existingMeta, lastViewedAt: updatedLastViewed }
        : {
            phase: 'frame',
            findingCounts: {},
            questionCounts: {},
            actionCounts: { total: 0, completed: 0, overdue: 0 },
            assignedTaskCount: 0,
            hasOverdueTasks: false,
            lastViewedAt: updatedLastViewed,
          };
      await db.projects.update(projectName, { meta: newMeta });
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[Storage] Failed to update lastViewedAt:', e);
  }
}

export async function ensureFolderExists(_token: string, _apiBase: unknown): Promise<void> {
  // No-op: Blob Storage creates paths implicitly on PUT
}

// ── Sustainment cloud sync ────────────────────────────────────────────────

export async function listSustainmentRecordsFromCloud(
  _token: string,
  hubId: string
): Promise<SustainmentRecord[]> {
  return wrapBlobCall(() => listBlobSustainmentRecords(hubId));
}

export async function saveSustainmentRecordToCloud(
  _token: string,
  record: SustainmentRecord
): Promise<void> {
  const existing = await listSustainmentRecordsFromCloud(_token, record.hubId);
  const next = existing.some(item => item.id === record.id)
    ? existing.map(item => (item.id === record.id ? record : item))
    : [...existing, record];
  await wrapBlobCall(async () => {
    await saveBlobSustainmentRecord(record);
    await updateBlobSustainmentCatalog(record.hubId, next);
  });
}

export async function saveSustainmentReviewToCloud(
  _token: string,
  review: SustainmentReview
): Promise<void> {
  await wrapBlobCall(() => saveBlobSustainmentReview(review));
}

export async function saveControlHandoffToCloud(
  _token: string,
  handoff: ControlHandoff
): Promise<void> {
  await wrapBlobCall(() => saveBlobControlHandoff(handoff));
}

// ── Retry constants (used by storage.ts StorageProvider) ───────────────

export const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000]; // ms
export const MAX_RETRY_DELAY = 60000;
export const MAX_RETRIES = 5;
