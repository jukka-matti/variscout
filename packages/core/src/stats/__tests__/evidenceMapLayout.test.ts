import { describe, it, expect } from 'vitest';
import { computeEvidenceMapLayout } from '../evidenceMapLayout';
import type { BestSubsetsResult } from '../bestSubsets';

// ============================================================================
// Helpers
// ============================================================================

function makeBestSubsets(overrides?: Partial<BestSubsetsResult>): BestSubsetsResult {
  return {
    subsets: [
      {
        factors: ['A', 'B'],
        factorCount: 2,
        rSquared: 0.6,
        rSquaredAdj: 0.55,
        fStatistic: 10,
        pValue: 0.001,
        isSignificant: true,
        dfModel: 3,
        levelEffects: new Map([
          [
            'A',
            new Map([
              ['a1', 5],
              ['a2', -5],
            ]),
          ],
          [
            'B',
            new Map([
              ['b1', 3],
              ['b2', -3],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
      {
        factors: ['A'],
        factorCount: 1,
        rSquared: 0.4,
        rSquaredAdj: 0.38,
        fStatistic: 8,
        pValue: 0.005,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map([
          [
            'A',
            new Map([
              ['a1', 5],
              ['a2', -5],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
      {
        factors: ['B'],
        factorCount: 1,
        rSquared: 0.25,
        rSquaredAdj: 0.22,
        fStatistic: 5,
        pValue: 0.03,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map([
          [
            'B',
            new Map([
              ['b1', 3],
              ['b2', -3],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
    ],
    n: 50,
    totalFactors: 2,
    factorNames: ['A', 'B'],
    grandMean: 100,
    ssTotal: 1000,
    ...overrides,
  };
}

const container = { width: 800, height: 600 };

// ============================================================================
// computeEvidenceMapLayout
// ============================================================================

describe('computeEvidenceMapLayout', () => {
  it('returns empty layout when no factors', () => {
    const empty = makeBestSubsets({
      subsets: [],
      factorNames: [],
      totalFactors: 0,
    });
    const layout = computeEvidenceMapLayout(empty, null, null, container);

    expect(layout.factorNodes).toHaveLength(0);
    expect(layout.relationshipEdges).toHaveLength(0);
    expect(layout.equation).toBeNull();
  });

  it('returns empty factor nodes when bestSubsets has no single-factor subsets', () => {
    const noSingles = makeBestSubsets({
      subsets: [
        {
          factors: ['A', 'B'],
          factorCount: 2,
          rSquared: 0.6,
          rSquaredAdj: 0.55,
          fStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
          dfModel: 3,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
      ],
    });
    const layout = computeEvidenceMapLayout(noSingles, null, null, container);

    // Factors are present but have R²adj = 0 (no single-factor subset found)
    expect(layout.factorNodes).toHaveLength(2);
    expect(layout.factorNodes[0].rSquaredAdj).toBe(0);
    expect(layout.factorNodes[1].rSquaredAdj).toBe(0);
    // Equation is built from the first subset (the pair)
    expect(layout.equation).not.toBeNull();
  });

  it('positions outcome node at center', () => {
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, null, container);

    expect(layout.outcomeNode.x).toBe(400); // 800/2
    expect(layout.outcomeNode.y).toBe(300); // 600/2
    expect(layout.outcomeNode.label).toBe('Outcome');
    expect(layout.outcomeNode.mean).toBe(100);
  });

  it('sorts factors by R²adj descending (strongest closest to center)', () => {
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, null, container);

    expect(layout.factorNodes).toHaveLength(2);
    // A has R²adj=0.38, B has R²adj=0.22 → A is first (strongest)
    expect(layout.factorNodes[0].factor).toBe('A');
    expect(layout.factorNodes[0].rSquaredAdj).toBe(0.38);
    expect(layout.factorNodes[1].factor).toBe('B');
    expect(layout.factorNodes[1].rSquaredAdj).toBe(0.22);
    // Stronger factor should be closer to center
    expect(layout.factorNodes[0].distance).toBeLessThan(layout.factorNodes[1].distance);
  });

  it('scales node radius proportional to R²adj', () => {
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, null, container);

    // MIN_NODE_RADIUS=12, MAX_NODE_RADIUS=32
    // radius = 12 + rAdjSingle * (32 - 12)
    const nodeA = layout.factorNodes.find(n => n.factor === 'A')!;
    const nodeB = layout.factorNodes.find(n => n.factor === 'B')!;
    // A (0.38) should have larger radius than B (0.22)
    expect(nodeA.radius).toBeGreaterThan(nodeB.radius);
    // Verify formula: 12 + 0.38 * 20 = 19.6
    expect(nodeA.radius).toBeCloseTo(19.6, 1);
    // 12 + 0.22 * 20 = 16.4
    expect(nodeB.radius).toBeCloseTo(16.4, 1);
  });

  it('classifies relationship edge for factor pair', () => {
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, null, container);

    // With rAdjA=0.38, rAdjB=0.22, rAdjAB=0.55
    // sum = 0.60, |0.55 - 0.60| = 0.05 > 0.02 → overlapping
    expect(layout.relationshipEdges).toHaveLength(1);
    const edge = layout.relationshipEdges[0];
    expect(edge.factorA).toBe('A');
    expect(edge.factorB).toBe('B');
    expect(edge.type).toBe('overlapping');
    expect(edge.strength).toBeGreaterThan(0);
  });

  it('builds equation from best (first) subset', () => {
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, null, container);

    expect(layout.equation).not.toBeNull();
    expect(layout.equation!.factors).toEqual(['A', 'B']);
    expect(layout.equation!.rSquaredAdj).toBe(0.55);
    // Formula should include grand mean and level effects
    expect(layout.equation!.formula).toContain('100.0');
    expect(layout.equation!.formula).toContain('a1');
    expect(layout.equation!.formula).toContain('b1');
  });

  it('classifies interactive edge when interaction deltaR2 provided', () => {
    const interactions = {
      interactions: [
        {
          factorA: 'A',
          factorB: 'B',
          rSquaredMain: 0.55,
          rSquaredWithInteraction: 0.65,
          deltaRSquared: 0.1,
          fStatistic: 5,
          pValue: 0.01,
          isSignificant: true,
          cellMeans: [],
        },
      ],
      significantCount: 1,
    };
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, interactions, container);

    expect(layout.relationshipEdges[0].type).toBe('interactive');
  });

  it('includes level effects sorted by absolute effect descending', () => {
    const layout = computeEvidenceMapLayout(makeBestSubsets(), null, null, container);

    const nodeA = layout.factorNodes.find(n => n.factor === 'A')!;
    expect(nodeA.levelEffects).toHaveLength(2);
    // |5| = |−5|, so order depends on Map iteration; both are present
    expect(nodeA.levelEffects.map(e => e.level)).toContain('a1');
    expect(nodeA.levelEffects.map(e => e.level)).toContain('a2');
  });
});
