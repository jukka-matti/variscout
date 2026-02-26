import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mock objects (available inside vi.mock factories)
// ---------------------------------------------------------------------------
const {
  mockProjects,
  mockSyncState,
  mockAddToSyncQueue,
  mockGetPending,
  mockRemoveFromQueue,
  mockPruneSyncQueue,
  mockGetAccessToken,
} = vi.hoisted(() => ({
  mockProjects: {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    toArray: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(1),
  },
  mockSyncState: {
    put: vi.fn().mockResolvedValue(undefined),
  },
  mockAddToSyncQueue: vi.fn().mockResolvedValue(undefined),
  mockGetPending: vi.fn().mockResolvedValue([]),
  mockRemoveFromQueue: vi.fn().mockResolvedValue(undefined),
  mockPruneSyncQueue: vi.fn().mockResolvedValue(0),
  mockGetAccessToken: vi.fn().mockResolvedValue('mock-token-123'),
}));

// ---------------------------------------------------------------------------
// Mock: ../db/schema (Dexie IndexedDB layer)
// ---------------------------------------------------------------------------
vi.mock('../../db/schema', () => ({
  db: {
    projects: mockProjects,
    syncState: mockSyncState,
  },
  addToSyncQueue: mockAddToSyncQueue,
  getPendingSyncItems: mockGetPending,
  removeFromSyncQueue: mockRemoveFromQueue,
  pruneSyncQueue: mockPruneSyncQueue,
}));

// ---------------------------------------------------------------------------
// Mock: ../auth/easyAuth
// ---------------------------------------------------------------------------
vi.mock('../../auth/easyAuth', () => ({
  getAccessToken: mockGetAccessToken,
  isLocalDev: () => false,
  AuthError: class AuthError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'AuthError';
      this.code = code;
    }
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------
import { useStorage, StorageProvider, classifySyncError } from '../storage';
import type { SyncStatus, CloudProject, StorageLocation } from '../storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sampleProject = { data: [1, 2, 3], specs: { usl: 10, lsl: 0 } };

function createFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

/** Wrapper that provides StorageProvider context for hook tests. */
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(StorageProvider, null, children);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('storage service', () => {
  let originalOnLine: PropertyDescriptor | undefined;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    } else {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
    }
    fetchSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Type / interface sanity
  // -------------------------------------------------------------------------
  describe('type exports', () => {
    it('StorageLocation accepts team and personal', () => {
      const loc1: StorageLocation = 'team';
      const loc2: StorageLocation = 'personal';
      expect(loc1).toBe('team');
      expect(loc2).toBe('personal');
    });

    it('SyncStatus has expected status values', () => {
      const statuses: SyncStatus['status'][] = [
        'saved',
        'offline',
        'syncing',
        'synced',
        'conflict',
        'error',
      ];
      expect(statuses).toHaveLength(6);
    });
  });

  // -------------------------------------------------------------------------
  // classifySyncError
  // -------------------------------------------------------------------------
  describe('classifySyncError', () => {
    it('classifies 401 as auth (not retryable)', () => {
      const result = classifySyncError(new Error('Failed: 401'));
      expect(result.category).toBe('auth');
      expect(result.retryable).toBe(false);
    });

    it('classifies 429 as throttle (retryable)', () => {
      const result = classifySyncError(new Error('Failed: 429'));
      expect(result.category).toBe('throttle');
      expect(result.retryable).toBe(true);
    });

    it('classifies 500 as server (retryable)', () => {
      const result = classifySyncError(new Error('Failed: 500'));
      expect(result.category).toBe('server');
      expect(result.retryable).toBe(true);
    });

    it('classifies network errors as network (retryable)', () => {
      const result = classifySyncError(new Error('network error'));
      expect(result.category).toBe('network');
      expect(result.retryable).toBe(true);
    });

    it('classifies 404 as not_found (not retryable)', () => {
      const result = classifySyncError(new Error('Failed: 404'));
      expect(result.category).toBe('not_found');
      expect(result.retryable).toBe(false);
    });

    it('classifies unknown errors as unknown (retryable)', () => {
      const result = classifySyncError(new Error('something weird'));
      expect(result.category).toBe('unknown');
      expect(result.retryable).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // saveProject
  // -------------------------------------------------------------------------
  describe('saveProject', () => {
    it('saves to IndexedDB first (offline-first)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'test-project', 'personal');
      });

      expect(mockProjects.put).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-project',
          location: 'personal',
          synced: false,
          data: sampleProject,
        })
      );
    });

    it('queues for sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'offline-proj', 'personal');
      });

      expect(mockAddToSyncQueue).toHaveBeenCalledWith({
        project: sampleProject,
        name: 'offline-proj',
        location: 'personal',
      });
      expect(result.current.syncStatus.status).toBe('offline');
      expect(result.current.syncStatus.message).toContain('offline');
    });

    it('syncs to cloud immediately when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'cloud-id-1', eTag: 'etag-1' }));

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'cloud-proj', 'personal');
      });

      // Should call Graph API PUT
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('graph.microsoft.com'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result.current.syncStatus.status).toBe('synced');
      expect(result.current.syncStatus.lastSynced).toBeInstanceOf(Date);
    });

    it('appends .vrs to filenames in Graph API call', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'id-1', eTag: 'etag-1' }));

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'my-project', 'personal');
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('my-project.vrs'),
        expect.anything()
      );
    });

    it('does not double-append .vrs when name already has extension', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'id-2', eTag: 'etag-2' }));

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'already.vrs', 'personal');
      });

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('already.vrs');
      expect(url).not.toContain('already.vrs.vrs');
    });

    it('marks project as synced in IndexedDB after cloud save', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.get.mockResolvedValueOnce({
        name: 'synced-proj',
        location: 'personal',
        synced: false,
        data: sampleProject,
      });

      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'cloud-99', eTag: 'etag-99' }));

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'synced-proj', 'personal');
      });

      expect(mockProjects.update).toHaveBeenCalledWith('synced-proj', { synced: true });
      expect(mockSyncState.put).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'synced-proj',
          cloudId: 'cloud-99',
          etag: 'etag-99',
        })
      );
    });

    it('falls back to offline queue when cloud save fails', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      fetchSpy.mockResolvedValueOnce(
        createFetchResponse({ error: { message: 'Throttled' } }, false, 429)
      );

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'fail-proj', 'personal');
      });

      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'fail-proj' })
      );
      expect(result.current.syncStatus.status).toBe('offline');
    });
  });

  // -------------------------------------------------------------------------
  // loadProject
  // -------------------------------------------------------------------------
  describe('loadProject', () => {
    it('loads from cloud when online and caches locally', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      // db.projects.get for conflict detection (no local record → skip conflict check)
      mockProjects.get.mockResolvedValueOnce(null);
      // Only loadFromCloud fetch (no conflict metadata fetch since no local record)
      fetchSpy.mockResolvedValueOnce(createFetchResponse(sampleProject));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown;

      await act(async () => {
        loaded = await result.current.loadProject('remote-proj', 'personal');
      });

      expect(loaded).toEqual(sampleProject);
      // Should cache to IndexedDB
      expect(mockProjects.put).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'remote-proj',
          data: sampleProject,
        })
      );
    });

    it('falls back to IndexedDB when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const localData = { data: [10, 20], specs: { usl: 50, lsl: 5 } };
      mockProjects.get.mockResolvedValueOnce({ data: localData });

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown;

      await act(async () => {
        loaded = await result.current.loadProject('local-only', 'personal');
      });

      expect(loaded).toEqual(localData);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('falls back to IndexedDB when cloud load fails', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const localFallback = { data: [99] };
      // First db.projects.get: conflict detection (returns null — no local record)
      mockProjects.get.mockResolvedValueOnce(null);
      // getCloudModifiedDate fetch fails
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));
      // loadFromCloud fetch also fails
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));
      // Second db.projects.get: fallback loadFromIndexedDB
      mockProjects.get.mockResolvedValueOnce({ data: localFallback });

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown;

      await act(async () => {
        loaded = await result.current.loadProject('fallback-proj', 'personal');
      });

      expect(loaded).toEqual(localFallback);
    });

    it('returns null when project not found in cloud (404) and not cached locally', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      // db.projects.get for conflict detection (no local record → skip conflict check)
      mockProjects.get.mockResolvedValueOnce(null);
      // loadFromCloud returns 404
      fetchSpy.mockResolvedValueOnce(createFetchResponse(null, false, 404));
      // db.projects.get for fallback loadFromIndexedDB
      mockProjects.get.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown;

      await act(async () => {
        loaded = await result.current.loadProject('nonexistent', 'personal');
      });

      expect(loaded).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // listProjects
  // -------------------------------------------------------------------------
  describe('listProjects', () => {
    it('returns only local projects when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        { name: 'local-1', location: 'personal', modified: new Date('2026-01-01') },
        { name: 'local-2', location: 'personal', modified: new Date('2026-01-15') },
      ]);

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('local-1');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('merges cloud and local projects when online, preferring cloud', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        { name: 'shared', location: 'personal', modified: new Date('2026-01-01') },
        { name: 'local-only', location: 'personal', modified: new Date('2026-02-01') },
      ]);

      fetchSpy.mockResolvedValueOnce(
        createFetchResponse({
          value: [
            {
              id: 'cloud-1',
              name: 'shared.vrs',
              lastModifiedDateTime: '2026-02-10T12:00:00Z',
              lastModifiedBy: { user: { displayName: 'Alice' } },
            },
            {
              id: 'cloud-2',
              name: 'cloud-new.vrs',
              lastModifiedDateTime: '2026-02-15T08:00:00Z',
              lastModifiedBy: { user: { displayName: 'Bob' } },
            },
          ],
        })
      );

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      // 3 unique: shared (cloud wins), local-only, cloud-new
      expect(projects).toHaveLength(3);

      // The cloud version of 'shared' should have modifiedBy from cloud
      const shared = projects.find(p => p.name === 'shared');
      expect(shared?.modifiedBy).toBe('Alice');

      // local-only should be marked as Local
      const localOnly = projects.find(p => p.name === 'local-only');
      expect(localOnly?.modifiedBy).toBe('Local');

      // Results should be sorted newest first
      expect(new Date(projects[0].modified).getTime()).toBeGreaterThanOrEqual(
        new Date(projects[1].modified).getTime()
      );
    });

    it('filters out non-.vrs files from cloud listing', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockProjects.toArray.mockResolvedValueOnce([]);

      fetchSpy.mockResolvedValueOnce(
        createFetchResponse({
          value: [
            { id: '1', name: 'project.vrs', lastModifiedDateTime: '2026-01-01T00:00:00Z' },
            { id: '2', name: 'readme.txt', lastModifiedDateTime: '2026-01-02T00:00:00Z' },
            { id: '3', name: 'data.csv', lastModifiedDateTime: '2026-01-03T00:00:00Z' },
          ],
        })
      );

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('project');
    });

    it('returns empty list and creates folder on 404 (first use)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockProjects.toArray.mockResolvedValueOnce([]);

      // listFromCloud returns 404
      fetchSpy.mockResolvedValueOnce(createFetchResponse(null, false, 404));
      // ensureFolderExists: two POST calls for folder creation
      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'folder-1' }));
      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'folder-2' }));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toHaveLength(0);

      // Verify folder creation POST calls were made
      const postCalls = fetchSpy.mock.calls.filter(
        call => (call[1] as Record<string, unknown>)?.method === 'POST'
      );
      expect(postCalls).toHaveLength(2);
      expect(postCalls[0][0]).toContain('/me/drive/root/children');
      expect(postCalls[1][0]).toContain('/me/drive/root:/VariScout:/children');
    });

    it('still logs warning for non-404 cloud errors (e.g. 500)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockProjects.toArray.mockResolvedValueOnce([
        { name: 'local-safe', location: 'personal', modified: new Date('2026-01-01') },
      ]);

      // listFromCloud returns 500
      fetchSpy.mockResolvedValueOnce(createFetchResponse(null, false, 500));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      // Should fall back to local projects
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('local-safe');

      // Should NOT have made folder creation POST calls
      const postCalls = fetchSpy.mock.calls.filter(
        call => (call[1] as Record<string, unknown>)?.method === 'POST'
      );
      expect(postCalls).toHaveLength(0);
    });

    it('returns local projects when cloud listing fails', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        { name: 'safe-local', location: 'personal', modified: new Date('2026-02-01') },
      ]);

      mockGetAccessToken.mockRejectedValueOnce(new Error('Auth expired'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('safe-local');
    });
  });

  // -------------------------------------------------------------------------
  // Background sync (online event)
  // -------------------------------------------------------------------------
  describe('background sync', () => {
    it('syncs pending items when online event fires', async () => {
      // Start online so mount sync runs (with empty queue)
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const pendingItems = [
        {
          id: 1,
          name: 'queued-1',
          location: 'personal' as const,
          project: { d: 1 },
          queuedAt: '2026-02-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'queued-2',
          location: 'personal' as const,
          project: { d: 2 },
          queuedAt: '2026-02-01T01:00:00Z',
        },
      ];

      // First call: mount sync finds nothing; second call: online event finds items; third: post-sync check
      mockGetPending
        .mockResolvedValueOnce([]) // mount sync (online at mount)
        .mockResolvedValueOnce(pendingItems) // online event handler
        .mockResolvedValueOnce([]); // post-sync check

      fetchSpy
        .mockResolvedValueOnce(createFetchResponse({ id: 'c1', eTag: 'e1' }))
        .mockResolvedValueOnce(createFetchResponse({ id: 'c2', eTag: 'e2' }));

      // Need project records for markAsSynced
      mockProjects.get
        .mockResolvedValueOnce({ name: 'queued-1', synced: false })
        .mockResolvedValueOnce({ name: 'queued-2', synced: false });

      renderHook(() => useStorage(), { wrapper });

      // Wait for mount sync to settle
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      // Clear call counts from mount sync so we only assert on the online event
      mockRemoveFromQueue.mockClear();

      // Fire online event (simulating reconnection)
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await new Promise(r => setTimeout(r, 100));
      });

      expect(mockRemoveFromQueue).toHaveBeenCalledWith('queued-1');
      expect(mockRemoveFromQueue).toHaveBeenCalledWith('queued-2');
    });

    it('reports remaining items when partial sync fails', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const pendingItems = [
        {
          id: 1,
          name: 'ok-item',
          location: 'personal' as const,
          project: {},
          queuedAt: '2026-02-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'fail-item',
          location: 'personal' as const,
          project: {},
          queuedAt: '2026-02-01T01:00:00Z',
        },
      ];

      // Mount sync: empty queue; online event: pending items; post-sync check: one remaining
      mockGetPending
        .mockResolvedValueOnce([]) // mount sync
        .mockResolvedValueOnce(pendingItems) // online event
        .mockResolvedValueOnce([pendingItems[1]]); // one remaining

      // First save succeeds, second fails
      fetchSpy
        .mockResolvedValueOnce(createFetchResponse({ id: 'c1', eTag: 'e1' }))
        .mockResolvedValueOnce(
          createFetchResponse({ error: { message: 'Server error' } }, false, 500)
        );

      mockProjects.get.mockResolvedValueOnce({ name: 'ok-item', synced: false });

      const { result } = renderHook(() => useStorage(), { wrapper });

      // Wait for mount sync to settle
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      // Fire online event to trigger partial sync
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await new Promise(r => setTimeout(r, 100));
      });

      expect(result.current.syncStatus.status).toBe('offline');
      expect(result.current.syncStatus.pendingChanges).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  describe('notifications', () => {
    it('emits notification on successful cloud save', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      fetchSpy.mockResolvedValueOnce(createFetchResponse({ id: 'id-1', eTag: 'etag-1' }));

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'notif-proj', 'personal');
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(result.current.notifications.some(n => n.type === 'success')).toBe(true);
    });

    it('emits notification on offline save', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'offline-notif', 'personal');
      });

      expect(result.current.notifications.some(n => n.type === 'info')).toBe(true);
    });

    it('dismisses notification by id', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'dismiss-test', 'personal');
      });

      const notifId = result.current.notifications[0]?.id;
      expect(notifId).toBeTruthy();

      act(() => {
        result.current.dismissNotification(notifId);
      });

      expect(result.current.notifications.find(n => n.id === notifId)).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Initial syncStatus
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with saved status', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      mockGetPending.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useStorage(), { wrapper });
      expect(result.current.syncStatus.status).toBe('saved');
      expect(result.current.syncStatus.message).toBe('');
    });
  });
});
