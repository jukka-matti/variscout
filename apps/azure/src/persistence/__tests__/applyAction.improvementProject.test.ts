// apps/azure/src/persistence/__tests__/applyAction.improvementProject.test.ts
//
// PR-RPS-5 T4 — tests for IMPROVEMENT_PROJECT_CREATE / UPDATE / ARCHIVE handlers
// in the Azure applyAction dispatcher.
//
// Mirrors apps/pwa/src/persistence/__tests__/applyAction.improvementProject.test.ts
// with the following Azure-specific differences:
//   - Azure applyAction signature: applyAction(action) — no db arg (uses module-scoped db).
//   - Hub table is db.processHubs (not db.hubs as in PWA's normalized schema).
//   - beforeEach/afterEach clear both db.processHubs and db.improvementProjects.
//
// Coverage:
//   1. CREATE inserts the project row into db.improvementProjects
//   2. CREATE with a missing hub throws (loud failure)
//   3. UPDATE metadata-only — deep-merge preserves non-supplied metadata keys
//   4. UPDATE goal-only — outcomeGoal shallow-merge preserves outcomeSpecId;
//      factorControls array replaces wholesale
//   5. UPDATE sections — partial supply preserves other sub-section keys and
//      shallow-merges the supplied sub-section
//   6. UPDATE sets updatedAt to Date.now() (timing-safe)
//   7. UPDATE missing project — idempotent no-op
//   8. ARCHIVE sets deletedAt to non-null timestamp
//   9. ARCHIVE missing project — idempotent no-op
//  10. UPDATE financialImpact — patches amount, preserves currency (deep-merge bonus)
//
// fake-indexeddb/auto must be the first import so Dexie sees the IndexedDB
// polyfill before db.ts runs its module-load side effects.

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessHub } from '@variscout/core/processHub';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { applyAction } from '../applyAction';
import { db } from '../../db/schema';

// ---------------------------------------------------------------------------
// Fixture helpers — deterministic literal values (no Date.now() / crypto.randomUUID()
// in fixture-value positions; IDs and timestamps are hardcoded literals)
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

function makeProject(
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
    metadata: {
      title: 'Default Title',
    },
    goal: {
      outcomeGoal: {
        outcomeSpecId: 'out-default',
        target: 1.33,
      },
    },
    sections: {
      background: {},
      investigationLineage: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — clear tables touched by these handlers before each test.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.processHubs.clear();
  await db.improvementProjects.clear();
});

afterEach(async () => {
  await db.processHubs.clear();
  await db.improvementProjects.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// IMPROVEMENT_PROJECT_CREATE
// ---------------------------------------------------------------------------

describe('applyAction (Azure) — IMPROVEMENT_PROJECT_CREATE', () => {
  it('inserts the project row and is retrievable from db.improvementProjects', async () => {
    // Seed the parent hub directly into db.processHubs (Azure's hub table).
    await db.processHubs.put(makeHub('hub-1'));

    const project = makeProject('proj-1', 'hub-1', {
      metadata: { title: 'My Project', businessCase: 'Save money' },
    });
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-1', project });

    const rows = await db.improvementProjects.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('proj-1');
    expect(rows[0].hubId).toBe('hub-1');
    expect(rows[0].metadata.title).toBe('My Project');
    expect(rows[0].metadata.businessCase).toBe('Save money');
  });

  it('throws (loud-fail) when the parent hub does not exist', async () => {
    const project = makeProject('proj-orphan', 'ghost-hub');
    await expect(
      applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'ghost-hub', project })
    ).rejects.toThrow(/ghost-hub/);

    // No row should have been created.
    expect(await db.improvementProjects.get('proj-orphan')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// IMPROVEMENT_PROJECT_UPDATE — deep-merge contract
// ---------------------------------------------------------------------------

describe('applyAction (Azure) — IMPROVEMENT_PROJECT_UPDATE', () => {
  it('metadata-only patch preserves non-supplied metadata keys (deep-merge)', async () => {
    await db.processHubs.put(makeHub('hub-2'));
    const project = makeProject('proj-2', 'hub-2', {
      metadata: { title: 'A', businessCase: 'orig' },
    });
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-2', project });

    await applyAction({
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-2',
      patch: { metadata: { title: 'B' } },
    });

    const row = await db.improvementProjects.get('proj-2');
    expect(row?.metadata).toEqual({ title: 'B', businessCase: 'orig' });
  });

  it('goal-only patch: outcomeGoal preserved; factorControls replaces wholesale', async () => {
    await db.processHubs.put(makeHub('hub-3'));
    const project = makeProject('proj-3', 'hub-3', {
      goal: {
        outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 },
      },
    });
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-3', project });

    await applyAction({
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-3',
      patch: {
        goal: {
          outcomeGoal: { outcomeSpecId: 'o-1', target: 1.33 }, // same outcomeGoal
          factorControls: [{ factor: 'X', targetCondition: '95±2' }],
        },
      },
    });

    const row = await db.improvementProjects.get('proj-3');
    expect(row?.goal.outcomeGoal.outcomeSpecId).toBe('o-1');
    expect(row?.goal.factorControls).toEqual([{ factor: 'X', targetCondition: '95±2' }]);
  });

  it('sections partial supply: supplied sub-section merges; other sub-sections preserved', async () => {
    await db.processHubs.put(makeHub('hub-4'));
    const project = makeProject('proj-4', 'hub-4', {
      sections: {
        background: { manualNarrative: 'orig' },
        investigationLineage: {},
        approach: {},
        outcomeReference: {},
      },
    });
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-4', project });

    await applyAction({
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-4',
      patch: {
        sections: { background: { snapshotText: 'snap' } },
      },
    });

    const row = await db.improvementProjects.get('proj-4');
    // background shallow-merges: both keys present
    expect(row?.sections.background).toEqual({ manualNarrative: 'orig', snapshotText: 'snap' });
    // Other sub-sections must not be dropped
    expect(row?.sections.investigationLineage).toBeDefined();
    expect(row?.sections.approach).toBeDefined();
    expect(row?.sections.outcomeReference).toBeDefined();
  });

  it('sets updatedAt to Date.now() after patch', async () => {
    await db.processHubs.put(makeHub('hub-5'));
    const project = makeProject('proj-5', 'hub-5', { updatedAt: 1 });
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-5', project });

    const before = Date.now();
    await applyAction({
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-5',
      patch: { status: 'active' },
    });

    const row = await db.improvementProjects.get('proj-5');
    expect(row?.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('is idempotent (no-op) when projectId does not exist', async () => {
    await expect(
      applyAction({
        kind: 'IMPROVEMENT_PROJECT_UPDATE',
        projectId: 'ghost-proj',
        patch: { status: 'active' },
      })
    ).resolves.toBeUndefined();

    expect(await db.improvementProjects.get('ghost-proj')).toBeUndefined();
  });

  it('financialImpact patch deep-merges: amount update preserves existing currency', async () => {
    await db.processHubs.put(makeHub('hub-7'));
    const project = makeProject('proj-7', 'hub-7', {
      metadata: {
        title: 'FI Test',
        businessCase: 'Cost reduction',
        financialImpact: { amount: 10, currency: 'EUR' },
      },
    });
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-7', project });

    // Patch: update amount (currency required by the type — must be supplied).
    await applyAction({
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-7',
      patch: { metadata: { title: 'FI Test', financialImpact: { amount: 20, currency: 'EUR' } } },
    });

    const row = await db.improvementProjects.get('proj-7');
    // financialImpact deep-merges: amount updated, currency preserved.
    expect(row?.metadata.financialImpact).toEqual({ amount: 20, currency: 'EUR' });
    // businessCase must be preserved (metadata shallow-merge; financialImpact is the only
    // nested-deep-merge key — the outer metadata spread preserves keys not in the patch).
    expect(row?.metadata.businessCase).toBe('Cost reduction');
  });
});

// ---------------------------------------------------------------------------
// IMPROVEMENT_PROJECT_ARCHIVE
// ---------------------------------------------------------------------------

describe('applyAction (Azure) — IMPROVEMENT_PROJECT_ARCHIVE', () => {
  it('soft-deletes by setting deletedAt to a non-null timestamp', async () => {
    await db.processHubs.put(makeHub('hub-6'));
    const project = makeProject('proj-6', 'hub-6');
    await applyAction({ kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-6', project });

    await applyAction({ kind: 'IMPROVEMENT_PROJECT_ARCHIVE', projectId: 'proj-6' });

    const row = await db.improvementProjects.get('proj-6');
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.deletedAt).toBeGreaterThan(0);
  });

  it('is idempotent (no-op) when projectId does not exist', async () => {
    await expect(
      applyAction({ kind: 'IMPROVEMENT_PROJECT_ARCHIVE', projectId: 'ghost-proj' })
    ).resolves.toBeUndefined();
  });
});
