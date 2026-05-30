/**
 * wallFocus.ts — the Focus-lens degree-of-interest math (IM-4c, spec §3/§9).
 *
 * The Focus lens DIMS by distance from the focal cause; it is dimming ONLY and
 * must NOT touch `CanvasLevel` / LOD / semantic-zoom (spec §9 scope boundary).
 *
 * `wallDegreeOfInterest` = undirected BFS graph-distance over the WallLayout
 * tethers (finding/factor ↔ hub edges): the focused entity is 0, anything
 * sharing an edge with it is 1, the next ring is 2, and so on. When nothing is
 * focused (`null`), every entity returns 0 → `focusOpacity` is vivid → no dimming.
 *
 * `focusOpacity` maps the distance to a 3-tier opacity: vivid(focused) / mid
 * (adjacent) / dim(distant, clamped to a floor so context never disappears).
 */
import type { WallEdge } from './wallLayout';

/** Distance treated as "far" — anything this far or farther dims to the floor. */
const DISTANT_DOI = 2;

const VIVID_OPACITY = 1;
const MID_OPACITY = 0.55;
const DIM_OPACITY = 0.25;

/**
 * Undirected BFS graph-distance from `focusedId` to `entityId` over `edges`.
 * Returns 0 when nothing is focused (no dimming) or for the focused entity
 * itself; the hop count otherwise; `DISTANT_DOI` for unreachable/disconnected
 * entities (so they dim to the floor rather than vanish).
 */
export function wallDegreeOfInterest(
  focusedId: string | null,
  entityId: string,
  edges: WallEdge[]
): number {
  if (focusedId === null) return 0;
  if (focusedId === entityId) return 0;

  // Build an undirected adjacency list once per call (cheap for V1 graph sizes).
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    const list = adjacency.get(a);
    if (list) list.push(b);
    else adjacency.set(a, [b]);
  };
  for (const e of edges) {
    link(e.fromId, e.toId);
    link(e.toId, e.fromId);
  }

  // BFS from the focused node.
  const visited = new Set<string>([focusedId]);
  let frontier: string[] = [focusedId];
  let distance = 0;
  while (frontier.length > 0) {
    distance += 1;
    const next: string[] = [];
    for (const node of frontier) {
      for (const neighbor of adjacency.get(node) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        if (neighbor === entityId) return distance;
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  // Unreachable → maximally distant (dims to the floor, never hidden).
  return DISTANT_DOI;
}

/**
 * Map a degree-of-interest to an opacity tier: 0 → vivid, 1 → mid, ≥2 → dim
 * (floored). Pure + monotonic non-increasing in `doi`.
 */
export function focusOpacity(doi: number): number {
  if (doi <= 0) return VIVID_OPACITY;
  if (doi === 1) return MID_OPACITY;
  return DIM_OPACITY;
}
