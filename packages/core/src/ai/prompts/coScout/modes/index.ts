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
import type { JourneyPhase } from '../../../types';
import { buildStandardWorkflow } from './standard';
import { buildPerformanceWorkflow } from './performance';
import { buildYamazumiWorkflow } from './yamazumi';
import { buildDefectWorkflow } from './defect';

export { buildStandardWorkflow } from './standard';
export { buildCapabilityWorkflow } from './capability';
export { buildPerformanceWorkflow } from './performance';
export { buildYamazumiWorkflow } from './yamazumi';
export { buildDefectWorkflow } from './defect';

/**
 * Build mode-specific coaching instructions for CoScout.
 *
 * Dispatches to the appropriate mode module based on the current analysis mode.
 * Standard mode is the default. Capability is a variant of standard with
 * additional centering vs spread diagnostics.
 *
 * @param mode - Current analysis mode (standard, performance, yamazumi)
 * @param phase - Current journey phase (frame, scout, investigate, improve)
 * @returns Mode-specific coaching string for inclusion in the system prompt
 */
export function buildModeWorkflow(mode: AnalysisMode, phase: JourneyPhase): string {
  switch (mode) {
    case 'standard':
      return buildStandardWorkflow(phase);
    case 'performance':
      return buildPerformanceWorkflow(phase);
    case 'yamazumi':
      return buildYamazumiWorkflow(phase);
    case 'defect':
      return buildDefectWorkflow(phase);
    default:
      return buildStandardWorkflow(phase);
  }
}
