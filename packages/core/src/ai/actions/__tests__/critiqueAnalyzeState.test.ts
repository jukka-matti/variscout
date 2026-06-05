import { describe, it, expect } from 'vitest';
import { critiqueAnalyzeState } from '../critiqueAnalyzeState';
import type { Hypothesis, Finding } from '@variscout/core';

const FIXED_NOW = Date.parse('2026-04-19T00:00:00Z');

function hub(id: string, findingIds: string[]): Hypothesis {
  return {
    id,
    name: id,
    synthesis: '',
    findingIds,
    status: 'proposed',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    deletedAt: null,
  };
}

function finding(id: string, validationStatus?: Finding['validationStatus']): Finding {
  return {
    id,
    text: '',
    createdAt: FIXED_NOW,
    deletedAt: null,
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    comments: [],
    statusChangedAt: FIXED_NOW,
    validationStatus,
  };
}

/**
 * critiqueAnalyzeState tests — ADR-085 updated interface:
 * - Input: { hubs: Hypothesis[], findings: Finding[], now?: number }
 * - Output: { hypothesesWithoutEvidence: string[], orphanFindings: [...], staleFindings: [...] }
 * (No questions, no gaps array)
 */
describe('critiqueAnalyzeState', () => {
  it('flags hypotheses with no linked findings (hypothesesWithoutEvidence)', () => {
    const hubs = [hub('h1', [])]; // no findings linked
    const result = critiqueAnalyzeState({ hubs, findings: [] });
    expect(result.hypothesesWithoutEvidence).toContain('h1');
  });

  it('does not flag hypotheses that have linked findings', () => {
    const hubs = [hub('h1', ['f1'])];
    const result = critiqueAnalyzeState({ hubs, findings: [finding('f1')] });
    expect(result.hypothesesWithoutEvidence).not.toContain('h1');
  });

  it('flags orphan findings not linked to any hypothesis', () => {
    const hubs: Hypothesis[] = [];
    const findings = [finding('f1'), finding('f2')];
    const result = critiqueAnalyzeState({ hubs, findings });
    expect(result.orphanFindings.some(g => g.findingId === 'f1')).toBe(true);
    expect(result.orphanFindings.some(g => g.findingId === 'f2')).toBe(true);
    expect(result.orphanFindings[0].kind).toBe('orphan-finding');
  });

  it('does not flag findings that are linked to a hub', () => {
    const hubs = [hub('h1', ['f1'])];
    const findings = [finding('f1'), finding('f2')];
    const result = critiqueAnalyzeState({ hubs, findings });
    // f1 is linked → not orphan; f2 is unlinked → orphan
    expect(result.orphanFindings.some(g => g.findingId === 'f1')).toBe(false);
    expect(result.orphanFindings.some(g => g.findingId === 'f2')).toBe(true);
  });

  it('flags stale findings (observed/investigating) older than 14 days', () => {
    const staleTs = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const freshTs = Date.now();
    const staleFinding: Finding = {
      ...finding('fStale'),
      status: 'observed',
      createdAt: staleTs,
    };
    const freshFinding: Finding = {
      ...finding('fFresh'),
      status: 'observed',
      createdAt: freshTs,
    };
    const result = critiqueAnalyzeState({ hubs: [], findings: [staleFinding, freshFinding] });
    expect(result.staleFindings.some(g => g.findingId === 'fStale')).toBe(true);
    expect(result.staleFindings.some(g => g.findingId === 'fFresh')).toBe(false);
  });

  it('does not flag stale analyzed/improving/resolved findings', () => {
    const staleTs = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const analyzedFinding: Finding = {
      ...finding('fAnalyzed'),
      status: 'analyzed',
      createdAt: staleTs,
    };
    const result = critiqueAnalyzeState({ hubs: [], findings: [analyzedFinding] });
    expect(result.staleFindings.some(g => g.findingId === 'fAnalyzed')).toBe(false);
  });

  it('returns empty arrays for clean investigation', () => {
    const hubs = [hub('h1', ['f1'])];
    // Use current time so the finding isn't stale
    const freshFinding = {
      ...finding('f1'),
      status: 'analyzed' as Finding['status'],
      createdAt: Date.now(),
    };
    const result = critiqueAnalyzeState({ hubs, findings: [freshFinding] });
    expect(result.hypothesesWithoutEvidence).toHaveLength(0);
    expect(result.orphanFindings).toHaveLength(0);
    expect(result.staleFindings).toHaveLength(0);
  });

  it('returns all empty for empty inputs', () => {
    const result = critiqueAnalyzeState({ hubs: [], findings: [] });
    expect(result.hypothesesWithoutEvidence).toEqual([]);
    expect(result.orphanFindings).toEqual([]);
    expect(result.staleFindings).toEqual([]);
  });
});
