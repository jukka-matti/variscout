import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { errorService } from '@variscout/ui';
import type {
  ControlHandoff,
  ControlRecord,
  ControlReview,
  EvidenceSnapshot,
  EvidenceSource,
  ProcessHub,
} from '@variscout/core';
import { db } from '../db/schema';
import { getEasyAuthUser } from '../auth/easyAuth';
import { azureHubRepository } from '../persistence';
import type { Project } from './localDb';
import {
  ensureDefaultProcessHubInIndexedDB,
  extractMetadataInputs,
  listControlHandoffsFromIndexedDB,
  listControlRecordsFromIndexedDB,
  listControlReviewsFromIndexedDB,
  listEvidenceSnapshotsFromIndexedDB,
  listEvidenceSourcesFromIndexedDB,
  listFromIndexedDB,
  listProcessHubsFromIndexedDB,
  mergeProjectMetadata,
  metadataChanged,
  recomputeSustainmentProjectionForRecord,
  saveControlHandoffToIndexedDB,
  saveControlRecordToIndexedDB,
  saveControlReviewToIndexedDB,
  saveToIndexedDB,
} from './localDb';
import type { CloudProject, StorageLocation, SyncNotification, SyncStatus } from './storageTypes';

export type { CloudProject, StorageLocation, SyncNotification, SyncStatus } from './storageTypes';

export interface ClassifiedError {
  category: 'auth' | 'network' | 'rate-limit' | 'not-found' | 'forbidden' | 'unknown';
  retryable: boolean;
  message: string;
}

export function classifySyncError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|unauthorized|auth/i.test(message)) {
    return { category: 'auth', retryable: false, message: 'Authentication expired' };
  }
  if (/403|forbidden|access/i.test(message)) {
    return { category: 'forbidden', retryable: false, message: 'Access denied' };
  }
  if (/404|not found/i.test(message)) {
    return { category: 'not-found', retryable: false, message: 'Project not found' };
  }
  if (/429|rate/i.test(message)) {
    return { category: 'rate-limit', retryable: true, message: 'Service is busy' };
  }
  if (/network|offline|fetch/i.test(message)) {
    return { category: 'network', retryable: true, message: 'Network unavailable' };
  }
  return { category: 'unknown', retryable: false, message: 'Unexpected storage error' };
}

export async function downloadFileFromGraph(..._args: unknown[]): Promise<File> {
  throw new Error('Cloud document download is not available in the local-first Workspace.');
}

export async function saveToCustomLocation(): Promise<void> {
  throw new Error('Cloud document save is not available in the local-first Workspace.');
}

export async function updateLastViewedAt(
  name: string,
  _location: StorageLocation,
  userId: string
): Promise<void> {
  const record = await db.projects.get(name).catch(() => null);
  if (!record?.meta) return;
  const lastViewedAt = { ...(record.meta?.lastViewedAt ?? {}), [userId]: Date.now() };
  await db.projects.update(name, {
    meta: { ...record.meta, lastViewedAt },
  });
}

export type SaveProjectResult = { status: 'saved' } | { status: 'error' };

interface StorageContextValue {
  saveProject: (
    project: Project,
    name: string,
    location: StorageLocation
  ) => Promise<SaveProjectResult>;
  pendingConflict: null;
  dismissConflict: () => void;
  reloadProjectFromCloud: () => Promise<Project | null>;
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

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within a StorageProvider');
  return ctx;
}

let notificationCounter = 0;

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'saved',
    message: 'Saved locally',
  });
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);

  const addNotification = useCallback((notif: Omit<SyncNotification, 'id'>) => {
    const id = `sync-${++notificationCounter}`;
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }]);
    if (notif.dismissAfter) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notif.dismissAfter);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

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

  const saveProject = useCallback(
    async (
      project: Project,
      name: string,
      location: StorageLocation
    ): Promise<SaveProjectResult> => {
      const user = await getEasyAuthUser().catch(() => null);
      const userId = user?.userId || user?.email || 'local';
      const existingRecord = await db.projects.get(name).catch(() => null);
      const recomputedMeta = extractMetadataInputs(
        project,
        userId,
        existingRecord?.meta?.lastViewedAt
      );
      const meta = recomputedMeta
        ? mergeProjectMetadata(existingRecord?.meta, recomputedMeta)
        : undefined;

      try {
        await saveToIndexedDB(project, name, location, meta, userId);
        setSyncStatus({ status: 'saved', message: 'Saved locally', lastSynced: new Date() });
        addNotification({ type: 'success', message: 'Saved locally', dismissAfter: 3000 });
        return { status: 'saved' };
      } catch (dbError) {
        const isQuota = dbError instanceof DOMException && dbError.name === 'QuotaExceededError';
        const message = isQuota
          ? 'Storage quota exceeded. Export a .vrs snapshot, then clear old local projects.'
          : 'Local save failed. Export a .vrs snapshot before closing this tab.';
        setSyncStatus({ status: 'error', message });
        addNotification({ type: 'error', message, dismissAfter: isQuota ? 10000 : 5000 });
        return { status: 'error' };
      }
    },
    [addNotification]
  );

  const loadProject = useCallback(
    async (name: string, _location: StorageLocation): Promise<Project | null> => {
      const user = await getEasyAuthUser().catch(() => null);
      const userId = user?.userId || user?.email || 'local';
      const record = await db.projects.get(name).catch(() => null);
      if (!record) return null;
      const recomputed = extractMetadataInputs(record.data, userId, record.meta?.lastViewedAt);
      if (recomputed) {
        const merged = mergeProjectMetadata(record.meta, recomputed);
        if (metadataChanged(record.meta, merged)) {
          await db.projects.update(name, { meta: merged });
        }
      }
      return record.data;
    },
    []
  );

  const listProjects = useCallback(async (): Promise<CloudProject[]> => {
    const user = await getEasyAuthUser().catch(() => null);
    const userId = user?.userId || user?.email || 'local';
    return listFromIndexedDB(userId);
  }, []);

  const listProcessHubs = useCallback(
    (): Promise<ProcessHub[]> => listProcessHubsFromIndexedDB(),
    []
  );

  const saveProcessHub = useCallback(async (hub: ProcessHub): Promise<void> => {
    await ensureDefaultProcessHubInIndexedDB();
    await azureHubRepository.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });
  }, []);

  const listEvidenceSources = useCallback(
    (hubId: string): Promise<EvidenceSource[]> => listEvidenceSourcesFromIndexedDB(hubId),
    []
  );

  const saveEvidenceSource = useCallback(async (source: EvidenceSource): Promise<void> => {
    await azureHubRepository.dispatch({ kind: 'EVIDENCE_SOURCE_ADD', hubId: source.hubId, source });
  }, []);

  const listEvidenceSnapshots = useCallback(
    (hubId: string, sourceId: string): Promise<EvidenceSnapshot[]> =>
      listEvidenceSnapshotsFromIndexedDB(hubId, sourceId),
    []
  );

  const saveEvidenceSnapshot = useCallback(
    async (snapshot: EvidenceSnapshot, _sourceCsv?: string): Promise<void> => {
      await azureHubRepository.dispatch({
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: snapshot.hubId,
        snapshot,
        provenance: [],
      });
    },
    []
  );

  const listControlRecords = useCallback(
    (hubId: string): Promise<ControlRecord[]> => listControlRecordsFromIndexedDB(hubId),
    []
  );

  const saveControlRecord = useCallback(async (record: ControlRecord): Promise<void> => {
    await saveControlRecordToIndexedDB(record);
    await recomputeSustainmentProjectionForRecord(record);
  }, []);

  const listControlReviews = useCallback(
    (recordId: string): Promise<ControlReview[]> => listControlReviewsFromIndexedDB(recordId),
    []
  );

  const saveControlReview = useCallback(
    (review: ControlReview): Promise<void> => saveControlReviewToIndexedDB(review),
    []
  );

  const listControlHandoffs = useCallback(
    (hubId: string): Promise<ControlHandoff[]> => listControlHandoffsFromIndexedDB(hubId),
    []
  );

  const saveControlHandoff = useCallback(
    (handoff: ControlHandoff): Promise<void> => saveControlHandoffToIndexedDB(handoff),
    []
  );

  const value: StorageContextValue = {
    saveProject,
    pendingConflict: null,
    dismissConflict: () => {},
    reloadProjectFromCloud: async () => null,
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
