import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BoxplotBase, MIN_BOXPLOT_VALUES } from '../Boxplot';
import type { BoxplotGroupData } from '../types';

/** Helper to create a BoxplotGroupData entry with N values */
function makeGroup(key: string, values: number[]): BoxplotGroupData {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = sorted[Math.floor(n * 0.25)] ?? min;
  const median = sorted[Math.floor(n * 0.5)] ?? mean;
  const q3 = sorted[Math.floor(n * 0.75)] ?? max;
  return { key, values: sorted, min, q1, median, q3, max, mean, outliers: [] };
}

const defaultProps = {
  parentWidth: 600,
  parentHeight: 400,
  specs: { usl: 20, lsl: 0 },
  showBranding: false,
};

describe('Boxplot dot fallback', () => {
  it('exports MIN_BOXPLOT_VALUES as 7', () => {
    expect(MIN_BOXPLOT_VALUES).toBe(7);
  });

  it('renders dots for categories with < 7 values', () => {
    const data = [makeGroup('Small', [1, 2, 3, 4, 5])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    // Should have dot-fallback elements, one per value
    const dots = container.querySelectorAll('[data-testid^="dot-fallback-Small-"]');
    expect(dots.length).toBe(5);

    // Should NOT have a boxplot-box
    const box = container.querySelector('[data-testid="boxplot-box-Small"]');
    expect(box).toBeNull();
  });

  it('renders standard box for categories with >= 7 values', () => {
    const data = [makeGroup('Large', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    // Should have boxplot-box
    const box = container.querySelector('[data-testid="boxplot-box-Large"]');
    expect(box).not.toBeNull();

    // Should NOT have dot-fallback elements
    const dots = container.querySelectorAll('[data-testid^="dot-fallback-Large-"]');
    expect(dots.length).toBe(0);
  });

  it('handles mixed categories (some dots, some boxes)', () => {
    const data = [makeGroup('Few', [2, 4, 6]), makeGroup('Many', [1, 2, 3, 4, 5, 6, 7, 8])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    // Few: dots
    const fewDots = container.querySelectorAll('[data-testid^="dot-fallback-Few-"]');
    expect(fewDots.length).toBe(3);
    const fewBox = container.querySelector('[data-testid="boxplot-box-Few"]');
    expect(fewBox).toBeNull();

    // Many: box
    const manyBox = container.querySelector('[data-testid="boxplot-box-Many"]');
    expect(manyBox).not.toBeNull();
    const manyDots = container.querySelectorAll('[data-testid^="dot-fallback-Many-"]');
    expect(manyDots.length).toBe(0);
  });

  it('renders exactly 7 boundary — should use box, not dots', () => {
    const data = [makeGroup('Boundary', [1, 2, 3, 4, 5, 6, 7])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    const box = container.querySelector('[data-testid="boxplot-box-Boundary"]');
    expect(box).not.toBeNull();

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-Boundary-"]');
    expect(dots.length).toBe(0);
  });

  it('dot fallback still renders mean diamond', () => {
    const data = [makeGroup('Tiny', [3, 5, 8])];
    const { container } = render(<BoxplotBase data={data} {...defaultProps} />);

    // Should have dots
    const dots = container.querySelectorAll('[data-testid^="dot-fallback-Tiny-"]');
    expect(dots.length).toBe(3);

    // Each dot should be a circle element
    for (const dot of dots) {
      expect(dot.tagName.toLowerCase()).toBe('circle');
    }
  });

  it('applies highlight colors to dots when highlightedCategories is set', () => {
    const data = [makeGroup('Highlighted', [1, 5, 10])];
    const { container } = render(
      <BoxplotBase data={data} {...defaultProps} highlightedCategories={{ Highlighted: 'red' }} />
    );

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-Highlighted-"]');
    expect(dots.length).toBe(3);
  });
});
