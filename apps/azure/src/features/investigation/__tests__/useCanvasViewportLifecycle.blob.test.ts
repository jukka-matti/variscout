// vi.mock() MUST precede all imports (rules/testing.md).
vi.mock('@variscout/stores', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/stores')>();
  return {
    ...actual,
    persistCanvasViewport: vi.fn().mockResolvedValue(undefined),
    rehydrateCanvasViewport: vi.fn().mockResolvedValue(undefined),
    getLocalViewportUpdatedAt: vi.fn().mockResolvedValue(0),
  };
});

vi.mock('../../../services/blobClient', () => ({
  loadBlobCanvasViewport: vi.fn().mockResolvedValue(null),
  saveBlobCanvasViewport: vi.fn().mockResolvedValue({ ok: true, etag: '"etag-v1"' }),
}));

vi.mock('../../../lib/appInsights', () => ({
  safeTrackEvent: vi.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCanvasViewportInitialState,
  getLocalViewportUpdatedAt,
  persistCanvasViewport,
  rehydrateCanvasViewport,
  useCanvasViewportStore,
  type ProcessHubId,
} from '@variscout/stores';
import { loadBlobCanvasViewport, saveBlobCanvasViewport } from '../../../services/blobClient';
import type { LoadedViewport } from '../../../services/blobClient';
import { safeTrackEvent } from '../../../lib/appInsights';
import { useCanvasViewportLifecycle } from '../useCanvasViewportLifecycle';

const mockPersist = vi.mocked(persistCanvasViewport);
vi.mocked(rehydrateCanvasViewport); // mocked to no-op; called implicitly by lifecycle
const mockGetLocalUpdatedAt = vi.mocked(getLocalViewportUpdatedAt);
const mockLoadBlob = vi.mocked(loadBlobCanvasViewport);
const mockSaveBlob = vi.mocked(saveBlobCanvasViewport);
const mockTrackEvent = vi.mocked(safeTrackEvent);

const HUB_ID = 'hub-blob-test' as ProcessHubId;

const BLOB_SNAPSHOT: LoadedViewport['snapshot'] = {
  zoom: 2,
  pan: { x: 50, y: -30 },
  currentLevel: 'l1',
  nodePositions: { 'step-1': { x: 100, y: 200 } },
  groupByTributary: true,
  updatedAt: 1700001000000,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  useCanvasViewportStore.setState(getCanvasViewportInitialState());

  // Default: Blob returns null (no remote state).
  mockLoadBlob.mockResolvedValue(null);
  mockSaveBlob.mockResolvedValue({ ok: true, etag: '"etag-v1"' });
  mockGetLocalUpdatedAt.mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCanvasViewportLifecycle — Blob sync (Azure)', () => {
  // ── Round-trip: write → persist → fresh mount → recover from Blob ─────────

  it('round-trip: applies Blob state to store when blob is newer than Dexie', async () => {
    mockGetLocalUpdatedAt.mockResolvedValue(1699000000000); // older than blob
    mockLoadBlob.mockResolvedValue({ snapshot: BLOB_SNAPSHOT, etag: '"etag-v2"' });

    await act(async () => {
      renderHook(() => useCanvasViewportLifecycle(HUB_ID));
      // Flush promises so the async Blob load runs.
      await Promise.resolve();
      await Promise.resolve();
    });

    const vp = useCanvasViewportStore.getState().viewports[HUB_ID];
    expect(vp).toBeDefined();
    expect(vp?.zoom).toBe(2);
    expect(vp?.pan).toEqual({ x: 50, y: -30 });
    expect(vp?.currentLevel).toBe('l1');
    expect(vp?.groupByTributary).toBe(true);

    // Should write back to Dexie for offline use.
    expect(mockPersist).toHaveBeenCalledWith(HUB_ID);
  });

  it('does NOT apply Blob state when Dexie is newer', async () => {
    mockGetLocalUpdatedAt.mockResolvedValue(1800000000000); // newer than blob
    mockLoadBlob.mockResolvedValue({ snapshot: BLOB_SNAPSHOT, etag: '"etag-v2"' });

    await act(async () => {
      renderHook(() => useCanvasViewportLifecycle(HUB_ID));
      await Promise.resolve();
      await Promise.resolve();
    });

    // Store should NOT have been updated with blob viewport.
    const vp = useCanvasViewportStore.getState().viewports[HUB_ID];
    expect(vp?.zoom).toBeUndefined(); // store is still at initial default

    // Dexie write-back should NOT be triggered.
    expect(mockPersist).not.toHaveBeenCalled();
  });

  // ── Multi-device: two instances read from same Blob ───────────────────────

  it('multi-device: fresh mount picks up state written by another device', async () => {
    const remoteViewport: LoadedViewport = {
      snapshot: {
        zoom: 3,
        pan: { x: 10, y: 10 },
        currentLevel: 'l2',
        nodePositions: {},
        groupByTributary: false,
        updatedAt: 1750000000000,
      },
      etag: '"device-b-etag"',
    };
    mockGetLocalUpdatedAt.mockResolvedValue(0); // no local state
    mockLoadBlob.mockResolvedValue(remoteViewport);

    await act(async () => {
      renderHook(() => useCanvasViewportLifecycle(HUB_ID));
      await Promise.resolve();
      await Promise.resolve();
    });

    const vp = useCanvasViewportStore.getState().viewports[HUB_ID];
    expect(vp?.zoom).toBe(3);
    expect(vp?.pan).toEqual({ x: 10, y: 10 });
  });

  // ── Mutation: debounced save to both Dexie and Blob ───────────────────────

  it('debounced mutation writes to both Dexie and Blob after 500ms', async () => {
    await act(async () => {
      renderHook(() => useCanvasViewportLifecycle(HUB_ID));
      await Promise.resolve();
      await Promise.resolve();
    });

    mockPersist.mockClear();
    mockSaveBlob.mockClear();

    // Trigger a viewport change.
    act(() => {
      useCanvasViewportStore.getState().setZoom(HUB_ID, 4);
    });

    expect(mockPersist).not.toHaveBeenCalled();
    expect(mockSaveBlob).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(mockPersist).toHaveBeenCalledWith(HUB_ID);
    expect(mockSaveBlob).toHaveBeenCalledOnce();

    const [calledHubId, snapshot, priorEtag] = mockSaveBlob.mock.calls[0];
    expect(calledHubId).toBe(HUB_ID);
    expect(snapshot.zoom).toBe(4);
    expect(typeof snapshot.updatedAt).toBe('number');
    // On first write, priorEtag is null (no blob loaded yet).
    expect(priorEtag).toBeNull();
  });

  // ── ETag conflict: precondition-failed → re-fetch, apply, update etagRef ─

  it('ETag conflict: precondition-failed → telemetry logged, re-fetches blob', async () => {
    // Blob initially returns null on mount.
    mockLoadBlob.mockResolvedValue(null);

    await act(async () => {
      renderHook(() => useCanvasViewportLifecycle(HUB_ID));
      await Promise.resolve();
      await Promise.resolve();
    });

    mockPersist.mockClear();
    mockLoadBlob.mockClear();
    mockSaveBlob.mockClear();

    // Simulate a conflict on the PUT.
    mockSaveBlob.mockResolvedValueOnce({
      ok: false,
      reason: 'precondition-failed',
      status: 412,
      message: 'Precondition Failed',
    });

    // After conflict, loadBlobCanvasViewport is called again.
    const conflictBlob: LoadedViewport = {
      snapshot: {
        zoom: 5,
        pan: { x: 0, y: 0 },
        currentLevel: 'l2',
        nodePositions: {},
        groupByTributary: false,
        updatedAt: 1800000000000,
      },
      etag: '"etag-winner"',
    };
    mockLoadBlob.mockResolvedValueOnce(conflictBlob);

    // Trigger a viewport change.
    act(() => {
      useCanvasViewportStore.getState().setZoom(HUB_ID, 1.5);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Telemetry fired — structural only, no PII.
    expect(mockTrackEvent).toHaveBeenCalledOnce();
    const [eventName, props] = mockTrackEvent.mock.calls[0];
    expect(eventName).toBe('canvas-viewport-sync-conflict');
    expect(props).not.toHaveProperty('hubId', HUB_ID); // hubId must be redacted

    // Re-fetch was called.
    expect(mockLoadBlob).toHaveBeenCalledOnce();

    // Store should reflect winning blob state.
    const vp = useCanvasViewportStore.getState().viewports[HUB_ID];
    expect(vp?.zoom).toBe(5);
  });

  // ── No blob write when viewport absent from store ─────────────────────────

  it('skips blob write when hub viewport not in store', async () => {
    await act(async () => {
      renderHook(() => useCanvasViewportLifecycle(HUB_ID));
      await Promise.resolve();
      await Promise.resolve();
    });

    mockSaveBlob.mockClear();

    // Change viewMode — no viewport entry for this hub in store.
    act(() => {
      useCanvasViewportStore.getState().setViewMode('wall');
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Dexie persisted (viewMode is a flat field).
    expect(mockPersist).toHaveBeenCalled();
    // Blob NOT written because viewports[HUB_ID] is undefined.
    expect(mockSaveBlob).not.toHaveBeenCalled();
  });

  // ── Cancelled effect: no async ops after unmount ──────────────────────────

  it('does not update state after unmount (cancelled guard)', async () => {
    let resolveLoad: (val: LoadedViewport | null) => void = () => undefined;
    mockLoadBlob.mockImplementationOnce(
      () =>
        new Promise<LoadedViewport | null>(resolve => {
          resolveLoad = resolve;
        })
    );

    const { unmount } = renderHook(() => useCanvasViewportLifecycle(HUB_ID));

    unmount();

    await act(async () => {
      resolveLoad({ snapshot: BLOB_SNAPSHOT, etag: '"late-etag"' });
      await Promise.resolve();
      await Promise.resolve();
    });

    // Store must not have been updated.
    const vp = useCanvasViewportStore.getState().viewports[HUB_ID];
    expect(vp).toBeUndefined();
  });
});
