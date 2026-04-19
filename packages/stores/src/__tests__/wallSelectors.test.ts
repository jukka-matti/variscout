import { describe, it, expect } from 'vitest';
import {
  selectHubCommentStream,
  selectHypothesisTributaries,
  selectOpenQuestionsWithoutHub,
  selectQuestionsForHub,
} from '../wallSelectors';
import type { SuspectedCause, Finding, Question, FindingComment } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

function fc(id: string, text: string, createdAt: number): FindingComment {
  return { id, text, createdAt };
}

describe('selectHubCommentStream', () => {
  it('merges hub comments and linked-finding comments chronologically', () => {
    const hubComment = fc('hc1', 'hub talk', 2000);
    const fComment1 = fc('fc1', 'chart note A', 1000);
    const fComment2 = fc('fc2', 'chart note B', 3000);

    const hub: SuspectedCause = {
      id: 'h1',
      name: 'H1',
      synthesis: '',
      questionIds: [],
      findingIds: ['f1'],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
      comments: [hubComment],
    };
    const f1: Finding = {
      id: 'f1',
      text: '',
      createdAt: 0,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [fComment1, fComment2],
      statusChangedAt: 0,
    };

    const result = selectHubCommentStream('h1', [hub], [f1]);
    expect(result.map(c => c.id)).toEqual(['fc1', 'hc1', 'fc2']);
    expect(result[0].source).toBe('finding');
    expect(result[1].source).toBe('hub');
  });

  it('returns empty for unknown hub', () => {
    expect(selectHubCommentStream('missing', [], [])).toEqual([]);
  });
});

describe('selectHypothesisTributaries', () => {
  const processMap: ProcessMap = {
    version: 1,
    nodes: [
      { id: 'n1', name: 'Mix', order: 0 },
      { id: 'n2', name: 'Fill', order: 1 },
    ],
    tributaries: [
      { id: 't1', stepId: 'n1', column: 'SHIFT' },
      { id: 't2', stepId: 'n2', column: 'SUPPLIER' },
    ],
    createdAt: '',
    updatedAt: '',
  };

  it('prefers explicit tributaryIds when set', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
      tributaryIds: ['t2'],
    };
    const result = selectHypothesisTributaries(hub, [], processMap);
    expect(result.map(t => t.id)).toEqual(['t2']);
  });

  it('returns empty when neither tributaryIds nor finding columns provided', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    const result = selectHypothesisTributaries(hub, [], processMap);
    expect(result).toEqual([]);
  });

  it('derives tributaries from findings context filters', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      questionIds: [],
      findingIds: ['f1'],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
    };
    const f1: Finding = {
      id: 'f1',
      text: '',
      createdAt: 0,
      context: {
        activeFilters: { SHIFT: ['night'] },
        cumulativeScope: null,
      },
      status: 'observed',
      comments: [],
      statusChangedAt: 0,
    };
    const result = selectHypothesisTributaries(hub, [f1], processMap);
    expect(result.map(t => t.id)).toEqual(['t1']);
  });

  it('returns empty when processMap is undefined', () => {
    const hub: SuspectedCause = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      createdAt: '',
      updatedAt: '',
      tributaryIds: ['t2'],
    };
    const result = selectHypothesisTributaries(hub, [], undefined);
    expect(result).toEqual([]);
  });
});

describe('selectOpenQuestionsWithoutHub', () => {
  it('returns open questions not linked to any hub', () => {
    const hubs: SuspectedCause[] = [
      {
        id: 'h1',
        name: '',
        synthesis: '',
        questionIds: ['q1'],
        findingIds: [],
        status: 'suspected',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const questions: Question[] = [
      {
        id: 'q1',
        text: 'linked',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'q2',
        text: 'orphan',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'q3',
        text: 'answered',
        status: 'answered',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = selectOpenQuestionsWithoutHub(questions, hubs);
    expect(result.map(q => q.id)).toEqual(['q2']);
  });
});

describe('selectQuestionsForHub', () => {
  it('returns questions referenced by hub.questionIds', () => {
    const hubs: SuspectedCause[] = [
      {
        id: 'h1',
        name: '',
        synthesis: '',
        questionIds: ['q1', 'q2'],
        findingIds: [],
        status: 'suspected',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const questions: Question[] = [
      { id: 'q1', text: 'a', status: 'open', linkedFindingIds: [], createdAt: '', updatedAt: '' },
      {
        id: 'q2',
        text: 'b',
        status: 'investigating',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'q3',
        text: 'unused',
        status: 'open',
        linkedFindingIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = selectQuestionsForHub('h1', hubs, questions);
    expect(result.map(q => q.id)).toEqual(['q1', 'q2']);
  });

  it('returns empty for unknown hub', () => {
    expect(selectQuestionsForHub('missing', [], [])).toEqual([]);
  });
});
