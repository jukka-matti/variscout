import { describe, it, expect } from 'vitest';
import { createSuspectedCause } from '../factories';
import { computeHubContribution, computeHubEvidence, migrateCauseRolesToHubs } from '../helpers';
import type { Question, SuspectedCause, FindingComment } from '../types';
import type { BestSubsetsResult } from '../../stats/bestSubsets';
import type { HypothesisCondition } from '../hypothesisCondition';

describe('createSuspectedCause', () => {
  it('should create a hub with name, synthesis, and connected IDs', () => {
    const hub = createSuspectedCause(
      'Nozzle wear on night shift',
      'Worn nozzles overheat during long night runs',
      ['q1', 'q2'],
      ['f1']
    );
    expect(hub.id).toBeTruthy();
    expect(hub.name).toBe('Nozzle wear on night shift');
    expect(hub.synthesis).toBe('Worn nozzles overheat during long night runs');
    expect(hub.questionIds).toEqual(['q1', 'q2']);
    expect(hub.findingIds).toEqual(['f1']);
    expect(hub.status).toBe('suspected');
    expect(hub.createdAt).toBeTruthy();
    expect(hub.updatedAt).toBeTruthy();
  });

  it('should default to empty arrays', () => {
    const hub = createSuspectedCause('Test', '');
    expect(hub.questionIds).toEqual([]);
    expect(hub.findingIds).toEqual([]);
  });
});

describe('computeHubContribution', () => {
  const makeQuestion = (id: string, eta?: number, rSq?: number): Question => ({
    id,
    text: '',
    status: 'answered',
    linkedFindingIds: [],
    createdAt: '',
    updatedAt: '',
    evidence: { etaSquared: eta, rSquaredAdj: rSq },
  });

  it('should sum etaSquared from connected questions', () => {
    const questions = [makeQuestion('q1', 0.34), makeQuestion('q2', 0.22)];
    const hub: SuspectedCause = {
      id: 'h1',
      name: '',
      synthesis: '',
      questionIds: ['q1', 'q2'],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    expect(computeHubContribution(hub, questions)).toBeCloseTo(0.56);
  });

  it('should fall back to rSquaredAdj when etaSquared missing', () => {
    const questions = [makeQuestion('q1', undefined, 0.47)];
    const hub: SuspectedCause = {
      id: 'h1',
      name: '',
      synthesis: '',
      questionIds: ['q1'],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    expect(computeHubContribution(hub, questions)).toBeCloseTo(0.47);
  });

  it('should return 0 for hub with no connected questions', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: '',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    expect(computeHubContribution(hub, [])).toBe(0);
  });

  it('should skip questions not in the hub', () => {
    const questions = [makeQuestion('q1', 0.34), makeQuestion('q2', 0.22)];
    const hub: SuspectedCause = {
      id: 'h1',
      name: '',
      synthesis: '',
      questionIds: ['q1'],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    expect(computeHubContribution(hub, questions)).toBeCloseTo(0.34);
  });
});

describe('migrateCauseRolesToHubs', () => {
  const makeQuestion = (
    id: string,
    factor: string,
    causeRole: string,
    findingIds: string[] = []
  ): Question => ({
    id,
    text: `${factor} matters`,
    status: 'answered',
    factor,
    causeRole: causeRole as 'suspected-cause' | 'contributing' | 'ruled-out',
    evidence: { etaSquared: 0.3 },
    linkedFindingIds: findingIds,
    createdAt: '',
    updatedAt: '',
  });

  it('should create individual hubs for suspected-cause questions', () => {
    const questions = [
      makeQuestion('q1', 'Shift', 'suspected-cause', ['f1']),
      makeQuestion('q2', 'Head', 'suspected-cause'),
    ];
    const hubs = migrateCauseRolesToHubs(questions);
    expect(hubs).toHaveLength(2);
    expect(hubs[0].name).toBe('Shift');
    expect(hubs[0].questionIds).toEqual(['q1']);
    expect(hubs[0].findingIds).toEqual(['f1']);
    expect(hubs[1].name).toBe('Head');
  });

  it('should skip ruled-out and contributing questions', () => {
    const questions = [
      makeQuestion('q1', 'Shift', 'suspected-cause'),
      makeQuestion('q2', 'Batch', 'ruled-out'),
      makeQuestion('q3', 'Temp', 'contributing'),
    ];
    const hubs = migrateCauseRolesToHubs(questions);
    expect(hubs).toHaveLength(1);
    expect(hubs[0].name).toBe('Shift');
  });

  it('should return empty array when no suspected causes', () => {
    expect(migrateCauseRolesToHubs([])).toEqual([]);
  });

  it('should skip questions without a factor', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'test',
        status: 'answered',
        causeRole: 'suspected-cause',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    expect(migrateCauseRolesToHubs(questions)).toEqual([]);
  });
});

describe('computeHubEvidence', () => {
  const makeQuestion = (id: string, factor: string, eta?: number, rSq?: number): Question => ({
    id,
    text: '',
    status: 'answered',
    factor,
    linkedFindingIds: [],
    createdAt: '',
    updatedAt: '',
    evidence: { etaSquared: eta, rSquaredAdj: rSq },
  });

  const makeHub = (questionIds: string[]): SuspectedCause => ({
    id: 'h1',
    name: 'Test',
    synthesis: '',
    questionIds,
    findingIds: [],
    status: 'suspected',
    createdAt: '',
    updatedAt: '',
  });

  const bestSubsets: BestSubsetsResult = {
    subsets: [
      {
        factors: ['Shift'],
        factorCount: 1,
        rSquared: 0.35,
        rSquaredAdj: 0.34,
        fStatistic: 10,
        pValue: 0.001,
        isSignificant: true,
        dfModel: 1,
      },
      {
        factors: ['Head'],
        factorCount: 1,
        rSquared: 0.29,
        rSquaredAdj: 0.28,
        fStatistic: 8,
        pValue: 0.004,
        isSignificant: true,
        dfModel: 1,
      },
      {
        factors: ['Head', 'Shift'],
        factorCount: 2,
        rSquared: 0.53,
        rSquaredAdj: 0.52,
        fStatistic: 18,
        pValue: 0.0001,
        isSignificant: true,
        dfModel: 3,
      },
    ],
    n: 300,
    totalFactors: 2,
    factorNames: ['Shift', 'Head'],
    grandMean: 50,
    ssTotal: 1000,
  };

  it('should use Best Subsets R²adj for combined factors', () => {
    const questions = [makeQuestion('q1', 'Shift', 0.34), makeQuestion('q2', 'Head', 0.28)];
    const hub = makeHub(['q1', 'q2']);
    const evidence = computeHubEvidence(hub, questions, bestSubsets);
    // Should use the combined subset (52%), not naive sum (62%)
    expect(evidence.contribution.value).toBeCloseTo(0.52);
    expect(evidence.contribution.label).toBe('R²adj');
    expect(evidence.contribution.description).toContain('52%');
    expect(evidence.mode).toBe('standard');
  });

  it('should fall back to capped sum when no Best Subsets result', () => {
    const questions = [makeQuestion('q1', 'Shift', 0.34), makeQuestion('q2', 'Head', 0.28)];
    const hub = makeHub(['q1', 'q2']);
    const evidence = computeHubEvidence(hub, questions, null);
    // Naive sum = 0.62, capped at 1.0
    expect(evidence.contribution.value).toBeCloseTo(0.62);
  });

  it('should use partial match when exact combination not found', () => {
    const questions = [
      makeQuestion('q1', 'Shift', 0.34),
      makeQuestion('q2', 'Head', 0.28),
      makeQuestion('q3', 'Batch'),
    ];
    const hub = makeHub(['q1', 'q2', 'q3']);
    // No 3-factor subset exists — should use best matching 2-factor subset
    const evidence = computeHubEvidence(hub, questions, bestSubsets);
    expect(evidence.contribution.value).toBeCloseTo(0.52);
  });

  it('should handle hub with no factor-linked questions', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'gemba check',
        status: 'answered',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    const hub = makeHub(['q1']);
    const evidence = computeHubEvidence(hub, questions, bestSubsets);
    expect(evidence.contribution.value).toBe(0);
  });

  it('should accept mode parameter', () => {
    const hub = makeHub([]);
    const evidence = computeHubEvidence(hub, [], null, 'yamazumi');
    expect(evidence.mode).toBe('yamazumi');
  });

  it('should dedup duplicate factors in hub', () => {
    const questions = [
      makeQuestion('q1', 'Shift', 0.34),
      makeQuestion('q2', 'Shift', 0.28), // same factor!
    ];
    const hub = makeHub(['q1', 'q2']);
    const evidence = computeHubEvidence(hub, questions, bestSubsets, 'standard');
    // Should find ['Shift'] (deduped) → match single-factor subset
    expect(evidence.contribution.value).toBeCloseTo(0.34);
  });

  it('should use lean evidence for yamazumi mode (no Best Subsets)', () => {
    const questions = [makeQuestion('q1', 'Step', 0.42)];
    const hub = makeHub(['q1']);
    const evidence = computeHubEvidence(hub, questions, bestSubsets, 'yamazumi');
    // Should NOT use Best Subsets even though it's provided
    expect(evidence.contribution.value).toBeCloseTo(0.42);
    expect(evidence.contribution.label).toBe('Waste %');
    expect(evidence.mode).toBe('yamazumi');
  });
});

describe('SuspectedCause optional Wall fields', () => {
  it('accepts an undefined condition (default for existing hubs)', () => {
    const hub: SuspectedCause = {
      id: 'hub-1',
      name: 'Nozzle runs hot',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    };
    expect(hub.condition).toBeUndefined();
  });

  it('accepts a condition predicate tree', () => {
    const condition: HypothesisCondition = {
      kind: 'and',
      children: [
        { kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' },
        { kind: 'leaf', column: 'NOZZLE.TEMP', op: 'gt', value: 120 },
      ],
    };
    const hub: SuspectedCause = {
      id: 'hub-2',
      name: 'Hot nozzle night shift',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      condition,
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    };
    expect(hub.condition?.kind).toBe('and');
  });

  it('accepts tributaryIds and comments', () => {
    const comment: FindingComment = {
      id: 'c-1',
      text: 'H1 looks tight',
      createdAt: Date.now(),
    };
    const hub: SuspectedCause = {
      id: 'hub-3',
      name: 'Low viscosity',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      tributaryIds: ['trib-123'],
      comments: [comment],
      createdAt: '2026-04-19T00:00:00.000Z',
      updatedAt: '2026-04-19T00:00:00.000Z',
    };
    expect(hub.tributaryIds).toEqual(['trib-123']);
    expect(hub.comments?.length).toBe(1);
  });
});
