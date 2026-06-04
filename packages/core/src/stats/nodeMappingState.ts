import type { ProcessMap } from '../frame/types';
import type { ProcessStepCapabilityMemberMetadata, AnalyzeNodeMapping } from '../processHub';

/**
 * Returns true if the investigation has no node mappings yet — i.e., still
 * in the unmapped B0 state. Such investigations fall back to global
 * investigation-level specs and do not appear in production-line-glance
 * dashboards. This is UI state about the cascade flow, not a back-compat
 * data migration.
 */
export function isUnmappedAnalyze(meta: ProcessStepCapabilityMemberMetadata): boolean {
  if (!meta.nodeMappings) return true;
  return meta.nodeMappings.length === 0;
}

/**
 * Auto-suggest `nodeMappings` for an unmapped investigation by matching each
 * canonical node's `ctqColumn` against the dataset's available columns.
 * Returns mappings only for nodes whose `ctqColumn` is set AND present in
 * the dataset. Caller surfaces these to the analyst for confirmation.
 */
export function suggestNodeMappings(
  canonicalMap: ProcessMap,
  datasetColumns: readonly string[]
): AnalyzeNodeMapping[] {
  const columnSet = new Set(datasetColumns);
  const out: AnalyzeNodeMapping[] = [];
  for (const node of canonicalMap.nodes) {
    if (!node.ctqColumn) continue;
    if (!columnSet.has(node.ctqColumn)) continue;
    out.push({ nodeId: node.id, measurementColumn: node.ctqColumn });
  }
  return out;
}
