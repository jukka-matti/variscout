import { describe, it, expect } from 'vitest';
import { QUESTION_STATUS_LABELS } from '../types';

describe('QUESTION_STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    expect(QUESTION_STATUS_LABELS.open).toBe('Open');
    expect(QUESTION_STATUS_LABELS.investigating).toBe('Investigating');
    expect(QUESTION_STATUS_LABELS.answered).toBe('Answered');
    expect(QUESTION_STATUS_LABELS['ruled-out']).toBe('Ruled out');
  });
});
