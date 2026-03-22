import { create } from 'zustand';

// ── State ────────────────────────────────────────────────────────────────────

interface PanelsState {
  isDataPanelOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  isImprovementOpen: boolean;
  isPresentationMode: boolean;
  isReportOpen: boolean;
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PanelsActions {
  openDataPanel: () => void;
  closeDataPanel: () => void;
  toggleDataPanel: () => void;
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
  /** Initialize persisted panel state from a saved ViewState. */
  initFromViewState: (
    viewState?: {
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

  // Data panel
  openDataPanel: () => set({ isDataPanelOpen: true }),
  closeDataPanel: () => set({ isDataPanelOpen: false }),
  toggleDataPanel: () => set(s => ({ isDataPanelOpen: !s.isDataPanelOpen })),

  // Data table
  openDataTable: () => set({ isDataTableOpen: true }),
  closeDataTable: () => set({ isDataTableOpen: false }),

  // Findings
  setFindingsOpen: open => set({ isFindingsOpen: open }),
  toggleFindings: () => set(s => ({ isFindingsOpen: !s.isFindingsOpen })),

  // CoScout
  setCoScoutOpen: open => set({ isCoScoutOpen: open }),
  toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),

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

  // Report — closes presentation, improvement, findings, coScout, dataPanel
  openReport: () =>
    set({
      isReportOpen: true,
      isPresentationMode: false,
      isImprovementOpen: false,
      isFindingsOpen: false,
      isCoScoutOpen: false,
      isDataPanelOpen: false,
    }),
  closeReport: () => set({ isReportOpen: false }),

  // Highlights
  setHighlightRow: index => set({ highlightRowIndex: index }),
  setHighlightPoint: index => set({ highlightedChartPoint: index }),

  // Compound: point click → set highlight row + open data panel
  handlePointClick: index => set({ highlightRowIndex: index, isDataPanelOpen: true }),

  // Compound: row click → highlight chart point
  handleRowClick: index => set({ highlightedChartPoint: index }),

  // ViewState initialization
  initFromViewState: viewState =>
    set({
      isFindingsOpen: viewState?.isFindingsOpen ?? false,
      isWhatIfOpen: viewState?.isWhatIfOpen ?? false,
      isImprovementOpen: viewState?.isImprovementOpen ?? false,
    }),
}));
