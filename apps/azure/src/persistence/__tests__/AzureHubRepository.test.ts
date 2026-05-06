// apps/azure/src/persistence/__tests__/AzureHubRepository.test.ts
//
// Dispatch tests for AzureHubRepository.
// Exercises the write path only; read APIs are in AzureHubRepository.read.test.ts.
//
// - dispatch: HUB_PERSIST_SNAPSHOT bootstraps via saveProcessHubToIndexedDB (short-circuit)
// - dispatch: all other action kinds delegate to applyAction (P5.3)
//
// Mocking strategy:
//   vi.hoisted() + vi.mock() before subject imports per testing.md invariant.
//   saveProcessHubToIndexedDB is module-mocked.
//   applyAction is module-mocked so we can verify delegation without real Dexie.

import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.hoisted + vi.mock must appear before the subject imports so that vitest
// can hoist them above the import block at transform time.
const mocks = vi.hoisted(() => ({
  saveProcessHubToIndexedDB: vi.fn<() => Promise<void>>(),
  applyAction: vi.fn<() => Promise<void>>(),
}));

vi.mock('../../services/localDb', () => ({
  saveProcessHubToIndexedDB: mocks.saveProcessHubToIndexedDB,
  // Provide minimal stubs for other localDb exports so the module resolves cleanly.
  ensureDefaultProcessHubInIndexedDB: vi.fn(),
  listProcessHubsFromIndexedDB: vi.fn(),
  saveEvidenceSourceToIndexedDB: vi.fn(),
  saveEvidenceSnapshotToIndexedDB: vi.fn(),
  saveSustainmentRecordToIndexedDB: vi.fn(),
  saveControlHandoffToIndexedDB: vi.fn(),
}));

// Mock applyAction so dispatch tests verify delegation without real Dexie.
vi.mock('../applyAction', () => ({
  applyAction: mocks.applyAction,
}));

// db/schema is not used in dispatch tests — db access is blocked by the mock.
// We mock the db module as well to prevent Dexie from attempting to open IndexedDB.
vi.mock('../../db/schema', () => ({
  db: {
    processHubs: { get: vi.fn(), toArray: vi.fn(), put: vi.fn(), clear: vi.fn() },
    evidenceSources: { get: vi.fn(), where: vi.fn(), toArray: vi.fn(), clear: vi.fn() },
    evidenceSnapshots: { get: vi.fn(), where: vi.fn(), toArray: vi.fn(), clear: vi.fn() },
    evidenceSourceCursors: { get: vi.fn(), clear: vi.fn() },
  },
}));

import { AzureHubRepository } from '../AzureHubRepository';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { HubAction } from '@variscout/core/actions';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const NOW = 1_746_352_800_000;

function makeHub(overrides: Partial<ProcessHub> = {}): ProcessHub {
  return {
    id: 'hub-azure-1',
    name: 'Azure Test Hub',
    createdAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function makeOutcome(id: string, deletedAt: number | null = null): OutcomeSpec {
  return {
    id,
    hubId: 'hub-azure-1',
    columnName: 'fill_weight',
    characteristicType: 'nominalIsBest',
    createdAt: NOW,
    deletedAt,
  };
}

// ---------------------------------------------------------------------------
// Dispatch tests
// ---------------------------------------------------------------------------

describe('AzureHubRepository dispatch', () => {
  let repo: AzureHubRepository;

  beforeEach(() => {
    repo = new AzureHubRepository();
    mocks.saveProcessHubToIndexedDB.mockReset();
    mocks.saveProcessHubToIndexedDB.mockResolvedValue(undefined);
    mocks.applyAction.mockReset();
    mocks.applyAction.mockResolvedValue(undefined);
  });

  it('HUB_PERSIST_SNAPSHOT calls saveProcessHubToIndexedDB with the action hub', async () => {
    const hub = makeHub({ id: 'hub-azure-1', name: 'Bootstrap Hub' });
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    expect(mocks.saveProcessHubToIndexedDB).toHaveBeenCalledOnce();
    expect(mocks.saveProcessHubToIndexedDB).toHaveBeenCalledWith(hub);
  });

  it('HUB_PERSIST_SNAPSHOT returns undefined (bootstrap path)', async () => {
    const hub = makeHub({ id: 'hub-azure-1', name: 'New Hub' });
    await expect(repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub })).resolves.toBeUndefined();
  });

  it('HUB_PERSIST_SNAPSHOT does not throw even when called multiple times', async () => {
    const hub = makeHub();
    await expect(repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub })).resolves.toBeUndefined();
    await expect(repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub })).resolves.toBeUndefined();
    expect(mocks.saveProcessHubToIndexedDB).toHaveBeenCalledTimes(2);
  });

  it('propagates errors from saveProcessHubToIndexedDB', async () => {
    mocks.saveProcessHubToIndexedDB.mockRejectedValue(new Error('QuotaExceededError'));
    await expect(repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub() })).rejects.toThrow(
      'QuotaExceededError'
    );
  });

  it('HUB_UPDATE_GOAL delegates to applyAction (P5.3)', async () => {
    const action: HubAction = {
      kind: 'HUB_UPDATE_GOAL',
      hubId: 'hub-azure-1',
      processGoal: 'goal',
    };
    await repo.dispatch(action);

    expect(mocks.applyAction).toHaveBeenCalledOnce();
    expect(mocks.applyAction).toHaveBeenCalledWith(action);
    expect(mocks.saveProcessHubToIndexedDB).not.toHaveBeenCalled();
  });

  it('OUTCOME_ADD delegates to applyAction (P5.3)', async () => {
    const action: HubAction = {
      kind: 'OUTCOME_ADD',
      hubId: 'hub-azure-1',
      outcome: makeOutcome('outcome-1'),
    };
    await repo.dispatch(action);

    expect(mocks.applyAction).toHaveBeenCalledOnce();
    expect(mocks.applyAction).toHaveBeenCalledWith(action);
  });

  it('OUTCOME_ARCHIVE delegates to applyAction (P5.3)', async () => {
    const action: HubAction = { kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-1' };
    await repo.dispatch(action);

    expect(mocks.applyAction).toHaveBeenCalledOnce();
    expect(mocks.applyAction).toHaveBeenCalledWith(action);
  });

  it('INVESTIGATION_ARCHIVE delegates to applyAction (P5.3)', async () => {
    const action: HubAction = { kind: 'INVESTIGATION_ARCHIVE', investigationId: 'inv-1' };
    await repo.dispatch(action);

    expect(mocks.applyAction).toHaveBeenCalledOnce();
    expect(mocks.applyAction).toHaveBeenCalledWith(action);
  });

  it('OUTCOME_UPDATE delegates to applyAction (P5.3)', async () => {
    const action: HubAction = {
      kind: 'OUTCOME_UPDATE',
      outcomeId: 'outcome-1',
      patch: { target: 5 },
    };
    await repo.dispatch(action);

    expect(mocks.applyAction).toHaveBeenCalledWith(action);
  });

  it('propagates errors from applyAction', async () => {
    mocks.applyAction.mockRejectedValue(new Error('OUTCOME_ADD: hub hub-1 not found'));
    const action: HubAction = { kind: 'OUTCOME_ADD', hubId: 'hub-1', outcome: makeOutcome('o-1') };
    await expect(repo.dispatch(action)).rejects.toThrow('OUTCOME_ADD: hub hub-1 not found');
  });

  it('HUB_PERSIST_SNAPSHOT does NOT call applyAction', async () => {
    const hub = makeHub();
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    expect(mocks.saveProcessHubToIndexedDB).toHaveBeenCalledOnce();
    expect(mocks.applyAction).not.toHaveBeenCalled();
  });
});
