import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore, getSessionInitialState } from '../sessionStore';

beforeEach(() => {
  useSessionStore.setState(getSessionInitialState());
});

describe('sessionStore — initialization', () => {
  it('initializes with analysis view', () => {
    const state = useSessionStore.getState();
    expect(state.activeView).toBe('analysis');
    expect(state.isPISidebarOpen).toBe(false);
    expect(state.piActiveTab).toBe('stats');
    expect(state.piOverflowView).toBeNull();
    expect(state.isCoScoutOpen).toBe(false);
    expect(state.isWhatIfOpen).toBe(false);
    expect(state.isDataTableOpen).toBe(false);
    expect(state.isFindingsOpen).toBe(false);
    expect(state.highlightRowIndex).toBeNull();
    expect(state.highlightedChartPoint).toBeNull();
    expect(state.highlightedFindingId).toBeNull();
    expect(state.expandedQuestionId).toBeNull();
    expect(state.pendingChartFocus).toBeNull();
  });
});

describe('sessionStore — workspace navigation', () => {
  it('shows each workspace', () => {
    useSessionStore.getState().showDashboard();
    expect(useSessionStore.getState().activeView).toBe('dashboard');

    useSessionStore.getState().showAnalysis();
    expect(useSessionStore.getState().activeView).toBe('analysis');

    useSessionStore.getState().showImprovement();
    expect(useSessionStore.getState().activeView).toBe('improvement');

    useSessionStore.getState().showReport();
    expect(useSessionStore.getState().activeView).toBe('report');
  });

  it('showInvestigation opens PI sidebar and sets questions tab', () => {
    // Start with PI sidebar closed and on stats tab
    useSessionStore.setState({ isPISidebarOpen: false, piActiveTab: 'stats' });

    useSessionStore.getState().showInvestigation();

    const state = useSessionStore.getState();
    expect(state.activeView).toBe('investigation');
    expect(state.isPISidebarOpen).toBe(true);
    expect(state.piActiveTab).toBe('questions');
  });
});

describe('sessionStore — PI sidebar', () => {
  it('toggles PI sidebar', () => {
    expect(useSessionStore.getState().isPISidebarOpen).toBe(false);

    useSessionStore.getState().togglePISidebar();
    expect(useSessionStore.getState().isPISidebarOpen).toBe(true);

    useSessionStore.getState().togglePISidebar();
    expect(useSessionStore.getState().isPISidebarOpen).toBe(false);
  });

  it('sets PI active tab and clears overflow view', () => {
    useSessionStore.setState({ piOverflowView: 'data' });

    useSessionStore.getState().setPIActiveTab('journal');
    const state = useSessionStore.getState();
    expect(state.piActiveTab).toBe('journal');
    expect(state.piOverflowView).toBeNull();
  });

  it('sets PI overflow view', () => {
    useSessionStore.getState().setPIOverflowView('whatif');
    expect(useSessionStore.getState().piOverflowView).toBe('whatif');

    useSessionStore.getState().setPIOverflowView(null);
    expect(useSessionStore.getState().piOverflowView).toBeNull();
  });
});

describe('sessionStore — highlights', () => {
  it('handlePointClick sets highlight and opens PI', () => {
    useSessionStore.setState({ isPISidebarOpen: false });

    useSessionStore.getState().handlePointClick(7);

    const state = useSessionStore.getState();
    expect(state.highlightRowIndex).toBe(7);
    expect(state.isPISidebarOpen).toBe(true);
  });

  it('handleRowClick sets chart highlight', () => {
    useSessionStore.getState().handleRowClick(3);
    expect(useSessionStore.getState().highlightedChartPoint).toBe(3);
  });

  it('setHighlightPoint sets chart highlight directly', () => {
    useSessionStore.getState().setHighlightPoint(12);
    expect(useSessionStore.getState().highlightedChartPoint).toBe(12);

    useSessionStore.getState().setHighlightPoint(null);
    expect(useSessionStore.getState().highlightedChartPoint).toBeNull();
  });

  it('setHighlightedFindingId sets the highlighted finding', () => {
    useSessionStore.getState().setHighlightedFindingId('f-abc');
    expect(useSessionStore.getState().highlightedFindingId).toBe('f-abc');

    useSessionStore.getState().setHighlightedFindingId(null);
    expect(useSessionStore.getState().highlightedFindingId).toBeNull();
  });

  it('setExpandedQuestionId sets the expanded question', () => {
    useSessionStore.getState().setExpandedQuestionId('q-1');
    expect(useSessionStore.getState().expandedQuestionId).toBe('q-1');
  });

  it('setPendingChartFocus sets and clears pending focus', () => {
    useSessionStore.getState().setPendingChartFocus('ichart');
    expect(useSessionStore.getState().pendingChartFocus).toBe('ichart');

    useSessionStore.getState().setPendingChartFocus(null);
    expect(useSessionStore.getState().pendingChartFocus).toBeNull();
  });
});

describe('sessionStore — toggles', () => {
  it('toggles CoScout panel', () => {
    useSessionStore.getState().toggleCoScout();
    expect(useSessionStore.getState().isCoScoutOpen).toBe(true);

    useSessionStore.getState().toggleCoScout();
    expect(useSessionStore.getState().isCoScoutOpen).toBe(false);
  });

  it('toggles WhatIf panel', () => {
    useSessionStore.getState().toggleWhatIf();
    expect(useSessionStore.getState().isWhatIfOpen).toBe(true);
  });

  it('toggles data table', () => {
    useSessionStore.getState().toggleDataTable();
    expect(useSessionStore.getState().isDataTableOpen).toBe(true);

    useSessionStore.getState().toggleDataTable();
    expect(useSessionStore.getState().isDataTableOpen).toBe(false);
  });

  it('toggles findings panel', () => {
    useSessionStore.getState().toggleFindings();
    expect(useSessionStore.getState().isFindingsOpen).toBe(true);
  });
});

describe('sessionStore — ViewState persistence', () => {
  it('initFromViewState restores state', () => {
    useSessionStore.getState().initFromViewState({
      activeView: 'investigation',
      isFindingsOpen: true,
      isWhatIfOpen: true,
    });
    const state = useSessionStore.getState();
    expect(state.activeView).toBe('investigation');
    expect(state.isFindingsOpen).toBe(true);
    expect(state.isWhatIfOpen).toBe(true);
  });

  it('initFromViewState handles legacy editor → analysis', () => {
    // Cast to bypass TypeScript literal check — legacy value from old persisted data
    useSessionStore.getState().initFromViewState({
      activeView: 'editor' as 'analysis',
    });
    expect(useSessionStore.getState().activeView).toBe('analysis');
  });

  it('initFromViewState uses defaults when called with null', () => {
    useSessionStore.setState({ activeView: 'improvement', isFindingsOpen: true });
    useSessionStore.getState().initFromViewState(null);
    const state = useSessionStore.getState();
    expect(state.activeView).toBe('analysis');
    expect(state.isFindingsOpen).toBe(false);
  });

  it('toViewState returns persistable subset', () => {
    useSessionStore.setState({
      activeView: 'report',
      isFindingsOpen: true,
      isWhatIfOpen: true,
    });
    const persisted = useSessionStore.getState().toViewState();
    expect(persisted.activeView).toBe('report');
    expect(persisted.isFindingsOpen).toBe(true);
    expect(persisted.isWhatIfOpen).toBe(true);
    // Non-persisted fields should not appear
    expect('highlightRowIndex' in persisted).toBe(false);
  });

  // --- Azure-specific fields ---

  it('setAIEnabled toggles AI', () => {
    useSessionStore.getState().setAIEnabled(false);
    expect(useSessionStore.getState().aiEnabled).toBe(false);
    useSessionStore.getState().setAIEnabled(true);
    expect(useSessionStore.getState().aiEnabled).toBe(true);
  });

  it('setAIPreferences updates per-component toggles', () => {
    useSessionStore.getState().setAIPreferences({ narration: true, insights: false });
    expect(useSessionStore.getState().aiPreferences).toEqual({ narration: true, insights: false });
  });

  it('setKnowledgeSearchFolder sets folder path', () => {
    useSessionStore.getState().setKnowledgeSearchFolder('/Shared Documents/KB');
    expect(useSessionStore.getState().knowledgeSearchFolder).toBe('/Shared Documents/KB');
  });

  it('defaults: aiEnabled is true, aiPreferences empty, knowledgeSearchFolder null', () => {
    const initial = getSessionInitialState();
    expect(initial.aiEnabled).toBe(true);
    expect(initial.aiPreferences).toEqual({});
    expect(initial.knowledgeSearchFolder).toBeNull();
  });
});
