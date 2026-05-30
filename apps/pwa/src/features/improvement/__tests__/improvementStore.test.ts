import { describe, it, expect } from 'vitest';
// IM-1 (ADR-085): ImprovementQuestion was retired. The improvement ideas now
// live on Hypothesis.ideas. The store module now exports ImprovementHypothesis.
import type { ImprovementHypothesis } from '../improvementStore';

describe('ImprovementHypothesis type', () => {
  it('type is correctly shaped with ideas from the Hypothesis entity', () => {
    // IM-1: ImprovementHypothesis wraps Hypothesis.ideas (re-homed from Question).
    const h: ImprovementHypothesis = {
      id: 'h-1',
      text: 'Nozzle wear on night shift',
      status: 'evidenced',
      ideas: [{ id: 'i-1', text: 'Train operators', createdAt: 1714000000000, deletedAt: null }],
    };
    expect(h.id).toBe('h-1');
    expect(h.ideas).toHaveLength(1);
    expect(h.status).toBe('evidenced');
  });

  it('supports optional evidence and linkedFindingName fields', () => {
    const h: ImprovementHypothesis = {
      id: 'h-2',
      text: 'Machine calibration drift',
      ideas: [],
      evidence: { rSquaredAdj: 0.72, etaSquared: 0.45 },
      linkedFindingName: 'Boxplot F2',
    };
    expect(h.evidence?.rSquaredAdj).toBe(0.72);
    expect(h.linkedFindingName).toBe('Boxplot F2');
  });
});
