import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  activeView: 'dashboard' | 'editor';
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isImprovementOpen: boolean;
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
  showEditor: () => void;
  openDataTable: () => void;
  closeDataTable: () => void;
  setFindingsOpen: (open: boolean) => void;
  toggleFindings: () => void;
  setCoScoutOpen: (open: boolean) => void;
  toggleCoScout: () => void;
  setWhatIfOpen: (open: boolean) => void;
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
      activeView?: 'dashboard' | 'editor';
      isFindingsOpen?: boolean;
      isWhatIfOpen?: boolean;
      isImprovementOpen?: boolean;
    } | null
  ) => void;
}

export type PanelsStore = PanelsState & PanelsActions;

// ── Store ────────────────────────────────────────────────────────────────────

export const usePanelsStore = create<PanelsStore>(set => ({
  // Initial state
  activeView: 'editor',
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
  isStatsSidebarOpen: false,

  // Dashboard/editor view toggle
  showDashboard: () =>
    set(() => ({
      activeView: 'dashboard',
      isReportOpen: false,
      isPresentationMode: false,
    })),
  showEditor: () =>
    set(() => ({
      activeView: 'editor',
    })),

  // Data table
  openDataTable: () => set({ isDataTableOpen: true }),
  closeDataTable: () => set({ isDataTableOpen: false }),

  // Findings
  setFindingsOpen: open => set({ isFindingsOpen: open }),
  toggleFindings: () => set(s => ({ isFindingsOpen: !s.isFindingsOpen })),

  // CoScout
  setCoScoutOpen: open => set({ isCoScoutOpen: open }),
  toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),

  // Stats sidebar
  toggleStatsSidebar: () => set(s => ({ isStatsSidebarOpen: !s.isStatsSidebarOpen })),

  // What-If
  setWhatIfOpen: open => set({ isWhatIfOpen: open }),

  // Improvement — mutual exclusion: closes whatIf, report, presentation
  setImprovementOpen: open =>
    set(s => {
      if (s.isImprovementOpen === open) return s;
      if (open) {
        return {
          isImprovementOpen: true,
          isWhatIfOpen: false,
          isReportOpen: false,
          isPresentationMode: false,
        };
      }
      return { isImprovementOpen: false };
    }),

  // Presentation — closes report, improvement, findings, coScout
  openPresentation: () =>
    set({
      isPresentationMode: true,
      isReportOpen: false,
      isImprovementOpen: false,
      isFindingsOpen: false,
      isCoScoutOpen: false,
    }),
  closePresentation: () => set({ isPresentationMode: false }),

  // Report — closes presentation, improvement, findings, coScout
  openReport: () =>
    set({
      isReportOpen: true,
      isPresentationMode: false,
      isImprovementOpen: false,
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

  // ViewState initialization
  initFromViewState: viewState =>
    set({
      activeView: viewState?.activeView ?? 'editor',
      isFindingsOpen: viewState?.isFindingsOpen ?? false,
      isWhatIfOpen: viewState?.isWhatIfOpen ?? false,
      isImprovementOpen: viewState?.isImprovementOpen ?? false,
    }),
}));
