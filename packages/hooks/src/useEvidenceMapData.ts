/**
 * useEvidenceMapData — computes all data needed by EvidenceMapBase from
 * statistical results and investigation state.
 *
 * Layer 1: Statistical graph (factor nodes, relationship edges, equation)
 * Layer 2: Investigation overlay (causal edges from analyst/CoScout links)
 * Layer 3: Synthesis overlay (convergence points from causal graph)
 *
 * Pure computation — all inputs via props, no context dependency.
 *
 * Returns types that are structurally compatible with the chart component
 * types in @variscout/charts (FactorNodeData, etc.). The hook lives in the
 * hooks package (which does not depend on charts), so these types are
 * defined locally and match the chart component interfaces exactly.
 */

import { useMemo } from 'react';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { MainEffectsResult, InteractionEffectsResult } from '@variscout/core/stats';
import { computeEvidenceMapLayout } from '@variscout/core/stats';
import type { EvidenceMapLayout, FactorNodeLayout } from '@variscout/core/stats';
import type { RelationshipType } from '@variscout/core/stats';
import { findConvergencePoints } from '@variscout/core/stats';
import type { ResolvedMode } from '@variscout/core/strategy';
import type { CausalLink, Question, Finding, SuspectedCause } from '@variscout/core/findings';

// ============================================================================
// Output types — structurally compatible with @variscout/charts EvidenceMap types.
// Defined here because @variscout/hooks must not depend on @variscout/charts.
// Keep in sync with: packages/charts/src/EvidenceMap/types.ts
// ============================================================================

/** Factor node with position, strength, and mode-aware labels. */
export interface FactorNodeData {
  factor: string;
  x: number;
  y: number;
  radius: number;
  rSquaredAdj: number;
  levelEffects: Array<{ level: string; effect: number }>;
  metricLabel: string;
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

/** Statistical relationship edge between two factor nodes. */
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

/** Central outcome node. */
export interface OutcomeNodeData {
  x: number;
  y: number;
  radius: number;
  label: string;
  mean: number;
}

/** Best regression equation data. */
export interface EquationData {
  factors: string[];
  rSquaredAdj: number;
  formula: string;
}

/** Directed causal edge from investigation (Layer 2). */
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

/** Convergence point — factor with 2+ incoming causal links (Layer 3). */
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
// Hook options and return types
// ============================================================================

export interface UseEvidenceMapDataOptions {
  /** Best subsets regression result (Layer 1 foundation) */
  bestSubsets: BestSubsetsResult | null;
  /** Main effects analysis result */
  mainEffects: MainEffectsResult | null;
  /** Interaction effects analysis result */
  interactions: InteractionEffectsResult | null;
  /** Container dimensions for layout computation */
  containerSize: { width: number; height: number };
  /** Analysis mode for metric labels */
  mode: ResolvedMode;
  /** Analyst-created causal links (Layer 2) */
  causalLinks?: CausalLink[];
  /** Investigation questions (Layer 2 evidence counts) */
  questions?: Question[];
  /** Findings (Layer 2 evidence counts) */
  findings?: Finding[];
  /** Suspected cause hubs (Layer 3 convergence enrichment) */
  suspectedCauses?: SuspectedCause[];
}

export interface UseEvidenceMapDataReturn {
  /** Layer 1: Central outcome node */
  outcomeNode: OutcomeNodeData | null;
  /** Layer 1: Factor nodes positioned radially */
  factorNodes: FactorNodeData[];
  /** Layer 1: Statistical relationship edges between factor pairs */
  relationshipEdges: RelationshipEdgeData[];
  /** Layer 1: Best regression equation */
  equation: EquationData | null;
  /** Layer 2: Directed causal edges from investigation */
  causalEdges: CausalEdgeData[];
  /** Layer 3: Convergence points (factors with 2+ incoming causal links) */
  convergencePoints: ConvergencePointData[];
  /** Highest active layer (1 = stats only, 2 = + investigation, 3 = + synthesis) */
  activeLayer: 1 | 2 | 3;
  /** Whether the map has no data to render */
  isEmpty: boolean;
  /** Factors with at least one answered or ruled-out question */
  exploredFactors: Set<string>;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Build mode-aware metric label for a factor node.
 *
 * TODO: Extend with mode-specific metrics when data is available:
 * - capability: "R²adj=0.34, Cpk +0.4" (needs Cpk impact per factor)
 * - performance: "R²adj=0.34, 3 channels" (needs channel count per factor)
 * - yamazumi: "Waste 28%, +45s" (needs waste contribution per factor)
 * Currently R²adj is shown for all modes as a universal metric.
 */
function buildMetricLabel(rSquaredAdj: number, _mode: ResolvedMode): string {
  return `R\u00B2adj=${rSquaredAdj.toFixed(2)}`;
}

/** Build the strongest level effect as +/- value string. */
function buildEffectLabel(levelEffects: Array<{ level: string; effect: number }>): string {
  if (levelEffects.length === 0) return '';

  // levelEffects are already sorted by absolute effect descending
  const strongest = levelEffects[0];
  const sign = strongest.effect >= 0 ? '+' : '';
  return `${sign}${strongest.effect.toFixed(1)}`;
}

/**
 * Map a FactorNodeLayout (from the layout engine) to FactorNodeData
 * (for the chart component).
 */
function mapFactorNode(node: FactorNodeLayout, mode: ResolvedMode): FactorNodeData {
  return {
    factor: node.factor,
    x: node.x,
    y: node.y,
    radius: node.radius,
    rSquaredAdj: node.rSquaredAdj,
    levelEffects: node.levelEffects,
    metricLabel: buildMetricLabel(node.rSquaredAdj, mode),
    effectLabel: buildEffectLabel(node.levelEffects),
    factorType: node.factorType,
    trendGlyph: node.trendGlyph,
  };
}

/**
 * Map a CausalLink to CausalEdgeData, enriched with position data
 * from the layout and evidence counts from questions/findings.
 */
function mapCausalEdge(
  link: CausalLink,
  nodePositions: Map<string, { x: number; y: number }>,
  questions: Question[],
  findings: Finding[]
): CausalEdgeData | null {
  const fromPos = nodePositions.get(link.fromFactor);
  const toPos = nodePositions.get(link.toFactor);

  // Skip links that reference factors not in the current layout
  if (!fromPos || !toPos) return null;

  // Count questions and findings linked to this causal link
  const linkedQuestionIds = new Set(link.questionIds);
  const linkedFindingIds = new Set(link.findingIds);
  const questionCount = questions.filter(q => linkedQuestionIds.has(q.id)).length;
  const findingCount = findings.filter(f => linkedFindingIds.has(f.id)).length;

  return {
    id: link.id,
    fromFactor: link.fromFactor,
    toFactor: link.toFactor,
    fromLevel: link.fromLevel,
    toLevel: link.toLevel,
    whyStatement: link.whyStatement,
    direction: link.direction,
    evidenceType: link.evidenceType,
    questionCount,
    findingCount,
    fromX: fromPos.x,
    fromY: fromPos.y,
    toX: toPos.x,
    toY: toPos.y,
  };
}

/**
 * Map convergence points (from the causal graph) to ConvergencePointData,
 * enriched with suspected cause hub data.
 */
function mapConvergencePoint(
  cp: { factor: string; incomingLinks: CausalLink[] },
  nodePositions: Map<string, { x: number; y: number }>,
  suspectedCauses: SuspectedCause[]
): ConvergencePointData | null {
  const pos = nodePositions.get(cp.factor);
  if (!pos) return null;

  // Find a suspected cause hub that references this factor
  // A hub is linked if any of its connected question/finding IDs
  // appear in the incoming links' question/finding IDs
  const incomingQuestionIds = new Set(cp.incomingLinks.flatMap(l => l.questionIds));
  const incomingFindingIds = new Set(cp.incomingLinks.flatMap(l => l.findingIds));
  const incomingHubIds = new Set(
    cp.incomingLinks.map(l => l.hubId).filter((id): id is string => id !== undefined)
  );

  const matchingHub = suspectedCauses.find(
    sc =>
      incomingHubIds.has(sc.id) ||
      sc.questionIds.some(qId => incomingQuestionIds.has(qId)) ||
      sc.findingIds.some(fId => incomingFindingIds.has(fId))
  );

  return {
    factor: cp.factor,
    x: pos.x,
    y: pos.y,
    incomingCount: cp.incomingLinks.length,
    hubName: matchingHub?.name,
    hubStatus: matchingHub?.status,
    projectedImprovement: matchingHub?.evidence
      ? `${matchingHub.evidence.contribution.description}`
      : undefined,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useEvidenceMapData(options: UseEvidenceMapDataOptions): UseEvidenceMapDataReturn {
  const {
    bestSubsets,
    mainEffects,
    interactions,
    containerSize,
    mode,
    causalLinks = [],
    questions = [],
    findings = [],
    suspectedCauses = [],
  } = options;

  return useMemo(() => {
    // Empty state: no best subsets result
    if (!bestSubsets || containerSize.width === 0 || containerSize.height === 0) {
      return {
        outcomeNode: null,
        factorNodes: [],
        relationshipEdges: [],
        equation: null,
        causalEdges: [],
        convergencePoints: [],
        activeLayer: 1 as const,
        isEmpty: true,
        exploredFactors: new Set(),
      };
    }

    // ---- Layer 1: Statistical layout ----
    const layout: EvidenceMapLayout = computeEvidenceMapLayout(
      bestSubsets,
      mainEffects,
      interactions,
      containerSize
    );

    const outcomeNode: OutcomeNodeData = layout.outcomeNode;
    const factorNodes: FactorNodeData[] = layout.factorNodes.map(n => mapFactorNode(n, mode));
    const relationshipEdges: RelationshipEdgeData[] = layout.relationshipEdges.map(e => ({
      factorA: e.factorA,
      factorB: e.factorB,
      type: e.type,
      strength: e.strength,
      ax: e.ax,
      ay: e.ay,
      bx: e.bx,
      by: e.by,
    }));

    // Build equation with mode-aware formatting
    let equation: EquationData | null = null;
    if (layout.equation) {
      equation = {
        factors: layout.equation.factors,
        rSquaredAdj: layout.equation.rSquaredAdj,
        formula: layout.equation.formula,
      };
    }

    // Build node position lookup for Layer 2/3 mapping
    const nodePositions = new Map<string, { x: number; y: number }>();
    for (const node of layout.factorNodes) {
      nodePositions.set(node.factor, { x: node.x, y: node.y });
    }

    // ---- Layer 2: Investigation causal edges ----
    const causalEdges: CausalEdgeData[] = causalLinks
      .map(link => mapCausalEdge(link, nodePositions, questions, findings))
      .filter((edge): edge is CausalEdgeData => edge !== null);

    // ---- Layer 3: Convergence points ----
    const convergenceRaw = findConvergencePoints(causalLinks);
    const convergencePoints: ConvergencePointData[] = convergenceRaw
      .map(cp => mapConvergencePoint(cp, nodePositions, suspectedCauses))
      .filter((cp): cp is ConvergencePointData => cp !== null);

    // Determine active layer
    let activeLayer: 1 | 2 | 3 = 1;
    if (causalEdges.length > 0) activeLayer = 2;
    if (convergencePoints.length > 0) activeLayer = 3;

    // Compute explored factors: factors with at least one answered or ruled-out question
    const exploredFactors = new Set<string>();
    for (const q of questions) {
      if (q.factor && (q.status === 'answered' || q.causeRole === 'ruled-out')) {
        exploredFactors.add(q.factor);
      }
    }

    return {
      outcomeNode,
      factorNodes,
      relationshipEdges,
      equation,
      causalEdges,
      convergencePoints,
      activeLayer,
      isEmpty: factorNodes.length === 0,
      exploredFactors,
    };
  }, [
    bestSubsets,
    mainEffects,
    interactions,
    containerSize,
    mode,
    causalLinks,
    questions,
    findings,
    suspectedCauses,
  ]);
}
