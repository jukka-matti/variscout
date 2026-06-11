/**
 * useViewStore — transient view state.
 *
 * Layer: View — state that does NOT survive browser reload. NO persist middleware.
 * See docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
 */
import { create } from 'zustand';

export const STORE_LAYER = 'view' as const;

export interface ViewState {
  /** Row index highlighted in the data table (synced from chart point click). */
  highlightRowIndex: number | null;
  /** Chart point index highlighted (synced from data table row click). */
  highlightedChartPoint: number | null;
  /** Finding ID highlighted for bidirectional navigation. */
  highlightedFindingId: string | null;
  /**
   * IM-4c Focus lens (ADR-086) — the single focused Wall entity (hub / finding /
   * factor id), or null when nothing is focused. WallCanvas AND Minimap read
   * THIS one field (degree-of-interest dimming) — no per-renderer focus state.
   */
  focusedWallEntityId: string | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState. */
  pendingChartFocus: string | null;
  /** Secondary overflow view within the PI panel. */
  piOverflowView: 'data' | 'whatif' | null;
  /** Modal open/close — closes on reload by intent. */
  isDataTableOpen: boolean;

  /** Idea highlighted in the prioritization matrix (relocated from improvementStore). */
  highlightedImprovementIdeaId: string | null;
  /** 'plan' | 'track' tab toggle in the IMPROVE workspace (relocated from improvementStore). */
  improvementActiveView: 'plan' | 'track';

  /** Multi-point selection — Minitab brushing (relocated from projectStore). */
  selectedPoints: Set<number>;
  /** Mapping from data row index → display point index (relocated from projectStore). */
  selectionIndexMap: Map<number, number>;

  /**
   * ER-2 factor strip: the set of factor chips the analyst has examined,
   * keyed `${outcome}::${factor}`. Transient (View layer — no persist); cleared
   * on loadProject / newProject via clearTransientSelections. The strip projects
   * this to a per-outcome factor-name Set for the active outcome.
   */
  examinedFactors: Set<string>;

  /**
   * ER-4 tier-2 transient highlight (D6/Principle 6): the boxplot/Pareto group
   * the analyst clicked, as `{ column, value }`. Group-keyed — each chart derives
   * its own row membership Set (no persisted index lists). A group click sets
   * THIS (NOT `selectedPoints`, which triggers the brush CaptureCard effect) and
   * shows the group pill; commit happens only via the pill's actions. Cross-chart:
   * the boxplot dims non-highlighted categories; the I-Chart lights the rows whose
   * `row[column] === value`. Cleared by `clearTransientSelections`, by Esc (first
   * in the cascade), and on apply. Default null.
   */
  transientHighlight: { column: string; value: string | number } | null;
}

export interface ViewActions {
  // Highlights
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setHighlightPoint: (index: number | null) => void;
  setHighlightedFindingId: (id: string | null) => void;
  /** IM-4c Focus lens — set (or clear with null) the focused Wall entity. */
  setFocusedWallEntity: (id: string | null) => void;
  setPendingChartFocus: (chart: string | null) => void;
  setPIOverflowView: (view: 'data' | 'whatif' | null) => void;
  toggleDataTable: () => void;

  // Improvement
  setHighlightedImprovementIdeaId: (id: string | null) => void;
  setImprovementActiveView: (view: 'plan' | 'track') => void;

  // Selection (brushing)
  setSelectedPoints: (points: Set<number>) => void;
  setSelectionIndexMap: (map: Map<number, number>) => void;
  /** Clear brushing selection. Called by projectStore on loadProject / newProject. */
  clearTransientSelections: () => void;

  // Rich selection actions (relocated from projectStore in F4 — spec D1)
  /** Add the given indices to the selection set. */
  addToSelection: (indices: number[]) => void;
  /** Remove the given indices from the selection set. */
  removeFromSelection: (indices: number[]) => void;
  /** Clear ONLY the selectedPoints set; leaves selectionIndexMap untouched.
   *  Differs from clearTransientSelections (which clears both) — preserves the
   *  legacy projectStore.clearSelection semantics that consumers depend on. */
  clearSelection: () => void;
  /** Toggle whether a single index is in the selection set. */
  togglePointSelection: (index: number) => void;

  // Factor strip examined-state (ER-2)
  /**
   * Mark a factor as examined for the given outcome. Idempotent — re-marking an
   * already-examined `${outcome}::${factor}` key is a no-op (no new Set identity).
   * Never called by an effect — only from a user chip click (ER-2 invariant).
   */
  markFactorExamined: (outcome: string, factor: string) => void;
  /** Clear ONLY the examined-factors set. */
  clearExaminedFactors: () => void;

  // Tier-2 transient highlight (ER-4)
  /** Set (or clear with null) the group-keyed transient highlight. */
  setTransientHighlight: (highlight: { column: string; value: string | number } | null) => void;
}

export type ViewStore = ViewState & ViewActions;

export const getViewInitialState = (): ViewState => ({
  highlightRowIndex: null,
  highlightedChartPoint: null,
  highlightedFindingId: null,
  focusedWallEntityId: null,
  pendingChartFocus: null,
  piOverflowView: null,
  isDataTableOpen: false,
  highlightedImprovementIdeaId: null,
  improvementActiveView: 'plan',
  selectedPoints: new Set(),
  selectionIndexMap: new Map(),
  examinedFactors: new Set(),
  transientHighlight: null,
});

/** Compose the canonical examined-factors Set key. */
export const examinedFactorKey = (outcome: string, factor: string): string =>
  `${outcome}::${factor}`;

export const useViewStore = create<ViewStore>(set => ({
  ...getViewInitialState(),

  handlePointClick: index => set({ highlightRowIndex: index }),
  handleRowClick: index => set({ highlightedChartPoint: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),
  setHighlightedFindingId: id => set({ highlightedFindingId: id }),
  setFocusedWallEntity: id => set({ focusedWallEntityId: id }),
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),
  setPIOverflowView: view => set({ piOverflowView: view }),
  toggleDataTable: () => set(s => ({ isDataTableOpen: !s.isDataTableOpen })),

  setHighlightedImprovementIdeaId: id => set({ highlightedImprovementIdeaId: id }),
  setImprovementActiveView: view => set({ improvementActiveView: view }),

  setSelectedPoints: points => set({ selectedPoints: points }),
  setSelectionIndexMap: map => set({ selectionIndexMap: map }),
  clearTransientSelections: () =>
    set({
      selectedPoints: new Set(),
      selectionIndexMap: new Map(),
      // ER-2: examined-factor marks are project-scoped — reset on load/new.
      examinedFactors: new Set(),
      // ER-4: the tier-2 transient highlight is session-transient — reset too.
      transientHighlight: null,
    }),

  addToSelection: indices =>
    set(s => {
      const newSet = new Set(s.selectedPoints);
      indices.forEach(i => newSet.add(i));
      return { selectedPoints: newSet };
    }),
  removeFromSelection: indices =>
    set(s => {
      const newSet = new Set(s.selectedPoints);
      indices.forEach(i => newSet.delete(i));
      return { selectedPoints: newSet };
    }),
  clearSelection: () => set({ selectedPoints: new Set() }),
  togglePointSelection: index =>
    set(s => {
      const newSet = new Set(s.selectedPoints);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return { selectedPoints: newSet };
    }),

  markFactorExamined: (outcome, factor) =>
    set(s => {
      const key = examinedFactorKey(outcome, factor);
      if (s.examinedFactors.has(key)) return {}; // idempotent — preserve identity
      const next = new Set(s.examinedFactors);
      next.add(key);
      return { examinedFactors: next };
    }),
  clearExaminedFactors: () => set({ examinedFactors: new Set() }),

  setTransientHighlight: highlight => set({ transientHighlight: highlight }),
}));

// Expose getInitialState on the store instance for the canonical test reset
// pattern: `useViewStore.setState(useViewStore.getInitialState())` — matches
// `packages/stores/CLAUDE.md` Invariants and the canvasStore / canvasViewportStore /
// projectStore precedent.
(useViewStore as unknown as { getInitialState: () => ViewState }).getInitialState =
  getViewInitialState;
