/**
 * gateNodeOps — Path-based tree operations for the contribution `GateNode` tree.
 *
 * Used by the Investigation Wall to mutate the contribution tree at a specific
 * location. A `GatePath` encodes the route from the tree root: numeric indices
 * descend into AND/OR `children` arrays, the literal `'child'` descends into a
 * NOT node's single `child`. Hub leaves terminate paths — `getAt` returns
 * `undefined` for paths beyond a leaf.
 *
 * All operations are pure: they return a NEW tree rather than mutating the input.
 * This mirrors the immer-free domain-layer style (stores use immer separately).
 */

import type { GateNode } from './types';

/**
 * Path step: number for AND/OR child index, literal 'child' for NOT's single child.
 * Empty array = root.
 */
export type GatePath = Array<number | 'child'>;

// ── getAt ────────────────────────────────────────────────────────────────────

/**
 * Resolve the node at `path`. Returns `undefined` if any step is invalid
 * (e.g. descending into a hub leaf, index out of range, or stepping 'child'
 * into a non-NOT node).
 */
export function getAt(tree: GateNode, path: GatePath): GateNode | undefined {
  let cursor: GateNode = tree;
  for (const step of path) {
    if (cursor.kind === 'and' || cursor.kind === 'or') {
      if (typeof step !== 'number') return undefined;
      const next = cursor.children[step];
      if (!next) return undefined;
      cursor = next;
    } else if (cursor.kind === 'not') {
      if (step !== 'child') return undefined;
      cursor = cursor.child;
    } else {
      // hub leaf — cannot descend further
      return undefined;
    }
  }
  return cursor;
}

// ── updateAt ────────────────────────────────────────────────────────────────

/**
 * Replace the node at `path` with `mutator(oldNode)`. Returns a new tree with
 * structural sharing for sibling branches. If `path` is invalid, returns the
 * original tree unchanged (defensive — callers should validate paths first).
 */
export function updateAt(
  tree: GateNode,
  path: GatePath,
  mutator: (node: GateNode) => GateNode
): GateNode {
  if (path.length === 0) {
    return mutator(tree);
  }
  const [head, ...rest] = path;
  if (tree.kind === 'and' || tree.kind === 'or') {
    if (typeof head !== 'number') return tree;
    const child = tree.children[head];
    if (!child) return tree;
    const updatedChild = updateAt(child, rest, mutator);
    if (updatedChild === child) return tree;
    const nextChildren = tree.children.slice();
    nextChildren[head] = updatedChild;
    return { ...tree, children: nextChildren };
  }
  if (tree.kind === 'not') {
    if (head !== 'child') return tree;
    const updatedChild = updateAt(tree.child, rest, mutator);
    if (updatedChild === tree.child) return tree;
    return { ...tree, child: updatedChild };
  }
  // hub leaf with remaining path steps — invalid
  return tree;
}

// ── insertHubAsAndChild ─────────────────────────────────────────────────────

/**
 * Insert a new hub leaf at `path` composed with AND.
 *
 * - If the target node is already `{kind:'and'}`, append the hub as a new child.
 * - Otherwise, wrap the target in a fresh AND: `{and, children: [target, hub]}`.
 *
 * No-ops (returns tree unchanged) if the path is invalid. The caller is
 * responsible for initializing the tree — this helper does not insert into
 * an absent tree.
 */
export function insertHubAsAndChild(tree: GateNode, path: GatePath, hubId: string): GateNode {
  const target = getAt(tree, path);
  if (!target) return tree;

  const hubLeaf: GateNode = { kind: 'hub', hubId };

  return updateAt(tree, path, node => {
    if (node.kind === 'and') {
      return { kind: 'and', children: [...node.children, hubLeaf] };
    }
    return { kind: 'and', children: [node, hubLeaf] };
  });
}

// ── removeAt ─────────────────────────────────────────────────────────────────

/**
 * Remove the node at `path`. Returns `undefined` if `path` is root (i.e. the
 * whole tree was deleted). For AND/OR parents whose children shrink to 1,
 * collapse to the single remaining child (flatten unary gates). For NOT
 * parents — removing the sole child leaves NOT with no operand, which is
 * meaningless, so the NOT itself is removed (treated as removing the NOT).
 *
 * Returns the tree unchanged if the path is invalid.
 */
export function removeAt(tree: GateNode, path: GatePath): GateNode | undefined {
  if (path.length === 0) {
    return undefined;
  }
  const parentPath = path.slice(0, -1);
  const last = path[path.length - 1];
  const parent = getAt(tree, parentPath);
  if (!parent) return tree;

  if (parent.kind === 'and' || parent.kind === 'or') {
    if (typeof last !== 'number') return tree;
    if (last < 0 || last >= parent.children.length) return tree;
    const remaining = parent.children.filter((_, i) => i !== last);

    if (remaining.length === 0) {
      // The AND/OR itself becomes childless — recursively remove the parent.
      return removeAt(tree, parentPath);
    }
    if (remaining.length === 1) {
      // Collapse unary gate to the single remaining child.
      if (parentPath.length === 0) {
        return remaining[0];
      }
      return updateAt(tree, parentPath, () => remaining[0]);
    }
    if (parentPath.length === 0) {
      return { ...parent, children: remaining };
    }
    return updateAt(tree, parentPath, () => ({ ...parent, children: remaining }));
  }

  if (parent.kind === 'not') {
    if (last !== 'child') return tree;
    // Removing the sole child of NOT collapses the NOT itself.
    return removeAt(tree, parentPath);
  }

  // Parent is a hub leaf — invalid (leaves have no children).
  return tree;
}
