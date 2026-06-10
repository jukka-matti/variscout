import type React from 'react';
import type { StatsResult, SpecLimits } from '@variscout/core';
import type { CpkTargetSource } from '@variscout/core/capability';
import type {
  ProcessProjection,
  CenteringOpportunity,
  SpecSuggestion,
} from '@variscout/core/variation';
import type { FilterChipData } from '../filterTypes';

export interface ProcessHealthBarProps {
  /** Current computed stats (null when no data loaded) */
  stats: StatsResult | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Cpk target for color coding (default 1.33) */
  cpkTarget?: number;
  /**
   * Which cascade level produced `cpkTarget`. When provided, ProcessHealthBar
   * renders a small caption ("per-spec" / "hub default" / etc) next to the
   * target so users can see why two columns at the same Cpk got different
   * colors. Omit to suppress the caption.
   */
  cpkTargetSource?: CpkTargetSource;
  /** Called when the user commits a new Cpk target via the inline editor. */
  onCpkTargetCommit?: (target: number) => void;
  /** Optional column label rendered next to the Cpk target — clarifies which characteristic the target applies to. */
  columnLabel?: string;
  /** Total sample count */
  sampleCount: number;
  /**
   * Pre-formatted date range over the lensed/filtered rows ("Apr 13 – Jun 5").
   * Computed by `useDataDateRange` in the consuming app. `null`/omitted when
   * there is no time column or no parseable timestamp — the segment is hidden.
   */
  dateRange?: string | null;
  /** Filter chip data for active filters */
  filterChipData: FilterChipData[];
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** Called when filter values are updated (multi-select) */
  onUpdateFilterValues: (factor: string, newValues: (string | number)[]) => void;
  /** Called when a filter is removed */
  onRemoveFilter: (factor: string) => void;
  /** Called when user clicks Clear All filters */
  onClearAll?: () => void;
  /** Optional callback to pin current filter state as a finding */
  onPinFinding?: () => void;
  /**
   * Current dashboard layout mode. KEPT for the grid/scroll toggle which
   * Task 4 (layout-machinery retirement) owns — ER-1 Task 2 does not touch it.
   */
  layout: 'grid' | 'scroll';
  /** Called when user changes layout. (See `layout` — Task 4 retires this.) */
  onLayoutChange: (layout: 'grid' | 'scroll') => void;
  /** Called when user clicks Export CSV (the Export menu's CSV item). */
  onExportCSV?: () => void;
  /**
   * Called when the user picks "Export .vrs" from the Export menu. PWA-only —
   * Azure omits it (settled disposition; no Azure .vrs UI). When absent the
   * .vrs menu item is not rendered.
   */
  onExportVrs?: () => void;
  /** Called when user clicks Set Specs */
  onSetSpecs?: () => void;
  /** Called when user clicks the Cpk stat to open capability editor */
  onCpkClick?: () => void;

  // --- ER-1: context-line right cluster ---

  /**
   * Relocated Subgroup lens (the app's `SubgroupConfigPopover`). Rendered in the
   * right cluster between the date/stats segment and the Time lens. App owns the
   * popover wiring; the strip only hosts the slot.
   */
  subgroupSlot?: React.ReactNode;

  /** Available stage columns (relocated from DashboardLayoutBase). Empty → no stage selects. */
  availableStageColumns?: string[];
  /** Currently selected stage column (null = no stages). */
  stageColumn?: string | null;
  /** Called when the stage column changes. */
  setStageColumn?: (c: string | null) => void;
  /** Stage ordering mode. */
  stageOrderMode?: 'auto' | 'data-order' | string;
  /** Called when the stage order mode changes (only relevant when a stage column is set). */
  onStageOrderModeChange?: (m: 'auto' | 'data-order') => void;

  /**
   * Active measure (outcome) label shown on the right-end chip. When provided
   * the chip renders with a dropdown menu carrying "Edit framing".
   */
  measureLabel?: string;
  /** Called when the user picks "Edit framing" from the measure-chip menu. */
  onEditFraming?: () => void;

  // --- Phase 2: Projection props (all optional for backward compat) ---

  /** Drill projection: "Cpk X → Y if fixed" */
  drillProjection?: ProcessProjection | null;
  /** Centering opportunity: "→ Cp X by centering" */
  centeringOpportunity?: CenteringOpportunity | null;
  /** Spec suggestion when no specs set */
  specSuggestion?: SpecSuggestion | null;
  /** Cumulative projection from multiple findings */
  cumulativeProjection?: ProcessProjection | null;
  /** The highest-priority projection to display */
  activeProjection?: ProcessProjection | null;
  /** Called when user accepts spec suggestion (pre-fills spec editor) */
  onAcceptSpecSuggestion?: (lsl: number, usl: number) => void;

  // --- IM-5: scope coverage bar (eda §3.3 reinterpreted, ADR-088 #4) ---

  /**
   * Descriptive coverage % (0–100) of the active drilled scope condition.
   * When provided, ProcessHealthBar renders the banded coverage bar
   * (blue<30 / amber30–50 / green>50). A prevalence count, not a variance share.
   */
  scopeCoverage?: number | null;
  /** What-If projected overall Cpk if the scope condition were fixed (text alongside the bar). */
  scopeWhatIfCpk?: number;
  /** Current overall Cpk (before the fix), for the "Cpk X → Y" What-If text. */
  scopeCurrentCpk?: number;

  // --- Capability mode props ---

  /** Whether capability mode (Cpk I-Chart) is active */
  isCapabilityMode?: boolean;
  /** Capability mode stats — subgroup target metrics */
  capabilityStats?: {
    subgroupsMeetingTarget: number;
    totalSubgroups: number;
  };

  /** Analysis mode */
  mode?: 'standard' | 'capability' | 'performance';
}
