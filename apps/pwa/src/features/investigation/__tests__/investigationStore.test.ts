import { describe, it, expect, beforeEach } from 'vitest';
import { useInvestigationStore } from '../investigationStore';
import type { Hypothesis } from '@variscout/core';

const makeHypothesis = (overrides: Partial<Hypothesis> = {}): Hypothesis => ({
  id: `h-${Math.random()}`,
  text: 'test hypothesis',
  status: 'untested',
  linkedFindingIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  useInvestigationStore.setState({
    hypotheses: [],
    hypothesesMap: {},
    ideaImpacts: {},
    projectionTarget: null,
    expandedHypothesisId: null,
  });
});

describe('investigationStore', () => {
  it('syncHypotheses updates hypotheses', () => {
    const hypotheses = [makeHypothesis({ text: 'Shift effect' })];
    useInvestigationStore.getState().syncHypotheses(hypotheses);
    expect(useInvestigationStore.getState().hypotheses).toHaveLength(1);
  });

  it('syncHypothesesMap updates display map', () => {
    const map = { 'h-1': { text: 'Test', status: 'supported', factor: 'Shift' } };
    useInvestigationStore.getState().syncHypothesesMap(map);
    expect(useInvestigationStore.getState().hypothesesMap).toEqual(map);
  });

  it('setProjectionTarget sets and clears', () => {
    const target = {
      hypothesisId: 'h-1',
      ideaId: 'i-1',
      ideaText: 'Change shift',
      hypothesisText: 'Shift effect',
    };
    useInvestigationStore.getState().setProjectionTarget(target);
    expect(useInvestigationStore.getState().projectionTarget).toEqual(target);
    useInvestigationStore.getState().setProjectionTarget(null);
    expect(useInvestigationStore.getState().projectionTarget).toBeNull();
  });

  it('expandToHypothesis sets expanded ID', () => {
    useInvestigationStore.getState().expandToHypothesis('h-42');
    expect(useInvestigationStore.getState().expandedHypothesisId).toBe('h-42');
  });
});
