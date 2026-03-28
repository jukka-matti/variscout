import { create } from 'zustand';
import type {
  ProcessProjection,
  CenteringOpportunity,
  SpecSuggestion,
} from '@variscout/core/variation';
import type { ComplementInsight } from '@variscout/ui';

// ── State ────────────────────────────────────────────────────────────────────

interface ProjectionState {
  /** Active projection for toolbar + sidebar (highest priority) */
  activeProjection: ProcessProjection | null;
  /** Drill projection ("if fixed") */
  drillProjection: ProcessProjection | null;
  /** Benchmark projection */
  benchmarkProjection: ProcessProjection | null;
  /** Cumulative projection from scoped findings */
  cumulativeProjection: ProcessProjection | null;
  /** Improvement phase projection */
  improvementProjection: ProcessProjection | null;
  /** Resolved findings actual Cpk */
  resolvedProjection: ProcessProjection | null;
  /** Centering opportunity (Cp vs Cpk gap) */
  centeringOpportunity: CenteringOpportunity | null;
  /** Spec suggestion for no-specs state */
  specSuggestion: SpecSuggestion | null;
  /** Complement insight for Target Discovery card */
  complement: ComplementInsight | null;
  /** Whether user is currently drilling */
  isDrilling: boolean;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface ProjectionActions {
  /** Bulk sync all projection data from useProcessProjection hook */
  syncProjections: (data: Partial<ProjectionState>) => void;
  /** Update complement insight (from App.tsx complement computation) */
  setComplement: (complement: ComplementInsight | null) => void;
  /** Update drilling state */
  setIsDrilling: (drilling: boolean) => void;
}

export type ProjectionStore = ProjectionState & ProjectionActions;

// ── Store ────────────────────────────────────────────────────────────────────

export const useProjectionStore = create<ProjectionStore>(set => ({
  // Initial state
  activeProjection: null,
  drillProjection: null,
  benchmarkProjection: null,
  cumulativeProjection: null,
  improvementProjection: null,
  resolvedProjection: null,
  centeringOpportunity: null,
  specSuggestion: null,
  complement: null,
  isDrilling: false,

  // Actions
  syncProjections: data => set(data),
  setComplement: complement => set({ complement }),
  setIsDrilling: isDrilling => set({ isDrilling }),
}));
