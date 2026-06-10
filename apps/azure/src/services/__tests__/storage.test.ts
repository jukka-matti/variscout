import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import type { DocumentSnapshot } from '@variscout/stores';
import type { ProjectMetadata } from '@variscout/core';

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
  mockListBlobEvidenceSnapshots,
  mockSaveBlobEvidenceSnapshot,
  mockUpdateBlobEvidenceSnapshotsConditional,
  mockListBlobEvidenceSources,
  mockSaveBlobEvidenceSource,
  mockUpdateBlobEvidenceSources,
  mockProcessHubs,
  mockEvidenceSourcesToArray,
  mockEvidenceSnapshotsToArray,
  mockControlRecordsToArray,
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
  mockProcessHubs: {
    get: vi.fn().mockResolvedValue({ id: 'default' }),
    put: vi.fn().mockResolvedValue(undefined),
    toArray: vi.fn().mockResolvedValue([]),
  },
  mockEvidenceSourcesToArray: vi.fn().mockResolvedValue([]),
  mockEvidenceSnapshotsToArray: vi.fn().mockResolvedValue([]),
  mockControlRecordsToArray: vi.fn().mockResolvedValue([]),
  mockAddToSyncQueue: vi.fn().mockResolvedValue(undefined),
  mockGetPending: vi.fn().mockResolvedValue([]),
  mockRemoveFromQueue: vi.fn().mockResolvedValue(undefined),
  mockPruneSyncQueue: vi.fn().mockResolvedValue(0),
  mockSaveBlobProject: vi.fn().mockResolvedValue({ ok: true, etag: '"mock-etag"' }),
  mockLoadBlobProject: vi.fn().mockResolvedValue(null),
  mockLoadBlobMetadata: vi.fn().mockResolvedValue(null),
  mockListBlobProjects: vi.fn().mockResolvedValue([]),
  mockUpdateBlobIndex: vi.fn().mockResolvedValue(undefined),
  mockListBlobProcessHubs: vi.fn().mockResolvedValue([]),
  mockUpdateBlobProcessHubs: vi.fn().mockResolvedValue(undefined),
  mockListBlobEvidenceSnapshots: vi.fn().mockResolvedValue([]),
  mockSaveBlobEvidenceSnapshot: vi.fn().mockResolvedValue(undefined),
  // P4.2: conditional uploader replaces the unconditional variant
  mockUpdateBlobEvidenceSnapshotsConditional: vi
    .fn()
    .mockResolvedValue({ ok: true, etag: '"mock-etag"' }),
  mockListBlobEvidenceSources: vi.fn().mockResolvedValue([]),
  mockSaveBlobEvidenceSource: vi.fn().mockResolvedValue(undefined),
  mockUpdateBlobEvidenceSources: vi.fn().mockResolvedValue(undefined),
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
    processHubs: mockProcessHubs,
    evidenceSources: {
      put: vi.fn().mockResolvedValue(undefined),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ toArray: mockEvidenceSourcesToArray })),
      })),
      toArray: mockEvidenceSourcesToArray,
    },
    evidenceSnapshots: {
      put: vi.fn().mockResolvedValue(undefined),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ toArray: mockEvidenceSnapshotsToArray })),
      })),
      toArray: mockEvidenceSnapshotsToArray,
    },
    controlRecords: {
      put: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(1),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ toArray: mockControlRecordsToArray })),
      })),
    },
    controlReviews: {
      put: vi.fn().mockResolvedValue(undefined),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      })),
    },
    controlHandoffs: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      })),
    },
  },
  addToSyncQueue: mockAddToSyncQueue,
  getPendingSyncItems: mockGetPending,
  removeFromSyncQueue: mockRemoveFromQueue,
  pruneSyncQueue: mockPruneSyncQueue,
}));

// ---------------------------------------------------------------------------
// Mock: @variscout/core — buildProjectMetadata
// ---------------------------------------------------------------------------
vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    buildProjectMetadata: () => ({
      phase: 'scout',
      findingCounts: {},
      questionCounts: {},
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
  listBlobEvidenceSnapshots: mockListBlobEvidenceSnapshots,
  saveBlobEvidenceSnapshot: mockSaveBlobEvidenceSnapshot,
  // P4.2: conditional uploader replaces the unconditional variant in cloudSync.ts
  updateBlobEvidenceSnapshotsConditional: mockUpdateBlobEvidenceSnapshotsConditional,
  listBlobEvidenceSources: mockListBlobEvidenceSources,
  saveBlobEvidenceSource: mockSaveBlobEvidenceSource,
  updateBlobEvidenceSources: mockUpdateBlobEvidenceSources,
  saveBlobControlRecord: vi.fn().mockResolvedValue(undefined),
  listBlobControlRecords: vi.fn().mockResolvedValue([]),
  updateBlobSustainmentCatalog: vi.fn().mockResolvedValue(undefined),
  saveBlobControlReview: vi.fn().mockResolvedValue(undefined),
  saveBlobControlHandoff: vi.fn().mockResolvedValue(undefined),
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
function makeSnapshot(overrides: Partial<DocumentSnapshot> = {}): DocumentSnapshot {
  return {
    schemaVersion: 1,
    hubId: 'hub-1',
    hub: {
      id: 'hub-1',
      name: 'Test Hub',
      createdAt: 1714000000000,
      deletedAt: null,
    },
    project: {
      projectId: 'project-1',
      projectName: 'Snapshot project',
      rawData: [
        { value: 1, line: 'A' },
        { value: 2, line: 'B' },
        { value: 3, line: 'C' },
      ],
      outcome: 'value',
      factors: ['line'],
      specs: { usl: 10, lsl: 0 },
      analysisMode: 'standard',
      processContext: null,
    } as unknown as DocumentSnapshot['project'],
    analyze: {
      findings: [],
      categories: [],
      hypotheses: [],
      causalLinks: [],
      scopes: [],
    },
    canvas: {
      canonicalMap: {
        version: 1,
        nodes: [],
        tributaries: [],
        assignments: {},
        arrows: [],
        createdAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
      },
      outcomes: [],
      primaryScopeDimensions: [],
      canonicalMapVersion: 'v1',
    },
    improvementProject: null,
    ...overrides,
  };
}

const sampleProject = makeSnapshot();

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
    mockProjects.put.mockReset();
    mockProjects.put.mockResolvedValue(undefined);
    mockProjects.get.mockReset();
    mockProjects.get.mockResolvedValue(null);
    mockProjects.toArray.mockReset();
    mockProjects.toArray.mockResolvedValue([]);
    mockProjects.update.mockReset();
    mockProjects.update.mockResolvedValue(1);
    mockSyncState.put.mockReset();
    mockSyncState.put.mockResolvedValue(undefined);
    mockSyncState.get.mockReset();
    mockSyncState.get.mockResolvedValue(null);
    mockSyncState.update.mockReset();
    mockSyncState.update.mockResolvedValue(1);
    mockProcessHubs.get.mockReset();
    mockProcessHubs.get.mockResolvedValue({ id: 'default' });
    mockProcessHubs.put.mockReset();
    mockProcessHubs.put.mockResolvedValue(undefined);
    mockProcessHubs.toArray.mockReset();
    mockProcessHubs.toArray.mockResolvedValue([]);
    mockEvidenceSourcesToArray.mockReset();
    mockEvidenceSourcesToArray.mockResolvedValue([]);
    mockEvidenceSnapshotsToArray.mockReset();
    mockEvidenceSnapshotsToArray.mockResolvedValue([]);
    mockControlRecordsToArray.mockReset();
    mockControlRecordsToArray.mockResolvedValue([]);
    mockAddToSyncQueue.mockReset();
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockGetPending.mockReset();
    mockGetPending.mockResolvedValue([]);
    mockRemoveFromQueue.mockReset();
    mockRemoveFromQueue.mockResolvedValue(undefined);
    mockPruneSyncQueue.mockReset();
    mockPruneSyncQueue.mockResolvedValue(0);
    mockSaveBlobProject.mockReset();
    mockSaveBlobProject.mockResolvedValue({ ok: true, etag: '"mock-etag"' });
    mockLoadBlobProject.mockReset();
    mockLoadBlobProject.mockResolvedValue(null);
    mockLoadBlobMetadata.mockReset();
    mockLoadBlobMetadata.mockResolvedValue(null);
    mockListBlobProjects.mockReset();
    mockListBlobProjects.mockResolvedValue([]);
    mockUpdateBlobIndex.mockReset();
    mockUpdateBlobIndex.mockResolvedValue(undefined);
    mockListBlobProcessHubs.mockReset();
    mockListBlobProcessHubs.mockResolvedValue([]);
    mockUpdateBlobProcessHubs.mockReset();
    mockUpdateBlobProcessHubs.mockResolvedValue(undefined);
    mockListBlobEvidenceSnapshots.mockReset();
    mockListBlobEvidenceSnapshots.mockResolvedValue([]);
    mockSaveBlobEvidenceSnapshot.mockReset();
    mockSaveBlobEvidenceSnapshot.mockResolvedValue(undefined);
    mockUpdateBlobEvidenceSnapshotsConditional.mockReset();
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: true,
      etag: '"mock-etag"',
    });
    mockListBlobEvidenceSources.mockReset();
    mockListBlobEvidenceSources.mockResolvedValue([]);
    mockSaveBlobEvidenceSource.mockReset();
    mockSaveBlobEvidenceSource.mockResolvedValue(undefined);
    mockUpdateBlobEvidenceSources.mockReset();
    mockUpdateBlobEvidenceSources.mockResolvedValue(undefined);
    mockDispatch.mockReset();
    mockDispatch.mockResolvedValue(undefined);
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

    it('stores quick-analysis cloud saves as private to the creator', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockListBlobProjects.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useStorage(), { wrapper });

      await act(async () => {
        await result.current.saveProject(sampleProject, 'private-quick-analysis', 'personal');
      });

      expect(mockSaveBlobProject).toHaveBeenCalledWith(
        sampleProject,
        expect.any(String),
        expect.objectContaining({
          access: {
            ownerUserId: 'test-user',
            memberUserIds: ['test-user'],
            hubId: 'hub-1',
            projectId: null,
          },
        }),
        undefined
      );
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

    it('PO-8b: an empty server ETag is never replaced by a fabricated timestamp (phantom-412 fix)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      // markAsSynced only writes syncState when the project record exists
      mockProjects.get.mockResolvedValue({
        name: 'no-etag-project',
        location: 'personal',
        modified: new Date(),
        synced: false,
        data: sampleProject,
      });
      // PUT succeeds but returns no etag; the follow-up GET supplies the real one
      mockSaveBlobProject.mockResolvedValueOnce({ ok: true, etag: '' });
      mockLoadBlobProject.mockResolvedValueOnce({
        project: sampleProject,
        etag: '"recovered-etag"',
      });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProject(sampleProject, 'no-etag-project', 'personal');
      });

      // markAsSynced stored the RECOVERED etag — never a Date timestamp
      const syncPut = mockSyncState.put.mock.calls.at(-1)?.[0];
      expect(syncPut?.etag).toBe('"recovered-etag"');
      // negative control: the OLD fabrication stored an ISO timestamp here
      expect(syncPut?.etag).not.toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // -------------------------------------------------------------------------
  // PO-8b conflict seam
  // -------------------------------------------------------------------------
  describe('PO-8b conflict seam', () => {
    it('PO-8b negative control: a matching-ETag save writes silently — result saved, no conflict state', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSyncState.get.mockResolvedValue({
        name: 'clean-project',
        cloudId: 'cloud-1',
        lastSynced: '2026-06-01T00:00:00Z',
        etag: '"current-etag"',
      });
      mockSaveBlobProject.mockResolvedValueOnce({ ok: true, etag: '"next-etag"' });

      const { result } = renderHook(() => useStorage(), { wrapper });
      let saveResult: Awaited<ReturnType<typeof result.current.saveProject>> | undefined;
      await act(async () => {
        saveResult = await result.current.saveProject(sampleProject, 'clean-project', 'personal');
      });

      expect(saveResult).toEqual({ status: 'saved' });
      expect(result.current.pendingConflict).toBeNull();
      // the stored ETag rode as the If-Match precondition (4th saveBlobProject arg)
      expect(mockSaveBlobProject).toHaveBeenCalledWith(
        expect.anything(),
        'cloud-1',
        expect.anything(),
        '"current-etag"'
      );
    });

    it('PO-8b: a stale stored ETag conflicts via If-Match/412 alone — the retired pre-flight adds nothing (no metadata GET, no eager remote load)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSyncState.get.mockResolvedValue({
        name: 'stale-project',
        cloudId: 'cloud-2',
        lastSynced: '2026-06-01T00:00:00Z',
        etag: '"stale-etag"',
        baseStateJson: JSON.stringify(sampleProject), // would have armed the OLD pre-flight
      });
      mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProject(sampleProject, 'stale-project', 'personal');
      });

      expect(result.current.pendingConflict).toEqual({
        name: 'stale-project',
        location: 'personal',
      });
      // pre-flight retired: no loadBlobMetadata (getCloudModifiedDate) and no
      // loadBlobProject (eager remote fetch) during the SAVE path
      expect(mockLoadBlobMetadata).not.toHaveBeenCalled();
      expect(mockLoadBlobProject).not.toHaveBeenCalled();
    });

    it('PO-8b: dismissConflict clears the pending decision', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProject(sampleProject, 'deferred-project', 'personal');
      });
      expect(result.current.pendingConflict).not.toBeNull();

      act(() => {
        result.current.dismissConflict();
      });
      expect(result.current.pendingConflict).toBeNull();
    });

    it('PO-8b: reloadProjectFromCloud adopts the remote copy — Dexie cache + ETag + merge base refresh; conflict cleared', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const remote = makeSnapshot({
        project: {
          ...sampleProject.project,
          projectName: 'Remote version',
        } as DocumentSnapshot['project'],
      });
      mockSyncState.get.mockResolvedValue({
        name: 'conflicted-project',
        cloudId: 'cloud-3',
        lastSynced: '2026-06-01T00:00:00Z',
        etag: '"stale-etag"',
      });
      mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });
      mockLoadBlobProject.mockResolvedValueOnce({ project: remote, etag: '"fresh-etag"' });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProject(sampleProject, 'conflicted-project', 'personal');
      });
      expect(result.current.pendingConflict).not.toBeNull();

      let reloaded: DocumentSnapshot | null = null;
      await act(async () => {
        reloaded = await result.current.reloadProjectFromCloud('conflicted-project', 'personal');
      });

      expect(reloaded).toEqual(remote);
      expect(result.current.pendingConflict).toBeNull();
      expect(mockProjects.put).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'conflicted-project', data: remote })
      );
      expect(mockSyncState.update).toHaveBeenCalledWith(
        'conflicted-project',
        expect.objectContaining({
          etag: '"fresh-etag"',
          baseStateJson: JSON.stringify(remote),
        })
      );
    });

    it('PO-8b: a failed reload leaves the local copy untouched + surfaces an error notification', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSyncState.get.mockResolvedValue({
        name: 'ghost-project',
        cloudId: 'cloud-4',
        lastSynced: '2026-06-01T00:00:00Z',
        etag: '"e"',
      });
      mockLoadBlobProject.mockResolvedValueOnce(null); // blob gone

      const { result } = renderHook(() => useStorage(), { wrapper });
      let reloaded: DocumentSnapshot | null = sampleProject;
      await act(async () => {
        reloaded = await result.current.reloadProjectFromCloud('ghost-project', 'personal');
      });

      expect(reloaded).toBeNull();
      expect(
        result.current.notifications.some(
          n => n.type === 'error' && /cloud version/i.test(n.message)
        )
      ).toBe(true);
      expect(mockProjects.put).not.toHaveBeenCalled();
    });

    it('PO-8b: a reload whose LOCAL apply fails surfaces an error and never reports success (no unhandled rejection)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSyncState.get.mockResolvedValue({
        name: 'quota-project',
        cloudId: 'cloud-5',
        lastSynced: '2026-06-01T00:00:00Z',
        etag: '"e"',
      });
      mockLoadBlobProject.mockResolvedValueOnce({ project: sampleProject, etag: '"fresh"' });
      mockProjects.put.mockRejectedValueOnce(new Error('QuotaExceededError (simulated)'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let reloaded: DocumentSnapshot | null = sampleProject;
      await act(async () => {
        reloaded = await result.current.reloadProjectFromCloud('quota-project', 'personal');
      });

      expect(reloaded).toBeNull();
      expect(
        result.current.notifications.some(
          n => n.type === 'error' && /apply the cloud version/i.test(n.message)
        )
      ).toBe(true);
      // the failed apply never advanced the ETag/merge base
      expect(mockSyncState.update).not.toHaveBeenCalled();
    });

    it('PO-8b: two concurrent saves of the same document cannot interleave under the Web Lock', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      // functional LockManager: a real exclusive queue per lock name
      const queues = new Map<string, Promise<unknown>>();
      Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: {
          request: (lockName: string, _opts: unknown, cb: () => Promise<unknown>) => {
            const prev = queues.get(lockName) ?? Promise.resolve();
            const next = prev.then(() => cb());
            queues.set(
              lockName,
              next.catch(() => undefined)
            );
            return next;
          },
        },
      });

      // markAsSynced only writes syncState when the project record exists
      mockProjects.get.mockResolvedValue({
        name: 'same-doc',
        location: 'personal',
        modified: new Date(),
        synced: false,
        data: sampleProject,
      });

      const events: string[] = [];
      mockProjects.put.mockImplementation(async () => {
        events.push('idb-write');
      });
      mockSaveBlobProject.mockImplementation(async () => {
        events.push('put-start');
        await new Promise(resolve => setTimeout(resolve, 20));
        events.push('put-end');
        return { ok: true, etag: '"e"' };
      });
      mockSyncState.put.mockImplementation(async () => {
        events.push('mark-synced');
      });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await Promise.all([
          result.current.saveProject(sampleProject, 'same-doc', 'personal'),
          result.current.saveProject(sampleProject, 'same-doc', 'personal'),
        ]);
      });

      // tab B's wholesale write begins only AFTER tab A's full critical section
      expect(events).toEqual([
        'idb-write',
        'put-start',
        'put-end',
        'mark-synced',
        'idb-write',
        'put-start',
        'put-end',
        'mark-synced',
      ]);

      Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    });

    it('PO-8b: a document save preserves the Control-owned sustainment projection (no clobber)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const seededSustainment = {
        recordId: 'cr-1',
        ladderStep: 1,
        nextCheckSuggestedAt: '2026-07-01T00:00:00.000Z',
        status: 'verifying',
      };
      mockProjects.get.mockResolvedValue({
        name: 'control-project',
        location: 'personal',
        modified: new Date(),
        synced: true,
        data: sampleProject,
        meta: {
          phase: 'scout',
          findingCounts: {},
          questionCounts: {},
          lastViewedAt: {},
          sustainment: seededSustainment,
        } as unknown as ProjectMetadata,
      });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveProject(sampleProject, 'control-project', 'personal');
      });

      expect(mockProjects.put).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ sustainment: seededSustainment }),
        })
      );
    });

    it('PO-8b heal: an offline open recomputes stale aggregate-derived meta while PRESERVING sustainment', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const seededSustainment = {
        recordId: 'cr-1',
        ladderStep: 1,
        nextCheckSuggestedAt: '2026-07-01T00:00:00.000Z',
        status: 'verifying',
      };
      mockProjects.get.mockResolvedValue({
        name: 'heal-me',
        location: 'personal',
        modified: new Date(),
        synced: true,
        data: sampleProject,
        meta: {
          phase: 'improve', // stale — the mocked buildProjectMetadata recomputes 'scout'
          findingCounts: { stale: 99 },
          questionCounts: {},
          lastViewedAt: {},
          sustainment: seededSustainment,
        } as unknown as ProjectMetadata,
      });

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: DocumentSnapshot | null = null;
      await act(async () => {
        loaded = await result.current.loadProject('heal-me', 'personal');
      });

      expect(loaded).toEqual(sampleProject);
      expect(mockProjects.update).toHaveBeenCalledWith('heal-me', {
        meta: expect.objectContaining({ phase: 'scout', sustainment: seededSustainment }),
      });
    });

    it('PO-8b heal negative control: an up-to-date meta is NOT rewritten on open', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      // exactly what the mocked buildProjectMetadata recomputes (no sustainment seeded)
      mockProjects.get.mockResolvedValue({
        name: 'already-clean',
        location: 'personal',
        modified: new Date(),
        synced: true,
        data: sampleProject,
        meta: { phase: 'scout', findingCounts: {}, questionCounts: {}, lastViewedAt: {} },
      });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.loadProject('already-clean', 'personal');
      });

      expect(mockProjects.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // loadProject
  // -------------------------------------------------------------------------
  describe('loadProject', () => {
    it('loads from Blob Storage when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const cloudData = makeSnapshot({
        project: {
          ...sampleProject.project,
          rawData: [{ value: 42 }],
          specs: { usl: 100 },
        },
      });
      // db.syncState.get returns a cloudId so loadFromCloud can resolve the project
      mockSyncState.get.mockResolvedValueOnce({
        cloudId: 'uuid-remote-proj',
        lastSynced: '',
        etag: '',
      });
      // db.projects.get for conflict detection (no local record)
      mockProjects.get.mockResolvedValueOnce(null);
      // loadBlobProject returns cloud data (new shape: { project, etag })
      mockLoadBlobProject.mockResolvedValueOnce({ project: cloudData, etag: '"cloud-etag"' });

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
      const localData = makeSnapshot({
        project: {
          ...sampleProject.project,
          rawData: [{ value: 42 }],
          specs: { usl: 100 },
        },
      });
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

      const localData = makeSnapshot({
        project: {
          ...sampleProject.project,
          rawData: [{ value: 10 }, { value: 20 }],
          specs: { usl: 50, lsl: 5 },
        },
      });
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

      const projectWithSurveyMove = makeSnapshot({
        project: {
          ...sampleProject.project,
          processContext: { nextMove: 'Set LSL or USL for the mapped outcome.' },
        },
      });
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

      const localFallback = makeSnapshot({
        project: {
          ...sampleProject.project,
          rawData: [{ value: 99 }],
        },
      });
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

    it('does not fall back to cached local data when the cloud load is forbidden', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      const forbiddenLocalCopy = makeSnapshot({
        project: {
          ...sampleProject.project,
          rawData: [{ value: 403 }],
        },
      });
      mockSyncState.get.mockReset();
      mockSyncState.get.mockResolvedValue({
        cloudId: 'forbidden-cloud-id',
        lastSynced: '',
        etag: '',
      });
      mockProjects.get
        .mockResolvedValueOnce(null) // conflict detection
        .mockResolvedValueOnce({ data: forbiddenLocalCopy }); // must not be used as fallback
      mockLoadBlobProject.mockRejectedValueOnce(new Error('403 Forbidden'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let loaded: unknown = 'not-called';

      await act(async () => {
        loaded = await result.current.loadProject('forbidden-project', 'personal');
      });

      expect(loaded).toBeNull();
      expect(mockProjects.get).toHaveBeenCalledTimes(1);
      mockSyncState.get.mockReset();
      mockSyncState.get.mockResolvedValue(null);
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

    it('PO-8b: a cloud load refreshes the stored ETag + merge base (kills post-open false 412s)', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSyncState.get.mockResolvedValue({
        name: 'etag-refresh',
        cloudId: 'cloud-9',
        lastSynced: '2026-06-01T00:00:00Z',
        etag: '"stale-etag"',
      });
      mockLoadBlobProject.mockResolvedValueOnce({ project: sampleProject, etag: '"fresh-etag"' });

      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.loadProject('etag-refresh', 'personal');
      });

      expect(mockSyncState.update).toHaveBeenCalledWith(
        'etag-refresh',
        expect.objectContaining({
          etag: '"fresh-etag"',
          baseStateJson: JSON.stringify(sampleProject),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // listProjects
  // -------------------------------------------------------------------------
  describe('listProjects', () => {
    it('returns only local projects when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        {
          name: 'local-1',
          location: 'personal',
          modified: new Date('2026-01-01'),
          data: sampleProject,
        },
        {
          name: 'local-2',
          location: 'personal',
          modified: new Date('2026-01-15'),
          data: sampleProject,
        },
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
        {
          name: 'shared',
          location: 'personal',
          modified: new Date('2026-01-01'),
          data: sampleProject,
        },
        {
          name: 'local-only',
          location: 'personal',
          modified: new Date('2026-02-01'),
          data: sampleProject,
        },
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

    it('excludes cloud projects where the current user is not owner or invited', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([]);
      mockListBlobProjects.mockResolvedValueOnce([
        {
          projectId: 'visible-id',
          name: 'visible',
          updated: '2026-02-01T00:00:00.000Z',
          access: {
            ownerUserId: 'owner-user',
            memberUserIds: ['owner-user', 'test-user'],
            hubId: 'hub-1',
            projectId: 'ip-1',
          },
        },
        {
          projectId: 'hidden-id',
          name: 'hidden',
          updated: '2026-02-01T00:00:00.000Z',
          access: {
            ownerUserId: 'other-user',
            memberUserIds: ['other-user'],
            hubId: 'hub-2',
            projectId: 'ip-2',
          },
        },
      ]);

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects.map(project => project.name)).toEqual(['visible']);
    });

    it('returns local projects when cloud listing fails', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        {
          name: 'safe-local',
          location: 'personal',
          modified: new Date('2026-02-01'),
          data: sampleProject,
        },
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

    it('does not expose cached local projects when the cloud listing is forbidden', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      mockProjects.toArray.mockResolvedValueOnce([
        {
          name: 'cached-but-forbidden',
          location: 'personal',
          modified: new Date('2026-02-01'),
          data: sampleProject,
        },
      ]);
      mockListBlobProjects.mockRejectedValueOnce(new Error('403 Forbidden'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let projects: CloudProject[] = [];

      await act(async () => {
        projects = await result.current.listProjects();
      });

      expect(projects).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Server-enforced storage boundary for hub-backed reads
  // -------------------------------------------------------------------------
  describe('hub-backed reads', () => {
    const localHub = {
      id: 'hub-local',
      name: 'Cached Hub',
      createdAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').ProcessHub;

    const localSource = {
      id: 'src-local',
      hubId: 'hub-1',
      name: 'Cached Source',
      cadence: 'daily' as const,
      createdAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').EvidenceSource;

    const localSnapshot = {
      id: 'snap-local',
      hubId: 'hub-1',
      sourceId: 'src-1',
      capturedAt: '2026-05-01T00:00:00Z',
      rowCount: 1,
      origin: 'evidence-source:src-1',
      importedAt: 1000,
      createdAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').EvidenceSnapshot;

    const localControlRecord = {
      id: 'control-local',
      hubId: 'hub-1',
      projectId: 'investigation-1',
      title: 'Cached Control',
      status: 'verifying',
      improvementDate: '2026-06-01T00:00:00.000Z',
      baseline: {
        capturedAt: 1000,
        window: {
          startISO: '2026-04-01T00:00:00.000Z',
          endISO: '2026-05-31T23:59:59.999Z',
        },
        measure: 'fill_weight',
        n: 42,
        mean: 100.2,
        sigma: 0.8,
      },
      ladder: [7, 30, 90, 180],
      ladderStep: 0,
      nextCheckSuggestedAt: '2026-06-08T00:00:00.000Z',
      lastEvaluatedSnapshotId: undefined,
      createdAt: 1000,
      updatedAt: 1000,
      deletedAt: null,
    } as import('@variscout/core').ControlRecord;

    it('returns cached hub data while offline without making cloud requests', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      mockEvidenceSourcesToArray.mockResolvedValueOnce([localSource]);

      const { result } = renderHook(() => useStorage(), { wrapper });
      let sources: import('@variscout/core').EvidenceSource[] = [];

      await act(async () => {
        sources = await result.current.listEvidenceSources('hub-1');
      });

      expect(sources).toEqual([localSource]);
      expect(mockListBlobEvidenceSources).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not return cached Workspaces when the cloud catalog is forbidden', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockProcessHubs.toArray.mockResolvedValueOnce([localHub]);
      mockListBlobProcessHubs.mockRejectedValueOnce(new Error('403 Forbidden'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let hubs: import('@variscout/core').ProcessHub[] = [];

      await act(async () => {
        hubs = await result.current.listProcessHubs();
      });

      expect(hubs).toEqual([]);
    });

    it('does not return cached evidence sources when the cloud source catalog is forbidden', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockEvidenceSourcesToArray.mockResolvedValueOnce([localSource]);
      mockListBlobEvidenceSources.mockRejectedValueOnce(new Error('403 Forbidden'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let sources: import('@variscout/core').EvidenceSource[] = [];

      await act(async () => {
        sources = await result.current.listEvidenceSources('hub-1');
      });

      expect(sources).toEqual([]);
    });

    it('does not return cached evidence snapshots when the cloud snapshot catalog is forbidden', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockEvidenceSnapshotsToArray.mockResolvedValueOnce([localSnapshot]);
      mockListBlobEvidenceSnapshots.mockRejectedValueOnce(new Error('403 Forbidden'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let snapshots: import('@variscout/core').EvidenceSnapshot[] = [];

      await act(async () => {
        snapshots = await result.current.listEvidenceSnapshots('hub-1', 'src-1');
      });

      expect(snapshots).toEqual([]);
    });

    it('does not return cached control records when the cloud control catalog is forbidden', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockControlRecordsToArray.mockResolvedValueOnce([localControlRecord]);
      const { listBlobControlRecords } = await import('../blobClient');
      vi.mocked(listBlobControlRecords).mockRejectedValueOnce(new Error('403 Forbidden'));

      const { result } = renderHook(() => useStorage(), { wrapper });
      let records: import('@variscout/core').ControlRecord[] = [];

      await act(async () => {
        records = await result.current.listControlRecords('hub-1');
      });

      expect(records).toEqual([]);
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

    it('also syncs to cloud when online with team features', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const { result } = renderHook(() => useStorage(), { wrapper });
      await act(async () => {
        await result.current.saveEvidenceSource(sampleSource);
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        kind: 'EVIDENCE_SOURCE_ADD',
        hubId: sampleSource.hubId,
        source: sampleSource,
      });
      expect(mockSaveBlobEvidenceSource).toHaveBeenCalled();
      expect(mockUpdateBlobEvidenceSources).toHaveBeenCalled();
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
      expect(mockDispatch).toHaveBeenCalledWith({
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: sampleSnapshot.hubId,
        snapshot: sampleSnapshot,
        provenance: [],
      });
      expect(mockSaveBlobEvidenceSnapshot).toHaveBeenCalled();
      // P4.2: catalog update now uses ETag-conditional variant
      expect(mockUpdateBlobEvidenceSnapshotsConditional).toHaveBeenCalled();
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
          project: sampleProject,
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
      mockSaveBlobProject.mockResolvedValue({ ok: true, etag: '"mock-etag"' });
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

    it('PO-8b: a 412 ETag conflict surfaces the reload-or-branch decision instead of the silent auto-fork', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      mockSaveBlobProject.mockResolvedValueOnce({ ok: false, reason: 'precondition-failed' });

      const { result } = renderHook(() => useStorage(), { wrapper });

      let saveResult: Awaited<ReturnType<typeof result.current.saveProject>> | undefined;
      await act(async () => {
        saveResult = await result.current.saveProject(
          sampleProject,
          'conflicted-project',
          'personal'
        );
      });

      expect(saveResult).toEqual({ status: 'conflict' });
      expect(result.current.pendingConflict).toEqual({
        name: 'conflicted-project',
        location: 'personal',
      });
      expect(result.current.syncStatus.status).toBe('conflict');
      // the silent auto-fork is GONE: exactly ONE blob PUT — no "(conflict copy)" save
      expect(mockSaveBlobProject).toHaveBeenCalledTimes(1);
      expect(result.current.notifications.some(n => n.message.includes('(conflict copy)'))).toBe(
        false
      );
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
