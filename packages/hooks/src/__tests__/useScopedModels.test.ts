import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { BestSubsetResult, BestSubsetsResult } from '@variscout/core';

// Use vi.hoisted so mock references are available in the vi.mock factory (hoisted to top)
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
import { useScopedModels } from '../useScopedModels';

// ============================================================================
// Helpers
// ============================================================================

function makeBestSubsetResult(
  factors: string[],
  levelEffects?: Map<string, Map<string, number>>
): BestSubsetResult {
  const effects =
    levelEffects ??
    new Map(
      factors.map(f => [
        f,
        new Map([
          ['A', 2.0],
          ['B', -2.0],
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

function makeBestSubsetsResult(factors: string[], n: number = 50): BestSubsetsResult {
  return {
    subsets: [makeBestSubsetResult(factors)],
    n,
    totalFactors: factors.length,
    factorNames: factors,
    grandMean: 100,
    ssTotal: 1000,
  };
}

/** Generate n data rows with the given factor columns */
function makeData(
  n: number,
  factorCols: Record<string, (string | number)[]>,
  outcomeName = 'yield',
  baseOutcome = 100
) {
  const colKeys = Object.keys(factorCols);
  return Array.from({ length: n }, (_, i) => {
    const row: Record<string, string | number> = {
      [outcomeName]: baseOutcome + i * 0.1,
    };
    for (const col of colKeys) {
      const vals = factorCols[col];
      row[col] = vals[i % vals.length];
    }
    return row;
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('useScopedModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Machine', 'Operator']));
  });

  it('returns null globalScope when data is empty', () => {
    const { result } = renderHook(() => useScopedModels([], 'yield', ['Machine', 'Operator'], {}));
    expect(result.current.globalScope).toBeNull();
    expect(result.current.filteredScope).toBeNull();
    expect(result.current.availableScopes).toHaveLength(0);
    expect(result.current.activeScope).toBeNull();
  });

  it('returns null globalScope when outcome is empty string', () => {
    const data = makeData(30, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, '', ['Machine'], {}));
    expect(result.current.globalScope).toBeNull();
  });

  it('returns null globalScope when factors array is empty', () => {
    const data = makeData(30, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, 'yield', [], {}));
    expect(result.current.globalScope).toBeNull();
  });

  it('computes globalScope when valid data provided', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], {})
    );
    expect(result.current.globalScope).not.toBeNull();
    expect(result.current.globalScope?.id).toBe('global');
    expect(result.current.globalScope?.label).toBe('All data');
    expect(result.current.globalScope?.n).toBe(50);
    expect(result.current.globalScope?.filters).toEqual({});
  });

  it('calls computeBestSubsets with correct arguments for global scope', () => {
    const data = makeData(30, { Machine: ['A', 'B'] });
    renderHook(() => useScopedModels(data, 'yield', ['Machine'], {}));
    expect(mockComputeBestSubsets).toHaveBeenCalledWith(data, 'yield', ['Machine']);
  });

  it('returns null globalScope when computeBestSubsets returns null', () => {
    mockComputeBestSubsets.mockReturnValue(null);
    const data = makeData(30, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, 'yield', ['Machine'], {}));
    expect(result.current.globalScope).toBeNull();
  });

  it('returns null globalScope when computeBestSubsets returns empty subsets', () => {
    mockComputeBestSubsets.mockReturnValue({
      subsets: [],
      n: 30,
      totalFactors: 1,
      factorNames: ['Machine'],
      grandMean: 100,
      ssTotal: 500,
    });
    const data = makeData(30, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, 'yield', ['Machine'], {}));
    expect(result.current.globalScope).toBeNull();
  });

  it('returns null filteredScope when no filters active', () => {
    const data = makeData(50, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, 'yield', ['Machine'], {}));
    expect(result.current.filteredScope).toBeNull();
    expect(result.current.filteredTooSmall).toBe(false);
  });

  it('returns null filteredScope when filters have empty arrays', () => {
    const data = makeData(50, { Machine: ['A', 'B'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine'], { Machine: [] })
    );
    expect(result.current.filteredScope).toBeNull();
    expect(result.current.filteredTooSmall).toBe(false);
  });

  it('computes filteredScope when filters active and n is sufficient', () => {
    // 50 rows, half match Machine=A → 25 rows, above min(20, 3*1=3)
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Operator']));

    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], { Machine: ['A'] })
    );
    expect(result.current.filteredScope).not.toBeNull();
    expect(result.current.filteredScope?.filters).toEqual({ Machine: ['A'] });
    expect(result.current.filteredTooSmall).toBe(false);
  });

  it('filteredScope label reflects active filters', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Operator']));

    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], { Machine: ['A'] })
    );
    expect(result.current.filteredScope?.label).toBe('Machine=A');
  });

  it('returns filteredTooSmall=true when filtered n is below threshold', () => {
    // 10 rows total, Machine=A gives 5 rows → below MIN_ABSOLUTE=20
    const data = makeData(10, { Machine: ['A', 'B'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine'], { Machine: ['A'] })
    );
    expect(result.current.filteredScope).toBeNull();
    expect(result.current.filteredTooSmall).toBe(true);
  });

  it('threshold scales with factor count: 3×factors > 20 triggers tooSmall', () => {
    // 3 factors → minN = max(20, 3*3) = 20
    // 4 factors → minN = max(20, 3*4) = 20
    // 7 factors → minN = max(20, 3*7) = 21
    // With 7 factors and filtered n=20, should be tooSmall
    const factorCols: Record<string, (string | number)[]> = {};
    const factorNames: string[] = [];
    for (let i = 0; i < 7; i++) {
      factorCols[`F${i}`] = ['A', 'B'];
      factorNames.push(`F${i}`);
    }
    // 42 rows total, Machine=A yields 21 → but we need to test threshold
    // Create 40 rows: filter F0=A gives 20 rows, minN = max(20, 21) = 21 → tooSmall
    const data = makeData(40, factorCols);
    const { result } = renderHook(() => useScopedModels(data, 'yield', factorNames, { F0: ['A'] }));
    // 20 filtered rows < 21 required → tooSmall
    expect(result.current.filteredTooSmall).toBe(true);
    expect(result.current.filteredScope).toBeNull();
  });

  it('excludes filter factor from scoped model factors (constant in scope)', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Operator']));

    renderHook(() => useScopedModels(data, 'yield', ['Machine', 'Operator'], { Machine: ['A'] }));

    // computeBestSubsets should be called without Machine (it's filtered to single value)
    // First call is global (with all factors), second call is filtered (without Machine)
    const calls = mockComputeBestSubsets.mock.calls;
    const filteredCall = calls.find((c: unknown[]) => {
      const factors = c[2] as string[];
      return !factors.includes('Machine');
    });
    expect(filteredCall).toBeDefined();
    expect(filteredCall![2]).not.toContain('Machine');
    expect(filteredCall![2]).toContain('Operator');
  });

  it('does not exclude filter factor when multiple values selected', () => {
    const data = makeData(50, { Machine: ['A', 'B', 'C'], Operator: ['X', 'Y'] });
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Machine', 'Operator']));

    renderHook(() =>
      // Machine filtered to 2 values — should stay in scope factors
      useScopedModels(data, 'yield', ['Machine', 'Operator'], { Machine: ['A', 'B'] })
    );

    const calls = mockComputeBestSubsets.mock.calls;
    const filteredCall = calls.find((c: unknown[]) => {
      const factors = c[2] as string[];
      return factors.includes('Machine');
    });
    expect(filteredCall).toBeDefined();
  });

  it('returns null filteredScope when all factors are filtered out', () => {
    // Only one factor, and it is the filter factor → scopeFactors empty
    const data = makeData(50, { Machine: ['A', 'B'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine'], { Machine: ['A'] })
    );
    expect(result.current.filteredScope).toBeNull();
    expect(result.current.filteredTooSmall).toBe(false);
  });

  it('availableScopes contains only global when no valid filtered scope', () => {
    const data = makeData(50, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, 'yield', ['Machine'], {}));
    expect(result.current.availableScopes).toHaveLength(1);
    expect(result.current.availableScopes[0].id).toBe('global');
  });

  it('availableScopes contains global and filtered when both valid', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Operator']));

    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], { Machine: ['A'] })
    );
    expect(result.current.availableScopes).toHaveLength(2);
    expect(result.current.availableScopes[0].id).toBe('global');
  });

  it('activeScope defaults to globalScope', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], {})
    );
    expect(result.current.activeScope).toBe(result.current.globalScope);
  });

  it('setActiveScope switches activeScope to filteredScope when id matches', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Operator']));

    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], { Machine: ['A'] })
    );

    const filteredId = result.current.filteredScope?.id;
    expect(filteredId).toBeDefined();

    act(() => {
      result.current.setActiveScope(filteredId!);
    });

    expect(result.current.activeScope).toBe(result.current.filteredScope);
  });

  it('setActiveScope falls back to globalScope for unknown id', () => {
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], {})
    );

    act(() => {
      result.current.setActiveScope('unknown-scope-id');
    });

    expect(result.current.activeScope).toBe(result.current.globalScope);
  });

  it('caches globalScope — does not recompute when data reference unchanged', () => {
    const data = makeData(50, { Machine: ['A', 'B'] });
    const { result, rerender } = renderHook(
      ({ filters }: { filters: Record<string, (string | number)[]> }) =>
        useScopedModels(data, 'yield', ['Machine'], filters),
      { initialProps: { filters: {} } }
    );

    const firstGlobalScope = result.current.globalScope;
    const callCountAfterFirst = mockComputeBestSubsets.mock.calls.length;

    // Rerender with same data — global scope should not recompute
    rerender({ filters: {} });

    // computeBestSubsets call count should not have increased for global
    expect(mockComputeBestSubsets.mock.calls.length).toBe(callCountAfterFirst);
    expect(result.current.globalScope).toBe(firstGlobalScope);
  });

  it('globalScope stores rSquaredAdj from model', () => {
    const customResult = makeBestSubsetsResult(['Machine']);
    customResult.subsets[0].rSquaredAdj = 0.85;
    mockComputeBestSubsets.mockReturnValue(customResult);

    const data = makeData(50, { Machine: ['A', 'B'] });
    const { result } = renderHook(() => useScopedModels(data, 'yield', ['Machine'], {}));
    expect(result.current.globalScope?.rSquaredAdj).toBeCloseTo(0.85);
  });

  it('globalScope.factors reflects model factors', () => {
    mockComputeBestSubsets.mockReturnValue(makeBestSubsetsResult(['Machine', 'Operator']));
    const data = makeData(50, { Machine: ['A', 'B'], Operator: ['X', 'Y'] });
    const { result } = renderHook(() =>
      useScopedModels(data, 'yield', ['Machine', 'Operator'], {})
    );
    expect(result.current.globalScope?.factors).toEqual(['Machine', 'Operator']);
  });
});
