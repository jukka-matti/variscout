import { describe, it, expect } from 'vitest';
import { analyzeDisciplinePrompt } from '../prompts/coScout/tier2/analyzeDiscipline';

describe('analyzeDisciplinePrompt', () => {
  it('never uses the phrase "root cause"', () => {
    expect(analyzeDisciplinePrompt.toLowerCase()).not.toContain('root cause');
  });

  it('never uses interaction-moderator language', () => {
    expect(analyzeDisciplinePrompt.toLowerCase()).not.toContain('moderator');
    expect(analyzeDisciplinePrompt.toLowerCase()).not.toContain('primary factor');
  });

  it('mentions disconfirmation, questions, best-subsets, and REF tokens', () => {
    const lower = analyzeDisciplinePrompt.toLowerCase();
    expect(lower).toContain('disconfirmation');
    expect(lower).toContain('question');
    expect(lower).toContain('best-subsets');
    expect(lower).toContain('ref');
  });
});
