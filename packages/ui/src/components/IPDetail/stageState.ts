import type { ImprovementProject } from '@variscout/core/improvementProject';

export type StageState = 'done' | 'current' | 'not-started' | 'locked';

export interface StageStateMap {
  charter: StageState;
  approach: StageState;
  sustainment: StageState;
  handoff: StageState;
}

export interface StageStateInputs {
  /** True when the linked SustainmentRecord has reached confirmed-sustained status. */
  sustainmentConfirmed?: boolean;
  /** True when the linked ControlHandoff has reached operational status. */
  handoffOperational?: boolean;
}

/**
 * Pure derivation of the 4-stage state from an ImprovementProject + optional
 * linked-artifact signals. Used by IPDetailStageTabs to render the visual
 * state (✓ done / current with underline / ○ not-started / ⏸ locked).
 */
export function deriveStageState(
  ip: ImprovementProject,
  inputs: StageStateInputs = {}
): StageStateMap {
  const { sustainmentConfirmed = false, handoffOperational = false } = inputs;

  if (handoffOperational) {
    return { charter: 'done', approach: 'done', sustainment: 'done', handoff: 'done' };
  }

  if (sustainmentConfirmed) {
    return { charter: 'done', approach: 'done', sustainment: 'done', handoff: 'current' };
  }

  if (ip.status === 'closed') {
    return { charter: 'done', approach: 'done', sustainment: 'current', handoff: 'locked' };
  }

  if (ip.status === 'active') {
    return { charter: 'done', approach: 'current', sustainment: 'locked', handoff: 'locked' };
  }

  // draft
  return { charter: 'current', approach: 'not-started', sustainment: 'locked', handoff: 'locked' };
}
