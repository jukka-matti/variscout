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
  /** Question ID expanded in the PI panel questions tab. */
  expandedQuestionId: string | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState. */
  pendingChartFocus: string | null;
  /** Secondary overflow view within the PI panel. */
  piOverflowView: 'data' | 'whatif' | null;
  /** Modal open/close — closes on reload by intent. */
  isDataTableOpen: boolean;

  /** Question id focused in investigation Wall (relocated from investigationStore). */
  focusedQuestionId: string | null;

  /** Idea highlighted in the prioritization matrix (relocated from improvementStore). */
  highlightedImprovementIdeaId: string | null;
  /** 'plan' | 'track' tab toggle in the IMPROVE workspace (relocated from improvementStore). */
  improvementActiveView: 'plan' | 'track';

  /** Multi-point selection — Minitab brushing (relocated from projectStore). */
  selectedPoints: Set<number>;
  /** Mapping from data row index → display point index (relocated from projectStore). */
  selectionIndexMap: Map<number, number>;
}

export interface ViewActions {
  // Highlights
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setHighlightPoint: (index: number | null) => void;
  setHighlightedFindingId: (id: string | null) => void;
  setExpandedQuestionId: (id: string | null) => void;
  setPendingChartFocus: (chart: string | null) => void;
  setPIOverflowView: (view: 'data' | 'whatif' | null) => void;
  toggleDataTable: () => void;

  // Investigation
  setFocusedQuestionId: (id: string | null) => void;

  // Improvement
  setHighlightedImprovementIdeaId: (id: string | null) => void;
  setImprovementActiveView: (view: 'plan' | 'track') => void;

  // Selection (brushing)
  setSelectedPoints: (points: Set<number>) => void;
  setSelectionIndexMap: (map: Map<number, number>) => void;
  /** Clear brushing selection. Called by projectStore on loadProject / newProject. */
  clearTransientSelections: () => void;
}

export type ViewStore = ViewState & ViewActions;

export const getViewInitialState = (): ViewState => ({
  highlightRowIndex: null,
  highlightedChartPoint: null,
  highlightedFindingId: null,
  expandedQuestionId: null,
  pendingChartFocus: null,
  piOverflowView: null,
  isDataTableOpen: false,
  focusedQuestionId: null,
  highlightedImprovementIdeaId: null,
  improvementActiveView: 'plan',
  selectedPoints: new Set(),
  selectionIndexMap: new Map(),
});

export const useViewStore = create<ViewStore>(set => ({
  ...getViewInitialState(),

  handlePointClick: index => set({ highlightRowIndex: index }),
  handleRowClick: index => set({ highlightedChartPoint: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),
  setHighlightedFindingId: id => set({ highlightedFindingId: id }),
  setExpandedQuestionId: id => set({ expandedQuestionId: id }),
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),
  setPIOverflowView: view => set({ piOverflowView: view }),
  toggleDataTable: () => set(s => ({ isDataTableOpen: !s.isDataTableOpen })),

  setFocusedQuestionId: id => set({ focusedQuestionId: id }),

  setHighlightedImprovementIdeaId: id => set({ highlightedImprovementIdeaId: id }),
  setImprovementActiveView: view => set({ improvementActiveView: view }),

  setSelectedPoints: points => set({ selectedPoints: points }),
  setSelectionIndexMap: map => set({ selectionIndexMap: map }),
  clearTransientSelections: () => set({ selectedPoints: new Set(), selectionIndexMap: new Map() }),
}));
