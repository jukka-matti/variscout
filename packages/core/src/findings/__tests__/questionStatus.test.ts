import { describe, it, expect } from 'vitest';
import { getQuestionDisplayStatus, QUESTION_STATUS_LABELS } from '../questionStatus';

describe('getQuestionDisplayStatus', () => {
  it('maps untested to open', () => {
    expect(getQuestionDisplayStatus('untested')).toBe('open');
  });
  it('maps partial to investigating', () => {
    expect(getQuestionDisplayStatus('partial')).toBe('investigating');
  });
  it('maps supported to answered', () => {
    expect(getQuestionDisplayStatus('supported')).toBe('answered');
  });
  it('maps contradicted to ruled-out', () => {
    expect(getQuestionDisplayStatus('contradicted')).toBe('ruled-out');
  });
});

describe('QUESTION_STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    expect(QUESTION_STATUS_LABELS.open).toBe('Open');
    expect(QUESTION_STATUS_LABELS.investigating).toBe('Investigating');
    expect(QUESTION_STATUS_LABELS.answered).toBe('Answered');
    expect(QUESTION_STATUS_LABELS['ruled-out']).toBe('Ruled out');
  });
});
