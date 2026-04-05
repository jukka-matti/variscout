/**
 * Causal graph utilities for the Evidence Map DAG.
 *
 * Pure graph functions for building and querying the factor relationship
 * graph used by the Evidence Map visualization. Max scale: 10 factors, 45 edges.
 *
 * Relationships are classified by comparing single-factor and combined R²adj
 * from the best subsets regression engine.
 */

import type { CausalLink } from '../findings/types';

// ============================================================================
// Types
// ============================================================================

/** Classification of the statistical relationship between two factors. */
export type RelationshipType =
  | 'independent'
  | 'overlapping'
  | 'synergistic'
  | 'interactive'
  | 'redundant';

// ============================================================================
// Relationship classification
// ============================================================================

/**
 * Classify the statistical relationship between two factors based on
 * their individual and combined R²adj values.
 *
 * Uses the additive decomposition principle: if two factors are truly
 * independent, their combined R²adj should approximate the sum of their
 * individual R²adj values (within a threshold).
 *
 * @param rAdjA - R²adj for factor A alone
 * @param rAdjB - R²adj for factor B alone
 * @param rAdjAB - R²adj for factors A and B combined
 * @param deltaR2 - Interaction delta R² (from interaction effects analysis), or undefined
 * @param threshold - Classification tolerance (default 0.02)
 * @returns The classified relationship type
 *
 * @example
 * // Independent factors: combined ~ sum of individual
 * classifyRelationship(0.30, 0.20, 0.49) // 'independent'
 *
 * // Synergistic: combined > sum (factors amplify each other)
 * classifyRelationship(0.20, 0.15, 0.45) // 'synergistic'
 *
 * // Redundant: B adds nothing beyond A
 * classifyRelationship(0.40, 0.10, 0.41) // 'redundant'
 */
export function classifyRelationship(
  rAdjA: number,
  rAdjB: number,
  rAdjAB: number,
  deltaR2?: number,
  threshold: number = 0.02
): RelationshipType {
  // Interactive: significant interaction effect detected
  if (deltaR2 !== undefined && deltaR2 > threshold) {
    return 'interactive';
  }

  const sum = rAdjA + rAdjB;

  // Independent: combined ≈ sum of individual
  if (Math.abs(rAdjAB - sum) <= threshold) {
    return 'independent';
  }

  // Synergistic: combined > sum + threshold (factors amplify each other)
  if (rAdjAB > sum + threshold) {
    return 'synergistic';
  }

  // Redundant: B adds nothing beyond A (combined ≤ A alone + threshold)
  if (rAdjAB <= rAdjA + threshold) {
    return 'redundant';
  }

  // Overlapping: combined < sum but B still adds something
  return 'overlapping';
}

// ============================================================================
// Cycle detection
// ============================================================================

/**
 * Check whether adding an edge from `fromFactor` to `toFactor` would
 * create a cycle in the existing DAG.
 *
 * Uses depth-first search from `toFactor` through existing links to
 * determine if `fromFactor` is reachable. If it is, adding the proposed
 * edge would close a cycle.
 *
 * @param links - Existing causal links in the graph
 * @param fromFactor - Proposed source factor
 * @param toFactor - Proposed target factor
 * @returns True if adding the edge would create a cycle
 */
export function wouldCreateCycle(
  links: CausalLink[],
  fromFactor: string,
  toFactor: string
): boolean {
  // Self-loop is always a cycle
  if (fromFactor === toFactor) return true;

  // Build adjacency list: factor -> list of downstream factors
  const adjacency = new Map<string, string[]>();
  for (const link of links) {
    const neighbors = adjacency.get(link.fromFactor);
    if (neighbors) {
      neighbors.push(link.toFactor);
    } else {
      adjacency.set(link.fromFactor, [link.toFactor]);
    }
  }

  // DFS from toFactor to see if fromFactor is reachable
  const visited = new Set<string>();
  const stack: string[] = [toFactor];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === fromFactor) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Convergence points
// ============================================================================

/**
 * Find convergence points in the causal graph — factors with two or more
 * incoming causal links.
 *
 * Convergence points are candidate shared root causes: multiple upstream
 * factors feed into them, suggesting they may be a common mechanism
 * through which variation propagates.
 *
 * @param links - Causal links in the graph
 * @returns Factors with 2+ incoming links and their incoming link details
 */
export function findConvergencePoints(
  links: CausalLink[]
): Array<{ factor: string; incomingLinks: CausalLink[] }> {
  // Group links by target factor
  const incomingMap = new Map<string, CausalLink[]>();

  for (const link of links) {
    const incoming = incomingMap.get(link.toFactor);
    if (incoming) {
      incoming.push(link);
    } else {
      incomingMap.set(link.toFactor, [link]);
    }
  }

  // Filter to factors with 2+ incoming links
  const result: Array<{ factor: string; incomingLinks: CausalLink[] }> = [];
  for (const [factor, incomingLinks] of incomingMap.entries()) {
    if (incomingLinks.length >= 2) {
      result.push({ factor, incomingLinks });
    }
  }

  // Sort by number of incoming links descending (most connected first)
  result.sort((a, b) => b.incomingLinks.length - a.incomingLinks.length);

  return result;
}

// ============================================================================
// Topological sort
// ============================================================================

/**
 * Topological sort of factors using Kahn's algorithm.
 *
 * Returns factors in dependency order (upstream factors first), which
 * determines the left-to-right rendering order in the Evidence Map.
 *
 * Factors not connected by any edge are included at the end in their
 * original order.
 *
 * @param factors - All factor names in the graph
 * @param links - Causal links defining the DAG edges
 * @returns Factors in topological order (upstream first)
 */
export function topologicalSort(factors: string[], links: CausalLink[]): string[] {
  // Build in-degree count and adjacency list
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const factor of factors) {
    inDegree.set(factor, 0);
    adjacency.set(factor, []);
  }

  for (const link of links) {
    // Only process links between known factors
    if (!inDegree.has(link.fromFactor) || !inDegree.has(link.toFactor)) continue;

    adjacency.get(link.fromFactor)!.push(link.toFactor);
    inDegree.set(link.toFactor, (inDegree.get(link.toFactor) ?? 0) + 1);
  }

  // Start with factors that have no incoming edges
  const queue: string[] = [];
  for (const factor of factors) {
    if ((inDegree.get(factor) ?? 0) === 0) {
      queue.push(factor);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If there's a cycle, some factors won't be in sorted.
  // Append them at the end to ensure all factors are returned.
  if (sorted.length < factors.length) {
    const sortedSet = new Set(sorted);
    for (const factor of factors) {
      if (!sortedSet.has(factor)) {
        sorted.push(factor);
      }
    }
  }

  return sorted;
}

// ============================================================================
// Path finding
// ============================================================================

/**
 * Find all simple paths between two factors in the causal graph.
 *
 * Uses BFS with path tracking to enumerate all acyclic paths from
 * `from` to `to`. Useful for understanding how variation propagates
 * through the factor network.
 *
 * @param links - Causal links in the graph
 * @param from - Starting factor name
 * @param to - Target factor name
 * @returns Array of paths, where each path is an array of factor names
 */
export function findPaths(links: CausalLink[], from: string, to: string): string[][] {
  if (from === to) return [[from]];

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const link of links) {
    const neighbors = adjacency.get(link.fromFactor);
    if (neighbors) {
      neighbors.push(link.toFactor);
    } else {
      adjacency.set(link.fromFactor, [link.toFactor]);
    }
  }

  const result: string[][] = [];

  // BFS with path tracking (queue of partial paths)
  const queue: string[][] = [[from]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      // Skip if already in path (avoid cycles)
      if (path.includes(neighbor)) continue;

      const newPath = [...path, neighbor];

      if (neighbor === to) {
        result.push(newPath);
      } else {
        queue.push(newPath);
      }
    }
  }

  return result;
}
