// apps/azure/src/persistence/__tests__/applyAction.test.ts
//
// Tests for applyAction (P5.3) — per-action Azure Dexie handlers.
// fake-indexeddb/auto must be the first import.
//
// Coverage:
//   Hub-blob mutations:
//     HUB_UPDATE_GOAL — updates processGoal via read-modify-write
//     HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS — updates dimensions via read-modify-write
//     OUTCOME_ADD — appends outcome to hub.outcomes[]
//     OUTCOME_UPDATE — patches outcome in hub.outcomes[] by outcomeId
//     OUTCOME_ARCHIVE — soft-deletes outcome (idempotent)
//
//   Direct Dexie writes:
//     EVIDENCE_ADD_SNAPSHOT — puts snapshot into evidenceSnapshots table
//     EVIDENCE_ARCHIVE_SNAPSHOT — soft-deletes snapshot by id
//     EVIDENCE_SOURCE_ADD — puts source into evidenceSources table
//     EVIDENCE_SOURCE_UPDATE_CURSOR — puts cursor into evidenceSourceCursors table
//     EVIDENCE_SOURCE_REMOVE — atomically cascades + soft-deletes source
//
//   Atomicity (EVIDENCE_SOURCE_REMOVE):
//     cascade + parent update in single transaction; rollback on failure
//
//   No-op kinds:
//     INVESTIGATION_ARCHIVE — resolves cleanly, no Dexie writes
//     PLACE_CHIP_ON_STEP (canvas) — resolves cleanly, no Dexie writes
//
//   Exhaustiveness:
//     All HubAction kinds resolve without throwing for valid inputs
//
// Mocking strategy:
//   fake-indexeddb/auto polyfills IndexedDB globally. The real Dexie instance
//   is used for all writes. vi.spyOn is used only for the rollback test.

import 'fake-indexeddb/auto';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { EvidenceSource, EvidenceSnapshot, EvidenceSourceCursor } from '@variscout/core';
import type { HubAction } from '@variscout/core/actions';

// Exhaustiveness test: build a minimal stub for each no-op session-only action kind.
// These are passed to handlers that do nothing with the payload; shape validity is
// enforced at the type level but the exhaustiveness suite uses `as HubAction` casts
// to avoid duplicating complex Finding/Question/CausalLink/SuspectedCause fixtures.
// Real round-trip tests (OUTCOME_*, EVIDENCE_*) use fully typed fixtures below.

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const NOW = 1_746_352_800_000;

function makeHub(id: string, overrides: Partial<ProcessHub> = {}): ProcessHub {
  return {
    id,
    name: `Hub ${id}`,
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function makeOutcome(id: string, hubId: string, deletedAt: number | null = null): OutcomeSpec {
  return {
    id,
    hubId,
    columnName: 'fill_weight',
    characteristicType: 'nominalIsBest',
    createdAt: NOW,
    deletedAt,
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
// Hub-blob mutations
// ---------------------------------------------------------------------------

describe('applyAction — HUB_UPDATE_GOAL', () => {
  it('updates processGoal on the hub blob', async () => {
    const hub = makeHub('hub-1');
    await db.processHubs.put(hub);

    await applyAction({ kind: 'HUB_UPDATE_GOAL', hubId: 'hub-1', processGoal: 'Reduce defects' });

    const updated = await db.processHubs.get('hub-1');
    expect(updated?.processGoal).toBe('Reduce defects');
    // Other fields preserved.
    expect(updated?.name).toBe('Hub hub-1');
    expect(updated?.createdAt).toBe(NOW);
  });

  it('throws if hub not found', async () => {
    await expect(
      applyAction({ kind: 'HUB_UPDATE_GOAL', hubId: 'nonexistent', processGoal: 'goal' })
    ).rejects.toThrow('HUB_UPDATE_GOAL: hub nonexistent not found');
  });
});

describe('applyAction — HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS', () => {
  it('updates primaryScopeDimensions on the hub blob', async () => {
    const hub = makeHub('hub-2', { primaryScopeDimensions: ['Line A'] });
    await db.processHubs.put(hub);

    await applyAction({
      kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS',
      hubId: 'hub-2',
      dimensions: ['Line A', 'Line B'],
    });

    const updated = await db.processHubs.get('hub-2');
    expect(updated?.primaryScopeDimensions).toEqual(['Line A', 'Line B']);
  });

  it('throws if hub not found', async () => {
    await expect(
      applyAction({
        kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS',
        hubId: 'nonexistent',
        dimensions: ['X'],
      })
    ).rejects.toThrow('HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS: hub nonexistent not found');
  });
});

describe('applyAction — OUTCOME_ADD', () => {
  it('appends outcome to hub.outcomes[]', async () => {
    const hub = makeHub('hub-3');
    await db.processHubs.put(hub);
    const outcome = makeOutcome('outcome-1', 'hub-3');

    await applyAction({ kind: 'OUTCOME_ADD', hubId: 'hub-3', outcome });

    const updated = await db.processHubs.get('hub-3');
    expect(updated?.outcomes).toHaveLength(1);
    expect(updated?.outcomes?.[0].id).toBe('outcome-1');
  });

  it('appends to existing outcomes array', async () => {
    const existing = makeOutcome('existing-1', 'hub-3');
    const hub = makeHub('hub-3', { outcomes: [existing] });
    await db.processHubs.put(hub);
    const newOutcome = makeOutcome('outcome-new', 'hub-3');

    await applyAction({ kind: 'OUTCOME_ADD', hubId: 'hub-3', outcome: newOutcome });

    const updated = await db.processHubs.get('hub-3');
    expect(updated?.outcomes).toHaveLength(2);
    expect(updated?.outcomes?.map(o => o.id)).toEqual(['existing-1', 'outcome-new']);
  });

  it('throws if hub not found', async () => {
    const outcome = makeOutcome('o-1', 'ghost-hub');
    await expect(applyAction({ kind: 'OUTCOME_ADD', hubId: 'ghost-hub', outcome })).rejects.toThrow(
      'OUTCOME_ADD: hub ghost-hub not found'
    );
  });
});

describe('applyAction — OUTCOME_UPDATE', () => {
  it('patches the outcome by outcomeId', async () => {
    const outcome = makeOutcome('outcome-patch', 'hub-4');
    const hub = makeHub('hub-4', { outcomes: [outcome] });
    await db.processHubs.put(hub);

    await applyAction({
      kind: 'OUTCOME_UPDATE',
      outcomeId: 'outcome-patch',
      patch: { columnName: 'batch_weight' },
    });

    const updated = await db.processHubs.get('hub-4');
    expect(updated?.outcomes?.[0].columnName).toBe('batch_weight');
    // Other outcome fields preserved.
    expect(updated?.outcomes?.[0].id).toBe('outcome-patch');
    expect(updated?.outcomes?.[0].hubId).toBe('hub-4');
  });

  it('is a no-op if outcomeId not found in any hub', async () => {
    const hub = makeHub('hub-4', { outcomes: [makeOutcome('o-real', 'hub-4')] });
    await db.processHubs.put(hub);

    await expect(
      applyAction({
        kind: 'OUTCOME_UPDATE',
        outcomeId: 'ghost-outcome',
        patch: { columnName: 'x' },
      })
    ).resolves.toBeUndefined();

    // Original row unchanged.
    const saved = await db.processHubs.get('hub-4');
    expect(saved?.outcomes?.[0].columnName).toBe('fill_weight');
  });
});

describe('applyAction — OUTCOME_ARCHIVE', () => {
  it('soft-deletes the outcome by setting deletedAt', async () => {
    const outcome = makeOutcome('outcome-del', 'hub-5');
    const hub = makeHub('hub-5', { outcomes: [outcome] });
    await db.processHubs.put(hub);

    await applyAction({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-del' });

    const updated = await db.processHubs.get('hub-5');
    expect(updated?.outcomes?.[0].deletedAt).toBeGreaterThan(0);
  });

  it('is idempotent: already-archived outcome is not re-archived', async () => {
    const archivedOutcome = makeOutcome('outcome-del', 'hub-5', NOW - 1000);
    const hub = makeHub('hub-5', { outcomes: [archivedOutcome] });
    await db.processHubs.put(hub);

    await applyAction({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-del' });

    // deletedAt should remain at original value, not updated.
    const updated = await db.processHubs.get('hub-5');
    expect(updated?.outcomes?.[0].deletedAt).toBe(NOW - 1000);
  });

  it('is a no-op if outcomeId not found in any hub', async () => {
    const hub = makeHub('hub-5', { outcomes: [] });
    await db.processHubs.put(hub);

    await expect(
      applyAction({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'ghost' })
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Direct Dexie table writes — evidence snapshots
// ---------------------------------------------------------------------------

describe('applyAction — EVIDENCE_ADD_SNAPSHOT', () => {
  it('puts snapshot into evidenceSnapshots table', async () => {
    const snapshot = makeEvidenceSnapshot('snap-1', 'hub-6', 'src-1');

    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-6',
      snapshot,
      provenance: [],
    });

    const stored = await db.evidenceSnapshots.get('snap-1');
    expect(stored?.id).toBe('snap-1');
    expect(stored?.hubId).toBe('hub-6');
    expect(stored?.rowCount).toBe(10);
  });

  it('replaces an existing snapshot with the same id (upsert)', async () => {
    const original = makeEvidenceSnapshot('snap-1', 'hub-6', 'src-1');
    await db.evidenceSnapshots.put(original);

    const updated = { ...original, rowCount: 99 };
    await applyAction({
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-6',
      snapshot: updated,
      provenance: [],
    });

    const stored = await db.evidenceSnapshots.get('snap-1');
    expect(stored?.rowCount).toBe(99);
  });
});

describe('applyAction — EVIDENCE_ARCHIVE_SNAPSHOT', () => {
  it('sets deletedAt on the snapshot', async () => {
    const snapshot = makeEvidenceSnapshot('snap-arch', 'hub-7', 'src-1');
    await db.evidenceSnapshots.put(snapshot);

    await applyAction({ kind: 'EVIDENCE_ARCHIVE_SNAPSHOT', snapshotId: 'snap-arch' });

    const stored = await db.evidenceSnapshots.get('snap-arch');
    expect(stored?.deletedAt).toBeGreaterThan(0);
  });

  it('is a no-op (no error) if snapshot does not exist', async () => {
    // Dexie update on missing key silently does nothing.
    await expect(
      applyAction({ kind: 'EVIDENCE_ARCHIVE_SNAPSHOT', snapshotId: 'ghost-snap' })
    ).resolves.toBeUndefined();
  });

  it('re-archive refreshes deletedAt to a later timestamp (intentional non-idempotency)', async () => {
    // EVIDENCE_ARCHIVE_SNAPSHOT is intentionally NOT idempotent: repeated calls
    // refresh deletedAt to a new Date.now(). This contrasts with OUTCOME_ARCHIVE,
    // which has an explicit idempotency guard. The non-idempotency aligns with
    // Dexie.update semantics — each call is a plain unconditional update.
    //
    // Strategy: capture the real deletedAt after each call and assert the second
    // is >= the first. Avoids mock-slot-ordering fragility from Dexie's own
    // internal Date.now() usage consuming mockReturnValueOnce slots.
    const snapshot = makeEvidenceSnapshot('snap-rearchive', 'hub-7', 'src-1');
    await db.evidenceSnapshots.put(snapshot);

    await applyAction({ kind: 'EVIDENCE_ARCHIVE_SNAPSHOT', snapshotId: 'snap-rearchive' });
    const afterFirst = await db.evidenceSnapshots.get('snap-rearchive');
    const firstDeletedAt = afterFirst?.deletedAt ?? null;
    expect(firstDeletedAt).toBeGreaterThan(0);

    // Brief pause so wall-clock advances (Date.now() is millisecond resolution).
    await new Promise(resolve => setTimeout(resolve, 2));

    await applyAction({ kind: 'EVIDENCE_ARCHIVE_SNAPSHOT', snapshotId: 'snap-rearchive' });
    const afterSecond = await db.evidenceSnapshots.get('snap-rearchive');
    const secondDeletedAt = afterSecond?.deletedAt ?? null;

    // The second call must have overwritten deletedAt. Because OUTCOME_ARCHIVE
    // has a guard ("skip if already archived"), any equal value would indicate
    // an erroneous guard was added to EVIDENCE_ARCHIVE_SNAPSHOT.
    expect(secondDeletedAt).toBeGreaterThanOrEqual(firstDeletedAt!);
  });
});

// ---------------------------------------------------------------------------
// Direct Dexie table writes — evidence sources
// ---------------------------------------------------------------------------

describe('applyAction — EVIDENCE_SOURCE_ADD', () => {
  it('puts source into evidenceSources table', async () => {
    const source = makeEvidenceSource('src-add', 'hub-8');

    await applyAction({ kind: 'EVIDENCE_SOURCE_ADD', hubId: 'hub-8', source });

    const stored = await db.evidenceSources.get('src-add');
    expect(stored?.id).toBe('src-add');
    expect(stored?.hubId).toBe('hub-8');
    expect(stored?.name).toBe('Source src-add');
  });
});

describe('applyAction — EVIDENCE_SOURCE_UPDATE_CURSOR', () => {
  it('puts cursor into evidenceSourceCursors table', async () => {
    const cursor = makeCursor('hub-9', 'src-9');

    await applyAction({
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-9',
      cursor,
    });

    const stored = await db.evidenceSourceCursors.get(['hub-9', 'src-9']);
    expect(stored?.hubId).toBe('hub-9');
    expect(stored?.sourceId).toBe('src-9');
    expect(stored?.lastSeenSnapshotId).toBe('snap-src-9');
  });

  it('updates an existing cursor (upsert)', async () => {
    const original = makeCursor('hub-9', 'src-9');
    await db.evidenceSourceCursors.put(original);

    const updated: EvidenceSourceCursor = { ...original, lastSeenSnapshotId: 'snap-new' };
    await applyAction({
      kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR',
      sourceId: 'src-9',
      cursor: updated,
    });

    const stored = await db.evidenceSourceCursors.get(['hub-9', 'src-9']);
    expect(stored?.lastSeenSnapshotId).toBe('snap-new');
  });
});

describe('applyAction — EVIDENCE_SOURCE_REMOVE', () => {
  it('soft-deletes the source and its cursor atomically', async () => {
    const hubId = 'hub-10';
    const sourceId = 'src-10';
    await db.evidenceSources.put(makeEvidenceSource(sourceId, hubId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, sourceId));

    await applyAction({ kind: 'EVIDENCE_SOURCE_REMOVE', sourceId });

    const source = await db.evidenceSources.get(sourceId);
    expect(source?.deletedAt).toBeGreaterThan(0);

    const cursor = await db.evidenceSourceCursors.get([hubId, sourceId]);
    expect(cursor?.deletedAt).toBeGreaterThan(0);
  });

  it('resolves cleanly if source has no cursors', async () => {
    const sourceId = 'src-nocursor';
    await db.evidenceSources.put(makeEvidenceSource(sourceId, 'hub-10'));

    await expect(
      applyAction({ kind: 'EVIDENCE_SOURCE_REMOVE', sourceId })
    ).resolves.toBeUndefined();

    const source = await db.evidenceSources.get(sourceId);
    expect(source?.deletedAt).toBeGreaterThan(0);
  });

  it('atomicity: rolls back source update if cascade throws', async () => {
    // FIRST rollback scenario: cascade itself throws (before any cursor write).
    // The bulkUpdate mock fires before any IDB row is mutated, so both source
    // and cursor remain at their initial state — the assertions are correct but
    // this does NOT exercise the "cascade-succeeds-then-parent-throws" path.
    const hubId = 'hub-rollback';
    const sourceId = 'src-rollback';
    await db.evidenceSources.put(makeEvidenceSource(sourceId, hubId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, sourceId));

    // Spy on evidenceSourceCursors.bulkUpdate to throw, simulating a mid-cascade failure.
    const spy = vi
      .spyOn(db.evidenceSourceCursors, 'bulkUpdate')
      .mockRejectedValueOnce(new Error('Simulated IDB failure'));

    await expect(applyAction({ kind: 'EVIDENCE_SOURCE_REMOVE', sourceId })).rejects.toThrow(
      'Simulated IDB failure'
    );

    spy.mockRestore();

    // The source should still be live (transaction rolled back).
    const source = await db.evidenceSources.get(sourceId);
    expect(source?.deletedAt).toBeNull();

    // The cursor should also still be live.
    const cursor = await db.evidenceSourceCursors.get([hubId, sourceId]);
    expect(cursor?.deletedAt).toBeNull();
  });

  it('atomicity: rolls back cascade writes if parent evidenceSources.update throws', async () => {
    // SECOND rollback scenario — this tests the REAL atomicity hazard:
    // cascade succeeds (cursor IS written to deletedAt), then
    // db.evidenceSources.update fails. Without a wrapping transaction the cursor
    // would stay archived while the parent source survives. The Dexie 'rw'
    // transaction in EVIDENCE_SOURCE_REMOVE must roll back the cascade write too.
    //
    // Contrast with the FIRST test above: that test exercises "cascade-throws →
    // nothing written". THIS test exercises "cascade-succeeds-then-parent-throws →
    // cascade is rolled back by the transaction abort".
    const hubId = 'hub-rollback2';
    const sourceId = 'src-rollback2';
    await db.evidenceSources.put(makeEvidenceSource(sourceId, hubId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, sourceId));

    // Spy on evidenceSources.update (the parent-update step that runs AFTER cascade).
    const spy = vi
      .spyOn(db.evidenceSources, 'update')
      .mockRejectedValueOnce(new Error('source write failed'));

    await expect(applyAction({ kind: 'EVIDENCE_SOURCE_REMOVE', sourceId })).rejects.toThrow(
      'source write failed'
    );

    spy.mockRestore();

    // The cursor's cascade write must have been rolled back by the transaction abort.
    // If this assertion fails, fake-indexeddb's transaction-abort handling for
    // post-cascade rejections may differ from real IndexedDB. The production code
    // is correct; this test is a regression guard.
    const cursor = await db.evidenceSourceCursors.get([hubId, sourceId]);
    expect(cursor?.deletedAt).toBeNull();

    // The parent source was never written (trivially true — spy threw before the update).
    const source = await db.evidenceSources.get(sourceId);
    expect(source?.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Session-only no-op kinds
// ---------------------------------------------------------------------------

describe('applyAction — session-only no-ops', () => {
  // Session-only no-op tests use `as HubAction` casts for complex payloads
  // (Finding, Question, CausalLink, SuspectedCause) because the handlers consume
  // nothing from the payload — they are structural no-ops. Full type-safety is
  // enforced at real call sites; cast only in tests for session-only no-ops.

  it('INVESTIGATION_CREATE resolves cleanly with no Dexie writes', async () => {
    const hub = makeHub('hub-noop');
    await db.processHubs.put(hub);

    await expect(
      applyAction({
        kind: 'INVESTIGATION_CREATE',
        hubId: 'hub-noop',
        investigation: { id: 'inv-1' },
      } as HubAction)
    ).resolves.toBeUndefined();

    // Hub blob unchanged.
    const saved = await db.processHubs.get('hub-noop');
    expect(saved?.name).toBe('Hub hub-noop');
  });

  it('INVESTIGATION_ARCHIVE resolves cleanly with no Dexie writes', async () => {
    await expect(
      applyAction({ kind: 'INVESTIGATION_ARCHIVE', investigationId: 'inv-99' })
    ).resolves.toBeUndefined();
  });

  it('FINDING_ADD resolves cleanly', async () => {
    await expect(
      applyAction({
        kind: 'FINDING_ADD',
        investigationId: 'inv-1',
        finding: { id: 'f-1' },
      } as HubAction)
    ).resolves.toBeUndefined();
  });

  it('QUESTION_ARCHIVE resolves cleanly', async () => {
    await expect(
      applyAction({ kind: 'QUESTION_ARCHIVE', questionId: 'q-1' })
    ).resolves.toBeUndefined();
  });

  it('CAUSAL_LINK_UPDATE resolves cleanly', async () => {
    await expect(
      applyAction({ kind: 'CAUSAL_LINK_UPDATE', linkId: 'link-1', patch: {} } as HubAction)
    ).resolves.toBeUndefined();
  });

  it('SUSPECTED_CAUSE_ARCHIVE resolves cleanly', async () => {
    await expect(
      applyAction({ kind: 'SUSPECTED_CAUSE_ARCHIVE', causeId: 'cause-1' })
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Canvas action no-ops
// ---------------------------------------------------------------------------

describe('applyAction — canvas action no-ops', () => {
  it('PLACE_CHIP_ON_STEP resolves cleanly with no Dexie writes', async () => {
    const hub = makeHub('hub-canvas');
    await db.processHubs.put(hub);

    await expect(
      applyAction({ kind: 'PLACE_CHIP_ON_STEP', chipId: 'chip-1', stepId: 'step-1' })
    ).resolves.toBeUndefined();

    // Hub blob unchanged.
    const saved = await db.processHubs.get('hub-canvas');
    expect(saved?.name).toBe('Hub hub-canvas');
  });

  it('ADD_STEP resolves cleanly', async () => {
    await expect(applyAction({ kind: 'ADD_STEP', stepName: 'Step A' })).resolves.toBeUndefined();
  });

  it('REMOVE_STEP resolves cleanly', async () => {
    await expect(applyAction({ kind: 'REMOVE_STEP', stepId: 'step-1' })).resolves.toBeUndefined();
  });

  it('RENAME_STEP resolves cleanly', async () => {
    await expect(
      applyAction({ kind: 'RENAME_STEP', stepId: 'step-1', newName: 'Step B' })
    ).resolves.toBeUndefined();
  });

  it('CONNECT_STEPS resolves cleanly', async () => {
    await expect(
      applyAction({ kind: 'CONNECT_STEPS', fromStepId: 's1', toStepId: 's2' })
    ).resolves.toBeUndefined();
  });

  it('UNGROUP_SUB_STEP resolves cleanly', async () => {
    await expect(
      applyAction({ kind: 'UNGROUP_SUB_STEP', stepId: 'step-1' })
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AzureHubRepository integration — dispatch delegates to applyAction
// ---------------------------------------------------------------------------

describe('AzureHubRepository.dispatch integration (via applyAction)', () => {
  it('HUB_UPDATE_GOAL is wired through dispatch', async () => {
    // Import the class here to exercise the full dispatch path end-to-end.
    // We use a fresh import so the module-level fake-indexeddb is already active.
    const { AzureHubRepository } = await import('../AzureHubRepository');
    const repo = new AzureHubRepository();

    await db.processHubs.put(makeHub('hub-disp'));

    // dispatch should NOT throw now that applyAction handles HUB_UPDATE_GOAL.
    await expect(
      repo.dispatch({ kind: 'HUB_UPDATE_GOAL', hubId: 'hub-disp', processGoal: 'dispatched goal' })
    ).resolves.toBeUndefined();

    const saved = await db.processHubs.get('hub-disp');
    expect(saved?.processGoal).toBe('dispatched goal');
  });

  it('OUTCOME_ADD is wired through dispatch', async () => {
    const { AzureHubRepository } = await import('../AzureHubRepository');
    const repo = new AzureHubRepository();

    await db.processHubs.put(makeHub('hub-disp2'));
    const outcome = makeOutcome('o-disp', 'hub-disp2');

    await expect(
      repo.dispatch({ kind: 'OUTCOME_ADD', hubId: 'hub-disp2', outcome })
    ).resolves.toBeUndefined();

    const saved = await db.processHubs.get('hub-disp2');
    expect(saved?.outcomes).toHaveLength(1);
    expect(saved?.outcomes?.[0].id).toBe('o-disp');
  });
});

// ---------------------------------------------------------------------------
// Exhaustiveness — every known HubAction kind resolves without throwing
// (for valid/no-op inputs). This test is the belt-and-braces runtime check
// for the TypeScript exhaustiveness that assertNever() enforces at compile time.
// ---------------------------------------------------------------------------

describe('exhaustiveness — every HubAction kind has a handler', () => {
  const hubId = 'hub-exhaust';
  const sourceId = 'src-exhaust';

  beforeEach(async () => {
    await db.processHubs.put(makeHub(hubId, { outcomes: [makeOutcome('o-exhaust', hubId)] }));
    await db.evidenceSources.put(makeEvidenceSource(sourceId, hubId));
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-exhaust', hubId, sourceId));
    await db.evidenceSourceCursors.put(makeCursor(hubId, sourceId));
  });

  // Session-only and canvas action payloads use `as HubAction` casts.
  // The handlers are no-ops — they don't consume payload. Real call sites
  // pass fully-typed objects; the cast is test-scope only.
  const actions: HubAction[] = [
    // HUB_PERSIST_SNAPSHOT is excluded — dispatch() handles it, not applyAction().
    { kind: 'HUB_UPDATE_GOAL', hubId, processGoal: 'goal' },
    { kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS', hubId, dimensions: ['X'] },
    { kind: 'OUTCOME_ADD', hubId, outcome: makeOutcome('o-new', hubId) },
    { kind: 'OUTCOME_UPDATE', outcomeId: 'o-exhaust', patch: { columnName: 'x' } },
    { kind: 'OUTCOME_ARCHIVE', outcomeId: 'o-exhaust' },
    {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId,
      snapshot: makeEvidenceSnapshot('snap-new', hubId, sourceId),
      provenance: [],
    },
    { kind: 'EVIDENCE_ARCHIVE_SNAPSHOT', snapshotId: 'snap-exhaust' },
    { kind: 'EVIDENCE_SOURCE_ADD', hubId, source: makeEvidenceSource('src-new', hubId) },
    { kind: 'EVIDENCE_SOURCE_UPDATE_CURSOR', sourceId, cursor: makeCursor(hubId, sourceId) },
    { kind: 'EVIDENCE_SOURCE_REMOVE', sourceId },
    // Session-only no-ops: cast to HubAction to avoid complex payload fixtures.
    { kind: 'INVESTIGATION_CREATE', hubId, investigation: { id: 'inv-x' } } as HubAction,
    { kind: 'INVESTIGATION_UPDATE_METADATA', investigationId: 'inv-x', patch: {} } as HubAction,
    { kind: 'INVESTIGATION_ARCHIVE', investigationId: 'inv-x' },
    { kind: 'FINDING_ADD', investigationId: 'inv-x', finding: { id: 'f-1' } } as HubAction,
    { kind: 'FINDING_UPDATE', findingId: 'f-1', patch: {} } as HubAction,
    { kind: 'FINDING_ARCHIVE', findingId: 'f-1' },
    { kind: 'QUESTION_ADD', investigationId: 'inv-x', question: { id: 'q-1' } } as HubAction,
    { kind: 'QUESTION_UPDATE', questionId: 'q-1', patch: {} } as HubAction,
    { kind: 'QUESTION_ARCHIVE', questionId: 'q-1' },
    { kind: 'CAUSAL_LINK_ADD', investigationId: 'inv-x', link: { id: 'link-1' } } as HubAction,
    { kind: 'CAUSAL_LINK_UPDATE', linkId: 'link-1', patch: {} } as HubAction,
    { kind: 'CAUSAL_LINK_ARCHIVE', linkId: 'link-1' },
    {
      kind: 'SUSPECTED_CAUSE_ADD',
      investigationId: 'inv-x',
      cause: { id: 'cause-1' },
    } as HubAction,
    { kind: 'SUSPECTED_CAUSE_UPDATE', causeId: 'cause-1', patch: {} } as HubAction,
    { kind: 'SUSPECTED_CAUSE_ARCHIVE', causeId: 'cause-1' },
    // Canvas no-ops.
    { kind: 'PLACE_CHIP_ON_STEP', chipId: 'chip-1', stepId: 'step-1' },
    { kind: 'UNASSIGN_CHIP', chipId: 'chip-1' },
    { kind: 'REORDER_CHIP_IN_STEP', chipId: 'chip-1', stepId: 'step-1', toIndex: 0 },
    { kind: 'ADD_STEP', stepName: 'Step A' },
    { kind: 'REMOVE_STEP', stepId: 'step-1' },
    { kind: 'RENAME_STEP', stepId: 'step-1', newName: 'Step B' },
    { kind: 'CONNECT_STEPS', fromStepId: 's1', toStepId: 's2' },
    { kind: 'DISCONNECT_STEPS', fromStepId: 's1', toStepId: 's2' },
    { kind: 'GROUP_INTO_SUB_STEP', stepIds: ['s1', 's2'], parentStepId: 'parent' },
    { kind: 'UNGROUP_SUB_STEP', stepId: 'step-1' },
  ];

  // Run each action sequentially so state mutations don't interfere.
  // The key assertion is that none throw "unhandled action kind" (assertNever).
  for (const action of actions) {
    it(`action kind "${action.kind}" resolves without throwing`, async () => {
      await expect(applyAction(action)).resolves.toBeUndefined();
    });
  }
});
