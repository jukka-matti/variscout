/**
 * Per-journey-phase reasoning effort configuration.
 *
 * Maps journey phases to OpenAI Responses API `reasoning.effort` values.
 * Higher effort = better reasoning but more tokens and latency.
 */

import type { JourneyPhase } from './types';

/**
 * Get the reasoning effort level for CoScout based on journey phase.
 *
 * - frame: Quick orientation, no deep reasoning needed
 * - scout: Pattern exploration, light reasoning
 * - investigate: Root cause analysis, needs structured reasoning
 * - improve: Action validation, light reasoning
 */
export function getCoScoutReasoningEffort(
  phase?: JourneyPhase
): 'none' | 'low' | 'medium' | 'high' {
  switch (phase) {
    case 'frame':
      return 'none';
    case 'scout':
      return 'low';
    case 'investigate':
      return 'medium';
    case 'improve':
      return 'low';
    default:
      return 'low';
  }
}
