/**
 * Canonical Evidence Map types for @variscout/core
 *
 * This module is the SINGLE SOURCE OF TRUTH for Evidence Map data types
 * used across packages (hooks, charts, ui).
 *
 * Previously these types were duplicated in:
 * - packages/charts/src/EvidenceMap/types.ts
 * - packages/hooks/src/useEvidenceMapData.ts
 *
 * All consumers should import from '@variscout/core/evidenceMap'.
 *
 * NOTE: Component props interfaces (e.g., EvidenceMapBaseProps) remain
 * in @variscout/charts where they belong.
 */

import type { RelationshipType } from '../stats/causalGraph';
export type { RelationshipType };

// ============================================================================
// Layer 1: Statistical data (computed by useEvidenceMapData hook)
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
  /** Strongest level effect as +/-value string (e.g., "+12.3g") */
  effectLabel: string;
  /** Factor type classification (undefined for categorical-only data) */
  factorType?: 'continuous' | 'categorical';
  /**
   * Trend glyph for continuous factors:
   *   '/'  - positive linear slope
   *   '\\' - negative linear slope
   *   '∩'  - quadratic peak (sweet spot maximum)
   *   '∪'  - quadratic valley (sweet spot minimum)
   *   null - categorical
   */
  trendGlyph?: '/' | '\\' | '∩' | '∪' | null;
  /** Optimal input value for quadratic factors (vertex x-coordinate) */
  optimum?: number;
  /** Whether the analyst has explored this factor (answered/ruled-out questions). undefined = pre-investigation */
  explored?: boolean;
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
