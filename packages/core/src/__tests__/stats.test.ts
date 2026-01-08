import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  calculateAnova,
  calculateRegression,
  calculateGageRR,
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
} from '../stats';

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

describe('Stage Order Detection', () => {
  it('should preserve first occurrence order for text stages', () => {
    const stages = ['Before', 'After', 'Before', 'During', 'After'];
    const order = determineStageOrder(stages);

    expect(order).toEqual(['Before', 'After', 'During']);
  });

  it('should sort numeric stages numerically', () => {
    const stages = ['3', '1', '2', '1', '3'];
    const order = determineStageOrder(stages);

    expect(order).toEqual(['1', '2', '3']);
  });

  it('should sort "Stage N" patterns numerically', () => {
    const stages = ['Stage 3', 'Stage 1', 'Stage 2'];
    const order = determineStageOrder(stages);

    expect(order).toEqual(['Stage 1', 'Stage 2', 'Stage 3']);
  });

  it('should sort "Batch N" patterns numerically', () => {
    const stages = ['Batch 10', 'Batch 2', 'Batch 1'];
    const order = determineStageOrder(stages);

    expect(order).toEqual(['Batch 1', 'Batch 2', 'Batch 10']);
  });

  it('should sort "Phase N" patterns numerically', () => {
    const stages = ['Phase 2', 'Phase 1', 'Phase 3'];
    const order = determineStageOrder(stages);

    expect(order).toEqual(['Phase 1', 'Phase 2', 'Phase 3']);
  });

  it('should respect explicit first-occurrence mode', () => {
    const stages = ['3', '1', '2'];
    const order = determineStageOrder(stages, 'first-occurrence');

    expect(order).toEqual(['3', '1', '2']);
  });

  it('should respect explicit alphabetical mode', () => {
    const stages = ['Charlie', 'Alpha', 'Bravo'];
    const order = determineStageOrder(stages, 'alphabetical');

    expect(order).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('should sort numbers in alphabetical mode numerically', () => {
    const stages = ['10', '2', '1'];
    const order = determineStageOrder(stages, 'alphabetical');

    expect(order).toEqual(['1', '2', '10']);
  });

  it('should handle empty array', () => {
    const order = determineStageOrder([]);
    expect(order).toEqual([]);
  });

  it('should handle single stage', () => {
    const order = determineStageOrder(['Only']);
    expect(order).toEqual(['Only']);
  });
});

describe('Sort Data by Stage', () => {
  it('should group data by stage while preserving within-stage order', () => {
    const data = [
      { id: 1, stage: 'B', value: 10 },
      { id: 2, stage: 'A', value: 20 },
      { id: 3, stage: 'B', value: 30 },
      { id: 4, stage: 'A', value: 40 },
    ];

    const sorted = sortDataByStage(data, 'stage', ['A', 'B']);

    expect(sorted.map(d => d.id)).toEqual([2, 4, 1, 3]);
  });

  it('should handle interleaved stages correctly', () => {
    const data = [
      { id: 1, stage: 'A' },
      { id: 2, stage: 'B' },
      { id: 3, stage: 'A' },
      { id: 4, stage: 'B' },
      { id: 5, stage: 'A' },
    ];

    const sorted = sortDataByStage(data, 'stage', ['A', 'B']);

    // All A's first (preserving order), then all B's
    expect(sorted.map(d => d.id)).toEqual([1, 3, 5, 2, 4]);
  });

  it('should put unknown stages at the end', () => {
    const data = [
      { id: 1, stage: 'Unknown' },
      { id: 2, stage: 'A' },
      { id: 3, stage: 'B' },
    ];

    const sorted = sortDataByStage(data, 'stage', ['A', 'B']);

    expect(sorted.map(d => d.id)).toEqual([2, 3, 1]);
  });

  it('should handle empty data', () => {
    const sorted = sortDataByStage([], 'stage', ['A', 'B']);
    expect(sorted).toEqual([]);
  });

  it('should handle empty stage order', () => {
    const data = [{ id: 1, stage: 'A' }];
    const sorted = sortDataByStage(data, 'stage', []);

    expect(sorted).toEqual([{ id: 1, stage: 'A' }]);
  });

  it('should not mutate original data', () => {
    const data = [
      { id: 1, stage: 'B' },
      { id: 2, stage: 'A' },
    ];
    const original = [...data];

    sortDataByStage(data, 'stage', ['A', 'B']);

    expect(data).toEqual(original);
  });
});

describe('Calculate Stats by Stage', () => {
  const stageData = [
    { batch: 'Batch 1', weight: 10 },
    { batch: 'Batch 1', weight: 11 },
    { batch: 'Batch 1', weight: 12 },
    { batch: 'Batch 2', weight: 20 },
    { batch: 'Batch 2', weight: 21 },
    { batch: 'Batch 2', weight: 22 },
    { batch: 'Batch 3', weight: 30 },
    { batch: 'Batch 3', weight: 31 },
    { batch: 'Batch 3', weight: 32 },
  ];

  it('should calculate stats for each stage', () => {
    const result = calculateStatsByStage(stageData, 'weight', 'batch', {});

    expect(result).not.toBeNull();
    expect(result!.stages.size).toBe(3);
    expect(result!.stageOrder).toEqual(['Batch 1', 'Batch 2', 'Batch 3']);

    const batch1 = result!.stages.get('Batch 1');
    expect(batch1).toBeDefined();
    expect(batch1!.mean).toBeCloseTo(11, 1);

    const batch2 = result!.stages.get('Batch 2');
    expect(batch2).toBeDefined();
    expect(batch2!.mean).toBeCloseTo(21, 1);
  });

  it('should calculate separate control limits per stage', () => {
    const result = calculateStatsByStage(stageData, 'weight', 'batch', {});

    expect(result).not.toBeNull();

    const batch1 = result!.stages.get('Batch 1');
    const batch2 = result!.stages.get('Batch 2');

    // Each stage should have its own UCL/LCL
    expect(batch1!.ucl).not.toBeCloseTo(batch2!.ucl, 0);
    expect(batch1!.lcl).not.toBeCloseTo(batch2!.lcl, 0);
  });

  it('should calculate overall stats for reference', () => {
    const result = calculateStatsByStage(stageData, 'weight', 'batch', {});

    expect(result).not.toBeNull();
    // Overall mean should be (11 + 21 + 31) / 3 * 3 / 9 = 21
    expect(result!.overallStats.mean).toBeCloseTo(21, 1);
  });

  it('should respect spec limits', () => {
    const result = calculateStatsByStage(stageData, 'weight', 'batch', {
      usl: 35,
      lsl: 5,
    });

    expect(result).not.toBeNull();

    const batch1 = result!.stages.get('Batch 1');
    expect(batch1!.cpk).toBeDefined();
  });

  it('should filter out empty stages', () => {
    const dataWithEmpty = [
      { batch: 'A', weight: 10 },
      { batch: 'A', weight: 11 },
      { batch: 'B', weight: NaN }, // Invalid values only
    ];

    const result = calculateStatsByStage(dataWithEmpty, 'weight', 'batch', {});

    expect(result).not.toBeNull();
    expect(result!.stageOrder).toEqual(['A']);
    expect(result!.stages.has('B')).toBe(false);
  });

  it('should return null for empty data', () => {
    const result = calculateStatsByStage([], 'weight', 'batch', {});
    expect(result).toBeNull();
  });

  it('should use provided stage order', () => {
    const result = calculateStatsByStage(
      stageData,
      'weight',
      'batch',
      {},
      ['Batch 3', 'Batch 2', 'Batch 1'] // Reverse order
    );

    expect(result).not.toBeNull();
    expect(result!.stageOrder).toEqual(['Batch 3', 'Batch 2', 'Batch 1']);
  });
});

describe('Get Stage Boundaries', () => {
  it('should calculate correct X boundaries for each stage', () => {
    const data = [
      { x: 0, stage: 'A' },
      { x: 1, stage: 'A' },
      { x: 2, stage: 'A' },
      { x: 3, stage: 'B' },
      { x: 4, stage: 'B' },
      { x: 5, stage: 'C' },
    ];

    const stagedStats = {
      stages: new Map([
        ['A', { mean: 10, stdDev: 1, ucl: 13, lcl: 7, outOfSpecPercentage: 0 }],
        ['B', { mean: 20, stdDev: 1, ucl: 23, lcl: 17, outOfSpecPercentage: 0 }],
        ['C', { mean: 30, stdDev: 1, ucl: 33, lcl: 27, outOfSpecPercentage: 0 }],
      ]),
      stageOrder: ['A', 'B', 'C'],
      overallStats: { mean: 20, stdDev: 5, ucl: 35, lcl: 5, outOfSpecPercentage: 0 },
    };

    const boundaries = getStageBoundaries(data, stagedStats);

    expect(boundaries).toHaveLength(3);

    expect(boundaries[0].name).toBe('A');
    expect(boundaries[0].startX).toBe(0);
    expect(boundaries[0].endX).toBe(2);

    expect(boundaries[1].name).toBe('B');
    expect(boundaries[1].startX).toBe(3);
    expect(boundaries[1].endX).toBe(4);

    expect(boundaries[2].name).toBe('C');
    expect(boundaries[2].startX).toBe(5);
    expect(boundaries[2].endX).toBe(5);
  });

  it('should include stage stats in boundaries', () => {
    const data = [
      { x: 0, stage: 'A' },
      { x: 1, stage: 'A' },
    ];

    const stats = { mean: 15, stdDev: 2, ucl: 21, lcl: 9, outOfSpecPercentage: 0 };
    const stagedStats = {
      stages: new Map([['A', stats]]),
      stageOrder: ['A'],
      overallStats: stats,
    };

    const boundaries = getStageBoundaries(data, stagedStats);

    expect(boundaries[0].stats).toBe(stats);
  });

  it('should skip stages with no data points', () => {
    const data = [{ x: 0, stage: 'A' }];

    const stagedStats = {
      stages: new Map([
        ['A', { mean: 10, stdDev: 1, ucl: 13, lcl: 7, outOfSpecPercentage: 0 }],
        ['B', { mean: 20, stdDev: 1, ucl: 23, lcl: 17, outOfSpecPercentage: 0 }],
      ]),
      stageOrder: ['A', 'B'],
      overallStats: { mean: 15, stdDev: 5, ucl: 30, lcl: 0, outOfSpecPercentage: 0 },
    };

    const boundaries = getStageBoundaries(data, stagedStats);

    expect(boundaries).toHaveLength(1);
    expect(boundaries[0].name).toBe('A');
  });
});
