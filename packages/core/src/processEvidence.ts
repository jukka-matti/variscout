import type { Finding, FindingStatus } from './findings/types';
import type { ProcessStateItem } from './processState';

/**
 * Finding statuses that count as "evidence" for a state item.
 *
 * - 'observed' and 'investigating' are too early — observations, not findings.
 * - 'analyzed', 'improving', 'resolved' represent findings that have passed
 *   through the investigation lifecycle.
 */
export const RELEVANT_FINDING_STATUSES: ReadonlySet<FindingStatus> = new Set([
  'analyzed',
  'improving',
  'resolved',
]);

export interface LinkFindingsResult {
  byItemId: Map<string, readonly Finding[]>;
  totalLinked: number;
  unlinkedItemIds: string[];
}

/**
 * Pure 2-input join: state items × findings (grouped by investigation).
 *
 * The caller pre-groups findings by investigation ID (cheaper than a flat
 * findings[] when items match many investigations). The caller also provides
 * a resolver that says which investigation IDs each item is linked to —
 * the resolver embodies the per-item-type linkage rules (see spec).
 *
 * Findings are filtered to RELEVANT_FINDING_STATUSES.
 *
 * Returns a map suitable for direct lookup, plus reporting helpers
 * (totalLinked, unlinkedItemIds).
 */
export function linkFindingsToStateItems(
  items: readonly ProcessStateItem[],
  findingsByInvestigationId: ReadonlyMap<string, readonly Finding[]>,
  resolveInvestigationIds: (item: ProcessStateItem) => readonly string[] | undefined
): LinkFindingsResult {
  const byItemId = new Map<string, readonly Finding[]>();
  const unlinkedItemIds: string[] = [];
  let totalLinked = 0;

  for (const item of items) {
    const investigationIds = resolveInvestigationIds(item);
    if (!investigationIds || investigationIds.length === 0) {
      byItemId.set(item.id, []);
      unlinkedItemIds.push(item.id);
      continue;
    }

    const seen = new Set<string>();
    const linked: Finding[] = [];
    for (const invId of investigationIds) {
      if (seen.has(invId)) continue;
      seen.add(invId);
      const findings = findingsByInvestigationId.get(invId);
      if (!findings) continue;
      for (const f of findings) {
        if (RELEVANT_FINDING_STATUSES.has(f.status)) {
          linked.push(f);
        }
      }
    }

    byItemId.set(item.id, linked);
    totalLinked += linked.length;
    if (linked.length === 0) unlinkedItemIds.push(item.id);
  }

  return { byItemId, totalLinked, unlinkedItemIds };
}
