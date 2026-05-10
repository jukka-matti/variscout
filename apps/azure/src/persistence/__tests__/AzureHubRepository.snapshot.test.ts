// apps/azure/src/persistence/__tests__/AzureHubRepository.snapshot.test.ts
//
// Real-Dexie integration tests for AzureHubRepository.dispatch HUB_PERSIST_SNAPSHOT.
//
// These tests verify the decomposition contract using the actual Dexie schema
// (not mocks) via the 'fake-indexeddb/auto' polyfill. Coverage:
//
//   1. Hub is saved WITHOUT improvementProjects embedded in the hub blob
//   2. ImprovementProjects are written to the dedicated improvementProjects table
//   3. Empty improvementProjects array — table stays empty
//   4. Hub with no improvementProjects field — table stays empty
//   5. Stale IPs (present in DB but absent from the new snapshot) are deleted
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB
// polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProcessHub } from '@variscout/core/processHub';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { AzureHubRepository } from '../AzureHubRepository';
import { db } from '../../db/schema';

// ---------------------------------------------------------------------------
// Fixture helpers — deterministic literal values
// ---------------------------------------------------------------------------

const NOW = 1_746_352_800_000;

function makeIP(
  id: string,
  hubId: string,
  overrides: Partial<ImprovementProject> = {}
): ImprovementProject {
  return {
    id,
    hubId,
    status: 'draft',
    createdAt: NOW,
    deletedAt: null,
    updatedAt: NOW,
    metadata: { title: id },
    goal: { outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 } },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

function makeHub(id: string, ips: ImprovementProject[] = []): ProcessHub {
  return {
    id,
    name: `Hub ${id}`,
    createdAt: NOW,
    deletedAt: null,
    improvementProjects: ips,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear tables touched by dispatch before each test.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.processHubs.clear();
  await db.improvementProjects.clear();
});

afterEach(async () => {
  await db.processHubs.clear();
  await db.improvementProjects.clear();
});

// ---------------------------------------------------------------------------
// Integration tests for HUB_PERSIST_SNAPSHOT decomposition
// ---------------------------------------------------------------------------

describe('AzureHubRepository.dispatch HUB_PERSIST_SNAPSHOT — Dexie integration', () => {
  it('strips improvementProjects from the hub blob and writes them to the dedicated table', async () => {
    const repo = new AzureHubRepository();
    const ip = makeIP('ip-1', 'hub-1');
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-1', [ip]) });

    // The hub row in processHubs must NOT embed improvementProjects
    const hubRow = await db.processHubs.get('hub-1');
    expect(hubRow).toBeDefined();
    expect((hubRow as Partial<ProcessHub> | undefined)?.improvementProjects).toBeUndefined();

    // The IP must have been written to the dedicated table
    const ipRows = await db.improvementProjects.where('hubId').equals('hub-1').toArray();
    expect(ipRows).toHaveLength(1);
    expect(ipRows[0].id).toBe('ip-1');
    expect(ipRows[0].hubId).toBe('hub-1');
  });

  it('persists a hub with empty improvementProjects array — IP table stays empty', async () => {
    const repo = new AzureHubRepository();
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-2', []) });

    const hubRow = await db.processHubs.get('hub-2');
    expect(hubRow).toBeDefined();
    const ipRows = await db.improvementProjects.where('hubId').equals('hub-2').toArray();
    expect(ipRows).toHaveLength(0);
  });

  it('persists a hub with no improvementProjects field — IP table stays empty', async () => {
    const repo = new AzureHubRepository();
    // Deliberately omit improvementProjects field
    const hub: ProcessHub = { id: 'hub-3', name: 'Hub 3', createdAt: NOW, deletedAt: null };
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    const hubRow = await db.processHubs.get('hub-3');
    expect(hubRow).toBeDefined();
    const ipRows = await db.improvementProjects.where('hubId').equals('hub-3').toArray();
    expect(ipRows).toHaveLength(0);
  });

  it('cleans up stale IPs absent from the new snapshot', async () => {
    const repo = new AzureHubRepository();
    // Pre-seed a stale IP directly into the table (simulates a previously saved snapshot)
    await db.improvementProjects.put(makeIP('ip-stale', 'hub-4'));

    // Dispatch a snapshot that has a different IP (ip-keep) but not ip-stale
    await repo.dispatch({
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-4', [makeIP('ip-keep', 'hub-4')]),
    });

    const ipRows = await db.improvementProjects.where('hubId').equals('hub-4').toArray();
    expect(ipRows.map(r => r.id)).toEqual(['ip-keep']);
  });
});
