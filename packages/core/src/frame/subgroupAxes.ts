/**
 * Resolve subgroup-axis columns from a Process Map.
 *
 * The map stores `subgroupAxes` as tributary IDs (so the relationship survives
 * column renames). Consumers that need column names — specifically the
 * capability-view SubgroupConfigPopover — call this to get the list in
 * rendering order.
 *
 * Returns an empty array for a missing map, a map with no subgroup axes set,
 * or axes that point at tributaries that no longer exist.
 */

import type { ProcessMap } from './types';

export function subgroupAxisColumns(map: ProcessMap | null | undefined): string[] {
  if (!map) return [];
  const byId = new Map(map.tributaries.map(t => [t.id, t.column]));
  return (map.subgroupAxes ?? [])
    .map(id => byId.get(id))
    .filter((c): c is string => typeof c === 'string');
}
