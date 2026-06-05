/**
 * resolveCapabilityNodeTargets — pure helper extracted from the
 * `capabilityNodesWithResolvedTarget` memo in ProcessHubCapabilityTab.
 *
 * Each canonical node has a measurement column (`ctqColumn`); this function
 * runs `resolveCpkTarget` against that column using the cascade:
 *
 *   per-column spec → hub default → project default → 1.33
 *
 * Extracted so the precedence semantics can be unit-tested independently of
 * the React component and the row-channel seam that is unreachable until CS-P2.
 */
import { resolveCpkTarget } from '@variscout/core/capability';
import type { CapabilityTargetContext } from '@variscout/core/capability';
import type { ProcessMapNode } from '@variscout/core';

/** Minimal shape of an input capability node (matches CapabilityBoxplotInputNode). */
export interface CapabilityInputNode {
  nodeId: string;
  label: string;
  targetCpk?: number;
  result: unknown;
}

/** Output node with targetCpk resolved via cascade (or undefined when no column). */
export type CapabilityNodeWithResolvedTarget<T extends CapabilityInputNode> = T & {
  targetCpk: number | undefined;
};

export interface ResolveCapabilityNodeTargetsOptions {
  /** Canonical process map nodes, used to look up each node's `ctqColumn`. */
  canonicalNodes: ReadonlyArray<Pick<ProcessMapNode, 'id' | 'ctqColumn'>>;
  /** Cascade context passed straight to `resolveCpkTarget`. */
  context: CapabilityTargetContext;
}

/**
 * Resolve the cascade-aware `targetCpk` for each capability node.
 *
 * - A node with a `ctqColumn` → resolved via `resolveCpkTarget` cascade.
 * - A node without a `ctqColumn` → `targetCpk: undefined` (chart omits the tick).
 *
 * The function is a pure transformation: same inputs always yield the same
 * output, with no side-effects and no React/store access.
 */
export function resolveCapabilityNodeTargets<T extends CapabilityInputNode>(
  capabilityNodes: ReadonlyArray<T>,
  { canonicalNodes, context }: ResolveCapabilityNodeTargetsOptions
): Array<CapabilityNodeWithResolvedTarget<T>> {
  return capabilityNodes.map(node => {
    const canonical = canonicalNodes.find(n => n.id === node.nodeId);
    const column = canonical?.ctqColumn;
    // No measurement column → no cascade-resolved target. Leave undefined so
    // the chart simply omits the per-node tick.
    if (!column) return { ...node, targetCpk: undefined };
    const { value } = resolveCpkTarget(column, context);
    return { ...node, targetCpk: value };
  });
}
