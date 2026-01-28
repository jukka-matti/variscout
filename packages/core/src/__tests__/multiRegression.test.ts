import { describe, it, expect } from 'vitest';
import { calculateMultipleRegression } from '../stats';
import { transpose, multiply, inverse, solve } from '../matrix';

describe('Matrix Operations', () => {
  describe('transpose', () => {
    it('should transpose a matrix correctly', () => {
      const A = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const At = transpose(A);
      expect(At).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });

    it('should handle empty matrix', () => {
      expect(transpose([])).toEqual([]);
    });

    it('should handle single row', () => {
      expect(transpose([[1, 2, 3]])).toEqual([[1], [2], [3]]);
    });
  });

  describe('multiply', () => {
    it('should multiply matrices correctly', () => {
      const A = [
        [1, 2],
        [3, 4],
      ];
      const B = [
        [5, 6],
        [7, 8],
      ];
      const C = multiply(A, B);
      expect(C).toEqual([
        [19, 22],
        [43, 50],
      ]);
    });

    it('should return null for incompatible dimensions', () => {
      const A = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const B = [
        [1, 2],
        [3, 4],
      ];
      expect(multiply(A, B)).toBeNull();
    });
  });

  describe('inverse', () => {
    it('should compute inverse of 2x2 matrix', () => {
      const A = [
        [4, 7],
        [2, 6],
      ];
      const Ainv = inverse(A);
      expect(Ainv).not.toBeNull();

      // A * A^-1 should equal identity
      const I = multiply(A, Ainv!);
      expect(I![0][0]).toBeCloseTo(1, 10);
      expect(I![0][1]).toBeCloseTo(0, 10);
      expect(I![1][0]).toBeCloseTo(0, 10);
      expect(I![1][1]).toBeCloseTo(1, 10);
    });

    it('should return null for singular matrix', () => {
      const singular = [
        [1, 2],
        [2, 4],
      ];
      expect(inverse(singular)).toBeNull();
    });

    it('should compute inverse of 3x3 matrix', () => {
      const A = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0],
      ];
      const Ainv = inverse(A);
      expect(Ainv).not.toBeNull();

      const I = multiply(A, Ainv!);
      expect(I![0][0]).toBeCloseTo(1, 10);
      expect(I![1][1]).toBeCloseTo(1, 10);
      expect(I![2][2]).toBeCloseTo(1, 10);
    });
  });

  describe('solve', () => {
    it('should solve system of linear equations', () => {
      // 2x + y = 5
      // x + 3y = 5
      // Solution: x=2, y=1
      const A = [
        [2, 1],
        [1, 3],
      ];
      const b = [5, 5];
      const x = solve(A, b);
      expect(x).not.toBeNull();
      expect(x![0]).toBeCloseTo(2, 10);
      expect(x![1]).toBeCloseTo(1, 10);
    });
  });
});

describe('Multiple Regression', () => {
  describe('Basic multiple regression', () => {
    it('should calculate regression with two continuous predictors', () => {
      // Create data where Y = 5 + 2*X1 + 3*X2 + noise
      const data = [
        { X1: 1, X2: 1, Y: 10.1 },
        { X1: 2, X2: 1, Y: 12.0 },
        { X1: 3, X2: 1, Y: 14.2 },
        { X1: 1, X2: 2, Y: 13.0 },
        { X1: 2, X2: 2, Y: 15.1 },
        { X1: 3, X2: 2, Y: 17.0 },
        { X1: 1, X2: 3, Y: 16.1 },
        { X1: 2, X2: 3, Y: 18.0 },
        { X1: 3, X2: 3, Y: 20.2 },
        { X1: 4, X2: 1, Y: 15.9 },
        { X1: 4, X2: 2, Y: 19.1 },
        { X1: 4, X2: 3, Y: 22.0 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2']);

      expect(result).not.toBeNull();
      expect(result!.n).toBe(12);
      expect(result!.p).toBe(2);
      expect(result!.rSquared).toBeGreaterThan(0.99);
      expect(result!.isSignificant).toBe(true);

      // Check coefficients approximate true values
      const coefX1 = result!.coefficients.find(c => c.term === 'X1');
      const coefX2 = result!.coefficients.find(c => c.term === 'X2');
      expect(coefX1!.coefficient).toBeCloseTo(2, 0);
      expect(coefX2!.coefficient).toBeCloseTo(3, 0);
      expect(result!.intercept).toBeCloseTo(5, 0);
    });

    it('should calculate adjusted R-squared', () => {
      // Data with independent predictors (not perfectly collinear)
      const data = [
        { X1: 1, X2: 5, Y: 10 },
        { X1: 2, X2: 3, Y: 14 },
        { X1: 3, X2: 7, Y: 22 },
        { X1: 4, X2: 2, Y: 18 },
        { X1: 5, X2: 8, Y: 32 },
        { X1: 6, X2: 4, Y: 28 },
        { X1: 7, X2: 9, Y: 40 },
        { X1: 8, X2: 6, Y: 38 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2']);

      expect(result).not.toBeNull();
      expect(result!.adjustedRSquared).toBeLessThanOrEqual(result!.rSquared);
      expect(result!.adjustedRSquared).toBeGreaterThan(0.8);
    });

    it('should identify top predictors by standardized coefficient', () => {
      // X1 has stronger effect than X2 (independent predictors)
      const data = [
        { X1: 1, X2: 50, Y: 10 },
        { X1: 2, X2: 45, Y: 21 },
        { X1: 3, X2: 55, Y: 31 },
        { X1: 4, X2: 48, Y: 42 },
        { X1: 5, X2: 52, Y: 50 },
        { X1: 6, X2: 47, Y: 59 },
        { X1: 7, X2: 53, Y: 71 },
        { X1: 8, X2: 49, Y: 79 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2']);

      expect(result).not.toBeNull();
      expect(result!.topPredictors.length).toBeGreaterThan(0);
      // X1 should be the top predictor since it drives Y
      expect(result!.topPredictors[0]).toBe('X1');
    });

    it('should return null for insufficient data', () => {
      const data = [
        { X1: 1, X2: 1, Y: 10 },
        { X1: 2, X2: 2, Y: 20 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2']);
      expect(result).toBeNull();
    });
  });

  describe('Categorical predictors', () => {
    it('should handle categorical variables with dummy encoding', () => {
      // Machine A baseline, Machine B adds 5 units
      const data = [
        { Machine: 'A', X: 1, Y: 10 },
        { Machine: 'A', X: 2, Y: 12 },
        { Machine: 'A', X: 3, Y: 14 },
        { Machine: 'A', X: 4, Y: 16 },
        { Machine: 'B', X: 1, Y: 15 },
        { Machine: 'B', X: 2, Y: 17 },
        { Machine: 'B', X: 3, Y: 19 },
        { Machine: 'B', X: 4, Y: 21 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X', 'Machine'], {
        categoricalColumns: ['Machine'],
      });

      expect(result).not.toBeNull();
      expect(result!.isSignificant).toBe(true);

      // Should have terms for X and Machine_B
      const machineCoef = result!.coefficients.find(c => c.term.includes('Machine'));
      expect(machineCoef).toBeDefined();
      expect(machineCoef!.coefficient).toBeCloseTo(5, 0);
    });

    it('should handle categorical with multiple levels', () => {
      const data = [
        { Shift: 'Day', Y: 100 },
        { Shift: 'Day', Y: 102 },
        { Shift: 'Evening', Y: 110 },
        { Shift: 'Evening', Y: 112 },
        { Shift: 'Night', Y: 95 },
        { Shift: 'Night', Y: 97 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['Shift'], {
        categoricalColumns: ['Shift'],
      });

      expect(result).not.toBeNull();
      // Day is reference, so we should see Evening and Night dummies
      expect(result!.terms.length).toBe(2);
      expect(result!.terms.some(t => t.label.includes('Evening'))).toBe(true);
      expect(result!.terms.some(t => t.label.includes('Night'))).toBe(true);
    });
  });

  describe('Interaction terms', () => {
    it('should include interaction terms when requested', () => {
      const data = [
        { X1: 1, X2: 1, Y: 5 },
        { X1: 2, X2: 1, Y: 7 },
        { X1: 1, X2: 2, Y: 8 },
        { X1: 2, X2: 2, Y: 12 },
        { X1: 3, X2: 1, Y: 9 },
        { X1: 3, X2: 2, Y: 16 },
        { X1: 1, X2: 3, Y: 11 },
        { X1: 2, X2: 3, Y: 17 },
        { X1: 3, X2: 3, Y: 23 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2'], {
        includeInteractions: true,
      });

      expect(result).not.toBeNull();
      expect(result!.terms.length).toBe(3); // X1, X2, X1×X2
      expect(result!.terms.some(t => t.type === 'interaction')).toBe(true);
    });

    it('should include continuous × categorical interactions', () => {
      const data = [
        { Temp: 100, Machine: 'A', Y: 50 },
        { Temp: 110, Machine: 'A', Y: 55 },
        { Temp: 120, Machine: 'A', Y: 60 },
        { Temp: 100, Machine: 'B', Y: 52 },
        { Temp: 110, Machine: 'B', Y: 62 },
        { Temp: 120, Machine: 'B', Y: 72 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['Temp', 'Machine'], {
        categoricalColumns: ['Machine'],
        includeInteractions: true,
      });

      expect(result).not.toBeNull();
      // Should have: Temp, Machine_B, Temp×Machine_B
      expect(result!.terms.length).toBe(3);
    });
  });

  describe('VIF and multicollinearity', () => {
    it('should calculate VIF for predictors', () => {
      // Create data with some correlation
      const data = [];
      for (let i = 0; i < 20; i++) {
        data.push({
          X1: i,
          X2: i + Math.random() * 2, // Correlated with X1
          X3: Math.random() * 10, // Independent
          Y: i * 2 + Math.random(),
        });
      }

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2', 'X3']);

      expect(result).not.toBeNull();
      // VIF should be calculated for each coefficient
      result!.coefficients.forEach(c => {
        expect(c.vif).toBeDefined();
      });
    });

    it('should generate VIF warnings for highly correlated predictors', () => {
      // Create data with perfect multicollinearity
      const data = [];
      for (let i = 0; i < 30; i++) {
        data.push({
          X1: i,
          X2: i * 2, // Perfect linear relationship
          Y: i + Math.random() * 0.1,
        });
      }

      const result = calculateMultipleRegression(data, 'Y', ['X1', 'X2']);

      // Should either return null or have VIF warnings
      if (result) {
        // If it manages to fit, VIF should be very high
        const hasHighVIF = result.coefficients.some(c => (c.vif ?? 0) > 5);
        const hasWarning = result.vifWarnings.length > 0;
        expect(hasHighVIF || hasWarning || result.hasCollinearity).toBe(true);
      }
    });
  });

  describe('Fit statistics', () => {
    it('should calculate F-statistic and p-value', () => {
      const data = [
        { X: 1, Y: 2.1 },
        { X: 2, Y: 4.0 },
        { X: 3, Y: 5.9 },
        { X: 4, Y: 8.1 },
        { X: 5, Y: 10.0 },
        { X: 6, Y: 12.2 },
        { X: 7, Y: 13.9 },
        { X: 8, Y: 16.1 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X']);

      expect(result).not.toBeNull();
      expect(result!.fStatistic).toBeGreaterThan(0);
      expect(result!.pValue).toBeLessThan(0.05);
    });

    it('should calculate RMSE', () => {
      const data = [
        { X: 1, Y: 10.5 },
        { X: 2, Y: 20.2 },
        { X: 3, Y: 29.8 },
        { X: 4, Y: 40.1 },
        { X: 5, Y: 49.9 },
      ];

      const result = calculateMultipleRegression(data, 'Y', ['X']);

      expect(result).not.toBeNull();
      expect(result!.rmse).toBeGreaterThan(0);
      expect(result!.rmse).toBeLessThan(5); // Should be small for near-perfect fit
    });

    it('should assign strength rating based on adjusted R-squared', () => {
      // Perfect fit should get 5 stars
      const perfectData = [
        { X: 1, Y: 10 },
        { X: 2, Y: 20 },
        { X: 3, Y: 30 },
        { X: 4, Y: 40 },
        { X: 5, Y: 50 },
      ];

      const result = calculateMultipleRegression(perfectData, 'Y', ['X']);

      expect(result).not.toBeNull();
      expect(result!.strengthRating).toBe(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing values gracefully', () => {
      const data = [
        { X1: 1, X2: 5, Y: 10 },
        { X1: NaN, X2: 4, Y: 15 }, // Missing X1 (NaN)
        { X1: 3, X2: 8, Y: 22 },
        { X1: 4, X2: NaN, Y: 25 }, // Missing X2 (NaN)
        { X1: 5, X2: 6, Y: 28 },
        { X1: 6, X2: 3, Y: 30 },
        { X1: 7, X2: 9, Y: 38 },
        { X1: 8, X2: 7, Y: 42 },
        { X1: 9, X2: 2, Y: 38 },
        { X1: 10, X2: 10, Y: 55 },
      ];

      const result = calculateMultipleRegression(data as Record<string, unknown>[], 'Y', [
        'X1',
        'X2',
      ]);

      expect(result).not.toBeNull();
      expect(result!.n).toBe(8); // Only 8 complete cases (2 have NaN values)
    });

    it('should return null for empty columns array', () => {
      const data = [{ Y: 10 }, { Y: 20 }];
      const result = calculateMultipleRegression(data, 'Y', []);
      expect(result).toBeNull();
    });

    it('should generate meaningful insight', () => {
      const data = [
        { Temp: 100, Yield: 50 },
        { Temp: 110, Yield: 55 },
        { Temp: 120, Yield: 60 },
        { Temp: 130, Yield: 65 },
        { Temp: 140, Yield: 70 },
      ];

      const result = calculateMultipleRegression(data, 'Yield', ['Temp']);

      expect(result).not.toBeNull();
      expect(result!.insight).toBeTruthy();
      expect(result!.insight.length).toBeGreaterThan(10);
    });
  });
});
