export type DefectDataShape = 'event-log' | 'pre-aggregated' | 'pass-fail';

export interface DefectMapping {
  dataShape: DefectDataShape;
  defectTypeColumn?: string;
  countColumn?: string;
  resultColumn?: string;
  aggregationUnit: string;
  unitsProducedColumn?: string;
  costColumn?: string;
  durationColumn?: string;
  /**
   * Optional column whose value identifies which step caught/rejected each defect
   * (e.g. "step_rejected_at", "Step", "Station"). When present,
   * `computeDefectRates` emits per-step bucketing in `DefectTransformResult.perStep`.
   * When absent, only system-level (whole-line) aggregation is produced and
   * `perStep` is `undefined`.
   *
   * Detection/suggestion logic lives in `defect/detection.ts` (P2.2).
   * Spec reference: §9.1 defect anchoring.
   */
  stepRejectedAtColumn?: string;
}

/**
 * Per-step rollup of defect counts attributed to a specific process step.
 * Populated in `DefectTransformResult.perStep` when `DefectMapping.stepRejectedAtColumn`
 * is configured.
 *
 * Entries are sorted descending by `defectCount` so downstream Pareto rendering
 * can consume the array directly.
 *
 * NOTE on `defectRate`: units-produced is typically recorded at the
 * aggregation-unit level (e.g., per batch), not per step. Deriving a meaningful
 * per-step rate would require apportioning units across steps — an assumption
 * the engine cannot safely make. Therefore `defectRate` is always `undefined`
 * in V1; it is reserved for when the caller supplies explicit per-step
 * production volumes (future P2.x work).
 */
export interface DefectStepRollup {
  /** Value from `stepRejectedAtColumn` for this row group (e.g., "Mold", "QC"). */
  stepKey: string;
  /** Defect count attributed to this step. */
  defectCount: number;
  /**
   * Reserved — always `undefined` in V1.
   * Per-step rate cannot be derived without explicit per-step production volumes.
   */
  defectRate?: number;
  /** Sum of `costColumn` values for this step; defined only when `costColumn` is set. */
  costTotal?: number;
  /** Sum of `durationColumn` values for this step; defined only when `durationColumn` is set. */
  durationTotal?: number;
}

export interface DefectDetection {
  isDefectFormat: boolean;
  confidence: 'high' | 'medium' | 'low';
  dataShape: DefectDataShape;
  suggestedMapping: Partial<DefectMapping>;
}
