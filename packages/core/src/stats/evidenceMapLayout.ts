/**
 * Evidence Map layout — deterministic radial positioning for factor nodes.
 *
 * Computes a spatial layout for the Evidence Map visualization where:
 * - The outcome variable sits at the center
 * - Factor nodes are positioned radially, with distance inversely
 *   proportional to their R²adj (stronger factors closer to center)
 * - Relationship edges connect factor pairs with classified types
 * - The best regression equation is extracted for display
 *
 * All layout computation is pure and deterministic — same inputs always
 * produce the same output. No randomness or force simulation.
 */

import type { BestSubsetsResult, BestSubsetResult } from './bestSubsets';
import type { MainEffectsResult } from './factorEffects';
import type { InteractionEffectsResult } from './factorEffects';
import { classifyRelationship } from './causalGraph';
import type { RelationshipType } from './causalGraph';

// ============================================================================
// Types
// ============================================================================

/** Layout position and metadata for one factor node. */
export interface FactorNodeLayout {
  /** Factor name */
  factor: string;
  /** X position in container coordinates */
  x: number;
  /** Y position in container coordinates */
  y: number;
  /** Node circle radius (proportional to R²adj, range 12-32px) */
  radius: number;
  /** Distance from center node */
  distance: number;
  /** Angular position in radians (0 = top/12 o'clock) */
  angle: number;
  /** Single-factor R²adj for this factor */
  rSquaredAdj: number;
  /** Level effects: which levels move the outcome and by how much */
  levelEffects: Array<{ level: string; effect: number }>;
}

/** Layout position and metadata for one relationship edge. */
export interface RelationshipEdgeLayout {
  /** First factor name */
  factorA: string;
  /** Second factor name */
  factorB: string;
  /** Classified relationship type */
  type: RelationshipType;
  /** Relationship strength (deltaR², overlap magnitude, etc.) */
  strength: number;
  /** X position of factor A endpoint */
  ax: number;
  /** Y position of factor A endpoint */
  ay: number;
  /** X position of factor B endpoint */
  bx: number;
  /** Y position of factor B endpoint */
  by: number;
}

/** Complete Evidence Map layout ready for rendering. */
export interface EvidenceMapLayout {
  /** Central outcome node */
  outcomeNode: {
    x: number;
    y: number;
    radius: number;
    label: string;
    mean: number;
  };
  /** Radially positioned factor nodes */
  factorNodes: FactorNodeLayout[];
  /** Relationship edges between factor pairs */
  relationshipEdges: RelationshipEdgeLayout[];
  /** Best regression equation for display */
  equation: {
    factors: string[];
    rSquaredAdj: number;
    formula: string;
  } | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum node radius in pixels */
const MIN_NODE_RADIUS = 12;

/** Maximum node radius in pixels */
const MAX_NODE_RADIUS = 32;

/** Outcome node radius in pixels */
const OUTCOME_NODE_RADIUS = 36;

/** Maximum radial distance as fraction of half the smaller container dimension */
const MAX_DISTANCE_FRACTION = 0.35;

/** Minimum radial distance as fraction of max distance (prevents center overlap) */
const MIN_DISTANCE_FRACTION = 0.3;

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Find the single-factor subset for a given factor name.
 * Returns the BestSubsetResult with factorCount === 1 matching the factor.
 */
function findSingleFactorSubset(
  subsets: BestSubsetResult[],
  factor: string
): BestSubsetResult | undefined {
  return subsets.find(s => s.factorCount === 1 && s.factors[0] === factor);
}

/**
 * Find the two-factor subset containing both factorA and factorB.
 */
function findPairSubset(
  subsets: BestSubsetResult[],
  factorA: string,
  factorB: string
): BestSubsetResult | undefined {
  return subsets.find(
    s => s.factorCount === 2 && s.factors.includes(factorA) && s.factors.includes(factorB)
  );
}

/**
 * Extract level effects from a BestSubsetResult's levelEffects Map
 * for a specific factor, converting to a sorted array.
 */
function extractLevelEffects(
  subset: BestSubsetResult | undefined,
  factor: string
): Array<{ level: string; effect: number }> {
  if (!subset) return [];

  const effectMap = subset.levelEffects.get(factor);
  if (!effectMap) return [];

  const effects: Array<{ level: string; effect: number }> = [];
  for (const [level, effect] of effectMap.entries()) {
    effects.push({ level, effect });
  }

  // Sort by absolute effect descending (strongest effect first)
  effects.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
  return effects;
}

/**
 * Find the interaction delta R² for a factor pair from the interactions result.
 */
function findInteractionDeltaR2(
  interactions: InteractionEffectsResult | null,
  factorA: string,
  factorB: string
): number | undefined {
  if (!interactions) return undefined;

  const match = interactions.interactions.find(
    i =>
      (i.factorA === factorA && i.factorB === factorB) ||
      (i.factorA === factorB && i.factorB === factorA)
  );

  return match?.deltaRSquared;
}

/**
 * Build the equation formula string from the best model.
 *
 * Format: "y-hat = 87.2 + 12.3(Supplier A) + 6.1(Head 1-4)"
 * For each factor in the model, picks the level with the largest absolute effect.
 */
function buildEquationFormula(bestModel: BestSubsetResult, grandMean: number): string {
  const parts: string[] = [`\u0177 = ${grandMean.toFixed(1)}`];

  for (const factor of bestModel.factors) {
    const effectMap = bestModel.levelEffects.get(factor);
    if (!effectMap || effectMap.size === 0) continue;

    // Find the level with the largest absolute effect
    let bestLevel = '';
    let bestEffect = 0;

    for (const [level, effect] of effectMap.entries()) {
      if (Math.abs(effect) > Math.abs(bestEffect)) {
        bestLevel = level;
        bestEffect = effect;
      }
    }

    if (bestLevel) {
      const sign = bestEffect >= 0 ? '+' : '-';
      parts.push(`${sign} ${Math.abs(bestEffect).toFixed(1)}(${bestLevel})`);
    }
  }

  return parts.join(' ');
}

// ============================================================================
// Main layout function
// ============================================================================

/**
 * Compute the complete Evidence Map layout from best subsets analysis results.
 *
 * Positions factor nodes radially around the central outcome node, with
 * distance inversely proportional to R²adj (stronger factors closer).
 * Classifies relationship edges between all factor pairs.
 *
 * @param bestSubsets - Complete best subsets analysis result
 * @param mainEffects - Main effects result (optional, for enrichment)
 * @param interactions - Interaction effects result (optional, for edge classification)
 * @param containerSize - Container dimensions in pixels
 * @returns Complete layout ready for rendering
 *
 * @example
 * const layout = computeEvidenceMapLayout(
 *   bestSubsets,
 *   mainEffects,
 *   interactions,
 *   { width: 800, height: 600 }
 * );
 * // layout.factorNodes[0] → { factor: 'Supplier', x: 400, y: 180, ... }
 */
export function computeEvidenceMapLayout(
  bestSubsets: BestSubsetsResult,
  mainEffects: MainEffectsResult | null,
  interactions: InteractionEffectsResult | null,
  containerSize: { width: number; height: number }
): EvidenceMapLayout {
  const { width, height } = containerSize;
  const centerX = width / 2;
  const centerY = height / 2;

  // --- Outcome node at center ---
  const outcomeNode = {
    x: centerX,
    y: centerY,
    radius: OUTCOME_NODE_RADIUS,
    label: 'Outcome',
    mean: bestSubsets.grandMean,
  };

  // --- Factor nodes ---
  const factorNames = bestSubsets.factorNames;
  const factorCount = factorNames.length;

  if (factorCount === 0) {
    return {
      outcomeNode,
      factorNodes: [],
      relationshipEdges: [],
      equation: null,
    };
  }

  // Get single-factor R²adj for each factor and sort by R²adj descending
  const factorsWithR2: Array<{
    factor: string;
    rAdjSingle: number;
    subset: BestSubsetResult | undefined;
  }> = [];

  for (const factor of factorNames) {
    const subset = findSingleFactorSubset(bestSubsets.subsets, factor);
    const rAdj = subset ? Math.max(0, subset.rSquaredAdj) : 0;
    factorsWithR2.push({ factor, rAdjSingle: rAdj, subset });
  }

  // Sort by R²adj descending (strongest factor gets position 0)
  factorsWithR2.sort((a, b) => b.rAdjSingle - a.rAdjSingle);

  // Compute max distance based on container size
  const halfMin = Math.min(width, height) / 2;
  const maxDistance = halfMin * MAX_DISTANCE_FRACTION;
  const minDistance = maxDistance * MIN_DISTANCE_FRACTION;

  // Find the max R²adj for normalization
  const maxR2 = factorsWithR2.length > 0 ? factorsWithR2[0].rAdjSingle : 0;

  const factorNodes: FactorNodeLayout[] = factorsWithR2.map(
    ({ factor, rAdjSingle, subset }, index) => {
      // Angle: evenly distributed starting from 12 o'clock (-pi/2), clockwise
      const angleStep = (2 * Math.PI) / factorCount;
      const angle = -Math.PI / 2 + index * angleStep;

      // Distance: inversely proportional to R²adj
      // Strongest factor (highest R²adj) gets closest to center
      let distance: number;
      if (maxR2 > 0) {
        // Normalize R²adj to [0, 1] range relative to max
        const normalizedR2 = rAdjSingle / maxR2;
        distance = minDistance + (maxDistance - minDistance) * (1 - normalizedR2);
      } else {
        // All factors have R²adj = 0, place at max distance
        distance = maxDistance;
      }

      // Node radius proportional to R²adj
      const radius = MIN_NODE_RADIUS + rAdjSingle * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);

      // Convert polar to Cartesian
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      // Extract level effects
      const levelEffects = extractLevelEffects(subset, factor);

      return {
        factor,
        x,
        y,
        radius,
        distance,
        angle,
        rSquaredAdj: rAdjSingle,
        levelEffects,
      };
    }
  );

  // --- Relationship edges ---
  const relationshipEdges: RelationshipEdgeLayout[] = [];

  // Build a lookup for fast node position access
  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodeR2 = new Map<string, number>();
  for (const node of factorNodes) {
    nodePositions.set(node.factor, { x: node.x, y: node.y });
    nodeR2.set(node.factor, node.rSquaredAdj);
  }

  // Iterate over all factor pairs
  for (let i = 0; i < factorNodes.length; i++) {
    for (let j = i + 1; j < factorNodes.length; j++) {
      const factorA = factorNodes[i].factor;
      const factorB = factorNodes[j].factor;

      const rAdjA = nodeR2.get(factorA) ?? 0;
      const rAdjB = nodeR2.get(factorB) ?? 0;

      // Find the combined model R²adj
      const pairSubset = findPairSubset(bestSubsets.subsets, factorA, factorB);
      if (!pairSubset) continue;

      const rAdjAB = Math.max(0, pairSubset.rSquaredAdj);

      // Check for interaction delta R²
      const deltaR2 = findInteractionDeltaR2(interactions, factorA, factorB);

      // Classify the relationship
      const type = classifyRelationship(rAdjA, rAdjB, rAdjAB, deltaR2);

      // Compute strength metric based on type
      let strength: number;
      switch (type) {
        case 'interactive':
          strength = deltaR2 ?? 0;
          break;
        case 'synergistic':
          strength = rAdjAB - (rAdjA + rAdjB);
          break;
        case 'redundant':
          strength = Math.min(rAdjA, rAdjB);
          break;
        case 'overlapping':
          strength = rAdjA + rAdjB - rAdjAB;
          break;
        case 'independent':
        default:
          strength = 0;
          break;
      }

      const posA = nodePositions.get(factorA)!;
      const posB = nodePositions.get(factorB)!;

      relationshipEdges.push({
        factorA,
        factorB,
        type,
        strength: Math.abs(strength),
        ax: posA.x,
        ay: posA.y,
        bx: posB.x,
        by: posB.y,
      });
    }
  }

  // --- Equation ---
  let equation: EvidenceMapLayout['equation'] = null;

  if (bestSubsets.subsets.length > 0) {
    const bestModel = bestSubsets.subsets[0];
    equation = {
      factors: bestModel.factors,
      rSquaredAdj: bestModel.rSquaredAdj,
      formula: buildEquationFormula(bestModel, bestSubsets.grandMean),
    };
  }

  return {
    outcomeNode,
    factorNodes,
    relationshipEdges,
    equation,
  };
}
