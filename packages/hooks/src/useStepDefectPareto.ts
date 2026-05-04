/**
 * React hook that adapts DefectStepRollup[] to Pareto-formatted data.
 *
 * Bridges the per-step bucketing from DefectTransformResult.perStep to the
 * errorSteps prop shape consumed by ProductionLineGlanceDashboard's StepErrorPareto
 * slot.
 */

import { useMemo } from 'react';
import type { DefectStepRollup } from '@variscout/core';

export interface StepDefectParetoData {
  /** Step name (from stepKey) — Pareto X axis category. */
  category: string;
  /** Defect count for this step — Pareto Y value. */
  value: number;
  /** Optional cost total when costColumn was set. */
  cost?: number;
  /** Optional duration total when durationColumn was set. */
  duration?: number;
}

export interface UseStepDefectParetoArgs {
  /**
   * Per-step bucketing from DefectTransformResult.perStep.
   * Undefined when stepRejectedAtColumn is not set.
   */
  perStep: DefectStepRollup[] | undefined;
}

export interface UseStepDefectParetoResult {
  /** Pareto-formatted entries ready for ParetoChart consumption. Empty array when perStep is undefined or empty. */
  data: StepDefectParetoData[];
  /** True when perStep was defined AND non-empty. False otherwise (caller can use this to gate rendering). */
  hasData: boolean;
}

/**
 * Adapts DefectStepRollup[] to Pareto-formatted entries.
 *
 * Order is preserved from the input (P2.1 already sorts descending by defectCount).
 * Returns hasData=false when perStep is undefined or empty, letting callers
 * conditionally render the Pareto slot.
 */
export function useStepDefectPareto({
  perStep,
}: UseStepDefectParetoArgs): UseStepDefectParetoResult {
  return useMemo(() => {
    if (!perStep || perStep.length === 0) {
      return { data: [], hasData: false };
    }
    return {
      data: perStep.map(s => ({
        category: s.stepKey,
        value: s.defectCount,
        ...(s.costTotal !== undefined ? { cost: s.costTotal } : {}),
        ...(s.durationTotal !== undefined ? { duration: s.durationTotal } : {}),
      })),
      hasData: true,
    };
  }, [perStep]);
}
