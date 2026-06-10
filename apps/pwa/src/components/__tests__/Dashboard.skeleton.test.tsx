/**
 * ER-1 Task 5 — PWA I-Chart skeleton gate (worker-backed stats).
 *
 * Asserts the I-Chart card paints a ChartSkeleton while stats are pending
 * (`!stats || isComputing`) and swaps in the real chart once they resolve.
 * `useAnalysisStats` is mocked to a controllable value so the pending → resolved
 * transition is deterministic (the real path resolves via the stats worker).
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
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart</div> }));
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

  it('shows a ChartSkeleton while stats are pending and the chart once resolved', async () => {
    const { rerender } = render(<Dashboard />);

    // Pending: even after a rAF tick, isComputing holds the I-Chart skeleton.
    await flushRaf();
    expect(screen.getByTestId('chart-ichart')).toBeInTheDocument();
    expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument();
    const skeletons = screen.getAllByTestId('chart-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    // Resolve: stats arrive, isComputing flips false → the chart paints.
    statsState.value = { stats: RESOLVED_STATS, kde: null, isComputing: false };
    rerender(<Dashboard />);
    await flushRaf();
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
  });
});
