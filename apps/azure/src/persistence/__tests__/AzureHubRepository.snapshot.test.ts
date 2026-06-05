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
import type { ControlRecord, ControlReview } from '@variscout/core';
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
    goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }] },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

function makeHub(id: string, ip?: ImprovementProject): ProcessHub {
  return {
    id,
    name: `Hub ${id}`,
    createdAt: NOW,
    deletedAt: null,
    ...(ip ? { improvementProject: ip } : {}),
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
// Setup / teardown — clear tables touched by dispatch before each test.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.processHubs.clear();
  await db.improvementProjects.clear();
  await db.controlRecords.clear();
  await db.controlReviews.clear();
});

afterEach(async () => {
  await db.processHubs.clear();
  await db.improvementProjects.clear();
  await db.controlRecords.clear();
  await db.controlReviews.clear();
});

// ---------------------------------------------------------------------------
// Integration tests for HUB_PERSIST_SNAPSHOT decomposition
// ---------------------------------------------------------------------------

describe('AzureHubRepository.dispatch HUB_PERSIST_SNAPSHOT — Dexie integration', () => {
  it('strips improvementProject from the hub blob and writes it to the dedicated table', async () => {
    const repo = new AzureHubRepository();
    const ip = makeIP('ip-1', 'hub-1');
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-1', ip) });

    // The hub row in processHubs must NOT embed improvementProject
    const hubRow = await db.processHubs.get('hub-1');
    expect(hubRow).toBeDefined();
    expect((hubRow as Partial<ProcessHub> | undefined)?.improvementProject).toBeUndefined();

    // The IP must have been written to the dedicated table
    const ipRows = await db.improvementProjects.where('hubId').equals('hub-1').toArray();
    expect(ipRows).toHaveLength(1);
    expect(ipRows[0].id).toBe('ip-1');
    expect(ipRows[0].hubId).toBe('hub-1');
  });

  it('persists a hub with no improvementProject — IP table stays empty', async () => {
    const repo = new AzureHubRepository();
    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-2') });

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
      hub: makeHub('hub-4', makeIP('ip-keep', 'hub-4')),
    });

    const ipRows = await db.improvementProjects.where('hubId').equals('hub-4').toArray();
    expect(ipRows.map(r => r.id)).toEqual(['ip-keep']);
  });

  it('strips sustainment arrays from the hub blob and writes them to normalized tables', async () => {
    const repo = new AzureHubRepository();
    const record = makeControlRecord('sr-1', 'hub-5');
    const review = makeControlReview('rev-1', 'sr-1', 'hub-5');
    const hub = {
      ...makeHub('hub-5'),
      controlRecords: [record],
      controlReviews: [review],
    } as ProcessHub;

    await repo.dispatch({ kind: 'HUB_PERSIST_SNAPSHOT', hub });

    const hubRow = await db.processHubs.get('hub-5');
    expect((hubRow as Partial<ProcessHub> | undefined)?.controlRecords).toBeUndefined();
    expect((hubRow as Partial<ProcessHub> | undefined)?.controlReviews).toBeUndefined();
    expect(
      (await db.controlRecords.where('hubId').equals('hub-5').toArray()).map(r => r.id)
    ).toEqual(['sr-1']);
    expect(
      (await db.controlReviews.where('hubId').equals('hub-5').toArray()).map(r => r.id)
    ).toEqual(['rev-1']);
  });

  it('cleans up stale sustainment rows absent from the new snapshot', async () => {
    const repo = new AzureHubRepository();
    await db.controlRecords.put(makeControlRecord('sr-stale', 'hub-6'));
    await db.controlReviews.put(makeControlReview('rev-stale', 'sr-stale', 'hub-6'));

    await repo.dispatch({
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: {
        ...makeHub('hub-6'),
        controlRecords: [makeControlRecord('sr-keep', 'hub-6')],
        controlReviews: [makeControlReview('rev-keep', 'sr-keep', 'hub-6')],
      } as ProcessHub,
    });

    expect(
      (await db.controlRecords.where('hubId').equals('hub-6').toArray()).map(r => r.id)
    ).toEqual(['sr-keep']);
    expect(
      (await db.controlReviews.where('hubId').equals('hub-6').toArray()).map(r => r.id)
    ).toEqual(['rev-keep']);
  });

  it('cleans up stale sustainment rows when a snapshot omits sustainment arrays', async () => {
    const repo = new AzureHubRepository();
    await db.controlRecords.put(makeControlRecord('sr-stale', 'hub-7'));
    await db.controlReviews.put(makeControlReview('rev-stale', 'sr-stale', 'hub-7'));

    await repo.dispatch({
      kind: 'HUB_PERSIST_SNAPSHOT',
      hub: makeHub('hub-7'),
    });

    expect(await db.controlRecords.where('hubId').equals('hub-7').count()).toBe(0);
    expect(await db.controlReviews.where('hubId').equals('hub-7').count()).toBe(0);
  });
});
