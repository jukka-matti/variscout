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
    expect(s.timeLens).toEqual(DEFAULT_TIME_LENS);
    expect(s.riskAxisConfig).toEqual(DEFAULT_RISK_AXIS_CONFIG);
    expect(s.budgetConfig).toEqual({});
    expect(s.isIPTeamRailExpanded).toBe(false);
  });

  it('togglePISidebar flips isPISidebarOpen', () => {
    usePreferencesStore.getState().togglePISidebar();
    expect(usePreferencesStore.getState().isPISidebarOpen).toBe(true);
    usePreferencesStore.getState().togglePISidebar();
    expect(usePreferencesStore.getState().isPISidebarOpen).toBe(false);
  });

  it('showHome sets workspace to home', () => {
    usePreferencesStore.getState().showHome();
    expect(usePreferencesStore.getState().activeView).toBe('home');
  });

  it('showInvestigation sets workspace to investigation and opens PI sidebar with scope tab', () => {
    usePreferencesStore.getState().showInvestigation();
    const s = usePreferencesStore.getState();
    expect(s.activeView).toBe('investigation');
    expect(s.isPISidebarOpen).toBe(true);
    // 'questions' tab retired (ADR-085); PI sidebar opens to 'scope' tab
    expect(s.piActiveTab).toBe('scope');
  });

  it('setRiskAxisConfig updates riskAxisConfig', () => {
    usePreferencesStore.getState().setRiskAxisConfig({ axis1: 'quality', axis2: 'environmental' });
    expect(usePreferencesStore.getState().riskAxisConfig).toEqual({
      axis1: 'quality',
      axis2: 'environmental',
    });
  });

  it('remembers the tablet IP team rail expansion preference', () => {
    usePreferencesStore.getState().setIPTeamRailExpanded(true);
    expect(usePreferencesStore.getState().isIPTeamRailExpanded).toBe(true);

    usePreferencesStore.getState().setIPTeamRailExpanded(false);
    expect(usePreferencesStore.getState().isIPTeamRailExpanded).toBe(false);
  });
});
