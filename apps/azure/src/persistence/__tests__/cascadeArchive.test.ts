// apps/azure/src/persistence/__tests__/cascadeArchive.test.ts
//
// Tests for cascadeArchiveDescendants (P5.2).
// fake-indexeddb/auto must be the first import statement.
//
// Coverage:
//   - evidenceSource parent: cursors get deletedAt set; source itself untouched.
//   - hub parent (multi-table): evidenceSources + evidenceSnapshots + cursors all get deletedAt.
//   - investigation parent (no-op): no Dexie writes; resolves cleanly.
//   - rollback path: a mid-cascade bulkUpdate failure rolls back the entire transaction.
//   - idempotency: re-running cascade overwrites deletedAt to new value without error.
//   - empty descendants: hub with no evidenceSources resolves cleanly.
//
// Mocking strategy: fake-indexeddb/auto polyfills IndexedDB globally so the real
// Dexie instance works end-to-end. No vi.mock needed; the real db object is used.

import 'fake-indexeddb/auto';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cascadeArchiveDescendants } from '../cascadeArchive';
import { db } from '../../db/schema';
import type { EvidenceSource, EvidenceSnapshot, EvidenceSourceCursor } from '@variscout/core';
import type { ProcessHub } from '@variscout/core/processHub';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const NOW = 1_746_352_800_000;
const LATER = NOW + 5_000;

function makeHub(id: string): ProcessHub {
  return {
    id,
    name: `Hub ${id}`,
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeEvidenceSource(id: string, hubId: string): EvidenceSource {
  return {
    id,
    hubId,
    name: `Source ${id}`,
    cadence: 'manual',
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeEvidenceSnapshot(id: string, hubId: string, sourceId: string): EvidenceSnapshot {
  return {
    id,
    hubId,
    sourceId,
    capturedAt: '2026-05-06T00:00:00.000Z',
    rowCount: 10,
    origin: 'paste',
    importedAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeCursor(hubId: string, sourceId: string): EvidenceSourceCursor {
  return {
    id: `cursor-${hubId}-${sourceId}`,
    hubId,
    sourceId,
    lastSeenSnapshotId: `snap-${sourceId}`,
    lastSeenAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.processHubs.clear();
  await db.evidenceSources.clear();
  await db.evidenceSnapshots.clear();
  await db.evidenceSourceCursors.clear();
});

afterEach(async () => {
  await db.processHubs.clear();
  await db.evidenceSources.clear();
  await db.evidenceSnapshots.clear();
  await db.evidenceSourceCursors.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('cascadeArchiveDescendants — evidenceSource parent', () => {
  it('sets deletedAt on all cursors for the source; source itself is untouched', async () => {
    const hubId = 'hub-1';
    const sourceId = 'src-1';
    await db.processHubs.put(makeHub(hubId));
    await db.evidenceSources.put(makeEvidenceSource(sourceId, hubId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, sourceId));
    // A second cursor for the same source but different hub (should also be updated — same sourceId).
    await db.evidenceSourceCursors.put(makeCursor('hub-2', sourceId));

    await cascadeArchiveDescendants('evidenceSource', sourceId, NOW);

    // Both cursors sharing the same sourceId are archived.
    const cursor1 = await db.evidenceSourceCursors.get([hubId, sourceId]);
    const cursor2 = await db.evidenceSourceCursors.get(['hub-2', sourceId]);
    expect(cursor1?.deletedAt).toBe(NOW);
    expect(cursor2?.deletedAt).toBe(NOW);

    // The source itself is NOT touched by the cascade helper.
    const source = await db.evidenceSources.get(sourceId);
    expect(source?.deletedAt).toBeNull();
  });

  it('resolves cleanly when the source has no cursors', async () => {
    const hubId = 'hub-1';
    const sourceId = 'src-empty';
    await db.processHubs.put(makeHub(hubId));
    await db.evidenceSources.put(makeEvidenceSource(sourceId, hubId));
    // No cursors inserted.

    await expect(
      cascadeArchiveDescendants('evidenceSource', sourceId, NOW)
    ).resolves.toBeUndefined();
  });
});

describe('cascadeArchiveDescendants — hub parent (multi-table)', () => {
  it('sets deletedAt on evidenceSources, evidenceSnapshots, and cursors; hub blob untouched', async () => {
    const hubId = 'hub-multi';
    const src1 = 'src-A';
    const src2 = 'src-B';

    await db.processHubs.put(makeHub(hubId));
    await db.evidenceSources.put(makeEvidenceSource(src1, hubId));
    await db.evidenceSources.put(makeEvidenceSource(src2, hubId));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-1', hubId, src1));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-2', hubId, src1));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-3', hubId, src2));
    await db.evidenceSourceCursors.put(makeCursor(hubId, src1));
    // Fan-out: a second cursor for src2 — verifies the compound key-range query
    // archives ALL cursors belonging to the hub, not just the first one.
    await db.evidenceSourceCursors.put(makeCursor(hubId, src2));

    await cascadeArchiveDescendants('hub', hubId, NOW);

    // evidenceSources — both archived.
    const sourceA = await db.evidenceSources.get(src1);
    const sourceB = await db.evidenceSources.get(src2);
    expect(sourceA?.deletedAt).toBe(NOW);
    expect(sourceB?.deletedAt).toBe(NOW);

    // evidenceSnapshots — all three archived.
    const snap1 = await db.evidenceSnapshots.get('snap-1');
    const snap2 = await db.evidenceSnapshots.get('snap-2');
    const snap3 = await db.evidenceSnapshots.get('snap-3');
    expect(snap1?.deletedAt).toBe(NOW);
    expect(snap2?.deletedAt).toBe(NOW);
    expect(snap3?.deletedAt).toBe(NOW);

    // evidenceSourceCursors — both archived (fan-out: hub → src1 cursor + src2 cursor).
    const cursor1 = await db.evidenceSourceCursors.get([hubId, src1]);
    const cursor2 = await db.evidenceSourceCursors.get([hubId, src2]);
    expect(cursor1?.deletedAt).toBe(NOW);
    expect(cursor2?.deletedAt).toBe(NOW);

    // The hub blob itself is NOT touched by the cascade helper (P5.3 handler owns that).
    const hub = await db.processHubs.get(hubId);
    expect(hub?.deletedAt).toBeNull();
  });

  it('does not touch rows belonging to a different hub', async () => {
    const hubId = 'hub-target';
    const otherHubId = 'hub-other';
    const srcTarget = 'src-target';
    const srcOther = 'src-other';

    await db.processHubs.put(makeHub(hubId));
    await db.processHubs.put(makeHub(otherHubId));
    await db.evidenceSources.put(makeEvidenceSource(srcTarget, hubId));
    await db.evidenceSources.put(makeEvidenceSource(srcOther, otherHubId));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-target', hubId, srcTarget));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-other', otherHubId, srcOther));
    await db.evidenceSourceCursors.put(makeCursor(hubId, srcTarget));
    await db.evidenceSourceCursors.put(makeCursor(otherHubId, srcOther));

    await cascadeArchiveDescendants('hub', hubId, NOW);

    // Target hub entities archived.
    const sourceTarget = await db.evidenceSources.get(srcTarget);
    const snapTarget = await db.evidenceSnapshots.get('snap-target');
    const cursorTarget = await db.evidenceSourceCursors.get([hubId, srcTarget]);
    expect(sourceTarget?.deletedAt).toBe(NOW);
    expect(snapTarget?.deletedAt).toBe(NOW);
    expect(cursorTarget?.deletedAt).toBe(NOW);

    // Other hub entities untouched.
    const sourceOther = await db.evidenceSources.get(srcOther);
    const snapOther = await db.evidenceSnapshots.get('snap-other');
    const cursorOther = await db.evidenceSourceCursors.get([otherHubId, srcOther]);
    expect(sourceOther?.deletedAt).toBeNull();
    expect(snapOther?.deletedAt).toBeNull();
    expect(cursorOther?.deletedAt).toBeNull();
  });
});

describe('cascadeArchiveDescendants — investigation parent (no-op)', () => {
  it('resolves cleanly without any Dexie writes', async () => {
    // Insert some rows to confirm they are not mutated.
    const hubId = 'hub-1';
    const srcId = 'src-1';
    await db.processHubs.put(makeHub(hubId));
    await db.evidenceSources.put(makeEvidenceSource(srcId, hubId));

    await expect(
      cascadeArchiveDescendants('investigation', 'inv-99', NOW)
    ).resolves.toBeUndefined();

    // No side effects on existing rows.
    const source = await db.evidenceSources.get(srcId);
    expect(source?.deletedAt).toBeNull();
  });

  it('resolves cleanly with empty database', async () => {
    await expect(
      cascadeArchiveDescendants('investigation', 'inv-99', NOW)
    ).resolves.toBeUndefined();
  });
});

describe('cascadeArchiveDescendants — rollback path', () => {
  it('rolls back partial writes when bulkUpdate throws mid-cascade', async () => {
    const hubId = 'hub-rollback';
    const srcId = 'src-rollback';

    await db.processHubs.put(makeHub(hubId));
    await db.evidenceSources.put(makeEvidenceSource(srcId, hubId));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-rollback', hubId, srcId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, srcId));

    // Spy on evidenceSources.bulkUpdate to throw after the snapshot bulkUpdate succeeds.
    // The cascade order for hub is: outcome (no-op), evidenceSnapshot, rowProvenance (no-op),
    // evidenceSource, evidenceSourceCursor, investigation (no-op), canvasState (no-op), ...
    // We make evidenceSources.bulkUpdate throw to simulate a mid-cascade failure.
    const spy = vi
      .spyOn(db.evidenceSources, 'bulkUpdate')
      .mockRejectedValueOnce(new Error('Simulated IndexedDB failure'));

    await expect(cascadeArchiveDescendants('hub', hubId, NOW)).rejects.toThrow(
      'Simulated IndexedDB failure'
    );

    spy.mockRestore();

    // After Dexie auto-rollback, the evidenceSnapshot write (which happened before
    // the failure) should be rolled back too.
    // Verified rollback path: fake-indexeddb honors Dexie 4's transaction-abort
    // propagation. The bulkUpdate rejection inside the transaction callback aborts
    // the underlying IDBTransaction, which restores the prior evidenceSnapshot row
    // to its pre-transaction state (deletedAt: null).
    const snap = await db.evidenceSnapshots.get('snap-rollback');
    expect(snap?.deletedAt).toBeNull();

    // Cursor should also be at original state (was written after source — never reached).
    const cursor = await db.evidenceSourceCursors.get([hubId, srcId]);
    expect(cursor?.deletedAt).toBeNull();
  });
});

describe('cascadeArchiveDescendants — idempotency', () => {
  it('re-running cascade overwrites deletedAt to the new timestamp without error', async () => {
    const hubId = 'hub-idem';
    const srcId = 'src-idem';

    await db.processHubs.put(makeHub(hubId));
    await db.evidenceSources.put(makeEvidenceSource(srcId, hubId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, srcId));

    // First run.
    await cascadeArchiveDescendants('hub', hubId, NOW);
    const sourceAfterFirst = await db.evidenceSources.get(srcId);
    expect(sourceAfterFirst?.deletedAt).toBe(NOW);

    // Second run with a later timestamp.
    await cascadeArchiveDescendants('hub', hubId, LATER);
    const sourceAfterSecond = await db.evidenceSources.get(srcId);
    expect(sourceAfterSecond?.deletedAt).toBe(LATER);

    const cursor = await db.evidenceSourceCursors.get([hubId, srcId]);
    expect(cursor?.deletedAt).toBe(LATER);
  });
});

describe('cascadeArchiveDescendants — empty descendants', () => {
  it('hub with no evidenceSources, snapshots, or cursors resolves cleanly', async () => {
    const hubId = 'hub-empty';
    await db.processHubs.put(makeHub(hubId));
    // No evidenceSources, evidenceSnapshots, or evidenceSourceCursors.

    await expect(cascadeArchiveDescendants('hub', hubId, NOW)).resolves.toBeUndefined();
  });

  it('outcome parent (leaf — no cascade descendants) resolves immediately', async () => {
    await expect(
      cascadeArchiveDescendants('outcome', 'outcome-leaf', NOW)
    ).resolves.toBeUndefined();
  });
});
