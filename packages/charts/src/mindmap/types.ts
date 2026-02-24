/**
 * Data for a single category value within a factor popover
 */
export interface CategoryData {
  value: string | number;
  count: number;
  meanValue: number;
  contributionPct: number;
}

/**
 * A factor node in the investigation mindmap
 */
export interface MindmapNode {
  /** Factor/column name */
  factor: string;
  /** Display name (alias) — falls back to factor if not set */
  displayName?: string;
  /** Max category Total SS contribution (0–1), drives node size and display % */
  maxContribution: number;
  /** Node state: active = drilled, available = can drill, exhausted = too few rows */
  state: 'active' | 'available' | 'exhausted';
  /** Value shown below label when active (already filtered) */
  filteredValue?: string;
  /** Whether this is the suggested next drill target */
  isSuggested: boolean;
  /** Category breakdown for click-to-filter popover */
  categoryData?: CategoryData[];
}

/**
 * An interaction edge between two factor nodes
 */
export interface MindmapEdge {
  factorA: string;
  factorB: string;
  deltaRSquared: number;
  pValue: number;
  standardizedBeta: number;
}

/**
 * Mindmap display mode
 */
export type MindmapMode = 'drilldown' | 'interactions' | 'narrative';

/**
 * Data for a single step in the narrative timeline
 */
export interface NarrativeStep {
  factor: string;
  values: (string | number)[];
  /** Scope fraction: selected categories' Total SS as fraction of current level (0–1) */
  scopeFraction: number;
  /** Running product of all scope fractions up to this step (0–1) */
  cumulativeScope: number;
  meanBefore: number;
  meanAfter: number;
  cpkBefore: number | undefined;
  cpkAfter: number | undefined;
  countBefore: number;
  countAfter: number;
  /** User-entered annotation for this step (session-only) */
  annotation?: string;
}

export interface InvestigationMindmapProps {
  /** Factor nodes to display */
  nodes: MindmapNode[];
  /** Factor names in drill order (the trail connecting active nodes) */
  drillTrail: string[];
  /** Cumulative variation % isolated so far (0–100) */
  cumulativeVariationPct: number | null;
  /** Target variation % for the progress bar (default 70) */
  targetPct?: number;
  /** Called when a node is clicked */
  onNodeClick?: (factor: string) => void;
  /** Called when a category value is selected from the popover */
  onCategorySelect?: (factor: string, value: string | number) => void;
  /** Display mode: 'drilldown' shows trail, 'interactions' shows edges */
  mode?: MindmapMode;
  /** Interaction edges (rendered in 'interactions' mode) */
  edges?: MindmapEdge[];
  /** Called when an interaction edge is clicked */
  onEdgeClick?: (factorA: string, factorB: string) => void;
  /** Drill step data for narrative mode annotations */
  narrativeSteps?: NarrativeStep[];
  /** Called when user edits an annotation (narrative mode) */
  onAnnotationChange?: (stepIndex: number, text: string) => void;
  /** Container width from withParentSize */
  parentWidth?: number;
  /** Container height from withParentSize */
  parentHeight?: number;
  /** Explicit width (overrides parentWidth) */
  width?: number;
  /** Explicit height (overrides parentHeight) */
  height?: number;
  /** Column aliases for display (used on edge labels) */
  columnAliases?: Record<string, string>;
  /** Optional callback to navigate to What-If Simulator from narrative conclusion */
  onNavigateToWhatIf?: () => void;
  /** Optional callback to navigate to Regression with investigated factors */
  onNavigateToRegression?: (factors: string[]) => void;
  /** Optional callback to model an interaction pair in Regression */
  onModelInteraction?: (factors: string[]) => void;
}
