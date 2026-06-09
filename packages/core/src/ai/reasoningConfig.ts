/**
 * Per-journey-phase reasoning effort configuration.
 *
 * Maps journey phases (and investigation sub-phases) to OpenAI Responses API
 * `reasoning.effort` values. Higher effort = better reasoning but more tokens
 * and latency.
 */

import type { CoScoutSurface } from './prompts/coScout/types';

/**
 * Get the reasoning effort level for CoScout based on product surface and staged data presence.
 *
 * Loop-intent is inferred inside the prompt and does not gate effort directly.
 */
export function getCoScoutReasoningEffort(
  surface?: CoScoutSurface,
  hasStagedData?: boolean
): 'none' | 'low' | 'medium' | 'high' {
  if (surface === 'analyze' && hasStagedData) return 'high';
  switch (surface) {
    case 'process':
      return 'low';
    case 'explore':
      return 'low';
    case 'analyze':
      return 'medium';
    case 'report':
      return 'low';
    default:
      return 'low';
  }
}
