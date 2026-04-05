import { describe, it, expect } from 'vitest';
import { buildDesignMatrix } from '../designMatrix';
import type { DataRow } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a column from the column-major X matrix as a plain Array. */
function col(X: Float64Array[], colIdx: number): number[] {
  return Array.from(X[colIdx]);
}

// ---------------------------------------------------------------------------
// Intercept and basic structure
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — structure', () => {
  it('includes intercept as column 0 (all 1s)', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(col(result.X, 0)).toEqual([1, 1]);
  });

  it('returns correct n and p for a single continuous factor', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.n).toBe(3);
    expect(result.p).toBe(2); // intercept + x
    expect(result.X.length).toBe(2);
    expect(result.y.length).toBe(3);
  });

  it('returns validIndices matching included rows', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.validIndices).toEqual([0, 1]);
  });

  it('returns empty result when no valid rows', () => {
    const data: DataRow[] = [{ x: 'bad', y: 10 }];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.n).toBe(0);
    expect(result.validIndices).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Continuous factors — raw values and centering
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — continuous factors', () => {
  const data: DataRow[] = [
    { temp: 10, yield: 5 },
    { temp: 20, yield: 8 },
    { temp: 30, yield: 13 },
  ];

  it('stores raw values in the linear column', () => {
    const result = buildDesignMatrix(data, 'yield', [{ name: 'temp', type: 'continuous' }]);
    expect(col(result.X, 1)).toEqual([10, 20, 30]);
  });

  it('stores the factor mean in the encoding', () => {
    const result = buildDesignMatrix(data, 'yield', [{ name: 'temp', type: 'continuous' }]);
    expect(result.encodings[0].mean).toBeCloseTo(20, 10);
  });

  it('fills y with outcome values', () => {
    const result = buildDesignMatrix(data, 'yield', [{ name: 'temp', type: 'continuous' }]);
    expect(Array.from(result.y)).toEqual([5, 8, 13]);
  });
});

// ---------------------------------------------------------------------------
// Quadratic term
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — quadratic terms', () => {
  const data: DataRow[] = [
    { temp: 10, yield: 5 },
    { temp: 20, yield: 8 }, // mean = 20
    { temp: 30, yield: 13 },
  ];

  it('adds a quadratic column when includeQuadratic is true', () => {
    const result = buildDesignMatrix(data, 'yield', [
      { name: 'temp', type: 'continuous', includeQuadratic: true },
    ]);
    // p should be: 1 (intercept) + 2 (linear + quadratic) = 3
    expect(result.p).toBe(3);
  });

  it('stores (x - mean)² in the quadratic column', () => {
    const result = buildDesignMatrix(data, 'yield', [
      { name: 'temp', type: 'continuous', includeQuadratic: true },
    ]);
    const mean = result.encodings[0].mean as number; // 20
    const expectedQuad = [(10 - mean) ** 2, (20 - mean) ** 2, (30 - mean) ** 2];
    const quadColIdx = result.encodings[0].quadraticIndex as number;
    expect(col(result.X, quadColIdx)).toEqual(expectedQuad);
  });

  it('sets quadraticIndex on the encoding', () => {
    const result = buildDesignMatrix(data, 'yield', [
      { name: 'temp', type: 'continuous', includeQuadratic: true },
    ]);
    expect(result.encodings[0].quadraticIndex).toBe(2);
  });

  it('columnIndices contains both linear and quadratic indices', () => {
    const result = buildDesignMatrix(data, 'yield', [
      { name: 'temp', type: 'continuous', includeQuadratic: true },
    ]);
    expect(result.encodings[0].columnIndices).toEqual([1, 2]);
  });
});

// ---------------------------------------------------------------------------
// Categorical factors — reference coding
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — categorical factors', () => {
  it('creates k-1 indicator columns', () => {
    // 3 levels → 2 indicator columns
    const data: DataRow[] = [
      { machine: 'A', output: 10 },
      { machine: 'B', output: 12 },
      { machine: 'C', output: 14 },
      { machine: 'A', output: 11 },
    ];
    const result = buildDesignMatrix(data, 'output', [{ name: 'machine', type: 'categorical' }]);
    // p = 1 (intercept) + 2 (B and C, or whichever two are non-reference)
    expect(result.p).toBe(3);
    expect(result.encodings[0].columnIndices.length).toBe(2);
  });

  it('picks most frequent level as reference', () => {
    const data: DataRow[] = [
      { machine: 'A', output: 10 },
      { machine: 'A', output: 11 }, // A appears twice → reference
      { machine: 'B', output: 12 },
      { machine: 'C', output: 14 },
    ];
    const result = buildDesignMatrix(data, 'output', [{ name: 'machine', type: 'categorical' }]);
    expect(result.encodings[0].referenceLevel).toBe('A');
  });

  it('reference row has all zeros for that factor columns', () => {
    const data: DataRow[] = [
      { machine: 'A', output: 10 },
      { machine: 'A', output: 11 },
      { machine: 'B', output: 12 },
      { machine: 'C', output: 14 },
    ];
    const result = buildDesignMatrix(data, 'output', [{ name: 'machine', type: 'categorical' }]);
    const enc = result.encodings[0];
    // Rows 0 and 1 are both 'A' (reference) — their indicator columns should be 0
    for (const colIdx of enc.columnIndices) {
      expect(result.X[colIdx][0]).toBe(0);
      expect(result.X[colIdx][1]).toBe(0);
    }
  });

  it('non-reference rows have exactly one 1 in indicator columns', () => {
    const data: DataRow[] = [
      { machine: 'A', output: 10 },
      { machine: 'A', output: 11 },
      { machine: 'B', output: 12 },
      { machine: 'C', output: 14 },
    ];
    const result = buildDesignMatrix(data, 'output', [{ name: 'machine', type: 'categorical' }]);
    const enc = result.encodings[0];
    const n = result.n;
    for (let ri = 2; ri < n; ri++) {
      const sum = enc.columnIndices.reduce((s, ci) => s + result.X[ci][ri], 0);
      expect(sum).toBe(1);
    }
  });

  it('includes all levels (sorted) in encoding.levels', () => {
    const data: DataRow[] = [
      { machine: 'C', output: 14 },
      { machine: 'A', output: 10 },
      { machine: 'B', output: 12 },
    ];
    const result = buildDesignMatrix(data, 'output', [{ name: 'machine', type: 'categorical' }]);
    expect(result.encodings[0].levels).toEqual(['A', 'B', 'C']);
  });

  it('encodes numeric-valued categorical columns as strings', () => {
    // e.g., operator IDs stored as numbers
    const data: DataRow[] = [
      { op: 1, output: 10 },
      { op: 2, output: 12 },
      { op: 1, output: 11 },
    ];
    const result = buildDesignMatrix(data, 'output', [{ name: 'op', type: 'categorical' }]);
    expect(result.encodings[0].levels).toEqual(['1', '2']);
  });
});

// ---------------------------------------------------------------------------
// Missing value handling
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — missing value handling', () => {
  it('excludes rows with missing outcome', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: 2, y: undefined }, // missing
      { x: 3, y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.n).toBe(2);
    expect(result.validIndices).toEqual([0, 2]);
  });

  it('excludes rows with non-numeric outcome string', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: 2, y: 'N/A' as unknown as number },
      { x: 3, y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.n).toBe(2);
  });

  it('excludes rows with missing continuous factor', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: undefined, y: 20 }, // missing x
      { x: 3, y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.n).toBe(2);
    expect(result.validIndices).toEqual([0, 2]);
  });

  it('excludes rows with null categorical factor', () => {
    const data: DataRow[] = [
      { cat: 'A', y: 10 },
      { cat: null, y: 20 },
      { cat: 'B', y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'cat', type: 'categorical' }]);
    expect(result.n).toBe(2);
    expect(result.validIndices).toEqual([0, 2]);
  });

  it('excludes rows with undefined categorical factor', () => {
    const data: DataRow[] = [
      { cat: 'A', y: 10 },
      { y: 20 }, // cat absent
      { cat: 'B', y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'cat', type: 'categorical' }]);
    expect(result.n).toBe(2);
    expect(result.validIndices).toEqual([0, 2]);
  });

  it('correctly re-indexes valid rows after exclusions', () => {
    const data: DataRow[] = [
      { x: 1, y: 10 },
      { x: undefined, y: 20 },
      { x: 3, y: 30 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    // y values should come from rows 0 and 2
    expect(Array.from(result.y)).toEqual([10, 30]);
    expect(col(result.X, 1)).toEqual([1, 3]);
  });
});

// ---------------------------------------------------------------------------
// Multiple factors
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — multiple factors', () => {
  it('assigns non-overlapping column indices for multiple factors', () => {
    // Factor 1: categorical (2 levels → 1 indicator col)
    // Factor 2: continuous (1 col)
    // Total: intercept(1) + cat(1) + cont(1) = 3
    const data: DataRow[] = [
      { cat: 'A', cont: 1, y: 10 },
      { cat: 'B', cont: 2, y: 12 },
      { cat: 'A', cont: 3, y: 8 },
    ];
    const result = buildDesignMatrix(data, 'y', [
      { name: 'cat', type: 'categorical' },
      { name: 'cont', type: 'continuous' },
    ]);
    expect(result.p).toBe(3);
    const catIndices = result.encodings[0].columnIndices;
    const contIndices = result.encodings[1].columnIndices;
    // No overlap
    const allIndices = [...catIndices, ...contIndices];
    expect(new Set(allIndices).size).toBe(allIndices.length);
    // None equal 0 (intercept)
    expect(allIndices.every(i => i !== 0)).toBe(true);
  });

  it('handles categorical + continuous + quadratic together', () => {
    // intercept(1) + cat 3-level(2) + cont linear(1) + cont quad(1) = 5
    const data: DataRow[] = [
      { cat: 'A', temp: 10, y: 5 },
      { cat: 'B', temp: 20, y: 8 },
      { cat: 'C', temp: 30, y: 13 },
    ];
    const result = buildDesignMatrix(data, 'y', [
      { name: 'cat', type: 'categorical' },
      { name: 'temp', type: 'continuous', includeQuadratic: true },
    ]);
    expect(result.p).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('buildDesignMatrix — edge cases', () => {
  it('handles a single-level categorical factor (no indicator columns)', () => {
    // Only one level → no non-reference levels → 0 indicator columns
    const data: DataRow[] = [
      { cat: 'A', y: 10 },
      { cat: 'A', y: 12 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'cat', type: 'categorical' }]);
    expect(result.p).toBe(1); // intercept only
    expect(result.encodings[0].columnIndices).toEqual([]);
  });

  it('handles empty data array', () => {
    const result = buildDesignMatrix([], 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.n).toBe(0);
    expect(result.p).toBe(2);
    expect(result.X[0].length).toBe(0);
    expect(result.y.length).toBe(0);
    expect(result.validIndices).toEqual([]);
  });

  it('handles no factors — intercept-only model', () => {
    const data: DataRow[] = [{ y: 10 }, { y: 20 }];
    const result = buildDesignMatrix(data, 'y', []);
    expect(result.p).toBe(1);
    expect(result.n).toBe(2);
    expect(col(result.X, 0)).toEqual([1, 1]);
  });

  it('tie-breaking in reference level selection uses alphabetical order', () => {
    // A and B both appear once → 'A' wins (alphabetically earlier)
    const data: DataRow[] = [
      { cat: 'A', y: 10 },
      { cat: 'B', y: 12 },
    ];
    const result = buildDesignMatrix(data, 'y', [{ name: 'cat', type: 'categorical' }]);
    expect(result.encodings[0].referenceLevel).toBe('A');
  });

  it('Float64Array used for X columns and y', () => {
    const data: DataRow[] = [{ x: 1, y: 2 }];
    const result = buildDesignMatrix(data, 'y', [{ name: 'x', type: 'continuous' }]);
    expect(result.X[0]).toBeInstanceOf(Float64Array);
    expect(result.y).toBeInstanceOf(Float64Array);
  });
});
