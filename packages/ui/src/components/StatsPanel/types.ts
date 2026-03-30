import type React from 'react';
import type {
  StatsResult,
  SpecLimits,
  GlossaryTerm,
  DataRow,
  StagedComparison,
} from '@variscout/core';
import type { ProcessProjection, CenteringOpportunity } from '@variscout/core/variation';
import type { ComplementInsight } from '@variscout/core';

export type StatsPanelTab = 'summary' | 'data' | 'whatif';

export interface StatsPanelBaseProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: StatsPanelTab;
  className?: string;
  compact?: boolean;
  /** Called when user clicks the pencil link to edit/set spec limits */
  onEditSpecs?: () => void;
  /** When false, hides Cp, Cpk, and Pass Rate cards from the summary grid */
  showCpk?: boolean;
  /** When present and staged data is active, replaces default metric grid with comparison card */
  stagedComparison?: StagedComparison;
  /** Cpk target threshold (shown in Cpk card, used for staged comparison) */
  cpkTarget?: number;
  /** Callback when Cpk card is clicked (navigates to capability mode) */
  onCpkClick?: () => void;
  /** Number of subgroups meeting cpkTarget (shown when in capability mode) */
  subgroupsMeetingTarget?: number;
  /** Total subgroup count (shown with subgroupsMeetingTarget) */
  subgroupCount?: number;
  /** Render extra content after summary (e.g., Spec Editor button) */
  renderSummaryFooter?: (stats: StatsResult, specs: SpecLimits) => React.ReactNode;
  /** Glossary term lookup function */
  getTerm: (key: string) => GlossaryTerm | undefined;
  /** Total sample count for display */
  sampleCount?: number;

  // --- Target Discovery (Process Intelligence Panel) ---

  /** Whether the user is currently drilling into a subset */
  isDrilling?: boolean;
  /** Complement data insight (when drilling) */
  complement?: ComplementInsight | null;
  /** Active projection for headroom check */
  activeProjection?: ProcessProjection | null;
  /** Centering opportunity (Cp vs Cpk gap) */
  centeringOpportunity?: CenteringOpportunity | null;
  /** Called when user accepts suggested specs from target discovery */
  onAcceptSpecs?: (lsl: number, usl: number) => void;

  // --- Data Tab ---

  /** Render data table content */
  renderDataTable?: () => React.ReactNode;

  // --- What-If Tab ---

  /** Render What-If simulator content */
  renderWhatIf?: () => React.ReactNode;
}
