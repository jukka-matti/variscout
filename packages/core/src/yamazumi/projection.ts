import type { LeanProjectionResult } from '../findings/types';

/**
 * Project cycle time after eliminating a waste component.
 * Lean domain equivalent of simulateDirectAdjustment.
 */
export function projectWasteElimination(
  currentCycleTime: number,
  wasteToEliminate: number,
  taktTime?: number
): LeanProjectionResult {
  const projectedCycleTime = currentCycleTime - wasteToEliminate;
  const nonWasteTime = currentCycleTime - wasteToEliminate;

  return {
    currentCycleTime,
    currentWaste: wasteToEliminate,
    currentVARatio: nonWasteTime / currentCycleTime,
    taktTime,
    projectedCycleTime,
    projectedWaste: 0,
    projectedVARatio: nonWasteTime / projectedCycleTime,
    meetsTakt: taktTime == null || projectedCycleTime <= taktTime,
  };
}

/**
 * Project VA ratio improvement after reducing waste.
 * Takes full time breakdown: VA + NVA required + waste.
 */
export function projectVAImprovement(
  vaTime: number,
  nvaRequiredTime: number,
  wasteTime: number,
  wasteReduction: number,
  taktTime?: number
): LeanProjectionResult {
  const currentCycleTime = vaTime + nvaRequiredTime + wasteTime;
  const projectedWaste = Math.max(0, wasteTime - wasteReduction);
  const projectedCycleTime = vaTime + nvaRequiredTime + projectedWaste;

  return {
    currentCycleTime,
    currentWaste: wasteTime,
    currentVARatio: vaTime / currentCycleTime,
    taktTime,
    projectedCycleTime,
    projectedWaste,
    projectedVARatio: vaTime / projectedCycleTime,
    meetsTakt: taktTime == null || projectedCycleTime <= taktTime,
  };
}
