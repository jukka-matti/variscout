import { describe, it, expect } from 'vitest';
import { getChartType } from '../EdgeMiniChart';

describe('EdgeMiniChart', () => {
  describe('getChartType', () => {
    it('returns boxplot for categorical × categorical', () => {
      expect(getChartType('categorical', 'categorical')).toBe('boxplot');
    });

    it('returns scatter for continuous × continuous', () => {
      expect(getChartType('continuous', 'continuous')).toBe('scatter');
    });

    it('returns boxplot for categorical × continuous (mixed)', () => {
      expect(getChartType('categorical', 'continuous')).toBe('boxplot');
    });

    it('returns boxplot for continuous × categorical (mixed)', () => {
      expect(getChartType('continuous', 'categorical')).toBe('boxplot');
    });
  });
});
