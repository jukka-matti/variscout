// apps/azure/src/persistence/__tests__/AzureHubRepository.test.ts
//
// Dispatch tests for AzureHubRepository skeleton (P5.1).
// Exercises the write path only; read APIs are in AzureHubRepository.read.test.ts.
//
// - dispatch: HUB_PERSIST_SNAPSHOT bootstraps via saveProcessHubToIndexedDB
// - dispatch: all other action kinds throw the P5.2/P5.3 not-implemented error
//
// Mocking strategy:
//   vi.hoisted() + vi.mock() before subject imports per testing.md invariant.
//   saveProcessHubToIndexedDB is module-mocked.

import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.hoisted + vi.mock must appear before the subject imports so that vitest
// can hoist them above the import block at transform time.
const mocks = vi.hoisted(() => ({
  saveProcessHubToIndexedDB: vi.fn<() => Promise<void>>(),
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

  it('HUB_UPDATE_GOAL throws the P5.2/P5.3 not-implemented error', async () => {
    await expect(
      repo.dispatch({ kind: 'HUB_UPDATE_GOAL', hubId: 'hub-azure-1', processGoal: 'goal' })
    ).rejects.toThrow(
      'AzureHubRepository.dispatch: handler for kind "HUB_UPDATE_GOAL" not yet implemented (P5.2/P5.3)'
    );
  });

  it('OUTCOME_ADD throws the P5.2/P5.3 not-implemented error', async () => {
    await expect(
      repo.dispatch({
        kind: 'OUTCOME_ADD',
        hubId: 'hub-azure-1',
        outcome: makeOutcome('outcome-1'),
      })
    ).rejects.toThrow(
      'AzureHubRepository.dispatch: handler for kind "OUTCOME_ADD" not yet implemented (P5.2/P5.3)'
    );
  });

  it('OUTCOME_ARCHIVE throws the P5.2/P5.3 not-implemented error', async () => {
    await expect(
      repo.dispatch({ kind: 'OUTCOME_ARCHIVE', outcomeId: 'outcome-1' })
    ).rejects.toThrow(
      'AzureHubRepository.dispatch: handler for kind "OUTCOME_ARCHIVE" not yet implemented (P5.2/P5.3)'
    );
  });

  it('INVESTIGATION_ARCHIVE throws the P5.2/P5.3 not-implemented error', async () => {
    await expect(
      repo.dispatch({ kind: 'INVESTIGATION_ARCHIVE', investigationId: 'inv-1' })
    ).rejects.toThrow(
      'AzureHubRepository.dispatch: handler for kind "INVESTIGATION_ARCHIVE" not yet implemented (P5.2/P5.3)'
    );
  });

  it('error message includes the action kind verbatim', async () => {
    const action: HubAction = {
      kind: 'OUTCOME_UPDATE',
      outcomeId: 'outcome-1',
      patch: { target: 5 },
    };
    await expect(repo.dispatch(action)).rejects.toThrow('"OUTCOME_UPDATE"');
  });
});
