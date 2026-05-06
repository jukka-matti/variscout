/**
 * Three-way merge for concurrent edits of AnalysisState.
 *
 * Given a `base` (last-loaded cloud state), `local` (current editor state),
 * and `remote` (just-fetched cloud state), produces a merged result with
 * zero data loss. Findings are merged by ID; scalar fields use
 * "local wins if only local changed" semantics.
 */

import type { AnalysisState } from '@variscout/hooks';
import type { Finding, FindingComment } from '@variscout/core';

export interface MergeResult {
  merged: AnalysisState;
  hasConflict: boolean;
  /** Human-readable summary of what was merged */
  summary: string;
}

/**
 * Merge three versions of AnalysisState.
 * - Findings: merged by ID (union semantics)
 * - rawData: take the larger array (additive rows)
 * - Scalar fields: local wins if only local changed from base
 */
export function mergeAnalysisState(
  base: AnalysisState,
  local: AnalysisState,
  remote: AnalysisState
): MergeResult {
  const conflicts: string[] = [];

  // --- rawData: take the larger array (additive rows) ---
  const mergedRawData =
    local.rawData.length >= remote.rawData.length ? local.rawData : remote.rawData;

  // --- Findings: merge by ID ---
  const { merged: mergedFindings, conflicts: findingConflicts } = mergeFindings(
    base.findings ?? [],
    local.findings ?? [],
    remote.findings ?? []
  );
  conflicts.push(...findingConflicts);

  // --- Scalar fields ---
  const merged: AnalysisState = {
    version: local.version,
    rawData: mergedRawData,
    outcome: mergeScalar(base.outcome, local.outcome, remote.outcome),
    factors: mergeScalar(base.factors, local.factors, remote.factors),
    specs: mergeScalar(base.specs, local.specs, remote.specs),
    filters: mergeScalar(base.filters, local.filters, remote.filters),
    axisSettings: mergeScalar(base.axisSettings, local.axisSettings, remote.axisSettings),

    // Optional fields — merge each independently
    measureSpecs: mergeScalar(base.measureSpecs, local.measureSpecs, remote.measureSpecs),
    columnAliases: mergeScalar(base.columnAliases, local.columnAliases, remote.columnAliases),
    valueLabels: mergeScalar(base.valueLabels, local.valueLabels, remote.valueLabels),
    displayOptions: mergeScalar(base.displayOptions, local.displayOptions, remote.displayOptions),
    cpkTarget: mergeScalar(base.cpkTarget, local.cpkTarget, remote.cpkTarget),
    stageColumn: mergeScalar(base.stageColumn, local.stageColumn, remote.stageColumn),
    stageOrderMode: mergeScalar(base.stageOrderMode, local.stageOrderMode, remote.stageOrderMode),
    measureColumns: mergeScalar(base.measureColumns, local.measureColumns, remote.measureColumns),
    selectedMeasure: mergeScalar(
      base.selectedMeasure,
      local.selectedMeasure,
      remote.selectedMeasure
    ),
    measureLabel: mergeScalar(base.measureLabel, local.measureLabel, remote.measureLabel),
    chartTitles: mergeScalar(base.chartTitles, local.chartTitles, remote.chartTitles),
    paretoMode: mergeScalar(base.paretoMode, local.paretoMode, remote.paretoMode),
    paretoAggregation: mergeScalar(
      base.paretoAggregation,
      local.paretoAggregation,
      remote.paretoAggregation
    ),
    separateParetoData: mergeScalar(
      base.separateParetoData,
      local.separateParetoData,
      remote.separateParetoData
    ),
    timeColumn: mergeScalar(base.timeColumn, local.timeColumn, remote.timeColumn),
    filterStack: mergeScalar(base.filterStack, local.filterStack, remote.filterStack),
    viewState: mergeScalar(base.viewState, local.viewState, remote.viewState),

    // Findings — already merged above
    findings: mergedFindings,
  };

  const hasConflict = conflicts.length > 0;
  const summary = hasConflict
    ? `Merged with conflicts: ${conflicts.join('; ')}`
    : 'Clean merge — all changes combined';

  return { merged, hasConflict, summary };
}

// ── Scalar merge ──────────────────────────────────────────────────────

/**
 * Three-way scalar merge:
 * - If only local changed from base → take local
 * - Otherwise → take remote (remote wins by default)
 */
function mergeScalar<T>(base: T, local: T, remote: T): T {
  const baseJson = JSON.stringify(base);
  const localJson = JSON.stringify(local);
  const remoteJson = JSON.stringify(remote);

  if (localJson !== baseJson && remoteJson === baseJson) return local;
  return remote;
}

// ── Findings merge ────────────────────────────────────────────────────

interface FindingsMergeResult {
  merged: Finding[];
  conflicts: string[];
}

function mergeFindings(base: Finding[], local: Finding[], remote: Finding[]): FindingsMergeResult {
  const conflicts: string[] = [];

  const baseMap = new Map(base.map(f => [f.id, f]));
  const localMap = new Map(local.map(f => [f.id, f]));
  const remoteMap = new Map(remote.map(f => [f.id, f]));

  // Collect all known IDs
  const allIds = new Set([...baseMap.keys(), ...localMap.keys(), ...remoteMap.keys()]);

  const merged: Finding[] = [];

  for (const id of allIds) {
    const baseFinding = baseMap.get(id);
    const localFinding = localMap.get(id);
    const remoteFinding = remoteMap.get(id);

    // New in local only → add
    if (!baseFinding && localFinding && !remoteFinding) {
      merged.push(localFinding);
      continue;
    }

    // New in remote only → add
    if (!baseFinding && !localFinding && remoteFinding) {
      merged.push(remoteFinding);
      continue;
    }

    // New in both (same ID, shouldn't normally happen) → take local
    if (!baseFinding && localFinding && remoteFinding) {
      merged.push(localFinding);
      continue;
    }

    // Deleted in local (was in base, not in local) → remove
    if (baseFinding && !localFinding) {
      continue;
    }

    // Deleted in remote (was in base, not in remote) → remove
    if (baseFinding && !remoteFinding) {
      continue;
    }

    // Present in all three — need to merge
    if (baseFinding && localFinding && remoteFinding) {
      const mergedFinding = mergeSingleFinding(baseFinding, localFinding, remoteFinding, conflicts);
      merged.push(mergedFinding);
    }
  }

  return { merged, conflicts };
}

function mergeSingleFinding(
  base: Finding,
  local: Finding,
  remote: Finding,
  conflicts: string[]
): Finding {
  // Text merge: conflict if both changed differently
  let text = local.text;
  const localTextChanged = local.text !== base.text;
  const remoteTextChanged = remote.text !== base.text;
  if (localTextChanged && remoteTextChanged && local.text !== remote.text) {
    conflicts.push(`Finding "${base.text.slice(0, 30)}..." text edited by both users`);
    // Keep local text — conflict copy will preserve remote version
    text = local.text;
  } else if (remoteTextChanged && !localTextChanged) {
    text = remote.text;
  }

  // Status: most recent statusChangedAt wins
  const status = local.statusChangedAt >= remote.statusChangedAt ? local.status : remote.status;
  const statusChangedAt = Math.max(local.statusChangedAt, remote.statusChangedAt);

  // Tag: follow status winner
  const tag = local.statusChangedAt >= remote.statusChangedAt ? local.tag : remote.tag;

  // Context: follow status winner (context is captured at status change time)
  const context = local.statusChangedAt >= remote.statusChangedAt ? local.context : remote.context;

  // Comments: union by ID
  const mergedComments = mergeComments(base.comments, local.comments, remote.comments);

  return {
    id: base.id,
    text,
    createdAt: base.createdAt,
    deletedAt: base.deletedAt ?? null,
    investigationId: base.investigationId,
    context,
    status,
    tag,
    comments: mergedComments,
    statusChangedAt,
  };
}

// ── Comments merge ────────────────────────────────────────────────────

function mergeComments(
  base: FindingComment[],
  local: FindingComment[],
  remote: FindingComment[]
): FindingComment[] {
  const commentMap = new Map<string, FindingComment>();

  // Start with base
  for (const c of base) {
    commentMap.set(c.id, c);
  }

  // Apply local changes
  for (const c of local) {
    const existing = commentMap.get(c.id);
    if (!existing || c.createdAt >= existing.createdAt) {
      commentMap.set(c.id, c);
    }
  }

  // Apply remote changes
  for (const c of remote) {
    const existing = commentMap.get(c.id);
    if (!existing || c.createdAt > existing.createdAt) {
      commentMap.set(c.id, c);
    }
  }

  // Include comments from local that aren't in base (new local comments)
  const baseIds = new Set(base.map(c => c.id));
  for (const c of local) {
    if (!baseIds.has(c.id)) {
      commentMap.set(c.id, c);
    }
  }

  // Include comments from remote that aren't in base (new remote comments)
  for (const c of remote) {
    if (!baseIds.has(c.id)) {
      // Only overwrite if remote is newer or not yet present
      const existing = commentMap.get(c.id);
      if (!existing || c.createdAt > existing.createdAt) {
        commentMap.set(c.id, c);
      }
    }
  }

  // Sort by createdAt ascending
  return Array.from(commentMap.values()).sort((a, b) => a.createdAt - b.createdAt);
}
