import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '../preferencesStore';
import { DEFAULT_TIME_LENS, DEFAULT_RISK_AXIS_CONFIG } from '@variscout/core';

beforeEach(() => {
  usePreferencesStore.setState(usePreferencesStore.getInitialState());
});

describe('usePreferencesStore', () => {
  it('declares STORE_LAYER as annotation-per-user', async () => {
    const mod = await import('../preferencesStore');
    expect(mod.STORE_LAYER).toBe('annotation-per-user');
  });

  it('initialises all fields to documented defaults', () => {
    const s = usePreferencesStore.getState();
    expect(s.activeView).toBe('analysis');
    expect(s.piActiveTab).toBe('stats');
    expect(s.isPISidebarOpen).toBe(false);
    expect(s.isCoScoutOpen).toBe(false);
    expect(s.isWhatIfOpen).toBe(false);
    expect(s.isFindingsOpen).toBe(false);
    expect(s.aiEnabled).toBe(true);
    expect(s.aiPreferences).toEqual({});
    expect(s.knowledgeSearchFolder).toBeNull();
    expect(s.skipQuestionLinkPrompt).toBe(false);
    expect(s.timeLens).toEqual(DEFAULT_TIME_LENS);
    expect(s.riskAxisConfig).toEqual(DEFAULT_RISK_AXIS_CONFIG);
    expect(s.budgetConfig).toEqual({});
  });

  it('togglePISidebar flips isPISidebarOpen', () => {
    usePreferencesStore.getState().togglePISidebar();
    expect(usePreferencesStore.getState().isPISidebarOpen).toBe(true);
    usePreferencesStore.getState().togglePISidebar();
    expect(usePreferencesStore.getState().isPISidebarOpen).toBe(false);
  });

  it('showInvestigation sets workspace to investigation and opens PI sidebar', () => {
    usePreferencesStore.getState().showInvestigation();
    const s = usePreferencesStore.getState();
    expect(s.activeView).toBe('investigation');
    expect(s.isPISidebarOpen).toBe(true);
    expect(s.piActiveTab).toBe('questions');
  });

  it('setRiskAxisConfig updates riskAxisConfig', () => {
    usePreferencesStore.getState().setRiskAxisConfig({ x: 'cost', y: 'effort' });
    expect(usePreferencesStore.getState().riskAxisConfig).toEqual({ x: 'cost', y: 'effort' });
  });
});
