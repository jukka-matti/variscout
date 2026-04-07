import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getChartType, EdgeMiniChart } from '../EdgeMiniChart';

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

  describe('rendering', () => {
    it('renders an SVG element with scatter data', () => {
      const { container } = render(
        <EdgeMiniChart
          factorA="Temperature"
          factorB="Pressure"
          factorAType="continuous"
          factorBType="continuous"
          data={[
            { Temperature: 20, Pressure: 100 },
            { Temperature: 25, Pressure: 110 },
            { Temperature: 30, Pressure: 120 },
          ]}
          outcomeColumn="Weight"
          isDark={false}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders an SVG element with boxplot data', () => {
      const { container } = render(
        <EdgeMiniChart
          factorA="Machine"
          factorB="Shift"
          factorAType="categorical"
          factorBType="categorical"
          data={[
            { Machine: 'A', Shift: 'Day', Weight: 100 },
            { Machine: 'A', Shift: 'Day', Weight: 102 },
            { Machine: 'A', Shift: 'Night', Weight: 98 },
            { Machine: 'B', Shift: 'Day', Weight: 105 },
            { Machine: 'B', Shift: 'Day', Weight: 107 },
          ]}
          outcomeColumn="Weight"
          isDark={false}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('returns null when data is insufficient for scatter', () => {
      const { container } = render(
        <EdgeMiniChart
          factorA="Temperature"
          factorB="Pressure"
          factorAType="continuous"
          factorBType="continuous"
          data={[{ Temperature: 20, Pressure: 100 }]}
          outcomeColumn="Weight"
          isDark={false}
        />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeNull();
    });
  });
});
