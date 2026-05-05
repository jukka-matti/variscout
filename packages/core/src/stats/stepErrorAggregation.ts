import type { ProcessHub, ProcessHubInvestigation } from '../processHub';
import type { ProcessMap, ProcessMapNode } from '../frame/types';
import type { DataRow, SpecLookupContext } from '../types';

export type StepErrorRollupHub = Pick<ProcessHub, 'id' | 'canonicalProcessMap'>;

export interface StepErrorRollupInput {
  hub: StepErrorRollupHub;
  members: readonly ProcessHubInvestigation[];
  defectColumns?: readonly string[];
  contextFilter?: SpecLookupContext;
}

export interface StepErrorRollupResult {
  nodeId: string;
  label: string;
  errorCount: number;
}

const PASS_SENTINELS = new Set(['pass', 'ok', '0', 'false', 'no', '-', '']);

function isPass(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return PASS_SENTINELS.has(String(value).toLowerCase().trim());
}

function rowMatchesFilter(row: DataRow, filter: SpecLookupContext | undefined): boolean {
  if (!filter) return true;
  for (const [key, expected] of Object.entries(filter)) {
    if (expected === undefined || expected === null) continue;
    const actual = row[key];
    if (actual === undefined || actual === null) return false;
    if (String(actual) !== String(expected)) return false;
  }
  return true;
}

function rowHasDefect(row: DataRow, defectColumns: readonly string[]): boolean {
  for (const col of defectColumns) {
    if (!isPass(row[col])) return true;
  }
  return false;
}

/**
 * Roll up per-step error counts across hub-member investigations.
 *
 * Walks each member investigation's rows, applies its `nodeMappings`, counts
 * rows whose any defect-column value is non-pass toward each mapped node's
 * error total. Non-member investigations (different `metadata.processHubId`)
 * are skipped.
 *
 * Returns one result per canonical-map node (`errorCount=0` for nodes with no
 * mapped data or no matching defect rows). Consumed by
 * `useProductionLineGlanceData` (T3) to populate the bottom-right Pareto slot.
 */
export function rollupStepErrors(input: StepErrorRollupInput): StepErrorRollupResult[] {
  const { hub, members, defectColumns = [], contextFilter } = input;
  const map: ProcessMap | undefined = hub.canonicalProcessMap;
  if (!map) return [];

  const counts = new Map<string, number>();
  for (const node of map.nodes) {
    counts.set(node.id, 0);
  }

  for (const member of members) {
    // Filter to investigations belonging to this hub via metadata.processHubId
    if (member.metadata?.processHubId !== hub.id) continue;

    const nodeMappings = member.metadata?.nodeMappings;
    if (!nodeMappings || nodeMappings.length === 0) continue;

    // rows is not on the base ProcessHubInvestigation type; apps attach it at
    // runtime on extended investigation objects. Access via a cast.
    const rows = (member as { rows?: readonly DataRow[] }).rows ?? [];
    if (rows.length === 0) continue;

    const mappedNodeIds = new Set(nodeMappings.map(m => m.nodeId));

    for (const row of rows) {
      if (!rowMatchesFilter(row, contextFilter)) continue;
      if (defectColumns.length === 0) continue;
      if (!rowHasDefect(row, defectColumns)) continue;
      for (const nodeId of mappedNodeIds) {
        counts.set(nodeId, (counts.get(nodeId) ?? 0) + 1);
      }
    }
  }

  return map.nodes.map((node: ProcessMapNode) => ({
    nodeId: node.id,
    label: node.name,
    errorCount: counts.get(node.id) ?? 0,
  }));
}
