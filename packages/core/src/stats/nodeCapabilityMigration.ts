import type { ProcessMap } from '../frame/types';
import type { ProcessHubInvestigationMetadata, InvestigationNodeMapping } from '../processHub';

/**
 * True when an investigation is in the B0 legacy state — no nodeMappings,
 * uses global investigation-level specs as fallback. Such investigations do
 * not appear in production-line-glance dashboards.
 */
export function isLegacyInvestigation(meta: ProcessHubInvestigationMetadata): boolean {
  if (!meta.nodeMappings) return true;
  return meta.nodeMappings.length === 0;
}

/**
 * Auto-suggest `nodeMappings` for a legacy investigation by matching each
 * canonical node's `ctqColumn` against the dataset's available columns.
 * Returns mappings only for nodes whose `ctqColumn` is set AND present in
 * the dataset. Caller surfaces these to the analyst for confirmation.
 */
export function suggestNodeMappings(
  canonicalMap: ProcessMap,
  datasetColumns: readonly string[]
): InvestigationNodeMapping[] {
  const columnSet = new Set(datasetColumns);
  const out: InvestigationNodeMapping[] = [];
  for (const node of canonicalMap.nodes) {
    if (!node.ctqColumn) continue;
    if (!columnSet.has(node.ctqColumn)) continue;
    out.push({ nodeId: node.id, measurementColumn: node.ctqColumn });
  }
  return out;
}
