import { describe, it, expect } from 'vitest';
import type { ImprovementQuestion } from '../improvementStore';

describe('ImprovementQuestion type', () => {
  it('type is correctly shaped', () => {
    const q: ImprovementQuestion = {
      id: 'q-1',
      text: 'Root cause A',
      ideas: [{ id: 'i-1', text: 'Fix it', createdAt: '' }],
    };
    expect(q.id).toBe('q-1');
    expect(q.ideas).toHaveLength(1);
  });

  it('supports optional fields', () => {
    const q: ImprovementQuestion = {
      id: 'q-2',
      text: 'Root cause B',
      causeRole: 'suspected-cause',
      factor: 'Temperature',
      ideas: [],
      linkedFindingName: 'Variance in temp zone',
    };
    expect(q.causeRole).toBe('suspected-cause');
    expect(q.factor).toBe('Temperature');
    expect(q.linkedFindingName).toBe('Variance in temp zone');
  });
});
