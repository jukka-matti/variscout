/**
 * ProcessLevel — the named process-learning level (Y / X / x), mapped onto the
 * existing `CanvasLevel` (`l1` / `l2` / `l3`).
 *
 * ADR-088 #1 ("Level before mode"): this is a thin NAMING and routing alias, not
 * a new store or state machine. The level decides which native share is in view
 * (Outcome → Y, Flow → X, Local → x). Do NOT collide with the live
 * `ProcessStateLens` ('outcome'|'flow'|'conversion'|'measurement'|'sustainment')
 * or `TimeLens` — those are orthogonal axes.
 */

import type { CanvasLevel } from './viewport';

/** The named process-learning level: Outcome (Y) / Flow (X) / Local (x). */
export type ProcessLevel = 'Outcome' | 'Flow' | 'Local';

/** l1 → Outcome (Y), l2 → Flow (X), l3 → Local (x). */
export function canvasLevelToProcessLevel(level: CanvasLevel): ProcessLevel {
  switch (level) {
    case 'l1':
      return 'Outcome';
    case 'l2':
      return 'Flow';
    case 'l3':
      return 'Local';
  }
}

/** Inverse of {@link canvasLevelToProcessLevel}. Outcome → l1, Flow → l2, Local → l3. */
export function processLevelToCanvasLevel(level: ProcessLevel): CanvasLevel {
  switch (level) {
    case 'Outcome':
      return 'l1';
    case 'Flow':
      return 'l2';
    case 'Local':
      return 'l3';
  }
}
