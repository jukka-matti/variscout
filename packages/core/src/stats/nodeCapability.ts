import type { DataRow, SpecLimits, SpecLookupContext } from '../types';
import { toNumericValue } from '../types';
import type { ProcessMap, ProcessMapNode } from '../frame/types';
import type {
  ProcessHubInvestigationMetadata,
  ProcessHub,
  ProcessHubInvestigation,
} from '../processHub';
import { lookupSpecRule } from './specRuleLookup';
import { sampleConfidenceFor, type SampleConfidence } from './sampleConfidence';
import { safeDivide } from './safeMath';

/**
 * Per-(canonical-node × context-tuple) capability result. Returned by
 * `calculateNodeCapability`. The ONLY capability function exposed at the
 * canonical-node level — there is intentionally no aggregator across
 * heterogeneous local processes (Watson G10/D3, structural absence).
 *
 * See spec: docs/superpowers/specs/2026-04-28-production-line-glance-design.md
 */
export interface NodeCapabilityResult {
  nodeId: string;
  /** Aggregate Cpk for this node — undefined when no rule matches or n=0. */
  cpk?: number;
  /** Aggregate Cp for this node — undefined when no rule matches or n=0. */
  cp?: number;
  /** Total measurement count across all contexts. */
  n: number;
  /** Confidence band derived from total `n`. */
  sampleConfidence: SampleConfidence;
  /** Source kind that produced this result. */
  source: 'column' | 'children' | 'mixed';
  /** Investigation IDs that contributed (only for `children` source). */
  contributingInvestigations?: string[];
  /** Per-context results — one row per distinct context tuple. */
  perContextResults?: Array<{
    contextTuple: SpecLookupContext;
    cpk?: number;
    cp?: number;
    n: number;
    sampleConfidence: SampleConfidence;
  }>;
}

export type CalculateNodeCapabilitySource =
  | {
      kind: 'column';
      processMap: ProcessMap;
      investigationMeta: ProcessHubInvestigationMetadata;
      data: readonly DataRow[];
    }
  | {
      kind: 'children';
      hub: ProcessHub;
      members: readonly ProcessHubInvestigation[];
    };

const EMPTY_INSUFFICIENT: NodeCapabilityResult = {
  nodeId: '',
  cpk: undefined,
  cp: undefined,
  n: 0,
  sampleConfidence: 'insufficient',
  source: 'column',
  perContextResults: [],
};

/**
 * Compute capability for a single canonical-map node. Two modes:
 *
 * - `kind: 'column'` — read measurements from one investigation's data,
 *   resolved via `investigationMeta.nodeMappings`. Per-context-tuple Cp/Cpk
 *   computed by looking up `SpecRule` from `node.capabilityScope.specRules`.
 *
 * - `kind: 'children'` — aggregate per-investigation `reviewSignal` values
 *   from `members` whose `processHubId === hub.id` and which are tagged for
 *   this node via their `nodeMappings`. (Implemented in Task 9.)
 */
export function calculateNodeCapability(
  nodeId: string,
  source: CalculateNodeCapabilitySource
): NodeCapabilityResult {
  if (source.kind === 'column') {
    return calculateFromColumn(nodeId, source);
  }
  return calculateFromChildren(nodeId, source);
}

// ============================================================================
// Column-source implementation
// ============================================================================

function findNode(processMap: ProcessMap, nodeId: string): ProcessMapNode | undefined {
  return processMap.nodes.find(n => n.id === nodeId);
}

function getMeasurementColumn(
  node: ProcessMapNode,
  meta: ProcessHubInvestigationMetadata
): string | undefined {
  const mapping = meta.nodeMappings?.find(m => m.nodeId === node.id);
  if (mapping?.measurementColumn) return mapping.measurementColumn;
  return node.ctqColumn;
}

function getEffectiveSpecRules(
  node: ProcessMapNode,
  meta: ProcessHubInvestigationMetadata
): readonly { when?: Record<string, string | null>; specs: SpecLimits }[] {
  const mapping = meta.nodeMappings?.find(m => m.nodeId === node.id);
  if (mapping?.specsOverride) {
    // Override replaces the rule list with a single default rule (flagged fork)
    return [{ specs: mapping.specsOverride }];
  }
  return node.capabilityScope?.specRules ?? [];
}

function gatherContextColumns(
  processMap: ProcessMap,
  specRules: readonly { when?: Record<string, string | null>; specs: SpecLimits }[],
  hubColumns?: string[]
): string[] {
  const set = new Set<string>(hubColumns ?? []);
  for (const trib of processMap.tributaries) {
    for (const c of trib.contextColumns ?? []) set.add(c);
  }
  // Include keys mentioned in any spec rule's `when` — those columns are
  // inherently context-relevant even when the canonical map's tributaries
  // haven't yet been authored to declare them.
  for (const rule of specRules) {
    if (rule.when) {
      for (const k of Object.keys(rule.when)) set.add(k);
    }
  }
  return Array.from(set);
}

function rowContext(row: DataRow, contextColumns: readonly string[]): SpecLookupContext {
  const ctx: SpecLookupContext = {};
  for (const col of contextColumns) {
    const value = row[col];
    if (value === null || value === undefined || value === '') {
      ctx[col] = null;
    } else {
      ctx[col] = String(value);
    }
  }
  return ctx;
}

function contextKey(ctx: SpecLookupContext): string {
  // Stable key for grouping — sort entries to make order-independent.
  const entries = Object.entries(ctx)
    .map(([k, v]) => [k, v ?? ''] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));
  return JSON.stringify(entries);
}

function computeCpCpk(values: readonly number[], specs: SpecLimits): { cp?: number; cpk?: number } {
  if (values.length === 0) return {};
  // Mean
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  // Within-subgroup sigma via simple sample stdev — for V1 column-source we
  // treat the whole sample as one group. Subgroup-level computation already
  // exists (subgroupCapability.ts); per-step Cpk uses overall stdev.
  let ssq = 0;
  for (const v of values) {
    const d = v - mean;
    ssq += d * d;
  }
  const sigma = values.length > 1 ? Math.sqrt(ssq / (values.length - 1)) : 0;
  if (sigma === 0) return {};

  const { usl, lsl } = specs;
  // Cp requires both. safeDivide already returns number | undefined for non-finite
  // results — no need to wrap in finiteOrUndefined.
  let cp: number | undefined;
  if (usl !== undefined && lsl !== undefined) {
    cp = safeDivide(usl - lsl, 6 * sigma);
  }
  // Cpk = min(Cpu, Cpl) when both present; else single-sided
  let cpk: number | undefined;
  const cpu = usl !== undefined ? safeDivide(usl - mean, 3 * sigma) : undefined;
  const cpl = lsl !== undefined ? safeDivide(mean - lsl, 3 * sigma) : undefined;
  if (cpu !== undefined && cpl !== undefined) cpk = Math.min(cpu, cpl);
  else cpk = cpu ?? cpl;
  return { cp, cpk };
}

function calculateFromColumn(
  nodeId: string,
  source: Extract<CalculateNodeCapabilitySource, { kind: 'column' }>
): NodeCapabilityResult {
  const { processMap, investigationMeta, data } = source;
  const node = findNode(processMap, nodeId);
  if (!node) return { ...EMPTY_INSUFFICIENT, nodeId };

  const measurementColumn = getMeasurementColumn(node, investigationMeta);
  const specRules = getEffectiveSpecRules(node, investigationMeta);
  if (!measurementColumn || specRules.length === 0) {
    return { ...EMPTY_INSUFFICIENT, nodeId, source: 'column', perContextResults: [] };
  }

  const contextColumns = gatherContextColumns(
    processMap,
    specRules /* hub-level columns merged at caller */
  );
  // Group rows by context tuple
  const groups = new Map<string, { ctx: SpecLookupContext; values: number[] }>();
  for (const row of data) {
    const v = toNumericValue(row[measurementColumn]);
    if (v === undefined) continue;
    const ctx = rowContext(row, contextColumns);
    const key = contextKey(ctx);
    let g = groups.get(key);
    if (!g) {
      g = { ctx, values: [] };
      groups.set(key, g);
    }
    g.values.push(v);
  }

  const perContextResults: NonNullable<NodeCapabilityResult['perContextResults']> = [];
  let totalN = 0;
  // For aggregate cpk/cp at the node level, take the *minimum* across contexts —
  // the worst-case capability is the methodologically correct summary when
  // contexts have different specs (you can only commit to the worst one).
  let aggregateCpk: number | undefined;
  let aggregateCp: number | undefined;

  for (const { ctx, values } of groups.values()) {
    const rule = lookupSpecRule(specRules, ctx);
    const { cp, cpk } = rule ? computeCpCpk(values, rule.specs) : {};
    perContextResults.push({
      contextTuple: ctx,
      cpk,
      cp,
      n: values.length,
      sampleConfidence: sampleConfidenceFor(values.length),
    });
    totalN += values.length;
    if (cpk !== undefined) {
      aggregateCpk = aggregateCpk === undefined ? cpk : Math.min(aggregateCpk, cpk);
    }
    if (cp !== undefined) {
      aggregateCp = aggregateCp === undefined ? cp : Math.min(aggregateCp, cp);
    }
  }

  return {
    nodeId,
    cpk: aggregateCpk,
    cp: aggregateCp,
    n: totalN,
    sampleConfidence: sampleConfidenceFor(totalN),
    source: 'column',
    perContextResults,
  };
}

// ============================================================================
// Children-source implementation
// ============================================================================

function calculateFromChildren(
  nodeId: string,
  source: Extract<CalculateNodeCapabilitySource, { kind: 'children' }>
): NodeCapabilityResult {
  const { hub, members } = source;
  const contributing: NonNullable<NodeCapabilityResult['contributingInvestigations']> = [];
  const perContextResults: NonNullable<NodeCapabilityResult['perContextResults']> = [];
  let totalN = 0;
  let aggregateCpk: number | undefined;
  let aggregateCp: number | undefined;

  for (const member of members) {
    const meta = member.metadata;
    if (!meta) continue;
    if (meta.processHubId !== hub.id) continue;
    const tagged = meta.nodeMappings?.some(m => m.nodeId === nodeId) ?? false;
    if (!tagged) continue;
    const signal = meta.reviewSignal;
    if (!signal) continue;
    const cpk = signal.capability?.cpk;
    const cp = signal.capability?.cp;
    const n = signal.rowCount ?? 0;
    if (n <= 0) continue;
    contributing.push(member.id);
    totalN += n;
    if (cpk !== undefined) {
      aggregateCpk = aggregateCpk === undefined ? cpk : Math.min(aggregateCpk, cpk);
    }
    if (cp !== undefined) {
      aggregateCp = aggregateCp === undefined ? cp : Math.min(aggregateCp, cp);
    }
    // Each contributing investigation contributes one perContextResult row.
    // Context tuple is empty here — children aggregation does not stratify by
    // context columns; that's the column-source's job. (Future: aggregate
    // signal.capability.perContextResults if signals carry them.)
    perContextResults.push({
      contextTuple: { investigationId: member.id },
      cpk,
      cp,
      n,
      sampleConfidence: sampleConfidenceFor(n),
    });
  }

  return {
    nodeId,
    cpk: aggregateCpk,
    cp: aggregateCp,
    n: totalN,
    sampleConfidence: sampleConfidenceFor(totalN),
    source: 'children',
    contributingInvestigations: contributing,
    perContextResults,
  };
}
