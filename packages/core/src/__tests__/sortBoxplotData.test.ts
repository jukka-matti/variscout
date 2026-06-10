import { describe, it, expect } from 'vitest';
import { sortBoxplotData, calculateBoxplotStats, type BoxplotGroupData } from '../index';

// ─── Natural-vocabulary helpers ───────────────────────────────────────────────
function makeWeekdayGroups(): BoxplotGroupData[] {
  // Intentionally scrambled: Fri Mon Thu Tue Wed (alphabetical order)
  return ['Fri', 'Mon', 'Thu', 'Tue', 'Wed'].map(k => makeGroup(k, 10, 8, 12));
}

function makeWeekdayFullGroups(): BoxplotGroupData[] {
  return ['Friday', 'Monday', 'Thursday', 'Tuesday', 'Wednesday'].map(k => makeGroup(k, 10, 8, 12));
}

function makeMonthGroups(): BoxplotGroupData[] {
  // Scrambled month abbreviations
  return ['Sep', 'Jan', 'Mar', 'Dec', 'Jun'].map(k => makeGroup(k, 10, 8, 12));
}

function makeMonthFullGroups(): BoxplotGroupData[] {
  return ['September', 'January', 'March', 'December', 'June'].map(k => makeGroup(k, 10, 8, 12));
}

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

  describe('natural vocabulary ordering', () => {
    describe('weekday abbreviations', () => {
      it('all-weekday abbr keys sort Mon→Sun (asc)', () => {
        const result = sortBoxplotData(makeWeekdayGroups(), 'name', 'asc');
        expect(result.map(d => d.key)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      });

      it('all-weekday abbr keys sort Sun→Mon (desc)', () => {
        const result = sortBoxplotData(makeWeekdayGroups(), 'name', 'desc');
        expect(result.map(d => d.key)).toEqual(['Fri', 'Thu', 'Wed', 'Tue', 'Mon']);
      });

      it('full weekday names sort Mon→Sun (asc)', () => {
        const result = sortBoxplotData(makeWeekdayFullGroups(), 'name', 'asc');
        expect(result.map(d => d.key)).toEqual([
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ]);
      });

      it('Mon–Fri subset sorts naturally', () => {
        const subset = ['Fri', 'Wed', 'Mon', 'Tue', 'Thu'].map(k => makeGroup(k, 10, 8, 12));
        const result = sortBoxplotData(subset, 'name', 'asc');
        expect(result.map(d => d.key)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      });
    });

    describe('month abbreviations and full names', () => {
      it('month abbr subset sorts Jan→Dec (asc)', () => {
        const result = sortBoxplotData(makeMonthGroups(), 'name', 'asc');
        expect(result.map(d => d.key)).toEqual(['Jan', 'Mar', 'Jun', 'Sep', 'Dec']);
      });

      it('month abbr desc reverses natural order', () => {
        const result = sortBoxplotData(makeMonthGroups(), 'name', 'desc');
        expect(result.map(d => d.key)).toEqual(['Dec', 'Sep', 'Jun', 'Mar', 'Jan']);
      });

      it('full month names sort Jan→Dec (asc)', () => {
        const result = sortBoxplotData(makeMonthFullGroups(), 'name', 'asc');
        expect(result.map(d => d.key)).toEqual([
          'January',
          'March',
          'June',
          'September',
          'December',
        ]);
      });
    });

    describe('fallback behaviour', () => {
      it('one non-member key among weekdays falls back to localeCompare', () => {
        // 'Fri', 'Mon', 'UNKNOWN' — not all members → localeCompare
        const mixed = ['Fri', 'Mon', 'UNKNOWN'].map(k => makeGroup(k, 10, 8, 12));
        const result = sortBoxplotData(mixed, 'name', 'asc');
        // localeCompare asc: Fri < Mon < UNKNOWN
        expect(result.map(d => d.key)).toEqual(['Fri', 'Mon', 'UNKNOWN']);
      });

      it('composite "·" keys unaffected (localeCompare fallback)', () => {
        const composite = ['Station 2 · After', 'Station 1 · Before'].map(k =>
          makeGroup(k, 10, 8, 12)
        );
        const result = sortBoxplotData(composite, 'name', 'asc');
        expect(result.map(d => d.key)).toEqual(['Station 1 · Before', 'Station 2 · After']);
      });
    });

    describe('non-name sort branches unaffected', () => {
      it('mean sort on weekday keys uses numeric mean, not vocab order', () => {
        const days = [
          makeGroup('Mon', 30, 28, 32),
          makeGroup('Fri', 10, 8, 12),
          makeGroup('Wed', 20, 18, 22),
        ];
        const result = sortBoxplotData(days, 'mean', 'asc');
        expect(result.map(d => d.key)).toEqual(['Fri', 'Wed', 'Mon']);
      });

      it('spread sort on weekday keys uses IQR, not vocab order', () => {
        const days = [
          makeGroup('Mon', 10, 5, 25), // IQR = 20
          makeGroup('Fri', 10, 8, 12), // IQR = 4
          makeGroup('Wed', 10, 7, 17), // IQR = 10
        ];
        const result = sortBoxplotData(days, 'spread', 'asc');
        expect(result.map(d => d.key)).toEqual(['Fri', 'Wed', 'Mon']);
      });
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
