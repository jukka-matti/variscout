import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  activeView: 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState. */
  pendingChartFocus: string | null;
  isStatsSidebarOpen: boolean;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PanelsActions {
  showDashboard: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;
  openDataTable: () => void;
  closeDataTable: () => void;
  setFindingsOpen: (open: boolean) => void;
  toggleFindings: () => void;
  setCoScoutOpen: (open: boolean) => void;
  toggleCoScout: () => void;
  setWhatIfOpen: (open: boolean) => void;
  setHighlightRow: (index: number | null) => void;
  setHighlightPoint: (index: number | null) => void;
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setPendingChartFocus: (chart: string | null) => void;
  toggleStatsSidebar: () => void;
  /** Initialize persisted panel state from a saved ViewState. */
  initFromViewState: (
    viewState?: {
      activeView?: 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';
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
  highlightRowIndex: null,
  highlightedChartPoint: null,
  pendingChartFocus: null,
  isStatsSidebarOpen: false,

  // Workspace navigation (ADR-055 + header-redesign spec)
  showDashboard: () => set(() => ({ activeView: 'dashboard' })),
  showAnalysis: () => set(() => ({ activeView: 'analysis' })),
  showInvestigation: () =>
    set(() => ({
      activeView: 'investigation',
      isFindingsOpen: false, // workspace IS the findings view
    })),
  showImprovement: () =>
    set(() => ({
      activeView: 'improvement',
      isWhatIfOpen: false,
    })),
  showReport: () => set(() => ({ activeView: 'report' })),

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

  // Highlights
  setHighlightRow: index => set({ highlightRowIndex: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),

  // Compound: point click → set highlight row + open stats sidebar (PI Panel)
  handlePointClick: index => set({ highlightRowIndex: index, isStatsSidebarOpen: true }),

  // Compound: row click → highlight chart point
  handleRowClick: index => set({ highlightedChartPoint: index }),

  // Pending chart focus (consumed by Editor to set focusedChart in ViewState)
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),

  // ViewState initialization — maps legacy values
  initFromViewState: viewState => {
    let activeView = viewState?.activeView ?? 'analysis';
    // Backward compat: map legacy 'editor' value
    if ((activeView as string) === 'editor') activeView = 'analysis';
    // Backward compat: map legacy isImprovementOpen flag
    if ((viewState as Record<string, unknown>)?.isImprovementOpen) activeView = 'improvement';
    // Backward compat: map legacy isReportOpen flag
    if ((viewState as Record<string, unknown>)?.isReportOpen) activeView = 'report';
    set({
      activeView,
      isFindingsOpen: viewState?.isFindingsOpen ?? false,
      isWhatIfOpen: viewState?.isWhatIfOpen ?? false,
    });
  },
}));
