import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { BestSubsetsResult, DataRow } from '@variscout/core';

// ============================================================================
// Mock computeBestSubsets before importing the hook
// ============================================================================

const { mockComputeBestSubsets } = vi.hoisted(() => ({
  mockComputeBestSubsets: vi.fn(),
}));

vi.mock('@variscout/core/stats', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    computeBestSubsets: mockComputeBestSubsets,
  };
});

// Import AFTER mock registration
import { useDefectEvidenceMap } from '../useDefectEvidenceMap';
import {
  extractDefectTypes,
  filterDataForType,
  checkSampleSize,
  deriveCrossTypeMatrix,
} from '../useDefectEvidenceMap';
import type { DefectTransformResult, DefectMapping } from '@variscout/core';

// ============================================================================
// Test helpers
// ============================================================================

function makeBestSubsetsResult(
  factorNames: string[],
  overrides: Partial<BestSubsetsResult> = {}
): BestSubsetsResult {
  return {
    subsets: factorNames.map(f => ({
      factors: [f],
      factorCount: 1,
      rSquared: 0.15,
      rSquaredAdj: 0.12,
      fStatistic: 5.0,
      pValue: 0.02,
      isSignificant: true,
      dfModel: 1,
      levelEffects: new Map(),
      cellMeans: new Map(),
    })),
    n: 100,
    totalFactors: factorNames.length,
    factorNames,
    grandMean: 5.0,
    ssTotal: 100,
    ...overrides,
  };
}

function makeDefectResult(data: DataRow[]): DefectTransformResult {
  return {
    data,
    outcomeColumn: 'DefectRate',
    factors: ['Machine', 'Shift'],
  };
}

function makeDefectMapping(defectTypeColumn: string = 'DefectType'): DefectMapping {
  return {
    dataShape: 'event-log',
    defectTypeColumn,
    aggregationUnit: 'batch',
  };
}

function makeRows(count: number, type: string): DataRow[] {
  return Array.from({ length: count }, (_, i) => ({
    DefectType: type,
    Machine: i % 2 === 0 ? 'A' : 'B',
    Shift: i % 3 === 0 ? 'Morning' : 'Evening',
    DefectRate: Math.random() * 10,
  }));
}

// ============================================================================
// Pure helper tests
// ============================================================================

describe('extractDefectTypes', () => {
  it('returns sorted unique type values', () => {
    const data: DataRow[] = [
      { DefectType: 'Scratch', val: 1 },
      { DefectType: 'Dent', val: 2 },
      { DefectType: 'Scratch', val: 3 },
      { DefectType: 'Crack', val: 4 },
    ];
    expect(extractDefectTypes(data, 'DefectType')).toEqual(['Crack', 'Dent', 'Scratch']);
  });

  it('ignores null and empty values', () => {
    const data: DataRow[] = [
      { DefectType: 'Scratch', val: 1 },
      { DefectType: null as unknown as string, val: 2 },
      { DefectType: '', val: 3 },
      { DefectType: 'Dent', val: 4 },
    ];
    expect(extractDefectTypes(data, 'DefectType')).toEqual(['Dent', 'Scratch']);
  });
});

describe('filterDataForType', () => {
  const data: DataRow[] = [
    { DefectType: 'Scratch', Machine: 'A', Shift: 'Morning', DefectRate: 1 },
    { DefectType: 'Dent', Machine: 'B', Shift: 'Evening', DefectRate: 2 },
    { DefectType: 'Scratch', Machine: 'B', Shift: 'Morning', DefectRate: 3 },
  ];

  it('filters to matching type only', () => {
    const result = filterDataForType(data, 'DefectType', 'Scratch', [
      'Machine',
      'Shift',
      'DefectType',
    ]);
    expect(result.filteredData).toHaveLength(2);
    expect(result.filteredData.every(r => r.DefectType === 'Scratch')).toBe(true);
  });

  it('removes defect type column from factors', () => {
    const result = filterDataForType(data, 'DefectType', 'Scratch', [
      'Machine',
      'Shift',
      'DefectType',
    ]);
    expect(result.remainingFactors).toEqual(['Machine', 'Shift']);
  });

  it('preserves factors when type column is not in factors list', () => {
    const result = filterDataForType(data, 'DefectType', 'Scratch', ['Machine', 'Shift']);
    expect(result.remainingFactors).toEqual(['Machine', 'Shift']);
  });
});

describe('checkSampleSize', () => {
  it('returns null when sufficient (exactly at threshold)', () => {
    expect(checkSampleSize(30, 3)).toBeNull();
  });

  it('returns null when above threshold', () => {
    expect(checkSampleSize(50, 3)).toBeNull();
  });

  it('returns insufficient when below threshold', () => {
    expect(checkSampleSize(5, 3)).toEqual({ have: 5, need: 30 });
  });

  it('handles zero factors', () => {
    expect(checkSampleSize(0, 0)).toBeNull();
  });

  it('returns insufficient at boundary (29 rows, 3 factors)', () => {
    expect(checkSampleSize(29, 3)).toEqual({ have: 29, need: 30 });
  });
});

describe('deriveCrossTypeMatrix', () => {
  it('returns empty map for empty cache', () => {
    const result = deriveCrossTypeMatrix(new Map());
    expect(result.size).toBe(0);
  });

  it('identifies factors significant across multiple types', () => {
    const cache = new Map<string, BestSubsetsResult>();
    cache.set(
      'Scratch',
      makeBestSubsetsResult(['Machine', 'Shift'], {
        subsets: [
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.2,
            rSquaredAdj: 0.18,
            fStatistic: 8.0,
            pValue: 0.01,
            isSignificant: true,
            dfModel: 1,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
          {
            factors: ['Shift'],
            factorCount: 1,
            rSquared: 0.08,
            rSquaredAdj: 0.06,
            fStatistic: 3.0,
            pValue: 0.1,
            isSignificant: false,
            dfModel: 1,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
        ],
      })
    );
    cache.set(
      'Dent',
      makeBestSubsetsResult(['Machine', 'Shift'], {
        subsets: [
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.15,
            rSquaredAdj: 0.12,
            fStatistic: 6.0,
            pValue: 0.02,
            isSignificant: true,
            dfModel: 1,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
          {
            factors: ['Shift'],
            factorCount: 1,
            rSquared: 0.05,
            rSquaredAdj: 0.03,
            fStatistic: 2.0,
            pValue: 0.2,
            isSignificant: false,
            dfModel: 1,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
        ],
      })
    );

    const matrix = deriveCrossTypeMatrix(cache);

    // Machine is significant in both (0.18 and 0.12, both >= 0.05)
    const machineEntry = matrix.get('Machine');
    expect(machineEntry).toBeDefined();
    expect(machineEntry!.types).toEqual(['Scratch', 'Dent']);
    expect(machineEntry!.avgRSquaredAdj).toBeCloseTo(0.15, 2);

    // Shift is significant in both (0.06 and 0.03 — 0.06 >= 0.05 but 0.03 < 0.05)
    const shiftEntry = matrix.get('Shift');
    expect(shiftEntry).toBeDefined();
    expect(shiftEntry!.types).toEqual(['Scratch']); // only Scratch passes
    expect(shiftEntry!.avgRSquaredAdj).toBeCloseTo(0.06, 2);
  });

  it('excludes factors below threshold in all types', () => {
    const cache = new Map<string, BestSubsetsResult>();
    cache.set(
      'Scratch',
      makeBestSubsetsResult(['Machine'], {
        subsets: [
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.05,
            rSquaredAdj: 0.02, // below 0.05
            fStatistic: 1.0,
            pValue: 0.3,
            isSignificant: false,
            dfModel: 1,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
        ],
      })
    );

    const matrix = deriveCrossTypeMatrix(cache);
    expect(matrix.has('Machine')).toBe(false);
  });

  it('uses custom threshold', () => {
    const cache = new Map<string, BestSubsetsResult>();
    cache.set(
      'Scratch',
      makeBestSubsetsResult(['Machine'], {
        subsets: [
          {
            factors: ['Machine'],
            factorCount: 1,
            rSquared: 0.12,
            rSquaredAdj: 0.08,
            fStatistic: 4.0,
            pValue: 0.05,
            isSignificant: true,
            dfModel: 1,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
        ],
      })
    );

    // With higher threshold, factor is excluded
    const strict = deriveCrossTypeMatrix(cache, 0.1);
    expect(strict.has('Machine')).toBe(false);

    // With lower threshold, factor is included
    const lenient = deriveCrossTypeMatrix(cache, 0.05);
    expect(lenient.has('Machine')).toBe(true);
  });

  it('ignores multi-factor subsets', () => {
    const cache = new Map<string, BestSubsetsResult>();
    cache.set(
      'Scratch',
      makeBestSubsetsResult(['Machine', 'Shift'], {
        subsets: [
          {
            factors: ['Machine', 'Shift'],
            factorCount: 2,
            rSquared: 0.5,
            rSquaredAdj: 0.45,
            fStatistic: 20.0,
            pValue: 0.001,
            isSignificant: true,
            dfModel: 2,
            levelEffects: new Map(),
            cellMeans: new Map(),
          },
        ],
      })
    );

    // No single-factor subsets, so nothing should appear
    const matrix = deriveCrossTypeMatrix(cache);
    expect(matrix.size).toBe(0);
  });
});

// ============================================================================
// Hook integration tests
// ============================================================================

describe('useDefectEvidenceMap', () => {
  const allTypesBestSubsets = makeBestSubsetsResult(['Machine', 'Shift']);
  const factors = ['Machine', 'Shift'];

  beforeEach(() => {
    mockComputeBestSubsets.mockReset();
  });

  it('returns allTypesBestSubsets for "all" view', () => {
    const defectResult = makeDefectResult(makeRows(50, 'Scratch'));
    const mapping = makeDefectMapping();

    const { result } = renderHook(() =>
      useDefectEvidenceMap(defectResult, mapping, allTypesBestSubsets, 'all', factors)
    );

    expect(result.current.bestSubsets).toBe(allTypesBestSubsets);
    expect(result.current.outcomeLabel).toBe('Defect Rate');
    expect(result.current.crossTypeMatrix).toBeNull();
    expect(result.current.insufficient).toBeNull();
  });

  it('returns null bestSubsets for cross-type view', () => {
    const defectResult = makeDefectResult(makeRows(50, 'Scratch'));
    const mapping = makeDefectMapping();

    const { result } = renderHook(() =>
      useDefectEvidenceMap(defectResult, mapping, allTypesBestSubsets, 'cross-type', factors)
    );

    expect(result.current.bestSubsets).toBeNull();
    expect(result.current.outcomeLabel).toBe('Cross-Type Comparison');
  });

  it('computes per-type result for specific type view', async () => {
    const rows = [...makeRows(50, 'Scratch'), ...makeRows(50, 'Dent')];
    const defectResult = makeDefectResult(rows);
    const mapping = makeDefectMapping();

    const perTypeResult = makeBestSubsetsResult(['Machine', 'Shift']);
    mockComputeBestSubsets.mockReturnValue(perTypeResult);

    const { result } = renderHook(() =>
      useDefectEvidenceMap(defectResult, mapping, allTypesBestSubsets, 'Scratch', factors)
    );

    // Wait for microtask computation
    await waitFor(() => {
      expect(result.current.isComputing).toBe(false);
    });

    expect(mockComputeBestSubsets).toHaveBeenCalledTimes(1);
    expect(result.current.bestSubsets).toBe(perTypeResult);
    expect(result.current.outcomeLabel).toBe('Scratch Rate');
  });

  it('returns insufficient when sample size is too small', async () => {
    const rows = [...makeRows(3, 'Scratch'), ...makeRows(50, 'Dent')];
    const defectResult = makeDefectResult(rows);
    const mapping = makeDefectMapping();

    const { result } = renderHook(() =>
      useDefectEvidenceMap(defectResult, mapping, allTypesBestSubsets, 'Scratch', factors)
    );

    // Should immediately show insufficient (no async needed)
    await waitFor(() => {
      expect(result.current.insufficient).not.toBeNull();
    });

    expect(result.current.insufficient).toEqual({ have: 3, need: 20 });
    expect(result.current.bestSubsets).toBeNull();
    expect(mockComputeBestSubsets).not.toHaveBeenCalled();
  });

  it('extracts totalTypes from defect result', () => {
    const rows = [...makeRows(10, 'Scratch'), ...makeRows(10, 'Dent'), ...makeRows(10, 'Crack')];
    const defectResult = makeDefectResult(rows);
    const mapping = makeDefectMapping();

    const { result } = renderHook(() =>
      useDefectEvidenceMap(defectResult, mapping, allTypesBestSubsets, 'all', factors)
    );

    expect(result.current.totalTypes).toEqual(['Crack', 'Dent', 'Scratch']);
  });

  it('returns empty results when defectResult is null', () => {
    const mapping = makeDefectMapping();

    const { result } = renderHook(() => useDefectEvidenceMap(null, mapping, null, 'all', factors));

    expect(result.current.bestSubsets).toBeNull();
    expect(result.current.totalTypes).toEqual([]);
    expect(result.current.analyzedTypes).toEqual([]);
  });
});
