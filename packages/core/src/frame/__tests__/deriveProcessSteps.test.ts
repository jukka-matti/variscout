import { describe, expect, it } from 'vitest';
import { deriveProcessSteps } from '../deriveProcessSteps';
import type { ProcessMap } from '../types';

function mapWith(nodes: ProcessMap['nodes']): ProcessMap {
  return {
    version: 1,
    nodes,
    tributaries: [],
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  };
}

describe('deriveProcessSteps', () => {
  it('returns [] for an undefined map (mapless project is valid)', () => {
    expect(deriveProcessSteps(undefined)).toEqual([]);
  });

  it('returns [] for a map with no nodes', () => {
    expect(deriveProcessSteps(mapWith([]))).toEqual([]);
  });

  it('returns [] for a degenerate map whose nodes array is missing (does not throw)', () => {
    // A partial / in-construction ProcessMap may lack `nodes` entirely.
    expect(deriveProcessSteps({} as unknown as Parameters<typeof deriveProcessSteps>[0])).toEqual(
      []
    );
  });

  it('projects nodes down to { id, name, order } only', () => {
    const map = mapWith([
      {
        id: 'step-mix-1',
        name: 'Mix',
        order: 0,
        ctqColumn: 'Viscosity',
        capabilityScope: { specRules: [] },
        parentStepId: null,
      },
    ]);
    expect(deriveProcessSteps(map)).toEqual([{ id: 'step-mix-1', name: 'Mix', order: 0 }]);
  });

  it('carries the canonical node id through unchanged', () => {
    const map = mapWith([
      { id: 'step-fill-2', name: 'Fill', order: 0 },
      { id: 'step-seal-3', name: 'Seal', order: 1 },
    ]);
    expect(deriveProcessSteps(map).map(s => s.id)).toEqual(['step-fill-2', 'step-seal-3']);
  });

  it('sorts ascending by order regardless of node insertion order', () => {
    const map = mapWith([
      { id: 'step-pack-3', name: 'Pack', order: 2 },
      { id: 'step-mix-1', name: 'Mix', order: 0 },
      { id: 'step-react-2', name: 'React', order: 1 },
    ]);
    expect(deriveProcessSteps(map).map(s => s.name)).toEqual(['Mix', 'React', 'Pack']);
  });

  it('does not mutate the source map nodes', () => {
    const nodes = [
      { id: 'b', name: 'B', order: 1 },
      { id: 'a', name: 'A', order: 0 },
    ];
    const map = mapWith(nodes);
    deriveProcessSteps(map);
    expect(map.nodes.map(n => n.id)).toEqual(['b', 'a']);
  });
});
