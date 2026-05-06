import { describe, it, expect } from 'vitest';
import { rollupStepErrors } from '../stepErrorAggregation';
import type {
  ProcessHub,
  ProcessHubInvestigation,
  ProcessHubInvestigationMetadata,
} from '../../processHub';
import type { ProcessMap } from '../../frame/types';
import type { DataRow } from '../../types';

const map: ProcessMap = {
  version: 1,
  nodes: [
    { id: 'n1', name: 'Mix', order: 0, ctqColumn: 'mixCpk' },
    { id: 'n2', name: 'Fill', order: 1, ctqColumn: 'fillCpk' },
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
};

function makeMember(opts: {
  id: string;
  rows: DataRow[];
  nodeMappings: ProcessHubInvestigationMetadata['nodeMappings'];
}): ProcessHubInvestigation {
  return {
    id: opts.id,
    name: `Investigation ${opts.id}`,
    createdAt: 1745836800000,
    updatedAt: 1745836800000,
    deletedAt: null,
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: opts.nodeMappings,
      canonicalMapVersion: '2026-04-28',
    } as never,
    rows: opts.rows,
  } as unknown as ProcessHubInvestigation;
}

describe('rollupStepErrors', () => {
  it('counts non-pass rows per node from the configured defect column', () => {
    const m1 = makeMember({
      id: 'i1',
      rows: [
        { mixCpk: 1.4, defect: 'pass' },
        { mixCpk: 1.0, defect: 'crack' },
        { mixCpk: 0.8, defect: 'crack' },
        { mixCpk: 1.5, defect: 'pass' },
      ],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const m2 = makeMember({
      id: 'i2',
      rows: [
        { fillCpk: 1.2, defect: 'pass' },
        { fillCpk: 0.9, defect: 'short-fill' },
      ],
      nodeMappings: [{ nodeId: 'n2', measurementColumn: 'fillCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m1, m2],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(2);
    expect(result.find(s => s.nodeId === 'n2')?.errorCount).toBe(1);
    expect(result.find(s => s.nodeId === 'n1')?.label).toBe('Mix');
  });

  it('respects contextFilter — only counts rows matching the filter', () => {
    const m = makeMember({
      id: 'i1',
      rows: [
        { mixCpk: 1.0, defect: 'crack', product: 'A' },
        { mixCpk: 1.0, defect: 'crack', product: 'B' },
        { mixCpk: 1.0, defect: 'crack', product: 'A' },
      ],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m],
      defectColumns: ['defect'],
      contextFilter: { product: 'A' },
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(2);
  });

  it('returns 0 errorCount for nodes that have no defect data', () => {
    const m = makeMember({
      id: 'i1',
      rows: [{ mixCpk: 1.4 }, { mixCpk: 1.5 }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(0);
  });

  it('aggregates across multiple investigations mapped to the same node', () => {
    const m1 = makeMember({
      id: 'i1',
      rows: [
        { mixCpk: 1.0, defect: 'crack' },
        { mixCpk: 1.0, defect: 'crack' },
      ],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const m2 = makeMember({
      id: 'i2',
      rows: [{ mixCpk: 1.0, defect: 'crack' }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({
      hub,
      members: [m1, m2],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(3);
  });

  it('skips investigations from a different hub', () => {
    const otherHub = makeMember({
      id: 'other',
      rows: [{ mixCpk: 1.0, defect: 'crack' }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const meta = (otherHub as { metadata?: ProcessHubInvestigationMetadata }).metadata;
    if (meta) (meta as { processHubId: string }).processHubId = 'hub-2';
    const result = rollupStepErrors({
      hub,
      members: [otherHub],
      defectColumns: ['defect'],
    });
    expect(result.find(s => s.nodeId === 'n1')?.errorCount).toBe(0);
  });

  it('returns empty array when hub has no canonicalProcessMap', () => {
    const noMapHub: ProcessHub = {
      ...hub,
      canonicalProcessMap: undefined,
    };
    const result = rollupStepErrors({ hub: noMapHub, members: [], defectColumns: ['defect'] });
    expect(result).toEqual([]);
  });

  it('handles empty defectColumns by returning all nodes with errorCount=0', () => {
    const m = makeMember({
      id: 'i1',
      rows: [{ mixCpk: 1.0, defect: 'crack' }],
      nodeMappings: [{ nodeId: 'n1', measurementColumn: 'mixCpk' }],
    });
    const result = rollupStepErrors({ hub, members: [m] });
    expect(result.every(s => s.errorCount === 0)).toBe(true);
  });
});
