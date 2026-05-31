import { create } from 'zustand';
import type { Finding } from '@variscout/core';

export interface ChartFindings {
  boxplot: Finding[];
  pareto: Finding[];
  ichart: Finding[];
}

export interface FindingsFeatureStoreState {
  /** ID of finding currently highlighted for scroll-to animation. */
  highlightedFindingId: string | null;
  /** Active status filter for the findings list (null = show all). */
  statusFilter: string | null;
}

export interface FindingsFeatureStoreActions {
  /** Set the highlighted finding ID (for scroll-to animation). */
  setHighlightedFindingId: (id: string | null) => void;
  /** Set the status filter for the findings list (null = show all). */
  setStatusFilter: (status: string | null) => void;
}

export type FindingsFeatureStore = FindingsFeatureStoreState & FindingsFeatureStoreActions;

/** Group findings by their source chart type. Pure function for use in selectors/memos. */
export function groupFindingsByChart(findings: Finding[]): ChartFindings {
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

export function createFindingsFeatureStore() {
  return create<FindingsFeatureStore>(set => ({
    highlightedFindingId: null,
    statusFilter: null,
    setHighlightedFindingId: (id: string | null) => set({ highlightedFindingId: id }),
    setStatusFilter: status => set({ statusFilter: status }),
  }));
}
