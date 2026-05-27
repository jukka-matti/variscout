import type { ProcessStateItem, ProcessStateResponsePath } from './processState';
import { assertNever } from './types';

export type ResponsePathAction =
  | {
      kind: 'open-analyze';
      analyzeId: string;
      intent: 'focused' | 'chartered' | 'quick';
    }
  | { kind: 'open-control'; analyzeId: string }
  | { kind: 'unsupported'; reason: 'planned' | 'informational' };

/**
 * Pure mapping from a state item's response-path to a domain action.
 * Exhaustive on ProcessStateResponsePath. Returns 'unsupported' for paths
 * with no current Azure surface — those render as 'Planned' / 'Informational'
 * pills rather than fallback-routing.
 *
 * For items without their own analyze linkage, the caller passes
 * defaultAnalyzeId. The Dashboard's heuristic for choosing the
 * default lives in the Dashboard (typically the rollup's most-recently-
 * updated analyze).
 */
export function deriveResponsePathAction(
  item: ProcessStateItem,
  defaultAnalyzeId: string
): ResponsePathAction {
  const analyzeId = item.analyzeIds?.[0] ?? defaultAnalyzeId;
  const path: ProcessStateResponsePath = item.responsePath;

  switch (path) {
    case 'monitor':
      return { kind: 'unsupported', reason: 'informational' };
    case 'measurement-system-work':
      return { kind: 'unsupported', reason: 'planned' };
    case 'quick-action':
      return { kind: 'open-analyze', analyzeId, intent: 'quick' };
    case 'focused-analyze':
      return { kind: 'open-analyze', analyzeId, intent: 'focused' };
    case 'chartered-project':
      return { kind: 'open-analyze', analyzeId, intent: 'chartered' };
    case 'control-review':
      return { kind: 'open-control', analyzeId };
    default:
      return assertNever(path);
  }
}
