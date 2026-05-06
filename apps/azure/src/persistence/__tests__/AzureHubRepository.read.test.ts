// apps/azure/src/persistence/__tests__/AzureHubRepository.read.test.ts
//
// Read API tests for AzureHubRepository skeleton (P5.1).
// fake-indexeddb/auto must be the first import statement.
//
// - hubs.get / hubs.list — wired against db.processHubs
// - outcomes.get / outcomes.listByHub — extracted from hub blob, live only
// - canvasState.getByHub — extracted from hub blob
// - evidenceSnapshots.get / listByHub — wired against db.evidenceSnapshots
// - evidenceSources.get / listByHub — wired against db.evidenceSources
// - evidenceSources.getCursor — wired against db.evidenceSourceCursors
// - stub read APIs (investigations, findings, questions, causalLinks, suspectedCauses)
//
// Mocking strategy: fake-indexeddb/auto (already a devDep) polyfills IndexedDB globally
// so the real Dexie instance works end-to-end without a browser. No vi.mock needed here
// because the read APIs call through the real db object.

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AzureHubRepository } from '../AzureHubRepository';
import { db } from '../../db/schema';
import type { ProcessHub, OutcomeSpec } from '@variscout/core/processHub';
import type { EvidenceSource, EvidenceSnapshot, EvidenceSourceCursor } from '@variscout/core';

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

function makeEvidenceSource(id: string, hubId = 'hub-azure-1'): EvidenceSource {
  return {
    id,
    hubId,
    name: `Source ${id}`,
    cadence: 'manual',
    profileId: 'profile-1',
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeEvidenceSnapshot(id: string, hubId = 'hub-azure-1'): EvidenceSnapshot {
  return {
    id,
    hubId,
    sourceId: 'src-1',
    capturedAt: '2026-05-06T00:00:00.000Z',
    rowCount: 10,
    origin: 'paste',
    importedAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

function makeCursor(
  hubId: string,
  sourceId: string,
  lastSeenSnapshotId: string
): EvidenceSourceCursor {
  return {
    id: `cursor-${hubId}-${sourceId}`,
    hubId,
    sourceId,
    lastSeenSnapshotId,
    lastSeenAt: NOW,
    createdAt: NOW,
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Read API tests
// ---------------------------------------------------------------------------

describe('AzureHubRepository read APIs (Dexie tables)', () => {
  let repo: AzureHubRepository;

  beforeEach(async () => {
    repo = new AzureHubRepository();
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
  });

  // ---- hubs.get ----

  describe('hubs.get', () => {
    it('returns the hub when it exists', async () => {
      const hub = makeHub({ id: 'hub-azure-1' });
      await db.processHubs.put(hub);
      const result = await repo.hubs.get('hub-azure-1');
      expect(result).toMatchObject({ id: 'hub-azure-1', name: 'Azure Test Hub' });
    });

    it('returns undefined when hub does not exist', async () => {
      const result = await repo.hubs.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('returns undefined when table is empty', async () => {
      const result = await repo.hubs.get('hub-azure-1');
      expect(result).toBeUndefined();
    });
  });

  // ---- hubs.list ----

  describe('hubs.list', () => {
    it('returns all hubs in the table', async () => {
      const hub1 = makeHub({ id: 'hub-1', name: 'Hub One' });
      const hub2 = makeHub({ id: 'hub-2', name: 'Hub Two' });
      await db.processHubs.put(hub1);
      await db.processHubs.put(hub2);
      const result = await repo.hubs.list();
      expect(result).toHaveLength(2);
      const ids = result.map(h => h.id);
      expect(ids).toContain('hub-1');
      expect(ids).toContain('hub-2');
    });

    it('returns [] when table is empty', async () => {
      const result = await repo.hubs.list();
      expect(result).toEqual([]);
    });

    it('list() omits hubs with deletedAt set', async () => {
      const live = makeHub({ id: 'hub-live', deletedAt: null });
      const archived = makeHub({ id: 'hub-archived', deletedAt: 12345 });
      await db.processHubs.bulkPut([live, archived]);
      const result = await repo.hubs.list();
      expect(result.map(h => h.id)).toEqual(['hub-live']);
    });
  });

  // ---- outcomes.get ----

  describe('outcomes.get', () => {
    it('returns the matching live outcome from any hub', async () => {
      const outcome = makeOutcome('outcome-1', null);
      const hub = makeHub({ outcomes: [outcome] });
      await db.processHubs.put(hub);
      const result = await repo.outcomes.get('outcome-1');
      expect(result).toMatchObject({ id: 'outcome-1' });
    });

    it('returns undefined for a tombstoned outcome', async () => {
      const tombstoned = makeOutcome('outcome-dead', NOW);
      const hub = makeHub({ outcomes: [tombstoned] });
      await db.processHubs.put(hub);
      const result = await repo.outcomes.get('outcome-dead');
      expect(result).toBeUndefined();
    });

    it('returns undefined when table is empty', async () => {
      const result = await repo.outcomes.get('outcome-1');
      expect(result).toBeUndefined();
    });

    it('get(id) finds an outcome that lives in a non-first hub', async () => {
      const hub1 = makeHub({ id: 'hub-1', outcomes: [makeOutcome('outcome-a', null)] });
      const hub2 = makeHub({ id: 'hub-2', outcomes: [makeOutcome('outcome-b', null)] });
      await db.processHubs.bulkPut([hub1, hub2]);
      const result = await repo.outcomes.get('outcome-b');
      expect(result?.id).toBe('outcome-b');
    });
  });

  // ---- outcomes.listByHub ----

  describe('outcomes.listByHub', () => {
    it('returns only live outcomes for matching hubId', async () => {
      const live = makeOutcome('outcome-live', null);
      const tombstoned = makeOutcome('outcome-dead', NOW);
      await db.processHubs.put(makeHub({ id: 'hub-azure-1', outcomes: [live, tombstoned] }));
      const result = await repo.outcomes.listByHub('hub-azure-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('outcome-live');
    });

    it('returns [] when hub does not exist', async () => {
      const result = await repo.outcomes.listByHub('nonexistent');
      expect(result).toEqual([]);
    });

    it('returns [] when hub has no outcomes array', async () => {
      await db.processHubs.put(makeHub({ id: 'hub-azure-1', outcomes: undefined }));
      const result = await repo.outcomes.listByHub('hub-azure-1');
      expect(result).toEqual([]);
    });
  });

  // ---- canvasState.getByHub ----

  describe('canvasState.getByHub', () => {
    const FIXTURE_MAP = {
      version: 1 as const,
      nodes: [],
      tributaries: [],
      createdAt: '2026-05-06T00:00:00.000Z',
      updatedAt: '2026-05-06T00:00:00.000Z',
    };

    it('returns canonicalProcessMap when hub exists and has a map', async () => {
      await db.processHubs.put(makeHub({ id: 'hub-azure-1', canonicalProcessMap: FIXTURE_MAP }));
      const result = await repo.canvasState.getByHub('hub-azure-1');
      expect(result).toEqual(FIXTURE_MAP);
    });

    it('returns undefined when hub does not exist', async () => {
      const result = await repo.canvasState.getByHub('nonexistent');
      expect(result).toBeUndefined();
    });

    it('returns undefined when hub has no canonicalProcessMap', async () => {
      await db.processHubs.put(makeHub({ id: 'hub-azure-1', canonicalProcessMap: undefined }));
      const result = await repo.canvasState.getByHub('hub-azure-1');
      expect(result).toBeUndefined();
    });
  });

  // ---- evidenceSnapshots.get ----

  describe('evidenceSnapshots.get', () => {
    it('returns the snapshot when it exists', async () => {
      const snapshot = makeEvidenceSnapshot('snap-1');
      await db.evidenceSnapshots.put(snapshot);
      const result = await repo.evidenceSnapshots.get('snap-1');
      expect(result).toMatchObject({ id: 'snap-1', hubId: 'hub-azure-1' });
    });

    it('returns undefined when snapshot does not exist', async () => {
      const result = await repo.evidenceSnapshots.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  // ---- evidenceSnapshots.listByHub ----

  describe('evidenceSnapshots.listByHub', () => {
    it('returns snapshots for matching hubId', async () => {
      const snap1 = makeEvidenceSnapshot('snap-1', 'hub-azure-1');
      const snap2 = makeEvidenceSnapshot('snap-2', 'hub-azure-1');
      const snap3 = makeEvidenceSnapshot('snap-3', 'hub-other');
      await db.evidenceSnapshots.put(snap1);
      await db.evidenceSnapshots.put(snap2);
      await db.evidenceSnapshots.put(snap3);
      const result = await repo.evidenceSnapshots.listByHub('hub-azure-1');
      expect(result).toHaveLength(2);
      const ids = result.map(s => s.id);
      expect(ids).toContain('snap-1');
      expect(ids).toContain('snap-2');
      expect(ids).not.toContain('snap-3');
    });

    it('returns [] when no snapshots exist for hubId', async () => {
      const result = await repo.evidenceSnapshots.listByHub('hub-azure-1');
      expect(result).toEqual([]);
    });
  });

  // ---- evidenceSources.get ----

  describe('evidenceSources.get', () => {
    it('returns the source when it exists', async () => {
      const source = makeEvidenceSource('src-1');
      await db.evidenceSources.put(source);
      const result = await repo.evidenceSources.get('src-1');
      expect(result).toMatchObject({ id: 'src-1', hubId: 'hub-azure-1' });
    });

    it('returns undefined when source does not exist', async () => {
      const result = await repo.evidenceSources.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  // ---- evidenceSources.listByHub ----

  describe('evidenceSources.listByHub', () => {
    it('returns sources for matching hubId', async () => {
      const src1 = makeEvidenceSource('src-1', 'hub-azure-1');
      const src2 = makeEvidenceSource('src-2', 'hub-azure-1');
      const src3 = makeEvidenceSource('src-3', 'hub-other');
      await db.evidenceSources.put(src1);
      await db.evidenceSources.put(src2);
      await db.evidenceSources.put(src3);
      const result = await repo.evidenceSources.listByHub('hub-azure-1');
      expect(result).toHaveLength(2);
      const ids = result.map(s => s.id);
      expect(ids).toContain('src-1');
      expect(ids).toContain('src-2');
      expect(ids).not.toContain('src-3');
    });

    it('returns [] when no sources exist for hubId', async () => {
      const result = await repo.evidenceSources.listByHub('hub-azure-1');
      expect(result).toEqual([]);
    });
  });

  // ---- evidenceSources.getCursor ----

  describe('evidenceSources.getCursor', () => {
    it('returns the cursor when it exists', async () => {
      const cursor = makeCursor('hub-azure-1', 'src-1', 'snap-42');
      await db.evidenceSourceCursors.put(cursor);
      const result = await repo.evidenceSources.getCursor('hub-azure-1', 'src-1');
      expect(result).toMatchObject({
        hubId: 'hub-azure-1',
        sourceId: 'src-1',
        lastSeenSnapshotId: 'snap-42',
      });
    });

    it('returns undefined when cursor does not exist', async () => {
      const result = await repo.evidenceSources.getCursor('hub-azure-1', 'src-999');
      expect(result).toBeUndefined();
    });

    it('cursors are keyed by [hubId, sourceId] — different hubs are independent', async () => {
      await db.evidenceSourceCursors.put(makeCursor('hub-1', 'src-1', 'snap-A'));
      await db.evidenceSourceCursors.put(makeCursor('hub-2', 'src-1', 'snap-B'));

      const cursorA = await repo.evidenceSources.getCursor('hub-1', 'src-1');
      const cursorB = await repo.evidenceSources.getCursor('hub-2', 'src-1');
      expect(cursorA?.lastSeenSnapshotId).toBe('snap-A');
      expect(cursorB?.lastSeenSnapshotId).toBe('snap-B');
    });
  });

  // ---- stub read APIs ----

  describe('stub read APIs (F3 not yet implemented)', () => {
    it('investigations.get returns undefined', async () => {
      expect(await repo.investigations.get('any')).toBeUndefined();
    });

    it('investigations.listByHub returns []', async () => {
      expect(await repo.investigations.listByHub('hub-azure-1')).toEqual([]);
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
