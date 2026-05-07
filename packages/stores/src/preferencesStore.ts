/**
 * usePreferencesStore — durable per-user preferences.
 *
 * Layer: Annotation (per-user axis). Persists to IndexedDB via idb-keyval under
 * the 'variscout-preferences' key. Replaces the legacy useSessionStore which
 * mixed transient view state with per-user preferences.
 *
 * See docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_TIME_LENS,
  DEFAULT_RISK_AXIS_CONFIG,
  type TimeLens,
  type RiskAxisConfig,
  type BudgetConfig,
} from '@variscout/core';
import { idbStorage } from './persistence/idbAdapter';

export const STORE_LAYER = 'annotation-per-user' as const;

export type WorkspaceView =
  | 'dashboard'
  | 'frame'
  | 'analysis'
  | 'investigation'
  | 'improvement'
  | 'report';
export type PITab = 'stats' | 'questions' | 'journal';

export interface PreferencesState {
  // Workspace
  activeView: WorkspaceView;
  piActiveTab: PITab;
  isPISidebarOpen: boolean;
  isCoScoutOpen: boolean;
  isWhatIfOpen: boolean;
  /**
   * @deprecated Findings are moving to the Investigation workspace.
   * Kept for backward compat; always false in investigation view.
   */
  isFindingsOpen: boolean;

  // AI
  aiEnabled: boolean;
  aiPreferences: Record<string, boolean>;
  knowledgeSearchFolder: string | null;
  skipQuestionLinkPrompt: boolean;

  // Analysis lens
  timeLens: TimeLens;

  // Improvement (relocated from improvementStore — see Task 6)
  riskAxisConfig: RiskAxisConfig;
  budgetConfig: BudgetConfig;
}

export interface PreferencesActions {
  // Workspace navigation (parity with legacy sessionStore actions)
  showDashboard: () => void;
  showAnalysis: () => void;
  showInvestigation: () => void;
  showImprovement: () => void;
  showReport: () => void;

  // Panel toggles
  togglePISidebar: () => void;
  /** Open/close PI sidebar explicitly. */
  setPISidebarOpen: (open: boolean) => void;
  setPIActiveTab: (tab: PITab) => void;
  toggleCoScout: () => void;
  toggleWhatIf: () => void;
  toggleFindings: () => void;

  // AI
  setAIEnabled: (enabled: boolean) => void;
  setAIPreferences: (prefs: Record<string, boolean>) => void;
  setKnowledgeSearchFolder: (folder: string | null) => void;
  setSkipQuestionLinkPrompt: (value: boolean) => void;

  // Lens
  setTimeLens: (lens: TimeLens) => void;

  // Improvement
  setRiskAxisConfig: (config: RiskAxisConfig) => void;
  setBudgetConfig: (config: BudgetConfig) => void;
}

export type PreferencesStore = PreferencesState & PreferencesActions;

export const getPreferencesInitialState = (): PreferencesState => ({
  activeView: 'analysis',
  piActiveTab: 'stats',
  isPISidebarOpen: false,
  isCoScoutOpen: false,
  isWhatIfOpen: false,
  isFindingsOpen: false,
  aiEnabled: true,
  aiPreferences: {},
  knowledgeSearchFolder: null,
  skipQuestionLinkPrompt: false,
  timeLens: DEFAULT_TIME_LENS,
  riskAxisConfig: DEFAULT_RISK_AXIS_CONFIG,
  budgetConfig: {},
});

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    set => ({
      ...getPreferencesInitialState(),

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
      setPISidebarOpen: (open: boolean) => set({ isPISidebarOpen: open }),
      setPIActiveTab: (tab: PITab) => set({ piActiveTab: tab }),
      toggleCoScout: () => set(s => ({ isCoScoutOpen: !s.isCoScoutOpen })),
      toggleWhatIf: () => set(s => ({ isWhatIfOpen: !s.isWhatIfOpen })),
      toggleFindings: () =>
        set(s => (s.activeView === 'investigation' ? s : { isFindingsOpen: !s.isFindingsOpen })),

      // AI
      setAIEnabled: (enabled: boolean) => set({ aiEnabled: enabled }),
      setAIPreferences: (prefs: Record<string, boolean>) => set({ aiPreferences: prefs }),
      setKnowledgeSearchFolder: (folder: string | null) => set({ knowledgeSearchFolder: folder }),
      setSkipQuestionLinkPrompt: (value: boolean) => set({ skipQuestionLinkPrompt: value }),

      // Lens
      setTimeLens: (lens: TimeLens) => set({ timeLens: lens }),

      // Improvement
      setRiskAxisConfig: (config: RiskAxisConfig) => set({ riskAxisConfig: config }),
      setBudgetConfig: (config: BudgetConfig) => set({ budgetConfig: config }),
    }),
    {
      name: 'variscout-preferences',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: state => ({
        // Explicit allowlist — every persisted field listed.
        activeView: state.activeView,
        piActiveTab: state.piActiveTab,
        isPISidebarOpen: state.isPISidebarOpen,
        isCoScoutOpen: state.isCoScoutOpen,
        isWhatIfOpen: state.isWhatIfOpen,
        isFindingsOpen: state.isFindingsOpen,
        aiEnabled: state.aiEnabled,
        aiPreferences: state.aiPreferences,
        knowledgeSearchFolder: state.knowledgeSearchFolder,
        skipQuestionLinkPrompt: state.skipQuestionLinkPrompt,
        timeLens: state.timeLens,
        riskAxisConfig: state.riskAxisConfig,
        budgetConfig: state.budgetConfig,
      }),
    }
  )
);

// Expose getInitialState on the store instance for the canonical test reset
// pattern: `usePreferencesStore.setState(usePreferencesStore.getInitialState())`
// — matches `packages/stores/CLAUDE.md` Invariants and the canvasStore /
// wallLayoutStore / projectStore / viewStore precedent.
(usePreferencesStore as unknown as { getInitialState: () => PreferencesState }).getInitialState =
  getPreferencesInitialState;
