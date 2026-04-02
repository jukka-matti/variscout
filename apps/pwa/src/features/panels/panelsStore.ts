import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  // Workspace navigation (aligned with Azure's activeView naming per ADR-055)
  activeView: 'analysis' | 'investigation' | 'improvement' | 'report';

  // Panel visibility
  isSettingsOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isWhatIfOpen: boolean;
  isPISidebarOpen: boolean;

  // Highlight state
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;

  // PWA-specific UI state
  showExcludedOnly: boolean;
  showResetConfirm: boolean;
  openSpecEditorRequested: boolean;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PanelsActions {
  // Workspace navigation
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;

  // Simple toggles
  setSettingsOpen: (open: boolean) => void;
  setDataTableOpen: (open: boolean) => void;
  setFindingsOpen: (open: boolean) => void;
  toggleFindings: () => void;
  setWhatIfOpen: (open: boolean) => void;
  togglePISidebar: () => void;

  // Highlights
  setHighlightRow: (index: number | null) => void;
  setHighlightPoint: (index: number | null) => void;

  // Compound actions
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  closeDataTable: () => void;
  openDataTableExcluded: () => void;
  openDataTableAll: () => void;

  // PWA-specific
  setShowExcludedOnly: (v: boolean) => void;
  setShowResetConfirm: (v: boolean) => void;
  setOpenSpecEditorRequested: (v: boolean) => void;
  confirmReset: () => void;
}

export type PanelsStore = PanelsState & PanelsActions;

// ── Initial state (exported for testing) ────────────────────────────────────

export const initialPanelsState: PanelsState = {
  activeView: 'analysis',
  isSettingsOpen: false,
  isDataTableOpen: false,
  isFindingsOpen: false,
  isWhatIfOpen: false,
  isPISidebarOpen: false,
  highlightRowIndex: null,
  highlightedChartPoint: null,
  showExcludedOnly: false,
  showResetConfirm: false,
  openSpecEditorRequested: false,
};

// ── Store ────────────────────────────────────────────────────────────────────

export const usePanelsStore = create<PanelsStore>(set => ({
  ...initialPanelsState,

  // Workspace navigation
  showAnalysis: () => set({ activeView: 'analysis' }),
  showInvestigation: () => set({ activeView: 'investigation', isFindingsOpen: false }),
  showImprovement: () => set({ activeView: 'improvement' }),
  showReport: () => set({ activeView: 'report' }),

  // Simple toggles
  setSettingsOpen: open => set({ isSettingsOpen: open }),
  setDataTableOpen: open => set({ isDataTableOpen: open }),
  setFindingsOpen: open =>
    set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: open })),
  toggleFindings: () =>
    set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: !s.isFindingsOpen })),
  setWhatIfOpen: open => set({ isWhatIfOpen: open }),
  togglePISidebar: () => set(s => ({ isPISidebarOpen: !s.isPISidebarOpen })),

  // Highlights
  setHighlightRow: index => set({ highlightRowIndex: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),

  // Compound: point click → set highlight row + open PI sidebar
  handlePointClick: index => set({ highlightRowIndex: index, isPISidebarOpen: true }),

  // Compound: row click → highlight chart point
  handleRowClick: index => set({ highlightedChartPoint: index }),

  // Compound: close data table + clear state
  closeDataTable: () =>
    set({ isDataTableOpen: false, highlightRowIndex: null, showExcludedOnly: false }),

  // Compound: open excluded rows view
  openDataTableExcluded: () =>
    set({ showExcludedOnly: true, highlightRowIndex: null, isDataTableOpen: true }),

  // Compound: open all rows view
  openDataTableAll: () =>
    set({ showExcludedOnly: false, highlightRowIndex: null, isDataTableOpen: true }),

  // PWA-specific
  setShowExcludedOnly: v => set({ showExcludedOnly: v }),
  setShowResetConfirm: v => set({ showResetConfirm: v }),
  setOpenSpecEditorRequested: v => set({ openSpecEditorRequested: v }),
  confirmReset: () => set({ showResetConfirm: false }),
}));
