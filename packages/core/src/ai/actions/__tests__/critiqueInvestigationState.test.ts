import { describe, it, expect } from 'vitest';
import { critiqueInvestigationState } from '../critiqueInvestigationState';
import type { SuspectedCause, Question, Finding } from '@variscout/core';

function hub(id: string, findingIds: string[], questionIds: string[] = []): SuspectedCause {
  return {
    id,
    name: id,
    synthesis: '',
    questionIds,
    findingIds,
    status: 'suspected',
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

function question(
  id: string,
  status: Question['status'] = 'open',
  linkedFindingIds: string[] = []
): Question {
  return {
    id,
    text: id,
    status,
    linkedFindingIds,
    createdAt: '2026-04-19T00:00:00Z',
    updatedAt: '2026-04-19T00:00:00Z',
  };
}

function finding(id: string, validationStatus?: Finding['validationStatus']): Finding {
  return {
    id,
    text: '',
    createdAt: Date.now(),
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    validationStatus,
  };
}

describe('critiqueInvestigationState', () => {
  it('flags hubs with 3+ findings and no contradictor as missing disconfirmation', () => {
    const hubs = [hub('h1', ['f1', 'f2', 'f3'])];
    const findings = [finding('f1'), finding('f2'), finding('f3')];
    const result = critiqueInvestigationState({ hubs, questions: [], findings });
    expect(result.gaps.some(g => g.kind === 'missing-disconfirmation' && g.hubId === 'h1')).toBe(
      true
    );
  });

  it('does not flag hubs that already have a contradictor', () => {
    const hubs = [hub('h1', ['f1', 'f2', 'f3'])];
    const findings = [finding('f1'), finding('f2'), finding('f3', 'contradicts')];
    const result = critiqueInvestigationState({ hubs, questions: [], findings });
    expect(result.gaps.some(g => g.kind === 'missing-disconfirmation' && g.hubId === 'h1')).toBe(
      false
    );
  });

  it('flags hubs with no linked questions', () => {
    const hubs = [hub('h1', ['f1'], /* no questions */ [])];
    const findings = [finding('f1')];
    const result = critiqueInvestigationState({ hubs, questions: [], findings });
    expect(result.gaps.some(g => g.kind === 'hub-without-question' && g.hubId === 'h1')).toBe(true);
  });

  it('flags orphan open questions not linked to any hub', () => {
    const hubs: SuspectedCause[] = [];
    const questions = [question('q1'), question('q2', 'answered')];
    const result = critiqueInvestigationState({ hubs, questions, findings: [] });
    // q1 is open and orphan; q2 is answered (not orphan-flaggable).
    expect(result.gaps.filter(g => g.kind === 'orphan-question').length).toBe(1);
  });

  it('flags stale open questions older than 7 days', () => {
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const freshDate = new Date().toISOString();
    const questions: Question[] = [
      { ...question('qStale'), createdAt: staleDate, updatedAt: staleDate },
      { ...question('qFresh'), createdAt: freshDate, updatedAt: freshDate },
    ];
    const result = critiqueInvestigationState({ hubs: [], questions, findings: [] });
    expect(result.gaps.some(g => g.kind === 'stale-question' && g.questionId === 'qStale')).toBe(
      true
    );
    expect(result.gaps.some(g => g.kind === 'stale-question' && g.questionId === 'qFresh')).toBe(
      false
    );
  });

  it('returns empty gaps array for clean investigation', () => {
    const result = critiqueInvestigationState({ hubs: [], questions: [], findings: [] });
    expect(result.gaps).toEqual([]);
  });
});
