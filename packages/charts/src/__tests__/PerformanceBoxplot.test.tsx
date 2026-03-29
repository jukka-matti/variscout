import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PerformanceBoxplotBase } from '../PerformanceBoxplot';
import { MIN_BOXPLOT_VALUES } from '../Boxplot';
import type { ChannelResult } from '../types';

/** Helper to create a ChannelResult with N values */
function makeChannel(id: string, values: number[]): ChannelResult {
  const n = values.length;
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = n > 0 ? sum / n : 0;
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  return { id, label: id, n, values, mean, stdDev, cpk: 1.0 };
}

const defaultProps = {
  parentWidth: 600,
  parentHeight: 400,
  specs: { usl: 20, lsl: 0 },
  showBranding: false,
};

describe('PerformanceBoxplot dot fallback', () => {
  it('renders dots for channels with < 7 values', () => {
    const channels = [makeChannel('ch1', [2, 4, 6, 8, 10])];
    const { container } = render(<PerformanceBoxplotBase channels={channels} {...defaultProps} />);

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-ch1-"]');
    expect(dots.length).toBe(5);

    // Each dot should be a circle element
    for (const dot of dots) {
      expect(dot.tagName.toLowerCase()).toBe('circle');
    }
  });

  it('renders standard box for channels with >= 7 values', () => {
    const channels = [makeChannel('ch2', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])];
    const { container } = render(<PerformanceBoxplotBase channels={channels} {...defaultProps} />);

    // Should NOT have dot-fallback elements
    const dots = container.querySelectorAll('[data-testid^="dot-fallback-ch2-"]');
    expect(dots.length).toBe(0);
  });

  it('handles mixed channels (some dots, some boxes)', () => {
    const channels = [makeChannel('few', [2, 4, 6]), makeChannel('many', [1, 2, 3, 4, 5, 6, 7, 8])];
    const { container } = render(<PerformanceBoxplotBase channels={channels} {...defaultProps} />);

    // few: dots
    const fewDots = container.querySelectorAll('[data-testid^="dot-fallback-few-"]');
    expect(fewDots.length).toBe(3);

    // many: no dots
    const manyDots = container.querySelectorAll('[data-testid^="dot-fallback-many-"]');
    expect(manyDots.length).toBe(0);
  });

  it('renders exactly 7 boundary - should use box, not dots', () => {
    const channels = [makeChannel('boundary', [1, 2, 3, 4, 5, 6, 7])];
    const { container } = render(<PerformanceBoxplotBase channels={channels} {...defaultProps} />);

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-boundary-"]');
    expect(dots.length).toBe(0);
  });

  it('renders dots for channels with very few values (< 5)', () => {
    const channels = [makeChannel('tiny', [3, 5])];
    const { container } = render(<PerformanceBoxplotBase channels={channels} {...defaultProps} />);

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-tiny-"]');
    expect(dots.length).toBe(2);
  });

  it('uses selected color for dot-fallback when channel is selected', () => {
    const channels = [makeChannel('sel', [1, 3, 5])];
    const { container } = render(
      <PerformanceBoxplotBase channels={channels} selectedMeasure="sel" {...defaultProps} />
    );

    const dots = container.querySelectorAll('[data-testid^="dot-fallback-sel-"]');
    expect(dots.length).toBe(3);
  });

  it('dot fallback uses MIN_BOXPLOT_VALUES threshold of 7', () => {
    expect(MIN_BOXPLOT_VALUES).toBe(7);
  });
});
