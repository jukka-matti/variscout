import { describe, it, expect } from 'vitest';
import { calculateNodeCapability } from '../nodeCapability';
import type { ProcessHub, ProcessHubInvestigation } from '../../processHub';

const hub: ProcessHub = {
  id: 'hub-1',
  name: 'Bottling Line A',
  createdAt: 1745836800000,
  deletedAt: null,
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
    createdAt: 1745836800000,
    updatedAt: 1745836800000,
    deletedAt: null,
    metadata: {
      processHubId: 'hub-1',
      nodeMappings: nodeId ? [{ nodeId, measurementColumn: 'unused' }] : undefined,
      reviewSignal:
        cpk !== undefined
          ? {
              outcome: 'fill_volume',
              rowCount: n,
              latestTimeValue: undefined,
              computedAt: '2026-04-28T10:00:00.000Z',
              changeSignals: {
                total: 0,
                outOfControlCount: 0,
                nelsonRule2Count: 0,
                nelsonRule3Count: 0,
              },
              capability: {
                cpk,
                cpkTarget: 1.33,
                cp: cpk + 0.1,
                outOfSpecPercentage: 0,
              },
            }
          : undefined,
    },
  };
}

describe('calculateNodeCapability — children source', () => {
  it('aggregates over investigations tagged to the same node, exposing per-investigation rows but no node-level cpk', () => {
    // Per-investigation cpks come pre-computed against THAT investigation's
    // own specs. We cannot tell whether siblings used identical specs, so
    // node-level cpk/cp stay undefined — callers render the per-investigation
    // distribution. (Spec line 148.)
    const members: ProcessHubInvestigation[] = [
      inv('a', 'n-fill', 1.5, 100),
      inv('b', 'n-fill', 1.2, 80),
      inv('c', 'n-press', 1.8, 50), // different node — excluded
    ];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.source).toBe('children');
    expect(result.contributingInvestigations).toEqual(['a', 'b']);
    expect(result.n).toBe(180);
    expect(result.sampleConfidence).toBe('trust');
    expect(result.perContextResults).toHaveLength(2);
    // Per-investigation cpks preserved for the dashboard.
    const cpks = result.perContextResults?.map(r => r.cpk).sort();
    expect(cpks).toEqual([1.2, 1.5]);
    // Node-level scalars deliberately undefined.
    expect(result.cpk).toBeUndefined();
    expect(result.cp).toBeUndefined();
  });

  it('excludes investigations with no reviewSignal', () => {
    const members: ProcessHubInvestigation[] = [
      inv('a', 'n-fill', 1.5, 100),
      inv('b', 'n-fill', undefined, 0), // no signal
    ];
    const result = calculateNodeCapability('n-fill', { kind: 'children', hub, members });
    expect(result.contributingInvestigations).toEqual(['a']);
    expect(result.n).toBe(100);
    expect(result.cpk).toBeUndefined();
    expect(result.perContextResults?.[0]?.cpk).toBe(1.5);
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
    expect(result.cpk).toBeUndefined();
    expect(result.perContextResults?.[0]?.cpk).toBe(1.5);
  });
});
