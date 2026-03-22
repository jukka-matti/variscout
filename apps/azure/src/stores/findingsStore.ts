import { create } from 'zustand';
import type { Finding } from '@variscout/core';

// ── Derived State ───────────────────────────────────────────────────────────

interface ChartFindings {
  boxplot: Finding[];
  pareto: Finding[];
  ichart: Finding[];
}

function groupFindingsByChart(findings: Finding[]): ChartFindings {
  const boxplot: Finding[] = [];
  const pareto: Finding[] = [];
  const ichart: Finding[] = [];
  for (const f of findings) {
    if (f.source?.chart === 'boxplot') boxplot.push(f);
    else if (f.source?.chart === 'pareto') pareto.push(f);
    else if (f.source?.chart === 'ichart') ichart.push(f);
  }
  return { boxplot, pareto, ichart };
}

// ── State ───────────────────────────────────────────────────────────────────

interface FindingsStoreState {
  /** All findings (synced from useFindings hook) */
  findings: Finding[];
  /** ID of finding currently highlighted for scroll-to animation */
  highlightedFindingId: string | null;
  /** Findings grouped by source chart type (derived from findings) */
  chartFindings: ChartFindings;
}

// ── Actions ─────────────────────────────────────────────────────────────────

interface FindingsStoreActions {
  /**
   * Sync findings from the useFindings hook into the store.
   * Called by useFindingsOrchestration whenever findings change.
   * Also recomputes chartFindings.
   */
  syncFindings: (findings: Finding[]) => void;
  /** Set the highlighted finding ID (for scroll-to animation) */
  setHighlightedFindingId: (id: string | null) => void;
}

export type FindingsStore = FindingsStoreState & FindingsStoreActions;

// ── Store ───────────────────────────────────────────────────────────────────

export const useFindingsStore = create<FindingsStore>((set, get) => ({
  // Initial state
  findings: [],
  highlightedFindingId: null,
  chartFindings: { boxplot: [], pareto: [], ichart: [] },

  // Actions
  syncFindings: (findings: Finding[]) => {
    if (findings === get().findings) return; // skip redundant recomputation
    set({
      findings,
      chartFindings: groupFindingsByChart(findings),
    });
  },

  setHighlightedFindingId: (id: string | null) => set({ highlightedFindingId: id }),
}));
