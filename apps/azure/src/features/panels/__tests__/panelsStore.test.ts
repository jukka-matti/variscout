import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelsStore } from '../panelsStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  usePanelsStore.setState({
    activeView: 'analysis',
    isDataTableOpen: false,
    isFindingsOpen: false,
    isCoScoutOpen: false,
    isWhatIfOpen: false,
    highlightRowIndex: null,
    highlightedChartPoint: null,
    pendingChartFocus: null,
    isPISidebarOpen: false,
    piActiveTab: 'stats',
    piOverflowView: null,
    highlightedFactor: null,
    investigationViewMode: 'map',
    factorPreviewDismissed: false,
  });
});

describe('panelsStore', () => {
  describe('initial state', () => {
    it('has all booleans false and nullable fields null', () => {
      const s = usePanelsStore.getState();
      expect(s.isDataTableOpen).toBe(false);
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isCoScoutOpen).toBe(false);
      expect(s.isWhatIfOpen).toBe(false);
      expect(s.highlightRowIndex).toBeNull();
      expect(s.highlightedChartPoint).toBeNull();
      expect(s.piActiveTab).toBe('stats');
      expect(s.piOverflowView).toBeNull();
    });
  });

  describe('data table', () => {
    it('openDataTable opens the data table', () => {
      usePanelsStore.getState().openDataTable();
      expect(usePanelsStore.getState().isDataTableOpen).toBe(true);
    });

    it('closeDataTable closes the data table', () => {
      usePanelsStore.getState().openDataTable();
      usePanelsStore.getState().closeDataTable();
      expect(usePanelsStore.getState().isDataTableOpen).toBe(false);
    });
  });

  describe('findings panel', () => {
    it('setFindingsOpen opens findings', () => {
      usePanelsStore.getState().setFindingsOpen(true);
      expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
    });

    it('setFindingsOpen closes findings', () => {
      usePanelsStore.getState().setFindingsOpen(true);
      usePanelsStore.getState().setFindingsOpen(false);
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('toggleFindings toggles findings panel', () => {
      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(true);

      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('setFindingsOpen is no-op in investigation workspace', () => {
      usePanelsStore.getState().showInvestigation();
      usePanelsStore.getState().setFindingsOpen(true);
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('toggleFindings is no-op in investigation workspace', () => {
      usePanelsStore.getState().showInvestigation();
      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });
  });

  describe('CoScout panel', () => {
    it('setCoScoutOpen opens CoScout', () => {
      usePanelsStore.getState().setCoScoutOpen(true);
      expect(usePanelsStore.getState().isCoScoutOpen).toBe(true);
    });

    it('setCoScoutOpen closes CoScout', () => {
      usePanelsStore.getState().setCoScoutOpen(true);
      usePanelsStore.getState().setCoScoutOpen(false);
      expect(usePanelsStore.getState().isCoScoutOpen).toBe(false);
    });

    it('toggleCoScout toggles CoScout panel', () => {
      usePanelsStore.getState().toggleCoScout();
      expect(usePanelsStore.getState().isCoScoutOpen).toBe(true);

      usePanelsStore.getState().toggleCoScout();
      expect(usePanelsStore.getState().isCoScoutOpen).toBe(false);
    });
  });

  describe('what-if panel', () => {
    it('setWhatIfOpen opens what-if', () => {
      usePanelsStore.getState().setWhatIfOpen(true);
      expect(usePanelsStore.getState().isWhatIfOpen).toBe(true);
    });

    it('setWhatIfOpen closes what-if', () => {
      usePanelsStore.getState().setWhatIfOpen(true);
      usePanelsStore.getState().setWhatIfOpen(false);
      expect(usePanelsStore.getState().isWhatIfOpen).toBe(false);
    });
  });

  describe('highlights', () => {
    it('setHighlightRow sets the highlight row index', () => {
      usePanelsStore.getState().setHighlightRow(42);
      expect(usePanelsStore.getState().highlightRowIndex).toBe(42);
    });

    it('setHighlightRow clears with null', () => {
      usePanelsStore.getState().setHighlightRow(10);
      usePanelsStore.getState().setHighlightRow(null);
      expect(usePanelsStore.getState().highlightRowIndex).toBeNull();
    });

    it('setHighlightPoint sets the highlighted chart point', () => {
      usePanelsStore.getState().setHighlightPoint(7);
      expect(usePanelsStore.getState().highlightedChartPoint).toBe(7);
    });

    it('setHighlightPoint clears with null', () => {
      usePanelsStore.getState().setHighlightPoint(5);
      usePanelsStore.getState().setHighlightPoint(null);
      expect(usePanelsStore.getState().highlightedChartPoint).toBeNull();
    });
  });

  describe('handlePointClick (compound action)', () => {
    it('sets highlight row AND opens PI sidebar', () => {
      usePanelsStore.getState().handlePointClick(15);
      const s = usePanelsStore.getState();
      expect(s.highlightRowIndex).toBe(15);
      expect(s.isPISidebarOpen).toBe(true);
    });

    it('keeps PI sidebar open if already open', () => {
      usePanelsStore.setState({ isPISidebarOpen: true });
      usePanelsStore.getState().handlePointClick(3);
      const s = usePanelsStore.getState();
      expect(s.highlightRowIndex).toBe(3);
      expect(s.isPISidebarOpen).toBe(true);
    });
  });

  describe('handleRowClick', () => {
    it('sets highlighted chart point', () => {
      usePanelsStore.getState().handleRowClick(22);
      expect(usePanelsStore.getState().highlightedChartPoint).toBe(22);
    });
  });

  describe('CoScout/findings coexistence', () => {
    it('opening CoScout keeps findings open', () => {
      usePanelsStore.getState().setFindingsOpen(true);
      usePanelsStore.getState().setCoScoutOpen(true);
      const s = usePanelsStore.getState();
      expect(s.isCoScoutOpen).toBe(true);
      expect(s.isFindingsOpen).toBe(true);
    });

    it('opening findings keeps CoScout open', () => {
      usePanelsStore.getState().setCoScoutOpen(true);
      usePanelsStore.getState().setFindingsOpen(true);
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(true);
      expect(s.isCoScoutOpen).toBe(true);
    });

    it('toggling CoScout open keeps findings open', () => {
      usePanelsStore.getState().setFindingsOpen(true);
      usePanelsStore.getState().toggleCoScout();
      const s = usePanelsStore.getState();
      expect(s.isCoScoutOpen).toBe(true);
      expect(s.isFindingsOpen).toBe(true);
    });

    it('toggling findings open keeps CoScout open', () => {
      usePanelsStore.getState().setCoScoutOpen(true);
      usePanelsStore.getState().toggleFindings();
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(true);
      expect(s.isCoScoutOpen).toBe(true);
    });

    it('closing CoScout does not affect findings', () => {
      usePanelsStore.setState({ isCoScoutOpen: true, isFindingsOpen: true });
      usePanelsStore.getState().setCoScoutOpen(false);
      const s = usePanelsStore.getState();
      expect(s.isCoScoutOpen).toBe(false);
      expect(s.isFindingsOpen).toBe(true);
    });
  });

  describe('multi-step sequences', () => {
    it('open findings -> point click -> close findings preserves PI sidebar', () => {
      usePanelsStore.getState().setFindingsOpen(true);
      usePanelsStore.getState().handlePointClick(5);
      usePanelsStore.getState().setFindingsOpen(false);
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isPISidebarOpen).toBe(true);
      expect(s.highlightRowIndex).toBe(5);
    });
  });

  describe('workspace navigation (ADR-055)', () => {
    it('defaults to analysis', () => {
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });

    it('showDashboard sets activeView to dashboard', () => {
      usePanelsStore.getState().showDashboard();
      expect(usePanelsStore.getState().activeView).toBe('dashboard');
    });

    it('showAnalysis sets activeView to analysis', () => {
      usePanelsStore.getState().showDashboard();
      usePanelsStore.getState().showAnalysis();
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });

    it('showInvestigation sets activeView to investigation', () => {
      usePanelsStore.getState().showInvestigation();
      expect(usePanelsStore.getState().activeView).toBe('investigation');
    });

    it('showInvestigation closes findings sidebar', () => {
      usePanelsStore.setState({ isFindingsOpen: true });
      usePanelsStore.getState().showInvestigation();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('showImprovement sets activeView to improvement', () => {
      usePanelsStore.getState().showImprovement();
      expect(usePanelsStore.getState().activeView).toBe('improvement');
    });

    it('showImprovement closes whatIf', () => {
      usePanelsStore.setState({ isWhatIfOpen: true });
      usePanelsStore.getState().showImprovement();
      expect(usePanelsStore.getState().isWhatIfOpen).toBe(false);
    });

    it('showReport sets activeView to report', () => {
      usePanelsStore.getState().showReport();
      expect(usePanelsStore.getState().activeView).toBe('report');
    });

    it('showReport from any workspace', () => {
      usePanelsStore.getState().showImprovement();
      usePanelsStore.getState().showReport();
      expect(usePanelsStore.getState().activeView).toBe('report');
    });

    it('showAnalysis returns from report workspace', () => {
      usePanelsStore.getState().showReport();
      usePanelsStore.getState().showAnalysis();
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });
  });

  describe('PI panel tab and overflow', () => {
    it('defaults piActiveTab to stats', () => {
      expect(usePanelsStore.getState().piActiveTab).toBe('stats');
    });

    it('defaults piOverflowView to null', () => {
      expect(usePanelsStore.getState().piOverflowView).toBeNull();
    });

    it('should set PI active tab', () => {
      usePanelsStore.getState().setPIActiveTab('questions');
      expect(usePanelsStore.getState().piActiveTab).toBe('questions');
    });

    it('should clear overflow when switching PI tabs', () => {
      usePanelsStore.getState().setPIOverflowView('data');
      usePanelsStore.getState().setPIActiveTab('journal');
      expect(usePanelsStore.getState().piOverflowView).toBeNull();
    });

    it('should set PI overflow view', () => {
      usePanelsStore.getState().setPIOverflowView('whatif');
      expect(usePanelsStore.getState().piOverflowView).toBe('whatif');
    });

    it('setPIOverflowView null clears overflow', () => {
      usePanelsStore.getState().setPIOverflowView('data');
      usePanelsStore.getState().setPIOverflowView(null);
      expect(usePanelsStore.getState().piOverflowView).toBeNull();
    });

    it('switching tab preserves other state', () => {
      usePanelsStore.getState().setPIActiveTab('questions');
      usePanelsStore.getState().setCoScoutOpen(true);
      usePanelsStore.getState().setPIActiveTab('journal');
      expect(usePanelsStore.getState().isCoScoutOpen).toBe(true);
    });
  });

  describe('initFromViewState', () => {
    it('initializes from persisted ViewState', () => {
      usePanelsStore.getState().initFromViewState({
        isFindingsOpen: true,
        isWhatIfOpen: true,
      });
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(true);
      expect(s.isWhatIfOpen).toBe(true);
    });

    it('defaults to false when ViewState is null', () => {
      usePanelsStore.setState({ isFindingsOpen: true });
      usePanelsStore.getState().initFromViewState(null);
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('defaults to false when ViewState is undefined', () => {
      usePanelsStore.setState({ isWhatIfOpen: true });
      usePanelsStore.getState().initFromViewState(undefined);
      expect(usePanelsStore.getState().isWhatIfOpen).toBe(false);
    });

    it('maps legacy editor value to analysis', () => {
      usePanelsStore.getState().initFromViewState({
        activeView: 'editor' as 'analysis',
      });
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });

    it('maps legacy isImprovementOpen to improvement workspace', () => {
      usePanelsStore.getState().initFromViewState({
        isImprovementOpen: true,
      } as never);
      expect(usePanelsStore.getState().activeView).toBe('improvement');
    });

    it('restores activeView', () => {
      usePanelsStore.getState().initFromViewState({ activeView: 'dashboard' });
      expect(usePanelsStore.getState().activeView).toBe('dashboard');
    });

    it('restores investigation workspace', () => {
      usePanelsStore.getState().initFromViewState({ activeView: 'investigation' });
      expect(usePanelsStore.getState().activeView).toBe('investigation');
    });

    it('restores improvement workspace', () => {
      usePanelsStore.getState().initFromViewState({ activeView: 'improvement' });
      expect(usePanelsStore.getState().activeView).toBe('improvement');
    });

    it('restores report workspace', () => {
      usePanelsStore.getState().initFromViewState({ activeView: 'report' });
      expect(usePanelsStore.getState().activeView).toBe('report');
    });

    it('defaults to analysis when activeView missing', () => {
      usePanelsStore.getState().initFromViewState({});
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });

    it('maps legacy isReportOpen to report workspace', () => {
      usePanelsStore.getState().initFromViewState({
        isReportOpen: true,
      } as never);
      expect(usePanelsStore.getState().activeView).toBe('report');
    });
  });

  describe('highlightedFactor', () => {
    it('should set highlighted factor and switch PI tab to questions', () => {
      usePanelsStore.getState().setHighlightedFactor('Machine');
      const state = usePanelsStore.getState();
      expect(state.highlightedFactor).toBe('Machine');
      expect(state.piActiveTab).toBe('questions');
      expect(state.isPISidebarOpen).toBe(true);
    });

    it('should clear highlighted factor', () => {
      usePanelsStore.getState().setHighlightedFactor('Machine');
      usePanelsStore.getState().setHighlightedFactor(null);
      expect(usePanelsStore.getState().highlightedFactor).toBeNull();
    });
  });

  describe('factorPreviewDismissed', () => {
    it('should default to false', () => {
      expect(usePanelsStore.getState().factorPreviewDismissed).toBe(false);
    });

    it('dismissFactorPreview sets to true', () => {
      usePanelsStore.getState().dismissFactorPreview();
      expect(usePanelsStore.getState().factorPreviewDismissed).toBe(true);
    });
  });

  describe('investigationViewMode', () => {
    it('should default to map', () => {
      expect(usePanelsStore.getState().investigationViewMode).toBe('map');
    });

    it('should toggle between map and findings', () => {
      usePanelsStore.getState().setInvestigationViewMode('findings');
      expect(usePanelsStore.getState().investigationViewMode).toBe('findings');
      usePanelsStore.getState().setInvestigationViewMode('map');
      expect(usePanelsStore.getState().investigationViewMode).toBe('map');
    });
  });
});
