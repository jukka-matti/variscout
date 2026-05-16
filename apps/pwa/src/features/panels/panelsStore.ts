import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  // Workspace navigation (aligned with Azure's activeView naming per ADR-055
  // and extended with 'frame' per ADR-070).
  activeView:
    | 'home'
    | 'frame'
    | 'analysis'
    | 'investigation'
    | 'improvement'
    | 'projects'
    | 'report'
    | 'charter'
    | 'sustainment'
    | 'handoff';

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
  sustainmentTargetId: string | null;
  handoffTargetId: string | null;
  selectedProjectId: string | null;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PanelsActions {
  // Workspace navigation
  showHome: () => void;
  showFrame: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showProjects: (projectId?: string) => void;
  showReport: () => void;
  showCharter: () => void;
  showSustainment: (targetId?: string) => void;
  showHandoff: (targetId?: string) => void;

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
  openDataTableAtRow: (index: number, isDesktop: boolean) => void;

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
  sustainmentTargetId: null,
  handoffTargetId: null,
  selectedProjectId: null,
};

// ── Store ────────────────────────────────────────────────────────────────────

export const usePanelsStore = create<PanelsStore>(set => ({
  ...initialPanelsState,

  // Workspace navigation
  showHome: () => set({ activeView: 'home', isFindingsOpen: false, selectedProjectId: null }),
  showFrame: () => set({ activeView: 'frame', isFindingsOpen: false }),
  showAnalysis: () => set({ activeView: 'analysis' }),
  showInvestigation: () => set({ activeView: 'investigation', isFindingsOpen: false }),
  showImprovement: () => set({ activeView: 'improvement' }),
  showProjects: projectId => set({ activeView: 'projects', selectedProjectId: projectId ?? null }),
  showReport: () => set({ activeView: 'report' }),
  showCharter: () => set({ activeView: 'charter', isFindingsOpen: false }),
  showSustainment: targetId =>
    set({
      activeView: 'sustainment',
      isFindingsOpen: false,
      sustainmentTargetId: targetId ?? null,
    }),
  // Alias for showSustainment — wedge V1 folds Handoff into Sustainment-closure (ADR-082). Inbox prompts + context links still emit surface === 'handoff'; routing through this alias keeps them reachable.
  showHandoff: targetId =>
    set({
      activeView: 'sustainment',
      isFindingsOpen: false,
      sustainmentTargetId: targetId ?? null,
    }),

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

  // Compound: open data table at specific row — desktop uses PI sidebar, mobile uses modal
  openDataTableAtRow: (index, isDesktop) =>
    isDesktop
      ? set({ highlightRowIndex: index, isPISidebarOpen: true })
      : set({ highlightRowIndex: index, isDataTableOpen: true }),

  // PWA-specific
  setShowExcludedOnly: v => set({ showExcludedOnly: v }),
  setShowResetConfirm: v => set({ showResetConfirm: v }),
  setOpenSpecEditorRequested: v => set({ openSpecEditorRequested: v }),
  confirmReset: () => set({ showResetConfirm: false }),
}));
