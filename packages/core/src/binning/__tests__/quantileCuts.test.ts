import { describe, it, expect } from 'vitest';
import { quartileBin } from '../quantileCuts';

describe('quartileBin', () => {
  // (a) <4 finite points → fallback to single 'All' bin
  it('returns levelNames: ["All"] and labels "All" for <4 finite points', () => {
    const result = quartileBin([1, 2, 3]);
    expect(result.levelNames).toEqual(['All']);
    expect(result.labels).toEqual(['All', 'All', 'All']);
  });

  it('maps finite values to "All" and non-finite to undefined when <4 finite points', () => {
    // Only 2 finite values; NaN and Infinity are non-finite.
    const result = quartileBin([1, NaN, 5, Infinity]);
    expect(result.levelNames).toEqual(['All']);
    expect(result.labels[0]).toBe('All');
    expect(result.labels[1]).toBeUndefined();
    expect(result.labels[2]).toBe('All');
    expect(result.labels[3]).toBeUndefined();
  });

  // (b) Coincident-quantile bin collapse — many duplicate values → fewer than 4 bins
  it('collapses bins when many duplicates make quantiles coincide', () => {
    // 10 copies of the same value: q1 = q2 = q3 = 5; all values land in Q1.
    const result = quartileBin([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    // Only one distinct bin should appear.
    expect(result.levelNames.length).toBeLessThan(4);
    // Every finite value gets the same label.
    const distinctLabels = new Set(result.labels.filter((l): l is string => l !== undefined));
    expect(distinctLabels.size).toBe(1);
  });

  // (c) Integer data → labels without decimals
  it('formats cut values without decimals for integer data', () => {
    // d3.quantile uses linear interpolation at index p*(n-1).
    // For n=8: q1 at 1.75, q2 at 3.5, q3 at 5.25.
    // Arithmetic sequence a + k*d produces all-integer quantiles when d is
    // divisible by 4. With d=4, a=0: [0,4,8,12,16,20,24,28] → q1=7, q2=14, q3=21.
    const result = quartileBin([0, 4, 8, 12, 16, 20, 24, 28]);
    // All levelNames must not contain a decimal point.
    for (const name of result.levelNames) {
      expect(name).not.toMatch(/\.\d/);
    }
    // d3.quantile([0,4,8,12,16,20,24,28], 0.25) = 0+1.75*4 = 7
    // d3.quantile([0,4,8,12,16,20,24,28], 0.50) = 0+3.5*4  = 14
    // d3.quantile([0,4,8,12,16,20,24,28], 0.75) = 0+5.25*4 = 21
    expect(result.levelNames[0]).toBe('Q1 (≤7)');
    expect(result.levelNames[1]).toBe('Q2 (7–14)');
    expect(result.levelNames[2]).toBe('Q3 (14–21)');
    expect(result.levelNames[3]).toBe('Q4 (>21)');
  });

  // (d) Decimal path — labels contain formatted decimal values
  it('formats cut values with up to 2 decimals for non-integer quantiles', () => {
    // [1.1, 2.2, 3.3, 4.4]: all four are distinct so we get 4 finite points.
    // d3.quantile interpolates: q1 at index 0.75 = 1.1+0.75*(2.2-1.1) = 1.925
    // formatCut(1.925): Math.round(1.925*100)/100 — JS rounds to 1.93.
    // The Q1 label will be "Q1 (≤1.93)" which contains a decimal.
    const result = quartileBin([1.1, 2.2, 3.3, 4.4]);
    expect(result.levelNames.length).toBeGreaterThan(0);
    // Q1 label contains a decimal-formatted cut value.
    expect(result.levelNames[0]).toMatch(/Q1 \(≤\d+\.\d+\)/);
  });

  // (e) Q2 boundary: a value exactly equal to q2 lands in Q2 (the v <= q2 rule)
  it('places a value exactly at q2 into Q2, not Q3', () => {
    // Use the integer sequence [0,4,8,12,16,20,24,28] where q2=14 (integer).
    // Any value == 14 must satisfy (v <= q1 is false, v <= q2 is true) → Q2 label.
    // We build the result from the base dataset to read the canonical Q2 label,
    // then check that 14 is routed there.
    const base = [0, 4, 8, 12, 16, 20, 24, 28];
    const baseResult = quartileBin(base);
    const q2Label = baseResult.levelNames.find(n => n.startsWith('Q2'));
    expect(q2Label).toBeDefined();

    // Inject the value 14 (= q2) into the same dataset and confirm it lands in Q2.
    // Adding one value shifts quantiles slightly, so we test against the NEW result.
    const withQ2Val = [...base, 14];
    const withQ2Result = quartileBin(withQ2Val);
    const idxOf14 = withQ2Val.indexOf(14); // first occurrence, which is the appended one
    // The value 14 in the new dataset should land in a Q2 bin (starts with 'Q2').
    expect(withQ2Result.labels[idxOf14]).toMatch(/^Q2/);
  });

  // (f) Deterministic labels/cuts on a literal array
  it('produces deterministic labels and levelNames for a fixed literal array', () => {
    // [10, 20, 30, 40, 50, 60, 70, 80]: n=8 sorted.
    // d3.quantile positions: q1 at 1.75, q2 at 3.5, q3 at 5.25.
    // q1 = 10 + 1.75*(20-10) = 27.5
    // q2 = 30 + 0.5*(40-30)  = 35 + 10*0.5 => index 3.5: 40 + 0.5*(50-40) = 45
    // q3 = 60 + 0.25*(70-60) = 62.5
    const data = [10, 20, 30, 40, 50, 60, 70, 80];
    const result = quartileBin(data);

    expect(result.levelNames).toEqual(['Q1 (≤27.5)', 'Q2 (27.5–45)', 'Q3 (45–62.5)', 'Q4 (>62.5)']);
    // 10, 20 ≤ 27.5 → Q1
    expect(result.labels[0]).toBe('Q1 (≤27.5)');
    expect(result.labels[1]).toBe('Q1 (≤27.5)');
    // 30, 40 in Q2 (27.5–45)
    expect(result.labels[2]).toBe('Q2 (27.5–45)');
    expect(result.labels[3]).toBe('Q2 (27.5–45)');
    // 50, 60 in Q3 (45–62.5)
    expect(result.labels[4]).toBe('Q3 (45–62.5)');
    expect(result.labels[5]).toBe('Q3 (45–62.5)');
    // 70, 80 → Q4
    expect(result.labels[6]).toBe('Q4 (>62.5)');
    expect(result.labels[7]).toBe('Q4 (>62.5)');
  });

  it('maps non-finite values to undefined in the output labels', () => {
    // 6 finite values from [10, NaN, 30, 40, 50, 60, Infinity, 80] → well-formed bins.
    const data = [10, NaN, 30, 40, 50, 60, Infinity, 80];
    const result = quartileBin(data);
    expect(result.labels[1]).toBeUndefined(); // NaN
    expect(result.labels[6]).toBeUndefined(); // Infinity
    // Finite values still get a real label.
    expect(result.labels[0]).toBeDefined();
    expect(result.labels[2]).toBeDefined();
  });
});
