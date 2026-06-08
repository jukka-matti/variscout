import { describe, it, expect } from 'vitest';
import { createFinding } from '@variscout/core/findings';
import {
  selectFindingsForScope,
  selectHubCommentStream,
  selectHypothesisTributaries,
} from '../wallSelectors';
import type { Hypothesis, Finding, FindingComment } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

function fc(id: string, text: string, createdAt: number): FindingComment {
  return {
    id,
    text,
    createdAt,
    deletedAt: null,
    parentId: 'hub-default',
    parentKind: 'hypothesis',
  };
}

function finding(id: string, scopeId?: string) {
  const base = { ...createFinding(id, {}, null), id };
  return scopeId ? { ...base, scopeId } : base;
}

describe('selectHubCommentStream', () => {
  it('merges hub comments and linked-finding comments chronologically', () => {
    const hubComment = fc('hc1', 'hub talk', 2000);
    const fComment1 = fc('fc1', 'chart note A', 1000);
    const fComment2 = fc('fc2', 'chart note B', 3000);

    const hub: Hypothesis = {
      id: 'h1',
      name: 'H1',
      synthesis: '',
      findingIds: ['f1'],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      comments: [hubComment],
    };
    const f1: Finding = {
      id: 'f1',
      text: '',
      createdAt: 0,
      deletedAt: null,
      context: { activeFilters: {}, cumulativeScope: null },
      status: 'observed',
      comments: [fComment1, fComment2],
      statusChangedAt: 0,
      evidenceType: 'data',
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
    const hub: Hypothesis = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      findingIds: [],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      tributaryIds: ['t2'],
    };
    const result = selectHypothesisTributaries(hub, [], processMap);
    expect(result.map(t => t.id)).toEqual(['t2']);
  });

  it('returns empty when neither tributaryIds nor finding columns provided', () => {
    const hub: Hypothesis = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      findingIds: [],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };
    const result = selectHypothesisTributaries(hub, [], processMap);
    expect(result).toEqual([]);
  });

  it('derives tributaries from findings context filters', () => {
    const hub: Hypothesis = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      findingIds: ['f1'],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
    };
    const f1: Finding = {
      id: 'f1',
      text: '',
      createdAt: 0,
      deletedAt: null,
      context: {
        activeFilters: { SHIFT: ['night'] },
        cumulativeScope: null,
      },
      status: 'observed',
      comments: [],
      statusChangedAt: 0,
      evidenceType: 'data',
    };
    const result = selectHypothesisTributaries(hub, [f1], processMap);
    expect(result.map(t => t.id)).toEqual(['t1']);
  });

  it('returns empty when processMap is undefined', () => {
    const hub: Hypothesis = {
      id: 'h1',
      name: 'h',
      synthesis: '',
      findingIds: [],
      status: 'proposed',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      tributaryIds: ['t2'],
    };
    const result = selectHypothesisTributaries(hub, [], undefined);
    expect(result).toEqual([]);
  });
});

describe('wallSelectors — relocation assertions (ADR-085)', () => {
  it('selectOpenQuestionsWithoutHub is not exported (Questions retired in ADR-085)', async () => {
    const mod = await import('../wallSelectors');
    expect('selectOpenQuestionsWithoutHub' in mod).toBe(false);
  });

  it('selectQuestionsForHub is not exported (Questions retired in ADR-085)', async () => {
    const mod = await import('../wallSelectors');
    expect('selectQuestionsForHub' in mod).toBe(false);
  });
});

describe('wallSelectors - scope findings', () => {
  it('returns every finding when no active scope is selected', () => {
    const findings = [
      finding('scope-a', 'scope-a'),
      finding('scope-b', 'scope-b'),
      finding('loose'),
    ];

    expect(selectFindingsForScope(findings, undefined).map(f => f.id)).toEqual([
      'scope-a',
      'scope-b',
      'loose',
    ]);
  });

  it('returns only findings stamped with the active scope id', () => {
    const findings = [
      finding('scope-a-1', 'scope-a'),
      finding('scope-a-2', 'scope-a'),
      finding('scope-b', 'scope-b'),
      finding('loose'),
    ];

    expect(selectFindingsForScope(findings, 'scope-a').map(f => f.id)).toEqual([
      'scope-a-1',
      'scope-a-2',
    ]);
  });

  it('excludes unscoped findings while a scope is active', () => {
    const findings = [finding('loose'), finding('scoped', 'scope-a')];

    expect(selectFindingsForScope(findings, 'scope-a').map(f => f.id)).toEqual(['scoped']);
  });

  it('excludes findings from other scopes while a scope is active', () => {
    const findings = [finding('scope-b', 'scope-b'), finding('scope-c', 'scope-c')];

    expect(selectFindingsForScope(findings, 'scope-a')).toEqual([]);
  });
});
