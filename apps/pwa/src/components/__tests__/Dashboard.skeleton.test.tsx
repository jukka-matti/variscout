/**
 * ER-1 Task 5 — PWA I-Chart skeleton overlay (worker-backed stats).
 *
 * Asserts the I-Chart card holds a ChartSkeleton overlay while stats are pending
 * (`!stats || isComputing`) and drops it once the chart's svg has painted AND
 * stats resolve. `useAnalysisStats` is mocked to a controllable value so the
 * pending → resolved transition is deterministic (the real path resolves via the
 * stats worker). The IChart stub renders an `<svg>` so the svg-paint latch can
 * release the overlay once loading clears (the real chart paints a real svg).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useProjectStore, getProjectInitialState } from '@variscout/stores';
import type { StatsResult } from '@variscout/core';
import { flushRaf } from '@variscout/ui/test-utils';

// Controllable stats value — flipped between renders to model pending → resolved.
const statsState = vi.hoisted(() => ({
  value: { stats: null as StatsResult | null, kde: null, isComputing: true },
}));

vi.mock('../../workers/useStatsWorker', () => ({ useStatsWorker: () => null }));

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useDataDateRange: () => null,
    useAnalysisStats: () => statsState.value,
  };
});

// Worker-free, DOM-light chart stubs (the real charts use withParentSize +
// ResizeObserver, unavailable in jsdom).
// The IChart stub paints an <svg> so the svg-paint latch can drop the overlay
// once stats resolve (mirrors the real visx chart painting an svg).
vi.mock('../charts/IChart', () => ({
  default: () => (
    <div data-testid="i-chart">
      <svg />
      I-Chart
    </div>
  ),
}));
vi.mock('../charts/Boxplot', () => ({ default: () => <div data-testid="boxplot">Boxplot</div> }));
vi.mock('../charts/ParetoChart', () => ({
  default: () => <div data-testid="pareto-chart">Pareto</div>,
}));
vi.mock('../charts/CapabilityHistogram', () => ({
  default: () => <div data-testid="capability-histogram">Histogram</div>,
}));
vi.mock('../charts/ProbabilityPlot', () => ({
  default: () => <div data-testid="probability-plot">Probability Plot</div>,
}));
vi.mock('../ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="stats-panel">Process Intelligence Panel</div>,
}));

const RESOLVED_STATS = {
  mean: 20,
  ucl: 30,
  lcl: 10,
  stdDev: 5,
  count: 3,
} as unknown as StatsResult;

describe('PWA Dashboard — I-Chart skeleton gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    statsState.value = { stats: null, kde: null, isComputing: true };
    useProjectStore.setState({
      ...getProjectInitialState(),
      outcome: 'Result',
      factors: ['Machine'],
      rawData: [
        { Result: 10, Machine: 'A' },
        { Result: 20, Machine: 'A' },
        { Result: 30, Machine: 'B' },
      ],
    });
  });

  it('holds the skeleton overlay while stats are pending and drops it once resolved', async () => {
    const { rerender } = render(<Dashboard />);

    // Pending: the I-Chart card exists and its content mounts underneath, but
    // isComputing (→ ichartLoading) holds the skeleton overlay up regardless.
    await flushRaf();
    expect(screen.getByTestId('chart-ichart')).toBeInTheDocument();
    const skeletons = screen.getAllByTestId('chart-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    // Resolve: stats arrive, isComputing flips false → with the svg already
    // painted, the overlay's svg-paint latch releases and the chart is revealed.
    statsState.value = { stats: RESOLVED_STATS, kde: null, isComputing: false };
    rerender(<Dashboard />);
    await flushRaf();
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    // The I-Chart card's skeleton overlay is gone (its content is now visible).
    const ichartCard = screen.getByTestId('chart-ichart');
    expect(ichartCard.querySelector('[data-testid="chart-skeleton"]')).toBeNull();
  });
});
