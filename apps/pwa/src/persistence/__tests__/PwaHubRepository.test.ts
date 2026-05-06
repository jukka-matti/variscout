// apps/pwa/src/persistence/__tests__/PwaHubRepository.test.ts
//
// F3 P5 — read-side + dispatch tests for PwaHubRepository against the
// normalized 13-table schema.
//
// Coverage:
//   - dispatch routes through applyAction (HUB_PERSIST_SNAPSHOT bootstrap)
//   - hubs.get / hubs.list rebuild the ProcessHub shape (outcomes + canvasState)
//   - outcomes filter by deletedAt === null
//   - canvasState.getByHub strips the hubId FK
//   - evidenceSources.getCursor enforces the [hubId+sourceId] semantic key
//   - read transactions wrap multi-table joins
//   - legacy DB cleanup fires Dexie.delete('variscout-pwa') at construction
//   - empty stub read APIs return [] / undefined safely
//
// fake-indexeddb/auto polyfills IndexedDB globally; the real Dexie instance
// works end-to-end in jsdom.

import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EvidenceSource, EvidenceSnapshot, EvidenceSourceCursor } from '@variscout/core';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';
import { db } from '../../db/schema';
import { PwaHubRepository } from '../PwaHubRepository';
import { applyAction } from '../applyAction';

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
    rowCount: 0,
    origin: 'paste',
    importedAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeCursor(id: string, hubId: string, sourceId: string): EvidenceSourceCursor {
  return {
    id,
    hubId,
    sourceId,
    lastSeenSnapshotId: `snap-${sourceId}`,
    lastSeenAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear every table the repo reads from.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await Promise.all([
    db.hubs.clear(),
    db.outcomes.clear(),
    db.canvasState.clear(),
    db.evidenceSnapshots.clear(),
    db.evidenceSources.clear(),
    db.evidenceSourceCursors.clear(),
    db.investigations.clear(),
    db.findings.clear(),
    db.questions.clear(),
    db.causalLinks.clear(),
    db.suspectedCauses.clear(),
  ]);
});

afterEach(async () => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

describe('PwaHubRepository.dispatch', () => {
  it('routes HUB_PERSIST_SNAPSHOT through applyAction (bootstrap path)', async () => {
    const repo = new PwaHubRepository();
    const hub = makeHub('hub-d', {
      processGoal: 'goal',
      outcomes: [makeOutcome('out-d', 'hub-d')],
    });

    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    // Verify the dispatch produced the same row state as a direct applyAction call.
    const hubRow = await db.hubs.get('hub-d');
    expect(hubRow?.processGoal).toBe('goal');
    const outcomes = await db.outcomes.where('hubId').equals('hub-d').toArray();
    expect(outcomes).toHaveLength(1);
  });

  it('propagates rejections from applyAction (loud-fail invariant)', async () => {
    const repo = new PwaHubRepository();

    await expect(
      repo.dispatch({ kind: 'HUB_UPDATE_GOAL', hubId: 'ghost', processGoal: 'x' })
    ).rejects.toThrow(/ghost/);
  });

  it('bootstrap: HUB_PERSIST_SNAPSHOT works against an empty repository', async () => {
    const repo = new PwaHubRepository();
    expect(await db.hubs.count()).toBe(0);

    await repo.dispatch({
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-boot'),
    });

    expect(await db.hubs.count()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// hubs.get / hubs.list
// ---------------------------------------------------------------------------

describe('PwaHubRepository.hubs', () => {
  it('get rebuilds the ProcessHub shape with outcomes + canonicalProcessMap re-attached', async () => {
    const repo = new PwaHubRepository();
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-r1', {
        processGoal: 'restored',
        outcomes: [makeOutcome('out-r1', 'hub-r1', { columnName: 'a' })],
        canonicalProcessMap: makeProcessMap({ ctsColumn: 'cts' }),
      }),
    });

    const hub = await repo.hubs.get('hub-r1');
    expect(hub?.id).toBe('hub-r1');
    expect(hub?.processGoal).toBe('restored');
    expect(hub?.outcomes).toHaveLength(1);
    expect(hub?.outcomes?.[0].id).toBe('out-r1');
    expect(hub?.canonicalProcessMap?.ctsColumn).toBe('cts');
    // hubId FK must not leak through into the ProcessMap.
    expect((hub?.canonicalProcessMap as unknown as { hubId?: string })?.hubId).toBeUndefined();
  });

  it('get filters out outcomes with non-null deletedAt', async () => {
    const repo = new PwaHubRepository();
    await db.hubs.put({ ...makeHub('hub-flt') });
    await db.outcomes.bulkPut([
      makeOutcome('out-live', 'hub-flt'),
      makeOutcome('out-arch', 'hub-flt', { deletedAt: NOW }),
    ]);

    const hub = await repo.hubs.get('hub-flt');
    expect(hub?.outcomes).toHaveLength(1);
    expect(hub?.outcomes?.[0].id).toBe('out-live');
  });

  it('get omits canonicalProcessMap when no canvasState row exists', async () => {
    const repo = new PwaHubRepository();
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-noc') });

    const hub = await repo.hubs.get('hub-noc');
    expect(hub?.id).toBe('hub-noc');
    expect(hub?.canonicalProcessMap).toBeUndefined();
  });

  it('get returns undefined when the hub does not exist', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.hubs.get('does-not-exist')).toBeUndefined();
  });

  it('get returns undefined when the hub has been soft-deleted', async () => {
    const repo = new PwaHubRepository();
    await db.hubs.put({ ...makeHub('hub-dead'), deletedAt: NOW });
    expect(await repo.hubs.get('hub-dead')).toBeUndefined();
  });

  it('list returns an array of joined hubs', async () => {
    const repo = new PwaHubRepository();
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-l1', { outcomes: [makeOutcome('out-l1', 'hub-l1')] }),
    });
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-l2'),
    });

    const hubs = await repo.hubs.list();
    expect(Array.isArray(hubs)).toBe(true);
    expect(hubs).toHaveLength(2);
    const byId = new Map(hubs.map(h => [h.id, h]));
    expect(byId.get('hub-l1')?.outcomes).toHaveLength(1);
    expect(byId.get('hub-l2')?.outcomes).toBeUndefined();
  });

  it('list excludes soft-deleted hubs', async () => {
    const repo = new PwaHubRepository();
    await db.hubs.put({ ...makeHub('hub-live') });
    await db.hubs.put({ ...makeHub('hub-soft'), deletedAt: NOW });

    const hubs = await repo.hubs.list();
    expect(hubs).toHaveLength(1);
    expect(hubs[0].id).toBe('hub-live');
  });

  it('list returns [] when no hubs exist', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.hubs.list()).toEqual([]);
  });

  it('hubs.get wraps reads in a db.transaction across the three joined tables', async () => {
    // The read-transaction wrap is the F3 fix-commit Issue 4 contract — guards
    // against partial-state splice across hub / outcomes / canvasState writes
    // happening between the .get() and the joinHub() reads.
    const repo = new PwaHubRepository();
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-tx') });

    const txSpy = vi.spyOn(db, 'transaction');
    await repo.hubs.get('hub-tx');

    expect(txSpy).toHaveBeenCalled();
    // First call: mode 'r', table list includes hubs + outcomes + canvasState.
    const call = txSpy.mock.calls[0] as unknown as [string, unknown];
    const [mode, tables] = call;
    expect(mode).toBe('r');
    expect(Array.isArray(tables)).toBe(true);
    const tableArray = tables as unknown[];
    expect(tableArray).toContain(db.hubs);
    expect(tableArray).toContain(db.outcomes);
    expect(tableArray).toContain(db.canvasState);
  });

  it('hubs.list wraps reads in a db.transaction across the three joined tables', async () => {
    const repo = new PwaHubRepository();
    const txSpy = vi.spyOn(db, 'transaction');

    await repo.hubs.list();

    expect(txSpy).toHaveBeenCalled();
    const call = txSpy.mock.calls[0] as unknown as [string, unknown];
    const [mode, tables] = call;
    expect(mode).toBe('r');
    const tableArray = tables as unknown[];
    expect(tableArray).toContain(db.hubs);
    expect(tableArray).toContain(db.outcomes);
    expect(tableArray).toContain(db.canvasState);
  });
});

// ---------------------------------------------------------------------------
// outcomes
// ---------------------------------------------------------------------------

describe('PwaHubRepository.outcomes', () => {
  it('get returns a live outcome row', async () => {
    const repo = new PwaHubRepository();
    await db.outcomes.put(makeOutcome('out-1', 'hub-x'));

    const row = await repo.outcomes.get('out-1');
    expect(row?.id).toBe('out-1');
  });

  it('get returns undefined for a soft-deleted outcome', async () => {
    const repo = new PwaHubRepository();
    await db.outcomes.put(makeOutcome('out-arch', 'hub-x', { deletedAt: NOW }));
    expect(await repo.outcomes.get('out-arch')).toBeUndefined();
  });

  it('get returns undefined for a missing outcome', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.outcomes.get('ghost')).toBeUndefined();
  });

  it('listByHub filters by deletedAt === null', async () => {
    const repo = new PwaHubRepository();
    await db.outcomes.bulkPut([
      makeOutcome('o-live-1', 'hub-l'),
      makeOutcome('o-live-2', 'hub-l'),
      makeOutcome('o-dead', 'hub-l', { deletedAt: NOW }),
      makeOutcome('o-other', 'hub-other'),
    ]);

    const rows = await repo.outcomes.listByHub('hub-l');
    expect(rows).toHaveLength(2);
    const ids = rows.map(r => r.id).sort();
    expect(ids).toEqual(['o-live-1', 'o-live-2']);
  });
});

// ---------------------------------------------------------------------------
// canvasState
// ---------------------------------------------------------------------------

describe('PwaHubRepository.canvasState', () => {
  it('getByHub returns the ProcessMap with hubId stripped', async () => {
    const repo = new PwaHubRepository();
    await applyAction(db, {
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-c1', {
        canonicalProcessMap: makeProcessMap({ ctsColumn: 'col' }),
      }),
    });

    const map = await repo.canvasState.getByHub('hub-c1');
    expect(map?.ctsColumn).toBe('col');
    expect(map?.version).toBe(1);
    // hubId FK must not leak.
    expect((map as unknown as { hubId?: string })?.hubId).toBeUndefined();
  });

  it('getByHub returns undefined when no row exists', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.canvasState.getByHub('absent')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// evidenceSources.getCursor — Issue 3 fix: hubId+sourceId composite filter
// ---------------------------------------------------------------------------

describe('PwaHubRepository.evidenceSources.getCursor', () => {
  it('returns the cursor when hubId AND sourceId both match', async () => {
    const repo = new PwaHubRepository();
    await db.evidenceSourceCursors.put(makeCursor('cur-A', 'hub-A', 'src-1'));

    const found = await repo.evidenceSources.getCursor('hub-A', 'src-1');
    expect(found?.id).toBe('cur-A');
    expect(found?.hubId).toBe('hub-A');
    expect(found?.sourceId).toBe('src-1');
  });

  it('returns undefined when sourceId matches but hubId does not (filter must fire)', async () => {
    // Two cursors with the same sourceId but different hubIds — the post-fetch
    // hubId filter is the contract that prevents cross-hub leakage.
    const repo = new PwaHubRepository();
    await db.evidenceSourceCursors.put(makeCursor('cur-A', 'hub-A', 'src-shared'));

    const found = await repo.evidenceSources.getCursor('hub-B', 'src-shared');
    expect(found).toBeUndefined();
  });

  it('returns undefined when neither hubId nor sourceId match', async () => {
    const repo = new PwaHubRepository();
    await db.evidenceSourceCursors.put(makeCursor('cur-x', 'hub-x', 'src-x'));

    const found = await repo.evidenceSources.getCursor('hub-y', 'src-y');
    expect(found).toBeUndefined();
  });

  it('returns the right cursor when two hubs share a sourceId', async () => {
    const repo = new PwaHubRepository();
    await db.evidenceSourceCursors.bulkPut([
      makeCursor('cur-A', 'hub-A', 'src-shared'),
      makeCursor('cur-B', 'hub-B', 'src-shared'),
    ]);

    const a = await repo.evidenceSources.getCursor('hub-A', 'src-shared');
    const b = await repo.evidenceSources.getCursor('hub-B', 'src-shared');
    expect(a?.id).toBe('cur-A');
    expect(b?.id).toBe('cur-B');
  });
});

// ---------------------------------------------------------------------------
// Stub read APIs — F3 declares tables, F3.5/F5 wire writes; reads must work
// against the (empty) tables today without throwing.
// ---------------------------------------------------------------------------

describe('PwaHubRepository — stub read APIs (empty tables until F3.5/F5)', () => {
  it('evidenceSnapshots.listByHub returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.evidenceSnapshots.listByHub('hub-x')).toEqual([]);
  });

  it('evidenceSnapshots.get returns the row when it exists (post-F3.5 ready)', async () => {
    const repo = new PwaHubRepository();
    await db.evidenceSnapshots.put(makeEvidenceSnapshot('snap-1', 'hub-x', 'src-x'));
    expect((await repo.evidenceSnapshots.get('snap-1'))?.id).toBe('snap-1');
  });

  it('evidenceSources.listByHub returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.evidenceSources.listByHub('hub-x')).toEqual([]);
  });

  it('evidenceSources.get returns the row when it exists (post-F3.5 ready)', async () => {
    const repo = new PwaHubRepository();
    await db.evidenceSources.put(makeEvidenceSource('src-1', 'hub-x'));
    expect((await repo.evidenceSources.get('src-1'))?.id).toBe('src-1');
  });

  it('investigations.listByHub returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.investigations.listByHub('hub-x')).toEqual([]);
  });

  it('findings.listByInvestigation returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.findings.listByInvestigation('inv-x')).toEqual([]);
  });

  it('questions.listByInvestigation returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.questions.listByInvestigation('inv-x')).toEqual([]);
  });

  it('causalLinks.listByInvestigation returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.causalLinks.listByInvestigation('inv-x')).toEqual([]);
  });

  it('suspectedCauses.listByInvestigation returns []', async () => {
    const repo = new PwaHubRepository();
    expect(await repo.suspectedCauses.listByInvestigation('inv-x')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Legacy DB cleanup — best-effort fire-and-forget Dexie.delete on construction
// ---------------------------------------------------------------------------

describe('PwaHubRepository — legacy DB cleanup', () => {
  it('calls Dexie.delete with the legacy DB name on construction', async () => {
    const deleteSpy = vi.spyOn(Dexie, 'delete').mockResolvedValue(undefined);

    const repo = new PwaHubRepository();
    void repo; // keep the instance alive until end-of-test

    expect(deleteSpy).toHaveBeenCalledWith('variscout-pwa');
    deleteSpy.mockRestore();
  });

  it('swallows errors from the legacy DB delete (does not throw at construction)', async () => {
    const deleteSpy = vi.spyOn(Dexie, 'delete').mockRejectedValue(new Error('Simulated IDB error'));

    expect(() => new PwaHubRepository()).not.toThrow();

    // Allow the unhandled-rejection .catch swallow to settle.
    await new Promise(resolve => setTimeout(resolve, 0));
    deleteSpy.mockRestore();
  });
});
