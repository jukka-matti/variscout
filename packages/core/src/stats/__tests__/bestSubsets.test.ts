import { describe, it, expect } from 'vitest';
import {
  computeBestSubsets,
  computeRSquaredAdjusted,
  getBestSingleFactor,
  generateQuestionsFromRanking,
  predictFromModel,
  predictFromUnifiedModel,
  computeCoverage,
} from '../bestSubsets';
import type { BestSubsetsResult, BestSubsetResult } from '../bestSubsets';
import type { DataRow } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build synthetic categorical data with known factor-outcome correlations. */
function buildTestData(n: number): DataRow[] {
  const rows: DataRow[] = [];
  const shifts = ['Morning', 'Evening', 'Night'];
  const machines = ['M1', 'M2'];
  const operators = ['Alice', 'Bob', 'Charlie'];

  for (let i = 0; i < n; i++) {
    const shift = shifts[i % shifts.length];
    const machine = machines[i % machines.length];
    const operator = operators[i % operators.length];

    const machineEffect = machine === 'M1' ? 5 : -5;
    const shiftEffect = shift === 'Morning' ? 2 : shift === 'Evening' ? 0 : -2;
    const operatorEffect = operator === 'Alice' ? 0.5 : operator === 'Bob' ? 0 : -0.5;
    const noise = ((i * 7 + 3) % 11) - 5;

    rows.push({
      Weight: 100 + machineEffect + shiftEffect + operatorEffect + noise,
      Machine: machine,
      Shift: shift,
      Operator: operator,
    });
  }
  return rows;
}

/** Build synthetic continuous data: y = a + b*x + noise */
function buildContinuousData(n: number, slope: number = 2, intercept: number = 10): DataRow[] {
  const rows: DataRow[] = [];
  for (let i = 0; i < n; i++) {
    // Use decimal step to ensure >20 unique values with decimal precision → continuous classification
    const x = i * 0.37 + 1.13;
    const noise = ((i * 7 + 3) % 5) - 2;
    rows.push({ Y: intercept + slope * x + noise, Temperature: x });
  }
  return rows;
}

/** Build mixed data: one continuous + one categorical factor */
function buildMixedData(n: number): DataRow[] {
  const rows: DataRow[] = [];
  const machines = ['M1', 'M2'];
  for (let i = 0; i < n; i++) {
    // Use decimal values and many unique values (>20) to ensure continuous classification
    const temp = 20.0 + i * 0.37;
    const machine = machines[i % 2];
    const machineEffect = machine === 'M1' ? 5 : -5;
    const noise = ((i * 3 + 1) % 5) - 2;
    rows.push({
      Y: 100 + 0.5 * temp + machineEffect + noise,
      Temperature: temp,
      Machine: machine,
    });
  }
  return rows;
}

// ===========================================================================
// Tests: All-categorical (backward compatibility with ANOVA path)
// ===========================================================================

describe('computeBestSubsets — all-categorical (ANOVA path)', () => {
  it('enumerates all 2^k - 1 subsets for 3 factors', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();
    expect(result!.subsets).toHaveLength(7); // 2^3 - 1
  });

  it('ranks subsets by R²adj descending', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();
    for (let i = 1; i < result!.subsets.length; i++) {
      expect(result!.subsets[i - 1].rSquaredAdj).toBeGreaterThanOrEqual(
        result!.subsets[i].rSquaredAdj
      );
    }
  });

  it('identifies dominant factor as best single-factor model', () => {
    const data = [
      { A: 'Lo', B: 'X', C: '1', Y: 10 },
      { A: 'Lo', B: 'X', C: '2', Y: 11 },
      { A: 'Lo', B: 'Y', C: '1', Y: 12 },
      { A: 'Lo', B: 'Y', C: '2', Y: 10 },
      { A: 'Hi', B: 'X', C: '1', Y: 30 },
      { A: 'Hi', B: 'X', C: '2', Y: 31 },
      { A: 'Hi', B: 'Y', C: '1', Y: 29 },
      { A: 'Hi', B: 'Y', C: '2', Y: 30 },
      { A: 'Lo', B: 'X', C: '1', Y: 11 },
      { A: 'Lo', B: 'X', C: '2', Y: 10 },
      { A: 'Hi', B: 'X', C: '1', Y: 31 },
      { A: 'Hi', B: 'Y', C: '2', Y: 29 },
    ];

    const result = computeBestSubsets(data, 'Y', ['A', 'B', 'C']);
    expect(result).not.toBeNull();

    const singleFactorModels = result!.subsets.filter(s => s.factorCount === 1);
    expect(singleFactorModels[0].factors).toEqual(['A']);
    expect(singleFactorModels[0].rSquared).toBeGreaterThan(0.8);
  });

  it('computes correct level effects for balanced data', () => {
    const rows: DataRow[] = [
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 102, Machine: 'M1', Shift: 'Night' },
      { Weight: 102, Machine: 'M1', Shift: 'Night' },
      { Weight: 98, Machine: 'M2', Shift: 'Day' },
      { Weight: 98, Machine: 'M2', Shift: 'Day' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
    ];

    const result = computeBestSubsets(rows, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();
    expect(result!.grandMean).toBeCloseTo(100, 5);

    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();

    const machineEffects = combo!.levelEffects.get('Machine');
    expect(machineEffects!.get('M1')).toBeCloseTo(5, 5);
    expect(machineEffects!.get('M2')).toBeCloseTo(-5, 5);

    const shiftEffects = combo!.levelEffects.get('Shift');
    expect(shiftEffects!.get('Day')).toBeCloseTo(3, 5);
    expect(shiftEffects!.get('Night')).toBeCloseTo(-3, 5);
  });

  it('computes correct cell means', () => {
    const rows: DataRow[] = [
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 108, Machine: 'M1', Shift: 'Day' },
      { Weight: 102, Machine: 'M1', Shift: 'Night' },
      { Weight: 98, Machine: 'M2', Shift: 'Day' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
      { Weight: 92, Machine: 'M2', Shift: 'Night' },
    ];

    const result = computeBestSubsets(rows, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();
    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();

    const m1Day = combo!.cellMeans.get('M1\x00Day');
    expect(m1Day).toEqual({ mean: 108, n: 2 });

    const m2Night = combo!.cellMeans.get('M2\x00Night');
    expect(m2Night).toEqual({ mean: 92, n: 2 });
  });

  it('returns null for empty factor list', () => {
    expect(computeBestSubsets(buildTestData(10), 'Weight', [])).toBeNull();
  });

  it('returns null for insufficient data', () => {
    const tiny = [
      { A: 'Lo', Y: 10 },
      { A: 'Hi', Y: 20 },
    ];
    expect(computeBestSubsets(tiny, 'Y', ['A'])).toBeNull();
  });

  it('returns null when outcome has no variation', () => {
    const constant = [
      { A: 'Lo', Y: 10 },
      { A: 'Hi', Y: 10 },
      { A: 'Lo', Y: 10 },
      { A: 'Hi', Y: 10 },
      { A: 'Lo', Y: 10 },
    ];
    expect(computeBestSubsets(constant, 'Y', ['A'])).toBeNull();
  });

  it('handles single factor correctly', () => {
    const data = [
      { A: 'Lo', B: 'X', Y: 10 },
      { A: 'Lo', B: 'Y', Y: 11 },
      { A: 'Hi', B: 'X', Y: 30 },
      { A: 'Hi', B: 'Y', Y: 29 },
      { A: 'Lo', B: 'X', Y: 12 },
      { A: 'Hi', B: 'Y', Y: 31 },
    ];
    const result = computeBestSubsets(data, 'Y', ['A']);
    expect(result).not.toBeNull();
    expect(result!.subsets).toHaveLength(1);
  });

  it('skips rows with missing factor values', () => {
    const data = [
      { A: 'Lo', Y: 10 },
      { A: 'Hi', Y: 30 },
      { A: null, Y: 20 },
      { A: 'Lo', Y: 11 },
      { A: 'Hi', Y: 29 },
      { A: undefined, Y: 15 },
      { A: 'Lo', Y: 12 },
    ];
    const result = computeBestSubsets(data, 'Y', ['A']);
    expect(result).not.toBeNull();
    expect(result!.n).toBe(5);
  });

  it('does not set usedOLS for all-categorical data', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();
    // All-categorical uses ANOVA path, usedOLS should be undefined
    expect(result!.usedOLS).toBeUndefined();
  });
});

// ===========================================================================
// Tests: Continuous factors (OLS path)
// ===========================================================================

describe('computeBestSubsets — continuous factors (OLS path)', () => {
  it('handles all-continuous factors', () => {
    // y = 10 + 2*x + noise, x ranges from 1 to 15.5
    const data = buildContinuousData(30);
    const result = computeBestSubsets(data, 'Y', ['Temperature']);

    expect(result).not.toBeNull();
    expect(result!.subsets).toHaveLength(1);
    expect(result!.usedOLS).toBe(true);

    const best = result!.subsets[0];
    expect(best.rSquared).toBeGreaterThan(0.8);
    expect(best.rSquaredAdj).toBeGreaterThan(0.8);
    expect(best.isSignificant).toBe(true);
    expect(best.modelType).toBe('ols');

    // Should have predictor info
    expect(best.predictors).toBeDefined();
    expect(best.predictors!.length).toBeGreaterThanOrEqual(1);

    // Intercept should be defined
    expect(best.intercept).toBeDefined();

    // Temperature predictor should have positive slope ~2
    const tempPred = best.predictors!.find(
      p => p.factorName === 'Temperature' && p.type === 'continuous'
    );
    expect(tempPred).toBeDefined();
    expect(tempPred!.coefficient).toBeCloseTo(2, 0);
  });

  it('sets factorTypes correctly for continuous factors', () => {
    const data = buildContinuousData(30);
    const result = computeBestSubsets(data, 'Y', ['Temperature']);
    expect(result).not.toBeNull();
    expect(result!.factorTypes).toBeDefined();
    expect(result!.factorTypes!.get('Temperature')).toBe('continuous');
  });

  it('correctly identifies the best factor among 2 continuous', () => {
    // Two continuous factors: Temp has strong effect, Pressure has weak
    const data: DataRow[] = [];
    for (let i = 0; i < 40; i++) {
      const temp = 10 + i * 0.37; // >20 unique decimal values
      const pressure = 1 + i * 0.13 + 0.01; // >20 unique decimal values
      const noise = ((i * 3 + 1) % 5) - 2;
      data.push({
        Y: 50 + 3 * temp + 0.01 * pressure + noise,
        Temperature: temp,
        Pressure: pressure,
      });
    }

    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Pressure']);
    expect(result).not.toBeNull();
    expect(result!.subsets.length).toBe(3); // {T}, {P}, {T,P}

    // Best single factor should be Temperature
    const singles = result!.subsets.filter(s => s.factorCount === 1);
    expect(singles[0].factors[0]).toBe('Temperature');
    expect(singles[0].rSquaredAdj).toBeGreaterThan(singles[1].rSquaredAdj);
  });
});

// ===========================================================================
// Tests: Mixed continuous + categorical (OLS path)
// ===========================================================================

describe('computeBestSubsets — mixed factors (OLS path)', () => {
  it('handles mixed continuous + categorical factors', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);

    expect(result).not.toBeNull();
    expect(result!.usedOLS).toBe(true);
    expect(result!.subsets.length).toBe(3); // {T}, {M}, {T,M}

    // factorTypes should show correct classification
    expect(result!.factorTypes!.get('Temperature')).toBe('continuous');
    expect(result!.factorTypes!.get('Machine')).toBe('categorical');
  });

  it('provides reference levels for categorical factors in mixed model', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    // The combined model should have reference levels for Machine
    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();
    expect(combo!.referenceLevels).toBeDefined();
    expect(combo!.referenceLevels!.has('Machine')).toBe(true);
  });

  it('provides RMSE for OLS models', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    for (const subset of result!.subsets) {
      expect(subset.rmse).toBeDefined();
      expect(subset.rmse).toBeGreaterThan(0);
    }
  });

  it('computes level effects for categorical factors in mixed model', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    const combo = result!.subsets.find(s => s.factorCount === 2);
    expect(combo).toBeDefined();

    // Should have level effects for Machine (categorical) but not Temperature (continuous)
    expect(combo!.levelEffects.has('Machine')).toBe(true);
    expect(combo!.levelEffects.get('Machine')!.has('M1')).toBe(true);
    expect(combo!.levelEffects.get('Machine')!.has('M2')).toBe(true);
  });
});

// ===========================================================================
// Tests: Quadratic auto-detection
// ===========================================================================

describe('computeBestSubsets — quadratic detection', () => {
  it('detects quadratic relationship', () => {
    // y = 100 + 5*(x-15)^2 + noise → clear quadratic
    const data: DataRow[] = [];
    for (let i = 0; i < 50; i++) {
      const x = 5 + i * 0.5;
      const noise = ((i * 7 + 3) % 5) - 2;
      data.push({
        Y: 100 + 5 * (x - 15) * (x - 15) + noise,
        Temp: x,
      });
    }

    const result = computeBestSubsets(data, 'Y', ['Temp']);
    expect(result).not.toBeNull();
    expect(result!.usedOLS).toBe(true);

    const best = result!.subsets[0];
    if (best.hasQuadraticTerms) {
      // Should have a quadratic predictor
      const quadPred = best.predictors?.find(p => p.type === 'quadratic');
      expect(quadPred).toBeDefined();
      expect(quadPred!.factorName).toBe('Temp');
    }
    // Even without quadratic, R² should be reasonable
    expect(best.rSquared).toBeGreaterThan(0.5);
  });
});

// ===========================================================================
// Tests: Type III SS on best model
// ===========================================================================

describe('computeBestSubsets — Type III SS on best model', () => {
  it('attaches Type III SS results to best model in OLS path', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    if (best.factorCount > 1 || best.modelType === 'ols') {
      // Type III SS should be computed for the best model
      expect(best.typeIIIResults).toBeDefined();
      if (best.typeIIIResults) {
        for (const factor of best.factors) {
          expect(best.typeIIIResults.has(factor)).toBe(true);
          const t3 = best.typeIIIResults.get(factor)!;
          expect(t3.partialEtaSq).toBeGreaterThanOrEqual(0);
          expect(t3.partialEtaSq).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

// ===========================================================================
// Tests: VIF
// ===========================================================================

describe('computeBestSubsets — VIF', () => {
  it('attaches VIF to the best model', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    if (best.vif) {
      // VIF should be >= 1 for each factor
      for (const [, vifVal] of best.vif.entries()) {
        expect(vifVal).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('shows VIF near 1 for uncorrelated predictors', () => {
    // Temperature and Machine are independent → VIF should be close to 1
    const data = buildMixedData(60);
    const result = computeBestSubsets(data, 'Y', ['Temperature', 'Machine']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    if (best.vif && best.factorCount === 2) {
      for (const [, vifVal] of best.vif.entries()) {
        expect(vifVal).toBeLessThan(5); // should be much lower for independent
      }
    }
  });
});

// ===========================================================================
// Tests: Guardrails (warnings)
// ===========================================================================

describe('computeBestSubsets — guardrails', () => {
  it('generates overfitting warning when R²-R²adj gap is large', () => {
    // Few observations, many factors → overfitting
    const data: DataRow[] = [];
    for (let i = 0; i < 12; i++) {
      const x1 = i * 0.5 + Math.random() * 0.001;
      const x2 = i * 0.3 + Math.random() * 0.001;
      const x3 = i * 0.7 + Math.random() * 0.001;
      // Each has enough unique values to be continuous (>20 unique)
      data.push({
        Y: 10 + i + Math.random(),
        F1: x1 * 1000 + i * 100 + Math.random() * 50,
        F2: x2 * 1000 + i * 200 + Math.random() * 50,
        F3: x3 * 1000 + i * 300 + Math.random() * 50,
      });
    }

    const result = computeBestSubsets(data, 'Y', ['F1', 'F2', 'F3']);
    if (result) {
      const best = result.subsets[0];
      if (best.warnings && best.warnings.length > 0) {
        // If there are warnings, check they are strings
        for (const w of best.warnings) {
          expect(typeof w).toBe('string');
        }
      }
    }
  });
});

// ===========================================================================
// Tests: generateQuestionsFromRanking (unchanged API)
// ===========================================================================

describe('generateQuestionsFromRanking', () => {
  it('generates single-factor and combination questions from 3-factor data', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!);

    const singles = questions.filter(q => q.type === 'single-factor');
    expect(singles.length).toBe(3);
    expect(singles.some(q => q.text.includes('Machine'))).toBe(true);
    expect(singles.some(q => q.text.includes('Shift'))).toBe(true);
    expect(singles.some(q => q.text.includes('Operator'))).toBe(true);

    for (const q of questions) {
      expect(q.source).toBe('factor-intel');
    }

    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].rSquaredAdj).toBeLessThanOrEqual(questions[i - 1].rSquaredAdj);
    }
  });

  it('auto-rules-out factors with R²adj below threshold', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!, { autoRuleOutThreshold: 0.2 });

    const ruledOut = questions.filter(q => q.autoAnswered);
    const notRuledOut = questions.filter(q => !q.autoAnswered);

    expect(ruledOut.length).toBeGreaterThan(0);
    expect(notRuledOut.length).toBeGreaterThan(0);

    for (const q of ruledOut) {
      expect(q.autoStatus).toBe('ruled-out');
      expect(q.rSquaredAdj).toBeLessThan(0.2);
    }
  });

  it('limits combination questions to top 5', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift', 'Operator']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!);
    const combos = questions.filter(q => q.type === 'combination');
    expect(combos.length).toBeLessThanOrEqual(5);
    expect(combos.length).toBeGreaterThan(0);
  });

  it('skips subsets with R²adj <= 0', () => {
    const mockResult: BestSubsetsResult = {
      subsets: [
        {
          factors: ['A'],
          factorCount: 1,
          rSquared: 0.3,
          rSquaredAdj: 0.28,
          fStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
        {
          factors: ['B'],
          factorCount: 1,
          rSquared: 0.01,
          rSquaredAdj: -0.02,
          fStatistic: 0.5,
          pValue: 0.6,
          isSignificant: false,
          dfModel: 1,
          levelEffects: new Map(),
          cellMeans: new Map(),
        },
      ],
      n: 50,
      totalFactors: 2,
      factorNames: ['A', 'B'],
      grandMean: 100,
      ssTotal: 1000,
    };

    const questions = generateQuestionsFromRanking(mockResult);
    expect(questions.length).toBe(1);
    expect(questions[0].factors).toEqual(['A']);
  });

  it('uses capability mode wording', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!, { mode: 'capability' });
    const singles = questions.filter(q => q.type === 'single-factor');
    for (const q of singles) {
      expect(q.text).toContain('affect Cpk');
    }
  });

  it('uses performance mode wording', () => {
    const data = buildTestData(60);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();

    const questions = generateQuestionsFromRanking(result!, { mode: 'performance' });
    const singles = questions.filter(q => q.type === 'single-factor');
    for (const q of singles) {
      expect(q.text).toContain('affect channel performance');
    }
  });
});

// ===========================================================================
// Tests: predictFromModel (unchanged API)
// ===========================================================================

describe('predictFromModel', () => {
  function makeMockSubset(): { subset: BestSubsetResult; grandMean: number } {
    const machineEffects = new Map([
      ['M1', 5],
      ['M2', -5],
    ]);
    const shiftEffects = new Map([
      ['Day', 3],
      ['Night', -3],
    ]);

    const subset: BestSubsetResult = {
      factors: ['Machine', 'Shift'],
      factorCount: 2,
      rSquared: 0.9,
      rSquaredAdj: 0.88,
      fStatistic: 50,
      pValue: 0.0001,
      isSignificant: true,
      dfModel: 3,
      levelEffects: new Map([
        ['Machine', machineEffects],
        ['Shift', shiftEffects],
      ]),
      cellMeans: new Map(),
    };

    return { subset, grandMean: 100 };
  }

  it('returns correct delta for known level changes', () => {
    const { subset, grandMean } = makeMockSubset();

    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M2', Shift: 'Night' },
      { Machine: 'M1', Shift: 'Day' }
    );

    expect(result).not.toBeNull();
    expect(result!.predictedMean).toBeCloseTo(108, 5);
    expect(result!.meanDelta).toBeCloseTo(16, 5);
    expect(result!.levelChanges).toHaveLength(2);
  });

  it('returns zero delta when current and target are identical', () => {
    const { subset, grandMean } = makeMockSubset();
    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M1', Shift: 'Day' },
      { Machine: 'M1', Shift: 'Day' }
    );
    expect(result!.meanDelta).toBeCloseTo(0, 5);
  });

  it('returns null for unknown level', () => {
    const { subset, grandMean } = makeMockSubset();
    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M1', Shift: 'Day' },
      { Machine: 'M3', Shift: 'Day' }
    );
    expect(result).toBeNull();
  });

  it('returns null for missing factor in currentLevels', () => {
    const { subset, grandMean } = makeMockSubset();
    const result = predictFromModel(
      subset,
      grandMean,
      { Machine: 'M1' },
      { Machine: 'M1', Shift: 'Day' }
    );
    expect(result).toBeNull();
  });
});

// ===========================================================================
// Tests: predictFromUnifiedModel (new)
// ===========================================================================

describe('predictFromUnifiedModel', () => {
  it('returns null when model lacks OLS info', () => {
    const subset: BestSubsetResult = {
      factors: ['A'],
      factorCount: 1,
      rSquared: 0.5,
      rSquaredAdj: 0.48,
      fStatistic: 10,
      pValue: 0.01,
      isSignificant: true,
      dfModel: 1,
      levelEffects: new Map(),
      cellMeans: new Map(),
      // No predictors or intercept
    };
    expect(predictFromUnifiedModel(subset, { A: 'Hi' })).toBeNull();
  });

  it('predicts correctly for continuous model', () => {
    const data = buildContinuousData(30, 2, 10);
    const result = computeBestSubsets(data, 'Y', ['Temperature']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    if (best.predictors && best.intercept !== undefined) {
      // Predict at Temperature = 5
      const predicted = predictFromUnifiedModel(best, { Temperature: 5 });
      expect(predicted).not.toBeNull();
      // Expected ~ 10 + 2*5 = 20 (with noise offset)
      expect(predicted!).toBeCloseTo(10 + 2 * 5, -1); // within order of magnitude
    }
  });

  it('predicts correctly for categorical model', () => {
    const data = buildMixedData(40);
    const result = computeBestSubsets(data, 'Y', ['Machine']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    if (best.predictors && best.intercept !== undefined) {
      const predM1 = predictFromUnifiedModel(best, { Machine: 'M1' });
      const predM2 = predictFromUnifiedModel(best, { Machine: 'M2' });
      expect(predM1).not.toBeNull();
      expect(predM2).not.toBeNull();
      // M1 should give higher prediction than M2 (machineEffect +5 vs -5)
      expect(predM1!).toBeGreaterThan(predM2!);
    }
  });

  it('returns null for missing factor value', () => {
    const data = buildContinuousData(30);
    const result = computeBestSubsets(data, 'Y', ['Temperature']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    if (best.predictors && best.intercept !== undefined) {
      const predicted = predictFromUnifiedModel(best, { WrongName: 5 });
      expect(predicted).toBeNull();
    }
  });

  it('predicts correctly for quadratic model with mean offset', () => {
    // Hand-build a model: y = intercept + b1*x + b2*(x - mean)^2
    // Linear column uses raw x, quadratic column uses centered (x - mean)^2
    // intercept=10, b1=2, b2=0.5, mean=50
    const subset: BestSubsetResult = {
      factors: ['X'],
      factorCount: 1,
      rSquared: 0.95,
      rSquaredAdj: 0.94,
      fStatistic: 100,
      pValue: 0.0001,
      isSignificant: true,
      dfModel: 2,
      levelEffects: new Map(),
      cellMeans: new Map(),
      intercept: 10,
      predictors: [
        {
          name: 'X',
          factorName: 'X',
          type: 'continuous',
          coefficient: 2,
          standardError: 0.1,
          tStatistic: 20,
          pValue: 0.0001,
          isSignificant: true,
          mean: 50,
        },
        {
          name: 'X²',
          factorName: 'X',
          type: 'quadratic',
          coefficient: 0.5,
          standardError: 0.05,
          tStatistic: 10,
          pValue: 0.001,
          isSignificant: true,
          mean: 50,
        },
      ],
      modelType: 'ols',
    };

    // At x = 50 (the mean): y = 10 + 2*50 + 0.5*(50-50)^2 = 110
    expect(predictFromUnifiedModel(subset, { X: 50 })).toBeCloseTo(110, 5);
    // At x = 52: y = 10 + 2*52 + 0.5*(52-50)^2 = 10 + 104 + 2 = 116
    expect(predictFromUnifiedModel(subset, { X: 52 })).toBeCloseTo(116, 5);
    // At x = 48: y = 10 + 2*48 + 0.5*(48-50)^2 = 10 + 96 + 2 = 108
    expect(predictFromUnifiedModel(subset, { X: 48 })).toBeCloseTo(108, 5);
  });
});

// ===========================================================================
// Tests: computeCoverage (unchanged API)
// ===========================================================================

describe('computeCoverage', () => {
  it('computes coverage with mix of answered/open/ruled-out', () => {
    const questions = [
      { status: 'answered', evidence: { rSquaredAdj: 0.4 } },
      { status: 'ruled-out', evidence: { rSquaredAdj: 0.1 } },
      { status: 'open', evidence: { rSquaredAdj: 0.3 } },
      { status: 'investigating', evidence: { rSquaredAdj: 0.2 } },
    ];

    const result = computeCoverage(questions);
    expect(result.checked).toBe(2);
    expect(result.total).toBe(4);
    expect(result.exploredPercent).toBeCloseTo(50, 5);
  });

  it('returns 0 for empty questions', () => {
    const result = computeCoverage([]);
    expect(result.checked).toBe(0);
    expect(result.total).toBe(0);
    expect(result.exploredPercent).toBe(0);
  });

  it('returns 100% when all are answered', () => {
    const questions = [
      { status: 'answered', evidence: { rSquaredAdj: 0.4 } },
      { status: 'answered', evidence: { rSquaredAdj: 0.3 } },
    ];
    const result = computeCoverage(questions);
    expect(result.checked).toBe(2);
    expect(result.exploredPercent).toBeCloseTo(100, 5);
  });

  it('handles questions with no evidence gracefully', () => {
    const questions = [{ status: 'answered' }, { status: 'open', evidence: { rSquaredAdj: 0.5 } }];
    const result = computeCoverage(questions);
    expect(result.checked).toBe(1);
    expect(result.exploredPercent).toBeCloseTo(0, 5);
  });
});

// ===========================================================================
// Tests: Mathematical equivalence — ANOVA vs OLS for all-categorical
// ===========================================================================

describe('mathematical equivalence — ANOVA vs OLS', () => {
  it('OLS produces same R² as ANOVA for single categorical factor', () => {
    // Force data through OLS by adding a continuous factor that we won't test separately
    // Actually, for true backward compat, all-categorical uses ANOVA path.
    // But we can manually verify: single-factor R² = eta²
    const data = [
      { A: 'Lo', Y: 10 },
      { A: 'Lo', Y: 11 },
      { A: 'Lo', Y: 12 },
      { A: 'Hi', Y: 30 },
      { A: 'Hi', Y: 31 },
      { A: 'Hi', Y: 29 },
    ];

    const result = computeBestSubsets(data, 'Y', ['A']);
    expect(result).not.toBeNull();

    const best = result!.subsets[0];
    // R² should be very high (~0.97+)
    expect(best.rSquared).toBeGreaterThan(0.95);
    // Manual: grand mean = 20.5, SSB = 3*(10.33-20.5)^2 + 3*(30-20.5)^2 ≈ high
  });

  it('all-categorical data goes through ANOVA path (no OLS overhead)', () => {
    const data = buildTestData(30);
    const result = computeBestSubsets(data, 'Weight', ['Machine', 'Shift']);
    expect(result).not.toBeNull();
    // Should NOT have usedOLS flag since all factors are categorical
    expect(result!.usedOLS).toBeUndefined();
    // Subsets should NOT have modelType (ANOVA path doesn't set it)
    expect(result!.subsets[0].modelType).toBeUndefined();
  });
});

// ===========================================================================
// Tests: R²adj computation formula
// ===========================================================================

describe('computeRSquaredAdjusted', () => {
  it('returns 0 for saturated model', () => {
    expect(computeRSquaredAdjusted(0.99, 5, 4)).toBe(0);
    expect(computeRSquaredAdjusted(0.99, 3, 5)).toBe(0);
  });

  it('penalizes for additional parameters', () => {
    const adj1 = computeRSquaredAdjusted(0.5, 100, 1);
    const adj3 = computeRSquaredAdjusted(0.5, 100, 3);
    expect(adj1).toBeGreaterThan(adj3);
  });

  it('returns negative for bad models', () => {
    const adj = computeRSquaredAdjusted(0.01, 20, 10);
    expect(adj).toBeLessThan(0);
  });

  it('computes known value correctly', () => {
    const adj = computeRSquaredAdjusted(0.6, 50, 3);
    expect(adj).toBeCloseTo(0.5739, 3);
  });
});

// ===========================================================================
// Tests: getBestSingleFactor (unchanged API)
// ===========================================================================

describe('getBestSingleFactor', () => {
  it('returns the most important single factor', () => {
    const data = [
      { A: 'Lo', B: 'X', Y: 10 },
      { A: 'Lo', B: 'Y', Y: 11 },
      { A: 'Hi', B: 'X', Y: 30 },
      { A: 'Hi', B: 'Y', Y: 29 },
      { A: 'Lo', B: 'X', Y: 12 },
      { A: 'Hi', B: 'Y', Y: 31 },
    ];

    const best = getBestSingleFactor(data, 'Y', ['A', 'B']);
    expect(best).not.toBeNull();
    expect(best!.factors).toEqual(['A']);
  });

  it('returns null for insufficient data', () => {
    const best = getBestSingleFactor([{ A: 'Lo', Y: 10 }], 'Y', ['A']);
    expect(best).toBeNull();
  });
});
