import { describe, it, expect, expectTypeOf } from 'vitest';
import type { ProcessMapNode } from '../types';
import type { SpecRule } from '../../types';

describe('ProcessMapNode.capabilityScope', () => {
  it('is optional and contains specRules', () => {
    expectTypeOf<NonNullable<ProcessMapNode['capabilityScope']>>().toMatchTypeOf<{
      specRules: SpecRule[];
    }>();
  });

  it('does not break the existing minimal shape', () => {
    const minimal: ProcessMapNode = { id: 'n1', name: 'Mix', order: 0 };
    expect(minimal.capabilityScope).toBeUndefined();
    expect(minimal.ctqColumn).toBeUndefined();
  });

  it('accepts a node with capabilityScope set', () => {
    const node: ProcessMapNode = {
      id: 'n1',
      name: 'Mix',
      order: 0,
      ctqColumn: 'mix_weight',
      capabilityScope: {
        specRules: [
          { specs: { usl: 10, lsl: 0 } },
          { when: { product: 'A' }, specs: { usl: 5, lsl: 1 } },
        ],
      },
    };
    expect(node.capabilityScope?.specRules).toHaveLength(2);
  });
});
