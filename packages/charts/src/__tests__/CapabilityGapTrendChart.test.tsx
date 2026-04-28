import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityGapTrendChartBase } from '../CapabilityGapTrendChart';
import type { IChartDataPoint } from '../types';

const makeGapSeries = (n: number): IChartDataPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    x: i,
    y: 0.05 + (i % 3) * 0.02 - 0.04, // small gap oscillations around 0
    originalIndex: i,
  }));

const STATS = { mean: 0.02, stdDev: 0.04, ucl: 0.14, lcl: -0.1, sigma: 0.04 } as const;

describe('CapabilityGapTrendChartBase', () => {
  it('renders an SVG with the gap series', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(20)}
        gapStats={STATS as unknown as Parameters<typeof CapabilityGapTrendChartBase>[0]['gapStats']}
      />
    );
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('uses "Δ(Cp-Cpk)" as default Y-axis label', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(10)}
        gapStats={STATS as never}
      />
    );
    expect(screen.getByText(/Δ\(Cp-Cpk\)/)).toBeInTheDocument();
  });

  it('honors yAxisLabel prop override', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(10)}
        gapStats={STATS as never}
        yAxisLabel="Centering gap"
      />
    );
    expect(screen.getByText('Centering gap')).toBeInTheDocument();
  });

  it('renders the target=0 line label as "0" by default', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={makeGapSeries(10)}
        gapStats={STATS as never}
      />
    );
    const labels = screen.getAllByText('0');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders empty state cleanly with zero data points', () => {
    render(
      <CapabilityGapTrendChartBase
        parentWidth={600}
        parentHeight={300}
        gapSeries={[]}
        gapStats={null}
      />
    );
    expect(document.querySelector('svg')).toBeTruthy();
  });
});
