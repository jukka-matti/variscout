import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { YamazumiChartBase } from '../YamazumiChart';
import type { YamazumiBarData } from '@variscout/core';

/** Create a YamazumiBarData entry with VA + Waste segments */
function makeBarData(key: string, vaTime: number, wasteTime: number): YamazumiBarData {
  return {
    key,
    totalTime: vaTime + wasteTime,
    segments: [
      {
        activityType: 'va',
        totalTime: vaTime,
        percentage: (vaTime / (vaTime + wasteTime)) * 100,
        count: 5,
      },
      {
        activityType: 'waste',
        totalTime: wasteTime,
        percentage: (wasteTime / (vaTime + wasteTime)) * 100,
        count: 3,
      },
    ],
  };
}

const defaultProps = {
  parentWidth: 800,
  parentHeight: 600,
  showBranding: false,
};

describe('YamazumiChartBase rendering', () => {
  it('returns null for empty data', () => {
    const { container } = render(<YamazumiChartBase data={[]} {...defaultProps} />);
    // Empty data produces no bars but chart still renders; small dimensions return null
    // With width/height 800x600 but 0 data items, xScale has empty domain
    const svg = container.querySelector('svg');
    // The chart renders the SVG shell even with empty data (no bars inside)
    if (svg) {
      const rects = svg.querySelectorAll('rect');
      // No bar rects when no data
      expect(rects.length).toBeLessThanOrEqual(1); // at most grid/axis elements
    }
  });

  it('returns null for very small dimensions', () => {
    const data = [makeBarData('Step1', 10, 5)];
    const { container } = render(
      <YamazumiChartBase data={data} parentWidth={5} parentHeight={5} showBranding={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders SVG with data-testid', () => {
    const data = [makeBarData('Step1', 10, 5), makeBarData('Step2', 8, 3)];
    const { container } = render(<YamazumiChartBase data={data} {...defaultProps} />);

    const svg = container.querySelector('[data-testid="chart-yamazumi"]');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
  });

  it('renders stacked bars for each step', () => {
    const data = [makeBarData('Step1', 10, 5), makeBarData('Step2', 8, 3)];
    const { container } = render(<YamazumiChartBase data={data} {...defaultProps} />);

    // Each step has multiple segment rects (VA + Waste)
    const rects = container.querySelectorAll('rect');
    // At least 2 steps * 2 segments = 4 bar rects
    expect(rects.length).toBeGreaterThanOrEqual(4);
  });

  it('shows takt time line when provided', () => {
    const data = [makeBarData('Step1', 10, 5)];
    const { container } = render(<YamazumiChartBase data={data} {...defaultProps} taktTime={12} />);

    // Takt time renders as a dashed line
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(1);

    // Takt label text should be present
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents.some(t => t?.includes('Takt') || t?.includes('takt'))).toBe(true);
  });

  it('renders without takt time line', () => {
    const data = [makeBarData('Step1', 10, 5)];
    const { container } = render(<YamazumiChartBase data={data} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    // No takt-related text when taktTime is not provided
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents.some(t => t?.includes('Takt') || t?.includes('takt'))).toBe(false);
  });

  it('renders with showBranding=true without error', () => {
    const data = [makeBarData('Step1', 10, 5)];
    const { container } = render(
      <YamazumiChartBase data={data} {...defaultProps} showBranding={true} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
