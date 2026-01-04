// src/services/storage.ts
import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { addToSyncQueue, getPendingSyncItems, removeFromSyncQueue, db } from '../db/schema';

// Placeholder types - these would come from @variscout/core
type Project = any;

export type StorageLocation = 'team' | 'personal';

interface SyncStatus {
  status: 'saved' | 'offline' | 'syncing' | 'synced' | 'conflict';
  message: string;
  pendingChanges?: number;
}

// Mock functions to simulate cloud operations (since backend isn't connected yet)
async function saveToIndexedDB(project: Project, name: string, location: StorageLocation) {
  await db.projects.put({ name, location, modified: new Date(), synced: false, data: project });
}
const saveToCloud = async (
  token: string,
  project: Project,
  name: string,
  location: StorageLocation
) => {
  console.log('Saving to cloud...', { name, location });
  // This would call the Azure Function
};
const markAsSynced = async (name: string) => {
  await db.projects.update(name, { synced: true });
};

export function useStorage() {
  const { instance, accounts } = useMsal();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'saved',
    message: '',
  });

  const getAccessToken = async () => {
    const request = {
      scopes: ['Files.ReadWrite', 'Sites.ReadWrite.All'],
      account: accounts[0],
    };
    const response = await instance.acquireTokenSilent(request);
    return response.accessToken;
  };

  const saveProject = async (project: Project, name: string, location: StorageLocation) => {
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
      await saveToCloud(token, project, name, location);

      await markAsSynced(name);
      setSyncStatus({ status: 'synced', message: 'Saved' });
    } catch (error) {
      // Failed: keep in queue for retry
      await addToSyncQueue({ project, name, location });
      setSyncStatus({
        status: 'offline',
        message: 'Save failed, will retry',
      });
    }
  };

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
            await saveToCloud(token, item.project, item.name, item.location);
            await removeFromSyncQueue(item.name);
          } catch (error) {
            console.error('Sync failed for:', item.name);
            // Keep in queue for next attempt
          }
        }
      } catch (e) {
        console.error('Auth failed during sync', e);
      }

      const remaining = await getPendingSyncItems();
      if (remaining.length === 0) {
        setSyncStatus({ status: 'synced', message: 'All changes synced' });
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
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [instance, accounts]);

  return { saveProject, syncStatus };
}
