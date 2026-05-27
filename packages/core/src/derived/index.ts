// Task 1: Paired timing column detection
export { detectPairedTimingColumns } from './detectPairedTimingColumns';

// Formula derivation (CCJ D2 — ratio engine + calculated columns)
export * from './formula';
export type { PairedTimingColumns } from './detectPairedTimingColumns';

// Task 2: Step timing bindings + Lead_time / Total_work_time / Wait_time derivation
export type { StepTimingBinding, StepTimingsByStepId } from './types';
export {
  computeLeadTimeColumn,
  computeTotalWorkTimeColumn,
  computeWaitTimeColumn,
} from './leadTime';
