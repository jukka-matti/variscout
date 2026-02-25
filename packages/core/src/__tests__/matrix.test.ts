import { describe, it, expect } from 'vitest';
import {
  transpose,
  multiply,
  multiplyVector,
  inverse,
  solve,
  identity,
  diagonal,
  trace,
  buildDesignMatrix,
  extractResponseVector,
} from '../matrix';

describe('transpose', () => {
  it('returns empty array for empty input', () => {
    expect(transpose([])).toEqual([]);
  });

  it('returns empty array for matrix with empty rows', () => {
    expect(transpose([[]])).toEqual([]);
  });

  it('transposes 1×1 matrix', () => {
    expect(transpose([[5]])).toEqual([[5]]);
  });

  it('transposes 2×3 to 3×2 (docstring example)', () => {
    expect(
      transpose([
        [1, 2],
        [3, 4],
        [5, 6],
      ])
    ).toEqual([
      [1, 3, 5],
      [2, 4, 6],
    ]);
  });

  it('double transpose returns original', () => {
    const A = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    expect(transpose(transpose(A))).toEqual(A);
  });
});

describe('multiply', () => {
  it('returns null for empty matrices', () => {
    expect(multiply([], [[1]])).toBeNull();
    expect(multiply([[1]], [])).toBeNull();
  });

  it('multiplies 2×2 matrices (docstring example)', () => {
    const result = multiply(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ]
    );
    expect(result).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it('identity × A = A', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const I = identity(2);
    expect(multiply(I, A)).toEqual(A);
  });

  it('returns null for dimension mismatch', () => {
    expect(multiply([[1, 2]], [[1, 2]])).toBeNull(); // 1×2 × 1×2
  });

  it('multiplies non-square matrices', () => {
    // (1×2) × (2×3) = (1×3)
    const result = multiply(
      [[1, 2]],
      [
        [1, 2, 3],
        [4, 5, 6],
      ]
    );
    expect(result).toEqual([[9, 12, 15]]);
  });
});

describe('multiplyVector', () => {
  it('multiplies matrix by vector', () => {
    const result = multiplyVector(
      [
        [1, 2],
        [3, 4],
      ],
      [5, 6]
    );
    expect(result).toEqual([17, 39]);
  });

  it('returns null for dimension mismatch', () => {
    expect(multiplyVector([[1, 2]], [1, 2, 3])).toBeNull();
  });

  it('returns null for empty inputs', () => {
    expect(multiplyVector([], [1])).toBeNull();
    expect(multiplyVector([[1]], [])).toBeNull();
  });
});

describe('inverse', () => {
  it('inverts 2×2 matrix (docstring example)', () => {
    const result = inverse([
      [4, 7],
      [2, 6],
    ]);
    expect(result).not.toBeNull();
    expect(result![0][0]).toBeCloseTo(0.6);
    expect(result![0][1]).toBeCloseTo(-0.7);
    expect(result![1][0]).toBeCloseTo(-0.2);
    expect(result![1][1]).toBeCloseTo(0.4);
  });

  it('identity inverse is identity', () => {
    const I = identity(3);
    const result = inverse(I);
    expect(result).not.toBeNull();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(result![i][j]).toBeCloseTo(i === j ? 1 : 0);
      }
    }
  });

  it('returns null for singular matrix', () => {
    // Rows are linearly dependent
    expect(
      inverse([
        [1, 2],
        [2, 4],
      ])
    ).toBeNull();
  });

  it('returns null for empty matrix', () => {
    expect(inverse([])).toBeNull();
  });

  it('returns null for non-square matrix', () => {
    expect(
      inverse([
        [1, 2, 3],
        [4, 5, 6],
      ])
    ).toBeNull();
  });

  it('A × A⁻¹ = I for 3×3 matrix', () => {
    const A = [
      [2, 1, 1],
      [1, 3, 2],
      [1, 0, 0],
    ];
    const Ainv = inverse(A);
    expect(Ainv).not.toBeNull();
    const product = multiply(A, Ainv!);
    expect(product).not.toBeNull();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(product![i][j]).toBeCloseTo(i === j ? 1 : 0, 10);
      }
    }
  });
});

describe('solve', () => {
  it('solves 2x+y=5, x+3y=5 → [2, 1] (docstring example)', () => {
    const result = solve(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 5]
    );
    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(2);
    expect(result![1]).toBeCloseTo(1);
  });

  it('returns null for singular system', () => {
    expect(
      solve(
        [
          [1, 2],
          [2, 4],
        ],
        [3, 6]
      )
    ).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(solve([], [])).toBeNull();
  });

  it('returns null for dimension mismatch', () => {
    expect(
      solve(
        [
          [1, 2],
          [3, 4],
        ],
        [1]
      )
    ).toBeNull();
  });
});

describe('identity', () => {
  it('creates 1×1 identity', () => {
    expect(identity(1)).toEqual([[1]]);
  });

  it('creates 3×3 identity', () => {
    expect(identity(3)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
});

describe('diagonal', () => {
  it('extracts diagonal from 2×2', () => {
    expect(
      diagonal([
        [1, 2],
        [3, 4],
      ])
    ).toEqual([1, 4]);
  });

  it('extracts diagonal from 3×3', () => {
    expect(
      diagonal([
        [5, 0, 0],
        [0, 10, 0],
        [0, 0, 15],
      ])
    ).toEqual([5, 10, 15]);
  });
});

describe('trace', () => {
  it('sums diagonal of 2×2', () => {
    expect(
      trace([
        [1, 2],
        [3, 4],
      ])
    ).toBe(5);
  });

  it('trace of identity(n) = n', () => {
    expect(trace(identity(4))).toBe(4);
    expect(trace(identity(1))).toBe(1);
  });
});

describe('buildDesignMatrix', () => {
  it('builds design matrix with intercept column', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
    ];
    const { X, validRows } = buildDesignMatrix(data, ['x']);
    expect(X).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
    ]);
    expect(validRows).toEqual([0, 1, 2]);
  });

  it('skips rows with NaN values', () => {
    const data = [
      { x: 1, y: 10 },
      { x: NaN, y: 20 },
      { x: 3, y: 30 },
    ];
    const { X, validRows } = buildDesignMatrix(data, ['x']);
    expect(X).toEqual([
      [1, 1],
      [1, 3],
    ]);
    expect(validRows).toEqual([0, 2]);
  });

  it('builds multi-column design matrix', () => {
    const data = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const { X } = buildDesignMatrix(data, ['a', 'b']);
    expect(X).toEqual([
      [1, 1, 2],
      [1, 3, 4],
    ]);
  });

  it('intercept column is all 1s', () => {
    const data = [{ x: 5 }, { x: 10 }, { x: 15 }];
    const { X } = buildDesignMatrix(data, ['x']);
    expect(X.every(row => row[0] === 1)).toBe(true);
  });
});

describe('extractResponseVector', () => {
  it('extracts response values for valid rows', () => {
    const data = [{ y: 10 }, { y: 20 }, { y: 30 }];
    const result = extractResponseVector(data, 'y', [0, 2]);
    expect(result).toEqual([10, 30]);
  });

  it('respects validRows filter', () => {
    const data = [{ y: 1 }, { y: 2 }, { y: 3 }, { y: 4 }];
    const result = extractResponseVector(data, 'y', [1, 3]);
    expect(result).toEqual([2, 4]);
  });
});
