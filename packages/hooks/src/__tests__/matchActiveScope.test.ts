import { describe, it, expect } from 'vitest';
import {
  createProblemStatementScope,
  buildConditionFromCategoricalFilters,
  type CategoricalFilterInput,
} from '@variscout/core';
import { matchActiveScopeId } from '../matchActiveScope';

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
