import { describe, it, expect } from 'vitest';
import { calculateStats, calculateAnova, calculateRegression, calculateGageRR } from '../stats';

describe('Stats Engine', () => {
  it('should calculate basic stats for a normal distribution', () => {
    // Simple dataset: 10, 12, 11, 13, 10
    // Mean: 11.2, StdDev: ~1.303
    const data = [10, 12, 11, 13, 10];
    const stats = calculateStats(data);

    expect(stats.mean).toBeCloseTo(11.2, 1);
    expect(stats.stdDev).toBeCloseTo(1.3, 2);
    expect(stats.ucl).toBeCloseTo(11.2 + 3 * 1.3038, 1);
    expect(stats.lcl).toBeCloseTo(11.2 - 3 * 1.3038, 1);
  });

  it('should calculate Cp and Cpk correctly', () => {
    // Data centered at 10, sigma ~= 1
    const data = [9, 10, 11];
    const usl = 13;
    const lsl = 7;
    // Tolerance = 6, 6-sigma = 6 -> Cp = 1.0

    const stats = calculateStats(data, usl, lsl);
    expect(stats.cp).toBeCloseTo(1.0, 1);
    expect(stats.cpk).toBeCloseTo(1.0, 1); // Centered, so Cpk = Cp
  });

  it('should calculate Cpk correctly when off-center', () => {
    // Data centered at 12, sigma ~= 1
    // USL = 13 (1 sigma away), LSL = 7 (5 sigma away)
    // Cpk = min((13-12)/3, (12-7)/3) = 1/3 = 0.33
    const data = [11, 12, 13];
    const usl = 13;
    const lsl = 7;

    const stats = calculateStats(data, usl, lsl);
    expect(stats.cpk).toBeCloseTo(0.33, 2);
  });

  it('should handle one-sided specs', () => {
    const data = [10, 10, 10]; // Sigma is 0, special case?
    // Let's use scattered data
    const scattered = [9, 10, 11];
    const usl = 13;

    const stats = calculateStats(scattered, usl, undefined);
    expect(stats.cp).toBeUndefined(); // Cannot calc Cp with one limit
    expect(stats.cpk).toBeCloseTo((13 - 10) / (3 * 1), 1); // Cpu = 1.0
  });

  it('should handle empty data', () => {
    const stats = calculateStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.stdDev).toBe(0);
    expect(stats.outOfSpecPercentage).toBe(0);
  });
});

describe('ANOVA', () => {
  it('should detect significant difference between groups', () => {
    // Three clearly different groups
    const data = [
      { Shift: 'A', CycleTime: 20 },
      { Shift: 'A', CycleTime: 21 },
      { Shift: 'A', CycleTime: 22 },
      { Shift: 'A', CycleTime: 23 },
      { Shift: 'B', CycleTime: 30 },
      { Shift: 'B', CycleTime: 31 },
      { Shift: 'B', CycleTime: 32 },
      { Shift: 'B', CycleTime: 33 },
      { Shift: 'C', CycleTime: 40 },
      { Shift: 'C', CycleTime: 41 },
      { Shift: 'C', CycleTime: 42 },
      { Shift: 'C', CycleTime: 43 },
    ];

    const result = calculateAnova(data, 'CycleTime', 'Shift');

    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(true);
    expect(result!.pValue).toBeLessThan(0.05);
    expect(result!.groups).toHaveLength(3);
    expect(result!.fStatistic).toBeGreaterThan(1);
  });

  it('should not detect difference when groups are similar', () => {
    // Three similar groups with overlapping distributions
    const data = [
      { Shift: 'A', CycleTime: 10 },
      { Shift: 'A', CycleTime: 11 },
      { Shift: 'A', CycleTime: 12 },
      { Shift: 'B', CycleTime: 10 },
      { Shift: 'B', CycleTime: 11 },
      { Shift: 'B', CycleTime: 12 },
      { Shift: 'C', CycleTime: 10 },
      { Shift: 'C', CycleTime: 11 },
      { Shift: 'C', CycleTime: 12 },
    ];

    const result = calculateAnova(data, 'CycleTime', 'Shift');

    expect(result).not.toBeNull();
    expect(result!.isSignificant).toBe(false);
    expect(result!.pValue).toBeGreaterThan(0.05);
  });

  it('should calculate correct group statistics', () => {
    const data = [
      { Group: 'X', Value: 10 },
      { Group: 'X', Value: 20 },
      { Group: 'Y', Value: 30 },
      { Group: 'Y', Value: 40 },
    ];

    const result = calculateAnova(data, 'Value', 'Group');

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(2);

    const groupX = result!.groups.find(g => g.name === 'X');
    const groupY = result!.groups.find(g => g.name === 'Y');

    expect(groupX).toBeDefined();
    expect(groupX!.mean).toBeCloseTo(15, 1);
    expect(groupX!.n).toBe(2);

    expect(groupY).toBeDefined();
    expect(groupY!.mean).toBeCloseTo(35, 1);
    expect(groupY!.n).toBe(2);
  });

  it('should calculate eta-squared effect size', () => {
    // Large effect size expected
    const data = [
      { Group: 'A', Value: 1 },
      { Group: 'A', Value: 2 },
      { Group: 'A', Value: 3 },
      { Group: 'B', Value: 100 },
      { Group: 'B', Value: 101 },
      { Group: 'B', Value: 102 },
    ];

    const result = calculateAnova(data, 'Value', 'Group');

    expect(result).not.toBeNull();
    // Eta-squared should be > 0.14 for large effect
    expect(result!.etaSquared).toBeGreaterThan(0.14);
  });

  it('should return null for single group', () => {
    const data = [
      { Group: 'A', Value: 10 },
      { Group: 'A', Value: 20 },
    ];

    const result = calculateAnova(data, 'Value', 'Group');
    expect(result).toBeNull();
  });

  it('should return null for empty data', () => {
    const result = calculateAnova([], 'Value', 'Group');
    expect(result).toBeNull();
  });

  it('should generate plain-language insight for significant result', () => {
    const data = [
      { Machine: 'Fast', Time: 10 },
      { Machine: 'Fast', Time: 11 },
      { Machine: 'Fast', Time: 12 },
      { Machine: 'Slow', Time: 30 },
      { Machine: 'Slow', Time: 31 },
      { Machine: 'Slow', Time: 32 },
    ];

    const result = calculateAnova(data, 'Time', 'Machine');

    expect(result).not.toBeNull();
    expect(result!.insight).toContain('Fast');
    expect(result!.insight).toContain('best');
  });
});

describe('Regression', () => {
  it('should calculate perfect positive linear relationship', () => {
    // y = 2x + 1
    const data = [
      { X: 1, Y: 3 },
      { X: 2, Y: 5 },
      { X: 3, Y: 7 },
      { X: 4, Y: 9 },
      { X: 5, Y: 11 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.slope).toBeCloseTo(2, 5);
    expect(result!.linear.intercept).toBeCloseTo(1, 5);
    expect(result!.linear.rSquared).toBeCloseTo(1.0, 5);
    expect(result!.linear.isSignificant).toBe(true);
    expect(result!.strengthRating).toBe(5);
  });

  it('should calculate perfect negative linear relationship', () => {
    // y = -3x + 20
    const data = [
      { X: 1, Y: 17 },
      { X: 2, Y: 14 },
      { X: 3, Y: 11 },
      { X: 4, Y: 8 },
      { X: 5, Y: 5 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.slope).toBeCloseTo(-3, 5);
    expect(result!.linear.intercept).toBeCloseTo(20, 5);
    expect(result!.linear.rSquared).toBeCloseTo(1.0, 5);
  });

  it('should detect weak relationship with low R²', () => {
    // Noisy data with weak relationship
    const data = [
      { X: 1, Y: 10 },
      { X: 2, Y: 5 },
      { X: 3, Y: 20 },
      { X: 4, Y: 8 },
      { X: 5, Y: 15 },
      { X: 6, Y: 12 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.rSquared).toBeLessThan(0.5);
    expect(result!.strengthRating).toBeLessThanOrEqual(2);
  });

  it('should recommend quadratic for parabolic data', () => {
    // y = (x-5)² = x² - 10x + 25 (valley at x=5)
    const data = [
      { X: 1, Y: 16 },
      { X: 2, Y: 9 },
      { X: 3, Y: 4 },
      { X: 4, Y: 1 },
      { X: 5, Y: 0 },
      { X: 6, Y: 1 },
      { X: 7, Y: 4 },
      { X: 8, Y: 9 },
      { X: 9, Y: 16 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.quadratic!.rSquared).toBeCloseTo(1.0, 2);
    expect(result!.quadratic!.optimumX).toBeCloseTo(5, 1);
    expect(result!.quadratic!.optimumType).toBe('valley');
    expect(result!.recommendedFit).toBe('quadratic');
  });

  it('should detect peak in inverted parabola', () => {
    // y = -(x-3)² + 10 (peak at x=3, y=10)
    const data = [
      { X: 0, Y: 1 },
      { X: 1, Y: 6 },
      { X: 2, Y: 9 },
      { X: 3, Y: 10 },
      { X: 4, Y: 9 },
      { X: 5, Y: 6 },
      { X: 6, Y: 1 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.quadratic).not.toBeNull();
    expect(result!.recommendedFit).toBe('quadratic');
    expect(result!.quadratic!.a).toBeLessThan(0); // Concave down
    expect(result!.quadratic!.optimumX).toBeCloseTo(3, 1);
    expect(result!.quadratic!.optimumType).toBe('peak');
  });

  it('should generate insight for positive relationship', () => {
    const data = [
      { Speed: 10, Output: 100 },
      { Speed: 20, Output: 150 },
      { Speed: 30, Output: 200 },
      { Speed: 40, Output: 250 },
    ];

    const result = calculateRegression(data, 'Speed', 'Output');

    expect(result).not.toBeNull();
    expect(result!.insight).toContain('higher');
  });

  it('should generate insight for negative relationship', () => {
    const data = [
      { Temperature: 10, Viscosity: 100 },
      { Temperature: 20, Viscosity: 80 },
      { Temperature: 30, Viscosity: 60 },
      { Temperature: 40, Viscosity: 40 },
    ];

    const result = calculateRegression(data, 'Temperature', 'Viscosity');

    expect(result).not.toBeNull();
    expect(result!.insight).toContain('lower');
  });

  it('should generate insight for optimum point', () => {
    // Parabola with clear optimum
    const data = [
      { X: 0, Y: 10 },
      { X: 1, Y: 8 },
      { X: 2, Y: 5 },
      { X: 3, Y: 5 },
      { X: 4, Y: 8 },
      { X: 5, Y: 10 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    if (result!.recommendedFit === 'quadratic') {
      expect(result!.insight).toMatch(/optimum|minimum/i);
    }
  });

  it('should return null for insufficient data', () => {
    const data = [
      { X: 1, Y: 5 },
      { X: 2, Y: 10 },
    ];

    const result = calculateRegression(data, 'X', 'Y');
    expect(result).toBeNull();
  });

  it('should return null for empty data', () => {
    const result = calculateRegression([], 'X', 'Y');
    expect(result).toBeNull();
  });

  it('should return null for missing columns', () => {
    const data = [
      { X: 1, Y: 5 },
      { X: 2, Y: 10 },
      { X: 3, Y: 15 },
    ];

    const result = calculateRegression(data, 'Missing', 'Y');
    expect(result).toBeNull();
  });

  it('should handle constant Y values', () => {
    const data = [
      { X: 1, Y: 10 },
      { X: 2, Y: 10 },
      { X: 3, Y: 10 },
      { X: 4, Y: 10 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.linear.slope).toBeCloseTo(0, 5);
    expect(result!.recommendedFit).toBe('none');
  });

  it('should provide data points in result', () => {
    const data = [
      { X: 1, Y: 3 },
      { X: 2, Y: 5 },
      { X: 3, Y: 7 },
    ];

    const result = calculateRegression(data, 'X', 'Y');

    expect(result).not.toBeNull();
    expect(result!.points).toHaveLength(3);
    expect(result!.points[0]).toEqual({ x: 1, y: 3 });
    expect(result!.n).toBe(3);
  });

  it('should assign correct strength ratings', () => {
    // Test R² = 0.95 -> 5 stars
    const strongData = [
      { X: 1, Y: 1.0 },
      { X: 2, Y: 2.1 },
      { X: 3, Y: 2.9 },
      { X: 4, Y: 4.0 },
      { X: 5, Y: 5.1 },
    ];

    const strongResult = calculateRegression(strongData, 'X', 'Y');
    expect(strongResult).not.toBeNull();
    expect(strongResult!.linear.rSquared).toBeGreaterThan(0.9);
    expect(strongResult!.strengthRating).toBe(5);
  });
});

describe('Gage R&R', () => {
  // Standard Gage R&R study: 3 operators, 5 parts, 2 replicates
  const standardStudy = [
    // Operator A
    { Part: '1', Operator: 'A', Measurement: 10.1 },
    { Part: '1', Operator: 'A', Measurement: 10.2 },
    { Part: '2', Operator: 'A', Measurement: 12.0 },
    { Part: '2', Operator: 'A', Measurement: 12.1 },
    { Part: '3', Operator: 'A', Measurement: 15.0 },
    { Part: '3', Operator: 'A', Measurement: 15.1 },
    // Operator B
    { Part: '1', Operator: 'B', Measurement: 10.0 },
    { Part: '1', Operator: 'B', Measurement: 10.3 },
    { Part: '2', Operator: 'B', Measurement: 12.2 },
    { Part: '2', Operator: 'B', Measurement: 12.0 },
    { Part: '3', Operator: 'B', Measurement: 15.2 },
    { Part: '3', Operator: 'B', Measurement: 15.0 },
    // Operator C
    { Part: '1', Operator: 'C', Measurement: 10.1 },
    { Part: '1', Operator: 'C', Measurement: 10.1 },
    { Part: '2', Operator: 'C', Measurement: 12.1 },
    { Part: '2', Operator: 'C', Measurement: 12.1 },
    { Part: '3', Operator: 'C', Measurement: 15.1 },
    { Part: '3', Operator: 'C', Measurement: 15.0 },
  ];

  it('should calculate correct study dimensions', () => {
    const result = calculateGageRR(standardStudy, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    expect(result!.partCount).toBe(3);
    expect(result!.operatorCount).toBe(3);
    expect(result!.replicates).toBe(2);
    expect(result!.totalMeasurements).toBe(18);
  });

  it('should detect excellent measurement system', () => {
    // Study with low measurement variation, high part variation
    const excellentData = [
      { Part: '1', Operator: 'A', Measurement: 10.0 },
      { Part: '1', Operator: 'A', Measurement: 10.01 },
      { Part: '2', Operator: 'A', Measurement: 50.0 },
      { Part: '2', Operator: 'A', Measurement: 50.01 },
      { Part: '1', Operator: 'B', Measurement: 10.0 },
      { Part: '1', Operator: 'B', Measurement: 10.01 },
      { Part: '2', Operator: 'B', Measurement: 50.0 },
      { Part: '2', Operator: 'B', Measurement: 50.01 },
    ];

    const result = calculateGageRR(excellentData, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    expect(result!.pctGRR).toBeLessThan(10);
    expect(result!.verdict).toBe('excellent');
  });

  it('should detect unacceptable measurement system', () => {
    // Study with high measurement variation, low part variation
    const poorData = [
      { Part: '1', Operator: 'A', Measurement: 10.0 },
      { Part: '1', Operator: 'A', Measurement: 15.0 }, // 50% variation within operator!
      { Part: '2', Operator: 'A', Measurement: 11.0 },
      { Part: '2', Operator: 'A', Measurement: 16.0 },
      { Part: '1', Operator: 'B', Measurement: 8.0 },
      { Part: '1', Operator: 'B', Measurement: 13.0 },
      { Part: '2', Operator: 'B', Measurement: 9.0 },
      { Part: '2', Operator: 'B', Measurement: 14.0 },
    ];

    const result = calculateGageRR(poorData, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    expect(result!.pctGRR).toBeGreaterThan(30);
    expect(result!.verdict).toBe('unacceptable');
  });

  it('should calculate interaction data for plot', () => {
    const result = calculateGageRR(standardStudy, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    expect(result!.interactionData).toHaveLength(9); // 3 parts × 3 operators

    // Check first interaction point
    const part1OpA = result!.interactionData.find(d => d.part === '1' && d.operator === 'A');
    expect(part1OpA).toBeDefined();
    expect(part1OpA!.mean).toBeCloseTo(10.15, 2); // (10.1 + 10.2) / 2
  });

  it('should return null for insufficient data', () => {
    // Only 1 replicate
    const singleReplicate = [
      { Part: '1', Operator: 'A', Measurement: 10.0 },
      { Part: '2', Operator: 'A', Measurement: 12.0 },
      { Part: '1', Operator: 'B', Measurement: 10.1 },
      { Part: '2', Operator: 'B', Measurement: 12.1 },
    ];

    const result = calculateGageRR(singleReplicate, 'Part', 'Operator', 'Measurement');
    expect(result).toBeNull();
  });

  it('should return null for single part', () => {
    const singlePart = [
      { Part: '1', Operator: 'A', Measurement: 10.0 },
      { Part: '1', Operator: 'A', Measurement: 10.1 },
      { Part: '1', Operator: 'B', Measurement: 10.0 },
      { Part: '1', Operator: 'B', Measurement: 10.1 },
    ];

    const result = calculateGageRR(singlePart, 'Part', 'Operator', 'Measurement');
    expect(result).toBeNull();
  });

  it('should return null for single operator', () => {
    const singleOperator = [
      { Part: '1', Operator: 'A', Measurement: 10.0 },
      { Part: '1', Operator: 'A', Measurement: 10.1 },
      { Part: '2', Operator: 'A', Measurement: 12.0 },
      { Part: '2', Operator: 'A', Measurement: 12.1 },
    ];

    const result = calculateGageRR(singleOperator, 'Part', 'Operator', 'Measurement');
    expect(result).toBeNull();
  });

  it('should return null for empty data', () => {
    const result = calculateGageRR([], 'Part', 'Operator', 'Measurement');
    expect(result).toBeNull();
  });

  it('should handle missing columns gracefully', () => {
    const result = calculateGageRR(standardStudy, 'MissingColumn', 'Operator', 'Measurement');
    expect(result).toBeNull();
  });

  it('should calculate reproducibility as sum of operator and interaction', () => {
    const result = calculateGageRR(standardStudy, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    // Reproducibility = Operator variance + Interaction variance
    expect(result!.varReproducibility).toBeCloseTo(
      result!.varOperator + result!.varInteraction,
      10
    );
  });

  it('should calculate GRR as sum of repeatability and reproducibility', () => {
    const result = calculateGageRR(standardStudy, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    // GRR = Repeatability + Reproducibility
    expect(result!.varGRR).toBeCloseTo(result!.varRepeatability + result!.varReproducibility, 10);
  });

  it('should have total variance equal to Part + GRR', () => {
    const result = calculateGageRR(standardStudy, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();
    // Total = Part + GRR
    expect(result!.varTotal).toBeCloseTo(result!.varPart + result!.varGRR, 10);
  });

  it('should have percentages based on standard deviations', () => {
    const result = calculateGageRR(standardStudy, 'Part', 'Operator', 'Measurement');

    expect(result).not.toBeNull();

    // %GRR = σ_GRR / σ_Total × 100
    const expectedPctGRR = (Math.sqrt(result!.varGRR) / Math.sqrt(result!.varTotal)) * 100;
    expect(result!.pctGRR).toBeCloseTo(expectedPctGRR, 5);
  });
});
