import { describe, it, expect } from 'vitest';
import {
  classifyRelationship,
  wouldCreateCycle,
  findConvergencePoints,
  topologicalSort,
  findPaths,
} from '../causalGraph';
import type { CausalLink } from '../../findings/types';

// ============================================================================
// Helpers
// ============================================================================

function makeLink(from: string, to: string, id?: string): CausalLink {
  return {
    id: id ?? `${from}-${to}`,
    fromFactor: from,
    toFactor: to,
    whyStatement: `${from} drives ${to}`,
    direction: 'drives',
    evidenceType: 'data',
    questionIds: [],
    findingIds: [],
    source: 'analyst',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
  };
}

// ============================================================================
// classifyRelationship
// ============================================================================

describe('classifyRelationship', () => {
  it('returns independent when combined ≈ sum of individual (within threshold)', () => {
    // rAdjA=0.30 + rAdjB=0.20 = 0.50, combined=0.49 → |0.49-0.50| = 0.01 ≤ 0.02
    expect(classifyRelationship(0.3, 0.2, 0.49)).toBe('independent');
  });

  it('returns overlapping when combined < sum but B still adds something', () => {
    // sum=0.50, combined=0.40 → 0.40 < 0.50 - 0.02 and 0.40 > 0.30 + 0.02
    expect(classifyRelationship(0.3, 0.2, 0.4)).toBe('overlapping');
  });

  it('returns synergistic when combined > sum + threshold', () => {
    // sum=0.35, combined=0.45 → 0.45 > 0.35 + 0.02
    expect(classifyRelationship(0.2, 0.15, 0.45)).toBe('synergistic');
  });

  it('returns interactive when deltaR2 > threshold', () => {
    // deltaR2=0.05 > 0.02 threshold
    expect(classifyRelationship(0.2, 0.15, 0.3, 0.05)).toBe('interactive');
  });

  it('returns redundant when B adds nothing beyond A', () => {
    // combined=0.41 ≤ rAdjA(0.40) + threshold(0.02)
    expect(classifyRelationship(0.4, 0.1, 0.41)).toBe('redundant');
  });

  it('interactive takes priority over other types when deltaR2 present', () => {
    // Even though rAdjAB ≈ sum (would be independent), deltaR2 trumps
    expect(classifyRelationship(0.3, 0.2, 0.5, 0.1)).toBe('interactive');
  });

  it('returns independent at boundary just within threshold', () => {
    // rAdjA=0.25, rAdjB=0.25, sum=0.50, rAdjAB=0.49 → |0.49-0.50| = 0.01 < 0.02
    expect(classifyRelationship(0.25, 0.25, 0.49)).toBe('independent');
  });

  it('returns overlapping at boundary just outside threshold', () => {
    // sum=0.50, rAdjAB=0.47 → |0.47-0.50| = 0.03 > 0.02, and 0.47 > 0.25+0.02
    expect(classifyRelationship(0.25, 0.25, 0.47)).toBe('overlapping');
  });

  it('returns synergistic at exact upper boundary', () => {
    // sum=0.50, threshold=0.02 → synergistic requires rAdjAB > 0.52
    // 0.521 > 0.52
    expect(classifyRelationship(0.3, 0.2, 0.521)).toBe('synergistic');
  });

  it('does not classify as interactive when deltaR2 equals threshold', () => {
    // deltaR2=0.02, threshold=0.02 → NOT interactive (requires >)
    expect(classifyRelationship(0.3, 0.2, 0.49, 0.02)).not.toBe('interactive');
  });

  it('does not classify as interactive when deltaR2 is undefined', () => {
    expect(classifyRelationship(0.3, 0.2, 0.49, undefined)).toBe('independent');
  });
});

// ============================================================================
// wouldCreateCycle
// ============================================================================

describe('wouldCreateCycle', () => {
  it('returns false for empty graph', () => {
    expect(wouldCreateCycle([], 'A', 'B')).toBe(false);
  });

  it('returns false for valid new edge in existing graph', () => {
    const links = [makeLink('A', 'B')];
    expect(wouldCreateCycle(links, 'B', 'C')).toBe(false);
  });

  it('detects simple cycle (A→B, adding B→A)', () => {
    const links = [makeLink('A', 'B')];
    expect(wouldCreateCycle(links, 'B', 'A')).toBe(true);
  });

  it('detects longer cycle (A→B→C, adding C→A)', () => {
    const links = [makeLink('A', 'B'), makeLink('B', 'C')];
    expect(wouldCreateCycle(links, 'C', 'A')).toBe(true);
  });

  it('detects self-loop (A→A)', () => {
    expect(wouldCreateCycle([], 'A', 'A')).toBe(true);
  });

  it('no false positive in DAG (A→B, A→C, B→C, adding D→A)', () => {
    const links = [makeLink('A', 'B'), makeLink('A', 'C'), makeLink('B', 'C')];
    expect(wouldCreateCycle(links, 'D', 'A')).toBe(false);
  });

  it('disconnected components do not interfere', () => {
    const links = [makeLink('A', 'B'), makeLink('C', 'D')];
    // Adding D→C would create cycle in {C,D} component
    expect(wouldCreateCycle(links, 'D', 'C')).toBe(true);
    // But adding D→A is fine — crosses components
    expect(wouldCreateCycle(links, 'D', 'A')).toBe(false);
  });
});

// ============================================================================
// findConvergencePoints
// ============================================================================

describe('findConvergencePoints', () => {
  it('returns empty for empty links', () => {
    expect(findConvergencePoints([])).toEqual([]);
  });

  it('returns empty when no factor has 2+ incoming links', () => {
    const links = [makeLink('A', 'B'), makeLink('C', 'D')];
    expect(findConvergencePoints(links)).toEqual([]);
  });

  it('finds single convergence point (2 links to same factor)', () => {
    const links = [makeLink('A', 'C'), makeLink('B', 'C')];
    const result = findConvergencePoints(links);
    expect(result).toHaveLength(1);
    expect(result[0].factor).toBe('C');
    expect(result[0].incomingLinks).toHaveLength(2);
  });

  it('finds multiple convergence points sorted by incoming count', () => {
    const links = [
      makeLink('A', 'D'),
      makeLink('B', 'D'),
      makeLink('C', 'D'),
      makeLink('A', 'E'),
      makeLink('B', 'E'),
    ];
    const result = findConvergencePoints(links);
    expect(result).toHaveLength(2);
    // D has 3 incoming, E has 2 — sorted descending
    expect(result[0].factor).toBe('D');
    expect(result[0].incomingLinks).toHaveLength(3);
    expect(result[1].factor).toBe('E');
    expect(result[1].incomingLinks).toHaveLength(2);
  });
});

// ============================================================================
// topologicalSort
// ============================================================================

describe('topologicalSort', () => {
  it('returns factors in original order when no links', () => {
    expect(topologicalSort(['C', 'A', 'B'], [])).toEqual(['C', 'A', 'B']);
  });

  it('sorts linear chain correctly', () => {
    const links = [makeLink('A', 'B'), makeLink('B', 'C')];
    const result = topologicalSort(['A', 'B', 'C'], links);
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('C'));
  });

  it('produces valid topological order for DAG with branches', () => {
    // A → B, A → C, B → D, C → D
    const links = [makeLink('A', 'B'), makeLink('A', 'C'), makeLink('B', 'D'), makeLink('C', 'D')];
    const result = topologicalSort(['A', 'B', 'C', 'D'], links);
    expect(result).toHaveLength(4);
    // A must come before B, C, and D
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('C'));
    // B and C must come before D
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('D'));
    expect(result.indexOf('C')).toBeLessThan(result.indexOf('D'));
  });

  it('includes disconnected factors', () => {
    const links = [makeLink('A', 'B')];
    const result = topologicalSort(['A', 'B', 'X', 'Y'], links);
    expect(result).toHaveLength(4);
    expect(result).toContain('X');
    expect(result).toContain('Y');
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
  });
});

// ============================================================================
// findPaths
// ============================================================================

describe('findPaths', () => {
  it('returns empty for no path between disconnected factors', () => {
    const links = [makeLink('A', 'B')];
    expect(findPaths(links, 'C', 'D')).toEqual([]);
  });

  it('returns single direct path', () => {
    const links = [makeLink('A', 'B')];
    const result = findPaths(links, 'A', 'B');
    expect(result).toEqual([['A', 'B']]);
  });

  it('finds multiple paths through different intermediates', () => {
    // A → B → D, A → C → D
    const links = [makeLink('A', 'B'), makeLink('A', 'C'), makeLink('B', 'D'), makeLink('C', 'D')];
    const result = findPaths(links, 'A', 'D');
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(['A', 'B', 'D']);
    expect(result).toContainEqual(['A', 'C', 'D']);
  });

  it('returns empty when no path exists between disconnected factors', () => {
    const links = [makeLink('A', 'B'), makeLink('C', 'D')];
    expect(findPaths(links, 'A', 'D')).toEqual([]);
  });

  it('returns [[from]] when from equals to', () => {
    expect(findPaths([], 'A', 'A')).toEqual([['A']]);
  });
});
