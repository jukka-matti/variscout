import { describe, it, expect } from 'vitest';
import {
  createProblemStatementScope,
  buildConditionFromCategoricalFilters,
  predicateSetKey,
  type CategoricalFilterInput,
  type ConditionLeaf,
} from '@variscout/core';
import { matchActiveScopeId, matchActiveScopeIdByLeaves } from '../matchActiveScope';

const PROJECT = 'proj-1';

function scopeFor(
  projectId: string,
  outcome: string,
  filters: CategoricalFilterInput[]
): ReturnType<typeof createProblemStatementScope> {
  return createProblemStatementScope(
    projectId,
    outcome,
    buildConditionFromCategoricalFilters(filters)
  );
}

describe('matchActiveScopeId (ER-2 strip scope what-if lookup)', () => {
  const drill: CategoricalFilterInput[] = [{ column: 'Shift', values: ['Night'] }];

  it('returns the id of a scope whose predicates match the live drill', () => {
    const scope = scopeFor(PROJECT, 'CycleTime', drill);
    const id = matchActiveScopeId({
      categoricalFilters: drill,
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });

  it('matches by predicate SET regardless of chip order', () => {
    const twoChip: CategoricalFilterInput[] = [
      { column: 'Shift', values: ['Night'] },
      { column: 'Line', values: ['A'] },
    ];
    const reordered: CategoricalFilterInput[] = [
      { column: 'Line', values: ['A'] },
      { column: 'Shift', values: ['Night'] },
    ];
    const scope = scopeFor(PROJECT, 'CycleTime', twoChip);
    const id = matchActiveScopeId({
      categoricalFilters: reordered,
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });

  it('returns null when no drill is active (empty filters)', () => {
    const scope = scopeFor(PROJECT, 'CycleTime', drill);
    expect(
      matchActiveScopeId({
        categoricalFilters: [],
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('returns null when outcome is absent', () => {
    const scope = scopeFor(PROJECT, 'CycleTime', drill);
    expect(
      matchActiveScopeId({
        categoricalFilters: drill,
        outcome: null,
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('does not match a scope under a different outcome', () => {
    const scope = scopeFor(PROJECT, 'Defects', drill);
    expect(
      matchActiveScopeId({
        categoricalFilters: drill,
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('does not match a scope under a different project id', () => {
    const scope = scopeFor('other-proj', 'CycleTime', drill);
    expect(
      matchActiveScopeId({
        categoricalFilters: drill,
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('does not match a soft-deleted scope', () => {
    const scope = { ...scopeFor(PROJECT, 'CycleTime', drill), deletedAt: Date.now() };
    expect(
      matchActiveScopeId({
        categoricalFilters: drill,
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('returns null when the drill differs from every scope (no creation implied)', () => {
    const scope = scopeFor(PROJECT, 'CycleTime', drill);
    const differentDrill: CategoricalFilterInput[] = [{ column: 'Shift', values: ['Day'] }];
    expect(
      matchActiveScopeId({
        categoricalFilters: differentDrill,
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });
});

// ===========================================================================
// matchActiveScopeIdByLeaves — range-capable variant
// ===========================================================================

function scopeFromLeaves(
  projectId: string,
  outcome: string,
  leaves: ConditionLeaf[]
): ReturnType<typeof createProblemStatementScope> {
  return createProblemStatementScope(projectId, outcome, leaves);
}

describe('matchActiveScopeIdByLeaves (ER-4 condition-loop lookup)', () => {
  const betweenLeaf: ConditionLeaf = {
    kind: 'leaf',
    column: 'Temp',
    op: 'between',
    value: [100, 200],
  };
  const gteLeaf: ConditionLeaf = { kind: 'leaf', column: 'Pressure', op: 'gte', value: 5 };
  const eqLeaf: ConditionLeaf = { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' };

  it('matches a scope by leaves key (range leaves)', () => {
    const scope = scopeFromLeaves(PROJECT, 'CycleTime', [betweenLeaf]);
    const id = matchActiveScopeIdByLeaves({
      leaves: [betweenLeaf],
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });

  it('matches by predicate SET regardless of leaf order', () => {
    const scope = scopeFromLeaves(PROJECT, 'CycleTime', [eqLeaf, betweenLeaf]);
    // Pass in reversed order — must still match because key is order-independent
    const id = matchActiveScopeIdByLeaves({
      leaves: [betweenLeaf, eqLeaf],
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });

  it('returns null when leaves array is empty', () => {
    const scope = scopeFromLeaves(PROJECT, 'CycleTime', [betweenLeaf]);
    expect(
      matchActiveScopeIdByLeaves({
        leaves: [],
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('returns null when outcome is absent', () => {
    const scope = scopeFromLeaves(PROJECT, 'CycleTime', [betweenLeaf]);
    expect(
      matchActiveScopeIdByLeaves({
        leaves: [betweenLeaf],
        outcome: null,
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('does not match a scope under a different outcome', () => {
    const scope = scopeFromLeaves(PROJECT, 'Defects', [betweenLeaf]);
    expect(
      matchActiveScopeIdByLeaves({
        leaves: [betweenLeaf],
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('does not match a scope under a different project id', () => {
    const scope = scopeFromLeaves('other-proj', 'CycleTime', [betweenLeaf]);
    expect(
      matchActiveScopeIdByLeaves({
        leaves: [betweenLeaf],
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('does not match a soft-deleted scope', () => {
    const scope = {
      ...scopeFromLeaves(PROJECT, 'CycleTime', [betweenLeaf]),
      deletedAt: Date.now(),
    };
    expect(
      matchActiveScopeIdByLeaves({
        leaves: [betweenLeaf],
        outcome: 'CycleTime',
        scopeProjectId: PROJECT,
        scopes: [scope],
      })
    ).toBeNull();
  });

  it('handles mixed categorical + range leaves', () => {
    const mixed = [eqLeaf, gteLeaf];
    const scope = scopeFromLeaves(PROJECT, 'CycleTime', mixed);
    // key computed via predicateSetKey over the leaves
    const id = matchActiveScopeIdByLeaves({
      leaves: mixed,
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });

  it('existing matchActiveScopeId (categorical path) still works unchanged', () => {
    // Regression guard: ensure the new sibling did not break the existing function.
    const categoricalDrill: CategoricalFilterInput[] = [{ column: 'Shift', values: ['Night'] }];
    const scope = scopeFor(PROJECT, 'CycleTime', categoricalDrill);
    const id = matchActiveScopeId({
      categoricalFilters: categoricalDrill,
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });

  // Verify the predicateSetKey output matches what predicateSetKey produces directly
  it('key computation consistent with predicateSetKey', () => {
    const leaves = [betweenLeaf, eqLeaf];
    const scope = scopeFromLeaves(PROJECT, 'CycleTime', leaves);
    // The scope's predicates key must equal predicateSetKey(leaves)
    expect(predicateSetKey(scope.predicates)).toBe(predicateSetKey(leaves));
    const id = matchActiveScopeIdByLeaves({
      leaves,
      outcome: 'CycleTime',
      scopeProjectId: PROJECT,
      scopes: [scope],
    });
    expect(id).toBe(scope.id);
  });
});
