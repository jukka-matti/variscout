import { describe, it, expect, beforeEach } from 'vitest';
import { useImprovementStore } from '../improvementStore';

beforeEach(() => {
  useImprovementStore.setState({
    improvementHypotheses: [],
    improvementLinkedFindings: [],
    selectedIdeaIds: new Set(),
    projectedCpkMap: {},
    convertedIdeaIds: new Set(),
  });
});

describe('improvementStore', () => {
  it('syncState updates all fields', () => {
    useImprovementStore.getState().syncState({
      improvementHypotheses: [
        { id: 'h-1', text: 'Fix shift', ideas: [{ id: 'i-1', text: 'Train', createdAt: '' }] },
      ],
      improvementLinkedFindings: [{ id: 'f-1', text: 'Shift variance' }],
      selectedIdeaIds: new Set(['i-1']),
      projectedCpkMap: { 'f-1': 1.45 },
      convertedIdeaIds: new Set(),
    });
    const s = useImprovementStore.getState();
    expect(s.improvementHypotheses).toHaveLength(1);
    expect(s.improvementLinkedFindings).toHaveLength(1);
    expect(s.selectedIdeaIds.has('i-1')).toBe(true);
    expect(s.projectedCpkMap['f-1']).toBe(1.45);
  });

  it('starts with empty state', () => {
    const s = useImprovementStore.getState();
    expect(s.improvementHypotheses).toEqual([]);
    expect(s.selectedIdeaIds.size).toBe(0);
  });
});
