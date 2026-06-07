// survey/__tests__/wall.test.ts
import { describe, it, expect } from 'vitest';
import { deriveHypothesisStatus, surveyWallRules } from '../wall';
import type { Hypothesis, Finding } from '../../findings/types';
import { createFinding, createHypothesis } from '../../findings';

const baseH = (overrides: Partial<Hypothesis>): Hypothesis =>
  ({
    id: 'h',
    hubId: 'hub',
    name: '',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 0,
    deletedAt: null,
    updatedAt: 0,
    ...overrides,
  }) as Hypothesis;

describe('deriveHypothesisStatus', () => {
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

  it('stays evidenced when one finding is an inconclusive evaluate (null result is not evidence)', () => {
    // FE-2a honesty: a null evaluate stamps validationStatus:'inconclusive' on a
    // `data` finding. Paired with one `gemba` finding it must NOT advance to
    // needs-disconfirmation — the inconclusive finding contributes no evidence type.
    const findings = [
      { id: 'f1', evidenceType: 'data', validationStatus: 'inconclusive' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    expect(
      deriveHypothesisStatus(
        baseH({ findingIds: ['f1', 'f2'], disconfirmationAttempts: [] }),
        findings
      )
    ).toBe('evidenced');
  });

  it('needs-disconfirmation when supports data + gemba (two real evidence types)', () => {
    const findings = [
      { id: 'f1', evidenceType: 'data', validationStatus: 'supports' } as Finding,
      { id: 'f2', evidenceType: 'gemba' } as Finding,
    ];
    expect(
      deriveHypothesisStatus(
        baseH({ findingIds: ['f1', 'f2'], disconfirmationAttempts: [] }),
        findings
      )
    ).toBe('needs-disconfirmation');
  });

  it('evidence-survived-test with 2 types and resolved disconfirmation', () => {
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
    expect(deriveHypothesisStatus(h, findings)).toBe('evidence-survived-test');
  });

  it('two angles plus a survived attempt reaches evidence-survived-test; one angle does not', () => {
    const dataFinding = { ...createFinding('high on B', {}, null), evidenceType: 'data' as const };
    const gembaFinding = {
      ...createFinding('jig sticks during changeover', {}, null),
      evidenceType: 'gemba' as const,
    };
    const hypothesis = {
      ...createHypothesis('Line B equipment difference', ''),
      findingIds: [dataFinding.id, gembaFinding.id],
      disconfirmationAttempts: [
        {
          id: 'a1',
          description: 'swap jig',
          verdict: 'survived' as const,
          attemptedAt: '',
          attemptedBy: { displayName: '' },
          linkedFindingIds: [],
        },
      ],
    };

    expect(deriveHypothesisStatus(hypothesis, [dataFinding, gembaFinding])).toBe(
      'evidence-survived-test'
    );

    const oneAngle = { ...hypothesis, findingIds: [dataFinding.id] };
    expect(deriveHypothesisStatus(oneAngle, [dataFinding])).toBe('evidenced');
    expect(deriveHypothesisStatus(oneAngle, [dataFinding])).not.toBe('evidence-survived-test');
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

  it('emits no hint for evidence-survived-test hypothesis', () => {
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

describe('surveyWallRules — data-collection (category 2)', () => {
  it('emits data-collection hint for evidenced hypothesis with only data', () => {
    const h = baseH({ id: 'h1', name: 'Nozzle temp drift', findingIds: ['f1'] });
    const findings = [
      { id: 'f1', evidenceType: 'data' as const, refutes: false } as unknown as Finding,
    ];
    const hints = surveyWallRules({ hypotheses: [h], findings });
    const dataCollection = hints.filter(x => x.kind === 'data-collection');
    expect(dataCollection).toHaveLength(1);
    expect(dataCollection[0]).toMatchObject({
      kind: 'data-collection',
      surface: 'wall',
      targetEntityId: 'h1',
      severity: 'info',
    });
    expect(dataCollection[0].message).toContain('Nozzle temp drift');
    expect(dataCollection[0].message).toContain('data only');
    expect(dataCollection[0].message).toContain('gemba');
    expect(dataCollection[0].message).toContain('expert');
    expect(dataCollection[0].action?.label).toContain('gemba');
  });

  it('emits hint with gemba+expert missing for data-only', () => {
    const h = baseH({ id: 'h2', findingIds: ['f1'] });
    const findings = [
      { id: 'f1', evidenceType: 'data' as const, refutes: false } as unknown as Finding,
    ];
    const hints = surveyWallRules({ hypotheses: [h], findings });
    const msg = hints.find(x => x.kind === 'data-collection')?.message ?? '';
    expect(msg).toMatch(/needs gemba or expert to triangulate/);
  });

  it('emits hint with data+expert missing for gemba-only', () => {
    const h = baseH({ id: 'h3', findingIds: ['f1'] });
    const findings = [
      { id: 'f1', evidenceType: 'gemba' as const, refutes: false } as unknown as Finding,
    ];
    const hints = surveyWallRules({ hypotheses: [h], findings });
    const msg = hints.find(x => x.kind === 'data-collection')?.message ?? '';
    expect(msg).toMatch(/needs data or expert to triangulate/);
  });

  it('does NOT emit data-collection for proposed hypothesis (no findings)', () => {
    const h = baseH({ id: 'h4', findingIds: [] });
    const hints = surveyWallRules({ hypotheses: [h], findings: [] });
    expect(hints.filter(x => x.kind === 'data-collection')).toHaveLength(0);
  });

  it('does NOT emit data-collection for needs-disconfirmation hypothesis', () => {
    // Hypothesis with 2+ evidence types should get the triangulation-readiness
    // hint (category 3), not data-collection (category 2).
    const h = baseH({ id: 'h5', findingIds: ['f1', 'f2'] });
    const findings = [
      { id: 'f1', evidenceType: 'data' as const, refutes: false } as unknown as Finding,
      { id: 'f2', evidenceType: 'gemba' as const, refutes: false } as unknown as Finding,
    ];
    const hints = surveyWallRules({ hypotheses: [h], findings });
    expect(hints.filter(x => x.kind === 'data-collection')).toHaveLength(0);
    expect(hints.filter(x => x.kind === 'triangulation-readiness')).toHaveLength(1);
  });

  it('does NOT emit data-collection for refuted hypothesis', () => {
    const h = baseH({ id: 'h6', findingIds: ['f1'] });
    const findings = [
      { id: 'f1', evidenceType: 'data' as const, refutes: true } as unknown as Finding,
    ];
    const hints = surveyWallRules({ hypotheses: [h], findings });
    expect(hints).toHaveLength(0);
  });
});
