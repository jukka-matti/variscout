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
  HighlightColor,
  ViewState,
} from './projectStore';
// StageOrderMode is a domain type from @variscout/core, not a UI type
export type { StageOrderMode } from '@variscout/core';
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
export { useWallLayoutStore, persistWallLayout, rehydrateWallLayout } from './wallLayoutStore';
export type {
  WallLayoutState,
  WallLayoutActions,
  ChartClusterState,
  AndCheckSnapshot,
  PendingComment,
  NodeId,
  TributaryId,
  GateNodePath,
  UndoEntry,
} from './wallLayoutStore';
export { useCanvasStore, getCanvasInitialState } from './canvasStore';
export type {
  CanvasStoreState,
  CanvasStoreActions,
  CanvasStore,
  CanvasHistoryControls,
  CanvasDocumentSnapshot,
  CanvasHistoryEntry,
} from './canvasStore';
export {
  selectHubCommentStream,
  selectHypothesisTributaries,
  selectOpenQuestionsWithoutHub,
  selectQuestionsForHub,
} from './wallSelectors';
export type { HubCommentEntry } from './wallSelectors';
export { useViewStore, getViewInitialState, STORE_LAYER as VIEW_STORE_LAYER } from './viewStore';
export type { ViewState as ViewStoreState, ViewActions, ViewStore } from './viewStore';
export {
  usePreferencesStore,
  getPreferencesInitialState,
  STORE_LAYER as PREFERENCES_STORE_LAYER,
} from './preferencesStore';
export type {
  PreferencesState,
  PreferencesActions,
  PreferencesStore,
  // WorkspaceView and PITab are also exported from sessionStore during the F4 migration window.
  // Use aliased names here to avoid duplicate-export collision; Task 9 collapses these when
  // sessionStore is deleted and the canonical names are promoted.
  WorkspaceView as PreferencesWorkspaceView,
  PITab as PreferencesPITab,
} from './preferencesStore';
