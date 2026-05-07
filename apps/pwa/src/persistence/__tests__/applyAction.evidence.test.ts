// apps/pwa/src/persistence/__tests__/applyAction.evidence.test.ts
//
// F3.5 P1.3 — tests for EVIDENCE_ADD_SNAPSHOT + EVIDENCE_ARCHIVE_SNAPSHOT handlers
// in the PWA applyAction dispatcher.
//
// Coverage:
//   1. EVIDENCE_ADD_SNAPSHOT inserts snapshot + provenance atomically
//   2. EVIDENCE_ADD_SNAPSHOT with replacedSnapshotId cascades deletedAt to old
//      snapshot + its provenance rows
//   3. EVIDENCE_ADD_SNAPSHOT rolls back on transaction failure (no partial state)
//   4. EVIDENCE_ARCHIVE_SNAPSHOT cascades deletedAt to provenance
//   5. EVIDENCE_ARCHIVE_SNAPSHOT is idempotent on a missing snapshot
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB
// polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EvidenceSnapshot, RowProvenanceTag } from '@variscout/core/evidenceSources';
import type { HubAction } from '@variscout/core/actions';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/**
 * Build an EvidenceSnapshot with deterministic literal values.
 * capturedAt is an ISO 8601 string (data-time, not wall-clock).
 */
function makeEvidenceSnapshot(
  id: string,
  hubId: string,
  overrides: Partial<EvidenceSnapshot> = {}
): EvidenceSnapshot {
  return {
    id,
    hubId,
    sourceId: 'src-1',
    capturedAt: '2024-04-25T00:00:00.000Z',
    rowCount: 10,
    origin: 'paste',
    importedAt: 1714000000000,
    createdAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Build a RowProvenanceTag with deterministic literal values.
 * snapshotId starts as '' (the placeholder that the handler is supposed to fill).
 */
function makeProvenanceTag(
  id: string,
  rowKey: string,
  overrides: Partial<RowProvenanceTag> = {}
): RowProvenanceTag {
  return {
    id,
    snapshotId: '', // placeholder — handler populates this
    rowKey,
    source: 'src-1',
    joinKey: 'batch_id',
    createdAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear tables touched by these handlers before each test.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.evidenceSnapshots.clear();
  await db.rowProvenance.clear();
});

afterEach(async () => {
  await db.evidenceSnapshots.clear();
  await db.rowProvenance.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// EVIDENCE_ADD_SNAPSHOT
// ---------------------------------------------------------------------------

describe('applyAction — EVIDENCE_ADD_SNAPSHOT', () => {
  it('inserts snapshot + provenance atomically with snapshotId populated on every tag', async () => {
    const snapshot = makeEvidenceSnapshot('snapshot-1', 'hub-1');
    const tags = [
      makeProvenanceTag('tag-1a', '0'),
      makeProvenanceTag('tag-1b', '1'),
      makeProvenanceTag('tag-1c', '2'),
    ];

    const action: HubAction = {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-1',
      snapshot,
      provenance: tags,
    };

    await applyAction(db, action);

    // Snapshot inserted.
    const persistedSnapshot = await db.evidenceSnapshots.get('snapshot-1');
    expect(persistedSnapshot).toBeDefined();
    expect(persistedSnapshot?.id).toBe('snapshot-1');
    expect(persistedSnapshot?.hubId).toBe('hub-1');
    expect(persistedSnapshot?.deletedAt).toBeNull();

    // All 3 tags inserted with snapshotId populated.
    const persistedTagCount = await db.rowProvenance
      .where('snapshotId')
      .equals('snapshot-1')
      .count();
    expect(persistedTagCount).toBe(3);

    // Verify every tag has snapshotId === 'snapshot-1' (not the '' placeholder).
    const persistedTags = await db.rowProvenance.where('snapshotId').equals('snapshot-1').toArray();
    for (const tag of persistedTags) {
      expect(tag.snapshotId).toBe('snapshot-1');
    }
  });

  it('inserts a snapshot with no provenance tags (empty provenance array)', async () => {
    const snapshot = makeEvidenceSnapshot('snapshot-empty', 'hub-1');

    await applyAction(db, {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-1',
      snapshot,
      provenance: [],
    });

    expect(await db.evidenceSnapshots.get('snapshot-empty')).toBeDefined();
    expect(await db.rowProvenance.count()).toBe(0);
  });

  it('cascades deletedAt to old snapshot + its provenance when replacedSnapshotId is set', async () => {
    // Step 1: pre-seed the old snapshot with 2 provenance tags.
    const oldSnapshot = makeEvidenceSnapshot('snapshot-old', 'hub-2');
    const oldTags = [makeProvenanceTag('tag-old-a', '0'), makeProvenanceTag('tag-old-b', '1')];

    await applyAction(db, {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-2',
      snapshot: oldSnapshot,
      provenance: oldTags,
    });

    // Verify pre-seed.
    expect(await db.evidenceSnapshots.get('snapshot-old')).toBeDefined();
    expect(await db.rowProvenance.where('snapshotId').equals('snapshot-old').count()).toBe(2);

    // Step 2: dispatch a new snapshot that replaces the old one.
    const newSnapshot = makeEvidenceSnapshot('snapshot-new', 'hub-2', {
      capturedAt: '2024-04-26T00:00:00.000Z',
      importedAt: 1714000001000,
      createdAt: 1714000001000,
    });
    const newTag = makeProvenanceTag('tag-new-a', '2');

    await applyAction(db, {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-2',
      snapshot: newSnapshot,
      provenance: [newTag],
      replacedSnapshotId: 'snapshot-old',
    });

    // Old snapshot must have deletedAt set.
    const archivedSnapshot = await db.evidenceSnapshots.get('snapshot-old');
    expect(typeof archivedSnapshot?.deletedAt).toBe('number');

    // New snapshot must NOT have deletedAt set.
    const newPersistedSnapshot = await db.evidenceSnapshots.get('snapshot-new');
    expect(newPersistedSnapshot?.deletedAt).toBeNull();

    // Old tags must have deletedAt set.
    const archivedTags = await db.rowProvenance
      .where('snapshotId')
      .equals('snapshot-old')
      .toArray();
    expect(archivedTags).toHaveLength(2);
    for (const tag of archivedTags) {
      expect(typeof tag.deletedAt).toBe('number');
    }

    // New tag must NOT have deletedAt set and must have snapshotId = 'snapshot-new'.
    const newPersistedTag = await db.rowProvenance.get('tag-new-a');
    expect(newPersistedTag?.deletedAt).toBeNull();
    expect(newPersistedTag?.snapshotId).toBe('snapshot-new');
  });

  it('rolls back on transaction failure — no partial state (snapshot not inserted)', async () => {
    const snapshot = makeEvidenceSnapshot('snapshot-rollback', 'hub-3');
    const tags = [makeProvenanceTag('tag-rb-a', '0'), makeProvenanceTag('tag-rb-b', '1')];

    // Force the transaction to fail mid-write by rejecting bulkPut on rowProvenance.
    const spy = vi
      .spyOn(db.rowProvenance, 'bulkPut')
      .mockRejectedValueOnce(new Error('forced bulkPut failure'));

    await expect(
      applyAction(db, {
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: 'hub-3',
        snapshot,
        provenance: tags,
      })
    ).rejects.toThrow('forced bulkPut failure');

    spy.mockRestore();

    // Transaction must have rolled back — snapshot not persisted.
    expect(await db.evidenceSnapshots.get('snapshot-rollback')).toBeUndefined();
    // No provenance tags either.
    expect(await db.rowProvenance.count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// EVIDENCE_ARCHIVE_SNAPSHOT
// ---------------------------------------------------------------------------

describe('applyAction — EVIDENCE_ARCHIVE_SNAPSHOT', () => {
  it('cascades deletedAt to the snapshot and all its provenance tags', async () => {
    // Pre-seed: snapshot + 2 tags via EVIDENCE_ADD_SNAPSHOT.
    const snapshot = makeEvidenceSnapshot('snapshot-arc', 'hub-4');
    const tags = [makeProvenanceTag('tag-arc-a', '0'), makeProvenanceTag('tag-arc-b', '1')];

    await applyAction(db, {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-4',
      snapshot,
      provenance: tags,
    });

    // Dispatch archive.
    await applyAction(db, {
      kind: 'EVIDENCE_ARCHIVE_SNAPSHOT',
      snapshotId: 'snapshot-arc',
    });

    // Snapshot must have deletedAt set.
    const archivedSnapshot = await db.evidenceSnapshots.get('snapshot-arc');
    expect(typeof archivedSnapshot?.deletedAt).toBe('number');

    // Both tags must have deletedAt set.
    const archivedTags = await db.rowProvenance
      .where('snapshotId')
      .equals('snapshot-arc')
      .toArray();
    expect(archivedTags).toHaveLength(2);
    for (const tag of archivedTags) {
      expect(typeof tag.deletedAt).toBe('number');
    }
  });

  it('is idempotent on a missing snapshot — resolves without throwing, creates no rows', async () => {
    await expect(
      applyAction(db, {
        kind: 'EVIDENCE_ARCHIVE_SNAPSHOT',
        snapshotId: 'snapshot-does-not-exist',
      })
    ).resolves.toBeUndefined();

    // No snapshot row created as a side-effect.
    expect(await db.evidenceSnapshots.count()).toBe(0);
  });
});
