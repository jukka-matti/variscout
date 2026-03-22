import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelsStore } from '../panelsStore';

/** Reset store to defaults before each test. */
beforeEach(() => {
  usePanelsStore.setState({
    activeView: 'editor',
    isDataPanelOpen: false,
    isDataTableOpen: false,
    isFindingsOpen: false,
    isCoScoutOpen: false,
    isWhatIfOpen: false,
    isImprovementOpen: false,
    isPresentationMode: false,
    isReportOpen: false,
    highlightRowIndex: null,
    highlightedChartPoint: null,
    pendingChartFocus: null,
  });
});

describe('panelsStore', () => {
  describe('initial state', () => {
    it('has all booleans false and nullable fields null', () => {
      const s = usePanelsStore.getState();
      expect(s.isDataPanelOpen).toBe(false);
      expect(s.isDataTableOpen).toBe(false);
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isCoScoutOpen).toBe(false);
      expect(s.isWhatIfOpen).toBe(false);
      expect(s.isImprovementOpen).toBe(false);
      expect(s.isPresentationMode).toBe(false);
      expect(s.isReportOpen).toBe(false);
      expect(s.highlightRowIndex).toBeNull();
      expect(s.highlightedChartPoint).toBeNull();
    });
  });

  describe('data panel', () => {
    it('openDataPanel opens the data panel', () => {
      usePanelsStore.getState().openDataPanel();
      expect(usePanelsStore.getState().isDataPanelOpen).toBe(true);
    });

    it('closeDataPanel closes the data panel', () => {
      usePanelsStore.getState().openDataPanel();
      usePanelsStore.getState().closeDataPanel();
      expect(usePanelsStore.getState().isDataPanelOpen).toBe(false);
    });

    it('toggleDataPanel toggles the data panel', () => {
      usePanelsStore.getState().toggleDataPanel();
      expect(usePanelsStore.getState().isDataPanelOpen).toBe(true);

      usePanelsStore.getState().toggleDataPanel();
      expect(usePanelsStore.getState().isDataPanelOpen).toBe(false);
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

  describe('improvement workspace', () => {
    it('setImprovementOpen opens improvement workspace', () => {
      usePanelsStore.getState().setImprovementOpen(true);
      expect(usePanelsStore.getState().isImprovementOpen).toBe(true);
    });

    it('setImprovementOpen closes improvement workspace', () => {
      usePanelsStore.getState().setImprovementOpen(true);
      usePanelsStore.getState().setImprovementOpen(false);
      expect(usePanelsStore.getState().isImprovementOpen).toBe(false);
    });

    it('opening improvement closes report, presentation, and what-if', () => {
      usePanelsStore.setState({
        isReportOpen: true,
        isPresentationMode: true,
        isWhatIfOpen: true,
      });
      usePanelsStore.getState().setImprovementOpen(true);
      const s = usePanelsStore.getState();
      expect(s.isImprovementOpen).toBe(true);
      expect(s.isReportOpen).toBe(false);
      expect(s.isPresentationMode).toBe(false);
      expect(s.isWhatIfOpen).toBe(false);
    });

    it('opening report closes improvement', () => {
      usePanelsStore.getState().setImprovementOpen(true);
      usePanelsStore.getState().openReport();
      const s = usePanelsStore.getState();
      expect(s.isReportOpen).toBe(true);
      expect(s.isImprovementOpen).toBe(false);
    });

    it('opening presentation closes improvement', () => {
      usePanelsStore.getState().setImprovementOpen(true);
      usePanelsStore.getState().openPresentation();
      const s = usePanelsStore.getState();
      expect(s.isPresentationMode).toBe(true);
      expect(s.isImprovementOpen).toBe(false);
    });

    it('no-op when value is unchanged', () => {
      usePanelsStore.getState().setImprovementOpen(false);
      // Should not throw or change state
      expect(usePanelsStore.getState().isImprovementOpen).toBe(false);
    });
  });

  describe('presentation mode', () => {
    it('openPresentation enters presentation mode', () => {
      usePanelsStore.getState().openPresentation();
      expect(usePanelsStore.getState().isPresentationMode).toBe(true);
    });

    it('closePresentation exits presentation mode', () => {
      usePanelsStore.getState().openPresentation();
      usePanelsStore.getState().closePresentation();
      expect(usePanelsStore.getState().isPresentationMode).toBe(false);
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
    it('sets highlight row AND opens data panel', () => {
      usePanelsStore.getState().handlePointClick(15);
      const s = usePanelsStore.getState();
      expect(s.highlightRowIndex).toBe(15);
      expect(s.isDataPanelOpen).toBe(true);
    });

    it('keeps data panel open if already open', () => {
      usePanelsStore.getState().openDataPanel();
      usePanelsStore.getState().handlePointClick(3);
      const s = usePanelsStore.getState();
      expect(s.highlightRowIndex).toBe(3);
      expect(s.isDataPanelOpen).toBe(true);
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
    it('open findings -> point click -> close findings preserves data panel', () => {
      usePanelsStore.getState().setFindingsOpen(true);
      usePanelsStore.getState().handlePointClick(5);
      usePanelsStore.getState().setFindingsOpen(false);
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isDataPanelOpen).toBe(true);
      expect(s.highlightRowIndex).toBe(5);
    });

    it('openPresentation closes findings and CoScout (F-09)', () => {
      usePanelsStore.setState({
        isDataPanelOpen: true,
        isFindingsOpen: true,
        isCoScoutOpen: true,
      });
      usePanelsStore.getState().openPresentation();
      const s = usePanelsStore.getState();
      expect(s.isDataPanelOpen).toBe(true);
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isCoScoutOpen).toBe(false);
      expect(s.isPresentationMode).toBe(true);
    });

    it('openReport closes findings, CoScout, and data panel (F-09)', () => {
      usePanelsStore.setState({
        isDataPanelOpen: true,
        isFindingsOpen: true,
        isCoScoutOpen: true,
      });
      usePanelsStore.getState().openReport();
      const s = usePanelsStore.getState();
      expect(s.isReportOpen).toBe(true);
      expect(s.isDataPanelOpen).toBe(false);
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isCoScoutOpen).toBe(false);
    });
  });

  describe('initFromViewState', () => {
    it('initializes from persisted ViewState', () => {
      usePanelsStore.getState().initFromViewState({
        isFindingsOpen: true,
        isWhatIfOpen: true,
        isImprovementOpen: false,
      });
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(true);
      expect(s.isWhatIfOpen).toBe(true);
      expect(s.isImprovementOpen).toBe(false);
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
  });

  describe('activeView (dashboard/editor)', () => {
    it('defaults to editor', () => {
      expect(usePanelsStore.getState().activeView).toBe('editor');
    });

    it('showDashboard sets activeView to dashboard', () => {
      usePanelsStore.getState().showDashboard();
      expect(usePanelsStore.getState().activeView).toBe('dashboard');
    });

    it('showEditor sets activeView to editor', () => {
      usePanelsStore.getState().showDashboard();
      usePanelsStore.getState().showEditor();
      expect(usePanelsStore.getState().activeView).toBe('editor');
    });

    it('showDashboard closes report and presentation', () => {
      usePanelsStore.setState({ isReportOpen: true, isPresentationMode: true });
      usePanelsStore.getState().showDashboard();
      const s = usePanelsStore.getState();
      expect(s.activeView).toBe('dashboard');
      expect(s.isReportOpen).toBe(false);
      expect(s.isPresentationMode).toBe(false);
    });

    it('initFromViewState restores activeView', () => {
      usePanelsStore.getState().initFromViewState({ activeView: 'dashboard' });
      expect(usePanelsStore.getState().activeView).toBe('dashboard');
    });

    it('initFromViewState defaults to editor when activeView missing', () => {
      usePanelsStore.getState().initFromViewState({});
      expect(usePanelsStore.getState().activeView).toBe('editor');
    });
  });
});
