import { describe, it, expect } from 'vitest';
import type { ImprovementQuestion } from '../improvementStore';

describe('ImprovementQuestion type', () => {
  it('type is correctly shaped', () => {
    const q: ImprovementQuestion = {
      id: 'q-1',
      text: 'Fix shift',
      ideas: [{ id: 'i-1', text: 'Train', createdAt: '' }],
    };
    expect(q.id).toBe('q-1');
    expect(q.ideas).toHaveLength(1);
  });
});
