import type { ImprovementProject } from '@variscout/core/improvementProject';

export type StageState = 'done' | 'current' | 'not-started' | 'locked';

export interface StageStateMap {
  charter: StageState;
  approach: StageState;
  improve: StageState;
  sustainment: StageState;
}

export interface StageStateInputs {
  /** True when the linked SustainmentRecord has reached confirmed-sustained status. */
  sustainmentConfirmed?: boolean;
  /** True when the Improve stage work items are all resolved. */
  improveComplete?: boolean;
}

/**
 * Pure derivation of the 4-stage state from an ImprovementProject + optional
 * linked-artifact signals. Used by IPDetailStageTabs to render the visual
 * state (✓ done / current with underline / ○ not-started / ⏸ locked).
 *
 * Stage order: Charter → Approach → Improve → Sustainment.
 * Improve stage unlocks when the IP is closed (improvement work done).
 * Sustainment unlocks when improveComplete signal is set.
 */
export function deriveStageState(
  ip: ImprovementProject,
  inputs: StageStateInputs = {}
): StageStateMap {
  const { sustainmentConfirmed = false, improveComplete = false } = inputs;

  if (sustainmentConfirmed) {
    return { charter: 'done', approach: 'done', improve: 'done', sustainment: 'done' };
  }

  if (improveComplete) {
    return { charter: 'done', approach: 'done', improve: 'done', sustainment: 'current' };
  }

  if (ip.status === 'closed') {
    return { charter: 'done', approach: 'done', improve: 'current', sustainment: 'locked' };
  }

  if (ip.status === 'active') {
    return { charter: 'done', approach: 'current', improve: 'locked', sustainment: 'locked' };
  }

  // draft
  return { charter: 'current', approach: 'not-started', improve: 'locked', sustainment: 'locked' };
}
