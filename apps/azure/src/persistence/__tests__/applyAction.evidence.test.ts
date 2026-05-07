// apps/azure/src/persistence/__tests__/applyAction.evidence.test.ts
//
// F3.5 P2.3 — tests for EVIDENCE_ADD_SNAPSHOT + EVIDENCE_ARCHIVE_SNAPSHOT handlers
// in the Azure applyAction dispatcher.
//
// Coverage:
//   1. EVIDENCE_ADD_SNAPSHOT inserts snapshot
//   2. EVIDENCE_ADD_SNAPSHOT with replacedSnapshotId marks old snapshot deletedAt;
//      new snapshot has no deletedAt
//   3. EVIDENCE_ADD_SNAPSHOT accepts a non-empty provenance array without error
//      (D3 asymmetry: no rowProvenance table in Azure — D3 intentional)
//   4. EVIDENCE_ARCHIVE_SNAPSHOT marks snapshot deletedAt
//   5. EVIDENCE_ARCHIVE_SNAPSHOT is idempotent on a missing snapshot — no throw, no row creation
//
// D3 asymmetry note (locked decision in F3.5 plan):
//   Azure has no `rowProvenance` Dexie table today (PWA does, per F3 normalization).
//   These tests explicitly do NOT assert on a rowProvenance table — it does not exist
//   on the Azure db instance. Dispatching with a non-empty provenance array must
//   succeed without error and silently proceed to the snapshot-only write. This is
//   the expected asymmetric behaviour per D3 + ADR-078 D2.
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB
// polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EvidenceSnapshot, RowProvenanceTag } from '@variscout/core';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';

// ---------------------------------------------------------------------------
// Fixture helpers — deterministic literal values (no Date.now() / crypto.randomUUID()
// in fixture-value positions; IDs and timestamps are hardcoded literals)
// ---------------------------------------------------------------------------

const CREATED_AT = 1714000000000;

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
    importedAt: CREATED_AT,
    createdAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Build a RowProvenanceTag with deterministic literal values.
 * snapshotId starts as '' (the placeholder at construction time on the call-site side;
 * Azure has no Dexie rowProvenance table so these values are never persisted here).
 */
function makeProvenanceTag(
  id: string,
  rowKey: string,
  overrides: Partial<RowProvenanceTag> = {}
): RowProvenanceTag {
  return {
    id,
    snapshotId: '',
    rowKey,
    source: 'src-1',
    joinKey: 'batch_id',
    createdAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear tables touched by these handlers before each test.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.evidenceSnapshots.clear();
});

afterEach(async () => {
  await db.evidenceSnapshots.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// EVIDENCE_ADD_SNAPSHOT
// ---------------------------------------------------------------------------

describe('applyAction (Azure) — EVIDENCE_ADD_SNAPSHOT', () => {
  it('inserts snapshot into the evidenceSnapshots table', async () => {
    const snapshot = makeEvidenceSnapshot('snapshot-1', 'hub-1');

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-1',
      snapshot,
      provenance: [],
    });

    const stored = await db.evidenceSnapshots.get('snapshot-1');
    expect(stored).toBeDefined();
    expect(stored?.id).toBe('snapshot-1');
    expect(stored?.hubId).toBe('hub-1');
    expect(stored?.rowCount).toBe(10);
    // New snapshot must not be soft-deleted.
    expect(stored?.deletedAt).toBeNull();
  });

  it('with replacedSnapshotId marks old snapshot deletedAt; new snapshot has no deletedAt', async () => {
    // Pre-seed the old snapshot directly.
    const oldSnapshot = makeEvidenceSnapshot('snapshot-old', 'hub-1');
    await db.evidenceSnapshots.put(oldSnapshot);

    // Confirm pre-seed.
    const pre = await db.evidenceSnapshots.get('snapshot-old');
    expect(pre?.deletedAt).toBeNull();

    // Dispatch new snapshot that replaces the old one.
    const newSnapshot = makeEvidenceSnapshot('snapshot-new', 'hub-1', {
      capturedAt: '2024-04-26T00:00:00.000Z',
      importedAt: 1714000001000,
      createdAt: 1714000001000,
    });

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-1',
      snapshot: newSnapshot,
      provenance: [],
      replacedSnapshotId: 'snapshot-old',
    });

    // Old snapshot must have deletedAt set to a number (wall-clock from handler).
    const archivedSnapshot = await db.evidenceSnapshots.get('snapshot-old');
    expect(typeof archivedSnapshot?.deletedAt).toBe('number');
    expect(archivedSnapshot?.deletedAt).toBeGreaterThan(0);

    // New snapshot must NOT have deletedAt set.
    const newStored = await db.evidenceSnapshots.get('snapshot-new');
    expect(newStored).toBeDefined();
    expect(newStored?.deletedAt).toBeNull();
  });

  it('accepts a non-empty provenance array without error — D3 asymmetry: no rowProvenance table', async () => {
    // D3: Azure has no rowProvenance Dexie table. Dispatching EVIDENCE_ADD_SNAPSHOT
    // with a non-empty provenance array must not throw. The handler ignores the
    // provenance payload for persistence (session-only provenance via setRowProvenance
    // prop callback is the in-memory tracking surface). No rowProvenance table to
    // assert against — D3 asymmetry is intentional per the F3.5 plan and ADR-078 D2.
    const snapshot = makeEvidenceSnapshot('snapshot-prov', 'hub-2');
    const tags: RowProvenanceTag[] = [
      makeProvenanceTag('tag-a', '0'),
      makeProvenanceTag('tag-b', '1'),
      makeProvenanceTag('tag-c', '2'),
    ];

    await expect(
      applyAction({
        kind: 'EVIDENCE_ADD_SNAPSHOT',
        hubId: 'hub-2',
        snapshot,
        provenance: tags,
      })
    ).resolves.toBeUndefined();

    // Snapshot still persisted correctly despite non-empty provenance payload.
    const stored = await db.evidenceSnapshots.get('snapshot-prov');
    expect(stored?.id).toBe('snapshot-prov');
    expect(stored?.deletedAt).toBeNull();

    // Verify: the Azure db instance has no rowProvenance table.
    // If this assertion fails, Azure schema has been modified to add the table —
    // update this test and the D3 deferral entry in docs/investigations.md.
    expect('rowProvenance' in db).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EVIDENCE_ARCHIVE_SNAPSHOT
// ---------------------------------------------------------------------------

describe('applyAction (Azure) — EVIDENCE_ARCHIVE_SNAPSHOT', () => {
  it('marks snapshot deletedAt by setting a numeric timestamp', async () => {
    const snapshot = makeEvidenceSnapshot('snapshot-arc', 'hub-3');
    await db.evidenceSnapshots.put(snapshot);

    await applyAction({
      kind: 'EVIDENCE_ARCHIVE_SNAPSHOT',
      snapshotId: 'snapshot-arc',
    });

    const archived = await db.evidenceSnapshots.get('snapshot-arc');
    expect(typeof archived?.deletedAt).toBe('number');
    expect(archived?.deletedAt).toBeGreaterThan(0);
  });

  it('is idempotent on a missing snapshot — no throw, no row creation', async () => {
    // Dexie.update on a non-existent key is a silent no-op (returns 0 affected).
    await expect(
      applyAction({
        kind: 'EVIDENCE_ARCHIVE_SNAPSHOT',
        snapshotId: 'snapshot-does-not-exist',
      })
    ).resolves.toBeUndefined();

    // No row created as a side-effect.
    const count = await db.evidenceSnapshots.count();
    expect(count).toBe(0);
  });
});
