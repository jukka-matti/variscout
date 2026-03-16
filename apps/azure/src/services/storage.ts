// src/services/storage.ts
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isLocalDev, AuthError } from '../auth/easyAuth';
import { getGraphToken } from '../auth/graphToken';
import { errorService } from '@variscout/ui';
import { hasTeamFeatures } from '@variscout/core';
import {
  addToSyncQueue,
  getPendingSyncItems,
  removeFromSyncQueue,
  pruneSyncQueue,
  db,
} from '../db/schema';

// Project data is serialized to JSON for IndexedDB/OneDrive — kept as unknown
// because the storage layer is a passthrough that doesn't inspect the shape.
type Project = unknown;

/** Minimal shape returned by Graph API children endpoint */
interface DriveItem {
  id: string;
  name: string;
  lastModifiedDateTime: string;
  lastModifiedBy?: { user?: { displayName?: string } };
  size?: number;
}

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
}

// ── Sync Notifications ──────────────────────────────────────────────────

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
  if (error instanceof AuthError) {
    return { category: 'auth', retryable: false, message: error.message };
  }
  if (error instanceof GraphError) {
    return { category: 'throttle', retryable: true, message: error.message };
  }

  const msg = error instanceof Error ? error.message : String(error);
  const status = extractStatusCode(msg);

  if (status === 401 || status === 403 || /unauthorized|forbidden/i.test(msg)) {
    return { category: 'auth', retryable: false, message: 'Authentication expired' };
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

// ── Graph API errors ────────────────────────────────────────────────────

export class GraphError extends Error {
  retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'GraphError';
    this.retryAfterMs = retryAfterMs;
  }
}

/** Parse the Retry-After header value into milliseconds.
 *  The value can be seconds (integer) or an HTTP date string. */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  // Try as integer seconds first
  const seconds = parseInt(value, 10);
  if (!isNaN(seconds) && String(seconds) === value.trim()) {
    return seconds * 1000;
  }

  // Try as HTTP date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const ms = date.getTime() - Date.now();
    return ms > 0 ? ms : 1000; // at least 1s if date is in the past
  }

  return undefined;
}

/** Perform a Graph API fetch, throwing GraphError with retryAfterMs on 429. */
async function graphFetch(url: string, init: globalThis.RequestInit): Promise<Response> {
  const response = await fetch(url, init);

  if (response.status === 429) {
    const retryAfterMs = parseRetryAfter(response.headers.get('Retry-After'));
    const body = await response.json().catch(() => ({}));
    const message = body.error?.message || `Graph API throttled: 429`;
    throw new GraphError(message, retryAfterMs);
  }

  return response;
}

// ── Graph API base URL ──────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// ── Location-aware API paths ────────────────────────────────────────────

interface ApiBase {
  /** Full path to projects folder, e.g. '/me/drive/root:/VariScout/Projects' */
  filePath: string;
  /** Drive root path, e.g. '/me/drive/root' or '/drives/{driveId}/root' */
  rootPath: string;
}

async function getApiBase(token: string, location: StorageLocation): Promise<ApiBase> {
  if (location === 'personal') {
    return {
      filePath: '/me/drive/root:/VariScout/Projects',
      rootPath: '/me/drive/root',
    };
  }

  // 'team': resolve channel SharePoint drive
  const { getChannelDriveInfo } = await import('./channelDrive');
  const driveInfo = await getChannelDriveInfo(token);
  if (!driveInfo) {
    console.warn('[Storage] Channel drive resolution failed, falling back to personal');
    return {
      filePath: '/me/drive/root:/VariScout/Projects',
      rootPath: '/me/drive/root',
    };
  }

  return {
    filePath: `/drives/${driveInfo.driveId}/root:/VariScout/Projects`,
    rootPath: `/drives/${driveInfo.driveId}/root`,
  };
}

// ── Folder auto-creation ────────────────────────────────────────────────

/** Create /VariScout/Projects/ in the target drive if it doesn't exist yet. Idempotent. */
async function ensureFolderExists(token: string, apiBase: ApiBase): Promise<void> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Create /VariScout (no-op if exists)
  await graphFetch(`${GRAPH_BASE}${apiBase.rootPath}/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'VariScout',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });

  // Create /VariScout/Projects (no-op if exists)
  await graphFetch(`${GRAPH_BASE}${apiBase.rootPath}:/VariScout:/children`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Projects',
      folder: {},
      '@microsoft.graph.conflictBehavior': 'replace',
    }),
  });
}

// ── IndexedDB operations ────────────────────────────────────────────────

async function saveToIndexedDB(project: Project, name: string, location: StorageLocation) {
  await db.projects.put({
    name,
    location,
    modified: new Date(),
    synced: false,
    data: project,
  });
}

async function loadFromIndexedDB(name: string): Promise<Project | null> {
  const record = await db.projects.get(name);
  return record?.data || null;
}

async function listFromIndexedDB(): Promise<CloudProject[]> {
  const records = await db.projects.toArray();
  return records.map(r => ({
    id: r.name,
    name: r.name,
    modified: r.modified?.toISOString() || new Date().toISOString(),
    location: r.location,
  }));
}

// ── Cloud operations ────────────────────────────────────────────────────

const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB — Graph simple upload limit

/** Upload a large file (>4MB) via a Graph upload session.
 *  Uses a single PUT chunk, which covers files up to 60MB (all realistic VariScout files). */
async function saveToCloudLargeFile(
  token: string,
  content: string,
  filePath: string
): Promise<{ id: string; etag: string }> {
  // 1. Create an upload session
  const sessionResponse = await graphFetch(`${GRAPH_BASE}${filePath}:/createUploadSession`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'replace',
      },
    }),
  });

  if (!sessionResponse.ok) {
    const error = await sessionResponse.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Failed to create upload session: ${sessionResponse.status}`
    );
  }

  const session = await sessionResponse.json();
  const uploadUrl = session.uploadUrl;

  // 2. Upload entire content in a single PUT (works for files up to 60MB)
  const contentBytes = new TextEncoder().encode(content);
  const contentLength = contentBytes.byteLength;

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(contentLength),
      'Content-Range': `bytes 0-${contentLength - 1}/${contentLength}`,
    },
    body: contentBytes,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json().catch(() => ({}));
    throw new Error(error.error?.message || `Upload session failed: ${uploadResponse.status}`);
  }

  const data = await uploadResponse.json();
  return {
    id: data.id,
    etag: data.eTag,
  };
}

async function saveToCloud(
  token: string,
  project: Project,
  name: string,
  location: StorageLocation
): Promise<{ id: string; etag: string }> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;
  const content = JSON.stringify(project);

  // Use upload session for files larger than 4MB
  if (new TextEncoder().encode(content).byteLength > LARGE_FILE_THRESHOLD) {
    return saveToCloudLargeFile(token, content, `${apiBase.filePath}/${filename}`);
  }

  const response = await graphFetch(`${GRAPH_BASE}${apiBase.filePath}/${filename}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: content,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Failed to save: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    etag: data.eTag,
  };
}

async function loadFromCloud(
  token: string,
  name: string,
  location: StorageLocation
): Promise<Project | null> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  const response = await graphFetch(`${GRAPH_BASE}${apiBase.filePath}/${filename}:/content`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load: ${response.status}`);
  }

  return response.json();
}

async function listFromCloud(token: string, location: StorageLocation): Promise<CloudProject[]> {
  const apiBase = await getApiBase(token, location);

  const response = await graphFetch(
    `${GRAPH_BASE}${apiBase.filePath}:/children?$filter=file ne null&$select=id,name,lastModifiedDateTime,lastModifiedBy,size`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    // Folder doesn't exist yet — create it for future use
    await ensureFolderExists(token, apiBase).catch(() => {});
    return [];
  }

  if (!response.ok) {
    errorService.logWarning('Failed to list cloud projects', {
      component: 'storage',
      action: 'listFromCloud',
      metadata: { status: response.status },
    });
    return [];
  }

  const data = await response.json();
  return ((data.value || []) as DriveItem[])
    .filter(file => file.name.endsWith('.vrs'))
    .map(file => ({
      id: file.id,
      name: file.name.replace('.vrs', ''),
      modified: file.lastModifiedDateTime,
      modifiedBy: file.lastModifiedBy?.user?.displayName,
      location,
    }));
}

async function markAsSynced(name: string, cloudId: string, etag: string, baseStateJson?: string) {
  const record = await db.projects.get(name);
  if (record) {
    await db.projects.update(name, { synced: true });
    await db.syncState.put({
      name,
      cloudId,
      lastSynced: new Date().toISOString(),
      etag,
      baseStateJson,
    });
  }
}

// ── Conflict detection ──────────────────────────────────────────────────

async function getCloudModifiedDate(
  token: string,
  name: string,
  location: StorageLocation
): Promise<string | null> {
  const apiBase = await getApiBase(token, location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  try {
    const response = await graphFetch(
      `${GRAPH_BASE}${apiBase.filePath}/${filename}?$select=lastModifiedDateTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.lastModifiedDateTime || null;
  } catch (e) {
    console.warn('[Storage] Failed to check cloud modified date:', e);
    return null;
  }
}

// ── Retry with exponential backoff ──────────────────────────────────────

const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000]; // ms, cap 60s per plan
const MAX_RETRY_DELAY = 60000;
const MAX_RETRIES = 5;

// ── StorageProvider Context ─────────────────────────────────────────────

interface StorageContextValue {
  saveProject: (project: Project, name: string, location: StorageLocation) => Promise<void>;
  loadProject: (name: string, location: StorageLocation) => Promise<Project | null>;
  listProjects: () => Promise<CloudProject[]>;
  syncStatus: SyncStatus;
  notifications: SyncNotification[];
  dismissNotification: (id: string) => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return ctx;
}

let notificationCounter = 0;

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'saved',
    message: '',
  });
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Notification helpers ────────────────────────────────────────────

  const addNotification = useCallback((notif: Omit<SyncNotification, 'id'>) => {
    const id = `sync-${++notificationCounter}`;
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }]); // max 5

    if (notif.dismissAfter) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notif.dismissAfter);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Wire errorService to surface user-facing notifications via the storage toast system
  useEffect(() => {
    errorService.setNotificationHandler((message, severity) => {
      addNotification({
        type: severity === 'critical' ? 'error' : severity,
        message,
        dismissAfter: severity === 'error' || severity === 'critical' ? 5000 : 3000,
      });
    });
    return () => errorService.setNotificationHandler(() => {});
  }, [addNotification]);

  // ── Retry queue ─────────────────────────────────────────────────────

  const retryQueue = useRef<
    Array<{
      project: Project;
      name: string;
      location: StorageLocation;
      attempt: number;
    }>
  >([]);

  const isSyncingRef = useRef(false);

  const processRetryQueue = useCallback(async () => {
    if (retryQueue.current.length === 0) return;
    if (!navigator.onLine) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    const item = retryQueue.current[0];
    try {
      const token = await getGraphToken();
      const { id, etag } = await saveToCloud(token, item.project, item.name, item.location);
      await markAsSynced(item.name, id, etag);
      await removeFromSyncQueue(item.name);
      retryQueue.current.shift();

      if (retryQueue.current.length === 0) {
        setSyncStatus({ status: 'synced', message: 'All changes synced', lastSynced: new Date() });
        addNotification({
          type: 'success',
          message: 'Sync recovered successfully',
          dismissAfter: 3000,
        });
      } else {
        // Process next item
        const delay = Math.min(RETRY_DELAYS[0], MAX_RETRY_DELAY);
        retryTimerRef.current = setTimeout(processRetryQueue, delay);
      }
    } catch (error) {
      const classified = classifySyncError(error);
      if (!classified.retryable || item.attempt >= MAX_RETRIES) {
        // Give up on this item
        retryQueue.current.shift();
        if (classified.category === 'auth') {
          setSyncStatus({ status: 'error', message: 'Authentication expired' });
          addNotification({
            type: 'error',
            message: 'Session expired. Please sign in again.',
            action: {
              label: 'Sign in',
              onClick: () => {
                window.location.href = '/.auth/login/aad';
              },
            },
          });
          retryQueue.current = []; // Stop all retries on auth failure
          return;
        }
      } else {
        item.attempt++;
        // Use server-specified Retry-After if available, otherwise exponential backoff
        const serverDelay =
          error instanceof GraphError && error.retryAfterMs ? error.retryAfterMs : undefined;
        const delayIdx = Math.min(item.attempt - 1, RETRY_DELAYS.length - 1);
        const delay = Math.min(serverDelay ?? RETRY_DELAYS[delayIdx], MAX_RETRY_DELAY);
        retryTimerRef.current = setTimeout(processRetryQueue, delay);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [addNotification]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // ── Save project (offline-first, with optimistic merge) ────────────

  const saveProject = useCallback(
    async (project: Project, name: string, location: StorageLocation) => {
      // Always save to IndexedDB first (instant feedback)
      try {
        await saveToIndexedDB(project, name, location);
      } catch (dbError) {
        const isQuota = dbError instanceof DOMException && dbError.name === 'QuotaExceededError';
        const message = isQuota
          ? 'Storage quota exceeded. Delete old projects to free space.'
          : 'Local save failed. Your data may not be persisted.';
        setSyncStatus({ status: 'error', message });
        addNotification({ type: 'error', message, dismissAfter: isQuota ? 10000 : 5000 });
        return; // Do not attempt cloud sync if local save failed
      }

      // Standard plan: local-only storage, no cloud sync
      if (!hasTeamFeatures()) {
        setSyncStatus({ status: 'saved', message: 'Saved locally' });
        return;
      }

      if (!navigator.onLine) {
        await addToSyncQueue({ project, name, location });
        setSyncStatus({
          status: 'offline',
          message: 'Saved offline, will sync when connected',
        });
        addNotification({
          type: 'info',
          message: 'Saved offline, will sync when connected',
          dismissAfter: 3000,
        });
        return;
      }

      // Online: sync immediately (with merge if needed)
      try {
        setSyncStatus({ status: 'syncing', message: 'Saving to cloud...' });

        const token = await getGraphToken();
        let projectToSave = project;
        let baseStateForSync: string | undefined;

        // Check if we need to merge
        const syncState = await db.syncState.get(name);
        if (syncState?.baseStateJson) {
          const cloudModified = await getCloudModifiedDate(token, name, location);
          if (cloudModified && cloudModified !== syncState.lastSynced) {
            // Cloud has changed since our last load — merge
            const remoteProject = await loadFromCloud(token, name, location);
            if (remoteProject) {
              const { mergeAnalysisState } = await import('./merge');
              const base = JSON.parse(syncState.baseStateJson);
              const result = mergeAnalysisState(base, project as never, remoteProject as never);

              if (result.hasConflict) {
                // Save conflict copy
                const conflictName = `${name} (conflict copy)`;
                await saveToCloud(token, project, conflictName, location);
                addNotification({
                  type: 'warning',
                  message: `Merge conflict detected. Your version saved as "${conflictName}".`,
                  dismissAfter: 8000,
                });
              }

              projectToSave = result.merged as Project;
              // Update IndexedDB with merged result
              await saveToIndexedDB(projectToSave, name, location);
            }
          }
        }

        const { id, etag } = await saveToCloud(token, projectToSave, name, location);
        baseStateForSync = JSON.stringify(projectToSave);

        await markAsSynced(name, id, etag, baseStateForSync);
        setSyncStatus({
          status: 'synced',
          message: 'Saved to cloud',
          lastSynced: new Date(),
        });
        addNotification({ type: 'success', message: 'Saved to cloud', dismissAfter: 3000 });
      } catch (error) {
        console.error('Cloud save failed:', error);
        const classified = classifySyncError(error);

        await addToSyncQueue({ project, name, location });

        if (classified.category === 'auth') {
          setSyncStatus({ status: 'error', message: 'Authentication expired' });
          addNotification({
            type: 'error',
            message: 'Session expired. Please sign in again.',
            action: {
              label: 'Sign in',
              onClick: () => {
                window.location.href = '/.auth/login/aad';
              },
            },
          });
        } else if (classified.retryable) {
          setSyncStatus({
            status: 'offline',
            message: classified.message,
          });
          // Queue for retry with backoff
          retryQueue.current.push({ project, name, location, attempt: 1 });
          const delay = RETRY_DELAYS[0];
          retryTimerRef.current = setTimeout(processRetryQueue, delay);
          addNotification({ type: 'warning', message: classified.message, dismissAfter: 5000 });
        } else {
          setSyncStatus({
            status: 'offline',
            message: 'Save failed, will retry when connected',
          });
        }
      }
    },
    [addNotification, processRetryQueue]
  );

  // ── Load project (cloud first if online, with conflict detection) ───

  const loadProject = useCallback(
    async (name: string, location: StorageLocation): Promise<Project | null> => {
      // Standard plan: local-only storage
      if (!hasTeamFeatures()) {
        return loadFromIndexedDB(name);
      }

      if (navigator.onLine) {
        try {
          const token = await getGraphToken();

          // Conflict detection: check if local has unsynced changes AND cloud is newer
          const localRecord = await db.projects.get(name);
          if (localRecord && !localRecord.synced) {
            const cloudModified = await getCloudModifiedDate(token, name, location);
            if (cloudModified && localRecord.modified) {
              const cloudTime = new Date(cloudModified).getTime();
              const localTime = localRecord.modified.getTime();
              if (cloudTime > localTime) {
                setSyncStatus({
                  status: 'conflict',
                  message: 'Cloud version is newer, local changes may be lost',
                });
                addNotification({
                  type: 'warning',
                  message:
                    'Conflict: Cloud version loaded. Local unsynced changes were overwritten.',
                  dismissAfter: 8000,
                });
              }
            }
          }

          const project = await loadFromCloud(token, name, location);
          if (project) {
            // Cache locally
            await saveToIndexedDB(project, name, location);

            // Store as merge base for future three-way merge
            const existingSyncState = await db.syncState.get(name);
            if (existingSyncState) {
              await db.syncState.update(name, {
                baseStateJson: JSON.stringify(project),
              });
            }

            return project;
          }
        } catch (error) {
          errorService.logWarning('Cloud load failed, falling back to local', {
            component: 'storage',
            action: 'loadProject',
            metadata: { error: error instanceof Error ? error.message : String(error) },
          });
        }
      }

      // Fallback to local
      return loadFromIndexedDB(name);
    },
    [addNotification]
  );

  // ── List all projects (merge local and cloud) ─────────────────────

  const listProjects = useCallback(async (): Promise<CloudProject[]> => {
    const localProjects = await listFromIndexedDB();

    // Standard plan: local-only storage, no cloud merge
    if (!hasTeamFeatures()) {
      return localProjects;
    }

    if (!navigator.onLine || isLocalDev()) {
      return localProjects;
    }

    try {
      const token = await getGraphToken();
      const personalProjects = await listFromCloud(token, 'personal').catch(() => []);

      // In a channel tab with team plan, also list channel projects
      let teamProjects: CloudProject[] = [];
      const { isChannelTab } = await import('../teams/teamsContext');
      const { hasTeamFeatures } = await import('@variscout/core');
      if (isChannelTab() && hasTeamFeatures()) {
        teamProjects = await listFromCloud(token, 'team').catch(() => []);
      }

      // Merge: use location:name as key to avoid name collisions across locations
      const projectMap = new Map<string, CloudProject>();
      teamProjects.forEach(p => projectMap.set(`team:${p.name}`, p));
      personalProjects.forEach(p => projectMap.set(`personal:${p.name}`, p));
      localProjects.forEach(p => {
        const key = `${p.location}:${p.name}`;
        if (!projectMap.has(key)) {
          projectMap.set(key, { ...p, modifiedBy: 'Local' });
        }
      });

      return Array.from(projectMap.values()).sort(
        (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
    } catch (error) {
      errorService.logWarning('Failed to list cloud projects', {
        component: 'storage',
        action: 'listProjects',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      return localProjects;
    }
  }, []);

  // ── Background sync when coming online ────────────────────────────

  useEffect(() => {
    const handleOnline = async () => {
      // Standard plan: no background cloud sync
      if (!hasTeamFeatures()) return;
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      const pending = await getPendingSyncItems();

      if (pending.length === 0) {
        isSyncingRef.current = false;
        return;
      }

      try {
        setSyncStatus({
          status: 'syncing',
          message: `Syncing ${pending.length} items...`,
          pendingChanges: pending.length,
        });
        addNotification({
          type: 'info',
          message: `Back online, syncing ${pending.length} items...`,
          dismissAfter: 3000,
        });

        try {
          const token = await getGraphToken();
          for (const item of pending) {
            try {
              const { id, etag } = await saveToCloud(token, item.project, item.name, item.location);
              await markAsSynced(item.name, id, etag);
              await removeFromSyncQueue(item.name);
            } catch (error) {
              const classified = classifySyncError(error);
              if (classified.category === 'auth') {
                addNotification({
                  type: 'error',
                  message: 'Session expired during sync. Please sign in again.',
                  action: {
                    label: 'Sign in',
                    onClick: () => {
                      window.location.href = '/.auth/login/aad';
                    },
                  },
                });
                break; // Stop syncing on auth failure
              }
              console.error('Sync failed for:', item.name, error);
            }
          }
        } catch (e) {
          const classified = classifySyncError(e);
          if (classified.category === 'auth') {
            addNotification({
              type: 'error',
              message: 'Session expired. Please sign in again.',
              action: {
                label: 'Sign in',
                onClick: () => {
                  window.location.href = '/.auth/login/aad';
                },
              },
            });
          } else {
            console.error('Auth failed during sync', e);
          }
        }

        const remaining = await getPendingSyncItems();
        if (remaining.length === 0) {
          setSyncStatus({
            status: 'synced',
            message: 'All changes synced',
            lastSynced: new Date(),
          });
          addNotification({ type: 'success', message: 'All changes synced', dismissAfter: 3000 });
        } else {
          setSyncStatus({
            status: 'offline',
            message: `${remaining.length} items pending sync`,
            pendingChanges: remaining.length,
          });
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    window.addEventListener('online', handleOnline);

    // Prune stale queue items on mount, then sync if online
    pruneSyncQueue().catch(() => {});
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [addNotification]);

  const value: StorageContextValue = {
    saveProject,
    loadProject,
    listProjects,
    syncStatus,
    notifications,
    dismissNotification,
  };

  return React.createElement(StorageContext.Provider, { value }, children);
};
