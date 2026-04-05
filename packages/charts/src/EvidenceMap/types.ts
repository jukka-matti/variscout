/**
 * Evidence Map types — props interfaces for the layered visualization
 */

import type { RelationshipType } from '@variscout/core/stats';
export type { RelationshipType };

// ============================================================================
// Layout data (computed by useEvidenceMapData hook)
// ============================================================================

export interface FactorNodeData {
  factor: string;
  x: number;
  y: number;
  radius: number;
  rSquaredAdj: number;
  levelEffects: Array<{ level: string; effect: number }>;
  /** Mode-aware metric label (e.g., "R²adj=0.34" or "Cpk +0.4") */
  metricLabel: string;
  /** Strongest level effect as ±value string (e.g., "+12.3g") */
  effectLabel: string;
  /** Factor type classification (undefined for categorical-only data) */
  factorType?: 'continuous' | 'categorical';
  /**
   * Trend glyph for continuous factors:
   *   '/'  → positive linear slope
   *   '\\' → negative linear slope
   *   '∩'  → quadratic peak (sweet spot maximum)
   *   '∪'  → quadratic valley (sweet spot minimum)
   *   null → categorical
   */
  trendGlyph?: '/' | '\\' | '∩' | '∪' | null;
}

export interface RelationshipEdgeData {
  factorA: string;
  factorB: string;
  type: RelationshipType;
  strength: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface OutcomeNodeData {
  x: number;
  y: number;
  radius: number;
  label: string;
  mean: number;
}

export interface EquationData {
  factors: string[];
  rSquaredAdj: number;
  formula: string;
}

// ============================================================================
// Layer 2: Investigation data
// ============================================================================

export interface CausalEdgeData {
  id: string;
  fromFactor: string;
  toFactor: string;
  fromLevel?: string;
  toLevel?: string;
  whyStatement: string;
  direction: 'drives' | 'modulates' | 'confounds';
  evidenceType: 'data' | 'gemba' | 'expert' | 'unvalidated';
  questionCount: number;
  findingCount: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

// ============================================================================
// Layer 3: Synthesis data
// ============================================================================

export interface ConvergencePointData {
  factor: string;
  x: number;
  y: number;
  incomingCount: number;
  hubName?: string;
  hubStatus?: 'suspected' | 'confirmed' | 'not-confirmed';
  projectedImprovement?: string;
}

// ============================================================================
// Component props
// ============================================================================

export interface EvidenceMapBaseProps {
  parentWidth: number;
  parentHeight: number;

  // Layer 1: Statistical (always present)
  outcomeNode: OutcomeNodeData | null;
  factorNodes: FactorNodeData[];
  relationshipEdges: RelationshipEdgeData[];
  equation: EquationData | null;

  // Layer 2: Investigation (Azure only, optional)
  causalEdges?: CausalEdgeData[];

  // Layer 3: Synthesis (Azure only, optional)
  convergencePoints?: ConvergencePointData[];

  // Interaction callbacks
  onFactorClick?: (factor: string) => void;
  onFactorHover?: (factor: string | null) => void;
  onEdgeClick?: (factorA: string, factorB: string) => void;
  onCausalEdgeClick?: (id: string) => void;
  onConvergenceClick?: (factor: string) => void;

  // Visual state
  highlightedFactor?: string | null;
  highlightedEdge?: string | null;
  showEquation?: boolean;

  // Mobile interactions
  enableZoom?: boolean;
  onNodeTap?: (factor: string) => void;
  onEdgeTap?: (factorA: string, factorB: string) => void;

  // Display
  isDark?: boolean;
  compact?: boolean;
}
