/**
 * useConditionLoop tests (ER-4) — the brush-pill / group-pill / scope-bar / apply
 * / clear / take-to-Analyze orchestration shared by both Dashboards.
 *
 * Pattern: renderHook + the canonical Zustand reset (setState(getInitialState))
 * in beforeEach for the three View/Document stores the hook touches.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewStore, useAnalysisScopeStore, useAnalyzeStore } from '@variscout/stores';
import type { DataRow } from '@variscout/core';
import { useConditionLoop } from '../useConditionLoop';

const PROJECT = 'proj-1';
const OUTCOME = 'CycleTime';

// Lensed rows: 6 rows, two cavities. CycleTime spans 10..60.
const ROWS: DataRow[] = [
  { Cavity: 'Cav1', CycleTime: 10 },
  { Cavity: 'Cav1', CycleTime: 20 },
  { Cavity: 'Cav1', CycleTime: 30 },
  { Cavity: 'Cav2', CycleTime: 40 },
  { Cavity: 'Cav2', CycleTime: 50 },
  { Cavity: 'Cav2', CycleTime: 60 },
];

beforeEach(() => {
  useViewStore.setState(useViewStore.getInitialState());
  useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
  useAnalyzeStore.setState({ scopes: [] });
});

function render(rows: DataRow[] = ROWS) {
  return renderHook(() =>
    useConditionLoop({ lensedRows: rows, outcome: OUTCOME, scopeProjectId: PROJECT })
  );
}

describe('useConditionLoop — group pill (transient highlight)', () => {
  it('derives an honest group pill from the transient highlight', () => {
    const { result } = render();
    act(() => useViewStore.getState().setTransientHighlight({ column: 'Cavity', value: 'Cav1' }));
    const pill = result.current.groupPill!;
    expect(pill).not.toBeNull();
    expect(pill.summary).toContain('Cavity');
    expect(pill.nIn).toBe(3); // Cav1 rows
    expect(pill.meanIn).toBeCloseTo(20); // (10+20+30)/3
    expect(pill.meanOut).toBeCloseTo(50); // (40+50+60)/3
  });

  it('exposes transient member indices in display-index space', () => {
    const { result } = render();
    act(() => useViewStore.getState().setTransientHighlight({ column: 'Cavity', value: 'Cav2' }));
    expect([...result.current.transientMemberIndices].sort((a, b) => a - b)).toEqual([3, 4, 5]);
  });
});

describe('useConditionLoop — brush pill (y-band)', () => {
  it('builds a band leaf from brushed display indices with honest n/x̄', () => {
    const { result } = render();
    // Brush the bottom three display points (indices 0,1,2 → CycleTime 10..30).
    const pill = result.current.buildBrushPill(new Set([0, 1, 2]))!;
    expect(pill).not.toBeNull();
    expect(pill.leaf).toEqual({
      kind: 'leaf',
      column: OUTCOME,
      op: 'between',
      value: [10, 30],
    });
    expect(pill.nIn).toBe(3);
    expect(pill.meanIn).toBeCloseTo(20);
    expect(pill.meanOut).toBeCloseTo(50);
  });

  it('returns null for an empty brush', () => {
    const { result } = render();
    expect(result.current.buildBrushPill(new Set())).toBeNull();
  });
});

describe('useConditionLoop — applyCondition (scope-store-only routing)', () => {
  it('writes the FULL leaves (categorical AND range) to the scope store and NOT to filters', () => {
    const { result } = render();
    const bandLeaf = { kind: 'leaf', column: OUTCOME, op: 'between', value: [10, 30] } as const;
    const catLeaf = { kind: 'leaf', column: 'Cavity', op: 'eq', value: 'Cav1' } as const;
    act(() => result.current.applyCondition([catLeaf, bandLeaf]));
    // Full leaves → scope store
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([catLeaf, bandLeaf]);
    // A condition NEVER routes to projectStore.filters — useFilteredData /
    // useAnalysisStats stay full-series so the I-Chart plots the full lensed series.
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
    // Transient highlight cleared on apply
    expect(useViewStore.getState().transientHighlight).toBeNull();
  });

  it('a categorical-only condition is scope-store-only too (no filters write)', () => {
    const { result } = render();
    const catLeaf = { kind: 'leaf', column: 'Cavity', op: 'eq', value: 'Cav1' } as const;
    act(() => result.current.applyCondition([catLeaf]));
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([catLeaf]);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });

  it('a range-only condition writes the leaf to the scope store (no filters write)', () => {
    const { result } = render();
    const bandLeaf = { kind: 'leaf', column: OUTCOME, op: 'between', value: [40, 60] } as const;
    act(() => result.current.applyCondition([bandLeaf]));
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([bandLeaf]);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
  });
});

describe('useConditionLoop — applied condition derivations', () => {
  it('conditionRows + memberIndices + scope-bar counts reflect a range condition', () => {
    const bandLeaf = { kind: 'leaf', column: OUTCOME, op: 'between', value: [40, 60] } as const;
    act(() => useAnalysisScopeStore.getState().setConditionLeaves([bandLeaf]));
    const { result } = render();
    expect(result.current.hasCondition).toBe(true);
    expect(result.current.conditionRows).toHaveLength(3); // 40,50,60
    expect([...result.current.conditionMemberIndices].sort((a, b) => a - b)).toEqual([3, 4, 5]);
    expect(result.current.scopeBarNIn).toBe(3);
    expect(result.current.scopeBarNTotal).toBe(6);
    expect(result.current.scopeBarLabel).toContain('CycleTime');
  });

  it('no condition → full lensed rows, empty member set', () => {
    const { result } = render();
    expect(result.current.hasCondition).toBe(false);
    expect(result.current.conditionRows).toHaveLength(6);
    expect(result.current.conditionMemberIndices.size).toBe(0);
  });
});

describe('useConditionLoop — clearCondition (the ONE coherent clear)', () => {
  it('clears filters, the scope store, and the transient highlight together', () => {
    const bandLeaf = { kind: 'leaf', column: OUTCOME, op: 'between', value: [40, 60] } as const;
    act(() => {
      useAnalysisScopeStore.getState().setConditionLeaves([bandLeaf]);
      useAnalysisScopeStore.getState().addCategoricalValue('Cavity', 'Cav2');
      useViewStore.getState().setTransientHighlight({ column: 'Cavity', value: 'Cav2' });
    });
    const { result } = render();
    const clearFilters = vi.fn();
    act(() => result.current.clearCondition(clearFilters));
    expect(clearFilters).toHaveBeenCalled();
    expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([]);
    expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
    expect(useViewStore.getState().transientHighlight).toBeNull();
  });
});

describe('useConditionLoop — take to Analyze + capture scope id', () => {
  it('takeToAnalyze mints the PSS (range-capable) THEN navigates', () => {
    const bandLeaf = { kind: 'leaf', column: OUTCOME, op: 'between', value: [40, 60] } as const;
    act(() => useAnalysisScopeStore.getState().setConditionLeaves([bandLeaf]));
    const { result } = render();
    const onOpenWall = vi.fn();
    act(() => result.current.takeToAnalyze(onOpenWall));
    const scopes = useAnalyzeStore.getState().scopes;
    expect(scopes).toHaveLength(1);
    expect(scopes[0].outcome).toBe(OUTCOME);
    expect(scopes[0].predicates).toEqual([bandLeaf]);
    expect(onOpenWall).toHaveBeenCalled();
  });

  it('mintScopeIdForCapture mints when no scope exists, matches on the second call', () => {
    const bandLeaf = { kind: 'leaf', column: OUTCOME, op: 'between', value: [40, 60] } as const;
    act(() => useAnalysisScopeStore.getState().setConditionLeaves([bandLeaf]));
    const { result } = render();
    let id1: string | undefined;
    let id2: string | undefined;
    act(() => {
      id1 = result.current.mintScopeIdForCapture();
    });
    act(() => {
      id2 = result.current.mintScopeIdForCapture();
    });
    expect(id1).toBeDefined();
    expect(id2).toBe(id1); // idempotent — no duplicate scope
    expect(useAnalyzeStore.getState().scopes).toHaveLength(1);
  });

  it('mintScopeIdForCapture returns undefined with no active condition', () => {
    const { result } = render();
    let id: string | undefined = 'x';
    act(() => {
      id = result.current.mintScopeIdForCapture();
    });
    expect(id).toBeUndefined();
    expect(useAnalyzeStore.getState().scopes).toHaveLength(0);
  });
});
