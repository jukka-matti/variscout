import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  calculateAnova,
  calculateRegression,
  determineStageOrder,
  sortDataByStage,
  calculateStatsByStage,
  getStageBoundaries,
  calculateProbabilityPlotData,
  normalQuantile,
  getInteractionStrength,
  calculateKDE,
} from '../stats';

describe('Stats Engine', () => {
  it('should calculate basic stats for a normal distribution', () => {
    // Simple dataset: 10, 12, 11, 13, 10
    // Mean: 11.2, StdDev (σ_overall): ~1.303
    // MR = [2, 1, 2, 3], MR̄ = 2.0, σ_within = 2.0/1.128 ≈ 1.773
    const data = [10, 12, 11, 13, 10];
    const stats = calculateStats(data);

    expect(stats.mean).toBeCloseTo(11.2, 1);
    expect(stats.stdDev).toBeCloseTo(1.3, 2);
    // UCL/LCL use σ_within (moving range)
    expect(stats.ucl).toBeCloseTo(11.2 + 3 * (2.0 / 1.128), 1);
    expect(stats.lcl).toBeCloseTo(11.2 - 3 * (2.0 / 1.128), 1);
  });

  it('should calculate Cp and Cpk correctly', () => {
    // Data centered at 10, σ_overall ~= 1
    const data = [9, 10, 11];
    const usl = 13;
    const lsl = 7;
    // σ_within: MR = [1, 1], MR̄ = 1, σ_within = 1/1.128 ≈ 0.887
    // Cp = (13-7)/(6×σ_within) = 6/(6/1.128) = 1.128

    const stats = calculateStats(data, usl, lsl);
    expect(stats.cp).toBeCloseTo(1.128, 2);
    expect(stats.cpk).toBeCloseTo(1.128, 2); // Centered, so Cpk = Cp
  });

  it('should calculate Cpk correctly when off-center', () => {
    // Data centered at 12, σ_overall ~= 1
    // σ_within: MR = [1, 1], σ_within = 1/1.128
    // Cpu = (13-12)/(3×σ_within) = 1.128/3 ≈ 0.376
    const data = [11, 12, 13];
    const usl = 13;
    const lsl = 7;

    const stats = calculateStats(data, usl, lsl);
    expect(stats.cpk).toBeCloseTo(0.376, 2);
  });

  it('should handle one-sided specs', () => {
    const data = [10, 10, 10]; // Sigma is 0, special case?
    // Let's use scattered data
    const scattered = [9, 10, 11];
    const usl = 13;

    const stats = calculateStats(scattered, usl, undefined);
    expect(stats.cp).toBeUndefined(); // Cannot calc Cp with one limit
    // σ_within = 1/1.128, Cpu = (13-10)/(3×σ_within) = 1.128
    expect(stats.cpk).toBeCloseTo(1.128, 1);
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

  it('should respect explicit data-order mode', () => {
    const stages = ['3', '1', '2'];
    const order = determineStageOrder(stages, 'data-order');

    expect(order).toEqual(['3', '1', '2']);
  });

  it('should sort text stages by data order in auto mode', () => {
    const stages = ['Charlie', 'Alpha', 'Bravo'];
    const order = determineStageOrder(stages, 'auto');

    // Non-numeric patterns should preserve data order
    expect(order).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('should keep data-order for numbers when explicitly set', () => {
    const stages = ['10', '2', '1'];
    const order = determineStageOrder(stages, 'data-order');

    // Data order preserved even for numbers when explicitly set
    expect(order).toEqual(['10', '2', '1']);
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

describe('Probability Plot', () => {
  describe('normalQuantile', () => {
    it('should return 0 for p=0.5 (median)', () => {
      expect(normalQuantile(0.5)).toBe(0);
    });

    it('should return correct z-scores for standard percentiles', () => {
      // p=0.025 → z≈-1.96, p=0.975 → z≈+1.96
      expect(normalQuantile(0.025)).toBeCloseTo(-1.96, 2);
      expect(normalQuantile(0.975)).toBeCloseTo(1.96, 2);
      // p=0.1587 → z≈-1.0, p=0.8413 → z≈+1.0
      expect(normalQuantile(0.1587)).toBeCloseTo(-1.0, 1);
      expect(normalQuantile(0.8413)).toBeCloseTo(1.0, 1);
    });

    it('should handle edge cases', () => {
      expect(normalQuantile(0)).toBe(-Infinity);
      expect(normalQuantile(1)).toBe(Infinity);
    });

    it('should be symmetric around 0.5', () => {
      const z1 = normalQuantile(0.1);
      const z2 = normalQuantile(0.9);
      expect(z1).toBeCloseTo(-z2, 5);
    });
  });

  describe('calculateProbabilityPlotData', () => {
    it('should return empty array for empty input', () => {
      expect(calculateProbabilityPlotData([])).toEqual([]);
    });

    it('should filter out invalid values', () => {
      const data = [1, NaN, 2, Infinity, 3, -Infinity, 4];
      const result = calculateProbabilityPlotData(data);
      expect(result).toHaveLength(4);
    });

    it('should sort data ascending', () => {
      const data = [5, 1, 3, 2, 4];
      const result = calculateProbabilityPlotData(data);
      expect(result.map(d => d.value)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should calculate expected percentiles using Median Rank (Benard) formula', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateProbabilityPlotData(data);

      // Median Rank (Benard) formula: p = (i + 1 - 0.3) / (n + 0.4)
      // For i=0, n=5: p = (1 - 0.3) / 5.4 = 0.1296 → 13.0%
      expect(result[0].expectedPercentile).toBeCloseTo(13.0, 1);
      // For i=2 (median): p = (3 - 0.3) / 5.4 = 0.5 → 50%
      expect(result[2].expectedPercentile).toBeCloseTo(50, 1);
      // For i=4: p = (5 - 0.3) / 5.4 = 0.8704 → 87.0%
      expect(result[4].expectedPercentile).toBeCloseTo(87.0, 1);
    });

    it('should calculate 95% CI bounds', () => {
      const data = [10, 12, 14, 16, 18];
      const result = calculateProbabilityPlotData(data);

      // Each point should have CI bounds
      result.forEach(point => {
        expect(point.lowerCI).toBeLessThanOrEqual(point.value);
        expect(point.upperCI).toBeGreaterThanOrEqual(point.value);
      });
    });

    it('should have wider CI at distribution tails', () => {
      const data = Array.from({ length: 20 }, (_, i) => i * 5);
      const result = calculateProbabilityPlotData(data);

      const firstCI = result[0].upperCI - result[0].lowerCI;
      const middleCI = result[10].upperCI - result[10].lowerCI;
      const lastCI = result[19].upperCI - result[19].lowerCI;

      // Tails should have wider CI than middle
      expect(firstCI).toBeGreaterThan(middleCI);
      expect(lastCI).toBeGreaterThan(middleCI);
    });
  });

  describe('getInteractionStrength', () => {
    // Dataset where Temperature × Pressure interact to affect Yield
    const interactionData = (() => {
      const rows: { Temperature: number; Pressure: number; Yield: number; Machine: string }[] = [];
      const temps = [100, 200];
      const pressures = [10, 20];
      const machines = ['A', 'B'];
      // Create interaction: at high temp, high pressure boosts yield much more
      for (let i = 0; i < 40; i++) {
        const temp = temps[i % 2];
        const press = pressures[Math.floor(i / 2) % 2];
        const machine = machines[Math.floor(i / 4) % 2];
        const interaction = temp === 200 && press === 20 ? 15 : 0;
        const noise = Math.sin(i * 137.5) * 2; // deterministic pseudo-random
        const yield_ = 50 + (temp - 100) * 0.1 + press * 0.5 + interaction + noise;
        rows.push({ Temperature: temp, Pressure: press, Yield: yield_, Machine: machine });
      }
      return rows;
    })();

    it('should return non-null for two factors with known interaction', () => {
      const result = getInteractionStrength(interactionData, 'Temperature', 'Pressure', 'Yield');
      expect(result).not.toBeNull();
      expect(result!.factorA).toBe('Temperature');
      expect(result!.factorB).toBe('Pressure');
    });

    it('should have deltaRSquared >= 0', () => {
      const result = getInteractionStrength(interactionData, 'Temperature', 'Pressure', 'Yield');
      expect(result).not.toBeNull();
      expect(result!.deltaRSquared).toBeGreaterThanOrEqual(0);
    });

    it('should have pValue in [0, 1]', () => {
      const result = getInteractionStrength(interactionData, 'Temperature', 'Pressure', 'Yield');
      expect(result).not.toBeNull();
      expect(result!.pValue).toBeGreaterThanOrEqual(0);
      expect(result!.pValue).toBeLessThanOrEqual(1);
    });

    it('should have a numeric standardizedBeta', () => {
      const result = getInteractionStrength(interactionData, 'Temperature', 'Pressure', 'Yield');
      expect(result).not.toBeNull();
      expect(typeof result!.standardizedBeta).toBe('number');
      expect(Number.isFinite(result!.standardizedBeta)).toBe(true);
    });

    it('should return null for empty data', () => {
      const result = getInteractionStrength([], 'Temperature', 'Pressure', 'Yield');
      expect(result).toBeNull();
    });

    it('should return null for single-level factors', () => {
      const singleLevel = [
        { A: 'x', B: 1, Y: 10 },
        { A: 'x', B: 2, Y: 12 },
        { A: 'x', B: 3, Y: 11 },
        { A: 'x', B: 4, Y: 13 },
        { A: 'x', B: 5, Y: 14 },
      ];
      const result = getInteractionStrength(singleLevel, 'A', 'B', 'Y', ['A']);
      expect(result).toBeNull();
    });

    it('should work with categorical columns', () => {
      const result = getInteractionStrength(interactionData, 'Machine', 'Temperature', 'Yield', [
        'Machine',
      ]);
      expect(result).not.toBeNull();
      expect(result!.deltaRSquared).toBeGreaterThanOrEqual(0);
      expect(result!.pValue).toBeGreaterThanOrEqual(0);
      expect(result!.pValue).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // calculateKDE - Kernel Density Estimation
  // ============================================================================
  describe('calculateKDE', () => {
    it('should return empty array for fewer than 2 values', () => {
      expect(calculateKDE([])).toEqual([]);
      expect(calculateKDE([5])).toEqual([]);
    });

    it('should return the requested number of points', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = calculateKDE(values, 30);
      expect(result).toHaveLength(30);
    });

    it('should default to 100 points', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = calculateKDE(values);
      expect(result).toHaveLength(100);
    });

    it('should return { value, count } objects with non-negative density', () => {
      const values = [10, 12, 11, 13, 10, 14, 9, 11, 12, 10];
      const result = calculateKDE(values);
      for (const point of result) {
        expect(point).toHaveProperty('value');
        expect(point).toHaveProperty('count');
        expect(typeof point.value).toBe('number');
        expect(typeof point.count).toBe('number');
        expect(point.count).toBeGreaterThanOrEqual(0);
      }
    });

    it('should peak near the mean for a normal-like distribution', () => {
      // Values centered around 50
      const values = [48, 49, 49, 50, 50, 50, 50, 51, 51, 52];
      const result = calculateKDE(values, 100);

      // Find the peak
      let peakIdx = 0;
      for (let i = 1; i < result.length; i++) {
        if (result[i].count > result[peakIdx].count) peakIdx = i;
      }
      // Peak should be near 50
      expect(result[peakIdx].value).toBeCloseTo(50, 0);
    });

    it('should show two peaks for bimodal data', () => {
      // Two clusters: around 20 and around 80
      const values = [18, 19, 20, 20, 21, 22, 78, 79, 80, 80, 81, 82];
      const result = calculateKDE(values, 100);

      // Find local maxima
      const peaks: number[] = [];
      for (let i = 1; i < result.length - 1; i++) {
        if (result[i].count > result[i - 1].count && result[i].count > result[i + 1].count) {
          peaks.push(result[i].value);
        }
      }
      expect(peaks.length).toBeGreaterThanOrEqual(2);
      // First peak near 20, second near 80
      expect(peaks[0]).toBeCloseTo(20, -1);
      expect(peaks[peaks.length - 1]).toBeCloseTo(80, -1);
    });

    it('should handle zero variance (all identical values)', () => {
      const values = [5, 5, 5, 5, 5];
      const result = calculateKDE(values);
      // Should not crash; returns points (density may be narrow spike)
      expect(result.length).toBeGreaterThan(0);
      for (const point of result) {
        expect(isFinite(point.count)).toBe(true);
      }
    });

    it('should handle two identical values', () => {
      const values = [10, 10];
      const result = calculateKDE(values);
      expect(result.length).toBeGreaterThan(0);
      for (const point of result) {
        expect(isFinite(point.count)).toBe(true);
      }
    });

    it('should span 3 bandwidths beyond data range (R/ggplot2 standard)', () => {
      const values = [10, 20, 30, 40, 50];
      const result = calculateKDE(values);
      // First point should be well below min, last well above max (3h extension)
      expect(result[0].value).toBeLessThan(10);
      expect(result[result.length - 1].value).toBeGreaterThan(50);
      // With 3h extension, tails should extend significantly — density near zero at edges
      expect(result[0].count).toBeLessThan(0.01);
      expect(result[result.length - 1].count).toBeLessThan(0.01);
    });
  });
});
