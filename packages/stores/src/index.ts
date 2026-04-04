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
} from './projectStore';
