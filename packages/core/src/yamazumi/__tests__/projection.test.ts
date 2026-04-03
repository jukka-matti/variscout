import { describe, it, expect } from 'vitest';
import { projectWasteElimination, projectVAImprovement } from '../projection';

describe('projectWasteElimination', () => {
  it('should reduce cycle time by waste amount', () => {
    const result = projectWasteElimination(45, 12, 35);
    expect(result.projectedCycleTime).toBe(33);
    expect(result.currentCycleTime).toBe(45);
    expect(result.meetsTakt).toBe(true);
  });

  it('should not meet takt if remaining time exceeds it', () => {
    const result = projectWasteElimination(45, 5, 35);
    expect(result.projectedCycleTime).toBe(40);
    expect(result.meetsTakt).toBe(false);
  });

  it('should always meet takt when no takt time specified', () => {
    const result = projectWasteElimination(45, 12);
    expect(result.projectedCycleTime).toBe(33);
    expect(result.meetsTakt).toBe(true);
  });

  it('should handle zero waste elimination', () => {
    const result = projectWasteElimination(45, 0, 35);
    expect(result.projectedCycleTime).toBe(45);
    expect(result.meetsTakt).toBe(false);
  });

  it('should compute VA ratio correctly', () => {
    // 45s total, 12s waste → 33s non-waste. VA ratio before = 33/45
    // After removing 12s waste → 33s total. VA ratio after = 33/33 = 1.0
    const result = projectWasteElimination(45, 12, 35);
    expect(result.currentVARatio).toBeCloseTo(33 / 45, 3);
    expect(result.projectedVARatio).toBe(1.0);
  });
});

describe('projectVAImprovement', () => {
  it('should improve VA ratio by reducing waste', () => {
    // 26s VA + 7s NVA required + 12s waste = 45s. VA ratio = 26/45 ≈ 0.578
    // Remove all 12s waste → 33s. VA ratio = 26/33 ≈ 0.788
    const result = projectVAImprovement(26, 7, 12, 12);
    expect(result.projectedVARatio).toBeCloseTo(26 / 33, 3);
    expect(result.projectedWaste).toBe(0);
    expect(result.projectedCycleTime).toBe(33);
  });

  it('should handle partial waste reduction', () => {
    const result = projectVAImprovement(26, 7, 12, 6);
    expect(result.projectedWaste).toBe(6);
    expect(result.projectedCycleTime).toBe(39);
    expect(result.projectedVARatio).toBeCloseTo(26 / 39, 3);
  });

  it('should not reduce waste below zero', () => {
    const result = projectVAImprovement(26, 7, 12, 20);
    expect(result.projectedWaste).toBe(0);
    expect(result.projectedCycleTime).toBe(33);
  });

  it('should set current values correctly', () => {
    const result = projectVAImprovement(26, 7, 12, 6);
    expect(result.currentCycleTime).toBe(45);
    expect(result.currentWaste).toBe(12);
    expect(result.currentVARatio).toBeCloseTo(26 / 45, 3);
  });

  it('should check takt compliance when provided', () => {
    const result = projectVAImprovement(26, 7, 12, 12, 35);
    expect(result.meetsTakt).toBe(true); // 33s < 35s takt

    const result2 = projectVAImprovement(26, 7, 12, 6, 35);
    expect(result2.meetsTakt).toBe(false); // 39s > 35s takt
  });
});
