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
      expect(s.isPresentationMode).toBe(false);
      expect(s.isStatsSidebarOpen).toBe(false);
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

    it('toggleStatsSidebar flips isStatsSidebarOpen', () => {
      usePanelsStore.getState().toggleStatsSidebar();
      expect(usePanelsStore.getState().isStatsSidebarOpen).toBe(true);
    });
  });

  describe('compound actions', () => {
    it('handlePointClick sets highlight row and opens stats sidebar', () => {
      usePanelsStore.getState().handlePointClick(42);
      const s = usePanelsStore.getState();
      expect(s.highlightRowIndex).toBe(42);
      expect(s.isStatsSidebarOpen).toBe(true);
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

  describe('PWA-specific actions', () => {
    it('confirmReset clears showResetConfirm', () => {
      usePanelsStore.setState({ showResetConfirm: true });
      usePanelsStore.getState().confirmReset();
      expect(usePanelsStore.getState().showResetConfirm).toBe(false);
    });
  });
});
