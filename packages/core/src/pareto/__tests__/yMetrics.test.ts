import { describe, it, expect } from 'vitest';
import { PARETO_Y_METRICS, computeParetoY, type ParetoYMetricId } from '../yMetrics';

// ============================================================================
// Fixtures — deterministic, no Math.random, no Date.now
// ============================================================================

/** 10 rows: weight_g col with mix of finite + non-finite values */
const TEN_ROWS: ReadonlyArray<Record<string, unknown>> = [
  { cat: 'A', weight_g: 100, cost: 5, duration: 10 },
  { cat: 'A', weight_g: 102, cost: 7, duration: 8 },
  { cat: 'A', weight_g: 98, cost: 3, duration: 12 },
  { cat: 'A', weight_g: 101, cost: 4, duration: 9 },
  { cat: 'A', weight_g: 103, cost: 6, duration: 11 },
  { cat: 'A', weight_g: 99, cost: 2, duration: 7 },
  { cat: 'A', weight_g: 100, cost: 8, duration: 13 },
  { cat: 'A', weight_g: 104, cost: 9, duration: 6 },
  { cat: 'A', weight_g: 97, cost: 1, duration: 14 },
  { cat: 'A', weight_g: 96, cost: 10, duration: 5 },
];

const EMPTY: ReadonlyArray<Record<string, unknown>> = [];

const OUT_OF_SPEC_ROWS: ReadonlyArray<Record<string, unknown>> = [
  { v: 80 }, // below LSL=90
  { v: 85 }, // below LSL=90
  { v: 88 }, // below LSL=90
  { v: 91 }, // in-spec
  { v: 95 }, // in-spec
  { v: 100 }, // in-spec
  { v: 105 }, // in-spec
  { v: 109 }, // in-spec
  { v: 112 }, // above USL=110
  { v: 115 }, // above USL=110
];
// 3 below LSL=90, 2 above USL=110, 5 in-spec → 50%

/** Rows with non-finite values mixed in */
const ROWS_WITH_NAN: ReadonlyArray<Record<string, unknown>> = [
  { v: 10, cost: 5 },
  { v: NaN, cost: NaN },
  { v: 20, cost: 'bad' },
  { v: Infinity, cost: Infinity },
  { v: 30, cost: 15 },
];
// finiteValues for 'v': [10, 20, 30]; sumColumn for 'cost': 5 + 15 = 20

// ============================================================================
// 1. count
// ============================================================================

describe('computeParetoY — count', () => {
  it('returns row count for non-empty group', () => {
    expect(computeParetoY('count', TEN_ROWS, {})).toBe(10);
  });

  it('returns 0 for empty group', () => {
    expect(computeParetoY('count', EMPTY, {})).toBe(0);
  });
});

// ============================================================================
// 2. cost
// ============================================================================

describe('computeParetoY — cost', () => {
  it('sums finite cost column values', () => {
    // TEN_ROWS cost: 5+7+3+4+6+2+8+9+1+10 = 55
    expect(computeParetoY('cost', TEN_ROWS, { costColumn: 'cost' })).toBe(55);
  });

  it('skips non-finite values', () => {
    // ROWS_WITH_NAN cost: 5 + 0 (NaN) + 0 (bad string) + 0 (Infinity) + 15 = 20
    expect(computeParetoY('cost', ROWS_WITH_NAN, { costColumn: 'cost' })).toBe(20);
  });

  it('returns 0 for empty rows', () => {
    expect(computeParetoY('cost', EMPTY, { costColumn: 'cost' })).toBe(0);
  });

  it('throws when costColumn is missing from context', () => {
    expect(() => computeParetoY('cost', TEN_ROWS, {})).toThrow(
      'computeParetoY: missing context.costColumn for metric "cost"'
    );
  });
});

// ============================================================================
// 3. time
// ============================================================================

describe('computeParetoY — time', () => {
  it('sums finite duration column values', () => {
    // TEN_ROWS duration: 10+8+12+9+11+7+13+6+14+5 = 95
    expect(computeParetoY('time', TEN_ROWS, { durationColumn: 'duration' })).toBe(95);
  });

  it('skips non-finite values', () => {
    const rows: ReadonlyArray<Record<string, unknown>> = [
      { d: 5 },
      { d: NaN },
      { d: Infinity },
      { d: 10 },
    ];
    expect(computeParetoY('time', rows, { durationColumn: 'd' })).toBe(15);
  });

  it('returns 0 for empty rows', () => {
    expect(computeParetoY('time', EMPTY, { durationColumn: 'd' })).toBe(0);
  });

  it('throws when durationColumn is missing from context', () => {
    expect(() => computeParetoY('time', TEN_ROWS, {})).toThrow(
      'computeParetoY: missing context.durationColumn for metric "time"'
    );
  });
});

// ============================================================================
// 4. cycle-time
// ============================================================================

describe('computeParetoY — cycle-time', () => {
  const ROWS: ReadonlyArray<Record<string, unknown>> = [
    { ct: 30 },
    { ct: 45 },
    { ct: NaN },
    { ct: 20 },
  ];

  it('sums finite cycle-time values', () => {
    expect(computeParetoY('cycle-time', ROWS, { cycleTimeColumn: 'ct' })).toBe(95);
  });

  it('returns 0 for empty rows', () => {
    expect(computeParetoY('cycle-time', EMPTY, { cycleTimeColumn: 'ct' })).toBe(0);
  });

  it('throws when cycleTimeColumn is missing', () => {
    expect(() => computeParetoY('cycle-time', ROWS, {})).toThrow(
      'computeParetoY: missing context.cycleTimeColumn for metric "cycle-time"'
    );
  });
});

// ============================================================================
// 5. waste-time
// ============================================================================

describe('computeParetoY — waste-time', () => {
  const ROWS: ReadonlyArray<Record<string, unknown>> = [
    { wt: 5 },
    { wt: 10 },
    { wt: 'bad' },
    { wt: 3 },
  ];

  it('sums finite waste-time values', () => {
    expect(computeParetoY('waste-time', ROWS, { wasteTimeColumn: 'wt' })).toBe(18);
  });

  it('returns 0 for empty rows', () => {
    expect(computeParetoY('waste-time', EMPTY, { wasteTimeColumn: 'wt' })).toBe(0);
  });

  it('throws when wasteTimeColumn is missing', () => {
    expect(() => computeParetoY('waste-time', ROWS, {})).toThrow(
      'computeParetoY: missing context.wasteTimeColumn for metric "waste-time"'
    );
  });
});

// ============================================================================
// 6. step-duration
// ============================================================================

describe('computeParetoY — step-duration', () => {
  const ROWS: ReadonlyArray<Record<string, unknown>> = [
    { sd: 2 },
    { sd: 4 },
    { sd: Infinity },
    { sd: 6 },
  ];

  it('sums finite step-duration values', () => {
    expect(computeParetoY('step-duration', ROWS, { stepDurationColumn: 'sd' })).toBe(12);
  });

  it('returns 0 for empty rows', () => {
    expect(computeParetoY('step-duration', EMPTY, { stepDurationColumn: 'sd' })).toBe(0);
  });

  it('throws when stepDurationColumn is missing', () => {
    expect(() => computeParetoY('step-duration', ROWS, {})).toThrow(
      'computeParetoY: missing context.stepDurationColumn for metric "step-duration"'
    );
  });
});

// ============================================================================
// 7. percent-out-of-spec
// ============================================================================

describe('computeParetoY — percent-out-of-spec', () => {
  it('known fixture: 3 below LSL, 2 above USL → 50%', () => {
    const result = computeParetoY('percent-out-of-spec', OUT_OF_SPEC_ROWS, {
      outcomeColumn: 'v',
      spec: { lsl: 90, usl: 110 },
    });
    expect(result).toBeCloseTo(50, 5);
  });

  it('one-sided LSL only', () => {
    // 3 below LSL=90 out of 10 → 30%
    const result = computeParetoY('percent-out-of-spec', OUT_OF_SPEC_ROWS, {
      outcomeColumn: 'v',
      spec: { lsl: 90 },
    });
    expect(result).toBeCloseTo(30, 5);
  });

  it('one-sided USL only', () => {
    // 2 above USL=110 out of 10 → 20%
    const result = computeParetoY('percent-out-of-spec', OUT_OF_SPEC_ROWS, {
      outcomeColumn: 'v',
      spec: { usl: 110 },
    });
    expect(result).toBeCloseTo(20, 5);
  });

  it('returns 0 for empty rows', () => {
    expect(
      computeParetoY('percent-out-of-spec', EMPTY, {
        outcomeColumn: 'v',
        spec: { lsl: 90, usl: 110 },
      })
    ).toBe(0);
  });

  it('skips non-finite values from both numerator and denominator', () => {
    // rows: 80 (below), NaN (skipped), 100 (in-spec) → 1 out of 2 = 50%
    const rows: ReadonlyArray<Record<string, unknown>> = [{ v: 80 }, { v: NaN }, { v: 100 }];
    const result = computeParetoY('percent-out-of-spec', rows, {
      outcomeColumn: 'v',
      spec: { lsl: 90, usl: 110 },
    });
    expect(result).toBeCloseTo(50, 5);
  });

  it('throws when outcomeColumn is missing', () => {
    expect(() =>
      computeParetoY('percent-out-of-spec', OUT_OF_SPEC_ROWS, {
        spec: { lsl: 90, usl: 110 },
      })
    ).toThrow('computeParetoY: missing context.outcomeColumn for metric "percent-out-of-spec"');
  });

  it('throws when neither lsl nor usl is set', () => {
    expect(() =>
      computeParetoY('percent-out-of-spec', OUT_OF_SPEC_ROWS, {
        outcomeColumn: 'v',
        spec: {},
      })
    ).toThrow('context.spec must include at least one of lsl/usl');
  });
});

// ============================================================================
// 8. cpk-gap
// ============================================================================

// Deterministic fixture for Cpk computation
// Values: [10, 11, 12, 10, 11] — mean = 10.8, sample stdev (N-1)
// ssq = (10-10.8)^2 + (11-10.8)^2 + (12-10.8)^2 + (10-10.8)^2 + (11-10.8)^2
//     = 0.64 + 0.04 + 1.44 + 0.64 + 0.04 = 2.80
// sigma = sqrt(2.80 / 4) = sqrt(0.70) ≈ 0.83666
// LSL=8, USL=14
// Cpu = (14 - 10.8) / (3 * 0.83666) = 3.2 / 2.50998 ≈ 1.27490
// Cpl = (10.8 - 8) / (3 * 0.83666) = 2.8 / 2.50998 ≈ 1.11554
// Cpk = min(1.27490, 1.11554) ≈ 1.11554
const CPK_ROWS: ReadonlyArray<Record<string, unknown>> = [
  { v: 10 },
  { v: 11 },
  { v: 12 },
  { v: 10 },
  { v: 11 },
];
const CPK_SPEC = { lsl: 8, usl: 14, cpkTarget: 1.33 };
const EXPECTED_CPK = 1.11554; // see derivation above

describe('computeParetoY — cpk-gap', () => {
  it('returns max(0, cpkTarget − cpk) for known fixture', () => {
    const result = computeParetoY('cpk-gap', CPK_ROWS, {
      outcomeColumn: 'v',
      spec: CPK_SPEC,
    });
    // gap = 1.33 - 1.11554 ≈ 0.21446
    expect(result).toBeCloseTo(1.33 - EXPECTED_CPK, 3);
  });

  it('defaults cpkTarget to 1.33 when omitted', () => {
    const result = computeParetoY('cpk-gap', CPK_ROWS, {
      outcomeColumn: 'v',
      spec: { lsl: 8, usl: 14 },
    });
    expect(result).toBeCloseTo(1.33 - EXPECTED_CPK, 3);
  });

  it('returns 0 when group meets or exceeds cpkTarget', () => {
    // Use wide spec to get high Cpk
    const wideSpecRows: ReadonlyArray<Record<string, unknown>> = [
      { v: 10 },
      { v: 10 },
      { v: 10 },
      { v: 11 },
      { v: 10 },
    ];
    const result = computeParetoY('cpk-gap', wideSpecRows, {
      outcomeColumn: 'v',
      spec: { lsl: 0, usl: 20, cpkTarget: 1.33 },
    });
    expect(result).toBe(0); // gap is max(0, ...) — never negative
  });

  it('returns 0 for fewer than 2 numeric rows', () => {
    expect(
      computeParetoY('cpk-gap', [{ v: 10 }], {
        outcomeColumn: 'v',
        spec: CPK_SPEC,
      })
    ).toBe(0);
  });

  it('returns 0 for empty rows', () => {
    expect(
      computeParetoY('cpk-gap', EMPTY, {
        outcomeColumn: 'v',
        spec: CPK_SPEC,
      })
    ).toBe(0);
  });

  it('throws when outcomeColumn is missing', () => {
    expect(() => computeParetoY('cpk-gap', CPK_ROWS, { spec: CPK_SPEC })).toThrow(
      'computeParetoY: missing context.outcomeColumn for metric "cpk-gap"'
    );
  });
});

// ============================================================================
// 9. mean-minus-target
// ============================================================================

describe('computeParetoY — mean-minus-target', () => {
  it('returns |mean − target| for known fixture', () => {
    // TEN_ROWS weight_g: [100,102,98,101,103,99,100,104,97,96]
    // sum = 1000, mean = 100
    // target = 105 → |100 - 105| = 5
    const result = computeParetoY('mean-minus-target', TEN_ROWS, {
      outcomeColumn: 'weight_g',
      spec: { target: 105 },
    });
    expect(result).toBeCloseTo(5, 5);
  });

  it('returns |mean − target| when mean is above target', () => {
    const rows: ReadonlyArray<Record<string, unknown>> = [{ v: 20 }, { v: 30 }];
    // mean = 25, target = 10 → |25 - 10| = 15
    const result = computeParetoY('mean-minus-target', rows, {
      outcomeColumn: 'v',
      spec: { target: 10 },
    });
    expect(result).toBeCloseTo(15, 5);
  });

  it('skips non-finite values', () => {
    // ROWS_WITH_NAN v values: 10, NaN (skip), 20, Infinity (skip), 30
    // finite: [10, 20, 30] → mean = 20, target = 10 → |20 - 10| = 10
    const result = computeParetoY('mean-minus-target', ROWS_WITH_NAN, {
      outcomeColumn: 'v',
      spec: { target: 10 },
    });
    expect(result).toBeCloseTo(10, 5);
  });

  it('returns 0 for empty rows', () => {
    expect(
      computeParetoY('mean-minus-target', EMPTY, {
        outcomeColumn: 'v',
        spec: { target: 100 },
      })
    ).toBe(0);
  });

  it('throws when outcomeColumn is missing', () => {
    expect(() => computeParetoY('mean-minus-target', TEN_ROWS, { spec: { target: 100 } })).toThrow(
      'computeParetoY: missing context.outcomeColumn for metric "mean-minus-target"'
    );
  });

  it('throws when target is missing from spec', () => {
    expect(() =>
      computeParetoY('mean-minus-target', TEN_ROWS, {
        outcomeColumn: 'weight_g',
        spec: {},
      })
    ).toThrow('context.spec.target is required for metric "mean-minus-target"');
  });

  it('throws when spec is omitted entirely', () => {
    expect(() =>
      computeParetoY('mean-minus-target', TEN_ROWS, {
        outcomeColumn: 'weight_g',
      })
    ).toThrow('context.spec.target is required for metric "mean-minus-target"');
  });
});

// ============================================================================
// 10. cpk (raw value; smallerIsWorse)
// ============================================================================

describe('computeParetoY — cpk', () => {
  it('returns the raw Cpk value for known fixture', () => {
    const result = computeParetoY('cpk', CPK_ROWS, {
      outcomeColumn: 'v',
      spec: CPK_SPEC,
    });
    expect(result).toBeCloseTo(EXPECTED_CPK, 3);
  });

  it('returns 0 for fewer than 2 numeric rows', () => {
    expect(
      computeParetoY('cpk', [{ v: 10 }], {
        outcomeColumn: 'v',
        spec: CPK_SPEC,
      })
    ).toBe(0);
  });

  it('returns 0 for empty rows', () => {
    expect(computeParetoY('cpk', EMPTY, { outcomeColumn: 'v', spec: CPK_SPEC })).toBe(0);
  });

  it('returns a finite number — never NaN or Infinity', () => {
    const result = computeParetoY('cpk', CPK_ROWS, {
      outcomeColumn: 'v',
      spec: CPK_SPEC,
    });
    expect(Number.isFinite(result)).toBe(true);
  });

  it('throws when outcomeColumn is missing', () => {
    expect(() => computeParetoY('cpk', CPK_ROWS, { spec: CPK_SPEC })).toThrow(
      'computeParetoY: missing context.outcomeColumn for metric "cpk"'
    );
  });

  it('PARETO_Y_METRICS.cpk has smallerIsWorse = true', () => {
    expect(PARETO_Y_METRICS.cpk.smallerIsWorse).toBe(true);
  });
});

// ============================================================================
// 11. throughput
// ============================================================================

describe('computeParetoY — throughput', () => {
  it('returns count / denominator when denominator > 0', () => {
    // 10 rows, window = 5 units → 10 / 5 = 2
    expect(computeParetoY('throughput', TEN_ROWS, { throughputWindowDenominator: 5 })).toBeCloseTo(
      2,
      5
    );
  });

  it('falls back to count when denominator is absent', () => {
    expect(computeParetoY('throughput', TEN_ROWS, {})).toBe(10);
  });

  it('falls back to count when denominator is 0', () => {
    expect(computeParetoY('throughput', TEN_ROWS, { throughputWindowDenominator: 0 })).toBe(10);
  });

  it('falls back to count when denominator is negative', () => {
    expect(computeParetoY('throughput', TEN_ROWS, { throughputWindowDenominator: -1 })).toBe(10);
  });

  it('returns 0 for empty group with no denominator', () => {
    expect(computeParetoY('throughput', EMPTY, {})).toBe(0);
  });
});

// ============================================================================
// 12. Registry shape — exhaustiveness checks
// ============================================================================

const ALL_IDS = [
  'count',
  'cost',
  'time',
  'cpk-gap',
  'percent-out-of-spec',
  'mean-minus-target',
  'cpk',
  'cycle-time',
  'waste-time',
  'step-duration',
  'throughput',
] as const satisfies readonly ParetoYMetricId[];

describe('PARETO_Y_METRICS registry shape', () => {
  it('has all 11 IDs as keys', () => {
    const keys = Object.keys(PARETO_Y_METRICS);
    expect(keys).toHaveLength(11);
    for (const id of ALL_IDS) {
      expect(keys).toContain(id);
    }
  });

  it('each entry has a matching id field', () => {
    for (const id of ALL_IDS) {
      expect(PARETO_Y_METRICS[id].id).toBe(id);
    }
  });

  it('each entry has a non-empty label', () => {
    for (const id of ALL_IDS) {
      expect(typeof PARETO_Y_METRICS[id].label).toBe('string');
      expect(PARETO_Y_METRICS[id].label.length).toBeGreaterThan(0);
    }
  });

  it('label is ≤ 22 characters for all entries', () => {
    for (const id of ALL_IDS) {
      const { label } = PARETO_Y_METRICS[id];
      expect(label.length).toBeLessThanOrEqual(22);
    }
  });

  it('smallerIsWorse is only true for cpk', () => {
    for (const id of ALL_IDS) {
      if (id === 'cpk') {
        expect(PARETO_Y_METRICS[id].smallerIsWorse).toBe(true);
      } else {
        // Either undefined or false — not true
        expect(PARETO_Y_METRICS[id].smallerIsWorse).not.toBe(true);
      }
    }
  });

  it('no key drift — runtime keys match the type union', () => {
    const runtimeKeys = new Set(Object.keys(PARETO_Y_METRICS));
    for (const id of ALL_IDS) {
      expect(runtimeKeys.has(id)).toBe(true);
    }
    expect(runtimeKeys.size).toBe(ALL_IDS.length);
  });
});
