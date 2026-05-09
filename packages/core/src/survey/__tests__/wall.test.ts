// survey/__tests__/wall.test.ts
import { describe, it, expect } from 'vitest';
import { deriveHypothesisStatus, surveyWallRules } from '../wall';
import type { Hypothesis, Finding } from '../../findings/types';

describe('deriveHypothesisStatus', () => {
  const baseH = (overrides: Partial<Hypothesis>): Hypothesis =>
    ({
      id: 'h',
      hubId: 'hub',
      investigationId: 'inv',
      name: '',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'proposed',
      createdAt: 0,
      deletedAt: null,
      updatedAt: 0,
      ...overrides,
    }) as Hypothesis;

  it('proposed when no findings', () => {
    expect(deriveHypothesisStatus(baseH({ findingIds: [] }), [])).toBe('proposed');
  });

  it('refuted when refuting findings exist', () => {
    const findings = [{ id: 'f1', evidenceType: 'data', refutes: true } as unknown as Finding];
    expect(deriveHypothesisStatus(baseH({ findingIds: ['f1'] }), findings)).toBe('refuted');
  });

  it('evidenced with 1 evidence type', () => {
    const findings = [{ id: 'f1', evidenceType: 'data' } as Finding];
    expect(deriveHypothesisStatus(baseH({ findingIds: ['f1'] }), findings)).toBe('evidenced');
  });

  it('needs-disconfirmation with 2 types but no disconfirmation attempt', () => {
    const findings = [
      { id: 'f1', evidenceType: 'data' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    expect(
      deriveHypothesisStatus(
        baseH({ findingIds: ['f1', 'f2'], disconfirmationAttempts: [] }),
        findings
      )
    ).toBe('needs-disconfirmation');
  });

  it('confirmed with 2 types and resolved disconfirmation', () => {
    const findings = [
      { id: 'f1', evidenceType: 'data' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    const h = baseH({
      findingIds: ['f1', 'f2'],
      disconfirmationAttempts: [
        {
          id: 'd1',
          verdict: 'survived',
          attemptedAt: '',
          description: '',
          attemptedBy: { displayName: '' },
          linkedFindingIds: [],
        },
      ],
    });
    expect(deriveHypothesisStatus(h, findings)).toBe('confirmed');
  });
});

describe('surveyWallRules', () => {
  it('emits no hints when no hypotheses', () => {
    const hints = surveyWallRules({ hub: {} as never, hypotheses: [], findings: [] });
    expect(hints).toHaveLength(0);
  });

  it('emits a triangulation-readiness hint for needs-disconfirmation hypothesis', () => {
    const hypotheses = [
      {
        id: 'h1',
        findingIds: ['f1', 'f2'],
        disconfirmationAttempts: [],
        status: 'proposed',
      } as unknown as Hypothesis,
    ];
    const findings = [
      { id: 'f1', evidenceType: 'data' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    const hints = surveyWallRules({ hub: {} as never, hypotheses, findings });
    expect(hints).toHaveLength(1);
    expect(hints[0].kind).toBe('triangulation-readiness');
    expect(hints[0].targetEntityId).toBe('h1');
    expect(hints[0].severity).toBe('info');
  });

  it('emits no hint for confirmed hypothesis', () => {
    const hypotheses = [
      {
        id: 'h1',
        findingIds: ['f1', 'f2'],
        disconfirmationAttempts: [
          {
            id: 'd1',
            verdict: 'survived',
            attemptedAt: '',
            description: '',
            attemptedBy: { displayName: '' },
            linkedFindingIds: [],
          },
        ],
        status: 'proposed',
      } as unknown as Hypothesis,
    ];
    const findings = [
      { id: 'f1', evidenceType: 'data' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    const hints = surveyWallRules({ hub: {} as never, hypotheses, findings });
    expect(hints).toHaveLength(0);
  });
});
