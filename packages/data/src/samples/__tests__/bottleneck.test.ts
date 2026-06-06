import { describe, expect, it } from 'vitest';
import { bottleneck } from '../bottleneck';

describe('bottleneck sample — processMap integrity', () => {
  const { config, data } = bottleneck;
  const processMap = config.processMap!;

  it('has a processMap', () => {
    expect(processMap).toBeDefined();
  });

  it('ctsColumn matches config.outcome', () => {
    expect(processMap.ctsColumn).toBe(config.outcome);
  });

  it('nodes names (sorted by order) equal the sorted distinct Step values from data', () => {
    // Derive distinct Step values from actual data rows — survives data edits
    const distinctSteps = [...new Set(data.map(row => row['Step'] as string))].sort();

    const nodeNamesByOrder = [...processMap.nodes]
      .sort((a, b) => a.order - b.order)
      .map(n => n.name);

    expect(nodeNamesByOrder).toEqual(distinctSteps);
  });

  it('every tributary stepId exists in nodes', () => {
    const nodeIds = new Set(processMap.nodes.map(n => n.id));
    for (const trib of processMap.tributaries) {
      expect(
        nodeIds.has(trib.stepId),
        `tributary ${trib.id} stepId=${trib.stepId} not in nodes`
      ).toBe(true);
    }
  });

  it('every tributary column is in config.factors', () => {
    for (const trib of processMap.tributaries) {
      expect(
        config.factors.includes(trib.column),
        `tributary ${trib.id} column=${trib.column} not in config.factors`
      ).toBe(true);
    }
  });
});
