import { describe, it, expect } from 'vitest';
import {
  computeBestSubsets,
  generateQuestionsFromRanking,
  predictFromModel,
  computeCoverage,
} from '../bestSubsets';
import type { BestSubsetsResult, BestSubsetResult } from '../bestSubsets';
import type { DataRow } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build synthetic data with known factor-outcome correlations. */
function buildTestData(n: number): DataRow[] {
  const rows: DataRow[] = [];
  const shifts = ['Morning', 'Evening', 'Night'];
  const machines = ['M1', 'M2'];
  const operators = ['Alice', 'Bob', 'Charlie'];

  for (let i = 0; i < n; i++) {
    const shift = shifts[i % shifts.length];
    const machine = machines[i % machines.length];
    const operator = operators[i % operators.length];

    // Machine is dominant (~40% R²adj), Shift is medium (~15%), Operator is weak (~3%)
    const machineEffect = machine === 'M1' ? 5 : -5;
    const shiftEffect = shift === 'Morning' ? 2 : shift === 'Evening' ? 0 : -2;
    const operatorEffect = operator === 'Alice' ? 0.5 : operator === 'Bob' ? 0 : -0.5;
    const noise = ((i * 7 + 3) % 11) - 5; // deterministic pseudo-noise

    rows.push({
      Weight: 100 + machineEffect + shiftEffect + operatorEffect + noise,
      Machine: machine,
      Shift: shift,
      Operator: operator,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Tests: generateQuestionsFromRanking
// ---------------------------------------------------------------------------

describe('generateQuestionsFromRanking', () => {
  it('generates single-factor and combination questions from 3-factor data', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!);

    // Should have all 3 single-factor questions
    const singles = questions.filter(q => q.type === 'single-factor');
    expect(singles.length).toBe(3);

    // Single-factor questions should mention the factor name
    expect(singles.some(q => q.text.includes('Machine'))).toBe(true);
    expect(singles.some(q => q.text.includes('Shift'))).toBe(true);
    expect(singles.some(q => q.text.includes('Operator'))).toBe(true);

    // All questions should have source 'factor-intel'
    for (const q of questions) {
      expect(q.source).toBe('factor-intel');
    }

    // Questions should be sorted by R²adj descending
    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].rSquaredAdj).toBeLessThanOrEqual(questions[i - 1].rSquaredAdj);
    }
  });

  it('auto-rules-out factors with R²adj below threshold', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();

    // Use a high threshold so some factors are ruled out
    const questions = generateQuestionsFromRanking(result!, {
      autoRuleOutThreshold: 0.2,
    });

    const ruledOut = questions.filter(q => q.autoAnswered);
    const notRuledOut = questions.filter(q => !q.autoAnswered);

    // At least one should be ruled out and one should not
    expect(ruledOut.length).toBeGreaterThan(0);
    expect(notRuledOut.length).toBeGreaterThan(0);

    // Ruled out questions should have autoStatus
    for (const q of ruledOut) {
      expect(q.autoStatus).toBe('ruled-out');
      expect(q.rSquaredAdj).toBeLessThan(0.2);
    }

    // Not ruled out should have no autoStatus
    for (const q of notRuledOut) {
      expect(q.autoStatus).toBeUndefined();
    }
  });

  it('limits combination questions to top 5', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!);
    const combos = questions.filter(q => q.type === 'combination');

    // With 3 factors, there are 4 multi-factor subsets (3 pairs + 1 triple)
    // All should be included since <= 5
    expect(combos.length).toBeLessThanOrEqual(5);
    expect(combos.length).toBeGreaterThan(0);

    // Combination questions should mention multiple factors
    for (const q of combos) {
      expect(q.factors.length).toBeGreaterThan(1);
      expect(q.text).toContain('together');
    }
  });

  it('skips subsets with R²adj <= 0', () => {
    // Create a result with some negative R²adj subsets
    const mockResult: BestSubsetsResult = {
      subsets: [
        {
          factors: ['A'],
          factorCount: 1,
          rSquared: 0.3,
          rSquaredAdj: 0.28,
          fStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
        {
          factors: ['B'],
          factorCount: 1,
          rSquared: 0.01,
          rSquaredAdj: -0.02,
          fStatistic: 0.5,
          pValue: 0.6,
          isSignificant: false,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
      ],
      n: 50,
      totalFactors: 2,
      factorNames: ['A', 'B'],
      grandMean: 100,
      ssTotal: 1000,
    };

    const questions = generateQuestionsFromRanking(mockResult);

    // B should be excluded (R²adj <= 0)
    expect(questions.length).toBe(1);
    expect(questions[0].factors).toEqual(['A']);
  });

  it('returns empty array when all subsets have R²adj <= 0', () => {
    const mockResult: BestSubsetsResult = {
      subsets: [
        {
          factors: ['A'],
          factorCount: 1,
          rSquared: 0.01,
          rSquaredAdj: -0.01,
          fStatistic: 0.3,
          pValue: 0.7,
          isSignificant: false,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
      ],
      n: 50,
      totalFactors: 1,
      factorNames: ['A'],
      grandMean: 100,
      ssTotal: 1000,
    };

    const questions = generateQuestionsFromRanking(mockResult);
    expect(questions).toEqual([]);
  });

  it('uses capability mode wording for single-factor questions', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!, { mode: 'capability' });

    const singles = questions.filter(q => q.type === 'single-factor');
    for (const q of singles) {
      expect(q.text).toContain('affect Cpk');
      expect(q.text).not.toContain('explain variation');
    }

    const combos = questions.filter(q => q.type === 'combination');
    for (const q of combos) {
      expect(q.text).toContain('affect Cpk more');
    }
  });

  it('uses performance mode wording for questions', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!, { mode: 'performance' });

    const singles = questions.filter(q => q.type === 'single-factor');
    for (const q of singles) {
      expect(q.text).toContain('affect channel performance');
    }

    const combos = questions.filter(q => q.type === 'combination');
    for (const q of combos) {
      expect(q.text).toContain('affect channel performance more');
    }
  });

  it('keeps default wording for standard mode', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();

    const questionsDefault = generateQuestionsFromRanking(result!);
    const questionsStandard = generateQuestionsFromRanking(result!, { mode: 'standard' });

    // Both should use the same "explain variation" wording
    for (const q of questionsDefault.filter(q => q.type === 'single-factor')) {
      expect(q.text).toContain('explain variation');
    }
    for (const q of questionsStandard.filter(q => q.type === 'single-factor')) {
      expect(q.text).toContain('explain variation');
    }
  });

  it('uses default threshold of 0.05', () => {
    const mockResult: BestSubsetsResult = {
      subsets: [
        {
          factors: ['Strong'],
          factorCount: 1,
          rSquared: 0.4,
          rSquaredAdj: 0.38,
          fStatistic: 20,
          pValue: 0.001,
          isSignificant: true,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
        {
          factors: ['Weak'],
          factorCount: 1,
          rSquared: 0.04,
          rSquaredAdj: 0.03,
          fStatistic: 1.5,
          pValue: 0.2,
          isSignificant: false,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
      ],
      n: 50,
      totalFactors: 2,
      factorNames: ['Strong', 'Weak'],
      grandMean: 100,
      ssTotal: 1000,
    };

    const questions = generateQuestionsFromRanking(mockResult);

    const strong = questions.find(q => q.factors[0] === 'Strong');
    const weak = questions.find(q => q.factors[0] === 'Weak');

    expect(strong?.autoAnswered).toBe(false);
    expect(weak?.autoAnswered).toBe(true);
    expect(weak?.autoStatus).toBe('ruled-out');
  });
});

// ---------------------------------------------------------------------------
// Tests: Level effects and cell means
// ---------------------------------------------------------------------------

describe('level effects and cell means', () => {
  it('computes correct level effects for 2-factor balanced data', () => {
    // 2 factors, 2 levels each, balanced design (need >= 5 observations)
    // Machine: M1 → Weight +5, M2 → Weight -5
    // Shift: Day → Weight +3, Night → Weight -3
    // Grand mean = 100 (with deterministic noise ~0)
    const rows: DataRow[] = [
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 102, Machine: 'M1', Shift: 'Night' },
      { Weight: 102, Machine: 'M1', Shift: 'Night' },
      { Weight: 98, Machine: 'M2', Shift: 'Day' },
      { Weight: 98, Machine: 'M2', Shift: 'Day' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
    ];

    const result = computeBestSubsets(rows, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();

    // Find the 2-factor subset
    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();

    // Grand mean = (108*2 + 102*2 + 98*2 + 92*2) / 8 = 100
    expect(result!.grandMean).toBeCloseTo(100, 5);

    // Machine level effects:
    // M1 marginal mean = (108*2 + 102*2) / 4 = 105, effect = 105 - 100 = 5
    // M2 marginal mean = (98*2 + 92*2) / 4 = 95, effect = 95 - 100 = -5
    const machineEffects = combo!.levelEffects.get('Machine');
    expect(machineEffects).toBeDefined();
    expect(machineEffects!.get('M1')).toBeCloseTo(5, 5);
    expect(machineEffects!.get('M2')).toBeCloseTo(-5, 5);

    // Shift level effects:
    // Day marginal mean = (108*2 + 98*2) / 4 = 103, effect = 103 - 100 = 3
    // Night marginal mean = (102*2 + 92*2) / 4 = 97, effect = 97 - 100 = -3
    const shiftEffects = combo!.levelEffects.get('Shift');
    expect(shiftEffects).toBeDefined();
    expect(shiftEffects!.get('Day')).toBeCloseTo(3, 5);
    expect(shiftEffects!.get('Night')).toBeCloseTo(-3, 5);
  });

  it('computes correct cell means', () => {
    const rows: DataRow[] = [
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 102, Machine: 'M1', Shift: 'Night' },
      { Weight: 98, Machine: 'M2', Shift: 'Day' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
    ];

    const result = computeBestSubsets(rows, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();
    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();

    // Cell means (compound key uses \x00 separator)
    const m1Day = combo!.cellMeans.get('M1\x00Day');
    expect(m1Day).toEqual({ mean: 108, n: 2 });

    const m2Night = combo!.cellMeans.get('M2\x00Night');
    expect(m2Night).toEqual({ mean: 92, n: 2 });

    const m1Night = combo!.cellMeans.get('M1\x00Night');
    expect(m1Night).toEqual({ mean: 102, n: 1 });
  });

  it('computes correct cell means with multiple observations per cell', () => {
    const rows: DataRow[] = [
      { Weight: 106, Machine: 'M1', Shift: 'Day' },
      { Weight: 110, Machine: 'M1', Shift: 'Day' },
      { Weight: 94, Machine: 'M2', Shift: 'Night' },
      { Weight: 90, Machine: 'M2', Shift: 'Night' },
      { Weight: 100, Machine: 'M1', Shift: 'Night' },
      { Weight: 100, Machine: 'M2', Shift: 'Day' },
    ];

    const result = computeBestSubsets(rows, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();
    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();

    const m1Day = combo!.cellMeans.get('M1\x00Day');
    expect(m1Day).toBeDefined();
    expect(m1Day!.mean).toBeCloseTo(108, 5);
    expect(m1Day!.n).toBe(2);

    const m2Night = combo!.cellMeans.get('M2\x00Night');
    expect(m2Night!.mean).toBeCloseTo(92, 5);
    expect(m2Night!.n).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Tests: predictFromModel
// ---------------------------------------------------------------------------

describe('predictFromModel', () => {
  function makeMockSubset(): { subset: BestSubsetResult; grandMean: number } {
    // Machine: M1 effect +5, M2 effect -5
    // Shift: Day effect +3, Night effect -3
    const machineEffects = new Map<string, number>([
      ['M1', 5],
      ['M2', -5],
    ]);
    const shiftEffects = new Map<string, number>([
      ['Day', 3],
      ['Night', -3],
    ]);

    const subset: BestSubsetResult = {
      factors: ['Machine', 'Shift'],
      factorCount: 2,
      rSquared: 0.9,
      rSquaredAdj: 0.88,
      fStatistic: 50,
      pValue: 0.0001,
      isSignificant: true,
      dfModel: 3,
      levelEffects: new Map([
        ['Machine', machineEffects],
        ['Shift', shiftEffects],
      ]),
      cellMeans: new Map(),
    };

    return { subset, grandMean: 100 };
  }

  it('returns correct delta for known level changes', () => {
    const { subset, grandMean } = makeMockSubset();

    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M2', Shift: 'Night' }, // worst: 100 + (-5) + (-3) = 92
      { Machine: 'M1', Shift: 'Day' } // best: 100 + 5 + 3 = 108
    );

    expect(result).not.toBeNull();
    expect(result!.predictedMean).toBeCloseTo(108, 5);
    expect(result!.meanDelta).toBeCloseTo(16, 5); // 108 - 92
    expect(result!.levelChanges).toHaveLength(2);

    const machineChange = result!.levelChanges.find(c => c.factor === 'Machine');
    expect(machineChange!.effect).toBeCloseTo(10, 5); // 5 - (-5)

    const shiftChange = result!.levelChanges.find(c => c.factor === 'Shift');
    expect(shiftChange!.effect).toBeCloseTo(6, 5); // 3 - (-3)
  });

  it('returns zero delta when current and target are identical', () => {
    const { subset, grandMean } = makeMockSubset();

    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M1', Shift: 'Day' },
      { Machine: 'M1', Shift: 'Day' }
    );

    expect(result).not.toBeNull();
    expect(result!.meanDelta).toBeCloseTo(0, 5);
  });

  it('returns null for unknown level', () => {
    const { subset, grandMean } = makeMockSubset();

    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M1', Shift: 'Day' },
      { Machine: 'M3', Shift: 'Day' } // M3 does not exist
    );

    expect(result).toBeNull();
  });

  it('returns null for missing factor in currentLevels', () => {
    const { subset, grandMean } = makeMockSubset();

    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M1' }, // missing Shift
      { Machine: 'M1', Shift: 'Day' }
    );

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: computeCoverage
// ---------------------------------------------------------------------------

describe('computeCoverage', () => {
  it('computes coverage with mix of answered/open/ruled-out', () => {
    const questions = [
      { status: 'answered', evidence: { rSquaredAdj: 0.4 } },
      { status: 'ruled-out', evidence: { rSquaredAdj: 0.1 } },
      { status: 'open', evidence: { rSquaredAdj: 0.3 } },
      { status: 'investigating', evidence: { rSquaredAdj: 0.2 } },
    ];

    const result = computeCoverage(questions);

    expect(result.checked).toBe(2); // answered + ruled-out
    expect(result.total).toBe(4);
    // Explored R²adj = 0.40 + 0.10 = 0.50, total = 1.00
    expect(result.exploredPercent).toBeCloseTo(50, 5);
  });

  it('returns 0 for empty questions', () => {
    const result = computeCoverage([]);
    expect(result.checked).toBe(0);
    expect(result.total).toBe(0);
    expect(result.exploredPercent).toBe(0);
  });

  it('returns 100% when all are answered', () => {
    const questions = [
      { status: 'answered', evidence: { rSquaredAdj: 0.4 } },
      { status: 'answered', evidence: { rSquaredAdj: 0.3 } },
    ];

    const result = computeCoverage(questions);
    expect(result.checked).toBe(2);
    expect(result.exploredPercent).toBeCloseTo(100, 5);
  });

  it('handles questions with no evidence gracefully', () => {
    const questions = [{ status: 'answered' }, { status: 'open', evidence: { rSquaredAdj: 0.5 } }];

    const result = computeCoverage(questions);
    expect(result.checked).toBe(1);
    // Explored: 0, Total: 0.50 → 0%
    expect(result.exploredPercent).toBeCloseTo(0, 5);
  });
});
