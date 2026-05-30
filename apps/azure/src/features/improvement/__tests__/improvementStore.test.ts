import { describe, it, expect } from 'vitest';
import type { ImprovementHypothesis } from '../improvementStore';

describe('ImprovementHypothesis type', () => {
  it('type is correctly shaped', () => {
    const h: ImprovementHypothesis = {
      id: 'h-1',
      text: 'Root cause A',
      ideas: [{ id: 'i-1', text: 'Fix it', createdAt: 1714000000000, deletedAt: null }],
    };
    expect(h.id).toBe('h-1');
    expect(h.ideas).toHaveLength(1);
  });

  it('supports optional fields', () => {
    const h: ImprovementHypothesis = {
      id: 'h-2',
      text: 'Root cause B',
      status: 'evidenced',
      factor: 'Temperature',
      ideas: [],
      linkedFindingName: 'Variance in temp zone',
    };
    expect(h.status).toBe('evidenced');
    expect(h.factor).toBe('Temperature');
    expect(h.linkedFindingName).toBe('Variance in temp zone');
  });

  it('supports evidence field', () => {
    const h: ImprovementHypothesis = {
      id: 'h-3',
      text: 'Root cause C',
      ideas: [],
      evidence: { rSquaredAdj: 0.42, etaSquared: 0.38 },
    };
    expect(h.evidence?.rSquaredAdj).toBe(0.42);
  });
});
