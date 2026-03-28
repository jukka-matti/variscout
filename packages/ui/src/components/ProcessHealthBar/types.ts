import type { StatsResult, SpecLimits } from '@variscout/core';
import type { FilterChipData } from '@variscout/hooks';

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
  /** Filter chip data from useVariationTracking */
  filterChipData: FilterChipData[];
  /** Column aliases for display labels */
  columnAliases?: Record<string, string>;
  /** Called when filter values are updated (multi-select) */
  onUpdateFilterValues: (factor: string, newValues: (string | number)[]) => void;
  /** Called when a filter is removed */
  onRemoveFilter: (factor: string) => void;
  /** Called when user clicks Clear All filters */
  onClearAll?: () => void;
  /** Final cumulative variation percentage (for variation bar display) */
  cumulativeVariationPct?: number | null;
  /** Optional click handler for VariationBar */
  onVariationBarClick?: () => void;
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
}
