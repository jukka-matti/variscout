// @variscout/stores — Zustand domain stores
// Stores will be exported as they are implemented
export { idbStorage } from './persistence/idbAdapter';
export { useProjectStore, getProjectInitialState } from './projectStore';
export type {
  ProjectState,
  ProjectActions,
  SerializedProject,
  DisplayOptions,
  ChartTitles,
  AxisSettings,
  ParetoMode,
  ParetoAggregation,
  ParetoRow,
  DataQualityReport,
  ScaleMode,
  StageOrderMode,
  HighlightColor,
  ViewState,
} from './projectStore';
export {
  useInvestigationStore,
  getInvestigationInitialState,
  MAX_QUESTION_DEPTH,
  MAX_CHILDREN_PER_PARENT,
} from './investigationStore';
export type { InvestigationState, InvestigationActions } from './investigationStore';
export { useImprovementStore, getImprovementInitialState } from './improvementStore';
export type { ImprovementState, ImprovementActions, ImprovementStore } from './improvementStore';
export { useSessionStore, getSessionInitialState } from './sessionStore';
export type {
  SessionState,
  SessionActions,
  SessionStore,
  WorkspaceView,
  PITab,
  PersistedViewState,
} from './sessionStore';
