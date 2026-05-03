import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_TIME_LENS, type TimeLens } from '@variscout/core';
import { idbStorage } from './persistence/idbAdapter';

// ── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceView =
  | 'dashboard'
  | 'frame'
  | 'analysis'
  | 'investigation'
  | 'improvement'
  | 'report';
export type PITab = 'stats' | 'questions' | 'journal';

/** The subset of SessionState that is persisted to ViewState. */
export interface PersistedViewState {
  activeView: WorkspaceView;
  isFindingsOpen: boolean;
  isWhatIfOpen: boolean;
}

// ── State ────────────────────────────────────────────────────────────────────

export interface SessionState {
  /** Currently active workspace tab */
  activeView: WorkspaceView;
  /** Whether the Process Intelligence sidebar is open */
  isPISidebarOpen: boolean;
  /** Active tab in the PI panel */
  piActiveTab: PITab;
  /** Secondary overflow view within the PI panel; cleared when tab changes */
  piOverflowView: 'data' | 'whatif' | null;
  /** Whether the CoScout panel is open */
  isCoScoutOpen: boolean;
  /** Whether the What-If simulator is open */
  isWhatIfOpen: boolean;
  /** Whether the data table modal is open */
  isDataTableOpen: boolean;
  /**
   * Whether the findings panel is open.
   * @deprecated Findings are moving to the Investigation workspace.
   * Kept for backward compat; always false in investigation view.
   */
  isFindingsOpen: boolean;
  /** Row index highlighted in the data table (synced from chart point click) */
  highlightRowIndex: number | null;
  /** Chart point index highlighted (synced from data table row click) */
  highlightedChartPoint: number | null;
  /** Finding ID highlighted for bidirectional navigation */
  highlightedFindingId: string | null;
  /** Question ID expanded in the PI panel questions tab */
  expandedQuestionId: string | null;
  /** Set by navigate_to tool; consumed by Editor to focus a chart via ViewState */
  pendingChartFocus: string | null;

  // Azure-specific fields (no-op in PWA)
  /** Whether CoScout AI is enabled */
  aiEnabled: boolean;
  /** Per-component AI toggle preferences (e.g., { narration: true, insights: false }) */
  aiPreferences: Record<string, boolean>;
  /** SharePoint/OneDrive folder path for Knowledge Base search */
  knowledgeSearchFolder: string | null;
  /** Whether to suppress the "link this finding to a question?" prompt after Finding creation.
   *  Permanent opt-out persisted to IndexedDB; resets only when the user clears site data.
   *  Defaults to false (prompt shown).
   */
  skipQuestionLinkPrompt: boolean;
  /** Global time lens — filters the observation set fed to charts and page-level stats.
   *  Replaces the old per-card I-Chart segmented buttons. Defaults to DEFAULT_TIME_LENS
   *  ({ mode: 'cumulative' }).
   */
  timeLens: TimeLens;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export interface SessionActions {
  // Workspace navigation (ADR-055)
  showDashboard: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;

  // Panel toggles
  togglePISidebar: () => void;
  setPIActiveTab: (tab: PITab) => void;
  setPIOverflowView: (view: 'data' | 'whatif' | null) => void;
  toggleCoScout: () => void;
  toggleWhatIf: () => void;
  toggleDataTable: () => void;
  toggleFindings: () => void;

  // Highlights
  handlePointClick: (index: number) => void;
  handleRowClick: (index: number) => void;
  setHighlightPoint: (index: number | null) => void;
  setHighlightedFindingId: (id: string | null) => void;
  setExpandedQuestionId: (id: string | null) => void;
  setPendingChartFocus: (chart: string | null) => void;

  // Azure-specific
  setAIEnabled: (enabled: boolean) => void;
  setAIPreferences: (prefs: Record<string, boolean>) => void;
  setKnowledgeSearchFolder: (folder: string | null) => void;
  setSkipQuestionLinkPrompt: (value: boolean) => void;
  setTimeLens: (lens: TimeLens) => void;

  // Persistence
  initFromViewState: (
    viewState: (Partial<PersistedViewState> & Record<string, unknown>) | null | undefined
  ) => void;
  toViewState: () => PersistedViewState;
}

export type SessionStore = SessionState & SessionActions;

// ── Initial state ────────────────────────────────────────────────────────────

export const getSessionInitialState = (): SessionState => ({
  activeView: 'analysis',
  isPISidebarOpen: false,
  piActiveTab: 'stats',
  piOverflowView: null,
  isCoScoutOpen: false,
  isWhatIfOpen: false,
  isDataTableOpen: false,
  isFindingsOpen: false,
  highlightRowIndex: null,
  highlightedChartPoint: null,
  highlightedFindingId: null,
  expandedQuestionId: null,
  pendingChartFocus: null,
  aiEnabled: true,
  aiPreferences: {},
  knowledgeSearchFolder: null,
  skipQuestionLinkPrompt: false,
  timeLens: DEFAULT_TIME_LENS,
});

// ── Store ────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionStore>()(
  persist(
    set => ({
      ...getSessionInitialState(),

      // Workspace navigation
      showDashboard: () => set({ activeView: 'dashboard' }),
      showAnalysis: () => set({ activeView: 'analysis' }),
      showInvestigation: () =>
        set({
          activeView: 'investigation',
          isPISidebarOpen: true,
          piActiveTab: 'questions',
        }),
      showImprovement: () =>
        set({
          activeView: 'improvement',
          isWhatIfOpen: false,
        }),
      showReport: () => set({ activeView: 'report' }),

      // Panel toggles
      togglePISidebar: () => set(s => ({ isPISidebarOpen: !s.isPISidebarOpen })),
      setPIActiveTab: tab => set({ piActiveTab: tab, piOverflowView: null }),
      setPIOverflowView: view => set({ piOverflowView: view }),
      toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),
      toggleWhatIf: () => set(s => ({ isWhatIfOpen: !s.isWhatIfOpen })),
      toggleDataTable: () => set(s => ({ isDataTableOpen: !s.isDataTableOpen })),
      toggleFindings: () =>
        set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: !s.isFindingsOpen })),

      // Highlights
      handlePointClick: index => set({ highlightRowIndex: index, isPISidebarOpen: true }),
      handleRowClick: index => set({ highlightedChartPoint: index }),
      setHighlightPoint: index => set({ highlightedChartPoint: index }),
      setHighlightedFindingId: id => set({ highlightedFindingId: id }),
      setExpandedQuestionId: id => set({ expandedQuestionId: id }),
      setPendingChartFocus: chart => set({ pendingChartFocus: chart }),

      // Azure-specific
      setAIEnabled: enabled => set({ aiEnabled: enabled }),
      setAIPreferences: prefs => set({ aiPreferences: prefs }),
      setKnowledgeSearchFolder: folder => set({ knowledgeSearchFolder: folder }),
      setSkipQuestionLinkPrompt: value => set({ skipQuestionLinkPrompt: value }),
      setTimeLens: lens => set({ timeLens: lens }),

      // Persistence
      initFromViewState: viewState => {
        let activeView: WorkspaceView = (viewState?.activeView as WorkspaceView) ?? 'analysis';
        // Backward compat: map legacy 'editor' value from old persisted data
        if ((activeView as string) === 'editor') activeView = 'analysis';
        set({
          activeView,
          isFindingsOpen: (viewState?.isFindingsOpen as boolean) ?? false,
          isWhatIfOpen: (viewState?.isWhatIfOpen as boolean) ?? false,
        });
      },

      toViewState: (): PersistedViewState => {
        const s = useSessionStore.getState();
        return {
          activeView: s.activeView,
          isFindingsOpen: s.isFindingsOpen,
          isWhatIfOpen: s.isWhatIfOpen,
        };
      },
    }),
    {
      name: 'variscout-session',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>;
        if (version < 1) {
          // Task 1: timeLens added — guard against pre-v1 blobs that lack the key.
          return { ...state, timeLens: state['timeLens'] ?? DEFAULT_TIME_LENS };
        }
        return state;
      },
      storage: createJSONStorage(() => idbStorage),
      partialize: state => ({
        // Only persist user preferences, not transient highlights
        activeView: state.activeView,
        isPISidebarOpen: state.isPISidebarOpen,
        piActiveTab: state.piActiveTab,
        isCoScoutOpen: state.isCoScoutOpen,
        isWhatIfOpen: state.isWhatIfOpen,
        isFindingsOpen: state.isFindingsOpen,
        aiEnabled: state.aiEnabled,
        aiPreferences: state.aiPreferences,
        knowledgeSearchFolder: state.knowledgeSearchFolder,
        skipQuestionLinkPrompt: state.skipQuestionLinkPrompt,
        timeLens: state.timeLens,
      }),
    }
  )
);
