import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProductionLineGlanceData } from '../useProductionLineGlanceData';
import type { ProcessHub, ProcessHubInvestigation, DataRow } from '@variscout/core';

const map = {
  version: 1 as const,
  nodes: [
    {
      id: 'n1',
      name: 'Mix',
      order: 0,
      ctqColumn: 'mixCpk',
      capabilityScope: {
        specRules: [{ specs: { lsl: 0, usl: 2, target: 1 } }],
      },
    },
    {
      id: 'n2',
      name: 'Fill',
      order: 1,
      ctqColumn: 'fillCpk',
      capabilityScope: {
        specRules: [{ specs: { lsl: 0, usl: 2, target: 1 } }],
      },
    },
  ],
  tributaries: [],
  createdAt: '2026-04-28T00:00:00.000Z',
  updatedAt: '2026-04-28T00:00:00.000Z',
};

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Line A',
  createdAt: 1745836800000,
  deletedAt: null,
  canonicalProcessMap: map,
  canonicalMapVersion: '2026-04-28',
  contextColumns: ['product'],
};

function makeMember(opts: {
  id: string;
  rows: DataRow[];
  nodeMappings: Array<{ nodeId: string; measurementColumn: string }>;
}): ProcessHubInvestigation & { rows: DataRow[] } {
  return {
    id: opts.id,
    name: `Inv ${opts.id}`,
    createdAt: 1745836800000,
    updatedAt: 1745836800000,
    deletedAt: null,
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: opts.nodeMappings,
      canonicalMapVersion: '2026-04-28',
    },
    rows: opts.rows,
    reviewSignal: { ok: 0, review: 0, alarm: 0 },
  } as unknown as ProcessHubInvestigation & { rows: DataRow[] };
}

describe('useProductionLineGlanceData', () => {
  it('returns all four slot inputs for a hub with one mapped investigation', () => {
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows: Array.from({ length: 30 }, (_, i) => ({
        mixCpk: 1.0 + (i % 7) * 0.1,
        product: 'A',
        defect: 'pass',
      })),
    });
    const rowsByInv = new Map([['i1', m.rows ?? []]]);
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: rowsByInv,
        contextFilter: {},
      })
    );
    expect(result.current.cpkTrend.data.length).toBeGreaterThanOrEqual(0);
    expect(result.current.cpkGapTrend.series.length).toBeGreaterThanOrEqual(0);
    expect(result.current.capabilityNodes.length).toBeGreaterThanOrEqual(1);
    expect(result.current.errorSteps.map(s => s.nodeId).sort()).toEqual(['n1', 'n2']);
  });

  it('exposes hub-level context columns in availableContext.hubColumns', () => {
    const m = makeMember({ id: 'i1', nodeMappings: [], rows: [] });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', []]]),
        contextFilter: {},
      })
    );
    expect(result.current.availableContext.hubColumns).toEqual(['product']);
  });

  it('populates contextValueOptions from member rows', () => {
    const rows = [
      { mixCpk: 1.2, product: 'Coke 12oz' },
      { mixCpk: 1.4, product: 'Sprite 12oz' },
      { mixCpk: 1.1, product: 'Coke 12oz' },
    ];
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows,
    });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', rows]]),
        contextFilter: {},
      })
    );
    expect(result.current.contextValueOptions.product).toEqual(['Coke 12oz', 'Sprite 12oz']);
  });

  it('honors contextFilter — filtered rows reduce capabilityNodes input', () => {
    const rows = [
      { mixCpk: 1.0, product: 'A' },
      { mixCpk: 1.5, product: 'A' },
      { mixCpk: 0.5, product: 'B' },
      { mixCpk: 0.4, product: 'B' },
    ];
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows,
    });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', rows]]),
        contextFilter: { product: 'A' },
      })
    );
    const n1 = result.current.capabilityNodes.find(c => c.nodeId === 'n1');
    expect(n1).toBeTruthy();
    expect(n1?.result.n).toBeLessThanOrEqual(2);
  });

  it('returns empty slot inputs for hub with no canonicalProcessMap', () => {
    const noMapHub: ProcessHub = { ...hub, canonicalProcessMap: undefined };
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub: noMapHub,
        members: [],
        rowsByInvestigation: new Map(),
        contextFilter: {},
      })
    );
    expect(result.current.capabilityNodes).toEqual([]);
    expect(result.current.errorSteps).toEqual([]);
  });

  it('errorSteps reflects defect counts when defectColumns provided', () => {
    const rows = [
      { mixCpk: 1.0, defect: 'pass' },
      { mixCpk: 1.0, defect: 'crack' },
      { mixCpk: 1.0, defect: 'crack' },
    ];
    const m = makeMember({
      id: 'i1',
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
      rows,
    });
    const { result } = renderHook(() =>
      useProductionLineGlanceData({
        hub,
        members: [m],
        rowsByInvestigation: new Map([['i1', rows]]),
        contextFilter: {},
        defectColumns: ['defect'],
      })
    );
    expect(result.current.errorSteps.find(s => s.nodeId === 'n1')?.errorCount).toBe(2);
  });
});
