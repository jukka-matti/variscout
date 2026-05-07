// cloudSync.etag.test.ts
// TDD for P4.2: ETag-conditional uploader + paste-conflict event channel.
//
// These tests mock `blobClient` at module level (before imports) so the
// factory closure contains the mock refs without hoisting issues.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock fns (available inside vi.mock factories) ──────────────────

const {
  mockListBlobEvidenceSnapshots,
  mockSaveBlobEvidenceSnapshot,
  mockUpdateBlobEvidenceSnapshotsConditional,
} = vi.hoisted(() => ({
  mockListBlobEvidenceSnapshots: vi.fn(),
  mockSaveBlobEvidenceSnapshot: vi.fn(),
  mockUpdateBlobEvidenceSnapshotsConditional: vi.fn(),
}));

// ── Mocks (before all imports) ─────────────────────────────────────────────

vi.mock('../blobClient', () => ({
  // Functions used by other cloudSync exports — keep as no-ops to avoid errors
  saveBlobProject: vi.fn().mockResolvedValue(undefined),
  loadBlobProject: vi.fn().mockResolvedValue(null),
  loadBlobMetadata: vi.fn().mockResolvedValue(null),
  listBlobProjects: vi.fn().mockResolvedValue([]),
  updateBlobIndex: vi.fn().mockResolvedValue(undefined),
  listBlobProcessHubs: vi.fn().mockResolvedValue([]),
  updateBlobProcessHubs: vi.fn().mockResolvedValue(undefined),
  listBlobEvidenceSources: vi.fn().mockResolvedValue([]),
  saveBlobEvidenceSource: vi.fn().mockResolvedValue(undefined),
  updateBlobEvidenceSources: vi.fn().mockResolvedValue(undefined),
  // The unconditional variant (no longer called after P4.2 — listed for completeness)
  updateBlobEvidenceSnapshots: vi.fn().mockResolvedValue(undefined),
  // The two functions under test
  listBlobEvidenceSnapshots: mockListBlobEvidenceSnapshots,
  saveBlobEvidenceSnapshot: mockSaveBlobEvidenceSnapshot,
  updateBlobEvidenceSnapshotsConditional: mockUpdateBlobEvidenceSnapshotsConditional,
  saveBlobSustainmentRecord: vi.fn().mockResolvedValue(undefined),
  listBlobSustainmentRecords: vi.fn().mockResolvedValue([]),
  updateBlobSustainmentCatalog: vi.fn().mockResolvedValue(undefined),
  saveBlobSustainmentReview: vi.fn().mockResolvedValue(undefined),
  saveBlobControlHandoff: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../db/schema', () => ({
  db: {
    projects: {
      get: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(1),
    },
    syncState: {
      get: vi.fn().mockResolvedValue(null),
    },
    processHubs: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
  addToSyncQueue: vi.fn().mockResolvedValue(undefined),
  getPendingSyncItems: vi.fn().mockResolvedValue([]),
  removeFromSyncQueue: vi.fn().mockResolvedValue(undefined),
  pruneSyncQueue: vi.fn().mockResolvedValue(0),
}));

// ── Subject under test (after mocks) ──────────────────────────────────────

import { saveEvidenceSnapshotToCloud, subscribePasteConflict } from '../cloudSync';
import type { PasteConflictEvent } from '../cloudSync';
import type { EvidenceSnapshot } from '@variscout/core';

// ── Fixtures ───────────────────────────────────────────────────────────────

const HUB_ID = 'hub-001';
const SOURCE_ID = 'src-abc';
const SNAP_ID = 'snap-xyz';

function makeSnapshot(): EvidenceSnapshot {
  return {
    id: SNAP_ID,
    hubId: HUB_ID,
    sourceId: SOURCE_ID,
    name: 'Test snapshot',
    columnNames: ['x', 'y'],
    rows: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000001,
    status: 'active',
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('saveEvidenceSnapshotToCloud — ETag-conditional upload (P4.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty existing catalog
    mockListBlobEvidenceSnapshots.mockResolvedValue([]);
    mockSaveBlobEvidenceSnapshot.mockResolvedValue(undefined);
  });

  // ── Happy path ─────────────────────────────────────────────────────────

  it('calls updateBlobEvidenceSnapshotsConditional (not the unconditional variant)', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: true,
      etag: '"etag-v1"',
    });

    await saveEvidenceSnapshotToCloud('token', makeSnapshot());

    expect(mockUpdateBlobEvidenceSnapshotsConditional).toHaveBeenCalledTimes(1);
  });

  it('passes hubId, sourceId, and the updated catalog to the conditional uploader', async () => {
    const snapshot = makeSnapshot();
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: true,
      etag: '"etag-v1"',
    });

    await saveEvidenceSnapshotToCloud('token', snapshot);

    const [calledHubId, calledSourceId, calledCatalog] =
      mockUpdateBlobEvidenceSnapshotsConditional.mock.calls[0];

    expect(calledHubId).toBe(HUB_ID);
    expect(calledSourceId).toBe(SOURCE_ID);
    expect(calledCatalog).toEqual([snapshot]);
  });

  it('resolves without throwing when conditional uploader returns { ok: true }', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: true,
      etag: '"etag-v2"',
    });

    await expect(saveEvidenceSnapshotToCloud('token', makeSnapshot())).resolves.toBeUndefined();
  });

  // ── Concurrency-exhausted path ─────────────────────────────────────────

  it('emits a paste-conflict event when conditional uploader returns concurrency-exhausted', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: false,
      reason: 'concurrency-exhausted',
    });

    const received: PasteConflictEvent[] = [];
    const unsub = subscribePasteConflict(evt => received.push(evt));

    await saveEvidenceSnapshotToCloud('token', makeSnapshot());

    unsub();

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual<PasteConflictEvent>({
      kind: 'paste-conflict',
      hubId: HUB_ID,
      sourceId: SOURCE_ID,
      snapshotId: SNAP_ID,
    });
  });

  it('does NOT throw when concurrency-exhausted — local Dexie write already succeeded', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: false,
      reason: 'concurrency-exhausted',
    });

    const unsub = subscribePasteConflict(() => {});
    await expect(saveEvidenceSnapshotToCloud('token', makeSnapshot())).resolves.toBeUndefined();
    unsub();
  });

  it('does NOT fire a conflict event for a successful upload', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: true,
      etag: '"etag-v3"',
    });

    const received: PasteConflictEvent[] = [];
    const unsub = subscribePasteConflict(evt => received.push(evt));

    await saveEvidenceSnapshotToCloud('token', makeSnapshot());

    unsub();

    expect(received).toHaveLength(0);
  });

  it('unsubscribe stops future conflict events from reaching the handler', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: false,
      reason: 'concurrency-exhausted',
    });

    const received: PasteConflictEvent[] = [];
    const unsub = subscribePasteConflict(evt => received.push(evt));
    unsub(); // unsubscribe BEFORE the upload

    await saveEvidenceSnapshotToCloud('token', makeSnapshot());

    expect(received).toHaveLength(0);
  });

  // ── Network / auth error paths ─────────────────────────────────────────

  it('throws a CloudSyncUnavailableError-like error when conditional uploader returns network reason', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: false,
      reason: 'network',
    });

    await expect(saveEvidenceSnapshotToCloud('token', makeSnapshot())).rejects.toThrow();
  });

  it('throws when conditional uploader returns auth reason', async () => {
    mockUpdateBlobEvidenceSnapshotsConditional.mockResolvedValue({
      ok: false,
      reason: 'auth',
    });

    await expect(saveEvidenceSnapshotToCloud('token', makeSnapshot())).rejects.toThrow();
  });
});
