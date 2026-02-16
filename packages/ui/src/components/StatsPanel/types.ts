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
  // Grade rows
  gradeRow: string;
  gradeLabel: string;
  gradeCount: string;
  gradePercent: string;
  gradeHeader: string;
  // Grade compact (mobile)
  gradeCompactCard: string;
  gradeCompactLabel: string;
  gradeCompactPercent: string;
  gradeCompactCount: string;
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
  /** Render histogram chart content */
  renderHistogram?: (
    data: number[],
    specs: { usl?: number; lsl?: number },
    mean: number
  ) => React.ReactNode;
  /** Render probability plot content */
  renderProbabilityPlot?: (data: number[], mean: number, stdDev: number) => React.ReactNode;
  /** Render extra content after summary (e.g., What-If Simulator, Spec Editor button) */
  renderSummaryFooter?: (
    stats: StatsResult,
    specs: { usl?: number; lsl?: number; target?: number }
  ) => React.ReactNode;
  /** Glossary term lookup function */
  getTerm: (key: string) => GlossaryTerm | undefined;
}
