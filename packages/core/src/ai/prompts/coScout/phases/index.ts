/**
 * Phase coaching dispatcher — one coaching block per journey phase.
 *
 * Merges the two duplicate phase instruction blocks from legacy.ts
 * (phaseInstructions + investigationPhaseCoaching) into a single
 * coherent module per phase.
 */

import type { AnalysisMode } from '../../../../types';
import type { JourneyPhase, InvestigationPhase, EntryScenario } from '../../../types';
import { buildFrameCoaching } from './frame';
import { buildScoutCoaching } from './scout';
import { buildInvestigateCoaching } from './investigate';
import { buildImproveCoaching } from './improve';

export { buildFrameCoaching } from './frame';
export { buildScoutCoaching } from './scout';
export { buildInvestigateCoaching } from './investigate';
export { buildImproveCoaching } from './improve';

export interface BuildPhaseCoachingOptions {
  /** Current journey phase */
  phase: JourneyPhase;
  /** Current analysis mode — controls terminology */
  mode: AnalysisMode;
  /** Investigation sub-phase (only relevant for INVESTIGATE) */
  investigationPhase?: InvestigationPhase;
  /** Entry scenario — affects tool routing guidance */
  entryScenario?: EntryScenario;
}

/**
 * Build phase-specific coaching instructions for CoScout.
 *
 * Each phase gets focused coaching that merges the legacy
 * phaseInstructions and investigationPhaseCoaching into one block.
 * The mode parameter controls terminology (e.g., "drill by eta-squared"
 * for standard vs "drill by waste %" for yamazumi).
 */
export function buildPhaseCoaching(options: BuildPhaseCoachingOptions): string {
  const { phase, mode, investigationPhase, entryScenario } = options;

  switch (phase) {
    case 'frame':
      return buildFrameCoaching(mode);
    case 'scout':
      return buildScoutCoaching(mode, entryScenario);
    case 'investigate':
      return buildInvestigateCoaching(mode, investigationPhase, entryScenario);
    case 'improve':
      return buildImproveCoaching(mode, entryScenario);
  }
}
