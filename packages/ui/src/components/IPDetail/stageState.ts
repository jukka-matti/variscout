import type { ImprovementProject } from '@variscout/core/improvementProject';

export type StageState = 'done' | 'current' | 'not-started' | 'upcoming' | 'locked';

export interface StageStateMap {
  charter: StageState;
  approach: StageState;
  sustainment: StageState;
}

export interface StageStateInputs {
  /** True when the linked ControlRecord has reached confirmed-sustained status. */
  sustainmentConfirmed?: boolean;
}

/**
 * Pure derivation of the 3-stage state from an ImprovementProject + optional
 * linked-artifact signals. Used by IPDetailStageTabs to render the visual
 * state (✓ done / current with underline / ○ not-started / ⏸ locked).
 *
 * Stage order: Charter → Approach → Control.
 * Improve is a top-level tab (not a project detail stage) per wedge amendment 2026-05-16.
 * Control becomes current when IP is closed.
 */
export function deriveStageState(
  ip: ImprovementProject,
  inputs: StageStateInputs = {}
): StageStateMap {
  const { sustainmentConfirmed = false } = inputs;

  if (sustainmentConfirmed) {
    return { charter: 'done', approach: 'done', sustainment: 'done' };
  }

  if (ip.status === 'closed') {
    return { charter: 'done', approach: 'done', sustainment: 'current' };
  }

  if (ip.status === 'active') {
    return { charter: 'done', approach: 'current', sustainment: 'upcoming' };
  }

  // draft
  return { charter: 'current', approach: 'upcoming', sustainment: 'upcoming' };
}
