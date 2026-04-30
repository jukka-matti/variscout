/**
 * PerformanceIChartBase — per-channel cpkTargets array contract.
 *
 * Verifies the chart-API broadening landed in the Cpk target follow-ups Task D:
 * - N targets → N per-channel reference ticks
 * - 1 target  → single full-width reference line (legacy single-target case)
 * - 0 targets → no reference lines
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PerformanceIChartBase } from '../PerformanceIChart';
import type { ChannelResult } from '@variscout/core';

function makeChannel(id: string, cpk: number, n = 30): ChannelResult {
  return {
    id,
    label: id,
    n,
    mean: 10,
    stdDev: 0.5,
    cp: cpk + 0.1,
    cpk,
    min: 9,
    max: 11,
    health: 'capable',
    outOfSpecPercentage: 0,
    values: Array.from({ length: n }, () => 10),
  };
}

describe('PerformanceIChartBase — per-channel cpkTargets', () => {
  const channels: ChannelResult[] = [
    makeChannel('A', 1.0),
    makeChannel('B', 1.5),
    makeChannel('C', 0.8),
  ];

  it('renders N per-channel target ticks when N > 1 distinct channel targets are provided', () => {
    const { container } = render(
      <PerformanceIChartBase
        parentWidth={800}
        parentHeight={400}
        channels={channels}
        selectedMeasure={null}
        cpkTargets={[1.33, 1.67, 1.0]}
        showBranding={false}
      />
    );
    expect(container.querySelector('[data-testid="target-tick-A"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="target-tick-B"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="target-tick-C"]')).not.toBeNull();
  });

  it('renders a single shared target line when exactly 1 target is provided (legacy case)', () => {
    const { container } = render(
      <PerformanceIChartBase
        parentWidth={800}
        parentHeight={400}
        channels={channels}
        selectedMeasure={null}
        cpkTargets={[1.33]}
        showBranding={false}
      />
    );
    // No per-channel ticks
    expect(container.querySelector('[data-testid^="target-tick-"]')).toBeNull();
  });

  it('renders no reference lines when cpkTargets is empty (graceful empty case)', () => {
    const { container } = render(
      <PerformanceIChartBase
        parentWidth={800}
        parentHeight={400}
        channels={channels}
        selectedMeasure={null}
        cpkTargets={[]}
        showBranding={false}
      />
    );
    expect(container.querySelector('[data-testid^="target-tick-"]')).toBeNull();
  });
});
