// src/services/storage.ts
import { useState, useEffect, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { addToSyncQueue, getPendingSyncItems, removeFromSyncQueue, db } from '../db/schema';

// Placeholder types - these would come from @variscout/core
type Project = any;

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

// Graph API base URL
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

// Get the appropriate API path for the location
function getApiPath(location: StorageLocation): string {
  if (location === 'team') {
    // SharePoint site path - would be configured via env
    return '/sites/root:/VaRiScout/Projects';
  }
  return '/me/drive/root:/VaRiScout/Projects';
}

// Save to IndexedDB (offline-first)
async function saveToIndexedDB(project: Project, name: string, location: StorageLocation) {
  await db.projects.put({
    name,
    location,
    modified: new Date(),
    synced: false,
    data: project,
  });
}

// Load from IndexedDB
async function loadFromIndexedDB(name: string): Promise<Project | null> {
  const record = await db.projects.get(name);
  return record?.data || null;
}

// List projects from IndexedDB
async function listFromIndexedDB(): Promise<CloudProject[]> {
  const records = await db.projects.toArray();
  return records.map(r => ({
    id: r.name,
    name: r.name,
    modified: r.modified?.toISOString() || new Date().toISOString(),
    location: r.location,
  }));
}

// Save to cloud using Graph API
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

// Load from cloud using Graph API
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

// List projects from cloud using Graph API
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
    console.warn('Failed to list cloud projects:', response.status);
    return [];
  }

  const data = await response.json();
  return (data.value || [])
    .filter((file: any) => file.name.endsWith('.vrs'))
    .map((file: any) => ({
      id: file.id,
      name: file.name.replace('.vrs', ''),
      modified: file.lastModifiedDateTime,
      modifiedBy: file.lastModifiedBy?.user?.displayName,
      location,
    }));
}

// Mark project as synced in IndexedDB
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

export function useStorage() {
  const { instance, accounts } = useMsal();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'saved',
    message: '',
  });

  // Get access token for Graph API
  const getAccessToken = useCallback(async () => {
    if (!accounts[0]) {
      throw new Error('No authenticated account');
    }

    const request = {
      scopes: ['Files.ReadWrite', 'Sites.ReadWrite.All'],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      // If silent acquisition fails, try interactive
      const response = await instance.acquireTokenPopup(request);
      return response.accessToken;
    }
  }, [instance, accounts]);

  // Save project (offline-first)
  const saveProject = useCallback(
    async (project: Project, name: string, location: StorageLocation) => {
      // Always save to IndexedDB first (instant feedback)
      await saveToIndexedDB(project, name, location);

      if (!navigator.onLine) {
        // Offline: queue for sync
        await addToSyncQueue({ project, name, location });
        setSyncStatus({
          status: 'offline',
          message: 'Saved offline, will sync when connected',
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
      } catch (error) {
        console.error('Cloud save failed:', error);
        // Failed: keep in queue for retry
        await addToSyncQueue({ project, name, location });
        setSyncStatus({
          status: 'offline',
          message: 'Save failed, will retry',
        });
      }
    },
    [getAccessToken]
  );

  // Load project (cloud first if online)
  const loadProject = useCallback(
    async (name: string, location: StorageLocation): Promise<Project | null> => {
      if (navigator.onLine) {
        try {
          const token = await getAccessToken();
          const project = await loadFromCloud(token, name, location);
          if (project) {
            // Cache locally
            await saveToIndexedDB(project, name, location);
            return project;
          }
        } catch (error) {
          console.warn('Cloud load failed, falling back to local:', error);
        }
      }

      // Fallback to local
      return loadFromIndexedDB(name);
    },
    [getAccessToken]
  );

  // List all projects (merge local and cloud)
  const listProjects = useCallback(async (): Promise<CloudProject[]> => {
    const localProjects = await listFromIndexedDB();

    if (!navigator.onLine) {
      return localProjects;
    }

    try {
      const token = await getAccessToken();
      const [teamProjects, personalProjects] = await Promise.all([
        listFromCloud(token, 'team').catch(() => []),
        listFromCloud(token, 'personal').catch(() => []),
      ]);

      // Merge cloud projects with local, preferring cloud version
      const cloudProjectMap = new Map<string, CloudProject>();
      [...teamProjects, ...personalProjects].forEach(p => {
        cloudProjectMap.set(p.name, p);
      });

      // Add local-only projects
      localProjects.forEach(p => {
        if (!cloudProjectMap.has(p.name)) {
          cloudProjectMap.set(p.name, { ...p, modifiedBy: 'Local' });
        }
      });

      return Array.from(cloudProjectMap.values()).sort(
        (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
    } catch (error) {
      console.warn('Failed to list cloud projects:', error);
      return localProjects;
    }
  }, [getAccessToken]);

  // Background sync when coming online
  useEffect(() => {
    const handleOnline = async () => {
      const pending = await getPendingSyncItems();

      if (pending.length === 0) return;

      setSyncStatus({
        status: 'syncing',
        message: `Syncing ${pending.length} items...`,
        pendingChanges: pending.length,
      });

      try {
        const token = await getAccessToken();
        for (const item of pending) {
          try {
            const { id, etag } = await saveToCloud(token, item.project, item.name, item.location);
            await markAsSynced(item.name, id, etag);
            await removeFromSyncQueue(item.name);
          } catch (error) {
            console.error('Sync failed for:', item.name, error);
            // Keep in queue for next attempt
          }
        }
      } catch (e) {
        console.error('Auth failed during sync', e);
      }

      const remaining = await getPendingSyncItems();
      if (remaining.length === 0) {
        setSyncStatus({
          status: 'synced',
          message: 'All changes synced',
          lastSynced: new Date(),
        });
      } else {
        setSyncStatus({
          status: 'offline',
          message: `${remaining.length} items pending sync`,
          pendingChanges: remaining.length,
        });
      }
    };

    window.addEventListener('online', handleOnline);

    // Also try sync on mount if online
    if (navigator.onLine && accounts.length > 0) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [instance, accounts, getAccessToken]);

  return {
    saveProject,
    loadProject,
    listProjects,
    syncStatus,
  };
}
