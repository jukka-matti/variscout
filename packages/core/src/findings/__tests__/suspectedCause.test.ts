import { describe, it, expect } from 'vitest';
import { createSuspectedCause } from '../factories';
import { computeHubContribution, migrateCauseRolesToHubs } from '../helpers';
import type { Question, SuspectedCause } from '../types';

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
