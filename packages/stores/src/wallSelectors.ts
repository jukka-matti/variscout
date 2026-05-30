/**
 * wallSelectors — pure derivation functions over analyzeStore + projectStore data.
 *
 * No React, no Zustand, no side effects. Safe to test without a store instance.
 *
 * See: docs/superpowers/plans/2026-04-19-investigation-wall.md, Task 4.4
 */

import type { Hypothesis, Finding, FindingComment } from '@variscout/core';
import type { ProcessMap, ProcessMapTributary } from '@variscout/core/frame';

// ─────────────────────────────────────────────────────────────────────────────
// Hub comment stream
// ─────────────────────────────────────────────────────────────────────────────

export interface HubCommentEntry extends FindingComment {
  /** Whether the comment came from the hub itself or a linked finding. */
  source: 'hub' | 'finding';
  /** Populated when source === 'finding'. */
  findingId?: string;
}

/**
 * Merges hub-level comments and all comments from linked findings into a
 * single chronological stream (ascending createdAt).
 *
 * Returns [] if hubId is not found in hubs.
 */
export function selectHubCommentStream(
  hubId: string,
  hubs: Hypothesis[],
  findings: Finding[]
): HubCommentEntry[] {
  const hub = hubs.find(h => h.id === hubId);
  if (!hub) return [];

  const entries: HubCommentEntry[] = [];

  for (const c of hub.comments ?? []) {
    entries.push({ ...c, source: 'hub' });
  }

  for (const fid of hub.findingIds) {
    const f = findings.find(x => x.id === fid);
    if (!f) continue;
    for (const c of f.comments) {
      entries.push({ ...c, source: 'finding', findingId: fid });
    }
  }

  return entries.sort((a, b) => a.createdAt - b.createdAt);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hypothesis tributaries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the ProcessMap tributaries relevant to a suspected-cause hub.
 *
 * Priority:
 *   1. hub.tributaryIds — explicit analyst binding (highest priority).
 *   2. Derive from linked findings' activeFilters columns, sorted by step order.
 *
 * Returns [] when processMap is undefined (mapless projects remain valid).
 */
export function selectHypothesisTributaries(
  hub: Hypothesis,
  findings: Finding[],
  processMap: ProcessMap | undefined
): ProcessMapTributary[] {
  if (!processMap) return [];

  // 1. Explicit binding wins.
  if (hub.tributaryIds && hub.tributaryIds.length > 0) {
    const idSet = new Set(hub.tributaryIds);
    return processMap.tributaries.filter(t => idSet.has(t.id));
  }

  // 2. Derive from the filter columns the analyst used when brushing findings.
  const columns = new Set<string>();
  for (const fid of hub.findingIds) {
    const f = findings.find(x => x.id === fid);
    if (!f?.context?.activeFilters) continue;
    for (const col of Object.keys(f.context.activeFilters)) {
      columns.add(col);
    }
  }

  if (columns.size === 0) return [];

  return processMap.tributaries
    .filter(t => columns.has(t.column))
    .sort((a, b) => {
      const ai = processMap.nodes.findIndex(n => n.id === a.stepId);
      const bi = processMap.nodes.findIndex(n => n.id === b.stepId);
      return ai - bi;
    });
}
