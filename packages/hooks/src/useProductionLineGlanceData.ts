import { useMemo } from 'react';
import {
  calculateNodeCapability,
  distinctContextValues,
  rollupStepErrors,
} from '@variscout/core/stats';
import type { NodeCapabilityResult } from '@variscout/core/stats';
import type { SpecLookupContext } from '@variscout/core/types';
import type {
  DataRow,
  IChartDataPoint,
  StatsResult,
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
} from '@variscout/core';

const DEFAULT_CPK_TARGET = 1.33;

export interface UseProductionLineGlanceDataInput {
  hub: ProcessHub;
  members: readonly ProcessHubInvestigation[];
  rowsByInvestigation: ReadonlyMap<string, readonly DataRow[]>;
  contextFilter: SpecLookupContext;
  defectColumns?: readonly string[];
}

export interface CapabilityBoxplotInputNode {
  nodeId: string;
  label: string;
  targetCpk?: number;
  result: NodeCapabilityResult;
}

export interface UseProductionLineGlanceDataResult {
  cpkTrend: {
    data: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
    specs: { target?: number; usl?: number; lsl?: number };
  };
  cpkGapTrend: {
    series: ReadonlyArray<IChartDataPoint>;
    stats: StatsResult | null;
  };
  capabilityNodes: ReadonlyArray<CapabilityBoxplotInputNode>;
  errorSteps: ReadonlyArray<{ nodeId: string; label: string; errorCount: number }>;
  availableContext: {
    hubColumns: string[];
    tributaryGroups: Array<{ tributaryLabel: string; columns: string[] }>;
  };
  contextValueOptions: Record<string, string[]>;
}

const EMPTY_RESULT: UseProductionLineGlanceDataResult = {
  cpkTrend: { data: [], stats: null, specs: {} },
  cpkGapTrend: { series: [], stats: null },
  capabilityNodes: [],
  errorSteps: [],
  availableContext: { hubColumns: [], tributaryGroups: [] },
  contextValueOptions: {},
};

function rowMatchesFilter(row: DataRow, filter: SpecLookupContext): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (v === null || v === undefined) continue;
    const actual = row[k];
    if (actual === undefined || actual === null) return false;
    if (String(actual) !== String(v)) return false;
  }
  return true;
}

export function useProductionLineGlanceData(
  input: UseProductionLineGlanceDataInput
): UseProductionLineGlanceDataResult {
  const { hub, members, rowsByInvestigation, contextFilter, defectColumns } = input;
  const map = hub.canonicalProcessMap;

  // Collect all filtered rows across members for context-value discovery.
  const allFilteredRows = useMemo<DataRow[]>(() => {
    const out: DataRow[] = [];
    for (const member of members) {
      if (member.metadata?.processHubId !== hub.id) continue;
      const rows = rowsByInvestigation.get(member.id) ?? [];
      for (const row of rows) {
        if (rowMatchesFilter(row, contextFilter)) out.push(row);
      }
    }
    return out;
  }, [hub.id, members, rowsByInvestigation, contextFilter]);

  // Per-node capability results — one entry per (node × first-matching-member) pair.
  const capabilityNodes = useMemo<CapabilityBoxplotInputNode[]>(() => {
    if (!map) return [];
    const results: CapabilityBoxplotInputNode[] = [];
    for (const node of map.nodes) {
      if (!node.capabilityScope) continue;
      for (const member of members) {
        if (member.metadata?.processHubId !== hub.id) continue;
        const meta = member.metadata as ProcessHubInvestigationMetadata;
        if (!meta?.nodeMappings?.some(m => m.nodeId === node.id)) continue;
        const rows = rowsByInvestigation.get(member.id) ?? [];
        const filtered = rows.filter(r => rowMatchesFilter(r, contextFilter));
        if (filtered.length === 0) continue;
        const result = calculateNodeCapability(node.id, {
          kind: 'column',
          processMap: map,
          investigationMeta: meta,
          data: filtered,
          hubContextColumns: hub.contextColumns,
        });
        const defaultRule = node.capabilityScope.specRules.find(r => !r.when);
        const targetCpk = defaultRule?.specs.target;
        results.push({ nodeId: node.id, label: node.name, targetCpk, result });
        break; // first matching member wins per node
      }
    }
    return results;
  }, [map, members, rowsByInvestigation, contextFilter, hub.id, hub.contextColumns]);

  // Roll up step error counts. rollupStepErrors reads rows from member objects
  // directly (duck-typed cast in core). Pass members as-is.
  const errorSteps = useMemo(() => {
    return rollupStepErrors({
      hub,
      members,
      defectColumns,
      contextFilter,
    });
  }, [hub, members, defectColumns, contextFilter]);

  // Plan C1 ships an empty top row for the dashboard. The full top-left "Cpk
  // vs target i-chart" slot requires a per-snapshot line-level Cp/Cpk series
  // derived from a coherent measurement (the hub's outcome / line-level CTQ),
  // which is engine work that has not yet shipped. Computing per-node Cpks
  // and feeding them through control-chart math would aggregate Cp/Cpk across
  // heterogeneous local processes — exactly the unsafe primitive Watson's
  // rule (and the design spec's "structural absence" principle) excludes.
  //
  // The 2x2 dashboard renders empty slots gracefully; analysts see the spatial
  // row (CapabilityBoxplot + StepErrorPareto) which is methodologically safe
  // because each node's Cpk is visualized as its own distribution, never
  // collapsed across nodes. The temporal row populates in a future PR once
  // the engine exposes a per-snapshot line-level Cp/Cpk source.
  const cpkTrend = useMemo(
    () => ({
      data: [] as ReadonlyArray<IChartDataPoint>,
      stats: null as StatsResult | null,
      specs: { target: DEFAULT_CPK_TARGET } as { target?: number; usl?: number; lsl?: number },
    }),
    []
  );

  const cpkGapTrend = useMemo(
    () => ({
      series: [] as ReadonlyArray<IChartDataPoint>,
      stats: null as StatsResult | null,
    }),
    []
  );

  // Available context: hub columns + tributary-attached context columns.
  const availableContext = useMemo(() => {
    const hubColumns = [...(hub.contextColumns ?? [])];
    const tributaryGroups = (map?.tributaries ?? [])
      .filter(t => t.contextColumns && t.contextColumns.length > 0)
      .map(t => ({
        tributaryLabel: t.label ?? t.column,
        columns: [...(t.contextColumns ?? [])],
      }));
    return { hubColumns, tributaryGroups };
  }, [hub.contextColumns, map]);

  // Distinct values per context column, from filtered rows.
  const contextValueOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    const allColumns = new Set<string>([
      ...availableContext.hubColumns,
      ...availableContext.tributaryGroups.flatMap(g => g.columns),
    ]);
    for (const col of allColumns) {
      out[col] = distinctContextValues(allFilteredRows, col);
    }
    return out;
  }, [availableContext, allFilteredRows]);

  if (!map) return EMPTY_RESULT;

  return {
    cpkTrend,
    cpkGapTrend,
    capabilityNodes,
    errorSteps,
    availableContext,
    contextValueOptions,
  };
}
