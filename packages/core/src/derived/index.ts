// Task 1: Paired timing column detection
export { detectPairedTimingColumns } from './detectPairedTimingColumns';
export type { PairedTimingColumns } from './detectPairedTimingColumns';

// Task 2: Step timing bindings + Lead_time / Total_work_time / Wait_time derivation
export type { StepTimingBinding, StepTimingsByStepId } from './types';
export {
  computeLeadTimeColumn,
  computeTotalWorkTimeColumn,
  computeWaitTimeColumn,
} from './leadTime';
