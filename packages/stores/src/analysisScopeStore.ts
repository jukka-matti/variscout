/**
 * useAnalysisScopeStore — transient analysis-scope state (View layer).
 *
 * No persist middleware. Session-scoped. Bridge primitive between Process tab
 * (live scope visualisation) and Explore tab (single-row scope chrome).
 * Mode-agnostic — does not touch projectStore.analysisMode.
 *
 * Spec: docs/superpowers/specs/2026-05-28-state-edit-mode-and-ip-scoped-presentation-design.md §3 D10
 */
import { create } from 'zustand';
import type { ConditionLeaf } from '@variscout/core';

export const STORE_LAYER = 'view' as const;

export interface CategoricalFilter {
  readonly column: string;
  readonly values: ReadonlyArray<string | number>;
}

export interface AnalysisScopeState {
  readonly yColumn?: string;
  readonly boxplotFactor?: string;
  readonly stepId?: string;
  readonly categoricalFilters: ReadonlyArray<CategoricalFilter>;
  /**
   * ER-4 condition-loop: the active pill condition as a flat leaf list.
   *
   * Carries range predicates (between / gte / lte / etc.) that cannot be
   * represented as categorical chips. Set by the pill on brush-up; read by
   * the scope-bar to drive `syncScopeFromCondition`. Persists only for the
   * session (View layer — no middleware). Default [].
   */
  readonly conditionLeaves: ReadonlyArray<ConditionLeaf>;
}

export interface AnalysisScopeActions {
  setY: (yColumn: string | undefined) => void;
  setBoxplotFactor: (boxplotFactor: string | undefined) => void;
  setStepId: (stepId: string | undefined) => void;
  addCategoricalValue: (column: string, value: string | number) => void;
  removeCategoricalValue: (column: string, value: string | number) => void;
  setCategoricalValues: (column: string, values: ReadonlyArray<string | number>) => void;
  removeCategoricalFilter: (column: string) => void;
  /** ER-4: Replace the active pill condition leaves. Pass [] to clear. */
  setConditionLeaves: (leaves: ReadonlyArray<ConditionLeaf>) => void;
  clearScope: () => void;
}

export type AnalysisScopeStore = AnalysisScopeState & AnalysisScopeActions;

export const getAnalysisScopeInitialState = (): AnalysisScopeState => ({
  yColumn: undefined,
  boxplotFactor: undefined,
  stepId: undefined,
  categoricalFilters: [],
  conditionLeaves: [],
});

export const useAnalysisScopeStore = create<AnalysisScopeStore>(set => ({
  ...getAnalysisScopeInitialState(),
  setY: yColumn => set({ yColumn }),
  setBoxplotFactor: boxplotFactor => set({ boxplotFactor }),
  setStepId: stepId => set({ stepId }),
  addCategoricalValue: (column, value) =>
    set(s => {
      const existing = s.categoricalFilters.find(f => f.column === column);
      if (existing) {
        if (existing.values.includes(value)) return {};
        return {
          categoricalFilters: s.categoricalFilters.map(f =>
            f.column === column ? { column, values: [...f.values, value] } : f
          ),
        };
      }
      return {
        categoricalFilters: [...s.categoricalFilters, { column, values: [value] }],
      };
    }),
  removeCategoricalValue: (column, value) =>
    set(s => {
      const existing = s.categoricalFilters.find(f => f.column === column);
      if (!existing) return {};
      if (!existing.values.includes(value)) return {};
      const remaining = existing.values.filter(v => v !== value);
      if (remaining.length === 0) {
        return {
          categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
        };
      }
      return {
        categoricalFilters: s.categoricalFilters.map(f =>
          f.column === column ? { column, values: remaining } : f
        ),
      };
    }),
  setCategoricalValues: (column, values) =>
    set(s => {
      const existing = s.categoricalFilters.find(f => f.column === column);
      if (values.length === 0) {
        if (!existing) return {};
        return {
          categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
        };
      }
      if (existing) {
        return {
          categoricalFilters: s.categoricalFilters.map(f =>
            f.column === column ? { column, values: [...values] } : f
          ),
        };
      }
      return {
        categoricalFilters: [...s.categoricalFilters, { column, values: [...values] }],
      };
    }),
  removeCategoricalFilter: column =>
    set(s => {
      if (!s.categoricalFilters.some(f => f.column === column)) return {};
      return {
        categoricalFilters: s.categoricalFilters.filter(f => f.column !== column),
      };
    }),
  setConditionLeaves: leaves => set({ conditionLeaves: [...leaves] }),
  clearScope: () => set(getAnalysisScopeInitialState()),
}));

// Expose getInitialState on the store instance for the canonical test reset
// pattern: `useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState())`
// — matches packages/stores/CLAUDE.md Invariants and viewStore.ts:142-143 precedent.
(
  useAnalysisScopeStore as unknown as { getInitialState: () => AnalysisScopeState }
).getInitialState = getAnalysisScopeInitialState;
