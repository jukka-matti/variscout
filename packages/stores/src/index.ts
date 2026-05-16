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
  useCanvasViewportStore,
  getCanvasViewportInitialState,
  persistCanvasViewport,
  rehydrateCanvasViewport,
  getLocalViewportUpdatedAt,
  STORE_LAYER as CANVAS_VIEWPORT_STORE_LAYER,
} from './canvasViewportStore';
export type {
  CanvasViewportState,
  CanvasViewportActions,
  CanvasViewportSnapshot,
  CanvasViewportFit,
  ChartClusterState,
  AndCheckSnapshot,
  PendingComment,
  NodeId,
  TributaryId,
  GateNodePath,
  UndoEntry,
} from './canvasViewportStore';
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
export {
  activeIPStorageKey,
  useActiveIPStore,
  getActiveIPInitialState,
  STORE_LAYER as ACTIVE_IP_STORE_LAYER,
} from './activeIPStore';
export type {
  ActiveIPState,
  ActiveIPScope,
  ActiveIPStoreState,
  ActiveIPStoreActions,
  ActiveIPStore,
} from './activeIPStore';
export type { DocumentSnapshot } from './documentSnapshot';
export {
  useProjectMembershipStore,
  getProjectMembershipInitialState,
  STORE_LAYER as PROJECT_MEMBERSHIP_STORE_LAYER,
} from './useProjectMembershipStore';
export type {
  ProjectMembershipState,
  ProjectMembershipActions,
  ProjectMembershipStore,
} from './useProjectMembershipStore';
export {
  useImprovementProjectStore,
  getImprovementProjectInitialState,
  STORE_LAYER as IMPROVEMENT_PROJECT_STORE_LAYER,
} from './improvementProjectStore';
export type {
  ImprovementProjectStoreState,
  ImprovementProjectStoreActions,
  ImprovementProjectStore,
} from './improvementProjectStore';
