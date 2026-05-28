import { describe, it, expect } from 'vitest';
import { computeHubEvidence, computeHubProjection, detectEvidenceClusters } from '../helpers';
import type { Hypothesis, Question } from '../types';
import type { BestSubsetsResult, BestSubsetResult } from '../../stats/bestSubsets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    text: 'Test question',
    status: 'open',
    linkedFindingIds: [],
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    investigationId: 'inv-test-001',
    deletedAt: null,
    ...overrides,
  };
}

function makeHub(overrides: Partial<Hypothesis> & { id: string }): Hypothesis {
  return {
    name: 'Test hub',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'proposed',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    investigationId: 'inv-test-001',
    deletedAt: null,
    ...overrides,
  };
}

function makeBestSubsetsResult(subsets: BestSubsetResult[], grandMean: number): BestSubsetsResult {
  return {
    subsets,
    n: 100,
    totalFactors: 3,
    factorNames: ['Machine', 'Shift', 'Operator'],
    grandMean,
    ssTotal: 5000,
  };
}

function makeSubset(
  factors: string[],
  rSquaredAdj: number,
  levelEffects: Map<string, Map<string, number>>,
  cellMeans?: Map<string, { mean: number; n: number }>
): BestSubsetResult {
  return {
    factors,
    factorCount: factors.length,
    rSquared: rSquaredAdj + 0.05,
    rSquaredAdj,
    fStatistic: 20,
    pValue: 0.001,
    isSignificant: true,
    dfModel: factors.length,
    levelEffects,
    cellMeans: cellMeans ?? new Map(),
  };
}

// ---------------------------------------------------------------------------
// Tests: evidence helpers
// ---------------------------------------------------------------------------

describe('computeHubEvidence', () => {
  const bestSubsets = makeBestSubsetsResult(
    [
      makeSubset(['Shift'], 0.34, new Map()),
      makeSubset(['Head'], 0.28, new Map()),
      makeSubset(['Head', 'Shift'], 0.52, new Map()),
    ],
    50
  );

  it('uses Best Subsets R-squared-adj for combined factors instead of naive sum', () => {
    const questions = [
      makeQuestion({ id: 'q1', factor: 'Shift', evidence: { etaSquared: 0.34 } }),
      makeQuestion({ id: 'q2', factor: 'Head', evidence: { etaSquared: 0.28 } }),
    ];
    const hub = makeHub({ id: 'h1', questionIds: ['q1', 'q2'] });

    const evidence = computeHubEvidence(hub, questions, bestSubsets);

    expect(evidence.contribution.value).toBeCloseTo(0.52);
    expect(evidence.contribution.label).toBe('R²adj');
    expect(evidence.contribution.description).toContain('52%');
  });

  it('falls back to capped evidence sums and partial factor matches', () => {
    const questions = [
      makeQuestion({ id: 'q1', factor: 'Shift', evidence: { etaSquared: 0.34 } }),
      makeQuestion({ id: 'q2', factor: 'Head', evidence: { etaSquared: 0.28 } }),
      makeQuestion({ id: 'q3', factor: 'Batch' }),
    ];
    const hub = makeHub({ id: 'h1', questionIds: ['q1', 'q2', 'q3'] });

    expect(computeHubEvidence(hub, questions, null).contribution.value).toBeCloseTo(0.62);
    expect(computeHubEvidence(hub, questions, bestSubsets).contribution.value).toBeCloseTo(0.52);
  });

  it('deduplicates duplicate factors when computing evidence', () => {
    const duplicateFactorQuestions = [
      makeQuestion({ id: 'q1', factor: 'Shift', evidence: { etaSquared: 0.34 } }),
      makeQuestion({ id: 'q2', factor: 'Shift', evidence: { etaSquared: 0.28 } }),
    ];
    const duplicateHub = makeHub({ id: 'h1', questionIds: ['q1', 'q2'] });

    expect(
      computeHubEvidence(duplicateHub, duplicateFactorQuestions, bestSubsets).contribution.value
    ).toBeCloseTo(0.34);
  });
});

// ---------------------------------------------------------------------------
// Tests: computeHubProjection
// ---------------------------------------------------------------------------

describe('computeHubProjection', () => {
  it('returns projection when factors match (nominal default)', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.4 },
      }),
      makeQuestion({
        id: 'q2',
        factor: 'Shift',
        status: 'answered',
        evidence: { rSquaredAdj: 0.15 },
      }),
    ];

    const hub = makeHub({
      id: 'hub1',
      questionIds: ['q1', 'q2'],
    });

    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
    ]);
    const shiftEffects = new Map([
      ['Day', 3],
      ['Night', -3],
    ]);
    const subset = makeSubset(
      ['Machine', 'Shift'],
      0.55,
      new Map([
        ['Machine', machineEffects],
        ['Shift', shiftEffects],
      ])
    );

    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      questions,
      bsr,
      { Machine: 'M2', Shift: 'Night' } // worst levels
    );

    expect(projection).not.toBeNull();
    expect(projection!.rSquaredAdj).toBeCloseTo(0.55, 5);
    expect(projection!.currentMean).toBeDefined();
    expect(projection!.predictedMean).toBeDefined();
    // Nominal default: picks levels closest to zero effect
    expect(projection!.predictedMeanDelta).not.toBe(0);
    expect(projection!.label).toBe('Model suggests');
    expect(projection!.levelChanges.length).toBe(2);
  });

  it('smaller-is-better: best target = level with lowest (most negative) effect', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.4 },
      }),
    ];

    const hub = makeHub({ id: 'hub1', questionIds: ['q1'] });

    // M1 effect = +5, M2 effect = -5, M3 effect = 0
    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
      ['M3', 0],
    ]);
    const subset = makeSubset(['Machine'], 0.4, new Map([['Machine', machineEffects]]));

    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      questions,
      bsr,
      { Machine: 'M1' }, // current worst = highest effect
      { characteristicType: 'smaller' }
    );

    expect(projection).not.toBeNull();
    // For smaller-is-better, best level is M2 (effect = -5, lowest predicted mean)
    const machineChange = projection!.levelChanges.find(lc => lc.factor === 'Machine');
    expect(machineChange).toBeDefined();
    expect(machineChange!.to).toBe('M2');
    // Should move mean down: predictedMeanDelta should be negative
    expect(projection!.predictedMeanDelta).toBeLessThan(0);
  });

  it('larger-is-better: best target = level with highest (most positive) effect', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.4 },
      }),
    ];

    const hub = makeHub({ id: 'hub1', questionIds: ['q1'] });

    // M1 effect = +5, M2 effect = -5, M3 effect = 0
    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
      ['M3', 0],
    ]);
    const subset = makeSubset(['Machine'], 0.4, new Map([['Machine', machineEffects]]));

    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      questions,
      bsr,
      { Machine: 'M2' }, // current worst = lowest effect
      { characteristicType: 'larger' }
    );

    expect(projection).not.toBeNull();
    // For larger-is-better, best level is M1 (effect = +5, highest predicted mean)
    const machineChange = projection!.levelChanges.find(lc => lc.factor === 'Machine');
    expect(machineChange).toBeDefined();
    expect(machineChange!.to).toBe('M1');
    // Should move mean up: predictedMeanDelta should be positive
    expect(projection!.predictedMeanDelta).toBeGreaterThan(0);
  });

  it('nominal: best target = level with effect closest to zero', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.4 },
      }),
    ];

    const hub = makeHub({ id: 'hub1', questionIds: ['q1'] });

    // M1 effect = +5, M2 effect = -5, M3 effect = +1 (closest to zero)
    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
      ['M3', 1],
    ]);
    const subset = makeSubset(['Machine'], 0.4, new Map([['Machine', machineEffects]]));

    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      questions,
      bsr,
      { Machine: 'M1' }, // current worst
      { characteristicType: 'nominal' }
    );

    expect(projection).not.toBeNull();
    // For nominal, best level is M3 (effect = +1, closest to zero / grand mean)
    const machineChange = projection!.levelChanges.find(lc => lc.factor === 'Machine');
    expect(machineChange).toBeDefined();
    expect(machineChange!.to).toBe('M3');
  });

  it('returns null when bestSubsetsResult is null', () => {
    const questions = [makeQuestion({ id: 'q1', factor: 'Machine' })];
    const hub = makeHub({ id: 'hub1', questionIds: ['q1'] });

    const result = computeHubProjection(hub, questions, null, { Machine: 'M1' });
    expect(result).toBeNull();
  });

  it('returns null when no factors match', () => {
    const questions = [makeQuestion({ id: 'q1', factor: 'Operator' })];
    const hub = makeHub({ id: 'hub1', questionIds: ['q1'] });

    // Subset only has Machine, not Operator
    const subset = makeSubset(
      ['Machine'],
      0.4,
      new Map([
        [
          'Machine',
          new Map([
            ['M1', 5],
            ['M2', -5],
          ]),
        ],
      ])
    );
    const bsr = makeBestSubsetsResult([subset], 100);

    const result = computeHubProjection(hub, questions, bsr, { Operator: 'Alice' });
    expect(result).toBeNull();
  });

  it('returns null when currentWorstLevels missing for a factor', () => {
    const questions = [makeQuestion({ id: 'q1', factor: 'Machine' })];
    const hub = makeHub({ id: 'hub1', questionIds: ['q1'] });

    const subset = makeSubset(
      ['Machine'],
      0.4,
      new Map([
        [
          'Machine',
          new Map([
            ['M1', 5],
            ['M2', -5],
          ]),
        ],
      ])
    );
    const bsr = makeBestSubsetsResult([subset], 100);

    // Empty currentWorstLevels → missing Machine level
    const result = computeHubProjection(hub, questions, bsr, {});
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: detectEvidenceClusters
// ---------------------------------------------------------------------------

describe('detectEvidenceClusters', () => {
  it('finds clusters from answered questions sharing a factor', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.3 },
        linkedFindingIds: ['f1'],
      }),
      makeQuestion({
        id: 'q2',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.2 },
        linkedFindingIds: ['f2'],
      }),
      makeQuestion({
        id: 'q3',
        factor: 'Shift',
        status: 'answered',
        evidence: { rSquaredAdj: 0.1 },
      }),
    ];

    const clusters = detectEvidenceClusters(questions, [], []);

    // Machine has 2 answered questions → cluster
    expect(clusters.length).toBe(1);
    expect(clusters[0].factors).toEqual(['Machine']);
    expect(clusters[0].questionIds).toEqual(['q1', 'q2']);
    expect(clusters[0].findingIds).toContain('f1');
    expect(clusters[0].findingIds).toContain('f2');
    expect(clusters[0].rSquaredAdj).toBeCloseTo(0.5, 5);
  });

  it('excludes factors already covered by existing hubs', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.3 },
      }),
      makeQuestion({
        id: 'q2',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.2 },
      }),
      makeQuestion({
        id: 'q3',
        factor: 'Shift',
        status: 'answered',
        evidence: { rSquaredAdj: 0.1 },
      }),
      makeQuestion({
        id: 'q4',
        factor: 'Shift',
        status: 'investigating',
        evidence: { rSquaredAdj: 0.15 },
      }),
    ];

    // Hub already covers Machine via q1
    const existingHubs = [makeHub({ id: 'hub1', questionIds: ['q1'] })];

    const clusters = detectEvidenceClusters(questions, [], existingHubs);

    // Machine is covered by hub → excluded. Shift has 2 questions → cluster
    expect(clusters.length).toBe(1);
    expect(clusters[0].factors).toEqual(['Shift']);
  });

  it('returns empty when no factor has 2+ questions', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.3 },
      }),
      makeQuestion({
        id: 'q2',
        factor: 'Shift',
        status: 'answered',
        evidence: { rSquaredAdj: 0.1 },
      }),
    ];

    const clusters = detectEvidenceClusters(questions, [], []);
    expect(clusters).toEqual([]);
  });

  it('sorts clusters by combined R²adj descending', () => {
    const questions: Question[] = [
      makeQuestion({
        id: 'q1',
        factor: 'Shift',
        status: 'answered',
        evidence: { rSquaredAdj: 0.05 },
      }),
      makeQuestion({
        id: 'q2',
        factor: 'Shift',
        status: 'answered',
        evidence: { rSquaredAdj: 0.05 },
      }),
      makeQuestion({
        id: 'q3',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.3 },
      }),
      makeQuestion({
        id: 'q4',
        factor: 'Machine',
        status: 'answered',
        evidence: { rSquaredAdj: 0.2 },
      }),
    ];

    const clusters = detectEvidenceClusters(questions, [], []);
    expect(clusters.length).toBe(2);
    expect(clusters[0].factors).toEqual(['Machine']); // Higher combined R²adj
    expect(clusters[1].factors).toEqual(['Shift']);
  });
});
