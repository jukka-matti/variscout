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

export type TimeDimension = 'year' | 'quarter' | 'month' | 'week' | 'dayOfWeek' | 'hour';

export type HourGranularityMinutes = 60 | 30 | 15 | 5;

export interface TimeDecompositionBinding {
  /** Stable id for React keys + binding-by-id lookups */
  id: string;
  /** The source column name (must be a date-kind column) */
  sourceColumn: string;
  /** Which time dimensions to derive */
  dimensions: TimeDimension[];
  /** Meaningful only when 'hour' is in dimensions. Defaults to 60 when omitted. */
  hourGranularityMinutes?: HourGranularityMinutes;
}
