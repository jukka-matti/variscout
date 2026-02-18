import { describe, it, expect } from 'vitest';
import { sortBoxplotData, calculateBoxplotStats, type BoxplotGroupData } from '../index';

function makeGroup(key: string, mean: number, q1: number, q3: number): BoxplotGroupData {
  return {
    key,
    values: [mean],
    min: q1 - 1,
    max: q3 + 1,
    q1,
    median: mean,
    mean,
    q3,
    outliers: [],
    stdDev: 1,
  };
}

describe('sortBoxplotData', () => {
  const groups: BoxplotGroupData[] = [
    makeGroup('Charlie', 10, 8, 12), // IQR = 4
    makeGroup('Alpha', 30, 25, 40), // IQR = 15
    makeGroup('Bravo', 20, 18, 23), // IQR = 5
  ];

  describe('sort by name', () => {
    it('ascending (A→Z)', () => {
      const result = sortBoxplotData(groups, 'name', 'asc');
      expect(result.map(d => d.key)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });

    it('descending (Z→A)', () => {
      const result = sortBoxplotData(groups, 'name', 'desc');
      expect(result.map(d => d.key)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });
  });

  describe('sort by mean', () => {
    it('ascending (lowest first)', () => {
      const result = sortBoxplotData(groups, 'mean', 'asc');
      expect(result.map(d => d.key)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('descending (highest first)', () => {
      const result = sortBoxplotData(groups, 'mean', 'desc');
      expect(result.map(d => d.key)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });
  });

  describe('sort by spread (IQR)', () => {
    it('ascending (tightest first)', () => {
      const result = sortBoxplotData(groups, 'spread', 'asc');
      expect(result.map(d => d.key)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('descending (widest first)', () => {
      const result = sortBoxplotData(groups, 'spread', 'desc');
      expect(result.map(d => d.key)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });
  });

  describe('edge cases', () => {
    it('empty array returns empty array', () => {
      expect(sortBoxplotData([], 'name', 'asc')).toEqual([]);
    });

    it('single item returns same item', () => {
      const single = [makeGroup('Only', 5, 3, 7)];
      const result = sortBoxplotData(single, 'mean', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('Only');
    });

    it('equal values preserve relative order (stable sort)', () => {
      const equalMeans = [
        makeGroup('B', 10, 8, 12),
        makeGroup('A', 10, 6, 14),
        makeGroup('C', 10, 9, 11),
      ];
      const result = sortBoxplotData(equalMeans, 'mean', 'asc');
      // All have same mean — stable sort preserves input order
      expect(result.map(d => d.key)).toEqual(['B', 'A', 'C']);
    });

    it('does not mutate the original array', () => {
      const original = [...groups];
      sortBoxplotData(groups, 'mean', 'desc');
      expect(groups.map(d => d.key)).toEqual(original.map(d => d.key));
    });

    it('defaults to name ascending when no args', () => {
      const result = sortBoxplotData(groups);
      expect(result.map(d => d.key)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });
  });

  describe('integration with calculateBoxplotStats', () => {
    it('sorts real boxplot data', () => {
      const data: BoxplotGroupData[] = [
        calculateBoxplotStats({ group: 'Z-line', values: [5, 6, 7, 8, 9] }),
        calculateBoxplotStats({ group: 'A-line', values: [20, 25, 30, 35, 40] }),
        calculateBoxplotStats({ group: 'M-line', values: [10, 12, 14, 16, 18] }),
      ];

      const byName = sortBoxplotData(data, 'name', 'asc');
      expect(byName.map(d => d.key)).toEqual(['A-line', 'M-line', 'Z-line']);

      const byMeanDesc = sortBoxplotData(data, 'mean', 'desc');
      expect(byMeanDesc[0].key).toBe('A-line');
      expect(byMeanDesc[2].key).toBe('Z-line');
    });
  });
});
