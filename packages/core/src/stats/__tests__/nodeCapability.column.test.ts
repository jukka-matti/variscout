import { describe, it, expect } from 'vitest';
import { calculateNodeCapability } from '../nodeCapability';
import type { DataRow } from '../../types';
import type { ProcessMap } from '../../frame/types';
import type { ProcessHubInvestigationMetadata, InvestigationNodeMapping } from '../../processHub';

// Deterministic counter-based noise — never Math.random per .claude/rules/stats.md
function deterministicNoise(i: number, scale: number): number {
  // Mulberry32-style hash on the integer index
  let h = (i + 0x9e3779b9) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) / 0xffffffff - 0.5) * 2 * scale;
}

const processMap: ProcessMap = {
  version: 1,
  nodes: [
    {
      id: 'n-fill',
      name: 'Fill',
      order: 0,
      capabilityScope: {
        specRules: [
          { specs: { usl: 360, lsl: 348, target: 354 } }, // default
          { when: { product: 'Coke 16oz' }, specs: { usl: 478, lsl: 468, target: 473 } },
        ],
      },
    },
  ],
  tributaries: [],
  createdAt: '2026-04-28T10:00:00.000Z',
  updatedAt: '2026-04-28T10:00:00.000Z',
};

const nodeMappings: InvestigationNodeMapping[] = [
  { nodeId: 'n-fill', measurementColumn: 'fill_volume' },
];

const investigationMeta: ProcessHubInvestigationMetadata = {
  processHubId: 'hub-1',
  canonicalMapVersion: '2026-04-28T10:00:00Z',
  nodeMappings,
};

function rowsForProduct(product: string, target: number, count: number, scale = 1): DataRow[] {
  const out: DataRow[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ fill_volume: target + deterministicNoise(i, scale), product });
  }
  return out;
}

describe('calculateNodeCapability — column source', () => {
  it('computes cpk for the default rule when context does not match a specific rule', () => {
    const data = rowsForProduct('Coke 12oz', 354, 50, 1.5);
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.nodeId).toBe('n-fill');
    expect(result.source).toBe('column');
    expect(result.n).toBe(50);
    expect(result.sampleConfidence).toBe('trust');
    expect(result.cpk).toBeGreaterThan(0);
    // Per-context: one entry for ('Coke 12oz' → default rule).
    expect(result.perContextResults).toHaveLength(1);
    expect(result.perContextResults?.[0]?.contextTuple).toEqual({ product: 'Coke 12oz' });
  });

  it('computes per-context cpk when contexts use different rules; node-level scalar stays undefined', () => {
    // Two products → two different SpecRules → heterogeneous specs.
    // Per spec line 148, node-level cpk/cp must NOT collapse to a single
    // number when contexts use different specs. Per-context results carry
    // the meaningful values; the dashboard renders the distribution.
    const data = [
      ...rowsForProduct('Coke 12oz', 354, 40, 1.0),
      ...rowsForProduct('Coke 16oz', 473, 40, 1.0),
    ];
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.perContextResults).toHaveLength(2);
    const products = result.perContextResults?.map(r => r.contextTuple.product).sort();
    expect(products).toEqual(['Coke 12oz', 'Coke 16oz']);
    // Each per-context cpk is meaningful (computed against that product's specs).
    for (const r of result.perContextResults ?? []) {
      expect(r.cpk).toBeGreaterThan(0);
      expect(r.sampleConfidence).toBe('trust');
    }
    // Node-level scalars deliberately undefined when contexts use different rules.
    expect(result.cpk).toBeUndefined();
    expect(result.cp).toBeUndefined();
  });

  it('populates node-level cpk when all contexts resolve to the same rule', () => {
    // Two products both fall through to the default rule (no rule for
    // "Sprite 12oz" or "Coke 12oz" — both pick the default). Same specs
    // across contexts → node-level scalar IS meaningful (worst-case across
    // homogeneous-specs contexts).
    const data = [
      ...rowsForProduct('Coke 12oz', 354, 40, 1.0),
      ...rowsForProduct('Sprite 12oz', 354, 40, 1.0),
    ];
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.perContextResults).toHaveLength(2);
    expect(result.cpk).toBeDefined();
    expect(result.cpk).toBeGreaterThan(0);
    expect(result.cp).toBeDefined();
  });

  it('honours hub-level contextColumns passed via source', () => {
    // A hub-level context column (e.g., 'shift') is declared on the hub but
    // not in any tributary or specRule. The engine must group rows by it
    // when threading hubContextColumns through the source.
    const data = [
      ...rowsForProduct('Coke 12oz', 354, 30, 1.0).map(r => ({ ...r, shift: 'A' })),
      ...rowsForProduct('Coke 12oz', 354, 30, 1.0).map(r => ({ ...r, shift: 'B' })),
    ];
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
      hubContextColumns: ['shift'],
    });
    // Both shift values resolve to the same default rule, but they form two
    // distinct context tuples.
    expect(result.perContextResults).toHaveLength(2);
    const shifts = result.perContextResults?.map(r => r.contextTuple.shift).sort();
    expect(shifts).toEqual(['A', 'B']);
    // Same rule → node-level scalar IS populated.
    expect(result.cpk).toBeDefined();
  });

  it('badges insufficient when n<10', () => {
    const data = rowsForProduct('Coke 12oz', 354, 5);
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta,
      data,
    });
    expect(result.n).toBe(5);
    expect(result.sampleConfidence).toBe('insufficient');
    expect(result.perContextResults?.[0]?.sampleConfidence).toBe('insufficient');
  });

  it('returns cpk undefined and n=0 when node has no measurementColumn mapping', () => {
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap,
      investigationMeta: {}, // no nodeMappings
      data: [{ fill_volume: 354, product: 'Coke 12oz' }],
    });
    expect(result.cpk).toBeUndefined();
    expect(result.n).toBe(0);
    expect(result.sampleConfidence).toBe('insufficient');
  });

  it('returns cpk undefined when node has no capabilityScope', () => {
    const mapWithoutScope: ProcessMap = {
      ...processMap,
      nodes: [{ id: 'n-fill', name: 'Fill', order: 0 }],
    };
    const result = calculateNodeCapability('n-fill', {
      kind: 'column',
      processMap: mapWithoutScope,
      investigationMeta,
      data: [{ fill_volume: 354, product: 'Coke 12oz' }],
    });
    expect(result.cpk).toBeUndefined();
  });
});
