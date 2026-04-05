import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEvidenceMapData } from '../useEvidenceMapData';
import type { BestSubsetsResult } from '@variscout/core/stats';
import type { Question } from '@variscout/core/findings';

// ============================================================================
// Helpers
// ============================================================================

function makeBestSubsets(overrides?: Partial<BestSubsetsResult>): BestSubsetsResult {
  return {
    subsets: [
      {
        factors: ['Temperature', 'Pressure'],
        factorCount: 2,
        rSquared: 0.6,
        rSquaredAdj: 0.55,
        fStatistic: 10,
        pValue: 0.001,
        isSignificant: true,
        dfModel: 3,
        levelEffects: new Map([
          [
            'Temperature',
            new Map([
              ['High', 5],
              ['Low', -5],
            ]),
          ],
          [
            'Pressure',
            new Map([
              ['High', 3],
              ['Low', -3],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
      {
        factors: ['Temperature'],
        factorCount: 1,
        rSquared: 0.4,
        rSquaredAdj: 0.38,
        fStatistic: 8,
        pValue: 0.005,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map([
          [
            'Temperature',
            new Map([
              ['High', 5],
              ['Low', -5],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
      {
        factors: ['Pressure'],
        factorCount: 1,
        rSquared: 0.25,
        rSquaredAdj: 0.22,
        fStatistic: 5,
        pValue: 0.03,
        isSignificant: true,
        dfModel: 1,
        levelEffects: new Map([
          [
            'Pressure',
            new Map([
              ['High', 3],
              ['Low', -3],
            ]),
          ],
        ]),
        cellMeans: new Map(),
      },
    ],
    n: 50,
    totalFactors: 2,
    factorNames: ['Temperature', 'Pressure'],
    grandMean: 100,
    ssTotal: 1000,
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<Question> & Pick<Question, 'id' | 'status'>): Question {
  return {
    text: 'Does the factor affect the outcome?',
    linkedFindingIds: [],
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-05T00:00:00Z',
    ...overrides,
  };
}

const defaultContainerSize = { width: 800, height: 600 };

// ============================================================================
// Tests
// ============================================================================

describe('useEvidenceMapData — exploredFactors', () => {
  it('returns empty Set when no questions provided', () => {
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions: [],
      })
    );
    expect(result.current.exploredFactors).toBeInstanceOf(Set);
    expect(result.current.exploredFactors.size).toBe(0);
  });

  it('returns empty Set for empty (no bestSubsets) state', () => {
    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: null,
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
      })
    );
    expect(result.current.exploredFactors).toBeInstanceOf(Set);
    expect(result.current.exploredFactors.size).toBe(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it('marks a factor as explored when it has an answered question', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'answered', factor: 'Temperature' }),
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.has('Temperature')).toBe(true);
    expect(result.current.exploredFactors.has('Pressure')).toBe(false);
  });

  it('marks a factor as explored when it has a ruled-out question (any status)', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'open', factor: 'Pressure', causeRole: 'ruled-out' }),
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.has('Pressure')).toBe(true);
    expect(result.current.exploredFactors.has('Temperature')).toBe(false);
  });

  it('does NOT mark a factor as explored for an open question without causeRole', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'open', factor: 'Temperature' }),
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.has('Temperature')).toBe(false);
  });

  it('does NOT mark a factor as explored for an investigating question', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'investigating', factor: 'Temperature' }),
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.has('Temperature')).toBe(false);
  });

  it('includes both factors when each has at least one qualifying question', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'answered', factor: 'Temperature' }),
      makeQuestion({ id: 'q2', status: 'open', factor: 'Pressure', causeRole: 'ruled-out' }),
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.has('Temperature')).toBe(true);
    expect(result.current.exploredFactors.has('Pressure')).toBe(true);
    expect(result.current.exploredFactors.size).toBe(2);
  });

  it('ignores questions with no factor field', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'answered' }), // no factor
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.size).toBe(0);
  });

  it('deduplicates — multiple answered questions for same factor produce one entry', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', status: 'answered', factor: 'Temperature' }),
      makeQuestion({ id: 'q2', status: 'answered', factor: 'Temperature' }),
    ];

    const { result } = renderHook(() =>
      useEvidenceMapData({
        bestSubsets: makeBestSubsets(),
        mainEffects: null,
        interactions: null,
        containerSize: defaultContainerSize,
        mode: 'standard',
        questions,
      })
    );

    expect(result.current.exploredFactors.size).toBe(1);
    expect(result.current.exploredFactors.has('Temperature')).toBe(true);
  });
});
