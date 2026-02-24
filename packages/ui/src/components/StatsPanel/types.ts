import type { StatsResult, GlossaryTerm } from '@variscout/core';

export interface StatsPanelColorScheme {
  // Container
  container: string;
  containerCompact: string;
  // Tabs
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  // Metric card
  metricCardBg: string;
  metricLabel: string;
  metricValue: string;
  // Empty state
  emptyState: string;
  // Spec editor
  specEditButton: string;
}

export interface StatsPanelBaseProps {
  stats: StatsResult | null;
  specs: { usl?: number; lsl?: number; target?: number };
  filteredData?: any[];
  outcome?: string | null;
  defaultTab?: 'summary' | 'histogram' | 'normality';
  className?: string;
  compact?: boolean;
  colorScheme?: StatsPanelColorScheme;
  /** Called when user sets specs via inline inputs (shown when no specs are set) */
  onSaveSpecs?: (specs: { lsl?: number; target?: number; usl?: number }) => void;
  /** Render histogram chart content */
  renderHistogram?: (
    data: number[],
    specs: { usl?: number; lsl?: number },
    mean: number
  ) => React.ReactNode;
  /** Render probability plot content */
  renderProbabilityPlot?: (data: number[], mean: number, stdDev: number) => React.ReactNode;
  /** When false, hides Cp, Cpk, and Pass Rate cards from the summary grid */
  showCpk?: boolean;
  /** Render extra content after summary (e.g., What-If Simulator, Spec Editor button) */
  renderSummaryFooter?: (
    stats: StatsResult,
    specs: { usl?: number; lsl?: number; target?: number }
  ) => React.ReactNode;
  /** Glossary term lookup function */
  getTerm: (key: string) => GlossaryTerm | undefined;
}
