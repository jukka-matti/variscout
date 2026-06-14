import { describe, expect, it } from 'vitest';
import {
  createConsultation,
  createConsultationQuestion,
  createConsultationResponse,
  createProposedInsight,
} from '../factories';

describe('consultation factories', () => {
  it('creates a draft consultation with stable id + empty collections', () => {
    const c = createConsultation('Why does Line 3 drift on Mondays?');
    expect(c.id).toMatch(/[0-9a-f-]{36}/);
    expect(c.status).toBe('draft');
    expect(c.questions).toEqual([]);
    expect(c.responses).toEqual([]);
    expect(c.proposedInsights).toEqual([]);
    expect(c.deletedAt).toBeNull();
  });

  it('creates an open question carrying its anchor', () => {
    const q = createConsultationQuestion('Does Monday startup differ?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    expect(q.status).toBe('open');
    expect(q.anchor).toEqual({ kind: 'hypothesis', id: 'hyp-1' });
  });

  it('creates a typed response with importedAt set', () => {
    const r = createConsultationResponse('typed', 'J. Operator', 'resp.md');
    expect(r.source).toBe('typed');
    expect(r.respondentLabel).toBe('J. Operator');
    expect(r.rawArtifactRef).toBe('resp.md');
    expect(typeof r.importedAt).toBe('number');
  });

  it('creates a pending insight mapped to a question + response', () => {
    const i = createProposedInsight('resp-1', 'Cold oven on Mondays.', 'answer', 'q-1');
    expect(i.status).toBe('pending');
    expect(i.responseId).toBe('resp-1');
    expect(i.questionId).toBe('q-1');
    expect(i.kind).toBe('answer');
    expect(i.acceptedAs).toBeUndefined();
  });
});
