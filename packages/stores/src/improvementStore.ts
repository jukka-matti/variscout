import { create } from 'zustand';
import type { RiskAxisConfig, BudgetConfig } from '@variscout/core';
import { DEFAULT_RISK_AXIS_CONFIG } from '@variscout/core';

// ── State ────────────────────────────────────────────────────────────────────

export interface ImprovementState {
  /** Active improvement view: plan (default) or track */
  activeView: 'plan' | 'track';
  /** ID of idea highlighted via matrix↔card bidirectional navigation */
  highlightedIdeaId: string | null;
  /** Which two risk axes are active in the prioritization matrix */
  riskAxisConfig: RiskAxisConfig;
  /** Budget envelope for improvement cost estimation */
  budgetConfig: BudgetConfig;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export interface ImprovementActions {
  setActiveView: (view: 'plan' | 'track') => void;
  setHighlightedIdeaId: (id: string | null) => void;
  setRiskAxisConfig: (config: RiskAxisConfig) => void;
  setBudgetConfig: (config: BudgetConfig) => void;
}

export type ImprovementStore = ImprovementState & ImprovementActions;

// ── Initial state ────────────────────────────────────────────────────────────

export const getImprovementInitialState = (): ImprovementState => ({
  activeView: 'plan',
  highlightedIdeaId: null,
  riskAxisConfig: DEFAULT_RISK_AXIS_CONFIG,
  budgetConfig: {},
});

// ── Store ────────────────────────────────────────────────────────────────────

export const useImprovementStore = create<ImprovementStore>(set => ({
  ...getImprovementInitialState(),

  setActiveView: view => set({ activeView: view }),
  setHighlightedIdeaId: id => set({ highlightedIdeaId: id }),
  setRiskAxisConfig: config => set({ riskAxisConfig: config }),
  setBudgetConfig: config => set({ budgetConfig: config }),
}));
