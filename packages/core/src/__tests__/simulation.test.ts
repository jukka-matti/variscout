import { describe, it, expect } from 'vitest';
import { simulateFromModel, getFactorBaselines } from '../variation';
import type { MultiRegressionResult, DataRow, FactorAdjustment } from '../types';

/**
 * Helper to build a minimal MultiRegressionResult for testing
 */
function makeModel(
  overrides: Partial<MultiRegressionResult> &
    Pick<MultiRegressionResult, 'terms' | 'coefficients' | 'intercept'>
): MultiRegressionResult {
  return {
    yColumn: 'Y',
    xColumns: [],
    n: 100,
    p: 1,
    rSquared: 0.8,
    adjustedRSquared: 0.78,
    fStatistic: 50,
    pValue: 0.001,
    isSignificant: true,
    rmse: 1.0,
    strengthRating: 'strong',
    insight: 'Test model',
    topPredictors: [],
    vifWarnings: [],
    ...overrides,
  };
}

describe('simulateFromModel', () => {
  it('returns zero shift with empty adjustments', () => {
    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.5,
          stdError: 0.3,
          tStatistic: 8,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.7,
        },
      ],
      intercept: 50,
    });

    const result = simulateFromModel(model, []);
    expect(result.meanShift).toBe(0);
    expect(result.contributions).toHaveLength(0);
  });

  it('computes continuous factor shift correctly', () => {
    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.0,
          stdError: 0.3,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.6,
        },
      ],
      intercept: 50,
    });

    const adjustments: FactorAdjustment[] = [
      { factor: 'Temp', currentValue: 100, proposedValue: 105 },
    ];

    const result = simulateFromModel(model, adjustments);
    // delta = 2.0 * (105 - 100) = 10
    expect(result.meanShift).toBeCloseTo(10, 4);
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0].factor).toBe('Temp');
    expect(result.contributions[0].delta).toBeCloseTo(10, 4);
  });

  it('computes categorical factor switch correctly', () => {
    const model = makeModel({
      terms: [
        {
          columns: ['Machine'],
          label: 'Machine_B',
          type: 'categorical',
          level: 'B',
          referenceLevel: 'A',
        },
        {
          columns: ['Machine'],
          label: 'Machine_C',
          type: 'categorical',
          level: 'C',
          referenceLevel: 'A',
        },
      ],
      coefficients: [
        {
          term: 'Machine_B',
          coefficient: 3.0,
          stdError: 0.5,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.5,
        },
        {
          term: 'Machine_C',
          coefficient: -1.5,
          stdError: 0.5,
          tStatistic: -3,
          pValue: 0.01,
          isSignificant: true,
          standardized: -0.3,
        },
      ],
      intercept: 50,
    });

    // Switch from reference level A (beta=0) to level B (beta=3.0)
    const result1 = simulateFromModel(model, [
      { factor: 'Machine', currentValue: 'A', proposedValue: 'B' },
    ]);
    expect(result1.meanShift).toBeCloseTo(3.0, 4);

    // Switch from B to C: delta = -1.5 - 3.0 = -4.5
    const result2 = simulateFromModel(model, [
      { factor: 'Machine', currentValue: 'B', proposedValue: 'C' },
    ]);
    expect(result2.meanShift).toBeCloseTo(-4.5, 4);

    // Switch from B to A (reference): delta = 0 - 3.0 = -3.0
    const result3 = simulateFromModel(model, [
      { factor: 'Machine', currentValue: 'B', proposedValue: 'A' },
    ]);
    expect(result3.meanShift).toBeCloseTo(-3.0, 4);
  });

  it('combines multiple factor adjustments', () => {
    const model = makeModel({
      terms: [
        { columns: ['Temp'], label: 'Temp', type: 'continuous' },
        {
          columns: ['Machine'],
          label: 'Machine_B',
          type: 'categorical',
          level: 'B',
          referenceLevel: 'A',
        },
      ],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.0,
          stdError: 0.3,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.6,
        },
        {
          term: 'Machine_B',
          coefficient: 3.0,
          stdError: 0.5,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.5,
        },
      ],
      intercept: 50,
    });

    const adjustments: FactorAdjustment[] = [
      { factor: 'Temp', currentValue: 100, proposedValue: 102 },
      { factor: 'Machine', currentValue: 'A', proposedValue: 'B' },
    ];

    const result = simulateFromModel(model, adjustments);
    // Temp: 2.0*(102-100)=4, Machine: 3.0-0=3, total=7
    expect(result.meanShift).toBeCloseTo(7, 4);
    expect(result.contributions).toHaveLength(2);
  });

  it('handles interaction terms when both factors adjusted', () => {
    const model = makeModel({
      terms: [
        { columns: ['Temp'], label: 'Temp', type: 'continuous' },
        { columns: ['Press'], label: 'Press', type: 'continuous' },
        { columns: ['Temp', 'Press'], label: 'Temp × Press', type: 'interaction' },
      ],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.0,
          stdError: 0.3,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.6,
        },
        {
          term: 'Press',
          coefficient: 1.0,
          stdError: 0.3,
          tStatistic: 3,
          pValue: 0.01,
          isSignificant: true,
          standardized: 0.3,
        },
        {
          term: 'Temp × Press',
          coefficient: 0.5,
          stdError: 0.2,
          tStatistic: 2.5,
          pValue: 0.02,
          isSignificant: true,
          standardized: 0.2,
        },
      ],
      intercept: 50,
    });

    const adjustments: FactorAdjustment[] = [
      { factor: 'Temp', currentValue: 100, proposedValue: 102 },
      { factor: 'Press', currentValue: 50, proposedValue: 52 },
    ];

    const result = simulateFromModel(model, adjustments);
    // Main effects: Temp = 2*(102-100)=4, Press = 1*(52-50)=2
    // Interaction: 0.5*(102*52 - 100*50) = 0.5*(5304-5000) = 0.5*304 = 152
    // Total = 4 + 2 + 152 = 158
    expect(result.contributions.length).toBeGreaterThanOrEqual(3);
    const interactionContrib = result.contributions.find(c => c.factor.includes('×'));
    expect(interactionContrib).toBeDefined();
    expect(interactionContrib!.delta).toBeCloseTo(152, 1);
  });

  it('ignores interaction terms when only one factor is adjusted', () => {
    const model = makeModel({
      terms: [
        { columns: ['Temp'], label: 'Temp', type: 'continuous' },
        { columns: ['Press'], label: 'Press', type: 'continuous' },
        { columns: ['Temp', 'Press'], label: 'Temp × Press', type: 'interaction' },
      ],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.0,
          stdError: 0.3,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.6,
        },
        {
          term: 'Press',
          coefficient: 1.0,
          stdError: 0.3,
          tStatistic: 3,
          pValue: 0.01,
          isSignificant: true,
          standardized: 0.3,
        },
        {
          term: 'Temp × Press',
          coefficient: 0.5,
          stdError: 0.2,
          tStatistic: 2.5,
          pValue: 0.02,
          isSignificant: true,
          standardized: 0.2,
        },
      ],
      intercept: 50,
    });

    // Only adjust Temp, not Press — interaction should be skipped
    const result = simulateFromModel(model, [
      { factor: 'Temp', currentValue: 100, proposedValue: 102 },
    ]);
    // Only main effect: 2*(102-100)=4
    expect(result.meanShift).toBeCloseTo(4, 4);
    expect(result.contributions).toHaveLength(1);
  });

  it('handles categorical × categorical interaction', () => {
    const model = makeModel({
      terms: [
        {
          columns: ['Machine'],
          label: 'Machine_B',
          type: 'categorical',
          level: 'B',
          referenceLevel: 'A',
        },
        {
          columns: ['Shift'],
          label: 'Shift_Night',
          type: 'categorical',
          level: 'Night',
          referenceLevel: 'Day',
        },
        { columns: ['Machine', 'Shift'], label: 'Machine_B × Shift_Night', type: 'interaction' },
      ],
      coefficients: [
        {
          term: 'Machine_B',
          coefficient: 3.0,
          stdError: 0.5,
          tStatistic: 6,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.5,
        },
        {
          term: 'Shift_Night',
          coefficient: -2.0,
          stdError: 0.5,
          tStatistic: -4,
          pValue: 0.001,
          isSignificant: true,
          standardized: -0.4,
        },
        {
          term: 'Machine_B × Shift_Night',
          coefficient: 1.5,
          stdError: 0.6,
          tStatistic: 2.5,
          pValue: 0.02,
          isSignificant: true,
          standardized: 0.2,
        },
      ],
      intercept: 50,
    });

    // Switch both: Machine A→B (dummy 0→1) and Shift Day→Night (dummy 0→1)
    const result = simulateFromModel(model, [
      { factor: 'Machine', currentValue: 'A', proposedValue: 'B' },
      { factor: 'Shift', currentValue: 'Day', proposedValue: 'Night' },
    ]);
    // Main effects: Machine = 3, Shift = -2
    // Interaction: 1.5*(1*1 - 0*0) = 1.5
    // Total = 3 + (-2) + 1.5 = 2.5
    expect(result.meanShift).toBeCloseTo(2.5, 2);
    const interactionContrib = result.contributions.find(c => c.factor.includes('×'));
    expect(interactionContrib).toBeDefined();
    expect(interactionContrib!.delta).toBeCloseTo(1.5, 2);
  });
});

describe('getFactorBaselines', () => {
  it('computes categorical mode correctly', () => {
    const data: DataRow[] = [
      { Machine: 'A', Y: 10 },
      { Machine: 'A', Y: 12 },
      { Machine: 'B', Y: 11 },
      { Machine: 'A', Y: 13 },
      { Machine: 'C', Y: 14 },
    ];

    const model = makeModel({
      terms: [
        {
          columns: ['Machine'],
          label: 'Machine_B',
          type: 'categorical',
          level: 'B',
          referenceLevel: 'A',
        },
        {
          columns: ['Machine'],
          label: 'Machine_C',
          type: 'categorical',
          level: 'C',
          referenceLevel: 'A',
        },
      ],
      coefficients: [
        {
          term: 'Machine_B',
          coefficient: 1.0,
          stdError: 0.5,
          tStatistic: 2,
          pValue: 0.05,
          isSignificant: true,
          standardized: 0.3,
        },
        {
          term: 'Machine_C',
          coefficient: 2.0,
          stdError: 0.5,
          tStatistic: 4,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.5,
        },
      ],
      intercept: 10,
    });

    const baselines = getFactorBaselines(data, model);
    expect(baselines).toHaveLength(1);
    expect(baselines[0].factor).toBe('Machine');
    expect(baselines[0].type).toBe('categorical');
    expect(baselines[0].currentValue).toBe('A'); // mode: 3 out of 5
    expect(baselines[0].levels).toEqual(['A', 'B', 'C']);
  });

  it('computes continuous mean and stdDev', () => {
    const data: DataRow[] = [
      { Temp: 100, Y: 10 },
      { Temp: 102, Y: 12 },
      { Temp: 104, Y: 14 },
      { Temp: 98, Y: 8 },
      { Temp: 106, Y: 16 },
    ];

    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 1.0,
          stdError: 0.2,
          tStatistic: 5,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.8,
        },
      ],
      intercept: -90,
    });

    const baselines = getFactorBaselines(data, model);
    expect(baselines).toHaveLength(1);
    expect(baselines[0].factor).toBe('Temp');
    expect(baselines[0].type).toBe('continuous');
    // mean = (100+102+104+98+106)/5 = 102
    expect(baselines[0].mean).toBeCloseTo(102, 4);
    expect(baselines[0].currentValue).toBeCloseTo(102, 4);
    expect(baselines[0].stdDev).toBeGreaterThan(0);
  });

  it('handles mixed model (categorical + continuous)', () => {
    const data: DataRow[] = [
      { Machine: 'A', Temp: 100, Y: 10 },
      { Machine: 'B', Temp: 102, Y: 12 },
      { Machine: 'A', Temp: 104, Y: 14 },
    ];

    const model = makeModel({
      terms: [
        {
          columns: ['Machine'],
          label: 'Machine_B',
          type: 'categorical',
          level: 'B',
          referenceLevel: 'A',
        },
        { columns: ['Temp'], label: 'Temp', type: 'continuous' },
      ],
      coefficients: [
        {
          term: 'Machine_B',
          coefficient: 1.0,
          stdError: 0.5,
          tStatistic: 2,
          pValue: 0.05,
          isSignificant: true,
          standardized: 0.3,
        },
        {
          term: 'Temp',
          coefficient: 0.5,
          stdError: 0.2,
          tStatistic: 2.5,
          pValue: 0.02,
          isSignificant: true,
          standardized: 0.5,
        },
      ],
      intercept: 0,
    });

    const baselines = getFactorBaselines(data, model);
    expect(baselines).toHaveLength(2);
    const catBaseline = baselines.find(b => b.type === 'categorical');
    const contBaseline = baselines.find(b => b.type === 'continuous');
    expect(catBaseline).toBeDefined();
    expect(contBaseline).toBeDefined();
    expect(catBaseline!.factor).toBe('Machine');
    expect(contBaseline!.factor).toBe('Temp');
  });

  it('returns empty array for empty data', () => {
    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 1.0,
          stdError: 0.2,
          tStatistic: 5,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.8,
        },
      ],
      intercept: 0,
    });

    const baselines = getFactorBaselines([], model);
    // Continuous factor with no data → skipped
    expect(baselines).toHaveLength(0);
  });

  // ==========================================================================
  // Additional edge cases
  // ==========================================================================

  it('proposed=current → meanShift=0, delta=0', () => {
    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.5,
          stdError: 0.3,
          tStatistic: 8.3,
          pValue: 0.0001,
          isSignificant: true,
          standardized: 0.8,
        },
      ],
      intercept: 10,
    });

    // Set current = proposed
    const adjustments: FactorAdjustment[] = [
      { factor: 'Temp', type: 'continuous', currentValue: 50, proposedValue: 50 },
    ];
    const result = simulateFromModel(model, adjustments);
    expect(result.meanShift).toBe(0);
  });

  it('factor not in model terms → silent skip, no shift', () => {
    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 2.0,
          stdError: 0.3,
          tStatistic: 6.7,
          pValue: 0.0001,
          isSignificant: true,
          standardized: 0.7,
        },
      ],
      intercept: 10,
    });

    // Adjust a factor that doesn't exist in the model
    const adjustments: FactorAdjustment[] = [
      { factor: 'Humidity', type: 'continuous', currentValue: 40, proposedValue: 60 },
    ];
    const result = simulateFromModel(model, adjustments);
    expect(result.meanShift).toBe(0);
    expect(result.contributions).toHaveLength(0);
  });

  it('negative interaction coefficient → negative delta', () => {
    const model = makeModel({
      terms: [
        { columns: ['A'], label: 'A', type: 'continuous' },
        { columns: ['B'], label: 'B', type: 'continuous' },
        { columns: ['A', 'B'], label: 'A × B', type: 'interaction' },
      ],
      coefficients: [
        {
          term: 'A',
          coefficient: 1.0,
          stdError: 0.1,
          tStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.5,
        },
        {
          term: 'B',
          coefficient: 1.0,
          stdError: 0.1,
          tStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.5,
        },
        {
          term: 'A × B',
          coefficient: -0.5,
          stdError: 0.1,
          tStatistic: -5,
          pValue: 0.001,
          isSignificant: true,
          standardized: -0.3,
        },
      ],
      intercept: 0,
    });

    const adjustments: FactorAdjustment[] = [
      { factor: 'A', type: 'continuous', currentValue: 1, proposedValue: 3 },
      { factor: 'B', type: 'continuous', currentValue: 1, proposedValue: 3 },
    ];
    const result = simulateFromModel(model, adjustments);
    // Main effects: +2 + +2 = +4, Interaction: -0.5 * (3*3 - 1*1) = -0.5*8 = -4
    // Total = 0
    expect(result.meanShift).toBeCloseTo(0, 5);
  });

  it('getFactorBaselines with NaN rows → NaN excluded from mean', () => {
    const data: DataRow[] = [
      { Temp: 10, Y: 1 },
      { Temp: 20, Y: 2 },
      { Temp: NaN, Y: 3 },
      { Temp: 30, Y: 4 },
    ];

    const model = makeModel({
      terms: [{ columns: ['Temp'], label: 'Temp', type: 'continuous' }],
      coefficients: [
        {
          term: 'Temp',
          coefficient: 1.0,
          stdError: 0.2,
          tStatistic: 5,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.8,
        },
      ],
      intercept: 0,
    });

    const baselines = getFactorBaselines(data, model);
    const tempBaseline = baselines.find(b => b.factor === 'Temp');
    expect(tempBaseline).toBeDefined();
    // Mean of [10, 20, 30] = 20 (NaN excluded)
    expect(tempBaseline!.currentValue).toBeCloseTo(20, 5);
  });

  it('getFactorBaselines mode tie → returns a valid level', () => {
    const data: DataRow[] = [
      { Machine: 'A', Y: 1 },
      { Machine: 'A', Y: 2 },
      { Machine: 'B', Y: 3 },
      { Machine: 'B', Y: 4 },
    ];

    const model = makeModel({
      terms: [{ columns: ['Machine'], label: 'Machine', type: 'categorical' }],
      coefficients: [
        {
          term: 'Machine_B',
          coefficient: 1.5,
          stdError: 0.3,
          tStatistic: 5,
          pValue: 0.001,
          isSignificant: true,
          standardized: 0.6,
        },
      ],
      intercept: 5,
      categoricalLevels: { Machine: ['A', 'B'] },
    });

    const baselines = getFactorBaselines(data, model);
    const machineBaseline = baselines.find(b => b.factor === 'Machine');
    expect(machineBaseline).toBeDefined();
    // With equal counts, either 'A' or 'B' is valid
    expect(['A', 'B']).toContain(machineBaseline!.currentValue);
  });
});
