import { describe, it, expect } from 'vitest';
import { evidenceTypesForHypothesis, hasUnresolvedDisconfirmation } from '../hypothesisEvidence';
import type { DisconfirmationAttempt, Finding, Hypothesis } from '../types';

const FINDINGS: Finding[] = [
  { id: 'f-1', evidenceType: 'data' } as Finding,
  { id: 'f-2', evidenceType: 'gemba' } as Finding,
  { id: 'f-3', evidenceType: 'data' } as Finding,
  { id: 'f-4', evidenceType: 'expert' } as Finding,
];

describe('evidenceTypesForHypothesis', () => {
  it('returns distinct evidence types from linked findings', () => {
    const h = { findingIds: ['f-1', 'f-2'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, FINDINGS);
    expect(types).toEqual(new Set(['data', 'gemba']));
  });

  it('collapses duplicate evidence types into a single entry', () => {
    const h = { findingIds: ['f-1', 'f-3'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, FINDINGS);
    expect(types).toEqual(new Set(['data']));
    expect(types.size).toBe(1);
  });

  it('returns empty set when hypothesis has no linked findings', () => {
    const h = { findingIds: [] } as unknown as Hypothesis;
    const types = evidenceTypesForHypothesis(h, FINDINGS);
    expect(types.size).toBe(0);
  });

  it('skips finding ids that are not in the provided findings list', () => {
    const h = { findingIds: ['f-1', 'unknown-id'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, FINDINGS);
    expect(types).toEqual(new Set(['data']));
  });

  it('returns all three types when triangulated', () => {
    const h = { findingIds: ['f-1', 'f-2', 'f-4'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, FINDINGS);
    expect(types).toEqual(new Set(['data', 'gemba', 'expert']));
  });

  it('excludes inconclusive findings from the evidence-type set (honesty rule)', () => {
    // A null evaluate result (validationStatus: 'inconclusive') is NOT evidence —
    // an inconclusive `data` finding + one `gemba` finding must count as a SINGLE
    // type, never two, so the hypothesis stays `evidenced`.
    const findings: Finding[] = [
      { id: 'f-1', evidenceType: 'data', validationStatus: 'inconclusive' } as Finding,
      { id: 'f-2', evidenceType: 'gemba' } as Finding,
    ];
    const h = { findingIds: ['f-1', 'f-2'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, findings);
    expect(types).toEqual(new Set(['gemba']));
  });

  it('counts supports + legacy(undefined) findings, skips only inconclusive', () => {
    const findings: Finding[] = [
      { id: 'f-1', evidenceType: 'data', validationStatus: 'supports' } as Finding,
      { id: 'f-2', evidenceType: 'gemba' } as Finding, // legacy: no validationStatus
      { id: 'f-3', evidenceType: 'expert', validationStatus: 'inconclusive' } as Finding,
    ];
    const h = { findingIds: ['f-1', 'f-2', 'f-3'] } as Hypothesis;
    const types = evidenceTypesForHypothesis(h, findings);
    expect(types).toEqual(new Set(['data', 'gemba']));
  });
});

describe('hasUnresolvedDisconfirmation', () => {
  it('returns false when no disconfirmation attempts recorded', () => {
    const h = { disconfirmationAttempts: [] } as unknown as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(false);
  });

  it('returns false when disconfirmationAttempts is absent', () => {
    const h = {} as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(false);
  });

  it('returns true when an attempt exists with verdict pending', () => {
    const attempt: DisconfirmationAttempt = {
      id: 'd-1',
      attemptedAt: '2026-05-09T00:00:00.000Z',
      attemptedBy: { displayName: 'Analyst' },
      description: 'Run gemba walk on night shift',
      verdict: 'pending',
      linkedFindingIds: [],
    };
    const h = { disconfirmationAttempts: [attempt] } as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(true);
  });

  it('returns false when all attempts are resolved (survived/refuted)', () => {
    const attempts: DisconfirmationAttempt[] = [
      {
        id: 'd-1',
        attemptedAt: '2026-05-09T00:00:00.000Z',
        attemptedBy: { displayName: 'Analyst' },
        description: 'Gemba walk',
        verdict: 'survived',
        linkedFindingIds: [],
      },
      {
        id: 'd-2',
        attemptedAt: '2026-05-10T00:00:00.000Z',
        attemptedBy: { displayName: 'Analyst' },
        description: 'Alt-cause analysis',
        verdict: 'refuted',
        linkedFindingIds: [],
      },
    ];
    const h = { disconfirmationAttempts: attempts } as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(false);
  });

  it('returns true if any attempt is pending even when others are resolved', () => {
    const attempts: DisconfirmationAttempt[] = [
      {
        id: 'd-1',
        attemptedAt: '2026-05-09T00:00:00.000Z',
        attemptedBy: { displayName: 'Analyst' },
        description: 'Gemba walk',
        verdict: 'survived',
        linkedFindingIds: [],
      },
      {
        id: 'd-2',
        attemptedAt: '2026-05-10T00:00:00.000Z',
        attemptedBy: { displayName: 'Analyst' },
        description: 'Follow-up gemba walk',
        verdict: 'pending',
        linkedFindingIds: [],
      },
    ];
    const h = { disconfirmationAttempts: attempts } as Hypothesis;
    expect(hasUnresolvedDisconfirmation(h)).toBe(true);
  });
});
