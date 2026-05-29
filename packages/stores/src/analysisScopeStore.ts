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
}

export interface AnalysisScopeActions {
  setY: (yColumn: string | undefined) => void;
  setBoxplotFactor: (factor: string | undefined) => void;
  setStepId: (stepId: string | undefined) => void;
  addCategoricalValue: (column: string, value: string | number) => void;
  removeCategoricalValue: (column: string, value: string | number) => void;
  setCategoricalValues: (column: string, values: ReadonlyArray<string | number>) => void;
  removeCategoricalFilter: (column: string) => void;
  clearScope: () => void;
}

export type AnalysisScopeStore = AnalysisScopeState & AnalysisScopeActions;

export const getAnalysisScopeInitialState = (): AnalysisScopeState => ({
  yColumn: undefined,
  boxplotFactor: undefined,
  stepId: undefined,
  categoricalFilters: [],
});

const notImplemented =
  (name: string) =>
  (..._args: unknown[]): void => {
    throw new Error(`useAnalysisScopeStore.${name}: not implemented yet`);
  };

export const useAnalysisScopeStore = create<AnalysisScopeStore>(set => ({
  ...getAnalysisScopeInitialState(),
  setY: yColumn => set({ yColumn }),
  setBoxplotFactor: factor => set({ boxplotFactor: factor }),
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
  setCategoricalValues: notImplemented('setCategoricalValues'),
  removeCategoricalFilter: notImplemented('removeCategoricalFilter'),
  clearScope: notImplemented('clearScope'),
}));

// Expose getInitialState on the store instance for the canonical test reset
// pattern: `useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState())`
// — matches packages/stores/CLAUDE.md Invariants and viewStore.ts:142-143 precedent.
(
  useAnalysisScopeStore as unknown as { getInitialState: () => AnalysisScopeState }
).getInitialState = getAnalysisScopeInitialState;
