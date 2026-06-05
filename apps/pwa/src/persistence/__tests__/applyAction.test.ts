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
import type { ControlRecord, ControlReview } from '@variscout/core';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';
import type { HubAction } from '@variscout/core/actions';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';
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

function makeControlRecord(id: string, hubId: string): ControlRecord {
  return {
    id,
    hubId,
    investigationId: `inv-${id}`,
    status: 'pending',
    title: `Record ${id}`,
    consecutiveOnTargetTicks: 0,
    hasOverride: false,
    lastEvaluatedSnapshotId: undefined,
    cadence: 'monthly',
    updatedAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeControlReview(id: string, recordId: string, hubId: string): ControlReview {
  return {
    id,
    recordId,
    hubId,
    investigationId: `inv-${recordId}`,
    reviewedAt: NOW,
    reviewer: { displayName: 'Reviewer' },
    verdict: 'holding',
    createdAt: NOW,
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear all tables touched by F3 dispatch handlers.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.hubs.clear();
  await db.outcomes.clear();
  await db.canvasState.clear();
  await db.actionItems.clear();
  await db.controlRecords.clear();
  await db.controlReviews.clear();
  await db.measurementPlans.clear();
});

afterEach(async () => {
  await db.hubs.clear();
  await db.outcomes.clear();
  await db.canvasState.clear();
  await db.actionItems.clear();
  await db.controlRecords.clear();
  await db.controlReviews.clear();
  await db.measurementPlans.clear();
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

  it('strips sustainment arrays from the hub row and persists them in normalized tables', async () => {
    const record = makeControlRecord('sr-1', 'hub-s');
    const review = makeControlReview('rev-1', 'sr-1', 'hub-s');
    const hub = makeHub('hub-s', {
      controlRecords: [record],
      controlReviews: [review],
    } as Partial<ProcessHub>);

    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub });

    const hubRow = await db.hubs.get('hub-s');
    expect((hubRow as Partial<ProcessHub> | undefined)?.controlRecords).toBeUndefined();
    expect((hubRow as Partial<ProcessHub> | undefined)?.controlReviews).toBeUndefined();
    expect(
      (await db.controlRecords.where('hubId').equals('hub-s').toArray()).map(r => r.id)
    ).toEqual(['sr-1']);
    expect(
      (await db.controlReviews.where('hubId').equals('hub-s').toArray()).map(r => r.id)
    ).toEqual(['rev-1']);
  });

  it('removes stale sustainment rows when re-persisting with a smaller snapshot', async () => {
    await db.controlRecords.put(makeControlRecord('sr-stale', 'hub-stale'));
    await db.controlReviews.put(makeControlReview('rev-stale', 'sr-stale', 'hub-stale'));

    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-stale', {
        controlRecords: [makeControlRecord('sr-keep', 'hub-stale')],
        controlReviews: [makeControlReview('rev-keep', 'sr-keep', 'hub-stale')],
      } as Partial<ProcessHub>),
    });

    expect(
      (await db.controlRecords.where('hubId').equals('hub-stale').toArray()).map(r => r.id)
    ).toEqual(['sr-keep']);
    expect(
      (await db.controlReviews.where('hubId').equals('hub-stale').toArray()).map(r => r.id)
    ).toEqual(['rev-keep']);
  });

  it('removes stale sustainment rows when a snapshot omits sustainment arrays', async () => {
    await db.controlRecords.put(makeControlRecord('sr-stale', 'hub-empty'));
    await db.controlReviews.put(makeControlReview('rev-stale', 'sr-stale', 'hub-empty'));

    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-empty'),
    });

    expect(await db.controlRecords.where('hubId').equals('hub-empty').count()).toBe(0);
    expect(await db.controlReviews.where('hubId').equals('hub-empty').count()).toBe(0);
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

describe('applyAction — ACTION_ITEM_ADD', () => {
  it('writes an orphan action item row tagged with hubId and stepId', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-action') });

    await applyAction(db, {
      kind: 'ACTION_ITEM_ADD',
      hubId: 'hub-action',
      actionItem: {
        id: 'action-1',
        text: 'Refill buffer tank',
        stepId: 'step-fill',
        parentImprovementProjectId: null,
        parentImprovementIdeaId: null,
        assignedTo: null,
        dueAt: null,
        status: 'done',
        doneAt: '2026-05-10T10:00:00.000Z',
        doneBy: null,
        createdBy: { displayName: 'Local browser' },
        createdAt: NOW,
        deletedAt: null,
      },
    });

    const rows = await db.actionItems.where('hubId').equals('hub-action').toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'action-1',
      hubId: 'hub-action',
      stepId: 'step-fill',
      parentImprovementProjectId: null,
      parentImprovementIdeaId: null,
      status: 'done',
      deletedAt: null,
    });
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
// No-op action kinds — F3 declares these as pass-through; they must not write.
// One representative test per category; smoke-test pattern.
// PO-6 (v14): findings/causalLinks/hypotheses tables retired. Assertions
// re-pointed to db.actionItems (a surviving table) as the proxy.
// proxy table — the no-op must write nothing anywhere;
// findings/hypotheses tables retired v14 (PO-6).
// ---------------------------------------------------------------------------

describe('applyAction — no-op action kinds', () => {
  it('FINDING_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'FINDING_ADD',
      finding: { id: 'f-x' },
    } as unknown as HubAction);

    // proxy table — the no-op must write nothing anywhere; findings table retired v14 (PO-6)
    expect(await db.actionItems.count()).toBe(0);
  });

  it('SCOPE_ADD does not mutate any table (IM-1: ProblemStatementScope has no Dexie footprint)', async () => {
    // IM-1 (ADR-085): the `questions` table was dropped at schema v10 and
    // QUESTION_* was removed from the HubAction union entirely (it no longer
    // exists — hence the `as unknown as HubAction` cast here). SCOPE_* is the
    // no-op action for ProblemStatementScope, which persists via the analyze
    // blob — not Dexie. No table holds scopes.
    await applyAction(db, {
      kind: 'SCOPE_ADD',
      investigationId: 'inv-x',
      scope: { id: 'sc-x' },
    } as unknown as HubAction);

    // proxy table — the no-op must write nothing anywhere; findings/hypotheses tables retired v14 (PO-6)
    expect(await db.actionItems.count()).toBe(0);
  });

  it('CAUSAL_LINK_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'CAUSAL_LINK_ADD',
      link: { id: 'c-x' },
    } as unknown as HubAction);

    // proxy table — the no-op must write nothing anywhere; causalLinks table retired v14 (PO-6)
    expect(await db.actionItems.count()).toBe(0);
  });

  it('HYPOTHESIS_ADD does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'HYPOTHESIS_ADD',
      hypothesis: { id: 'sc-x' },
    } as unknown as HubAction);

    // proxy table — the no-op must write nothing anywhere; hypotheses table retired v14 (PO-6)
    expect(await db.actionItems.count()).toBe(0);
  });

  it('canvas action (ADD_STEP) does not mutate any table', async () => {
    await applyAction(db, {
      kind: 'ADD_STEP',
      stepName: 'X',
    } as unknown as HubAction);

    expect(await db.canvasState.count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// MEASUREMENT_PLAN_* — dedicated measurementPlans Dexie table (PWA v5)
// ---------------------------------------------------------------------------

function makeMeasurementPlan(id: string, hypothesisId: string): MeasurementPlan {
  return {
    id,
    createdAt: NOW,
    deletedAt: null,
    hypothesisId,
    outcome: 'Y',
    primaryFactor: 'X',
    neededFactors: [],
    method: 'sensor',
    sampleSize: 10,
    owner: 'pm-1',
    status: 'planned',
    scope: [],
    processLocation: '',
  };
}

describe('applyAction — MEASUREMENT_PLAN_ADD (PWA)', () => {
  it('persists a new MeasurementPlan to the measurementPlans table', async () => {
    const plan = makeMeasurementPlan('mp-1', 'h-1');
    await applyAction(db, { kind: 'MEASUREMENT_PLAN_ADD', plan });
    const persisted = await db.measurementPlans.toArray();
    expect(persisted).toEqual([plan]);
  });
});

describe('applyAction — MEASUREMENT_PLAN_UPDATE (PWA)', () => {
  it('merges patch onto an existing plan', async () => {
    const plan = makeMeasurementPlan('mp-2', 'h-1');
    await db.measurementPlans.put(plan);
    await applyAction(db, {
      kind: 'MEASUREMENT_PLAN_UPDATE',
      planId: 'mp-2',
      patch: { status: 'in-progress', sampleSize: 50 },
    });
    const persisted = await db.measurementPlans.get('mp-2');
    expect(persisted?.status).toBe('in-progress');
    expect(persisted?.sampleSize).toBe(50);
  });
});

describe('applyAction — MEASUREMENT_PLAN_REMOVE (PWA)', () => {
  it('soft-deletes via deletedAt', async () => {
    const plan = makeMeasurementPlan('mp-3', 'h-1');
    await db.measurementPlans.put(plan);
    await applyAction(db, { kind: 'MEASUREMENT_PLAN_REMOVE', planId: 'mp-3', removedAt: 200 });
    const persisted = await db.measurementPlans.get('mp-3');
    expect(persisted?.deletedAt).toBe(200);
  });
});

describe('applyAction — MEASUREMENT_PLAN_LINK_FINDING (PWA)', () => {
  it('appends findingId to linkedFindingIds', async () => {
    const plan = makeMeasurementPlan('mp-4', 'h-1');
    await db.measurementPlans.put(plan);
    await applyAction(db, {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING',
      planId: 'mp-4',
      findingId: 'f-1',
    });
    const persisted = await db.measurementPlans.get('mp-4');
    expect(persisted?.linkedFindingIds).toEqual(['f-1']);
  });
});

describe('applyAction — no-op and session-only kinds', () => {
  it.each([
    'EVIDENCE_SOURCE_ADD',
    // EVIDENCE_SOURCE_UPDATE_CURSOR is no longer a no-op (F3.5 P5.1 wired it).
    // See applyAction.cursor.test.ts for its full coverage.
    'EVIDENCE_SOURCE_REMOVE',
    'FINDING_UPDATE',
    'FINDING_ARCHIVE',
    // IM-1 (ADR-085): QUESTION_UPDATE / QUESTION_ARCHIVE removed from HubAction union.
    // SCOPE_UPDATE / SCOPE_ARCHIVE are the IM-1 replacements for ProblemStatementScope.
    'SCOPE_UPDATE',
    'SCOPE_ARCHIVE',
    'CAUSAL_LINK_UPDATE',
    'CAUSAL_LINK_ARCHIVE',
    'HYPOTHESIS_UPDATE',
    'HYPOTHESIS_ARCHIVE',
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
