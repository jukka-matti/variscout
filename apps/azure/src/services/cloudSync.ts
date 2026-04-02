// src/services/cloudSync.ts
// Cloud sync stub — Graph API / OneDrive removed per ADR-059.
// All async operations throw CloudSyncUnavailableError or return safe defaults.
// Blob Storage implementation will replace this in Phase 2.

import type { ProjectMetadata } from '@variscout/core';
import { AuthError } from '../auth/easyAuth';
import { db } from '../db/schema';
import type { Project } from './localDb';

// ── Stub error ─────────────────────────────────────────────────────────

/** Thrown when cloud sync is called before Blob Storage migration (ADR-059 Phase 2). */
export class CloudSyncUnavailableError extends Error {
  constructor(message = 'Cloud sync unavailable — Blob Storage migration pending') {
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

// ── Stubbed async operations ───────────────────────────────────────────

export async function saveToCloud(
  _token: string,
  _project: Project,
  _name: string,
  _location: StorageLocation
): Promise<{ id: string; etag: string }> {
  throw new CloudSyncUnavailableError();
}

export async function loadFromCloud(
  _token: string,
  _name: string,
  _location: StorageLocation
): Promise<Project | null> {
  throw new CloudSyncUnavailableError();
}

export async function listFromCloud(
  _token: string,
  _location: StorageLocation
): Promise<CloudProject[]> {
  return [];
}

export async function getCloudModifiedDate(
  _token: string,
  _name: string,
  _location: StorageLocation
): Promise<string | null> {
  return null;
}

export async function saveSidecarToCloud(
  _token: string,
  _meta: ProjectMetadata,
  _name: string,
  _location: StorageLocation
): Promise<void> {
  // no-op
}

export async function loadSidecarFromCloud(
  _token: string,
  _name: string,
  _location: StorageLocation
): Promise<ProjectMetadata | null> {
  return null;
}

export async function downloadFileFromGraph(
  _endpoint: string,
  _driveId: string,
  _itemId: string
): Promise<File> {
  throw new CloudSyncUnavailableError();
}

export async function saveToCustomLocation(
  _driveId: string,
  _folderId: string,
  _fileName: string,
  _data: string | Blob
): Promise<{ webUrl: string }> {
  throw new CloudSyncUnavailableError();
}

export async function updateLastViewedAt(
  projectName: string,
  _location: StorageLocation,
  userId: string
): Promise<void> {
  // Update IndexedDB only (cloud sidecar unavailable)
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
  throw new CloudSyncUnavailableError();
}

// ── Retry constants (used by storage.ts StorageProvider) ───────────────

export const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000]; // ms
export const MAX_RETRY_DELAY = 60000;
export const MAX_RETRIES = 5;
