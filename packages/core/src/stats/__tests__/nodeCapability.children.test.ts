import { describe, it, expect } from 'vitest';
import { calculateNodeCapability } from '../nodeCapability';
import type { ProcessHub, ProcessHubInvestigation } from '../../processHub';

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Bottling Line A',
  createdAt: '2026-04-28T10:00:00.000Z',
};

function inv(
  id: string,
  nodeId: string,
  cpk: number | undefined,
  n: number
): ProcessHubInvestigation {
  return {
    id,
    name: `inv-${id}`,
    modified: '2026-04-28T10:00:00.000Z',
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: nodeId ? [{ nodeId, measurementColumn: 'unused' }] : undefined,
      reviewSignal:
        cpk !== undefined
          ? {
              outcome: 'fill_volume',
              rowCount: n,
              latestTimeValue: undefined,
              capability: { cpk, cpkTarget: 1.33, cp: cpk + 0.1 },
            }
          : undefined,
    },
  };
}

describe('calculateNodeCapability — children source', () => {
  it('aggregates over investigations tagged to the same node', () => {
    const members: ProcessHubInvestigation[] = [
      inv('a', 'n-fill', 1.5, 100),
      inv('b', 'n-fill', 1.2, 80),
      inv('c', 'n-press', 1.8, 50), // different node — excluded
    ];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.source).toBe('children');
    expect(result.contributingInvestigations).toEqual(['a', 'b']);
    expect(result.n).toBe(180);
    // Aggregate cpk = worst-case across contributing investigations
    expect(result.cpk).toBe(1.2);
    expect(result.sampleConfidence).toBe('trust');
    expect(result.perContextResults).toHaveLength(2);
  });

  it('excludes investigations with no reviewSignal', () => {
    const members: ProcessHubInvestigation[] = [
      inv('a', 'n-fill', 1.5, 100),
      inv('b', 'n-fill', undefined, 0), // no signal
    ];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.contributingInvestigations).toEqual(['a']);
    expect(result.n).toBe(100);
  });

  it('returns insufficient when no contributors exist', () => {
    const members: ProcessHubInvestigation[] = [inv('a', 'n-press', 1.5, 100)];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.n).toBe(0);
    expect(result.cpk).toBeUndefined();
    expect(result.sampleConfidence).toBe('insufficient');
    expect(result.contributingInvestigations).toEqual([]);
  });

  it('excludes members from other hubs', () => {
    const otherHubInv: ProcessHubInvestigation = {
      ...inv('z', 'n-fill', 0.5, 100),
      metadata: {
        ...inv('z', 'n-fill', 0.5, 100).metadata,
        processHubId: 'hub-OTHER',
      },
    };
    const result = calculateNodeCapability('n-fill', {
      kind: 'children',
      hub,
      members: [inv('a', 'n-fill', 1.5, 100), otherHubInv],
    });
    expect(result.contributingInvestigations).toEqual(['a']);
    expect(result.cpk).toBe(1.5);
  });
});
