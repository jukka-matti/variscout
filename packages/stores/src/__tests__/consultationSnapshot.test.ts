import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalyzeStore } from '../analyzeStore';
import { buildDocumentSnapshot, hydrateDocumentSnapshot } from '../documentSnapshot';

describe('documentSnapshot — consultations round trip', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
  });

  it('serializes + rehydrates consultations with full nested integrity', () => {
    // Build a consultation that carries a question (anchored), a response, and a pending insight.
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().addConsultationQuestion(c.id, 'Why Mondays?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    useAnalyzeStore.getState().importResponse(c.id, {
      source: 'typed',
      respondentLabel: 'J. Operator',
      insights: [{ text: 'Cold oven Mondays.', kind: 'answer' }],
    });

    const snapshot = buildDocumentSnapshot({ activeHub: { id: 'hub-1' } });
    expect(snapshot.analyze.consultations).toHaveLength(1);
    expect(snapshot.analyze.consultations[0].questions).toHaveLength(1);

    // Reset store to a blank slate before rehydrating.
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
    expect(useAnalyzeStore.getState().consultations).toHaveLength(0);

    hydrateDocumentSnapshot(snapshot);

    const rehydrated = useAnalyzeStore.getState().consultations[0];
    expect(rehydrated.title).toBe('Line 3 drift');

    // Question anchor + status survive deep clone.
    expect(rehydrated.questions[0].anchor).toEqual({ kind: 'hypothesis', id: 'hyp-1' });
    expect(rehydrated.questions[0].status).toBe('open');

    // Response survives.
    expect(rehydrated.responses).toHaveLength(1);
    expect(rehydrated.responses[0].respondentLabel).toBe('J. Operator');

    // Proposed insight survives with correct responseId + status.
    expect(rehydrated.proposedInsights).toHaveLength(1);
    expect(rehydrated.proposedInsights[0].responseId).toBe(rehydrated.responses[0].id);
    expect(rehydrated.proposedInsights[0].status).toBe('pending');
  });

  it('hydrates legacy snapshots without a consultations field (back-compat) — resets to [] not prior state', () => {
    // Seed the store with a consultation FIRST so that state.consultations is non-empty.
    const c = useAnalyzeStore.getState().createConsultation('Should be wiped');
    expect(useAnalyzeStore.getState().consultations).toHaveLength(1);

    // Build a snapshot from the seeded state, then delete the consultations field to simulate
    // a pre-CL-1 legacy .vrs file.
    const legacySnapshot = buildDocumentSnapshot({ activeHub: { id: 'hub-1' } });
    delete (legacySnapshot.analyze as { consultations?: unknown }).consultations;

    // Build a second "current" snapshot (with a different consultation) — this is what would
    // be in memory if the user had opened project A before loading legacy project B.
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
    useAnalyzeStore.getState().createConsultation('Project A leftover');
    expect(useAnalyzeStore.getState().consultations).toHaveLength(1);

    // Hydrating the legacy snapshot must reset consultations to [], not fall back to the
    // in-memory "Project A leftover" consultation.
    expect(() => hydrateDocumentSnapshot(legacySnapshot)).not.toThrow();
    expect(useAnalyzeStore.getState().consultations).toEqual([]);

    // Suppress unused variable warning — the id was used above to confirm creation.
    void c;
  });
});
