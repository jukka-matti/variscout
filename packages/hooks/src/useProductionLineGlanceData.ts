import { useMemo } from 'react';
import {
  calculateNodeCapability,
  calculateStats,
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

  // Cpk trend: per-node Cpk values treated as a left-to-right sequence.
  const cpkTrend = useMemo(() => {
    const cpks = capabilityNodes
      .map(n => n.result.cpk)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (cpks.length === 0) {
      return { data: [] as ReadonlyArray<IChartDataPoint>, stats: null, specs: { target: 1.33 } };
    }
    const data: IChartDataPoint[] = cpks.map((y, i) => ({ x: i, y, originalIndex: i }));
    const stats = calculateStats(cpks);
    return { data, stats, specs: { target: 1.33 } };
  }, [capabilityNodes]);

  // Cpk gap trend: (Cp − Cpk) per node, indicating centering loss.
  const cpkGapTrend = useMemo(() => {
    const gaps = capabilityNodes
      .map(n => {
        const cp = n.result.cp;
        const cpk = n.result.cpk;
        if (typeof cp !== 'number' || typeof cpk !== 'number') return undefined;
        return cp - cpk;
      })
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (gaps.length === 0) {
      return { series: [] as ReadonlyArray<IChartDataPoint>, stats: null };
    }
    const series: IChartDataPoint[] = gaps.map((y, i) => ({ x: i, y, originalIndex: i }));
    const stats = calculateStats(gaps);
    return { series, stats };
  }, [capabilityNodes]);

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
