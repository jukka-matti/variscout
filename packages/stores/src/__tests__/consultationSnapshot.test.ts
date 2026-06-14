import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalyzeStore } from '../analyzeStore';
import { buildDocumentSnapshot, hydrateDocumentSnapshot } from '../documentSnapshot';

describe('documentSnapshot — consultations round trip', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
  });

  it('serializes + rehydrates consultations through the analyze facet', () => {
    const c = useAnalyzeStore.getState().createConsultation('Line 3 drift');
    useAnalyzeStore.getState().addConsultationQuestion(c.id, 'Why Mondays?');
    const snapshot = buildDocumentSnapshot({ activeHub: { id: 'hub-1' } });
    expect(snapshot.analyze.consultations).toHaveLength(1);
    expect(snapshot.analyze.consultations[0].questions).toHaveLength(1);

    useAnalyzeStore.setState(useAnalyzeStore.getInitialState());
    expect(useAnalyzeStore.getState().consultations).toHaveLength(0);

    hydrateDocumentSnapshot(snapshot);
    expect(useAnalyzeStore.getState().consultations).toHaveLength(1);
    expect(useAnalyzeStore.getState().consultations[0].title).toBe('Line 3 drift');
  });

  it('hydrates legacy snapshots without a consultations field (back-compat)', () => {
    const snapshot = buildDocumentSnapshot({ activeHub: { id: 'hub-1' } });
    // Simulate a pre-CL-1 snapshot:
    delete (snapshot.analyze as { consultations?: unknown }).consultations;
    expect(() => hydrateDocumentSnapshot(snapshot)).not.toThrow();
    expect(useAnalyzeStore.getState().consultations).toEqual([]);
  });
});
