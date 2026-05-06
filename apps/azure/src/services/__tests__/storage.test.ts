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
  mockSaveBlobProject,
  mockLoadBlobProject,
  mockLoadBlobMetadata,
  mockListBlobProjects,
  mockUpdateBlobIndex,
  mockListBlobProcessHubs,
  mockUpdateBlobProcessHubs,
  mockDispatch,
} = vi.hoisted(() => ({
  mockProjects: {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    toArray: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(1),
  },
  mockSyncState: {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(1),
  },
  mockAddToSyncQueue: vi.fn().mockResolvedValue(undefined),
  mockGetPending: vi.fn().mockResolvedValue([]),
  mockRemoveFromQueue: vi.fn().mockResolvedValue(undefined),
  mockPruneSyncQueue: vi.fn().mockResolvedValue(0),
  mockSaveBlobProject: vi.fn().mockResolvedValue(undefined),
  mockLoadBlobProject: vi.fn().mockResolvedValue(null),
  mockLoadBlobMetadata: vi.fn().mockResolvedValue(null),
  mockListBlobProjects: vi.fn().mockResolvedValue([]),
  mockUpdateBlobIndex: vi.fn().mockResolvedValue(undefined),
  mockListBlobProcessHubs: vi.fn().mockResolvedValue([]),
  mockUpdateBlobProcessHubs: vi.fn().mockResolvedValue(undefined),
  mockDispatch: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Mock: ../db/schema (Dexie IndexedDB layer)
// ---------------------------------------------------------------------------
vi.mock('../../db/schema', () => ({
  db: {
    projects: mockProjects,
    syncState: mockSyncState,
    // processHubs needed by ensureDefaultProcessHubInIndexedDB (called inside saveProcessHub)
    processHubs: {
      get: vi.fn().mockResolvedValue({ id: 'default' }),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
  addToSyncQueue: mockAddToSyncQueue,
  getPendingSyncItems: mockGetPending,
  removeFromSyncQueue: mockRemoveFromQueue,
  pruneSyncQueue: mockPruneSyncQueue,
}));

// ---------------------------------------------------------------------------
// Mock: @variscout/core — hasTeamFeatures defaults to true (cloud sync tests)
// ---------------------------------------------------------------------------
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    hasTeamFeatures: () => true,
    buildProjectMetadata: () => ({
      phase: 'scout',
      findingCounts: {},
      questionCounts: {},
      actionCounts: { total: 0, completed: 0, overdue: 0 },
      assignedTaskCount: 0,
      hasOverdueTasks: false,
      lastViewedAt: {},
    }),
  };
});

// ---------------------------------------------------------------------------
// Mock: ../auth/easyAuth
// ---------------------------------------------------------------------------
vi.mock('../../auth/easyAuth', () => ({
  isLocalDev: () => false,
  getEasyAuthUser: vi
    .fn()
    .mockResolvedValue({ name: 'Test', email: 'test@test.com', userId: 'test-user', roles: [] }),
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
// Mock: ../services/blobClient (Blob Storage operations used by cloudSync)
// ---------------------------------------------------------------------------
vi.mock('../blobClient', () => ({
  saveBlobProject: mockSaveBlobProject,
  loadBlobProject: mockLoadBlobProject,
  loadBlobMetadata: mockLoadBlobMetadata,
  listBlobProjects: mockListBlobProjects,
  updateBlobIndex: mockUpdateBlobIndex,
  listBlobProcessHubs: mockListBlobProcessHubs,
  updateBlobProcessHubs: mockUpdateBlobProcessHubs,
}));

// ---------------------------------------------------------------------------
// Mock: ../../persistence (azureHubRepository.dispatch)
// ---------------------------------------------------------------------------
vi.mock('../../persistence', () => ({
  azureHubRepository: {
    dispatch: mockDispatch,
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

    it('classifies 403 as forbidden (not auth)', () => {
      const result = classifySyncError(new Error('403 Forbidden'));
      expect(result.category).toBe('forbidden');
      expect(result.retryable).toBe(false);
    });

    it('classifies "forbidden" text as forbidden', () => {
      const result = classifySyncError(new Error('Access forbidden'));
      expect(result.category).toBe('forbidden');
      expect(result.retryable).toBe(false);
    });

    it('classifies "unauthorized" text as auth (not forbidden)', () => {
      const result = classifySyncError(new Error('Request unauthorized'));
      expect(result.category).toBe('auth');
      expect(result.retryable).toBe(false);
    });

    it('does NOT classify 403 as auth', () => {
      const result = classifySyncError(new Error('403 Forbidden'));
      expect(result.category).not.toBe('auth');
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

    it('saves to cloud via Blob Storage when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockListBlobProjects.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'cloud-proj', 'personal');
      });

      // Should save to both IndexedDB and Blob Storage
      expect(mockProjects.put).toHaveBeenCalled();
      expect(mockSaveBlobProject).toHaveBeenCalled();
      expect(result.current.syncStatus.status).toBe('synced');
    });

    it('gracefully degrades when Blob Storage not configured (503)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSaveBlobProject.mockRejectedValueOnce(new Error('503 Blob Storage not configured'));

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'no-blob', 'personal');
      });

      // Falls back to local-only
      expect(mockProjects.put).toHaveBeenCalled();
      expect(result.current.syncStatus.status).toBe('saved');
      expect(result.current.syncStatus.message).toBe('Saved locally');
    });
  });

  // -------------------------------------------------------------------------
  // loadProject
  // -------------------------------------------------------------------------
  describe('loadProject', () => {
    it('loads from Blob Storage when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const cloudData = { data: [42], specs: { usl: 100 } };
      // db.syncState.get returns a cloudId so loadFromCloud can resolve the project
      mockSyncState.get.mockResolvedValueOnce({
        cloudId: 'uuid-remote-proj',
        lastSynced: '',
        etag: '',
      });
      // db.projects.get for conflict detection (no local record)
      mockProjects.get.mockResolvedValueOnce(null);
      // loadBlobProject returns cloud data
      mockLoadBlobProject.mockResolvedValueOnce(cloudData);

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown;

      await act(async () => {
        loaded = await result.current.loadProject('remote-proj', 'personal');
      });

      expect(loaded).toEqual(cloudData);
      expect(mockLoadBlobProject).toHaveBeenCalled();
    });

    it('falls back to IndexedDB when Blob Storage not configured (503)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      // db.projects.get for conflict detection (no local record)
      mockProjects.get.mockResolvedValueOnce(null);
      // loadBlobProject throws 503 → CloudSyncUnavailableError → fallback
      mockLoadBlobProject.mockRejectedValueOnce(new Error('503 Blob Storage not configured'));
      const localData = { data: [42], specs: { usl: 100 } };
      mockProjects.get.mockResolvedValueOnce({ data: localData });

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown;

      await act(async () => {
        loaded = await result.current.loadProject('remote-proj', 'personal');
      });

      expect(loaded).toEqual(localData);
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

    it('preserves an accepted Survey next move through local save/load', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const projectWithSurveyMove = {
        ...sampleProject,
        processContext: { nextMove: 'Set LSL or USL for the mapped outcome.' },
      };
      let savedData: unknown;
      mockProjects.put.mockImplementationOnce(async record => {
        savedData = record.data;
      });

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(projectWithSurveyMove, 'survey-next-move', 'personal');
      });

      mockProjects.get.mockResolvedValueOnce({ data: savedData });

      let loaded: unknown;
      await act(async () => {
        loaded = await result.current.loadProject('survey-next-move', 'personal');
      });

      expect(loaded).toEqual(projectWithSurveyMove);
    });

    it('falls back to IndexedDB when cloud load fails (network error)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const localFallback = { data: [99] };
      // First db.projects.get: conflict detection (returns null — no local record)
      mockProjects.get.mockResolvedValueOnce(null);
      // loadBlobProject throws network error
      mockLoadBlobProject.mockRejectedValueOnce(new Error('Network error'));
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
      // loadBlobProject returns null (404)
      mockLoadBlobProject.mockResolvedValueOnce(null);
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

    it('merges local and cloud projects when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        { name: 'shared', location: 'personal', modified: new Date('2026-01-01') },
        { name: 'local-only', location: 'personal', modified: new Date('2026-02-01') },
      ]);
      // listBlobProjects returns an empty index (no cloud projects yet)
      mockListBlobProjects.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      // Cloud returned [], so only local projects remain (marked as Local)
      expect(projects).toHaveLength(2);
      expect(projects.every(p => p.modifiedBy === 'Local')).toBe(true);

      // Results should be sorted newest first
      expect(new Date(projects[0].modified).getTime()).toBeGreaterThanOrEqual(
        new Date(projects[1].modified).getTime()
      );
    });

    it('returns local projects when cloud listing fails', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        { name: 'safe-local', location: 'personal', modified: new Date('2026-02-01') },
      ]);

      mockListBlobProjects.mockRejectedValueOnce(new Error('Network error'));

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
  // saveProcessHub — routes IndexedDB write through dispatch
  // -------------------------------------------------------------------------
  describe('saveProcessHub', () => {
    const sampleHub = {
      id: 'hub-1',
      name: 'Test Hub',
      createdAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').ProcessHub;

    it('calls dispatch with HUB_PERSIST_SNAPSHOT action', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProcessHub(sampleHub);
      });
      expect(mockDispatch).toHaveBeenCalledWith({ kind: 'HUB_PERSIST_SNAPSHOT', hub: sampleHub });
    });

    it('also syncs to cloud when online with team features', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProcessHub(sampleHub);
      });
      expect(mockDispatch).toHaveBeenCalledWith({ kind: 'HUB_PERSIST_SNAPSHOT', hub: sampleHub });
      expect(mockUpdateBlobProcessHubs).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // saveEvidenceSource — routes IndexedDB write through dispatch
  // -------------------------------------------------------------------------
  describe('saveEvidenceSource', () => {
    const sampleSource = {
      id: 'src-1',
      hubId: 'hub-1',
      name: 'Fill Weight',
      cadence: 'daily' as const,
      createdAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').EvidenceSource;

    it('calls dispatch with EVIDENCE_SOURCE_ADD action', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveEvidenceSource(sampleSource);
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        kind: 'EVIDENCE_SOURCE_ADD',
        hubId: sampleSource.hubId,
        source: sampleSource,
      });
    });
  });

  // -------------------------------------------------------------------------
  // saveEvidenceSnapshot — routes IndexedDB write through dispatch
  // -------------------------------------------------------------------------
  describe('saveEvidenceSnapshot', () => {
    const sampleSnapshot = {
      id: 'snap-1',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-01T00:00:00Z',
      rowCount: 50,
      origin: 'evidence-source:src-1',
      importedAt: 1000,
      createdAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').EvidenceSnapshot;

    it('calls dispatch with EVIDENCE_ADD_SNAPSHOT action', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveEvidenceSnapshot(sampleSnapshot);
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: sampleSnapshot.hubId,
        snapshot: sampleSnapshot,
        provenance: [],
      });
    });

    it('also syncs to cloud when online with team features', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveEvidenceSnapshot(sampleSnapshot, 'csv-data');
      });
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'EVIDENCE_ADD_SNAPSHOT' })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Background sync (online event)
  // -------------------------------------------------------------------------
  describe('background sync', () => {
    it('sync fails gracefully when Blob Storage not configured (503)', async () => {
      // Start online so mount sync runs
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const pendingItems = [
        {
          id: 1,
          name: 'queued-1',
          location: 'personal' as const,
          project: { d: 1 },
          queuedAt: '2026-02-01T00:00:00Z',
        },
      ];

      // saveBlobProject throws 503 → CloudSyncUnavailableError
      mockSaveBlobProject.mockRejectedValue(new Error('503 Blob Storage not configured'));
      mockListBlobProjects.mockRejectedValue(new Error('503 Blob Storage not configured'));

      // Mount sync: empty; online event: pending items; post-sync: still pending
      mockGetPending
        .mockResolvedValueOnce([]) // mount sync
        .mockResolvedValueOnce(pendingItems) // online event handler
        .mockResolvedValueOnce(pendingItems); // post-sync check (item not removed)

      vi.useFakeTimers();
      renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      mockRemoveFromQueue.mockClear();

      // Fire online event — saveToCloud converts 503 to CloudSyncUnavailableError
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await vi.advanceTimersByTimeAsync(100);
      });
      vi.useRealTimers();

      // Items should NOT have been removed (sync failed)
      expect(mockRemoveFromQueue).not.toHaveBeenCalled();

      // Reset mocks for other tests
      mockSaveBlobProject.mockResolvedValue(undefined);
      mockListBlobProjects.mockResolvedValue([]);
    });
  });

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  describe('notifications', () => {
    it('emits success notification when cloud save succeeds', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockListBlobProjects.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'notif-proj', 'personal');
      });

      expect(result.current.notifications.length).toBeGreaterThan(0);
      expect(
        result.current.notifications.some(
          n => n.type === 'success' && n.message.includes('Saved to cloud')
        )
      ).toBe(true);
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
