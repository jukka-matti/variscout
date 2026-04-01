import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  // Panel visibility
  isSettingsOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isPresentationMode: boolean;
  isWhatIfOpen: boolean;
  isStatsSidebarOpen: boolean;

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
  // Simple toggles
  setSettingsOpen: (open: boolean) => void;
  setDataTableOpen: (open: boolean) => void;
  setFindingsOpen: (open: boolean) => void;
  toggleFindings: () => void;
  setPresentationMode: (on: boolean) => void;
  setWhatIfOpen: (open: boolean) => void;
  toggleStatsSidebar: () => void;

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
  isSettingsOpen: false,
  isDataTableOpen: false,
  isFindingsOpen: false,
  isPresentationMode: false,
  isWhatIfOpen: false,
  isStatsSidebarOpen: false,
  highlightRowIndex: null,
  highlightedChartPoint: null,
  showExcludedOnly: false,
  showResetConfirm: false,
  openSpecEditorRequested: false,
};

// ── Store ────────────────────────────────────────────────────────────────────

export const usePanelsStore = create<PanelsStore>(set => ({
  ...initialPanelsState,

  // Simple toggles
  setSettingsOpen: open => set({ isSettingsOpen: open }),
  setDataTableOpen: open => set({ isDataTableOpen: open }),
  setFindingsOpen: open => set({ isFindingsOpen: open }),
  toggleFindings: () => set(s => ({ isFindingsOpen: !s.isFindingsOpen })),
  setPresentationMode: on => set({ isPresentationMode: on }),
  setWhatIfOpen: open => set({ isWhatIfOpen: open }),
  toggleStatsSidebar: () => set(s => ({ isStatsSidebarOpen: !s.isStatsSidebarOpen })),

  // Highlights
  setHighlightRow: index => set({ highlightRowIndex: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),

  // Compound: point click → set highlight row + open stats sidebar
  handlePointClick: index => set({ highlightRowIndex: index, isStatsSidebarOpen: true }),

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
