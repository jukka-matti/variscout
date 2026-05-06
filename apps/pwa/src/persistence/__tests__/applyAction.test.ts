// apps/pwa/src/persistence/__tests__/applyAction.test.ts
//
// F3 P5 — tests for applyAction against the normalized 13-table PWA schema.
//
// applyAction(db, action): Promise<void> performs transactional Dexie writes
// against the F3 schema. Each test seeds rows via the real `db` instance,
// dispatches an action, and asserts on the resulting table state.
//
// fake-indexeddb/auto must be the first import statement so Dexie sees the
// IndexedDB polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';
import type { HubAction } from '@variscout/core/actions';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';

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

function makeOutcome(id: string, hubId: string, overrides: Partial<OutcomeSpec> = {}): OutcomeSpec {
  return {
    id,
    hubId,
    columnName: 'fill_weight',
    characteristicType: 'nominalIsBest',
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function makeProcessMap(overrides: Partial<ProcessMap> = {}): ProcessMap {
  return {
    version: 1,
    nodes: [],
    tributaries: [],
    createdAt: '2026-05-06T00:00:00.000Z',
    updatedAt: '2026-05-06T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear all tables touched by F3 dispatch handlers.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.hubs.clear();
  await db.outcomes.clear();
  await db.canvasState.clear();
});

afterEach(async () => {
  await db.hubs.clear();
  await db.outcomes.clear();
  await db.canvasState.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// HUB_PERSIST_SNAPSHOT — atomic decompose into 3 tables
// ---------------------------------------------------------------------------

describe('applyAction — HUB_PERSIST_SNAPSHOT', () => {
  it('decomposes a hub into hubs + outcomes + canvasState rows in one dispatch', async () => {
    const outcome = makeOutcome('out-1', 'hub-1');
    const canvas = makeProcessMap();
    const hub = makeHub('hub-1', {
      processGoal: 'Goal',
      outcomes: [outcome],
      canonicalProcessMap: canvas,
    });

    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub });

    const hubRow = await db.hubs.get('hub-1');
    expect(hubRow?.id).toBe('hub-1');
    expect(hubRow?.processGoal).toBe('Goal');
    // Hub blob's outcomes / canonicalProcessMap must be decomposed away.
    expect((hubRow as Partial<ProcessHub> | undefined)?.outcomes).toBeUndefined();
    expect((hubRow as Partial<ProcessHub> | undefined)?.canonicalProcessMap).toBeUndefined();

    const outcomeRows = await db.outcomes.where('hubId').equals('hub-1').toArray();
    expect(outcomeRows).toHaveLength(1);
    expect(outcomeRows[0].id).toBe('out-1');
    expect(outcomeRows[0].hubId).toBe('hub-1');

    const canvasRow = await db.canvasState.get('hub-1');
    expect(canvasRow?.hubId).toBe('hub-1');
    expect(canvasRow?.version).toBe(1);
  });

  it('persists a hub with no outcomes — outcomes table stays empty', async () => {
    const hub = makeHub('hub-2');

    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub });

    const outcomeRows = await db.outcomes.where('hubId').equals('hub-2').toArray();
    expect(outcomeRows).toHaveLength(0);
  });

  it('persists a hub with no canonicalProcessMap — canvasState row absent', async () => {
    const hub = makeHub('hub-3');

    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub });

    const canvasRow = await db.canvasState.get('hub-3');
    expect(canvasRow).toBeUndefined();
  });

  it('removes stale outcomes when re-persisting with a smaller outcomes array', async () => {
    // Seed: 3 outcomes [A, B, C].
    const initialHub = makeHub('hub-cleanup', {
      outcomes: [
        makeOutcome('out-A', 'hub-cleanup'),
        makeOutcome('out-B', 'hub-cleanup'),
        makeOutcome('out-C', 'hub-cleanup'),
      ],
    });
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: initialHub });

    // Re-persist with only [A].
    const trimmedHub = makeHub('hub-cleanup', {
      outcomes: [makeOutcome('out-A', 'hub-cleanup')],
    });
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: trimmedHub });

    const remaining = await db.outcomes.where('hubId').equals('hub-cleanup').toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('out-A');
  });

  it('removes stale outcomes when re-persisting with no outcomes array', async () => {
    const initialHub = makeHub('hub-clear', {
      outcomes: [makeOutcome('out-A', 'hub-clear'), makeOutcome('out-B', 'hub-clear')],
    });
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: initialHub });

    const clearedHub = makeHub('hub-clear');
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: clearedHub });

    const remaining = await db.outcomes.where('hubId').equals('hub-clear').toArray();
    expect(remaining).toHaveLength(0);
  });

  it('does not delete outcomes belonging to other hubs', async () => {
    // Seed two hubs with one outcome each.
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-A', { outcomes: [makeOutcome('out-A1', 'hub-A')] }),
    });
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-B', { outcomes: [makeOutcome('out-B1', 'hub-B')] }),
    });

    // Re-persist hub-A with no outcomes — must not touch hub-B's row.
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-A') });

    const hubBOutcomes = await db.outcomes.where('hubId').equals('hub-B').toArray();
    expect(hubBOutcomes).toHaveLength(1);
    expect(hubBOutcomes[0].id).toBe('out-B1');
  });

  it('deletes the canvasState row when re-persisting without canonicalProcessMap', async () => {
    const initialHub = makeHub('hub-canvas', {
      canonicalProcessMap: makeProcessMap(),
    });
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: initialHub });
    expect(await db.canvasState.get('hub-canvas')).toBeDefined();

    const clearedHub = makeHub('hub-canvas');
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: clearedHub });

    expect(await db.canvasState.get('hub-canvas')).toBeUndefined();
  });

  it('overwrites an existing canvasState row when canonicalProcessMap changes', async () => {
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-cc', {
        canonicalProcessMap: makeProcessMap({ ctsColumn: 'first' }),
      }),
    });

    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-cc', {
        canonicalProcessMap: makeProcessMap({ ctsColumn: 'second' }),
      }),
    });

    const row = await db.canvasState.get('hub-cc');
    expect(row?.ctsColumn).toBe('second');
  });

  it('atomicity: rolls back hubs + outcomes writes when canvasState write fails', async () => {
    // Spy on canvasState.put to throw so the transaction aborts mid-write.
    // hubs.put + outcomes.bulkPut have already executed at that point — Dexie
    // must roll them back when the transaction aborts. Without the explicit
    // db.transaction wrapper, those writes would be visible after the throw.
    const hub = makeHub('hub-atomic', {
      outcomes: [makeOutcome('out-atomic', 'hub-atomic')],
      canonicalProcessMap: makeProcessMap(),
    });

    const spy = vi
      .spyOn(db.canvasState, 'put')
      .mockRejectedValueOnce(new Error('Simulated canvas write failure'));

    await expect(applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub })).rejects.toThrow(
      'Simulated canvas write failure'
    );

    spy.mockRestore();

    // After rollback, none of the three tables should hold the partial write.
    expect(await db.hubs.get('hub-atomic')).toBeUndefined();
    expect(await db.outcomes.where('hubId').equals('hub-atomic').toArray()).toHaveLength(0);
    expect(await db.canvasState.get('hub-atomic')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// HUB_UPDATE_GOAL
// ---------------------------------------------------------------------------

describe('applyAction — HUB_UPDATE_GOAL', () => {
  it('updates processGoal and bumps updatedAt on existing hub', async () => {
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-g1', { processGoal: 'old' }),
    });

    const before = Date.now();
    await applyAction(db, {
      kind: 'HUB_UPDATE_GOAL',
      hubId: 'hub-g1',
      processGoal: 'new goal',
    });

    const row = await db.hubs.get('hub-g1');
    expect(row?.processGoal).toBe('new goal');
    expect(row?.updatedAt).toBeDefined();
    expect((row?.updatedAt ?? 0) >= before).toBe(true);
  });

  it('throws (loud-fail) when hub does not exist', async () => {
    await expect(
      applyAction(db, {
        kind: 'HUB_UPDATE_GOAL',
        hubId: 'ghost-hub',
        processGoal: 'whatever',
      })
    ).rejects.toThrow(/ghost-hub/);
  });
});

// ---------------------------------------------------------------------------
// HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS
// ---------------------------------------------------------------------------

describe('applyAction — HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS', () => {
  it('updates primaryScopeDimensions and bumps updatedAt on existing hub', async () => {
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-d1', { primaryScopeDimensions: ['Line A'] }),
    });

    const before = Date.now();
    await applyAction(db, {
      kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS',
      hubId: 'hub-d1',
      dimensions: ['Line A', 'Shift'],
    });

    const row = await db.hubs.get('hub-d1');
    expect(row?.primaryScopeDimensions).toEqual(['Line A', 'Shift']);
    expect((row?.updatedAt ?? 0) >= before).toBe(true);
  });

  it('throws (loud-fail) when hub does not exist', async () => {
    await expect(
      applyAction(db, {
        kind: 'HUB_UPDATE_PRIMARY_SCOPE_DIMENSIONS',
        hubId: 'ghost-hub-d',
        dimensions: ['X'],
      })
    ).rejects.toThrow(/ghost-hub-d/);
  });
});

// ---------------------------------------------------------------------------
// OUTCOME_ADD
// ---------------------------------------------------------------------------

describe('applyAction — OUTCOME_ADD', () => {
  it('adds a row to the outcomes table with the parent hubId carried through', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-oa') });

    const outcome = makeOutcome('out-new', 'hub-oa', { columnName: 'cycle_time' });
    await applyAction(db, { kind: 'OUTCOME_ADD', hubId: 'hub-oa', outcome });

    const row = await db.outcomes.get('out-new');
    expect(row?.id).toBe('out-new');
    expect(row?.hubId).toBe('hub-oa');
    expect(row?.columnName).toBe('cycle_time');
  });

  it('throws (loud-fail) when parent hub does not exist', async () => {
    const outcome = makeOutcome('out-orphan', 'ghost-hub');
    await expect(
      applyAction(db, { kind: 'OUTCOME_ADD', hubId: 'ghost-hub', outcome })
    ).rejects.toThrow(/ghost-hub/);

    // No row should have been created.
    expect(await db.outcomes.get('out-orphan')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OUTCOME_UPDATE
// ---------------------------------------------------------------------------

describe('applyAction — OUTCOME_UPDATE', () => {
  it('patches the outcome row by id', async () => {
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-ou', {
        outcomes: [makeOutcome('out-patch', 'hub-ou')],
      }),
    });

    await applyAction(db, {
      kind: 'OUTCOME_UPDATE',
      outcomeId: 'out-patch',
      patch: { columnName: 'patched', target: 5 },
    });

    const row = await db.outcomes.get('out-patch');
    expect(row?.columnName).toBe('patched');
    expect(row?.target).toBe(5);
    // Identity preserved.
    expect(row?.hubId).toBe('hub-ou');
  });

  it('is idempotent (no-op) when outcomeId does not exist', async () => {
    await expect(
      applyAction(db, {
        kind: 'OUTCOME_UPDATE',
        outcomeId: 'ghost-outcome',
        patch: { columnName: 'x' },
      })
    ).resolves.toBeUndefined();

    expect(await db.outcomes.get('ghost-outcome')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// OUTCOME_ARCHIVE
// ---------------------------------------------------------------------------

describe('applyAction — OUTCOME_ARCHIVE', () => {
  it('soft-deletes the outcome by setting deletedAt', async () => {
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-arc', {
        outcomes: [makeOutcome('out-arc', 'hub-arc')],
      }),
    });

    await applyAction(db, { kind: 'OUTCOME_ARCHIVE', outcomeId: 'out-arc' });

    const row = await db.outcomes.get('out-arc');
    expect(row?.deletedAt).toBeGreaterThan(0);
  });

  it('is idempotent (no-op) when outcomeId does not exist', async () => {
    await expect(
      applyAction(db, { kind: 'OUTCOME_ARCHIVE', outcomeId: 'ghost-outcome' })
    ).resolves.toBeUndefined();
  });

  it('refreshes deletedAt when archiving an already-archived outcome (Dexie .update semantics)', async () => {
    // Outcome already carries a deletedAt = NOW - 1000.
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-arc2', {
        outcomes: [makeOutcome('out-already', 'hub-arc2', { deletedAt: NOW - 1000 })],
      }),
    });

    // applyAction's OUTCOME_ARCHIVE has no idempotency guard — it unconditionally
    // patches deletedAt to Date.now(). Confirm the row is now stamped at "today"
    // rather than the seeded historic value. (Pinning actual behavior.)
    await applyAction(db, { kind: 'OUTCOME_ARCHIVE', outcomeId: 'out-already' });

    const row = await db.outcomes.get('out-already');
    expect(row?.deletedAt).toBeGreaterThan(NOW); // Date.now() ≫ NOW (= 2025-05-04).
  });
});

// ---------------------------------------------------------------------------
// No-op action kinds — F3 declares the tables but does not yet write.
// One representative test per category; smoke-test pattern.
// ---------------------------------------------------------------------------

describe('applyAction — no-op action kinds', () => {
  it('EVIDENCE_ADD_SNAPSHOT does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'EVIDENCE_ADD_SNAPSHOT',
      hubId: 'hub-x',
      snapshot: {
        id: 'snap-x',
        hubId: 'hub-x',
        sourceId: 'src-x',
        capturedAt: '2026-05-06T00:00:00.000Z',
        rowCount: 0,
        origin: 'paste',
        importedAt: NOW,
        createdAt: NOW,
        deletedAt: null,
      },
      provenance: [],
    });

    expect(await db.evidenceSnapshots.count()).toBe(0);
    expect(await db.rowProvenance.count()).toBe(0);
  });

  it('INVESTIGATION_CREATE does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'INVESTIGATION_CREATE',
      hubId: 'hub-x',
      investigation: {
        id: 'inv-x',
        hubId: 'hub-x',
        name: 'inv',
        createdAt: NOW,
        deletedAt: null,
      },
    } as unknown as HubAction);

    expect(await db.investigations.count()).toBe(0);
  });

  it('FINDING_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'FINDING_ADD',
      investigationId: 'inv-x',
      finding: { id: 'f-x' },
    } as unknown as HubAction);

    expect(await db.findings.count()).toBe(0);
  });

  it('QUESTION_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'QUESTION_ADD',
      investigationId: 'inv-x',
      question: { id: 'q-x' },
    } as unknown as HubAction);

    expect(await db.questions.count()).toBe(0);
  });

  it('CAUSAL_LINK_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'CAUSAL_LINK_ADD',
      investigationId: 'inv-x',
      link: { id: 'c-x' },
    } as unknown as HubAction);

    expect(await db.causalLinks.count()).toBe(0);
  });

  it('SUSPECTED_CAUSE_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'SUSPECTED_CAUSE_ADD',
      investigationId: 'inv-x',
      cause: { id: 'sc-x' },
    } as unknown as HubAction);

    expect(await db.suspectedCauses.count()).toBe(0);
  });

  it('canvas action (ADD_STEP) does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'ADD_STEP',
      stepName: 'X',
    } as unknown as HubAction);

    expect(await db.canvasState.count()).toBe(0);
  });

  it.each([
    'EVIDENCE_ARCHIVE_SNAPSHOT',
    'EVIDENCE_SOURCE_ADD',
    'EVIDENCE_SOURCE_UPDATE_CURSOR',
    'EVIDENCE_SOURCE_REMOVE',
    'INVESTIGATION_UPDATE_METADATA',
    'INVESTIGATION_ARCHIVE',
    'FINDING_UPDATE',
    'FINDING_ARCHIVE',
    'QUESTION_UPDATE',
    'QUESTION_ARCHIVE',
    'CAUSAL_LINK_UPDATE',
    'CAUSAL_LINK_ARCHIVE',
    'SUSPECTED_CAUSE_UPDATE',
    'SUSPECTED_CAUSE_ARCHIVE',
    'PLACE_CHIP_ON_STEP',
    'UNASSIGN_CHIP',
    'REORDER_CHIP_IN_STEP',
    'REMOVE_STEP',
    'RENAME_STEP',
    'CONNECT_STEPS',
    'DISCONNECT_STEPS',
    'GROUP_INTO_SUB_STEP',
    'UNGROUP_SUB_STEP',
  ])('no-op kind %s resolves cleanly without throwing', async kind => {
    // Cast through unknown — these stub payloads are intentionally minimal;
    // applyAction's no-op branches do not inspect the payload shape.
    await expect(applyAction(db, { kind } as unknown as HubAction)).resolves.toBeUndefined();
  });
});
