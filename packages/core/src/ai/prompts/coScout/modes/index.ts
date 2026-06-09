/**
 * Mode coaching dispatcher — one coaching block per analysis mode.
 *
 * Consolidates three redundant locations from legacy.ts into
 * a single self-contained module per mode:
 * 1. Long mode-specific terminology blocks
 * 2. Short mode coaching hints
 * 3. Capability stability section
 *
 * Each mode file contains all terminology + workflow guidance in one place.
 */

import type { AnalysisMode } from '../../../../types';
import type { CoScoutScope, CoScoutSurface } from '../types';
import { buildStandardWorkflow } from './standard';
import { buildPerformanceWorkflow } from './performance';
import { buildDefectWorkflow } from './defect';

export { buildStandardWorkflow } from './standard';
export { buildCapabilityWorkflow } from './capability';
export { buildPerformanceWorkflow } from './performance';
export { buildDefectWorkflow } from './defect';

/**
 * Build mode-specific coaching instructions for CoScout.
 *
 * Dispatches to the appropriate mode module based on the current analysis mode.
 * Standard mode is the default. Capability is a variant of standard with
 * additional centering vs spread diagnostics.
 *
 * @param mode - Current analysis mode (standard, performance, defect)
 * @param surface - Product surface where CoScout is mounted
 * @param scope - Current Analyze-surface scope facts
 * @returns Mode-specific coaching string for inclusion in the system prompt
 */
export function buildModeWorkflow(
  mode: AnalysisMode,
  surface: CoScoutSurface,
  scope?: CoScoutScope
): string {
  if (surface !== 'analyze') return '';

  switch (mode) {
    case 'standard':
      return buildStandardWorkflow(surface, scope);
    case 'performance':
      return buildPerformanceWorkflow(surface, scope);
    case 'defect':
      return buildDefectWorkflow(surface, scope);
    default:
      return buildStandardWorkflow(surface, scope);
  }
}
