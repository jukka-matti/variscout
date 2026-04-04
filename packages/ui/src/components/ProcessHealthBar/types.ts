import type { StatsResult, SpecLimits } from '@variscout/core';
import type {
  ProcessProjection,
  CenteringOpportunity,
  SpecSuggestion,
} from '@variscout/core/variation';
import type { FilterChipData } from '../filterTypes';

/** Lean stats for yamazumi mode display in ProcessHealthBar */
export interface LeanHealthStats {
  /** Current cycle time in seconds */
  cycleTime: number;
  /** Value-adding ratio (0-1) */
  vaRatio: number;
  /** Takt time in seconds (optional) */
  taktTime?: number;
}

/** Lean projection for yamazumi mode display in ProcessHealthBar */
export interface LeanHealthProjection {
  /** Current cycle time in seconds */
  currentCT: number;
  /** Projected cycle time in seconds */
  projectedCT: number;
  /** Whether projected CT meets takt time */
  meetsTakt: boolean;
  /** Projection label (e.g. "if waste eliminated") */
  label: string;
}

export interface ProcessHealthBarProps {
  /** Current computed stats (null when no data loaded) */
  stats: StatsResult | null;
  /** Specification limits */
  specs: SpecLimits;
  /** Cpk target for color coding (default 1.33) */
  cpkTarget?: number;
  /** Called when user changes the Cpk target */
  onCpkTargetChange?: (target: number) => void;
  /** Total sample count */
  sampleCount: number;
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
  /** Current dashboard layout mode */
  layout: 'grid' | 'scroll';
  /** Called when user changes layout */
  onLayoutChange: (layout: 'grid' | 'scroll') => void;
  /** Number of active factors */
  factorCount: number;
  /** Called when user clicks the Factors button to manage factors */
  onManageFactors?: () => void;
  /** Called when user clicks Export CSV */
  onExportCSV?: () => void;
  /** Called when user enters presentation mode */
  onEnterPresentationMode?: () => void;
  /** Called when user clicks Set Specs */
  onSetSpecs?: () => void;
  /** Called when user clicks the Cpk stat to open capability editor */
  onCpkClick?: () => void;

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

  // --- Capability mode props ---

  /** Whether capability mode (Cpk I-Chart) is active */
  isCapabilityMode?: boolean;
  /** Capability mode stats — subgroup target metrics */
  capabilityStats?: {
    subgroupsMeetingTarget: number;
    totalSubgroups: number;
  };

  // --- Lean mode props (yamazumi) ---

  /** Analysis mode — 'yamazumi' triggers lean display */
  mode?: 'standard' | 'capability' | 'yamazumi' | 'performance';
  /** Lean stats for yamazumi mode (cycle time, VA ratio, takt) */
  leanStats?: LeanHealthStats;
  /** Lean projection for yamazumi mode (CT → projected CT) */
  leanProjection?: LeanHealthProjection;
}
