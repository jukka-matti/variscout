// src/services/storage.ts
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getAccessToken, isLocalDev, AuthError } from '../auth/easyAuth';
import { errorService } from '@variscout/ui';
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

export type SyncErrorCategory = 'auth' | 'network' | 'throttle' | 'server' | 'unknown';

export interface ClassifiedError {
  category: SyncErrorCategory;
  retryable: boolean;
  message: string;
}

export function classifySyncError(error: unknown): ClassifiedError {
  if (error instanceof AuthError) {
    return { category: 'auth', retryable: false, message: error.message };
  }

  const msg = error instanceof Error ? error.message : String(error);
  const status = extractStatusCode(msg);

  if (status === 401 || status === 403 || /unauthorized|forbidden/i.test(msg)) {
    return { category: 'auth', retryable: false, message: 'Authentication expired' };
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

// ── Graph API base URL ──────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// Get the appropriate API path — location reserved for future SharePoint support
function getApiPath(_location: StorageLocation): string {
  return '/me/drive/root:/VariScout/Projects';
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

async function saveToCloud(
  token: string,
  project: Project,
  name: string,
  location: StorageLocation
): Promise<{ id: string; etag: string }> {
  const basePath = getApiPath(location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  const response = await fetch(`${GRAPH_BASE}${basePath}/${filename}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
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
  const basePath = getApiPath(location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  const response = await fetch(`${GRAPH_BASE}${basePath}/${filename}:/content`, {
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
  const basePath = getApiPath(location);

  const response = await fetch(
    `${GRAPH_BASE}${basePath}:/children?$filter=file ne null&$select=id,name,lastModifiedDateTime,lastModifiedBy,size`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

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

async function markAsSynced(name: string, cloudId: string, etag: string) {
  const record = await db.projects.get(name);
  if (record) {
    await db.projects.update(name, { synced: true });
    await db.syncState.put({
      name,
      cloudId,
      lastSynced: new Date().toISOString(),
      etag,
    });
  }
}

// ── Conflict detection ──────────────────────────────────────────────────

async function getCloudModifiedDate(
  token: string,
  name: string,
  location: StorageLocation
): Promise<string | null> {
  const basePath = getApiPath(location);
  const filename = name.endsWith('.vrs') ? name : `${name}.vrs`;

  try {
    const response = await fetch(
      `${GRAPH_BASE}${basePath}/${filename}?$select=lastModifiedDateTime`,
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

  // ── Retry queue ─────────────────────────────────────────────────────

  const retryQueue = useRef<
    Array<{
      project: Project;
      name: string;
      location: StorageLocation;
      attempt: number;
    }>
  >([]);

  const processRetryQueue = useCallback(async () => {
    if (retryQueue.current.length === 0) return;
    if (!navigator.onLine) return;

    const item = retryQueue.current[0];
    try {
      const token = await getAccessToken();
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
        const delayIdx = Math.min(item.attempt - 1, RETRY_DELAYS.length - 1);
        const delay = Math.min(RETRY_DELAYS[delayIdx], MAX_RETRY_DELAY);
        retryTimerRef.current = setTimeout(processRetryQueue, delay);
      }
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

  // ── Save project (offline-first) ───────────────────────────────────

  const saveProject = useCallback(
    async (project: Project, name: string, location: StorageLocation) => {
      // Always save to IndexedDB first (instant feedback)
      await saveToIndexedDB(project, name, location);

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

      // Online: sync immediately
      try {
        setSyncStatus({ status: 'syncing', message: 'Saving to cloud...' });

        const token = await getAccessToken();
        const { id, etag } = await saveToCloud(token, project, name, location);

        await markAsSynced(name, id, etag);
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
      if (navigator.onLine) {
        try {
          const token = await getAccessToken();

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

    if (!navigator.onLine || isLocalDev()) {
      return localProjects;
    }

    try {
      const token = await getAccessToken();
      const personalProjects = await listFromCloud(token, 'personal').catch(() => []);

      const cloudProjectMap = new Map<string, CloudProject>();
      personalProjects.forEach(p => {
        cloudProjectMap.set(p.name, p);
      });

      localProjects.forEach(p => {
        if (!cloudProjectMap.has(p.name)) {
          cloudProjectMap.set(p.name, { ...p, modifiedBy: 'Local' });
        }
      });

      return Array.from(cloudProjectMap.values()).sort(
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
      const pending = await getPendingSyncItems();

      if (pending.length === 0) return;

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
        const token = await getAccessToken();
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
