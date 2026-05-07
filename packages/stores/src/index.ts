// @variscout/stores — Zustand domain stores
// Stores will be exported as they are implemented
export { idbStorage } from './persistence/idbAdapter';
export {
  useProjectStore,
  getProjectInitialState,
  STORE_LAYER as PROJECT_STORE_LAYER,
} from './projectStore';
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
  STORE_LAYER as INVESTIGATION_STORE_LAYER,
} from './investigationStore';
export type { InvestigationState, InvestigationActions } from './investigationStore';
export {
  useWallLayoutStore,
  persistWallLayout,
  rehydrateWallLayout,
  STORE_LAYER as WALL_LAYOUT_STORE_LAYER,
} from './wallLayoutStore';
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
export {
  useCanvasStore,
  getCanvasInitialState,
  STORE_LAYER as CANVAS_STORE_LAYER,
} from './canvasStore';
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
  WorkspaceView,
  PITab,
} from './preferencesStore';
export type { DocumentSnapshot } from './documentSnapshot';
