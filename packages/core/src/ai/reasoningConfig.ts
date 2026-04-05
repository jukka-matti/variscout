/**
 * Per-journey-phase reasoning effort configuration.
 *
 * Maps journey phases (and investigation sub-phases) to OpenAI Responses API
 * `reasoning.effort` values. Higher effort = better reasoning but more tokens
 * and latency.
 */

import type { JourneyPhase, InvestigationPhase } from './types';

/**
 * Get the reasoning effort level for CoScout based on journey phase,
 * optional investigation sub-phase, and staged data presence.
 *
 * - frame: Quick orientation, light reasoning
 * - scout: Pattern exploration, light reasoning
 * - investigate/initial|diverging: Exploration, light reasoning
 * - investigate/validating: Hypothesis validation, medium reasoning
 * - investigate/converging: Root cause synthesis, high reasoning
 * - improve (no staged data): Action planning, light reasoning
 * - improve (with staged data): Verification & impact, high reasoning
 */
export function getCoScoutReasoningEffort(
  phase?: JourneyPhase,
  investigationPhase?: InvestigationPhase,
  hasStagedData?: boolean
): 'none' | 'low' | 'medium' | 'high' {
  if (phase === 'improve' && hasStagedData) return 'high';
  if (phase === 'investigate') {
    switch (investigationPhase) {
      case 'converging':
        return 'high';
      case 'validating':
        return 'medium';
      default:
        return 'low';
    }
  }
  switch (phase) {
    case 'frame':
      return 'low';
    case 'scout':
      return 'low';
    case 'improve':
      return 'low';
    default:
      return 'low';
  }
}
