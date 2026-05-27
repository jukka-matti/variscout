/**
 * Step timing binding — describes how a process step's time contribution
 * is derived from dataset columns.
 *
 * - `'paired'`  : step has explicit start + end timestamp columns. Used for
 *   Lead_time calculation (max(end) – min(start) across steps).
 * - `'duration'`: step has a pre-computed duration column (numeric, in ms).
 *   Contributes to Total_work_time only; cannot contribute to Lead_time
 *   because it has no absolute start/end timestamps.
 */
export type StepTimingBinding =
  | {
      kind: 'paired';
      stepId: string;
      startColumn: string;
      endColumn: string;
    }
  | {
      kind: 'duration';
      stepId: string;
      durationColumn: string;
    };

export type StepTimingsByStepId = Record<string, StepTimingBinding>;
