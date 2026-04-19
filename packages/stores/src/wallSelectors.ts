/**
 * wallSelectors — pure derivation functions over investigationStore + projectStore data.
 *
 * No React, no Zustand, no side effects. Safe to test without a store instance.
 *
 * See: docs/superpowers/plans/2026-04-19-investigation-wall.md, Task 4.4
 */

import type { SuspectedCause, Finding, FindingComment, Question } from '@variscout/core';
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
  hubs: SuspectedCause[],
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
  hub: SuspectedCause,
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

// ─────────────────────────────────────────────────────────────────────────────
// Orphan questions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns open questions that are not referenced by any suspected-cause hub.
 * Useful for the Investigation Wall "unlinked questions" rail.
 */
export function selectOpenQuestionsWithoutHub(
  questions: Question[],
  hubs: SuspectedCause[]
): Question[] {
  const inHub = new Set(hubs.flatMap(h => h.questionIds));
  return questions.filter(q => q.status === 'open' && !inHub.has(q.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// Questions for a specific hub
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the questions referenced by the given hub, preserving hub order.
 * Returns [] if hubId is not found.
 */
export function selectQuestionsForHub(
  hubId: string,
  hubs: SuspectedCause[],
  questions: Question[]
): Question[] {
  const hub = hubs.find(h => h.id === hubId);
  if (!hub) return [];
  const ids = new Set(hub.questionIds);
  return questions.filter(q => ids.has(q.id));
}
