import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IChartBase } from '../IChart';
import type { IChartDataPoint } from '../types';
import type { StatsResult } from '@variscout/core';

/** Generate N data points for testing */
function makeData(n: number): IChartDataPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    x: i,
    y: 10 + Math.sin(i),
    originalIndex: i,
  }));
}

/** Minimal stats result matching the test data */
function makeStats(data: IChartDataPoint[]): StatsResult {
  const values = data.map(d => d.y);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
  return {
    mean,
    median: mean,
    stdDev,
    sigmaWithin: stdDev,
    mrBar: stdDev * 1.128,
    ucl: mean + 3 * stdDev,
    lcl: mean - 3 * stdDev,
    outOfSpecPercentage: 0,
    sampleSize: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  } as StatsResult;
}

const defaultProps = {
  parentWidth: 800,
  parentHeight: 400,
  specs: { usl: 15, lsl: 5 },
  showBranding: false,
};

describe('IChartBase rendering', () => {
  it('returns null for empty data', () => {
    const { container } = render(<IChartBase data={[]} stats={null} {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an SVG with role="img" and aria-label', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toContain('I-Chart');
    expect(svg!.getAttribute('aria-label')).toContain('10 data points');
  });

  it('renders data points as circles', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);

    // Data points are rendered as circles within the chart
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(data.length);
  });

  it('includes control limit lines when stats are provided', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);

    // Control limits render as <line> elements; at minimum mean, UCL, LCL
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('renders without stats (stats=null)', () => {
    const data = makeData(5);
    const { container } = render(<IChartBase data={data} stats={null} {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('reflects custom yAxisLabel in aria-label', () => {
    const data = makeData(5);
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase data={data} stats={stats} {...defaultProps} yAxisLabel="Weight" />
    );

    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('aria-label')).toContain('Weight');
  });

  it('renders with showBranding=true without error', () => {
    const data = makeData(5);
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase data={data} stats={stats} {...defaultProps} showBranding={true} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});
