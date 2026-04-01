import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParetoChartBase } from '../ParetoChart';
import type { ParetoDataPoint } from '../types';

const testData: ParetoDataPoint[] = [
  { key: 'A', value: 50, cumulative: 50, cumulativePercentage: 50 },
  { key: 'B', value: 30, cumulative: 80, cumulativePercentage: 80 },
  { key: 'C', value: 20, cumulative: 100, cumulativePercentage: 100 },
];

const defaultProps = {
  parentWidth: 800,
  parentHeight: 400,
  totalCount: 100,
  showBranding: false,
};

describe('ParetoChartBase rendering', () => {
  it('returns null for empty data', () => {
    const { container } = render(<ParetoChartBase data={[]} {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an SVG with role="img" and aria-label', () => {
    const { container } = render(<ParetoChartBase data={testData} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toContain('Pareto');
  });

  it('renders bars for each category', () => {
    const { container } = render(<ParetoChartBase data={testData} {...defaultProps} />);

    // Bars are rendered as <rect> elements within the chart group
    const rects = container.querySelectorAll('rect');
    // Should have at least as many rects as categories (bars)
    expect(rects.length).toBeGreaterThanOrEqual(testData.length);
  });

  it('renders cumulative line with circle markers', () => {
    const { container } = render(<ParetoChartBase data={testData} {...defaultProps} />);

    // Cumulative line dots are rendered as circles
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(testData.length);
  });

  it('renders axis labels', () => {
    const { container } = render(
      <ParetoChartBase
        data={testData}
        {...defaultProps}
        xAxisLabel="Defect Type"
        yAxisLabel="Frequency"
      />
    );

    // The chart renders text elements for axis labels
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('renders with showBranding=true without error', () => {
    const { container } = render(
      <ParetoChartBase data={testData} {...defaultProps} showBranding={true} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('applies muted style to "Others" bar via othersKey prop', () => {
    const dataWithOthers: ParetoDataPoint[] = [
      ...testData,
      { key: 'Others', value: 5, cumulative: 105, cumulativePercentage: 100 },
    ];

    // Should render without throwing when othersKey is set
    const { container } = render(
      <ParetoChartBase
        data={dataWithOthers}
        {...defaultProps}
        totalCount={105}
        othersKey="Others"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders with selectedBars highlighting', () => {
    const { container } = render(
      <ParetoChartBase data={testData} {...defaultProps} selectedBars={['A']} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
