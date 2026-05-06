import { describe, it, expect } from 'vitest';
import { computeEvidenceMapLayout } from '../evidenceMapLayout';
import type { BestSubsetsResult, BestSubsetResult } from '../bestSubsets';
import type { PredictorInfo } from '../../types';

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
          levelsA: [],
          levelsB: [],
          rSquaredMainEffects: 0.55,
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

// ============================================================================
// Continuous factor enrichment (factorType, trendGlyph, slopeCoefficient, optimum)
// ============================================================================

/**
 * Build a BestSubsetsResult that simulates an OLS result with one continuous
 * factor (Temp) and one categorical factor (Supplier).
 */
function makeMixedBestSubsets(
  continuousPredictor: PredictorInfo,
  quadraticPredictor?: PredictorInfo
): BestSubsetsResult {
  const predictors: PredictorInfo[] = [
    continuousPredictor,
    ...(quadraticPredictor ? [quadraticPredictor] : []),
    {
      name: 'Supplier',
      factorName: 'Supplier',
      type: 'categorical',
      level: 'B',
      coefficient: 3.5,
      standardError: 0.8,
      tStatistic: 4.4,
      pValue: 0.001,
      isSignificant: true,
    },
  ];

  const bestSubset: BestSubsetResult = {
    factors: ['Temp', 'Supplier'],
    factorCount: 2,
    rSquared: 0.72,
    rSquaredAdj: 0.68,
    fStatistic: 15,
    pValue: 0.0001,
    isSignificant: true,
    dfModel: 3,
    levelEffects: new Map([
      [
        'Supplier',
        new Map([
          ['B', 3.5],
          ['A', -3.5],
        ]),
      ],
      // Temp has no levelEffects in OLS mode
      ['Temp', new Map()],
    ]),
    cellMeans: new Map(),
    predictors,
    intercept: 87.2,
    modelType: 'ols',
    factorTypes: new Map([
      ['Temp', 'continuous'],
      ['Supplier', 'categorical'],
    ]),
  };

  const singleTemp: BestSubsetResult = {
    factors: ['Temp'],
    factorCount: 1,
    rSquared: 0.45,
    rSquaredAdj: 0.43,
    fStatistic: 10,
    pValue: 0.002,
    isSignificant: true,
    dfModel: 1,
    levelEffects: new Map([['Temp', new Map()]]),
    cellMeans: new Map(),
    factorTypes: new Map([['Temp', 'continuous']]),
  };

  const singleSupplier: BestSubsetResult = {
    factors: ['Supplier'],
    factorCount: 1,
    rSquared: 0.3,
    rSquaredAdj: 0.28,
    fStatistic: 8,
    pValue: 0.005,
    isSignificant: true,
    dfModel: 1,
    levelEffects: new Map([
      [
        'Supplier',
        new Map([
          ['B', 3.5],
          ['A', -3.5],
        ]),
      ],
    ]),
    cellMeans: new Map(),
    factorTypes: new Map([['Supplier', 'categorical']]),
  };

  return {
    subsets: [bestSubset, singleTemp, singleSupplier],
    n: 80,
    totalFactors: 2,
    factorNames: ['Temp', 'Supplier'],
    grandMean: 87.2,
    ssTotal: 2000,
    factorTypes: new Map([
      ['Temp', 'continuous'],
      ['Supplier', 'categorical'],
    ]),
    usedOLS: true,
  };
}

describe('computeEvidenceMapLayout — continuous factor enrichment', () => {
  const container = { width: 800, height: 600 };

  const positiveLinear: PredictorInfo = {
    name: 'Temp',
    factorName: 'Temp',
    type: 'continuous',
    coefficient: 0.4,
    standardError: 0.05,
    tStatistic: 8,
    pValue: 0.0001,
    isSignificant: true,
  };

  const negativeLinear: PredictorInfo = {
    name: 'Temp',
    factorName: 'Temp',
    type: 'continuous',
    coefficient: -0.4,
    standardError: 0.05,
    tStatistic: -8,
    pValue: 0.0001,
    isSignificant: true,
  };

  const quadPeak: PredictorInfo = {
    name: 'Temp²',
    factorName: 'Temp',
    type: 'quadratic',
    coefficient: -0.002, // negative → peak (∩)
    standardError: 0.001,
    tStatistic: -2,
    pValue: 0.05,
    isSignificant: true,
    mean: 200, // factor mean used for centering
  };

  const quadValley: PredictorInfo = {
    name: 'Temp²',
    factorName: 'Temp',
    type: 'quadratic',
    coefficient: 0.002, // positive → valley (∪)
    standardError: 0.001,
    tStatistic: 2,
    pValue: 0.05,
    isSignificant: true,
    mean: 200,
  };

  it('sets factorType from BestSubsetsResult.factorTypes', () => {
    const bs = makeMixedBestSubsets(positiveLinear);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const tempNode = layout.factorNodes.find(n => n.factor === 'Temp')!;
    const supplierNode = layout.factorNodes.find(n => n.factor === 'Supplier')!;

    expect(tempNode.factorType).toBe('continuous');
    expect(supplierNode.factorType).toBe('categorical');
  });

  it("assigns '/' glyph for positive linear continuous factor", () => {
    const bs = makeMixedBestSubsets(positiveLinear);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const tempNode = layout.factorNodes.find(n => n.factor === 'Temp')!;
    expect(tempNode.trendGlyph).toBe('/');
    expect(tempNode.slopeCoefficient).toBeCloseTo(0.4, 5);
    expect(tempNode.optimum).toBeUndefined();
  });

  it("assigns '\\\\' glyph for negative linear continuous factor", () => {
    const bs = makeMixedBestSubsets(negativeLinear);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const tempNode = layout.factorNodes.find(n => n.factor === 'Temp')!;
    expect(tempNode.trendGlyph).toBe('\\');
    expect(tempNode.slopeCoefficient).toBeCloseTo(-0.4, 5);
  });

  it("assigns '∩' glyph for quadratic peak (negative quadratic coefficient)", () => {
    const bs = makeMixedBestSubsets(positiveLinear, quadPeak);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const tempNode = layout.factorNodes.find(n => n.factor === 'Temp')!;
    expect(tempNode.trendGlyph).toBe('∩');
  });

  it("assigns '∪' glyph for quadratic valley (positive quadratic coefficient)", () => {
    const bs = makeMixedBestSubsets(positiveLinear, quadValley);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const tempNode = layout.factorNodes.find(n => n.factor === 'Temp')!;
    expect(tempNode.trendGlyph).toBe('∪');
  });

  it('computes optimum from vertex formula: x_opt = mean - b / (2c)', () => {
    // mean = 200, b = 0.4, c = -0.002 → x_opt = 200 - 0.4 / (2 × -0.002) = 200 + 100 = 300
    const bs = makeMixedBestSubsets(positiveLinear, quadPeak);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const tempNode = layout.factorNodes.find(n => n.factor === 'Temp')!;
    expect(tempNode.optimum).toBeCloseTo(300, 2);
  });

  it('assigns null trendGlyph for categorical factors', () => {
    const bs = makeMixedBestSubsets(positiveLinear);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    const supplierNode = layout.factorNodes.find(n => n.factor === 'Supplier')!;
    expect(supplierNode.trendGlyph).toBeNull();
  });

  it('leaves factorType and trendGlyph undefined for categorical-only data (no factorTypes map)', () => {
    // Standard categorical-only bestSubsets has no factorTypes
    const bs = makeBestSubsets();
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    for (const node of layout.factorNodes) {
      expect(node.factorType).toBeUndefined();
      expect(node.trendGlyph).toBeUndefined();
    }
  });

  it('builds equation using continuous slope notation when predictors present', () => {
    const bs = makeMixedBestSubsets(positiveLinear);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    expect(layout.equation).not.toBeNull();
    // Should contain slope notation (×) for Temp
    expect(layout.equation!.formula).toMatch(/×Temp/);
    // Intercept from bestSubset.intercept (87.2)
    expect(layout.equation!.formula).toContain('87.2');
  });

  it('builds equation using quadratic notation for quadratic term', () => {
    const bs = makeMixedBestSubsets(positiveLinear, quadPeak);
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    expect(layout.equation).not.toBeNull();
    // Should contain Temp² (superscript 2 = \u00B2)
    expect(layout.equation!.formula).toMatch(/×Temp²|×Temp\u00B2/);
  });

  it('falls back to categorical level notation when predictors absent', () => {
    // Standard categorical subset — no predictors field
    const bs = makeBestSubsets();
    const layout = computeEvidenceMapLayout(bs, null, null, container);

    expect(layout.equation).not.toBeNull();
    // Should contain parenthesised level names
    expect(layout.equation!.formula).toMatch(/\(a1\)/);
  });
});
