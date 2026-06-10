import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IChartBase } from '../IChart';
import type { IChartDataPoint } from '../types';
import type { StatsResult } from '@variscout/core';
import { chartColors } from '../colors';

/** Generate N data points for testing */
function makeData(n: number): IChartDataPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    x: i,
    y: 10 + Math.sin(i),
    originalIndex: i,
  }));
}

function makeISOData(values: number[]): IChartDataPoint[] {
  return values.map((y, i) => ({
    x: i,
    y,
    originalIndex: i,
    isoTimestamp: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    timeValue: `Jan ${i + 1}`,
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

  it('renders a phase marker at the ISO-matched data point position', () => {
    const data = makeISOData([10, 11, 12, 11, 10]);
    const stats = makeStats(data);
    const { getByTestId } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z', label: 'Improve' }}
      />
    );

    const marker = getByTestId('ichart-phase-split-marker');

    expect(marker.getAttribute('x1')).toBe('322.5');
    expect(marker.getAttribute('x2')).toBe('322.5');
    expect(getByTestId('ichart-phase-split-label').textContent).toBe('Improve');
  });

  it('renders before and after phase-limit segments', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z' }}
        phaseLimits={{
          before: { mean: 10, ucl: 16, lcl: 4 },
          after: { mean: 13, ucl: 24, lcl: 2 },
        }}
      />
    );

    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-before-"]')).toHaveLength(
      3
    );
    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-after-"]')).toHaveLength(
      3
    );
    expect(
      container.querySelector('[data-testid="ichart-phase-limits-before-mean"]')
    ).toHaveAttribute('x1', '0');
    expect(
      container.querySelector('[data-testid="ichart-phase-limits-after-mean"]')
    ).toHaveAttribute('x2', '645');
  });

  it('does not render full-width non-staged control lines when phase limits are present', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = {
      ...makeStats(data),
      mean: 12,
      ucl: 15,
      lcl: 9,
    };
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        specs={{}}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z' }}
        phaseLimits={{
          before: { mean: 10, ucl: 16, lcl: 4 },
          after: { mean: 13, ucl: 24, lcl: 2 },
        }}
      />
    );

    const fullWidthControlLines = Array.from(container.querySelectorAll('line')).filter(line => {
      const isControlLine =
        line.getAttribute('stroke') === chartColors.control ||
        line.getAttribute('stroke') === chartColors.mean;
      return (
        isControlLine &&
        line.getAttribute('x1') === '0' &&
        line.getAttribute('x2') === '645' &&
        !line.getAttribute('data-testid')?.startsWith('ichart-phase-limits-')
      );
    });

    expect(fullWidthControlLines).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-before-"]')).toHaveLength(
      3
    );
    expect(container.querySelectorAll('[data-testid^="ichart-phase-limits-after-"]')).toHaveLength(
      3
    );
  });

  it('keeps normal control lines when phase limits cannot render without a split', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = {
      ...makeStats(data),
      mean: 12,
      ucl: 15,
      lcl: 9,
    };
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        specs={{}}
        phaseLimits={{
          before: { mean: 10, ucl: 60, lcl: -40 },
          after: { mean: 13, ucl: 70, lcl: -30 },
        }}
      />
    );

    const fullWidthControlLines = Array.from(container.querySelectorAll('line')).filter(line => {
      const isControlLine =
        line.getAttribute('stroke') === chartColors.control ||
        line.getAttribute('stroke') === chartColors.mean;
      return (
        isControlLine &&
        line.getAttribute('x1') === '0' &&
        line.getAttribute('x2') === '645' &&
        !line.getAttribute('data-testid')?.startsWith('ichart-phase-limits-')
      );
    });

    expect(fullWidthControlLines).toHaveLength(3);
    expect(container.querySelector('[data-testid^="ichart-phase-limits-"]')).toBeNull();
  });

  it('renders event flags clipped to chart bounds', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = makeStats(data);
    const { getByTestId } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        eventFlags={[
          { atISO: '2025-12-31T00:00:00.000Z', label: 'Before data' },
          { atISO: '2026-01-06T00:00:00.000Z', label: 'After data' },
        ]}
      />
    );

    expect(getByTestId('ichart-event-flag-0').getAttribute('transform')).toBe('translate(0, 0)');
    expect(getByTestId('ichart-event-flag-1').getAttribute('transform')).toBe('translate(645, 0)');
    expect(getByTestId('ichart-event-flag-label-0').textContent).toBe('Before data');
    expect(getByTestId('ichart-event-flag-label-1').textContent).toBe('After data');

    const leftPolygon = getByTestId('ichart-event-flag-0').querySelector('polygon')!;
    const rightPolygon = getByTestId('ichart-event-flag-1').querySelector('polygon')!;
    expect(leftPolygon.getAttribute('points')).toBe('0,-12 10,-12 5,-2');
    expect(rightPolygon.getAttribute('points')).toBe('-10,-12 0,-12 -5,-2');

    expect(getByTestId('ichart-event-flag-label-0')).toHaveAttribute('x', '12');
    expect(getByTestId('ichart-event-flag-label-0')).toHaveAttribute('text-anchor', 'start');
    expect(getByTestId('ichart-event-flag-label-1')).toHaveAttribute('x', '-12');
    expect(getByTestId('ichart-event-flag-label-1')).toHaveAttribute('text-anchor', 'end');
  });

  it('skips ISO overlays when chart points only have formatted time labels', () => {
    const data = makeISOData([10, 11, 12, 13, 14]).map(({ isoTimestamp, ...point }) => ({
      ...point,
      timeValue: isoTimestamp,
    }));
    const stats = makeStats(data);
    const { container } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z', label: 'Improve' }}
        eventFlags={[{ atISO: '2026-01-04T00:00:00.000Z', label: 'Check' }]}
      />
    );

    expect(container.querySelector('[data-testid="ichart-phase-split-marker"]')).toBeNull();
    expect(container.querySelector('[data-testid="ichart-phase-split-label"]')).toBeNull();
    expect(container.querySelector('[data-testid^="ichart-event-flag-"]')).toBeNull();
  });

  it('includes phase limits in the auto y-domain', () => {
    const data = makeISOData([10, 11, 12, 13, 14]);
    const stats = {
      ...makeStats(data),
      mean: 12,
      ucl: 15,
      lcl: 9,
    };
    const { getByTestId } = render(
      <IChartBase
        data={data}
        stats={stats}
        {...defaultProps}
        specs={{}}
        phaseSplit={{ atISO: '2026-01-03T00:00:00.000Z' }}
        phaseLimits={{
          after: { mean: 14, ucl: 40, lcl: 0 },
        }}
      />
    );

    expect(Number(getByTestId('ichart-phase-limits-after-ucl').getAttribute('y1'))).toBeGreaterThan(
      0
    );
  });

  it('keeps existing control-line labels and no phase overlay DOM without new props', () => {
    const data = makeData(10);
    const stats = makeStats(data);
    const { container } = render(<IChartBase data={data} stats={stats} {...defaultProps} />);
    const text = container.textContent ?? '';

    expect(text).toContain('UCL');
    expect(text).toContain('Mean');
    expect(text).toContain('LCL');
    expect(container.querySelector('[data-testid="ichart-phase-split-marker"]')).toBeNull();
    expect(container.querySelector('[data-testid^="ichart-phase-limits-"]')).toBeNull();
    expect(container.querySelector('[data-testid^="ichart-event-flag-"]')).toBeNull();
  });
});
