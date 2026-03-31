import { describe, it, expect } from 'vitest';
import { computeBestSubsets, generateQuestionsFromRanking } from '../bestSubsets';
import type { BestSubsetsResult } from '../bestSubsets';
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
