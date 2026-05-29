import type { ProcessStepEntry } from '../improvementProject/types';
import type { ProcessMap } from './types';

/**
 * Project the canonical rich `ProcessMap` down to the flat
 * `ProcessStepEntry[]` shape ({ id, name, order }).
 *
 * Per [ADR-087](../../../../docs/07-decisions/adr-087-process-step-model-reconciliation.md):
 * the rich `ProcessMap` / `ProcessMapNode` is the single canonical step
 * structure. `IP.processSteps` is no longer a stored second source of truth —
 * it is a read-only projection of `processContext.processMap.nodes`, computed
 * on read. This function is that single read source.
 *
 * Node ids flow through unchanged (the canonical `step-${slug}-${seq}` scheme
 * minted by `canvasStore`); every `stepId` reference (`stepTimings`,
 * `goal.outcomeGoals[].stepId`, `goal.factorControls[].stepId`,
 * `processLocation`) resolves against these ids.
 *
 * Returns `[]` for an absent map (a mapless project is valid — ADR-070). The
 * result is sorted ascending by `order` so consumers get a stable left→right
 * spine regardless of node insertion order.
 */
export function deriveProcessSteps(map: ProcessMap | undefined): ProcessStepEntry[] {
  if (!map) return [];
  return map.nodes
    .map(node => ({ id: node.id, name: node.name, order: node.order }))
    .sort((a, b) => a.order - b.order);
}
