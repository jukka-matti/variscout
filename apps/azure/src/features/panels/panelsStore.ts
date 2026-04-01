import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  activeView: 'dashboard' | 'analysis' | 'investigation' | 'improvement';
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isPresentationMode: boolean;
  isReportOpen: boolean;
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState. */
  pendingChartFocus: string | null;
  isStatsSidebarOpen: boolean;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PanelsActions {
  showDashboard: () => void;
  /** @deprecated Use showAnalysis() instead */
  showEditor: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  openDataTable: () => void;
  closeDataTable: () => void;
  setFindingsOpen: (open: boolean) => void;
  toggleFindings: () => void;
  setCoScoutOpen: (open: boolean) => void;
  toggleCoScout: () => void;
  setWhatIfOpen: (open: boolean) => void;
  /** @deprecated Use showImprovement() / showAnalysis() instead */
  setImprovementOpen: (open: boolean) => void;
  openPresentation: () => void;
  closePresentation: () => void;
  openReport: () => void;
  closeReport: () => void;
  setHighlightRow: (index: number | null) => void;
  setHighlightPoint: (index: number | null) => void;
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setPendingChartFocus: (chart: string | null) => void;
  toggleStatsSidebar: () => void;
  /** Initialize persisted panel state from a saved ViewState. */
  initFromViewState: (
    viewState?: {
      activeView?: 'dashboard' | 'analysis' | 'investigation' | 'improvement';
      isFindingsOpen?: boolean;
      isWhatIfOpen?: boolean;
    } | null
  ) => void;
}

export type PanelsStore = PanelsState & PanelsActions;

// ── Store ────────────────────────────────────────────────────────────────────

export const usePanelsStore = create<PanelsStore>(set => ({
  // Initial state
  activeView: 'analysis',
  isDataTableOpen: false,
  isFindingsOpen: false,
  isCoScoutOpen: false,
  isWhatIfOpen: false,
  isPresentationMode: false,
  isReportOpen: false,
  highlightRowIndex: null,
  highlightedChartPoint: null,
  pendingChartFocus: null,
  isStatsSidebarOpen: false,

  // Workspace navigation (ADR-055)
  showDashboard: () =>
    set(() => ({
      activeView: 'dashboard',
      isReportOpen: false,
      isPresentationMode: false,
    })),
  showEditor: () =>
    set(() => ({
      activeView: 'analysis',
    })),
  showAnalysis: () =>
    set(() => ({
      activeView: 'analysis',
    })),
  showInvestigation: () =>
    set(() => ({
      activeView: 'investigation',
      isFindingsOpen: false, // workspace IS the findings view
    })),
  showImprovement: () =>
    set(() => ({
      activeView: 'improvement',
      isWhatIfOpen: false,
      isReportOpen: false,
      isPresentationMode: false,
    })),

  // Data table
  openDataTable: () => set({ isDataTableOpen: true }),
  closeDataTable: () => set({ isDataTableOpen: false }),

  // Findings — no-op in investigation workspace (workspace IS the findings view)
  setFindingsOpen: open =>
    set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: open })),
  toggleFindings: () =>
    set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: !s.isFindingsOpen })),

  // CoScout
  setCoScoutOpen: open => set({ isCoScoutOpen: open }),
  toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),

  // Stats sidebar
  toggleStatsSidebar: () => set(s => ({ isStatsSidebarOpen: !s.isStatsSidebarOpen })),

  // What-If
  setWhatIfOpen: open => set({ isWhatIfOpen: open }),

  // Improvement — backward compat shim, delegates to workspace actions
  setImprovementOpen: open =>
    set(s => {
      if (open && s.activeView === 'improvement') return s;
      if (!open && s.activeView !== 'improvement') return s;
      if (open) {
        return {
          activeView: 'improvement',
          isWhatIfOpen: false,
          isReportOpen: false,
          isPresentationMode: false,
        };
      }
      return { activeView: 'analysis' };
    }),

  // Presentation — forces analysis workspace, closes other overlays
  openPresentation: () =>
    set({
      activeView: 'analysis',
      isPresentationMode: true,
      isReportOpen: false,
      isFindingsOpen: false,
      isCoScoutOpen: false,
    }),
  closePresentation: () => set({ isPresentationMode: false }),

  // Report — forces analysis workspace, closes other overlays
  openReport: () =>
    set({
      activeView: 'analysis',
      isReportOpen: true,
      isPresentationMode: false,
      isFindingsOpen: false,
      isCoScoutOpen: false,
    }),
  closeReport: () => set({ isReportOpen: false }),

  // Highlights
  setHighlightRow: index => set({ highlightRowIndex: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),

  // Compound: point click → set highlight row + open stats sidebar (PI Panel)
  handlePointClick: index => set({ highlightRowIndex: index, isStatsSidebarOpen: true }),

  // Compound: row click → highlight chart point
  handleRowClick: index => set({ highlightedChartPoint: index }),

  // Pending chart focus (consumed by Editor to set focusedChart in ViewState)
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),

  // ViewState initialization — maps legacy 'editor' to 'analysis', legacy isImprovementOpen to workspace
  initFromViewState: viewState => {
    let activeView = viewState?.activeView ?? 'analysis';
    // Backward compat: map legacy 'editor' value
    if ((activeView as string) === 'editor') activeView = 'analysis';
    // Backward compat: map legacy isImprovementOpen flag
    if ((viewState as Record<string, unknown>)?.isImprovementOpen) activeView = 'improvement';
    set({
      activeView,
      isFindingsOpen: viewState?.isFindingsOpen ?? false,
      isWhatIfOpen: viewState?.isWhatIfOpen ?? false,
    });
  },
}));
