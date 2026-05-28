import type { ProcessStepEntry } from '@variscout/core/improvementProject';

/**
 * `ExtractedStep` is the Canvas-EditMode-side alias for `ProcessStepEntry`.
 *
 * Historically (C3) this was a locally-defined `{ id; name; order }` interface
 * scoped to the ProcessZone drop journey. PR-CCJ-E1 T5 lifted the
 * `processSteps` field onto `ImprovementProject` and aliased the two so the
 * Canvas drop handler + `IP.processSteps` share a single nominal type without
 * the forbidden `core → ui` import.
 *
 * Keep the `ExtractedStep` name throughout the Canvas EditMode tree (so
 * `EditModeShell` / `handleEditModeDragEnd` / `handleProcessStructureDrop`
 * read as a connected story). The IP root persists the same shape.
 */
export type ExtractedStep = ProcessStepEntry;

export function extractStepsFromCategoricalColumn(
  columnName: string,
  distinctValues: string[]
): ExtractedStep[] {
  return distinctValues.map((value, idx) => ({
    id: `step-${columnName}-${idx}`,
    name: value,
    order: idx,
  }));
}
