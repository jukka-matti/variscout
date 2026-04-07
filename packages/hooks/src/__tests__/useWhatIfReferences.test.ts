import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { BestSubsetResult, SpecLimits } from '@variscout/core';

// Use vi.hoisted so mock references are available in the vi.mock factory (hoisted to top)
const { mockPredictFromModel } = vi.hoisted(() => ({
  mockPredictFromModel: vi.fn(),
}));

vi.mock('@variscout/core/stats', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    predictFromModel: mockPredictFromModel,
  };
});

// Import AFTER mock registration
import { useWhatIfReferences, type UseWhatIfReferencesOptions } from '../useWhatIfReferences';

// ============================================================================
// Helpers
// ============================================================================

function makeModel(
  factors: string[],
  levelEffects?: Map<string, Map<string, number>>
): BestSubsetResult {
  const effects =
    levelEffects ??
    new Map(
      factors.map(f => [
        f,
        new Map([
          ['A', 5.0],
          ['B', -5.0],
        ]),
      ])
    );

  return {
    factors,
    factorCount: factors.length,
    rSquared: 0.72,
    rSquaredAdj: 0.68,
    fStatistic: 12.5,
    pValue: 0.001,
    isSignificant: true,
    dfModel: factors.length,
    levelEffects: effects,
    cellMeans: new Map(),
  };
}

function makeModelPrediction(predictedMean: number, meanDelta: number) {
  return {
    predictedMean,
    meanDelta,
    levelChanges: [],
  };
}

/** Generate n numeric data rows */
function makeDataRows(values: number[], outcome = 'yield') {
  return values.map(v => ({ [outcome]: v }));
}

const DEFAULT_SPECS: SpecLimits = {
  usl: 120,
  lsl: 80,
};

// ============================================================================
// Tests
// ============================================================================

describe('useWhatIfReferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Always includes Current
  // --------------------------------------------------------------------------

  it('always includes a Current reference', () => {
    const opts: UseWhatIfReferencesOptions = {
      currentMean: 100,
      currentSigma: 2,
    };
    const { result } = renderHook(() => useWhatIfReferences(opts));
    const current = result.current.find(r => r.label === 'Current');
    expect(current).toBeDefined();
    expect(current!.value).toBe(100);
    expect(current!.source).toBe('empirical');
  });

  it('Current reference has no cpk when specs are absent', () => {
    const { result } = renderHook(() => useWhatIfReferences({ currentMean: 100, currentSigma: 2 }));
    const current = result.current.find(r => r.label === 'Current');
    expect(current!.cpk).toBeUndefined();
  });

  it('Current reference has cpk when specs provided', () => {
    // Cpk = min((USL-mean)/(3σ), (mean-LSL)/(3σ))
    // = min((120-100)/(6), (100-80)/(6)) = min(3.33, 3.33) = 3.33
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        specs: DEFAULT_SPECS,
      })
    );
    const current = result.current.find(r => r.label === 'Current');
    expect(current!.cpk).toBeCloseTo(3.333, 2);
  });

  it('returns only Current when no model and no data', () => {
    const { result } = renderHook(() => useWhatIfReferences({ currentMean: 100, currentSigma: 2 }));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].label).toBe('Current');
  });

  // --------------------------------------------------------------------------
  // Best performer
  // --------------------------------------------------------------------------

  it('includes Best performer when model provided with factors', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel.mockReturnValue(makeModelPrediction(108, 8));

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    expect(best).toBeDefined();
    expect(best!.source).toBe('empirical');
  });

  it('Best performer value = currentMean + meanDelta', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel.mockReturnValue(makeModelPrediction(108, 8));

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    // value = 100 + 8 = 108
    expect(best!.value).toBeCloseTo(108);
  });

  it('Best performer has cpk computed from its value when specs provided', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel.mockReturnValue(makeModelPrediction(108, 8));

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
        specs: DEFAULT_SPECS, // usl=120, lsl=80
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    // Cpk = min((120-108)/6, (108-80)/6) = min(2.0, 4.67) = 2.0
    expect(best!.cpk).toBeCloseTo(2.0, 1);
  });

  it('does not include Best performer when model has no factors', () => {
    const model = makeModel([]);
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    expect(best).toBeUndefined();
  });

  it('does not include Best performer when grandMean is undefined', () => {
    const model = makeModel(['Machine']);
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        // grandMean omitted
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    expect(best).toBeUndefined();
  });

  it('does not include Best performer when predictFromModel returns null', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel.mockReturnValue(null);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    expect(best).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Model optimum
  // --------------------------------------------------------------------------

  it('includes Model optimum when it differs materially from Best performer', () => {
    const model = makeModel(['Machine']);
    // First call: best performer prediction (meanDelta=8, predicted=108)
    // Second call: model optimum prediction (predictedMean=115)
    mockPredictFromModel
      .mockReturnValueOnce(makeModelPrediction(108, 8)) // best performer
      .mockReturnValueOnce(makeModelPrediction(115, 15)); // model optimum

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
      })
    );
    const optimum = result.current.find(r => r.label === 'Model optimum');
    expect(optimum).toBeDefined();
    expect(optimum!.source).toBe('model');
  });

  it('Model optimum value is predictedMean from model', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel
      .mockReturnValueOnce(makeModelPrediction(108, 8))
      .mockReturnValueOnce(makeModelPrediction(115, 15));

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
      })
    );
    const optimum = result.current.find(r => r.label === 'Model optimum');
    expect(optimum!.value).toBeCloseTo(115);
  });

  it('suppresses Model optimum when it is within 0.01σ of Best performer', () => {
    // Both predictions return the same value (within tolerance)
    const model = makeModel(['Machine']);
    const prediction = makeModelPrediction(108, 8);
    mockPredictFromModel.mockReturnValue(prediction);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2, // tolerance = 0.01 * 2 = 0.02
        model,
        grandMean: 100,
      })
    );
    // best = 100 + 8 = 108, optimum = 108 → |108 - 108| = 0 < 0.02 → suppress
    const optimum = result.current.find(r => r.label === 'Model optimum');
    expect(optimum).toBeUndefined();
  });

  it('Model optimum has cpk when specs provided', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel
      .mockReturnValueOnce(makeModelPrediction(108, 8))
      .mockReturnValueOnce(makeModelPrediction(115, 15));

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
        specs: DEFAULT_SPECS, // usl=120, lsl=80
      })
    );
    const optimum = result.current.find(r => r.label === 'Model optimum');
    // Cpk at 115: min((120-115)/6, (115-80)/6) = min(0.833, 5.833) = 0.833
    expect(optimum!.cpk).toBeCloseTo(0.833, 2);
  });

  // --------------------------------------------------------------------------
  // 95th percentile
  // --------------------------------------------------------------------------

  it('includes 95th percentile when data has ≥20 points', () => {
    const values = Array.from({ length: 20 }, (_, i) => 90 + i); // 90..109
    const data = makeDataRows(values);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        data,
        outcome: 'yield',
      })
    );
    const p95 = result.current.find(r => r.label === '95th percentile');
    expect(p95).toBeDefined();
    expect(p95!.source).toBe('statistical');
  });

  it('does not include 95th percentile when data has fewer than 20 points', () => {
    const values = Array.from({ length: 19 }, (_, i) => 90 + i);
    const data = makeDataRows(values);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        data,
        outcome: 'yield',
      })
    );
    const p95 = result.current.find(r => r.label === '95th percentile');
    expect(p95).toBeUndefined();
  });

  it('95th percentile value is approximately the 95th percentile of sorted data', () => {
    // 100 evenly-spaced values 0..99 → sorted → idx = floor(100 * 0.95) = 95 → value 95
    const values = Array.from({ length: 100 }, (_, i) => i);
    const data = makeDataRows(values);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 50,
        currentSigma: 5,
        data,
        outcome: 'yield',
      })
    );
    const p95 = result.current.find(r => r.label === '95th percentile');
    expect(p95!.value).toBe(95);
  });

  it('95th percentile has cpk when specs provided', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const data = makeDataRows(values);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 50,
        currentSigma: 5,
        data,
        outcome: 'yield',
        specs: DEFAULT_SPECS, // usl=120, lsl=80
      })
    );
    const p95 = result.current.find(r => r.label === '95th percentile');
    expect(p95!.cpk).toBeDefined();
    // value=95: cpk = min((120-95)/15, (95-80)/15) = min(1.67, 1.0) = 1.0
    expect(p95!.cpk).toBeCloseTo(1.0, 1);
  });

  // --------------------------------------------------------------------------
  // smaller-is-better characteristic type
  // --------------------------------------------------------------------------

  it('uses 5th percentile (lower is better) for smaller characteristic type', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const data = makeDataRows(values);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 50,
        currentSigma: 5,
        data,
        outcome: 'yield',
        specs: { characteristicType: 'smaller' },
      })
    );
    const p5 = result.current.find(r => r.label === '5th percentile');
    expect(p5).toBeDefined();
    // idx = floor(100 * 0.05) = 5 → value 5
    expect(p5!.value).toBe(5);
  });

  it('smaller-is-better: Best performer picks levels with minimum effect', () => {
    // For smaller-is-better, optimal = min effect level (B=-5, A=+5)
    // worst = max effect level (A=+5)
    const levelEffects = new Map([
      [
        'Machine',
        new Map([
          ['A', 5.0],
          ['B', -5.0],
        ]),
      ],
    ]);
    const model = makeModel(['Machine'], levelEffects);
    // predictFromModel called with worstLevels={Machine:'A'}, optimalLevels={Machine:'B'}
    mockPredictFromModel.mockReturnValue(makeModelPrediction(90, -10));

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        model,
        grandMean: 100,
        specs: { characteristicType: 'smaller' },
      })
    );
    const best = result.current.find(r => r.label === 'Best performer');
    expect(best).toBeDefined();
    // For smaller-is-better, bestMean = currentMean + meanDelta = 100 + (-10) = 90
    expect(best!.value).toBeCloseTo(90);
  });

  // --------------------------------------------------------------------------
  // Cpk edge cases
  // --------------------------------------------------------------------------

  it('cpk is undefined when sigma is zero', () => {
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 0,
        specs: DEFAULT_SPECS,
      })
    );
    const current = result.current.find(r => r.label === 'Current');
    expect(current!.cpk).toBeUndefined();
  });

  it('cpk uses only USL when LSL is absent', () => {
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        specs: { usl: 120 },
      })
    );
    const current = result.current.find(r => r.label === 'Current');
    // cpk = (120 - 100) / (3 * 2) = 20/6 ≈ 3.33
    expect(current!.cpk).toBeCloseTo(3.333, 2);
  });

  it('cpk uses only LSL when USL is absent', () => {
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        specs: { lsl: 80 },
      })
    );
    const current = result.current.find(r => r.label === 'Current');
    // cpk = (100 - 80) / (3 * 2) = 20/6 ≈ 3.33
    expect(current!.cpk).toBeCloseTo(3.333, 2);
  });

  it('cpk is undefined when both usl and lsl are undefined in specs', () => {
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        specs: {},
      })
    );
    const current = result.current.find(r => r.label === 'Current');
    expect(current!.cpk).toBeUndefined();
  });

  it('cpk can be negative when mean is outside spec limits', () => {
    // mean=130, usl=120 → cpkUsl = (120-130)/6 = -1.67
    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 130,
        currentSigma: 2,
        specs: DEFAULT_SPECS, // usl=120, lsl=80
      })
    );
    const current = result.current.find(r => r.label === 'Current');
    expect(current!.cpk).toBeCloseTo(-1.667, 2);
  });

  // --------------------------------------------------------------------------
  // Reference ordering
  // --------------------------------------------------------------------------

  it('references are in expected order: Current, Best performer, Model optimum, 95th percentile', () => {
    const model = makeModel(['Machine']);
    mockPredictFromModel
      .mockReturnValueOnce(makeModelPrediction(108, 8))
      .mockReturnValueOnce(makeModelPrediction(115, 15));

    const values = Array.from({ length: 100 }, (_, i) => i);
    const data = makeDataRows(values);

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 50,
        currentSigma: 5,
        model,
        grandMean: 50,
        specs: DEFAULT_SPECS,
        data,
        outcome: 'yield',
      })
    );

    const labels = result.current.map(r => r.label);
    expect(labels[0]).toBe('Current');
    expect(labels.indexOf('Best performer')).toBeGreaterThan(0);
    expect(labels.indexOf('Model optimum')).toBeGreaterThan(labels.indexOf('Best performer'));
    expect(labels.indexOf('95th percentile')).toBeGreaterThan(labels.indexOf('Model optimum'));
  });

  // --------------------------------------------------------------------------
  // Data with non-numeric values
  // --------------------------------------------------------------------------

  it('filters out non-finite values when computing percentiles', () => {
    const data = [
      { yield: 90 },
      { yield: 'bad' as unknown as number },
      { yield: NaN },
      ...Array.from({ length: 20 }, (_, i) => ({ yield: 91 + i })),
    ];

    const { result } = renderHook(() =>
      useWhatIfReferences({
        currentMean: 100,
        currentSigma: 2,
        data,
        outcome: 'yield',
      })
    );
    // Should not throw, 95th percentile present (21 valid values)
    const p95 = result.current.find(r => r.label === '95th percentile');
    expect(p95).toBeDefined();
    expect(Number.isFinite(p95!.value)).toBe(true);
  });
});
