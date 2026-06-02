/**
 * analyzeStore — syncScopeFromDrill contract
 *
 * Pins three invariants for Task 1 of PR-CS-0:
 *
 *  1. Per-IP isolation   — identical predicates under different investigationIds
 *                          produce separate ProblemStatementScopes (no co-mingling).
 *  2. Within-IP idempotency — re-firing with the same predicates under the same
 *                          investigationId returns the existing scope (no duplicate).
 *  3. Empty-filter guard  — empty categoricalFilters returns undefined and creates
 *                          no scope entry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyzeStore, getAnalyzeInitialState } from '../analyzeStore';
import type { CategoricalFilterInput } from '@variscout/core';

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

    // Each scope carries the correct investigationId.
    expect(scopeA!.investigationId).toBe(IP_A);
    expect(scopeB!.investigationId).toBe(IP_B);

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
