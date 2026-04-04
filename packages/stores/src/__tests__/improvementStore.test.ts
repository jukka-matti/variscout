import { describe, it, expect, beforeEach } from 'vitest';
import { useImprovementStore, getImprovementInitialState } from '../improvementStore';

beforeEach(() => {
  useImprovementStore.setState(getImprovementInitialState());
});

describe('improvementStore', () => {
  it('initializes with plan view', () => {
    const state = useImprovementStore.getState();
    expect(state.activeView).toBe('plan');
    expect(state.highlightedIdeaId).toBeNull();
    expect(state.riskAxisConfig).toEqual({ axis1: 'process', axis2: 'safety' });
    expect(state.budgetConfig).toEqual({});
  });

  it('toggles active view', () => {
    useImprovementStore.getState().setActiveView('track');
    expect(useImprovementStore.getState().activeView).toBe('track');

    useImprovementStore.getState().setActiveView('plan');
    expect(useImprovementStore.getState().activeView).toBe('plan');
  });

  it('sets highlighted idea', () => {
    useImprovementStore.getState().setHighlightedIdeaId('idea-42');
    expect(useImprovementStore.getState().highlightedIdeaId).toBe('idea-42');

    useImprovementStore.getState().setHighlightedIdeaId(null);
    expect(useImprovementStore.getState().highlightedIdeaId).toBeNull();
  });

  it('sets risk axis config', () => {
    useImprovementStore.getState().setRiskAxisConfig({ axis1: 'quality', axis2: 'regulatory' });
    expect(useImprovementStore.getState().riskAxisConfig).toEqual({
      axis1: 'quality',
      axis2: 'regulatory',
    });
  });

  it('sets budget config', () => {
    useImprovementStore.getState().setBudgetConfig({ totalBudget: 50000, currency: 'EUR' });
    expect(useImprovementStore.getState().budgetConfig).toEqual({
      totalBudget: 50000,
      currency: 'EUR',
    });
  });
});
