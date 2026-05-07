// apps/azure/src/persistence/__tests__/applyAction.evidence.provenance.test.ts
//
// F3.6-β P2.4 — Dedicated envelope-facet contract tests for the Azure applyAction dispatcher.
//
// Purpose: document the D1 envelope contract for future maintainers. Every test in this
// file asserts a specific property of the `provenance` facet on `EvidenceSnapshot`. The
// broader EVIDENCE_ADD_SNAPSHOT / EVIDENCE_ARCHIVE_SNAPSHOT coverage (insert, delete, cursor
// behaviour, idempotency, D3 asymmetry note) lives in `applyAction.evidence.test.ts`.
//
// Coverage (6 tests):
//   1. EVIDENCE_ADD_SNAPSHOT writes provenance facet inline with snapshot
//   2. EVIDENCE_ADD_SNAPSHOT with replacedSnapshotId marks old snapshot deletedAt; provenance
//      facet on new snapshot intact
//   3. EVIDENCE_ARCHIVE_SNAPSHOT cascades deletedAt to the snapshot (provenance archives
//      implicitly via envelope)
//   4. empty provenance array round-trips cleanly
//   5. missing provenance field round-trips cleanly
//   6. facade path (StorageProvider) round-trips empty provenance cleanly (PD5)
//
// Fixture discipline: deterministic literal values only — no Date.now(), Math.random(), or
// crypto.randomUUID() in fixture-value positions. IDs and timestamps are hardcoded literals.
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB polyfill before
// db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EvidenceSnapshot, RowProvenanceTag } from '@variscout/core';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';

// ---------------------------------------------------------------------------
// Fixture helpers — deterministic literal values
// ---------------------------------------------------------------------------

/** Stable wall-clock anchor for all fixture timestamps in this file. */
const T0 = 1714000000000;

/** Build a minimal EvidenceSnapshot with deterministic literal fields. */
function makeSnapshot(
  id: string,
  hubId: string,
  overrides: Partial<EvidenceSnapshot> = {}
): EvidenceSnapshot {
  return {
    id,
    hubId,
    sourceId: 'src-fixture',
    capturedAt: '2024-04-25T00:00:00.000Z',
    rowCount: 5,
    origin: 'paste',
    importedAt: T0,
    createdAt: T0,
    deletedAt: null,
    ...overrides,
  };
}

/** Build a RowProvenanceTag with deterministic literal fields. */
function makeTag(
  id: string,
  rowKey: string,
  snapshotId = '',
  overrides: Partial<RowProvenanceTag> = {}
): RowProvenanceTag {
  return {
    id,
    snapshotId,
    rowKey,
    source: 'src-fixture',
    joinKey: 'batch_id',
    createdAt: T0,
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.evidenceSnapshots.clear();
});

afterEach(async () => {
  await db.evidenceSnapshots.clear();
});

// ---------------------------------------------------------------------------
// EVIDENCE_ADD_SNAPSHOT
// ---------------------------------------------------------------------------

describe('EVIDENCE_ADD_SNAPSHOT', () => {
  it('stores snapshot.provenance equal to the dispatched provenance array', async () => {
    const snapshot = makeSnapshot('snap-prov-1', 'hub-prov-1');
    const tags: RowProvenanceTag[] = [
      makeTag('tag-a', 'row-0'),
      makeTag('tag-b', 'row-1'),
      makeTag('tag-c', 'row-2'),
    ];

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-prov-1',
      snapshot,
      provenance: tags,
    });

    const stored = await db.evidenceSnapshots.get('snap-prov-1');
    expect(stored).toBeDefined();
    // Envelope facet: provenance must be stored inline on the same record.
    expect(stored?.provenance).toHaveLength(3);
    expect(stored?.provenance?.[0].id).toBe('tag-a');
    expect(stored?.provenance?.[0].rowKey).toBe('row-0');
    expect(stored?.provenance?.[1].id).toBe('tag-b');
    expect(stored?.provenance?.[1].rowKey).toBe('row-1');
    expect(stored?.provenance?.[2].id).toBe('tag-c');
    expect(stored?.provenance?.[2].rowKey).toBe('row-2');
    // joinKey and source fields are preserved through the envelope round-trip.
    expect(stored?.provenance?.[0].joinKey).toBe('batch_id');
    expect(stored?.provenance?.[0].source).toBe('src-fixture');
  });

  it('marks old snapshot deletedAt and stores new snapshot with provenance intact', async () => {
    // Pre-seed the old snapshot.
    const oldSnapshot = makeSnapshot('snap-old-2', 'hub-replace-2', {
      provenance: [makeTag('tag-old', 'row-x', 'snap-old-2')],
    });
    await db.evidenceSnapshots.put(oldSnapshot);

    // Dispatch new snapshot that replaces the old one.
    const newSnapshot = makeSnapshot('snap-new-2', 'hub-replace-2', {
      capturedAt: '2024-04-26T00:00:00.000Z',
      importedAt: T0 + 1000,
      createdAt: T0 + 1000,
    });
    const newTags: RowProvenanceTag[] = [
      makeTag('tag-new-a', 'row-0', 'snap-new-2'),
      makeTag('tag-new-b', 'row-1', 'snap-new-2'),
    ];

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-replace-2',
      snapshot: newSnapshot,
      provenance: newTags,
      replacedSnapshotId: 'snap-old-2',
    });

    // Old snapshot: deletedAt must be set.
    const archived = await db.evidenceSnapshots.get('snap-old-2');
    expect(typeof archived?.deletedAt).toBe('number');
    expect(archived?.deletedAt).toBeGreaterThan(0);

    // New snapshot: provenance facet must be stored intact.
    const stored = await db.evidenceSnapshots.get('snap-new-2');
    expect(stored).toBeDefined();
    expect(stored?.deletedAt).toBeNull();
    expect(stored?.provenance).toHaveLength(2);
    expect(stored?.provenance?.[0].id).toBe('tag-new-a');
    expect(stored?.provenance?.[1].id).toBe('tag-new-b');
  });

  it('stores provenance as an empty array (not undefined) when provenance is []', async () => {
    const snapshot = makeSnapshot('snap-empty-4', 'hub-empty-4');

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-empty-4',
      snapshot,
      provenance: [],
    });

    const stored = await db.evidenceSnapshots.get('snap-empty-4');
    expect(stored).toBeDefined();
    // Empty array must not be coerced to undefined — the envelope shape is consistent
    // regardless of whether a join occurred.
    expect(stored?.provenance).toEqual([]);
    expect(Array.isArray(stored?.provenance)).toBe(true);
  });

  it('stores snapshot without crashing when provenance is undefined on the snapshot', async () => {
    // Some callers may construct an EvidenceSnapshot without the optional provenance
    // field (pre-F3.6 code paths, or callers that haven't added provenance yet).
    // The handler must tolerate this gracefully — undefined provenance is valid.
    const snapshot = makeSnapshot('snap-missing-5', 'hub-missing-5');
    // Do not set provenance on snapshot — it remains undefined (optional field).
    expect(snapshot.provenance).toBeUndefined();

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-missing-5',
      snapshot,
      provenance: [],
    });

    const stored = await db.evidenceSnapshots.get('snap-missing-5');
    expect(stored).toBeDefined();
    // The action dispatches provenance: [] (from the facade path or a default caller);
    // the handler merges this onto the snapshot via the envelope shape.
    // The stored record has provenance: [] — action.provenance wins over snapshot's
    // missing field because the handler composes: { ...action.snapshot, provenance: action.provenance }.
    expect(stored?.provenance).toEqual([]);
  });

  it('action shape produced by StorageProvider.saveEvidenceSnapshot round-trips provenance: []', async () => {
    // PD5 coverage: StorageProvider.saveEvidenceSnapshot (storage.ts:660-688) always dispatches:
    //   azureHubRepository.dispatch({ kind: 'EVIDENCE_ADD_SNAPSHOT', hubId, snapshot, provenance: [] })
    // This test exercises the action-handler-level contract using the exact action shape that
    // the facade produces — an EvidenceSnapshot (possibly containing a provenance field already)
    // passed with provenance: [] in the action.
    //
    // The facade is the canonical call site for ProcessHubEvidencePanel.tsx (lines 203, 344).
    // Proving the handler-level contract holds for provenance: [] proves the facade path is correct.

    // Simulate the facade's exact action shape: snapshot may already have provenance
    // (e.g. from a prior cloud sync round-trip) but the facade always dispatches provenance: [].
    const snapshotWithExistingProvenance = makeSnapshot('snap-facade-6', 'hub-facade-6', {
      // Simulate a snapshot that arrived from cloud with provenance already populated.
      provenance: [makeTag('cloud-tag', 'row-99', 'snap-facade-6')],
    });

    // The StorageProvider facade always passes provenance: [] — it doesn't thread
    // row-level provenance through the storage layer (that's the data-flow hook's job).
    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-facade-6',
      snapshot: snapshotWithExistingProvenance,
      provenance: [], // <-- exact shape from StorageProvider.saveEvidenceSnapshot
    });

    const stored = await db.evidenceSnapshots.get('snap-facade-6');
    expect(stored).toBeDefined();
    // action.provenance (empty) wins — the handler writes: { ...snapshot, provenance: [] }.
    // This is the correct contract: the facade path always clears provenance on local-paste
    // writes (provenance is threaded separately by the data-flow hook when it dispatches
    // EVIDENCE_ADD_SNAPSHOT with the actual RowProvenanceTag[] from the classifier).
    expect(stored?.provenance).toEqual([]);
    // Core snapshot fields are preserved.
    expect(stored?.id).toBe('snap-facade-6');
    expect(stored?.hubId).toBe('hub-facade-6');
    expect(stored?.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EVIDENCE_ARCHIVE_SNAPSHOT
// ---------------------------------------------------------------------------

describe('EVIDENCE_ARCHIVE_SNAPSHOT', () => {
  it('sets deletedAt on archived snapshot while leaving provenance field unchanged', async () => {
    const tag = makeTag('prov-tag-3', 'row-key-3', 'snap-arc-3');
    const snapshot = makeSnapshot('snap-arc-3', 'hub-arc-3', {
      provenance: [tag],
    });
    await db.evidenceSnapshots.put(snapshot);

    await applyAction({
      kind: 'EVIDENCE_ARCHIVE_SNAPSHOT',
      snapshotId: 'snap-arc-3',
    });

    const archived = await db.evidenceSnapshots.get('snap-arc-3');
    // Archive writes deletedAt only — provenance must be untouched.
    expect(typeof archived?.deletedAt).toBe('number');
    expect(archived?.deletedAt).toBeGreaterThan(0);
    // Provenance archives implicitly because it lives on the same envelope record.
    // The field value is unchanged; callers access provenance from the soft-deleted
    // record the same way they would before archive (e.g. for audit rendering).
    expect(archived?.provenance).toHaveLength(1);
    expect(archived?.provenance?.[0].id).toBe('prov-tag-3');
    expect(archived?.provenance?.[0].rowKey).toBe('row-key-3');
  });
});
