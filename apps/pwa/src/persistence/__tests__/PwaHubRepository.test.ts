// apps/pwa/src/persistence/__tests__/PwaHubRepository.test.ts
//
// Smoke tests for PwaHubRepository skeleton (P3.1).
// - dispatch error paths (no-hub, applyAction-not-implemented)
// - hubs.get / hubs.list happy + empty paths
// - outcomes.listByHub with live + tombstoned entries
// - canvasState.getByHub with matching + mismatched hubId
// - stub APIs return undefined / [] as documented
//
// Mocking strategy:
//   vi.hoisted() ensures mock vars are available inside vi.mock factory closures.
//   vi.mock() BEFORE subject imports — required per testing.md and MEMORY.md.
//   vi is imported explicitly (globals:true gives runtime access; tsc needs the import).

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// vi.hoisted + vi.mock must appear before the subject imports so that vitest
// can hoist them above the import block at transform time.
const mocks = vi.hoisted(() => ({
  loadHub: vi.fn(),
  saveHub: vi.fn(),
}));

vi.mock('../../db/hubRepository', () => ({
  hubRepository: {
    loadHub: mocks.loadHub,
    saveHub: mocks.saveHub,
    getOptInFlag: vi.fn(),
    setOptInFlag: vi.fn(),
    clearHub: vi.fn(),
    clearAll: vi.fn(),
  },
}));

import { PwaHubRepository } from '../PwaHubRepository';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';
import type { HubAction } from '@variscout/core/actions';

// ---------------------------------------------------------------------------
// Minimal ProcessMap fixture (required fields only)
// ---------------------------------------------------------------------------

const FIXTURE_MAP: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000_000;

function makeHub(overrides: Partial<ProcessHub> = {}): ProcessHub {
  return {
    id: 'hub-of-one',
    name: 'Test Hub',
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function makeOutcome(id: string, deletedAt: number | null = null): OutcomeSpec {
  return {
    id,
    hubId: 'hub-of-one',
    columnName: 'fill_weight',
    characteristicType: 'nominalIsBest',
    createdAt: NOW,
    deletedAt,
  };
}

// Minimal stub action — kind does not matter for skeleton dispatch tests because
// applyAction will throw before reaching any switch branch.
const STUB_ACTION: HubAction = {
  kind: 'OUTCOME_UPSERT',
  payload: makeOutcome('outcome-1'),
} as unknown as HubAction;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PwaHubRepository', () => {
  let repo: PwaHubRepository;

  beforeEach(() => {
    repo = new PwaHubRepository();
    mocks.loadHub.mockReset();
    mocks.saveHub.mockReset();
  });

  // ---- dispatch ----

  describe('dispatch', () => {
    it('throws "No active hub" when loadHub returns null', async () => {
      mocks.loadHub.mockResolvedValue(null);
      await expect(repo.dispatch(STUB_ACTION)).rejects.toThrow(
        'No active hub to dispatch action against'
      );
    });

    it('calls saveHub with the next hub snapshot when dispatch succeeds', async () => {
      const hub = makeHub();
      mocks.loadHub.mockResolvedValue(hub);
      mocks.saveHub.mockResolvedValue(undefined);
      // OUTCOME_UPDATE on a hub with no outcomes is a no-op that still saves
      const action: HubAction = {
        kind: 'OUTCOME_UPDATE',
        outcomeId: 'nonexistent',
        patch: { target: 5 },
      };
      await repo.dispatch(action);
      expect(mocks.saveHub).toHaveBeenCalledOnce();
      // The saved hub should equal the input hub (OUTCOME_UPDATE on nonexistent id is a no-op)
      expect(mocks.saveHub).toHaveBeenCalledWith(expect.objectContaining({ id: 'hub-of-one' }));
    });

    it('does not call saveHub when loadHub returns null', async () => {
      mocks.loadHub.mockResolvedValue(null);
      await expect(repo.dispatch(STUB_ACTION)).rejects.toThrow();
      expect(mocks.saveHub).not.toHaveBeenCalled();
    });
  });

  // ---- hubs.get ----

  describe('hubs.get', () => {
    it('returns the hub when ids match', async () => {
      const hub = makeHub({ id: 'hub-of-one' });
      mocks.loadHub.mockResolvedValue(hub);
      const result = await repo.hubs.get('hub-of-one');
      expect(result).toEqual(hub);
    });

    it('returns undefined when ids do not match', async () => {
      mocks.loadHub.mockResolvedValue(makeHub({ id: 'hub-of-one' }));
      const result = await repo.hubs.get('different-id');
      expect(result).toBeUndefined();
    });

    it('returns undefined when no hub is loaded', async () => {
      mocks.loadHub.mockResolvedValue(null);
      const result = await repo.hubs.get('hub-of-one');
      expect(result).toBeUndefined();
    });
  });

  // ---- hubs.list ----

  describe('hubs.list', () => {
    it('returns [hub] when a hub is loaded', async () => {
      const hub = makeHub();
      mocks.loadHub.mockResolvedValue(hub);
      const result = await repo.hubs.list();
      expect(result).toEqual([hub]);
    });

    it('returns [] when no hub is loaded', async () => {
      mocks.loadHub.mockResolvedValue(null);
      const result = await repo.hubs.list();
      expect(result).toEqual([]);
    });
  });

  // ---- outcomes.listByHub ----

  describe('outcomes.listByHub', () => {
    it('returns only live outcomes (deletedAt === null) for matching hubId', async () => {
      const live = makeOutcome('outcome-live', null);
      const tombstoned = makeOutcome('outcome-dead', NOW);
      mocks.loadHub.mockResolvedValue(makeHub({ outcomes: [live, tombstoned] }));
      const result = await repo.outcomes.listByHub('hub-of-one');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('outcome-live');
    });

    it('returns [] when hubId does not match', async () => {
      mocks.loadHub.mockResolvedValue(makeHub({ outcomes: [makeOutcome('outcome-1')] }));
      const result = await repo.outcomes.listByHub('other-hub');
      expect(result).toEqual([]);
    });

    it('returns [] when hub has no outcomes array', async () => {
      mocks.loadHub.mockResolvedValue(makeHub({ outcomes: undefined }));
      const result = await repo.outcomes.listByHub('hub-of-one');
      expect(result).toEqual([]);
    });

    it('returns [] when no hub is loaded', async () => {
      mocks.loadHub.mockResolvedValue(null);
      const result = await repo.outcomes.listByHub('hub-of-one');
      expect(result).toEqual([]);
    });
  });

  // ---- outcomes.get ----

  describe('outcomes.get', () => {
    it('returns the matching live outcome', async () => {
      const outcome = makeOutcome('outcome-1');
      mocks.loadHub.mockResolvedValue(makeHub({ outcomes: [outcome] }));
      const result = await repo.outcomes.get('outcome-1');
      expect(result).toEqual(outcome);
    });

    it('returns undefined for a tombstoned outcome', async () => {
      const tombstoned = makeOutcome('outcome-dead', NOW);
      mocks.loadHub.mockResolvedValue(makeHub({ outcomes: [tombstoned] }));
      const result = await repo.outcomes.get('outcome-dead');
      expect(result).toBeUndefined();
    });
  });

  // ---- canvasState.getByHub ----

  describe('canvasState.getByHub', () => {
    it('returns canonicalProcessMap when hubId matches', async () => {
      mocks.loadHub.mockResolvedValue(makeHub({ canonicalProcessMap: FIXTURE_MAP }));
      const result = await repo.canvasState.getByHub('hub-of-one');
      expect(result).toEqual(FIXTURE_MAP);
    });

    it('returns undefined when hubId does not match', async () => {
      mocks.loadHub.mockResolvedValue(makeHub({ canonicalProcessMap: FIXTURE_MAP }));
      const result = await repo.canvasState.getByHub('other-hub');
      expect(result).toBeUndefined();
    });

    it('returns undefined when hub has no canonicalProcessMap', async () => {
      mocks.loadHub.mockResolvedValue(makeHub({ canonicalProcessMap: undefined }));
      const result = await repo.canvasState.getByHub('hub-of-one');
      expect(result).toBeUndefined();
    });

    it('returns undefined when no hub is loaded', async () => {
      mocks.loadHub.mockResolvedValue(null);
      const result = await repo.canvasState.getByHub('hub-of-one');
      expect(result).toBeUndefined();
    });
  });

  // ---- dispatch end-to-end ----
  //
  // These integration tests prove that dispatch() calls loadHub → applyAction → saveHub
  // with the correct contract for each action category.
  //
  // applyAction.test.ts proves recipe correctness in isolation;
  // these tests prove the wiring is intact through the repository layer.

  describe('dispatch end-to-end', () => {
    // Freeze time for all tests in this block so Date.now()-dependent assertions are
    // deterministic. Use the plan's reference timestamp: 2026-05-06T12:00:00.000Z.
    const FROZEN_MS = new Date('2026-05-06T12:00:00.000Z').getTime();

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-06T12:00:00.000Z'));
      mocks.saveHub.mockResolvedValue(undefined);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('HUB_PERSIST_SNAPSHOT replaces the hub blob entirely', async () => {
      const initial = makeHub({ id: 'hub-of-one', name: 'Old Hub' });
      const replacement = makeHub({
        id: 'hub-of-one',
        name: 'New Hub',
        processGoal: 'ship on time',
      });
      mocks.loadHub.mockResolvedValue(initial);

      await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: replacement });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      expect(saved).toEqual(replacement);
    });

    it('HUB_UPDATE_GOAL persists the new processGoal and sets updatedAt', async () => {
      const hub = makeHub({ id: 'hub-of-one', processGoal: 'old goal' });
      mocks.loadHub.mockResolvedValue(hub);

      await repo.dispatch({
        kind: 'HUB_UPDATE_GOAL',
        hubId: 'hub-of-one',
        processGoal: 'new goal',
      });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      expect(saved.processGoal).toBe('new goal');
      expect(saved.updatedAt).toBe(FROZEN_MS);
    });

    it('OUTCOME_ADD pushes the new outcome to the outcomes array', async () => {
      const hub = makeHub({ id: 'hub-of-one', outcomes: [] });
      mocks.loadHub.mockResolvedValue(hub);
      const newOutcome = makeOutcome('outcome-new');

      await repo.dispatch({
        kind: 'OUTCOME_ADD',
        hubId: 'hub-of-one',
        outcome: newOutcome,
      });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      expect(saved.outcomes).toHaveLength(1);
      expect(saved.outcomes![0].id).toBe('outcome-new');
    });

    it('OUTCOME_UPDATE patches the target on the matching outcome', async () => {
      const outcome = makeOutcome('outcome-1');
      const hub = makeHub({ id: 'hub-of-one', outcomes: [outcome] });
      mocks.loadHub.mockResolvedValue(hub);

      await repo.dispatch({
        kind: 'OUTCOME_UPDATE',
        outcomeId: 'outcome-1',
        patch: { target: 5 },
      });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      expect(saved.outcomes![0].target).toBe(5);
    });

    it('OUTCOME_ARCHIVE soft-marks deletedAt on the matching outcome', async () => {
      const outcome = makeOutcome('outcome-1', null);
      const hub = makeHub({ id: 'hub-of-one', outcomes: [outcome] });
      mocks.loadHub.mockResolvedValue(hub);

      await repo.dispatch({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-1' });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      expect(saved.outcomes![0].deletedAt).toBe(FROZEN_MS);
    });

    it('OUTCOME_ARCHIVE is idempotent: second dispatch preserves the first deletedAt', async () => {
      const outcome = makeOutcome('outcome-1', null);
      const hub = makeHub({ id: 'hub-of-one', outcomes: [outcome] });

      // First dispatch — captures FROZEN_MS as deletedAt
      mocks.loadHub.mockResolvedValue(hub);
      await repo.dispatch({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-1' });
      const savedFirst = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      const firstDeletedAt = savedFirst.outcomes![0].deletedAt;
      expect(firstDeletedAt).toBe(FROZEN_MS);

      // Advance frozen clock so a second mutation would use a different timestamp
      vi.advanceTimersByTime(30_000);

      // Second dispatch — loadHub returns the already-archived hub from the first call
      mocks.saveHub.mockReset();
      mocks.saveHub.mockResolvedValue(undefined);
      mocks.loadHub.mockResolvedValue(savedFirst);
      await repo.dispatch({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-1' });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const savedSecond = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      // deletedAt must not be overwritten by the second dispatch
      expect(savedSecond.outcomes![0].deletedAt).toBe(firstDeletedAt);
    });

    it('INVESTIGATION_ARCHIVE is a no-op for the PWA blob (investigations are session-only)', async () => {
      // Contract: INVESTIGATION_ARCHIVE dispatches successfully but does not mutate
      // the hub blob on PWA, because investigations are not blob-resident (F3 normalizes).
      // The hub is saved unchanged (same reference equality via Immer structural sharing
      // is not guaranteed, but the shape must be deep-equal to the input).
      const outcome = makeOutcome('outcome-1', null);
      const hub = makeHub({ id: 'hub-of-one', outcomes: [outcome] });
      mocks.loadHub.mockResolvedValue(hub);

      await repo.dispatch({ kind: 'INVESTIGATION_ARCHIVE', investigationId: 'inv-1' });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      // Hub shape is unchanged — no outcome mutations because investigation cascade
      // finds no blob-resident children (hub→outcome only cascades when parentKind='hub').
      expect(saved.outcomes).toHaveLength(1);
      expect(saved.outcomes![0].deletedAt).toBeNull();
    });

    it('PLACE_CHIP_ON_STEP is a no-op for the PWA blob (canvas mutations live in canvasStore, R15)', async () => {
      // Contract: canvas actions dispatch successfully but do not mutate the hub blob.
      // Canvas state is owned by canvasStore; the blob is overwritten via
      // HUB_PERSIST_SNAPSHOT when the user saves. See R15 in applyAction.ts.
      const hub = makeHub({ id: 'hub-of-one', outcomes: [makeOutcome('outcome-1', null)] });
      mocks.loadHub.mockResolvedValue(hub);

      await repo.dispatch({ kind: 'PLACE_CHIP_ON_STEP', chipId: 'chip-1', stepId: 'step-1' });

      expect(mocks.saveHub).toHaveBeenCalledOnce();
      const saved = mocks.saveHub.mock.calls[0][0] as ProcessHub;
      // Hub blob is unchanged — canvas is not a blob-resident structure on PWA.
      expect(saved).toMatchObject({ id: 'hub-of-one' });
      expect(saved.outcomes).toHaveLength(1);
      expect(saved.outcomes![0].deletedAt).toBeNull();
    });
  });

  // ---- stub APIs ----

  describe('stub read APIs (F3 not yet implemented)', () => {
    beforeEach(() => {
      mocks.loadHub.mockResolvedValue(makeHub());
    });

    it('evidenceSnapshots.get returns undefined', async () => {
      expect(await repo.evidenceSnapshots.get('any')).toBeUndefined();
    });

    it('evidenceSnapshots.listByHub returns []', async () => {
      expect(await repo.evidenceSnapshots.listByHub('hub-of-one')).toEqual([]);
    });

    it('evidenceSources.get returns undefined', async () => {
      expect(await repo.evidenceSources.get('any')).toBeUndefined();
    });

    it('evidenceSources.listByHub returns []', async () => {
      expect(await repo.evidenceSources.listByHub('hub-of-one')).toEqual([]);
    });

    it('evidenceSources.getCursor returns undefined', async () => {
      expect(await repo.evidenceSources.getCursor('hub-of-one', 'src-1')).toBeUndefined();
    });

    it('investigations.get returns undefined', async () => {
      expect(await repo.investigations.get('any')).toBeUndefined();
    });

    it('investigations.listByHub returns []', async () => {
      expect(await repo.investigations.listByHub('hub-of-one')).toEqual([]);
    });

    it('findings.get returns undefined', async () => {
      expect(await repo.findings.get('any')).toBeUndefined();
    });

    it('findings.listByInvestigation returns []', async () => {
      expect(await repo.findings.listByInvestigation('inv-1')).toEqual([]);
    });

    it('questions.get returns undefined', async () => {
      expect(await repo.questions.get('any')).toBeUndefined();
    });

    it('questions.listByInvestigation returns []', async () => {
      expect(await repo.questions.listByInvestigation('inv-1')).toEqual([]);
    });

    it('causalLinks.get returns undefined', async () => {
      expect(await repo.causalLinks.get('any')).toBeUndefined();
    });

    it('causalLinks.listByInvestigation returns []', async () => {
      expect(await repo.causalLinks.listByInvestigation('inv-1')).toEqual([]);
    });

    it('suspectedCauses.get returns undefined', async () => {
      expect(await repo.suspectedCauses.get('any')).toBeUndefined();
    });

    it('suspectedCauses.listByInvestigation returns []', async () => {
      expect(await repo.suspectedCauses.listByInvestigation('inv-1')).toEqual([]);
    });
  });
});
