import type { ProcessStepEntry } from '@variscout/core/improvementProject';

/**
 * `ExtractedStep` is the Canvas-EditMode-side alias for `ProcessStepEntry`.
 *
 * The type is retained for any external callers that may reference it; the
 * `extractStepsFromCategoricalColumn` function it accompanied has been retired
 * in IM-0b. The old function minted `step-${columnName}-${idx}` ids that
 * `handleStepsReplace` immediately discarded (it only used `step.name` and
 * re-minted canonical ids via `addStepsFromColumn`). The drop handler now
 * passes ordered distinct values straight to the callback — no intermediate
 * `ExtractedStep[]` with throwaway ids.
 */
export type ExtractedStep = ProcessStepEntry;
