import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelsStore, initialPanelsState } from '../panelsStore';

beforeEach(() => {
  usePanelsStore.setState(initialPanelsState);
});

describe('panelsStore', () => {
  describe('initial state', () => {
    it('has all booleans false and nullable fields null', () => {
      const s = usePanelsStore.getState();
      expect(s.isFindingsOpen).toBe(false);
      expect(s.isDataTableOpen).toBe(false);
      expect(s.isPISidebarOpen).toBe(false);
      expect(s.highlightRowIndex).toBeNull();
      expect(s.highlightedChartPoint).toBeNull();
    });
  });

  describe('toggles', () => {
    it('toggleFindings flips isFindingsOpen', () => {
      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('togglePISidebar flips isPISidebarOpen', () => {
      usePanelsStore.getState().togglePISidebar();
      expect(usePanelsStore.getState().isPISidebarOpen).toBe(true);
    });
  });

  describe('compound actions', () => {
    it('handlePointClick sets highlight row and opens PI sidebar', () => {
      usePanelsStore.getState().handlePointClick(42);
      const s = usePanelsStore.getState();
      expect(s.highlightRowIndex).toBe(42);
      expect(s.isPISidebarOpen).toBe(true);
    });

    it('handleRowClick sets highlighted chart point', () => {
      usePanelsStore.getState().handleRowClick(7);
      expect(usePanelsStore.getState().highlightedChartPoint).toBe(7);
    });

    it('closeDataTable clears state', () => {
      usePanelsStore.setState({
        isDataTableOpen: true,
        highlightRowIndex: 5,
        showExcludedOnly: true,
      });
      usePanelsStore.getState().closeDataTable();
      const s = usePanelsStore.getState();
      expect(s.isDataTableOpen).toBe(false);
      expect(s.highlightRowIndex).toBeNull();
      expect(s.showExcludedOnly).toBe(false);
    });

    it('openDataTableExcluded opens table with excluded filter', () => {
      usePanelsStore.getState().openDataTableExcluded();
      const s = usePanelsStore.getState();
      expect(s.isDataTableOpen).toBe(true);
      expect(s.showExcludedOnly).toBe(true);
    });
  });

  describe('workspace navigation', () => {
    it('defaults to analysis workspace', () => {
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });

    it('showAnalysis sets workspace to analysis', () => {
      usePanelsStore.getState().showInvestigation();
      usePanelsStore.getState().showAnalysis();
      expect(usePanelsStore.getState().activeView).toBe('analysis');
    });

    it('showInvestigation sets workspace and closes findings panel', () => {
      usePanelsStore.setState({ isFindingsOpen: true });
      usePanelsStore.getState().showInvestigation();
      const s = usePanelsStore.getState();
      expect(s.activeView).toBe('investigation');
      expect(s.isFindingsOpen).toBe(false);
    });

    it('showImprovement sets workspace to improvement', () => {
      usePanelsStore.getState().showImprovement();
      expect(usePanelsStore.getState().activeView).toBe('improvement');
    });

    it('showReport sets workspace to report', () => {
      usePanelsStore.getState().showReport();
      expect(usePanelsStore.getState().activeView).toBe('report');
    });

    it('toggleFindings is no-op in investigation workspace', () => {
      usePanelsStore.getState().showInvestigation();
      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('setFindingsOpen is no-op in investigation workspace', () => {
      usePanelsStore.getState().showInvestigation();
      usePanelsStore.getState().setFindingsOpen(true);
      expect(usePanelsStore.getState().isFindingsOpen).toBe(false);
    });

    it('toggleFindings works in analysis workspace', () => {
      usePanelsStore.getState().showAnalysis();
      usePanelsStore.getState().toggleFindings();
      expect(usePanelsStore.getState().isFindingsOpen).toBe(true);
    });
  });

  describe('PWA-specific actions', () => {
    it('confirmReset clears showResetConfirm', () => {
      usePanelsStore.setState({ showResetConfirm: true });
      usePanelsStore.getState().confirmReset();
      expect(usePanelsStore.getState().showResetConfirm).toBe(false);
    });
  });
});
