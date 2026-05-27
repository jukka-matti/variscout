// Task 1: Paired timing column detection
export { detectPairedTimingColumns } from './detectPairedTimingColumns';

// Formula derivation (CCJ D2 — ratio engine + calculated columns)
export * from './formula';
export type { PairedTimingColumns } from './detectPairedTimingColumns';

// Task 2: Step timing bindings + Lead_time / Total_work_time / Wait_time derivation
// Task 1 (D3): Time decomposition binding types
export type {
  StepTimingBinding,
  StepTimingsByStepId,
  TimeDimension,
  HourGranularityMinutes,
  TimeDecompositionBinding,
} from './types';
export {
  computeLeadTimeColumn,
  computeTotalWorkTimeColumn,
  computeWaitTimeColumn,
} from './leadTime';

// Task 2 (D3): Time decomposition column engine
export { computeTimeDecompositionColumns, derivedTimeColumnName } from './timeDecomposition';
