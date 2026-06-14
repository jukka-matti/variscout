import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalyzeStore } from '../analyzeStore';

describe('analyzeStore — consultations', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
  });

  it('creates a draft consultation', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    expect(useAnalyzeStore.getState().consultations).toHaveLength(1);
    expect(c.status).toBe('draft');
  });

  it('adds a question to a consultation', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().addConsultationQuestion(c.id, 'Why Mondays?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    const updated = useAnalyzeStore.getState().consultations[0];
    expect(updated.questions).toHaveLength(1);
    expect(updated.questions[0].anchor).toEqual({ kind: 'hypothesis', id: 'hyp-1' });
  });

  it('importResponse attaches a response + pending insights without mutating findings', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Cold oven Mondays.', kind: 'answer' }],
    });
    const updated = useAnalyzeStore.getState().consultations[0];
    expect(updated.status).toBe('responses-imported');
    expect(updated.responses).toHaveLength(1);
    expect(updated.proposedInsights).toHaveLength(1);
    expect(updated.proposedInsights[0].status).toBe('pending');
    // No canonical mutation:
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });

  it('acceptInsight creates an expert Finding with consultation provenance', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Cold oven Mondays.', kind: 'answer' }],
    });
    const insight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    const response = useAnalyzeStore.getState().consultations[0].responses[0];
    const finding = useAnalyzeStore.getState().acceptInsight(c.id, insight.id);
    expect(finding.evidenceType).toBe('expert');
    expect(finding.provenance).toMatchObject({
      kind: 'consultation',
      consultationId: c.id,
      respondentLabel: 'J. Operator',
    });
    // Spec-required: provenance must carry import timestamp + responseId.
    expect(finding.provenance?.importedAt).toBe(response.importedAt);
    expect(finding.provenance?.responseId).toBe(insight.responseId);
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);
    const updatedInsight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    expect(updatedInsight.status).toBe('accepted');
    expect(updatedInsight.acceptedAs).toEqual({ kind: 'finding', id: finding.id });
  });

  it('rejectInsight marks rejected and creates no Finding', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Noise.', kind: 'context' }],
    });
    const insight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    useAnalyzeStore.getState().rejectInsight(c.id, insight.id);
    expect(useAnalyzeStore.getState().consultations[0].proposedInsights[0].status).toBe('rejected');
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });
});
