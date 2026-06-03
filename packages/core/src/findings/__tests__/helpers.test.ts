import { describe, it, expect } from 'vitest';
import { computeHubEvidence, computeHubProjection, detectEvidenceClusters } from '../helpers';
import type { Hypothesis, Finding } from '../types';
import type { BestSubsetsResult, BestSubsetResult } from '../../stats/bestSubsets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<Finding> & { id: string }): Finding {
  return {
    text: 'Test finding',
    status: 'analyzing' as Finding['status'],
    evidenceType: 'data',
    comments: [],
    statusChangedAt: 1714000000000,
    investigationId: 'inv-test-001',
    context: { activeFilters: {}, cumulativeScope: null },
    createdAt: 1714000000000,
    deletedAt: null,
    ...overrides,
  } as Finding;
}

function makeHub(overrides: Partial<Hypothesis> & { id: string }): Hypothesis {
  return {
    name: 'Test hub',
    synthesis: '',
    findingIds: [],
    status: 'proposed',
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    investigationId: 'inv-test-001',
    deletedAt: null,
    ...overrides,
  };
}

function makeBestSubsetsResult(subsets: BestSubsetResult[], grandMean: number): BestSubsetsResult {
  return {
    subsets,
    n: 100,
    totalFactors: 3,
    factorNames: ['Machine', 'Shift', 'Operator'],
    grandMean,
    ssTotal: 5000,
  };
}

function makeSubset(
  factors: string[],
  rSquaredAdj: number,
  levelEffects: Map<string, Map<string, number>>,
  cellMeans?: Map<string, { mean: number; n: number }>
): BestSubsetResult {
  return {
    factors,
    factorCount: factors.length,
    rSquared: rSquaredAdj + 0.05,
    rSquaredAdj,
    fStatistic: 20,
    pValue: 0.001,
    isSignificant: true,
    dfModel: factors.length,
    levelEffects,
    cellMeans: cellMeans ?? new Map(),
  };
}

// ---------------------------------------------------------------------------
// Tests: evidence helpers (ADR-085 — factor identity from findings, not Questions)
// ---------------------------------------------------------------------------

describe('computeHubEvidence', () => {
  const bestSubsets = makeBestSubsetsResult(
    [
      makeSubset(['Shift'], 0.34, new Map()),
      makeSubset(['Head'], 0.28, new Map()),
      makeSubset(['Head', 'Shift'], 0.52, new Map()),
    ],
    50
  );

  it('uses Best Subsets R-squared-adj for combined factors (derived from finding activeFilters)', () => {
    // Findings linked to hub — their activeFilters determine factor identity
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Shift: ['Day'] }, cumulativeScope: null },
      }),
      makeFinding({ id: 'f2', context: { activeFilters: { Head: ['1'] }, cumulativeScope: null } }),
    ];
    const hub = makeHub({ id: 'h1', findingIds: ['f1', 'f2'] });

    const evidence = computeHubEvidence(hub, findings, bestSubsets);

    expect(evidence.contribution.value).toBeCloseTo(0.52);
    expect(evidence.contribution.label).toBe('R²adj');
    expect(evidence.contribution.description).toContain('52%');
  });

  it('returns zero evidence when hub has no linked findings', () => {
    const hub = makeHub({ id: 'h1', findingIds: [] });
    const evidence = computeHubEvidence(hub, [], bestSubsets);
    expect(evidence.contribution.value).toBe(0);
  });

  it('falls back to partial factor match from bestSubsets', () => {
    // Only Shift-filtered finding (subset Head+Shift still matches partially)
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'h1', findingIds: ['f1'] });

    const evidence = computeHubEvidence(hub, findings, bestSubsets);
    // Best partial match for ['Shift'] alone is the exact 0.34 subset
    expect(evidence.contribution.value).toBeCloseTo(0.34);
  });

  it('returns zero when no matching subset exists and no bestSubsets provided', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Batch: ['X'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'h1', findingIds: ['f1'] });
    const evidence = computeHubEvidence(hub, findings, null);
    expect(evidence.contribution.value).toBe(0);
  });

  it('derives factor identity from hub condition tree when present (ADR-085 F1)', () => {
    // Hub has a condition tree for Shift — overrides finding-based derivation
    const hub = makeHub({
      id: 'h1',
      findingIds: ['f1'],
      condition: { kind: 'leaf', column: 'Head', op: 'eq', value: '3' },
    });
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
      }),
    ];

    const evidence = computeHubEvidence(hub, findings, bestSubsets);
    // Hub condition says Head → exact match subset Head gives 0.28
    expect(evidence.contribution.value).toBeCloseTo(0.28);
  });
});

// ---------------------------------------------------------------------------
// Tests: computeHubProjection
// ---------------------------------------------------------------------------

describe('computeHubProjection', () => {
  it('returns projection when factors match (nominal default)', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Machine: ['M2'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f2',
        context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
      }),
    ];

    const hub = makeHub({
      id: 'hub1',
      findingIds: ['f1', 'f2'],
    });

    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
    ]);
    const shiftEffects = new Map([
      ['Day', 3],
      ['Night', -3],
    ]);
    const subset = makeSubset(
      ['Machine', 'Shift'],
      0.55,
      new Map([
        ['Machine', machineEffects],
        ['Shift', shiftEffects],
      ])
    );

    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      findings,
      bsr,
      { Machine: 'M2', Shift: 'Night' } // worst levels
    );

    expect(projection).not.toBeNull();
    expect(projection!.rSquaredAdj).toBeCloseTo(0.55, 5);
    expect(projection!.currentMean).toBeDefined();
    expect(projection!.predictedMean).toBeDefined();
    expect(projection!.predictedMeanDelta).not.toBe(0);
    expect(projection!.label).toBe('Model suggests');
    expect(projection!.levelChanges.length).toBe(2);
  });

  it('smaller-is-better: best target = level with lowest (most negative) effect', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Machine: ['M1'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'hub1', findingIds: ['f1'] });

    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
      ['M3', 0],
    ]);
    const subset = makeSubset(['Machine'], 0.4, new Map([['Machine', machineEffects]]));
    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      findings,
      bsr,
      { Machine: 'M1' },
      { characteristicType: 'smaller' }
    );

    expect(projection).not.toBeNull();
    const machineChange = projection!.levelChanges.find(lc => lc.factor === 'Machine');
    expect(machineChange).toBeDefined();
    expect(machineChange!.to).toBe('M2');
    expect(projection!.predictedMeanDelta).toBeLessThan(0);
  });

  it('larger-is-better: best target = level with highest (most positive) effect', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Machine: ['M2'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'hub1', findingIds: ['f1'] });

    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
      ['M3', 0],
    ]);
    const subset = makeSubset(['Machine'], 0.4, new Map([['Machine', machineEffects]]));
    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      findings,
      bsr,
      { Machine: 'M2' },
      { characteristicType: 'larger' }
    );

    expect(projection).not.toBeNull();
    const machineChange = projection!.levelChanges.find(lc => lc.factor === 'Machine');
    expect(machineChange).toBeDefined();
    expect(machineChange!.to).toBe('M1');
    expect(projection!.predictedMeanDelta).toBeGreaterThan(0);
  });

  it('nominal: best target = level with effect closest to zero', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Machine: ['M1'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'hub1', findingIds: ['f1'] });

    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
      ['M3', 1],
    ]);
    const subset = makeSubset(['Machine'], 0.4, new Map([['Machine', machineEffects]]));
    const bsr = makeBestSubsetsResult([subset], 100);

    const projection = computeHubProjection(
      hub,
      findings,
      bsr,
      { Machine: 'M1' },
      { characteristicType: 'nominal' }
    );

    expect(projection).not.toBeNull();
    const machineChange = projection!.levelChanges.find(lc => lc.factor === 'Machine');
    expect(machineChange).toBeDefined();
    expect(machineChange!.to).toBe('M3');
  });

  it('returns null when bestSubsetsResult is null', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Machine: ['M1'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'hub1', findingIds: ['f1'] });

    const result = computeHubProjection(hub, findings, null, { Machine: 'M1' });
    expect(result).toBeNull();
  });

  it('returns null when no factors match', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Operator: ['Alice'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'hub1', findingIds: ['f1'] });

    const subset = makeSubset(
      ['Machine'],
      0.4,
      new Map([
        [
          'Machine',
          new Map([
            ['M1', 5],
            ['M2', -5],
          ]),
        ],
      ])
    );
    const bsr = makeBestSubsetsResult([subset], 100);

    const result = computeHubProjection(hub, findings, bsr, { Operator: 'Alice' });
    expect(result).toBeNull();
  });

  it('returns null when currentWorstLevels missing for a factor', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        context: { activeFilters: { Machine: ['M1'] }, cumulativeScope: null },
      }),
    ];
    const hub = makeHub({ id: 'hub1', findingIds: ['f1'] });

    const subset = makeSubset(
      ['Machine'],
      0.4,
      new Map([
        [
          'Machine',
          new Map([
            ['M1', 5],
            ['M2', -5],
          ]),
        ],
      ])
    );
    const bsr = makeBestSubsetsResult([subset], 100);

    const result = computeHubProjection(hub, findings, bsr, {});
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: detectEvidenceClusters
// ---------------------------------------------------------------------------

describe('detectEvidenceClusters', () => {
  it('finds clusters from analyzed findings sharing a factor column', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        status: 'analyzed',
        context: { activeFilters: { Machine: ['A'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f2',
        status: 'analyzed',
        context: { activeFilters: { Machine: ['B'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f3',
        status: 'analyzed',
        context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
      }),
    ];

    const clusters = detectEvidenceClusters(findings, []);

    // Machine has 2 analyzed findings → cluster
    expect(clusters.length).toBe(1);
    expect(clusters[0].factors).toEqual(['Machine']);
    expect(clusters[0].findingIds).toContain('f1');
    expect(clusters[0].findingIds).toContain('f2');
  });

  it('excludes factors already covered by existing hubs', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        status: 'analyzed',
        context: { activeFilters: { Machine: ['A'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f2',
        status: 'analyzed',
        context: { activeFilters: { Machine: ['B'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f3',
        status: 'analyzed',
        context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f4',
        status: 'investigating',
        context: { activeFilters: { Shift: ['Day'] }, cumulativeScope: null },
      }),
    ];

    // Hub already covers Machine via f1
    const existingHubs = [makeHub({ id: 'hub1', findingIds: ['f1'] })];

    const clusters = detectEvidenceClusters(findings, existingHubs);

    // Machine is covered by hub → excluded. Shift has 2 findings → cluster
    expect(clusters.length).toBe(1);
    expect(clusters[0].factors).toEqual(['Shift']);
  });

  it('returns empty when no factor has 2+ findings', () => {
    const findings: Finding[] = [
      makeFinding({
        id: 'f1',
        status: 'analyzed',
        context: { activeFilters: { Machine: ['A'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f2',
        status: 'analyzed',
        context: { activeFilters: { Shift: ['Night'] }, cumulativeScope: null },
      }),
    ];

    const clusters = detectEvidenceClusters(findings, []);
    expect(clusters).toEqual([]);
  });

  it('groups findings by shared factor WITHOUT ranking by R² (high-R² cluster is NOT promoted to first)', () => {
    // Build two clusters where the SECOND-seen factor ('machine') would have the HIGHER R²adj
    // under the old impl (so the old sort would promote it to first). Assert order is
    // grouping-stable (first-seen), NOT R²-descending — the OLD implementation FAILS this test.
    const findings: Finding[] = [
      // 'shift' findings appear first in iteration order
      makeFinding({
        id: 'f1',
        status: 'analyzed',
        context: { activeFilters: { shift: ['Night'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f2',
        status: 'analyzed',
        context: { activeFilters: { shift: ['Day'] }, cumulativeScope: null },
      }),
      // 'machine' findings appear second — with higher R²adj under old impl
      makeFinding({
        id: 'f3',
        status: 'analyzed',
        context: { activeFilters: { machine: ['A'] }, cumulativeScope: null },
      }),
      makeFinding({
        id: 'f4',
        status: 'analyzed',
        context: { activeFilters: { machine: ['B'] }, cumulativeScope: null },
      }),
    ];

    const clusters = detectEvidenceClusters(findings, []);
    expect(clusters.length).toBe(2);
    // First-seen order: 'shift' before 'machine'
    expect(clusters.map(c => c.factors[0])).toEqual(['shift', 'machine']);
    // No rSquaredAdj on the cluster — the analyst decides relevance, not the tool
    expect(clusters[0]).not.toHaveProperty('rSquaredAdj');
  });
});
