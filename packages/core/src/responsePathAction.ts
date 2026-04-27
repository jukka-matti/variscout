import type { ProcessStateItem, ProcessStateResponsePath } from './processState';
import { assertNever } from './types';

export type ResponsePathAction =
  | {
      kind: 'open-investigation';
      investigationId: string;
      intent: 'focused' | 'chartered' | 'quick';
    }
  | {
      kind: 'open-sustainment';
      investigationId: string;
      surface: 'review' | 'handoff';
    }
  | { kind: 'unsupported'; reason: 'planned' | 'informational' };

/**
 * Pure mapping from a state item's response-path to a domain action.
 * Exhaustive on ProcessStateResponsePath. Returns 'unsupported' for paths
 * with no current Azure surface — those render as 'Planned' / 'Informational'
 * pills rather than fallback-routing.
 *
 * For items without their own investigation linkage, the caller passes
 * defaultInvestigationId. The Dashboard's heuristic for choosing the
 * default lives in the Dashboard (typically the rollup's most-recently-
 * updated investigation).
 */
export function deriveResponsePathAction(
  item: ProcessStateItem,
  defaultInvestigationId: string
): ResponsePathAction {
  const investigationId = item.investigationIds?.[0] ?? defaultInvestigationId;
  const path: ProcessStateResponsePath = item.responsePath;

  switch (path) {
    case 'monitor':
      return { kind: 'unsupported', reason: 'informational' };
    case 'measurement-system-work':
      return { kind: 'unsupported', reason: 'planned' };
    case 'quick-action':
      return { kind: 'open-investigation', investigationId, intent: 'quick' };
    case 'focused-investigation':
      return { kind: 'open-investigation', investigationId, intent: 'focused' };
    case 'chartered-project':
      return { kind: 'open-investigation', investigationId, intent: 'chartered' };
    case 'sustainment-review':
      return { kind: 'open-sustainment', investigationId, surface: 'review' };
    case 'control-handoff':
      return { kind: 'open-sustainment', investigationId, surface: 'handoff' };
    default:
      return assertNever(path);
  }
}
