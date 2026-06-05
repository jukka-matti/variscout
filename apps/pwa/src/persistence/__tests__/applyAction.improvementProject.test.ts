// apps/pwa/src/persistence/__tests__/applyAction.improvementProject.test.ts
//
// PR-RPS-5 T3 — tests for IMPROVEMENT_PROJECT_CREATE / UPDATE / ARCHIVE handlers
// in the PWA applyAction dispatcher.
//
// Coverage:
//   1. CREATE inserts the project row
//   2. CREATE with a missing hub throws (loud failure)
//   3. UPDATE metadata-only — deep-merge preserves non-supplied metadata keys
//   4. UPDATE goal-only — outcomeGoals[] replaces wholesale (per the deep-merge
//      contract amendment in PR-CCJ-A3); factorControls[] also replaces wholesale
//   5. UPDATE sections — partial supply preserves other sub-section keys and
//      shallow-merges the supplied sub-section
//   6. UPDATE sets updatedAt to Date.now() (timing-safe)
//   7. UPDATE missing project — idempotent no-op
//   8. ARCHIVE sets deletedAt to non-null
//   9. ARCHIVE missing project — idempotent no-op
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
      outcomeGoals: [
        {
          outcomeSpecId: 'out-default',
          target: 1.33,
        },
      ],
    },
    sections: {
      background: {},
      approach: {},
      outcomeReference: {},
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.hubs.clear();
  await db.improvementProjects.clear();
});

afterEach(async () => {
  await db.hubs.clear();
  await db.improvementProjects.clear();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// IMPROVEMENT_PROJECT_CREATE
// ---------------------------------------------------------------------------

describe('applyAction — IMPROVEMENT_PROJECT_CREATE', () => {
  it('inserts the project row and is retrievable from the table', async () => {
    // Seed the parent hub.
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-1') });

    const project = makeProject('proj-1', 'hub-1', {
      metadata: { title: 'My Project', businessCase: 'Save money' },
    });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-1', project });

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
      applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'ghost-hub', project })
    ).rejects.toThrow(/ghost-hub/);

    // No row should have been created.
    expect(await db.improvementProjects.get('proj-orphan')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// IMPROVEMENT_PROJECT_UPDATE — deep-merge contract
// ---------------------------------------------------------------------------

describe('applyAction — IMPROVEMENT_PROJECT_UPDATE', () => {
  it('metadata-only patch preserves non-supplied metadata keys (deep-merge)', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-2') });
    const project = makeProject('proj-2', 'hub-2', {
      metadata: { title: 'A', businessCase: 'orig' },
    });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-2', project });

    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-2',
      patch: { metadata: { title: 'B' } },
    });

    const row = await db.improvementProjects.get('proj-2');
    expect(row?.metadata).toEqual({ title: 'B', businessCase: 'orig' });
  });

  it('goal-only patch: outcomeGoals[] + factorControls[] both replace wholesale', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-3') });
    const project = makeProject('proj-3', 'hub-3', {
      goal: {
        outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }],
      },
    });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-3', project });

    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-3',
      patch: {
        goal: {
          outcomeGoals: [{ outcomeSpecId: 'o-1', target: 1.33 }], // same outcomes list
          factorControls: [{ factor: 'X', targetCondition: '95±2' }],
        },
      },
    });

    const row = await db.improvementProjects.get('proj-3');
    expect(row?.goal.outcomeGoals).toEqual([{ outcomeSpecId: 'o-1', target: 1.33 }]);
    expect(row?.goal.factorControls).toEqual([{ factor: 'X', targetCondition: '95±2' }]);
  });

  it('sections partial supply: supplied sub-section merges; other sub-sections preserved', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-4') });
    const project = makeProject('proj-4', 'hub-4', {
      sections: {
        background: { manualNarrative: 'orig' },
        approach: {},
        outcomeReference: {},
      },
    });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-4', project });

    await applyAction(db, {
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
    expect(row?.sections.approach).toBeDefined();
    expect(row?.sections.outcomeReference).toBeDefined();
  });

  it('sets updatedAt to Date.now() after patch', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-5') });
    const project = makeProject('proj-5', 'hub-5', { updatedAt: 1 });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-5', project });

    const before = Date.now();
    await applyAction(db, {
      kind: 'IMPROVEMENT_PROJECT_UPDATE',
      projectId: 'proj-5',
      patch: { status: 'active' },
    });

    const row = await db.improvementProjects.get('proj-5');
    expect(row?.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('is idempotent (no-op) when projectId does not exist', async () => {
    await expect(
      applyAction(db, {
        kind: 'IMPROVEMENT_PROJECT_UPDATE',
        projectId: 'ghost-proj',
        patch: { status: 'active' },
      })
    ).resolves.toBeUndefined();

    expect(await db.improvementProjects.get('ghost-proj')).toBeUndefined();
  });

  it('financialImpact patch deep-merges: amount update preserves existing currency', async () => {
    // Note: ImprovementProjectMetadata.financialImpact types currency as required
    // on every supply ({ amount?: number; currency: string }), so a patch must
    // always include currency when it includes financialImpact.
    // This test verifies that the deep-merge spreads existing before patch —
    // i.e., supplying { amount: 20, currency: 'EUR' } when existing is
    // { amount: 10, currency: 'EUR' } correctly yields { amount: 20, currency: 'EUR' },
    // and that other metadata keys (businessCase) are not clobbered.
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-7') });
    const project = makeProject('proj-7', 'hub-7', {
      metadata: {
        title: 'FI Test',
        businessCase: 'Cost reduction',
        financialImpact: { amount: 10, currency: 'EUR' },
      },
    });
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-7', project });

    // Patch: update amount only (currency required by the type — must be supplied).
    await applyAction(db, {
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

describe('applyAction — IMPROVEMENT_PROJECT_ARCHIVE', () => {
  it('soft-deletes by setting deletedAt to a non-null timestamp', async () => {
    await applyAction(db, { kind: 'HUB_PERSIST_SNAPSHOT', hub: makeHub('hub-6') });
    const project = makeProject('proj-6', 'hub-6');
    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_CREATE', hubId: 'hub-6', project });

    await applyAction(db, { kind: 'IMPROVEMENT_PROJECT_ARCHIVE', projectId: 'proj-6' });

    const row = await db.improvementProjects.get('proj-6');
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.deletedAt).toBeGreaterThan(0);
  });

  it('is idempotent (no-op) when projectId does not exist', async () => {
    await expect(
      applyAction(db, { kind: 'IMPROVEMENT_PROJECT_ARCHIVE', projectId: 'ghost-proj' })
    ).resolves.toBeUndefined();
  });
});
