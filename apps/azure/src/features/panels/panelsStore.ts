import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  activeView: 'dashboard' | 'analysis' | 'investigation' | 'improvement' | 'report';
  isDataTableOpen: boolean;
  /** @deprecated Findings are moving to the Investigation workspace. Kept for backward compat; always false. Task 10 will remove consumers. */
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState. */
  pendingChartFocus: string | null;
  isPISidebarOpen: boolean;
  /** Active tab in the PI (Process Intelligence) panel. */
  piActiveTab: 'stats' | 'questions' | 'journal';
  /** Secondary overflow view within the PI panel (Data or What-If). Cleared when tab changes. */
  piOverflowView: 'data' | 'whatif' | null;
  /** Factor highlighted from Evidence Map node click (for PI panel scroll-to) */
  highlightedFactor: string | null;
  /** Investigation workspace center view: 'map' (Evidence Map) or 'findings' (FindingsLog) */
  investigationViewMode: 'map' | 'findings';
  /** Whether the Factor Preview overlay has been dismissed for this session */
  factorPreviewDismissed: boolean;
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
  togglePISidebar: () => void;
  setPIActiveTab: (tab: 'stats' | 'questions' | 'journal') => void;
  setPIOverflowView: (view: 'data' | 'whatif' | null) => void;
  setHighlightedFactor: (factor: string | null) => void;
  setInvestigationViewMode: (mode: 'map' | 'findings') => void;
  dismissFactorPreview: () => void;
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
  isFindingsOpen: false, // deprecated — always false; Task 10 will remove consumers
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

  // Process Intelligence sidebar
  togglePISidebar: () => set(s => ({ isPISidebarOpen: !s.isPISidebarOpen })),

  // PI panel tab + overflow
  setPIActiveTab: tab => set({ piActiveTab: tab, piOverflowView: null }),
  setPIOverflowView: view => set({ piOverflowView: view }),

  // What-If
  setWhatIfOpen: open => set({ isWhatIfOpen: open }),

  // Highlights
  setHighlightRow: index => set({ highlightRowIndex: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),

  // Compound: point click → set highlight row + open PI sidebar
  handlePointClick: index => set({ highlightRowIndex: index, isPISidebarOpen: true }),

  // Compound: row click → highlight chart point
  handleRowClick: index => set({ highlightedChartPoint: index }),

  // Pending chart focus (consumed by Editor to set focusedChart in ViewState)
  setPendingChartFocus: chart => set({ pendingChartFocus: chart }),

  // Evidence Map deep linking
  setHighlightedFactor: factor =>
    set(() =>
      factor
        ? { highlightedFactor: factor, piActiveTab: 'questions' as const, isPISidebarOpen: true }
        : { highlightedFactor: null }
    ),
  setInvestigationViewMode: mode => set(() => ({ investigationViewMode: mode })),
  dismissFactorPreview: () => set({ factorPreviewDismissed: true }),

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
