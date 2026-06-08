import { describe, expect, it } from 'vitest';
import { displayHypothesisStatus, getHypothesisDisplayStatus } from '../hypothesisStatusDisplay';

describe('hypothesis display status', () => {
  it('maps the stored 5-value status model to the 3 displayed states', () => {
    expect(displayHypothesisStatus('proposed').label).toBe('Suspected');
    expect(displayHypothesisStatus('evidenced').label).toBe('Suspected');
    expect(displayHypothesisStatus('needs-disconfirmation').label).toBe('Suspected');
    expect(displayHypothesisStatus('evidence-survived-test').label).toBe('Supported');
    expect(displayHypothesisStatus('refuted').label).toBe('Ruled out');

    expect(getHypothesisDisplayStatus('proposed')).toBe('suspected');
    expect(getHypothesisDisplayStatus('evidence-survived-test')).toBe('supported');
    expect(getHypothesisDisplayStatus('refuted')).toBe('ruled-out');
  });
});
