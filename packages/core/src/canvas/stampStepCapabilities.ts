import { calculateStats, type DataRow, type SpecLimits } from '..';
import type { ProcessMap } from '../frame';
import type { StepCapabilityStamp } from './stepDrift';

export interface StampStepCapabilitiesArgs {
  map: ProcessMap;
  rows: readonly DataRow[];
  measureSpecs: Record<string, SpecLimits>;
}

/**
 * Compute one StepCapabilityStamp per node in `map`.
 *
 * For each node we pick a metric column (preferring ctqColumn, falling back to
 * the first assigned column with parseable numeric values), parse numeric
 * values, then defer to the canonical stats engine. Stamps land in
 * EvidenceSnapshot.stepCapabilities so canvas drift comparisons can read them.
 *
 * Returns finite numbers or undefined per ADR-069 B2 (numeric safety boundary).
 * Stamps are emitted in node-order; nodes with no metric column or no parseable
 * values get { n: 0 } stamps so the array length tracks the map exactly.
 */
export function stampStepCapabilities(args: StampStepCapabilitiesArgs): StepCapabilityStamp[] {
  const { map, rows, measureSpecs } = args;
  const assignmentsByStep = columnsByStep(map);
  const sortedNodes = [...map.nodes].sort((a, b) => a.order - b.order);

  return sortedNodes.map(node => {
    const assignedColumns = assignmentsByStep.get(node.id) ?? [];
    const metricColumn = pickMetricColumn({
      ctqColumn: node.ctqColumn ?? null,
      assignedColumns,
      rows,
    });

    if (!metricColumn) return { stepId: node.id, n: 0 };

    const values = parseNumericValues(rows, metricColumn);
    if (values.length === 0) return { stepId: node.id, n: 0 };

    const specs = measureSpecs[metricColumn];
    const stats = calculateStats(values, specs?.usl, specs?.lsl);

    return buildStamp({ stepId: node.id, values, stats });
  });
}

function columnsByStep(map: ProcessMap): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const assignments = map.assignments ?? {};
  for (const [column, stepId] of Object.entries(assignments)) {
    if (!stepId) continue;
    const list = out.get(stepId) ?? [];
    list.push(column);
    out.set(stepId, list);
  }
  return out;
}

function pickMetricColumn(input: {
  ctqColumn: string | null;
  assignedColumns: string[];
  rows: readonly DataRow[];
}): string | undefined {
  const { ctqColumn, assignedColumns, rows } = input;
  if (ctqColumn && parseNumericValues(rows, ctqColumn).length > 0) return ctqColumn;
  return (
    assignedColumns.find(column => parseNumericValues(rows, column).length > 0) ??
    assignedColumns[0]
  );
}

function parseNumericValues(rows: readonly DataRow[], column: string): number[] {
  const out: number[] = [];
  for (const row of rows) {
    const raw = row[column];
    if (raw === undefined || raw === null || raw === '') continue;
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(num)) out.push(num);
  }
  return out;
}

function buildStamp(input: {
  stepId: string;
  values: number[];
  stats: ReturnType<typeof calculateStats>;
}): StepCapabilityStamp {
  const { stepId, values, stats } = input;
  const stamp: StepCapabilityStamp = { stepId, n: values.length };
  if (Number.isFinite(stats.mean)) stamp.mean = stats.mean;
  if (Number.isFinite(stats.stdDev)) stamp.sigma = stats.stdDev;
  if (typeof stats.cpk === 'number' && Number.isFinite(stats.cpk)) stamp.cpk = stats.cpk;
  return stamp;
}
