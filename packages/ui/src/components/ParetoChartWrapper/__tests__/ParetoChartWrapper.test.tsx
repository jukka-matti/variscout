/**
 * ParetoChartWrapper — Y-axis metric picker tests (P1.4)
 *
 * Tests the YMetricSelectorDropdown visibility rules and wiring to useParetoChartData.
 * useParetoChartData is mocked so tests don't need Zustand / session store.
 */

// ---- vi.mock BEFORE component imports (rule: vi.mock is hoisted) ----

// Mock useParetoChartData — capture the last-called options for wiring assertions.
// Closure pattern to avoid hoist-time capture bug.
const mockUseParetoChartDataOptions: { last: unknown } = { last: null };

vi.mock('@variscout/hooks', () => {
  return {
    useParetoChartData: (opts: unknown) => {
      mockUseParetoChartDataOptions.last = opts;
      return {
        usingSeparateData: false,
        hasActiveFilters: false,
        data: [
          { key: 'A', value: 10, cumulative: 10, cumulativePercentage: 50 },
          { key: 'B', value: 10, cumulative: 20, cumulativePercentage: 100 },
        ],
        totalCount: 20,
        comparisonData: undefined,
        ghostBarData: undefined,
        categoryPositions: new Map(),
        allSingleRow: false,
        hasOthers: false,
        originalCategoryCount: 2,
      };
    },
    useTranslation: () => ({
      t: (key: string) => key,
      tf: (key: string) => key,
      formatStat: (n: number, decimals?: number) => {
        if (decimals !== undefined) return n.toFixed(decimals);
        return n % 1 === 0 ? String(n) : n.toFixed(2);
      },
      formatPct: (n: number) => `${n}%`,
      locale: 'en',
    }),
  };
});

// Mock @variscout/charts — render a simple stub so we don't need visx in JSDOM
vi.mock('@variscout/charts', () => {
  return {
    ParetoChartBase: ({ data }: { data: { key: string; value: number }[] }) => (
      <div data-testid="pareto-chart-base">
        {data.map(d => (
          <span key={d.key} data-testid={`bar-${d.key}`}>
            {d.key}:{d.value}
          </span>
        ))}
      </div>
    ),
    getScaledFonts: () => ({ tickLabel: 10, axisLabel: 11, statLabel: 10, annotation: 9 }),
  };
});

// Mock @variscout/core to avoid sub-path resolution issues in vitest
vi.mock('@variscout/core', () => {
  return {
    shouldShowBranding: () => false,
    getBrandingText: () => 'VariScout',
  };
});

// Mock @variscout/core/pareto (sub-path) — only types are used at runtime
vi.mock('@variscout/core/pareto', () => {
  return {};
});

// Mock internal sibling components
vi.mock('../../ChartAnnotationLayer', () => ({
  ChartAnnotationLayer: () => null,
}));
vi.mock('../../AxisEditor', () => ({
  AxisEditor: () => null,
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParetoChartWrapperBase } from '../index';
import type { ParetoYMetric, ParetoYMetricId } from '@variscout/core/pareto';

const Y_METRICS_TWO: ParetoYMetric[] = [
  {
    id: 'cpk' as ParetoYMetricId,
    label: 'Cpk',
    description: 'Process capability index',
    smallerIsWorse: true,
  },
  {
    id: 'percent-out-of-spec' as ParetoYMetricId,
    label: '% out of spec',
    description: 'Percentage outside spec',
  },
];

const Y_METRICS_ONE: ParetoYMetric[] = [
  {
    id: 'count' as ParetoYMetricId,
    label: 'count',
    description: 'Number of rows',
  },
];

const baseProps = {
  parentWidth: 600,
  parentHeight: 400,
  factor: 'Machine',
  rawData: [
    { Machine: 'A', value: 10 },
    { Machine: 'B', value: 20 },
  ],
  filteredData: [
    { Machine: 'A', value: 10 },
    { Machine: 'B', value: 20 },
  ],
  outcome: 'value',
  filters: {},
  onFiltersChange: vi.fn(),
  columnAliases: {},
  onColumnAliasesChange: vi.fn(),
};

describe('ParetoChartWrapperBase — Y-metric picker', () => {
  beforeEach(() => {
    mockUseParetoChartDataOptions.last = null;
    vi.clearAllMocks();
  });

  it('renders Y picker when availableYMetrics.length >= 2 and onYMetricSwitch provided', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'cpk' as ParetoYMetricId}
        availableYMetrics={Y_METRICS_TWO}
        onYMetricSwitch={vi.fn()}
      />
    );
    // The button renders with aria-label="Y axis metric"
    const pickers = screen.getAllByRole('button', { name: /Y axis metric/i });
    expect(pickers.length).toBeGreaterThan(0);
  });

  it('hides Y picker when availableYMetrics is undefined', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'cpk' as ParetoYMetricId}
        availableYMetrics={undefined}
        onYMetricSwitch={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /Y axis metric/i })).not.toBeInTheDocument();
  });

  it('hides Y picker when availableYMetrics.length === 1 (single-option)', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'count' as ParetoYMetricId}
        availableYMetrics={Y_METRICS_ONE}
        onYMetricSwitch={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /Y axis metric/i })).not.toBeInTheDocument();
  });

  it('hides Y picker when onYMetricSwitch not provided', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'cpk' as ParetoYMetricId}
        availableYMetrics={Y_METRICS_TWO}
        // onYMetricSwitch intentionally omitted
      />
    );
    expect(screen.queryByRole('button', { name: /Y axis metric/i })).not.toBeInTheDocument();
  });

  it('clicking a Y-picker option fires onYMetricSwitch with the correct id', () => {
    const onYMetricSwitch = vi.fn();
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'cpk' as ParetoYMetricId}
        availableYMetrics={Y_METRICS_TWO}
        onYMetricSwitch={onYMetricSwitch}
      />
    );
    // Click the trigger button to open dropdown
    const trigger = screen.getByRole('button', { name: /Y axis metric/i });
    fireEvent.click(trigger);

    // The listbox should appear with options
    const options = screen.getAllByRole('option');
    // Click the '% out of spec' option
    const pctOption = options.find(opt => opt.textContent?.toLowerCase().includes('out of spec'));
    expect(pctOption).toBeDefined();
    fireEvent.click(pctOption!);
    expect(onYMetricSwitch).toHaveBeenCalledWith('percent-out-of-spec');
  });

  it('forwards yMetric to useParetoChartData', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'cpk' as ParetoYMetricId}
        availableYMetrics={Y_METRICS_TWO}
        onYMetricSwitch={vi.fn()}
      />
    );
    const opts = mockUseParetoChartDataOptions.last as Record<string, unknown>;
    expect(opts).not.toBeNull();
    expect(opts['yMetric']).toBe('cpk');
  });

  it('forwards yMetricContext to useParetoChartData', () => {
    const ctx = { outcomeColumn: 'value', spec: { lsl: 1, usl: 5 } };
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        yMetric={'cpk' as ParetoYMetricId}
        availableYMetrics={Y_METRICS_TWO}
        onYMetricSwitch={vi.fn()}
        yMetricContext={ctx}
      />
    );
    const opts = mockUseParetoChartDataOptions.last as Record<string, unknown>;
    expect(opts['yMetricContext']).toBe(ctx);
  });
});
