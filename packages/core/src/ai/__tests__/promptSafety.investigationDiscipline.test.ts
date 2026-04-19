import { describe, it, expect } from 'vitest';
import { investigationDisciplinePrompt } from '../prompts/coScout/tier2/investigationDiscipline';

describe('investigationDisciplinePrompt', () => {
  it('never uses the phrase "root cause"', () => {
    expect(investigationDisciplinePrompt.toLowerCase()).not.toContain('root cause');
  });

  it('never uses interaction-moderator language', () => {
    expect(investigationDisciplinePrompt.toLowerCase()).not.toContain('moderator');
    expect(investigationDisciplinePrompt.toLowerCase()).not.toContain('primary factor');
  });

  it('mentions disconfirmation, questions, best-subsets, and REF tokens', () => {
    const lower = investigationDisciplinePrompt.toLowerCase();
    expect(lower).toContain('disconfirmation');
    expect(lower).toContain('question');
    expect(lower).toContain('best-subsets');
    expect(lower).toContain('ref');
  });
});
