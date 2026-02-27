import { describe, it, expect } from 'vitest';
import { computeCategoryDirectionColors } from '../directionColors';
import type { SpecLimits } from '../../types';

/** Helper to build a category entry */
function cat(key: string, mean: number) {
  return { key, mean };
}

describe('computeCategoryDirectionColors', () => {
  // ---------------------------------------------------------------------------
  // Null guards
  // ---------------------------------------------------------------------------
  describe('returns null when coloring is not applicable', () => {
    it('returns null when specs have no usl and no lsl', () => {
      const data = [cat('A', 10), cat('B', 20)];
      const specs: SpecLimits = {};
      expect(computeCategoryDirectionColors(data, specs)).toBeNull();
    });

    it('returns null when specs only have target (no usl/lsl)', () => {
      const data = [cat('A', 10), cat('B', 20)];
      const specs: SpecLimits = { target: 15 };
      expect(computeCategoryDirectionColors(data, specs)).toBeNull();
    });

    it('returns null for empty data array', () => {
      const specs: SpecLimits = { usl: 100 };
      expect(computeCategoryDirectionColors([], specs)).toBeNull();
    });

    it('returns null for single category', () => {
      const data = [cat('Only', 50)];
      const specs: SpecLimits = { usl: 100, lsl: 0 };
      expect(computeCategoryDirectionColors(data, specs)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Smaller-is-better (USL only -> inferred 'smaller')
  // ---------------------------------------------------------------------------
  describe('smaller-is-better (USL only)', () => {
    const specs: SpecLimits = { usl: 100 };

    it('assigns green to lowest mean and red to highest mean', () => {
      const data = [cat('Low', 10), cat('High', 90)];
      const result = computeCategoryDirectionColors(data, specs);

      expect(result).not.toBeNull();
      expect(result!['Low']).toBe('green');
      expect(result!['High']).toBe('red');
    });

    it('ranks 3 categories correctly: lowest=green, middle=amber, highest=red', () => {
      const data = [cat('Best', 5), cat('Mid', 50), cat('Worst', 95)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Best']).toBe('green');
      expect(result['Mid']).toBe('amber');
      expect(result['Worst']).toBe('red');
    });

    it('handles unsorted input data', () => {
      const data = [cat('Mid', 50), cat('Best', 5), cat('Worst', 95)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Best']).toBe('green');
      expect(result['Mid']).toBe('amber');
      expect(result['Worst']).toBe('red');
    });
  });

  // ---------------------------------------------------------------------------
  // Larger-is-better (LSL only -> inferred 'larger')
  // ---------------------------------------------------------------------------
  describe('larger-is-better (LSL only)', () => {
    const specs: SpecLimits = { lsl: 0 };

    it('assigns green to highest mean and red to lowest mean', () => {
      const data = [cat('High', 90), cat('Low', 10)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['High']).toBe('green');
      expect(result['Low']).toBe('red');
    });

    it('ranks 3 categories correctly: highest=green, middle=amber, lowest=red', () => {
      const data = [cat('Best', 95), cat('Mid', 50), cat('Worst', 5)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Best']).toBe('green');
      expect(result['Mid']).toBe('amber');
      expect(result['Worst']).toBe('red');
    });
  });

  // ---------------------------------------------------------------------------
  // Nominal (both USL+LSL -> inferred 'nominal')
  // ---------------------------------------------------------------------------
  describe('nominal (both USL and LSL)', () => {
    const specs: SpecLimits = { usl: 100, lsl: 0 };
    // Inferred target = midpoint = 50

    it('assigns green to mean closest to midpoint', () => {
      const data = [cat('OnTarget', 50), cat('OffTarget', 95)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['OnTarget']).toBe('green');
      expect(result['OffTarget']).toBe('red');
    });

    it('ranks 3 categories by distance from midpoint', () => {
      const data = [cat('Close', 48), cat('Medium', 30), cat('Far', 5)];
      // Distances from 50: Close=2, Medium=20, Far=45
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Close']).toBe('green');
      expect(result['Medium']).toBe('amber');
      expect(result['Far']).toBe('red');
    });

    it('treats means equidistant above and below midpoint equally', () => {
      // Both are 20 away from midpoint=50, so score = -20 for both
      const data = [cat('Above', 70), cat('Below', 30), cat('Center', 50)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Center']).toBe('green');
      // Above and Below have same distance — their order depends on sort stability
      // Both should be non-green
      expect(['amber', 'red']).toContain(result['Above']);
      expect(['amber', 'red']).toContain(result['Below']);
    });
  });

  // ---------------------------------------------------------------------------
  // Nominal with explicit target
  // ---------------------------------------------------------------------------
  describe('nominal with explicit target', () => {
    it('uses explicit target instead of midpoint', () => {
      const specs: SpecLimits = { usl: 100, lsl: 0, target: 30 };
      // Target is 30, not midpoint 50
      const data = [cat('NearTarget', 28), cat('NearMid', 52), cat('Far', 90)];
      // Distances from 30: NearTarget=2, NearMid=22, Far=60
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['NearTarget']).toBe('green');
      expect(result['NearMid']).toBe('amber');
      expect(result['Far']).toBe('red');
    });

    it('handles target at zero', () => {
      const specs: SpecLimits = { usl: 10, lsl: -10, target: 0 };
      const data = [cat('Zero', 0.5), cat('Positive', 8)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Zero']).toBe('green');
      expect(result['Positive']).toBe('red');
    });
  });

  // ---------------------------------------------------------------------------
  // 2-category binary case
  // ---------------------------------------------------------------------------
  describe('2 categories (binary case)', () => {
    it('assigns green to best and red to worst (smaller)', () => {
      const data = [cat('Good', 10), cat('Bad', 90)];
      const specs: SpecLimits = { usl: 100 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Good']).toBe('green');
      expect(result['Bad']).toBe('red');
    });

    it('assigns green to best and red to worst (larger)', () => {
      const data = [cat('Good', 90), cat('Bad', 10)];
      const specs: SpecLimits = { lsl: 0 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Good']).toBe('green');
      expect(result['Bad']).toBe('red');
    });

    it('never assigns amber with exactly 2 categories', () => {
      const data = [cat('A', 10), cat('B', 20)];
      const specs: SpecLimits = { usl: 100 };
      const result = computeCategoryDirectionColors(data, specs)!;

      const colors = Object.values(result);
      expect(colors).not.toContain('amber');
      expect(colors).toContain('green');
      expect(colors).toContain('red');
    });
  });

  // ---------------------------------------------------------------------------
  // 3 categories (one of each color)
  // ---------------------------------------------------------------------------
  describe('3 categories', () => {
    it('assigns exactly one green, one amber, one red', () => {
      const data = [cat('A', 10), cat('B', 50), cat('C', 90)];
      const specs: SpecLimits = { usl: 100 };
      const result = computeCategoryDirectionColors(data, specs)!;

      const colors = Object.values(result);
      expect(colors.filter(c => c === 'green')).toHaveLength(1);
      expect(colors.filter(c => c === 'amber')).toHaveLength(1);
      expect(colors.filter(c => c === 'red')).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 4+ categories with thirds assignment
  // ---------------------------------------------------------------------------
  describe('4+ categories with thirds', () => {
    it('distributes 4 categories into thirds (ceil-based)', () => {
      // n=4, topThreshold=ceil(4/3)=2, bottomThreshold=4-ceil(4/3)=2
      // Sorted by score (smaller = lower is better): A(5), B(15), C(25), D(35)
      // Indices: 0=green, 1=green, 2=red, 3=red (top 2, bottom 2, no amber)
      const data = [cat('D', 35), cat('B', 15), cat('A', 5), cat('C', 25)];
      const specs: SpecLimits = { usl: 50 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['A']).toBe('green');
      expect(result['B']).toBe('green');
      expect(result['C']).toBe('red');
      expect(result['D']).toBe('red');
    });

    it('distributes 5 categories into thirds', () => {
      // n=5, topThreshold=ceil(5/3)=2, bottomThreshold=5-ceil(5/3)=3
      // Sorted (smaller): A(2), B(4), C(6), D(8), E(10)
      // Indices: 0=green, 1=green, 2=amber, 3=red, 4=red
      const data = [cat('E', 10), cat('C', 6), cat('A', 2), cat('D', 8), cat('B', 4)];
      const specs: SpecLimits = { usl: 20 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['A']).toBe('green');
      expect(result['B']).toBe('green');
      expect(result['C']).toBe('amber');
      expect(result['D']).toBe('red');
      expect(result['E']).toBe('red');
    });

    it('distributes 6 categories evenly into thirds', () => {
      // n=6, topThreshold=ceil(6/3)=2, bottomThreshold=6-2=4
      // Sorted (smaller): A(1), B(2), C(3), D(4), E(5), F(6)
      // Indices: 0=green, 1=green, 2=amber, 3=amber, 4=red, 5=red
      const data = [cat('F', 6), cat('D', 4), cat('B', 2), cat('E', 5), cat('C', 3), cat('A', 1)];
      const specs: SpecLimits = { usl: 10 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['A']).toBe('green');
      expect(result['B']).toBe('green');
      expect(result['C']).toBe('amber');
      expect(result['D']).toBe('amber');
      expect(result['E']).toBe('red');
      expect(result['F']).toBe('red');
    });

    it('distributes 7 categories into thirds', () => {
      // n=7, topThreshold=ceil(7/3)=3, bottomThreshold=7-3=4
      // Sorted (larger): G(70), F(60), E(50), D(40), C(30), B(20), A(10)
      // Indices: 0=green(G), 1=green(F), 2=green(E), 3=amber(D), 4=red(C), 5=red(B), 6=red(A)
      const data = [
        cat('A', 10),
        cat('B', 20),
        cat('C', 30),
        cat('D', 40),
        cat('E', 50),
        cat('F', 60),
        cat('G', 70),
      ];
      const specs: SpecLimits = { lsl: 0 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['G']).toBe('green');
      expect(result['F']).toBe('green');
      expect(result['E']).toBe('green');
      expect(result['D']).toBe('amber');
      expect(result['C']).toBe('red');
      expect(result['B']).toBe('red');
      expect(result['A']).toBe('red');
    });
  });

  // ---------------------------------------------------------------------------
  // Explicit characteristicType override
  // ---------------------------------------------------------------------------
  describe('explicit characteristicType override', () => {
    it('overrides inferred type: smaller with both USL+LSL', () => {
      // Both USL+LSL would normally infer 'nominal', but explicit override to 'smaller'
      const specs: SpecLimits = { usl: 100, lsl: 0, characteristicType: 'smaller' };
      const data = [cat('Low', 10), cat('High', 90)];
      const result = computeCategoryDirectionColors(data, specs)!;

      // Smaller-is-better: low mean = green
      expect(result['Low']).toBe('green');
      expect(result['High']).toBe('red');
    });

    it('overrides inferred type: larger with USL only', () => {
      // USL only would normally infer 'smaller', but explicit override to 'larger'
      const specs: SpecLimits = { usl: 100, characteristicType: 'larger' };
      const data = [cat('Low', 10), cat('High', 90)];
      const result = computeCategoryDirectionColors(data, specs)!;

      // Larger-is-better: high mean = green
      expect(result['High']).toBe('green');
      expect(result['Low']).toBe('red');
    });

    it('overrides inferred type: nominal with LSL only', () => {
      // LSL only would normally infer 'larger', but explicit override to 'nominal'
      // With only LSL, target cannot be derived from midpoint (no USL),
      // so score defaults to 0 for all categories
      const specs: SpecLimits = { lsl: 0, characteristicType: 'nominal', target: 50 };
      const data = [cat('Near', 48), cat('Far', 90)];
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(result['Near']).toBe('green');
      expect(result['Far']).toBe('red');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles all categories with the same mean', () => {
      const data = [cat('A', 50), cat('B', 50), cat('C', 50)];
      const specs: SpecLimits = { usl: 100 };
      const result = computeCategoryDirectionColors(data, specs)!;

      // All have same score — sort is stable, so input order preserved
      // Index 0=green, 1=amber, 2=red based on position after stable sort
      expect(result).not.toBeNull();
      const colors = Object.values(result);
      expect(colors).toHaveLength(3);
      // Each category gets a color (no nulls/undefined)
      colors.forEach(c => {
        expect(['green', 'amber', 'red']).toContain(c);
      });
    });

    it('handles negative mean values (smaller-is-better)', () => {
      const data = [cat('VeryLow', -50), cat('Low', -10), cat('Zero', 0)];
      const specs: SpecLimits = { usl: 10 };
      const result = computeCategoryDirectionColors(data, specs)!;

      // Smaller is better: most negative mean = best
      expect(result['VeryLow']).toBe('green');
      expect(result['Zero']).toBe('red');
    });

    it('handles negative mean values (larger-is-better)', () => {
      const data = [cat('Neg', -10), cat('Pos', 10)];
      const specs: SpecLimits = { lsl: -20 };
      const result = computeCategoryDirectionColors(data, specs)!;

      // Larger is better: highest mean = best
      expect(result['Pos']).toBe('green');
      expect(result['Neg']).toBe('red');
    });

    it('handles very close mean values', () => {
      const data = [cat('A', 50.001), cat('B', 50.002), cat('C', 50.003)];
      const specs: SpecLimits = { usl: 100 };
      const result = computeCategoryDirectionColors(data, specs)!;

      // Smaller is better: A is lowest
      expect(result['A']).toBe('green');
      expect(result['C']).toBe('red');
    });

    it('returns a result for every input category key', () => {
      const data = [cat('X', 10), cat('Y', 20), cat('Z', 30), cat('W', 40)];
      const specs: SpecLimits = { usl: 50 };
      const result = computeCategoryDirectionColors(data, specs)!;

      expect(Object.keys(result).sort()).toEqual(['W', 'X', 'Y', 'Z']);
    });

    it('handles specs with usl equal to lsl (zero-width tolerance)', () => {
      const specs: SpecLimits = { usl: 50, lsl: 50 };
      // Midpoint = 50
      const data = [cat('A', 50), cat('B', 60)];
      const result = computeCategoryDirectionColors(data, specs)!;

      // Nominal: A is right on target, B is 10 away
      expect(result['A']).toBe('green');
      expect(result['B']).toBe('red');
    });

    it('nominal without explicit target and without both usl+lsl falls back to score=0', () => {
      // This exercises the fallback path in the nominal branch:
      // characteristicType explicitly 'nominal' but only USL provided (no LSL, no target)
      // => target is undefined => score defaults to 0 for all
      const specs: SpecLimits = { usl: 100, characteristicType: 'nominal' };
      const data = [cat('A', 10), cat('B', 90)];
      const result = computeCategoryDirectionColors(data, specs)!;

      // Both get score 0 — stable sort preserves order: A=green, B=red
      expect(result).not.toBeNull();
      expect(Object.keys(result)).toHaveLength(2);
    });
  });
});
