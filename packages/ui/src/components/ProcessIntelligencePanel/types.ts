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

export type PITab = 'stats' | 'questions' | 'journal' | 'docs';
export type PIOverflowView = 'data' | 'whatif' | null;

/** Config-driven tab definition for PIPanelBase tabs prop */
export interface PITabConfig {
  id: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

/** Config-driven overflow item definition for PIPanelBase overflowItems prop */
export interface PIOverflowItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface PIPanelBaseProps {
  stats: StatsResult | null;
  specs: SpecLimits;
  filteredData?: DataRow[];
  outcome?: string | null;
  defaultTab?: PITab;
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

  // --- Data Tab (overflow) ---

  /** Render data table content (accessed via overflow menu) */
  renderDataTable?: () => React.ReactNode;

  // --- What-If Tab (overflow) ---

  /** Render What-If simulator content (accessed via overflow menu) */
  renderWhatIf?: () => React.ReactNode;

  // --- Questions Tab ---

  /** Render Questions tab content */
  renderQuestionsTab?: () => React.ReactNode;
  /** Badge count for open questions on the Questions tab */
  openQuestionCount?: number;

  // --- Journal Tab ---

  /** Render Journal tab content */
  renderJournalTab?: () => React.ReactNode;

  // --- Docs Tab (Team tier only) ---

  /** When true, shows the Docs tab (Team tier feature) */
  showDocsTab?: boolean;
  /** Render Docs tab content */
  renderDocsTab?: () => React.ReactNode;
  /** Badge count for documents on the Docs tab */
  docsCount?: number;

  // --- Overflow menu ---

  /** Active overflow view (data or whatif), controlled by parent */
  overflowView?: PIOverflowView;
  /** Called when the overflow view changes */
  onOverflowViewChange?: (view: PIOverflowView) => void;

  // --- Config-driven tab API (preferred over render props for new consumers) ---

  /**
   * When provided, replaces the static Stats/Questions/Journal/Docs tab bar with
   * a dynamic tab bar driven by this array. Old render props are ignored.
   */
  tabs?: PITabConfig[];

  /**
   * When provided alongside `tabs`, replaces the built-in overflow menu items
   * (Data Table / What-If) with these items.
   */
  overflowItems?: PIOverflowItem[];
}
