import type React from 'react';
import type {
  StatsResult,
  SpecLimits,
  GlossaryTerm,
  DataRow,
  StagedComparison,
} from '@variscout/core';

export interface StatsPanelBaseProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: 'summary' | 'histogram' | 'normality';
  className?: string;
  compact?: boolean;
  /** Called when user clicks the pencil link to edit/set spec limits */
  onEditSpecs?: () => void;
  /** Render histogram chart content */
  renderHistogram?: (
    data: number[],
    specs: Pick<SpecLimits, 'usl' | 'lsl'>,
    mean: number
  ) => React.ReactNode;
  /** Render probability plot content */
  renderProbabilityPlot?: (data: number[], mean: number, stdDev: number) => React.ReactNode;
  /** When false, hides Cp, Cpk, and Pass Rate cards from the summary grid */
  showCpk?: boolean;
  /** When present and staged data is active, replaces default metric grid with comparison card */
  stagedComparison?: StagedComparison;
  /** Cpk target for staged comparison display */
  cpkTarget?: number;
  /** Callback when Cpk card is clicked (navigates to capability mode) */
  onCpkClick?: () => void;
  /** Number of subgroups meeting cpkTarget (shown when in capability mode) */
  subgroupsMeetingTarget?: number;
  /** Total subgroup count (shown with subgroupsMeetingTarget) */
  subgroupCount?: number;
  /** Render extra content after summary (e.g., What-If Simulator, Spec Editor button) */
  renderSummaryFooter?: (stats: StatsResult, specs: SpecLimits) => React.ReactNode;
  /** Glossary term lookup function */
  getTerm: (key: string) => GlossaryTerm | undefined;
}
