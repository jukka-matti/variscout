/**
 * analyzeStore — syncScopeFromDrill contract
 *
 * Pins three invariants for Task 1 of PR-CS-0:
 *
 *  1. Per-IP isolation   — identical predicates under different projectIds
 *                          produce separate ProblemStatementScopes (no co-mingling).
 *  2. Within-IP idempotency — re-firing with the same predicates under the same
 *                          projectId returns the existing scope (no duplicate).
 *  3. Empty-filter guard  — empty categoricalFilters returns undefined and creates
 *                          no scope entry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeStore, getAnalyzeInitialState } from '../analyzeStore';
import { predicateSetKey } from '@variscout/core';
import type { CategoricalFilterInput, ConditionLeaf } from '@variscout/core';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Realistic drill filters: two shifts, one specific line. */
const FILTERS: ReadonlyArray<CategoricalFilterInput> = [
  { column: 'Shift', values: ['Night'] },
  { column: 'Line', values: ['A', 'C'] },
];

const OUTCOME = 'Cycle Time';

const IP_A = 'ip-aaaaaaaa-0001';
const IP_B = 'ip-bbbbbbbb-0002';

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAnalyzeStore.setState(getAnalyzeInitialState());
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('analyzeStore — syncScopeFromDrill: per-IP isolation', () => {
  it('creates two distinct scopes when called with identical predicates under different IPs', () => {
    const scopeA = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, FILTERS);
    const scopeB = useAnalyzeStore.getState().syncScopeFromDrill(IP_B, OUTCOME, FILTERS);

    // Both calls must return a scope (non-null).
    expect(scopeA).toBeDefined();
    expect(scopeB).toBeDefined();

    // They must be different objects with different ids.
    expect(scopeA!.id).not.toBe(scopeB!.id);

    // Each scope carries the correct projectId.
    expect(scopeA!.projectId).toBe(IP_A);
    expect(scopeB!.projectId).toBe(IP_B);

    // The store must hold exactly 2 scopes — no co-mingling or deduplication
    // across IPs.
    const { scopes } = useAnalyzeStore.getState();
    expect(scopes).toHaveLength(2);
  });
});

describe('analyzeStore — syncScopeFromDrill: within-IP idempotency', () => {
  it('returns the same scope on repeated calls with identical predicates under the same IP', () => {
    const first = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, FILTERS);
    const second = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, FILTERS);

    // Both invocations must return the same scope object (same id).
    expect(first).toBeDefined();
    expect(first!.id).toBe(second!.id);

    // The store must contain exactly one scope — no duplication.
    const { scopes } = useAnalyzeStore.getState();
    expect(scopes).toHaveLength(1);
  });

  it('treats chip order as irrelevant — reversed filter array yields the same scope', () => {
    const reversed = [...FILTERS].reverse() as CategoricalFilterInput[];

    const first = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, FILTERS);
    const second = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, reversed);

    expect(first).toBeDefined();
    expect(first!.id).toBe(second!.id);

    const { scopes } = useAnalyzeStore.getState();
    expect(scopes).toHaveLength(1);
  });
});

describe('analyzeStore — syncScopeFromDrill: empty-filter guard', () => {
  it('returns undefined and creates no scope when filters array is empty', () => {
    const result = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, []);

    expect(result).toBeUndefined();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });

  it('returns undefined and creates no scope when all filter chips have empty values', () => {
    const emptyChips: CategoricalFilterInput[] = [
      { column: 'Shift', values: [] },
      { column: 'Line', values: [] },
    ];

    const result = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, emptyChips);

    expect(result).toBeUndefined();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });
});

// ===========================================================================
// syncScopeFromCondition — range-capable Explore-side PSS producer
// ===========================================================================

const BETWEEN_LEAF: ConditionLeaf = {
  kind: 'leaf',
  column: 'Temp',
  op: 'between',
  value: [100, 200],
};
const GTE_LEAF: ConditionLeaf = { kind: 'leaf', column: 'Pressure', op: 'gte', value: 5 };
const EQ_LEAF: ConditionLeaf = { kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' };
const IN_LEAF: ConditionLeaf = { kind: 'leaf', column: 'Line', op: 'in', value: ['A', 'C'] };

describe('analyzeStore — syncScopeFromCondition: empty-leaves guard', () => {
  it('returns undefined and creates no scope when leaves array is empty', () => {
    const result = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, []);
    expect(result).toBeUndefined();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });
});

describe('analyzeStore — syncScopeFromCondition: creates scope from RANGE leaves', () => {
  it('creates a scope and returns its id for a between leaf', () => {
    const id = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    const { scopes } = useAnalyzeStore.getState();
    expect(scopes).toHaveLength(1);
    expect(scopes[0].projectId).toBe(IP_A);
    expect(scopes[0].outcome).toBe(OUTCOME);
  });

  it('stores the leaves as scope predicates (range leaf preserved)', () => {
    useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    const scope = useAnalyzeStore.getState().scopes[0];
    expect(predicateSetKey(scope.predicates)).toBe(predicateSetKey([BETWEEN_LEAF]));
  });

  it('creates a scope from a gte leaf', () => {
    const id = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [GTE_LEAF]);
    expect(id).toBeDefined();
    const scope = useAnalyzeStore.getState().scopes[0];
    expect(predicateSetKey(scope.predicates)).toBe(predicateSetKey([GTE_LEAF]));
  });
});

describe('analyzeStore — syncScopeFromCondition: idempotency', () => {
  it('returns same id on repeat call with identical RANGE leaves', () => {
    const id1 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    const id2 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    expect(id1).toBe(id2);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('returns same id on repeat call with MIXED leaves (categorical + range)', () => {
    const mixed = [EQ_LEAF, BETWEEN_LEAF];
    const id1 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, mixed);
    const id2 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, mixed);
    expect(id1).toBe(id2);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('treats leaf order as irrelevant (order-independent key)', () => {
    const id1 = useAnalyzeStore
      .getState()
      .syncScopeFromCondition(IP_A, OUTCOME, [EQ_LEAF, BETWEEN_LEAF]);
    const id2 = useAnalyzeStore
      .getState()
      .syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF, EQ_LEAF]);
    expect(id1).toBe(id2);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('creates distinct scopes for different project ids', () => {
    const id1 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    const id2 = useAnalyzeStore.getState().syncScopeFromCondition(IP_B, OUTCOME, [BETWEEN_LEAF]);
    expect(id1).not.toBe(id2);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);
  });

  it('creates distinct scopes for different outcomes', () => {
    const id1 = useAnalyzeStore
      .getState()
      .syncScopeFromCondition(IP_A, 'Cycle Time', [BETWEEN_LEAF]);
    const id2 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, 'Defects', [BETWEEN_LEAF]);
    expect(id1).not.toBe(id2);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);
  });
});

describe('analyzeStore — syncScopeFromCondition: soft-deleted scope not matched', () => {
  it('does not return a soft-deleted scope id; creates a new scope instead', () => {
    // Create, then archive the scope.
    const id1 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    expect(id1).toBeDefined();
    useAnalyzeStore.getState().archiveScope(id1!);

    // Same leaves → must create a new scope, not return the deleted one.
    const id2 = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    expect(id2).toBeDefined();
    expect(id2).not.toBe(id1);
    // Store now has 2 scopes (original soft-deleted + new one).
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);
  });
});

describe('analyzeStore — syncScopeFromCondition: mixed categorical + range leaves', () => {
  it('creates a scope for mixed eq + between leaves', () => {
    const id = useAnalyzeStore
      .getState()
      .syncScopeFromCondition(IP_A, OUTCOME, [EQ_LEAF, BETWEEN_LEAF]);
    expect(id).toBeDefined();
    const scope = useAnalyzeStore.getState().scopes[0];
    expect(predicateSetKey(scope.predicates)).toBe(predicateSetKey([EQ_LEAF, BETWEEN_LEAF]));
  });

  it('creates a scope for in + gte leaves', () => {
    const leaves = [IN_LEAF, GTE_LEAF];
    const id = useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, leaves);
    expect(id).toBeDefined();
    const scope = useAnalyzeStore.getState().scopes[0];
    expect(predicateSetKey(scope.predicates)).toBe(predicateSetKey(leaves));
  });
});

describe('analyzeStore — syncScopeFromDrill: UNTOUCHED after syncScopeFromCondition added', () => {
  it('syncScopeFromDrill still creates a scope from categorical filters', () => {
    const scope = useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, FILTERS);
    expect(scope).toBeDefined();
    expect(scope!.projectId).toBe(IP_A);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('syncScopeFromDrill and syncScopeFromCondition both work independently', () => {
    useAnalyzeStore.getState().syncScopeFromDrill(IP_A, OUTCOME, FILTERS);
    useAnalyzeStore.getState().syncScopeFromCondition(IP_A, OUTCOME, [BETWEEN_LEAF]);
    expect(useAnalyzeStore.getState().scopes).toHaveLength(2);
  });
});
