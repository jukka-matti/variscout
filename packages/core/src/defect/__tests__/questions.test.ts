import { describe, it, expect } from 'vitest';
import { generateDefectAnalysisQuestions } from '../questions';
import type { DefectQuestionInput } from '../questions';
import type { BestSubsetsResult } from '../../stats/bestSubsets';

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

function buildDefectDataWithTypes(): DefectQuestionInput {
  return {
    transformedData: [
      { Batch: 'B1', DefectType: 'Scratch', DefectCount: 10, Line: 'A' },
      { Batch: 'B2', DefectType: 'Scratch', DefectCount: 8, Line: 'B' },
      { Batch: 'B3', DefectType: 'Dent', DefectCount: 5, Line: 'A' },
      { Batch: 'B4', DefectType: 'Crack', DefectCount: 2, Line: 'B' },
      { Batch: 'B5', DefectType: 'Scratch', DefectCount: 15, Line: 'A' },
      { Batch: 'B6', DefectType: 'Dent', DefectCount: 3, Line: 'B' },
    ],
    outcomeColumn: 'DefectCount',
    defectTypeColumn: 'DefectType',
    factors: ['Line', 'DefectType'],
  };
}

function buildDefectDataWithoutTypes(): DefectQuestionInput {
  return {
    transformedData: [
      { Batch: 'B1', DefectCount: 10, Line: 'A' },
      { Batch: 'B2', DefectCount: 8, Line: 'B' },
      { Batch: 'B3', DefectCount: 5, Line: 'A' },
    ],
    outcomeColumn: 'DefectCount',
    factors: ['Line'],
  };
}

function buildMinimalBestSubsets(): BestSubsetsResult {
  return {
    subsets: [
      {
        factors: ['Line'],
        factorCount: 1,
        rSquared: 0.45,
        rSquaredAdj: 0.42,
        fStatistic: 8.5,
        pValue: 0.01,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map(),
        cellMeans: new Map(),
      },
    ],
    n: 6,
    totalFactors: 1,
    factorNames: ['Line'],
    grandMean: 7.17,
    ssTotal: 120,
    usedOLS: false,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateDefectAnalysisQuestions', () => {
  it('generates dominance questions for top defect types', () => {
    const input = buildDefectDataWithTypes();
    const questions = generateDefectAnalysisQuestions(input, null);

    const dominanceQs = questions.filter(q => q.text.includes('dominate the defect rate'));
    expect(dominanceQs.length).toBe(3); // Scratch, Dent, Crack

    // Scratch should have highest evidence (33/43 ≈ 0.767)
    const scratchQ = dominanceQs.find(q => q.text.includes('Scratch'));
    expect(scratchQ).toBeDefined();
    expect(scratchQ!.rSquaredAdj).toBeGreaterThan(0.5);
    expect(scratchQ!.type).toBe('main-effect');
    expect(scratchQ!.source).toBe('factor-intel');
  });

  it('generates factor-driven questions from best subsets', () => {
    const input = buildDefectDataWithTypes();
    const bestSubsets = buildMinimalBestSubsets();
    const questions = generateDefectAnalysisQuestions(input, bestSubsets);

    const factorQ = questions.find(q => q.text.includes('drive defect rate variation'));
    expect(factorQ).toBeDefined();
    expect(factorQ!.factors).toContain('Line');
  });

  it('always generates temporal stability question', () => {
    const input = buildDefectDataWithTypes();
    const questions = generateDefectAnalysisQuestions(input, null);

    const stabilityQ = questions.find(q => q.text.includes('stable over time'));
    expect(stabilityQ).toBeDefined();
    expect(stabilityQ!.type).toBe('main-effect');
    expect(stabilityQ!.rSquaredAdj).toBe(0);
  });

  it('without defect type column only produces factor + stability questions', () => {
    const input = buildDefectDataWithoutTypes();
    const bestSubsets = buildMinimalBestSubsets();
    const questions = generateDefectAnalysisQuestions(input, bestSubsets);

    const dominanceQs = questions.filter(q => q.text.includes('dominate'));
    expect(dominanceQs.length).toBe(0);

    const stabilityQ = questions.find(q => q.text.includes('stable over time'));
    expect(stabilityQ).toBeDefined();

    // Factor question from best subsets
    const factorQ = questions.find(q => q.text.includes('drive defect rate variation'));
    expect(factorQ).toBeDefined();
  });

  it('returns empty array for empty data', () => {
    const input: DefectQuestionInput = {
      transformedData: [],
      outcomeColumn: 'DefectCount',
      factors: [],
    };
    expect(generateDefectAnalysisQuestions(input, null)).toEqual([]);
  });

  it('sorts questions by evidence strength descending', () => {
    const input = buildDefectDataWithTypes();
    const bestSubsets = buildMinimalBestSubsets();
    const questions = generateDefectAnalysisQuestions(input, bestSubsets);

    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].rSquaredAdj).toBeLessThanOrEqual(questions[i - 1].rSquaredAdj);
    }
  });

  it('all questions have factor-intel source', () => {
    const input = buildDefectDataWithTypes();
    const bestSubsets = buildMinimalBestSubsets();
    const questions = generateDefectAnalysisQuestions(input, bestSubsets);

    for (const q of questions) {
      expect(q.source).toBe('factor-intel');
    }
  });

  it('limits type dominance questions to top 3', () => {
    // Create data with 5 defect types
    const input: DefectQuestionInput = {
      transformedData: [
        { Batch: 'B1', DefectType: 'TypeA', DefectCount: 20 },
        { Batch: 'B2', DefectType: 'TypeB', DefectCount: 15 },
        { Batch: 'B3', DefectType: 'TypeC', DefectCount: 10 },
        { Batch: 'B4', DefectType: 'TypeD', DefectCount: 5 },
        { Batch: 'B5', DefectType: 'TypeE', DefectCount: 1 },
      ],
      outcomeColumn: 'DefectCount',
      defectTypeColumn: 'DefectType',
      factors: [],
    };

    const questions = generateDefectAnalysisQuestions(input, null);
    const dominanceQs = questions.filter(q => q.text.includes('dominate'));
    expect(dominanceQs.length).toBe(3);

    // TypeD and TypeE should not have dominance questions
    expect(dominanceQs.find(q => q.text.includes('TypeD'))).toBeUndefined();
    expect(dominanceQs.find(q => q.text.includes('TypeE'))).toBeUndefined();
  });

  it('without bestSubsets and without defect type column returns only stability question', () => {
    const input: DefectQuestionInput = {
      transformedData: [{ Batch: 'B1', DefectCount: 5 }],
      outcomeColumn: 'DefectCount',
      factors: [],
    };
    const questions = generateDefectAnalysisQuestions(input, null);

    expect(questions.length).toBe(1);
    expect(questions[0].text).toContain('stable over time');
  });
});
