// src/services/storage.ts
// Thin orchestrator: React Context (StorageProvider) that bridges localDb and cloudSync.
// Re-exports all public types/functions for backwards compatibility.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getEasyAuthUser, isLocalDev } from '../auth/easyAuth';
import { errorService } from '@variscout/ui';
import type {
  EvidenceSnapshot,
  EvidenceSource,
  ProcessHub,
  ControlRecord,
  ControlReview,
  ControlHandoff,
} from '@variscout/core';
import {
  addToSyncQueue,
  getPendingSyncItems,
  removeFromSyncQueue,
  pruneSyncQueue,
  db,
} from '../db/schema';

// ── Re-exports for backwards compatibility ──────────────────────────────

export type {
  StorageLocation,
  SyncStatus,
  CloudProject,
  SyncNotification,
  SyncErrorCategory,
  ClassifiedError,
} from './cloudSync';

export {
  classifySyncError,
  downloadFileFromGraph,
  saveToCustomLocation,
  updateLastViewedAt,
  GraphError,
  CloudSyncUnavailableError,
  ProjectDocumentConflictError,
} from './cloudSync';

// Internal imports (not re-exported)
import type { StorageLocation, SyncStatus, SyncNotification, CloudProject } from './cloudSync';
import {
  classifySyncError,
  CloudSyncUnavailableError as CloudSyncUnavailableErrorClass,
  ProjectDocumentConflictError as ProjectDocumentConflictErrorClass,
  GraphError as GraphErrorClass,
  saveToCloud,
  loadFromCloud,
  listFromCloud,
  getCloudModifiedDate,
  saveSidecarToCloud,
  listProcessHubsFromCloud,
  saveProcessHubToCloud,
  listEvidenceSourcesFromCloud,
  listEvidenceSnapshotsFromCloud,
  saveEvidenceSourceToCloud,
  saveEvidenceSnapshotToCloud,
  listControlRecordsFromCloud,
  saveControlRecordToCloud,
  saveControlReviewToCloud,
  saveControlHandoffToCloud,
  RETRY_DELAYS,
  MAX_RETRY_DELAY,
  MAX_RETRIES,
} from './cloudSync';
import type { Project } from './localDb';
import {
  saveToIndexedDB,
  loadFromIndexedDB,
  listFromIndexedDB,
  markAsSynced,
  extractDocumentAccess,
  extractMetadataInputs,
  listProcessHubsFromIndexedDB,
  saveProcessHubToIndexedDB,
  ensureDefaultProcessHubInIndexedDB,
  listEvidenceSourcesFromIndexedDB,
  listEvidenceSnapshotsFromIndexedDB,
  saveEvidenceSourceToIndexedDB,
  saveEvidenceSnapshotToIndexedDB,
  listControlRecordsFromIndexedDB,
  saveControlRecordToIndexedDB,
  listControlReviewsFromIndexedDB,
  saveControlReviewToIndexedDB,
  listControlHandoffsFromIndexedDB,
  saveControlHandoffToIndexedDB,
  recomputeSustainmentProjectionForRecord,
} from './localDb';
import { azureHubRepository } from '../persistence';

// ── StorageProvider Context ─────────────────────────────────────────────

interface StorageContextValue {
  saveProject: (project: Project, name: string, location: StorageLocation) => Promise<void>;
  loadProject: (name: string, location: StorageLocation) => Promise<Project | null>;
  listProjects: () => Promise<CloudProject[]>;
  listProcessHubs: () => Promise<ProcessHub[]>;
  saveProcessHub: (hub: ProcessHub) => Promise<void>;
  listEvidenceSources: (hubId: string) => Promise<EvidenceSource[]>;
  saveEvidenceSource: (source: EvidenceSource) => Promise<void>;
  listEvidenceSnapshots: (hubId: string, sourceId: string) => Promise<EvidenceSnapshot[]>;
  saveEvidenceSnapshot: (snapshot: EvidenceSnapshot, sourceCsv?: string) => Promise<void>;
  listControlRecords: (hubId: string) => Promise<ControlRecord[]>;
  saveControlRecord: (record: ControlRecord) => Promise<void>;
  listControlReviews: (recordId: string) => Promise<ControlReview[]>;
  saveControlReview: (review: ControlReview) => Promise<void>;
  listControlHandoffs: (hubId: string) => Promise<ControlHandoff[]>;
  saveControlHandoff: (handoff: ControlHandoff) => Promise<void>;
  syncStatus: SyncStatus;
  notifications: SyncNotification[];
  dismissNotification: (id: string) => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);
const STORAGE_API_BOUNDARY = 'server-storage-api';

function isForbiddenCloudRead(error: unknown): boolean {
  return classifySyncError(error).category === 'forbidden';
}

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
  const processRetryQueueRef = useRef<() => Promise<void>>(async () => {});

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

  const scheduleRetry = useCallback((delay: number) => {
    retryTimerRef.current = setTimeout(() => {
      void processRetryQueueRef.current();
    }, delay);
  }, []);

  const processRetryQueue = useCallback(async () => {
    if (retryQueue.current.length === 0) return;
    if (!navigator.onLine) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    const item = retryQueue.current[0];
    try {
      const token = STORAGE_API_BOUNDARY;
      const user = await getEasyAuthUser().catch(() => null);
      const userId = user?.userId || user?.email || 'local';
      const meta = extractMetadataInputs(item.project, userId) ?? undefined;
      const access = extractDocumentAccess(item.project, userId);
      const { id, etag } = await saveToCloud(
        token,
        item.project,
        item.name,
        item.location,
        meta,
        access
      );
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
        scheduleRetry(delay);
      }
    } catch (error) {
      if (error instanceof CloudSyncUnavailableErrorClass) {
        // Cloud sync not yet available — clear queue, don't retry
        retryQueue.current = [];
        return;
      }
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
          error instanceof GraphErrorClass && error.retryAfterMs ? error.retryAfterMs : undefined;
        const delayIdx = Math.min(item.attempt - 1, RETRY_DELAYS.length - 1);
        const delay = Math.min(serverDelay ?? RETRY_DELAYS[delayIdx], MAX_RETRY_DELAY);
        scheduleRetry(delay);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [addNotification, scheduleRetry]);

  useEffect(() => {
    processRetryQueueRef.current = processRetryQueue;
  }, [processRetryQueue]);

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
      // Build lightweight metadata for portfolio view
      const user = await getEasyAuthUser().catch(() => null);
      const userId = user?.userId || user?.email || 'local';
      // Read existing lastViewedAt so we preserve it across saves
      const existingRecord = await db.projects.get(name).catch(() => null);
      const existingLastViewed = existingRecord?.meta?.lastViewedAt;
      const meta = extractMetadataInputs(project, userId, existingLastViewed) ?? undefined;

      // Always save to IndexedDB first (instant feedback)
      try {
        await saveToIndexedDB(project, name, location, meta, userId);
      } catch (dbError) {
        const isQuota = dbError instanceof DOMException && dbError.name === 'QuotaExceededError';
        const message = isQuota
          ? 'Storage quota exceeded. Delete old projects to free space.'
          : 'Local save failed. Your data may not be persisted.';
        setSyncStatus({ status: 'error', message });
        addNotification({ type: 'error', message, dismissAfter: isQuota ? 10000 : 5000 });
        return; // Do not attempt cloud sync if local save failed
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

      const token = STORAGE_API_BOUNDARY;

      // Online: sync immediately (with conflict detection if needed)
      try {
        setSyncStatus({ status: 'syncing', message: 'Saving to cloud...' });

        let baseStateForSync: string | undefined;
        const access = extractDocumentAccess(project, userId);

        // Check if the remote document changed since our last sync. R6c no longer
        // attempts field-level payload merging; preserve the local
        // document as a conflict copy and let the current save win.
        const syncState = await db.syncState.get(name);
        if (syncState?.baseStateJson) {
          const cloudModified = await getCloudModifiedDate(token, name, location);
          if (cloudModified && cloudModified !== syncState.lastSynced) {
            const remoteProject = (await loadFromCloud(token, name, location))?.project ?? null;
            if (remoteProject) {
              const conflictName = `${name} (conflict copy)`;
              await saveToCloud(token, project, conflictName, location, meta, access);
              addNotification({
                type: 'warning',
                message: `Cloud copy changed. Saved your version as "${conflictName}".`,
                dismissAfter: 8000,
              });
            }
          }
        }

        const { id, etag } = await saveToCloud(token, project, name, location, meta, access);
        baseStateForSync = JSON.stringify(project);

        // Fire-and-forget: write metadata sidecar alongside .vrs
        const sidecarMeta = extractMetadataInputs(project, userId, existingLastViewed);
        if (sidecarMeta) {
          saveSidecarToCloud(token, sidecarMeta, name, location).catch(e => {
            if (import.meta.env.DEV) console.warn('[Storage] Sidecar write failed:', e);
          });
        }

        await markAsSynced(name, id, etag, baseStateForSync);
        setSyncStatus({
          status: 'synced',
          message: 'Saved to cloud',
          lastSynced: new Date(),
        });
        addNotification({ type: 'success', message: 'Saved to cloud', dismissAfter: 3000 });
      } catch (error) {
        if (error instanceof ProjectDocumentConflictErrorClass) {
          const conflictName = `${name} (conflict copy)`;
          await saveToCloud(
            token,
            project,
            conflictName,
            location,
            meta,
            extractDocumentAccess(project, userId)
          );
          setSyncStatus({ status: 'conflict', message: 'Cloud version changed' });
          addNotification({
            type: 'warning',
            message: `Cloud copy changed. Saved your version as "${conflictName}".`,
            dismissAfter: 8000,
          });
          return;
        }
        if (error instanceof CloudSyncUnavailableErrorClass) {
          // Cloud sync not yet available (ADR-059 Phase 2 pending)
          setSyncStatus({ status: 'saved', message: 'Saved locally' });
          addNotification({
            type: 'info',
            message: 'Cloud sync unavailable — Blob Storage migration pending. Data saved locally.',
            dismissAfter: 5000,
          });
          return;
        }

        if (import.meta.env.DEV) console.error('Cloud save failed:', error);
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
          scheduleRetry(delay);
          addNotification({ type: 'warning', message: classified.message, dismissAfter: 5000 });
        } else {
          setSyncStatus({
            status: 'offline',
            message: 'Save failed, will retry when connected',
          });
        }
      }
    },
    [addNotification, scheduleRetry]
  );

  // ── Load project (cloud first if online, with conflict detection) ───

  const loadProject = useCallback(
    async (name: string, location: StorageLocation): Promise<Project | null> => {
      if (navigator.onLine) {
        try {
          const token = STORAGE_API_BOUNDARY;
          const user = await getEasyAuthUser().catch(() => null);
          const userId = user?.userId || user?.email || 'local';

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

          const loaded = await loadFromCloud(token, name, location);
          if (loaded) {
            const { project, etag } = loaded;
            // Cache locally
            const meta = extractMetadataInputs(project, userId) ?? undefined;
            await saveToIndexedDB(project, name, location, meta, userId);

            // Adopting the cloud copy: refresh the merge base AND the ETag —
            // the stored ETag is the If-Match basis for the next save (PO-8b).
            const existingSyncState = await db.syncState.get(name);
            if (existingSyncState) {
              await db.syncState.update(name, {
                baseStateJson: JSON.stringify(project),
                ...(etag ? { etag, lastSynced: new Date().toISOString() } : {}),
              });
            }

            return project;
          }
        } catch (error) {
          if (isForbiddenCloudRead(error)) {
            return null;
          }
          if (!(error instanceof CloudSyncUnavailableErrorClass)) {
            errorService.logWarning('Cloud load failed, falling back to local', {
              component: 'storage',
              action: 'loadProject',
              metadata: { error: error instanceof Error ? error.message : String(error) },
            });
          }
        }
      }

      // Fallback to local
      return loadFromIndexedDB(name);
    },
    [addNotification]
  );

  // ── List all projects (merge local and cloud) ─────────────────────

  const listProjects = useCallback(async (): Promise<CloudProject[]> => {
    const user = await getEasyAuthUser().catch(() => null);
    const userId = user?.userId || user?.email || 'local';
    const localProjects = await listFromIndexedDB(userId);

    if (!navigator.onLine || isLocalDev()) {
      return localProjects;
    }

    try {
      const token = STORAGE_API_BOUNDARY;
      const personalProjects = await listFromCloud(token, 'personal', userId);

      // Merge: use location:name as key to avoid name collisions across locations
      const projectMap = new Map<string, CloudProject>();
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
      if (error instanceof CloudSyncUnavailableErrorClass) {
        // Cloud sync not yet available (ADR-059 Phase 2 pending)
        return localProjects;
      }
      if (isForbiddenCloudRead(error)) {
        return [];
      }
      errorService.logWarning('Failed to list cloud projects', {
        component: 'storage',
        action: 'listProjects',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      return localProjects;
    }
  }, []);

  // ── Process Hub catalog ───────────────────────────────────────────

  const listProcessHubs = useCallback(async (): Promise<ProcessHub[]> => {
    const localHubs = await listProcessHubsFromIndexedDB();

    if (!navigator.onLine || isLocalDev()) {
      return localHubs;
    }

    try {
      const cloudHubs = await listProcessHubsFromCloud(STORAGE_API_BOUNDARY);
      // Bootstrap cache-fill from cloud — direct write is intentional; HUB_PERSIST_SNAPSHOT is for user save paths. F3 may unify under HubAction.
      for (const hub of cloudHubs) {
        await saveProcessHubToIndexedDB(hub);
      }
      return listProcessHubsFromIndexedDB();
    } catch (error) {
      if (isForbiddenCloudRead(error)) {
        return [];
      }
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to list process hubs from cloud', {
          component: 'storage',
          action: 'listProcessHubs',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
      return localHubs;
    }
  }, []);

  const saveProcessHub = useCallback(async (hub: ProcessHub): Promise<void> => {
    await ensureDefaultProcessHubInIndexedDB();
    // Route IndexedDB write through azureHubRepository.dispatch (F1+F2 P6).
    await azureHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    if (!navigator.onLine || isLocalDev()) {
      return;
    }

    try {
      await saveProcessHubToCloud(STORAGE_API_BOUNDARY, hub);
    } catch (error) {
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to save process hub to cloud', {
          component: 'storage',
          action: 'saveProcessHub',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }, []);

  const listEvidenceSources = useCallback(async (hubId: string): Promise<EvidenceSource[]> => {
    const localSources = await listEvidenceSourcesFromIndexedDB(hubId);

    if (!navigator.onLine || isLocalDev()) {
      return localSources;
    }

    try {
      const cloudSources = await listEvidenceSourcesFromCloud(STORAGE_API_BOUNDARY, hubId);
      for (const source of cloudSources) {
        await saveEvidenceSourceToIndexedDB(source);
      }
      return listEvidenceSourcesFromIndexedDB(hubId);
    } catch (error) {
      if (isForbiddenCloudRead(error)) {
        return [];
      }
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to list evidence sources from cloud', {
          component: 'storage',
          action: 'listEvidenceSources',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
      return localSources;
    }
  }, []);

  const saveEvidenceSource = useCallback(async (source: EvidenceSource): Promise<void> => {
    // Route IndexedDB write through azureHubRepository.dispatch (F1+F2 P6).
    await azureHubRepository.dispatch({ kind: 'EVIDENCE_SOURCE_ADD', hubId: source.hubId, source });

    if (!navigator.onLine || isLocalDev()) {
      return;
    }

    try {
      await saveEvidenceSourceToCloud(STORAGE_API_BOUNDARY, source);
    } catch (error) {
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to save evidence source to cloud', {
          component: 'storage',
          action: 'saveEvidenceSource',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }, []);

  const listEvidenceSnapshots = useCallback(
    async (hubId: string, sourceId: string): Promise<EvidenceSnapshot[]> => {
      const localSnapshots = await listEvidenceSnapshotsFromIndexedDB(hubId, sourceId);

      if (!navigator.onLine || isLocalDev()) {
        return localSnapshots;
      }

      try {
        const cloudSnapshots = await listEvidenceSnapshotsFromCloud(
          STORAGE_API_BOUNDARY,
          hubId,
          sourceId
        );
        for (const snapshot of cloudSnapshots) {
          await saveEvidenceSnapshotToIndexedDB(snapshot);
        }
        return listEvidenceSnapshotsFromIndexedDB(hubId, sourceId);
      } catch (error) {
        if (isForbiddenCloudRead(error)) {
          return [];
        }
        if (!(error instanceof CloudSyncUnavailableErrorClass)) {
          errorService.logWarning('Failed to list evidence snapshots from cloud', {
            component: 'storage',
            action: 'listEvidenceSnapshots',
            metadata: { error: error instanceof Error ? error.message : String(error) },
          });
        }
        return localSnapshots;
      }
    },
    []
  );

  const saveEvidenceSnapshot = useCallback(
    async (snapshot: EvidenceSnapshot, sourceCsv?: string): Promise<void> => {
      /**
       * Envelope shape (F3.6-β D1 / ADR-077 amendment 2026-05-07):
       *   snapshot.provenance?: RowProvenanceTag[]
       * The field rides inline with the snapshot blob through the full write path:
       *   dispatch (IndexedDB) → saveEvidenceSnapshotToCloud → saveBlobEvidenceSnapshot
       *   → putJsonBlob → JSON.stringify(snapshot) → Blob Storage PUT.
       * No replacer is applied; provenance is preserved end-to-end without extra mediation.
       * The dispatch action carries provenance:[] because the storage facade operates at
       * snapshot granularity — row-level tags are already embedded in snapshot.provenance.
       */
      await azureHubRepository.dispatch({
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: snapshot.hubId,
        snapshot,
        provenance: [],
      });

      if (!navigator.onLine || isLocalDev()) {
        return;
      }

      try {
        await saveEvidenceSnapshotToCloud(STORAGE_API_BOUNDARY, snapshot, sourceCsv);
      } catch (error) {
        if (!(error instanceof CloudSyncUnavailableErrorClass)) {
          errorService.logWarning('Failed to save evidence snapshot to cloud', {
            component: 'storage',
            action: 'saveEvidenceSnapshot',
            metadata: { error: error instanceof Error ? error.message : String(error) },
          });
        }
      }
    },
    []
  );

  const listControlRecords = useCallback(async (hubId: string): Promise<ControlRecord[]> => {
    const localRecords = await listControlRecordsFromIndexedDB(hubId);

    if (!navigator.onLine || isLocalDev()) {
      return localRecords;
    }

    try {
      const cloudRecords = await listControlRecordsFromCloud(STORAGE_API_BOUNDARY, hubId);
      for (const record of cloudRecords) {
        await saveControlRecordToIndexedDB(record);
      }
      return listControlRecordsFromIndexedDB(hubId);
    } catch (error) {
      if (isForbiddenCloudRead(error)) {
        return [];
      }
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to list sustainment records from cloud', {
          component: 'storage',
          action: 'listControlRecords',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
      return localRecords;
    }
  }, []);

  const saveControlRecord = useCallback(async (record: ControlRecord): Promise<void> => {
    await saveControlRecordToIndexedDB(record);

    if (navigator.onLine && !isLocalDev()) {
      try {
        await saveControlRecordToCloud(STORAGE_API_BOUNDARY, record);
      } catch (error) {
        if (!(error instanceof CloudSyncUnavailableErrorClass)) {
          errorService.logWarning('Failed to save sustainment record to cloud', {
            component: 'storage',
            action: 'saveControlRecord',
            metadata: { error: error instanceof Error ? error.message : String(error) },
          });
        }
      }
    }

    await recomputeSustainmentProjectionForRecord(record);
  }, []);

  const listControlReviews = useCallback(
    (recordId: string): Promise<ControlReview[]> => listControlReviewsFromIndexedDB(recordId),
    []
  );

  const saveControlReview = useCallback(async (review: ControlReview): Promise<void> => {
    await saveControlReviewToIndexedDB(review);

    if (!navigator.onLine || isLocalDev()) {
      return;
    }

    try {
      await saveControlReviewToCloud(STORAGE_API_BOUNDARY, review);
    } catch (error) {
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to save control review to cloud', {
          component: 'storage',
          action: 'saveControlReview',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }, []);

  const listControlHandoffs = useCallback(
    (hubId: string): Promise<ControlHandoff[]> => listControlHandoffsFromIndexedDB(hubId),
    []
  );

  const saveControlHandoff = useCallback(async (handoff: ControlHandoff): Promise<void> => {
    await saveControlHandoffToIndexedDB(handoff);

    if (!navigator.onLine || isLocalDev()) {
      return;
    }

    try {
      await saveControlHandoffToCloud(STORAGE_API_BOUNDARY, handoff);
    } catch (error) {
      if (!(error instanceof CloudSyncUnavailableErrorClass)) {
        errorService.logWarning('Failed to save control handoff to cloud', {
          component: 'storage',
          action: 'saveControlHandoff',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }, []);

  // ── Background sync when coming online ────────────────────────────

  useEffect(() => {
    const handleOnline = async () => {
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
          const token = STORAGE_API_BOUNDARY;
          for (const item of pending) {
            try {
              const user = await getEasyAuthUser().catch(() => null);
              const userId = user?.userId || user?.email || 'local';
              const meta = extractMetadataInputs(item.project, userId) ?? undefined;
              const access = extractDocumentAccess(item.project, userId);
              const { id, etag } = await saveToCloud(
                token,
                item.project,
                item.name,
                item.location,
                meta,
                access
              );
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
              if (import.meta.env.DEV) console.error('Sync failed for:', item.name, error);
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
            if (import.meta.env.DEV) console.error('Auth failed during sync', e);
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
    pruneSyncQueue().catch(err =>
      errorService.logWarning('Failed to prune sync queue', {
        component: 'storage',
        action: 'pruneSyncQueue',
        metadata: { error: err instanceof Error ? err.message : String(err) },
      })
    );
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [addNotification]);

  const value: StorageContextValue = {
    saveProject,
    loadProject,
    listProjects,
    listProcessHubs,
    saveProcessHub,
    listEvidenceSources,
    saveEvidenceSource,
    listEvidenceSnapshots,
    saveEvidenceSnapshot,
    listControlRecords,
    saveControlRecord,
    listControlReviews,
    saveControlReview,
    listControlHandoffs,
    saveControlHandoff,
    syncStatus,
    notifications,
    dismissNotification,
  };

  return React.createElement(StorageContext.Provider, { value }, children);
};
