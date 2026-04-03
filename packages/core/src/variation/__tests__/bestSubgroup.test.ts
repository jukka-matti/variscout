import { describe, it, expect } from 'vitest';
import { findBestSubgroup, findTightestSubgroup } from '../bestSubgroup';
import type { CategoryStats } from '../types';

const categories: CategoryStats[] = [
  { value: 'Day', mean: 13.0, stdDev: 0.8, count: 200, contributionPct: 40 },
  { value: 'Night', mean: 15.2, stdDev: 1.4, count: 180, contributionPct: 35 },
  { value: 'Evening', mean: 14.0, stdDev: 1.0, count: 150, contributionPct: 25 },
];

describe('findBestSubgroup', () => {
  it('should find lowest mean for smaller-is-better', () => {
    const best = findBestSubgroup(categories, 'smaller');
    expect(best.value).toBe('Day');
  });

  it('should find highest mean for larger-is-better', () => {
    const best = findBestSubgroup(categories, 'larger');
    expect(best.value).toBe('Night');
  });

  it('should find closest to target for nominal', () => {
    const best = findBestSubgroup(categories, 'nominal', 14.0);
    expect(best.value).toBe('Evening');
  });

  it('should find closest to spec midpoint when nominal and no target', () => {
    const best = findBestSubgroup(categories, 'nominal', undefined, { usl: 16, lsl: 12 });
    expect(best.value).toBe('Evening'); // midpoint = 14.0
  });

  it('should default to first category mean when nominal and no target or specs', () => {
    const best = findBestSubgroup(categories, 'nominal');
    expect(best.value).toBe('Day'); // closest to first category mean 13.0
  });

  it('should return the only category if only one', () => {
    const best = findBestSubgroup([categories[0]], 'nominal');
    expect(best.value).toBe('Day');
  });

  it('should throw for empty array', () => {
    expect(() => findBestSubgroup([], 'nominal')).toThrow();
  });
});

describe('findTightestSubgroup', () => {
  it('should find lowest stdDev', () => {
    const tightest = findTightestSubgroup(categories);
    expect(tightest.value).toBe('Day');
  });

  it('should throw for empty array', () => {
    expect(() => findTightestSubgroup([])).toThrow();
  });
});
