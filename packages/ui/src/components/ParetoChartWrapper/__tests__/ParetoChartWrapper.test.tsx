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

// Mock @variscout/charts — render a simple stub so we don't need visx in JSDOM.
// Bars render as <button data-testid="bar-{key}"> so tests can fireEvent.click them.
// onBarClick and selectedBars are wired through the stub for routing/highlight assertions.
vi.mock('@variscout/charts', () => {
  return {
    ParetoChartBase: ({
      data,
      onBarClick,
      selectedBars = [],
    }: {
      data: { key: string; value: number }[];
      onBarClick?: (key: string, ctx?: { shiftKey: boolean }) => void;
      selectedBars?: string[];
    }) => (
      <div data-testid="pareto-chart-base">
        {data.map(d => (
          <button
            key={d.key}
            data-testid={`bar-${d.key}`}
            data-selected={selectedBars.includes(d.key) ? 'true' : 'false'}
            onClick={(e: React.MouseEvent) => onBarClick?.(d.key, { shiftKey: e.shiftKey })}
          >
            {d.key}:{d.value}
          </button>
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

// Mock @variscout/core/findings (sub-path) — only types are used at runtime
vi.mock('@variscout/core/findings', () => {
  return {};
});

// Mock ParetoMakeScopeButton — renders the button only when selectedBars is non-empty,
// matching the real component's null-return guard. Fires onCreateInvestigation with a
// deterministic brief so click assertions stay simple.
vi.mock('../../ParetoMakeScopeButton', () => {
  return {
    ParetoMakeScopeButton: ({
      factor,
      selectedBars,
      onCreateInvestigation,
    }: {
      factor: string;
      selectedBars: ReadonlyArray<string | number>;
      onCreateInvestigation: (brief: { issueStatement: string }) => void;
    }) => {
      if (selectedBars.length === 0) return null;
      return (
        <button
          data-testid="pareto-make-scope-button"
          onClick={() =>
            onCreateInvestigation({
              issueStatement: `Top Pareto category in ${factor}: ${selectedBars.map(String).join(', ')}`,
            })
          }
        >
          Make this the investigation scope
        </button>
      );
    },
  };
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

// ---------------------------------------------------------------------------
// P3.5 — onScopeFilterClick routing + scopeFilterValues highlight
// ---------------------------------------------------------------------------
describe('ParetoChartWrapperBase — scope filter click routing (P3.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('onScopeFilterClick fires on plain click with shiftKey:false', () => {
    const onScopeFilterClick = vi.fn();
    render(<ParetoChartWrapperBase {...baseProps} onScopeFilterClick={onScopeFilterClick} />);

    fireEvent.click(screen.getByTestId('bar-A'), { shiftKey: false });

    expect(onScopeFilterClick).toHaveBeenCalledTimes(1);
    expect(onScopeFilterClick).toHaveBeenCalledWith('Machine', 'A', { shiftKey: false });
  });

  it('onScopeFilterClick fires on shift-click with shiftKey:true', () => {
    const onScopeFilterClick = vi.fn();
    render(<ParetoChartWrapperBase {...baseProps} onScopeFilterClick={onScopeFilterClick} />);

    fireEvent.click(screen.getByTestId('bar-A'), { shiftKey: true });

    expect(onScopeFilterClick).toHaveBeenCalledTimes(1);
    expect(onScopeFilterClick).toHaveBeenCalledWith('Machine', 'A', { shiftKey: true });
  });

  it('onScopeFilterClick is NOT called when onDrillDown is set — onDrillDown wins', () => {
    const onScopeFilterClick = vi.fn();
    const onDrillDown = vi.fn();
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        onDrillDown={onDrillDown}
        onScopeFilterClick={onScopeFilterClick}
      />
    );

    fireEvent.click(screen.getByTestId('bar-A'));

    expect(onDrillDown).toHaveBeenCalledTimes(1);
    expect(onDrillDown).toHaveBeenCalledWith('Machine', 'A');
    expect(onScopeFilterClick).not.toHaveBeenCalled();
  });

  it('legacy onFiltersChange fires when onScopeFilterClick is not provided', () => {
    const onFiltersChange = vi.fn();
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        filters={{}}
        onFiltersChange={onFiltersChange}
        // onScopeFilterClick intentionally omitted
      />
    );

    fireEvent.click(screen.getByTestId('bar-A'));

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    // Should toggle 'A' into the Machine filter
    expect(onFiltersChange).toHaveBeenCalledWith({ Machine: ['A'] });
  });

  it('legacy onFiltersChange is NOT called when onScopeFilterClick is provided', () => {
    const onFiltersChange = vi.fn();
    const onScopeFilterClick = vi.fn();
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        onFiltersChange={onFiltersChange}
        onScopeFilterClick={onScopeFilterClick}
      />
    );

    fireEvent.click(screen.getByTestId('bar-A'));

    expect(onScopeFilterClick).toHaveBeenCalledTimes(1);
    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it('scopeFilterValues drives selectedBars highlight when provided', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        scopeFilterValues={['A']}
        onScopeFilterClick={vi.fn()}
      />
    );

    // The stub renders data-selected="true" for bars whose key is in selectedBars
    expect(screen.getByTestId('bar-A')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('bar-B')).toHaveAttribute('data-selected', 'false');
  });

  it('selectedBars falls back to filters[factor] when scopeFilterValues not provided', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        filters={{ Machine: ['B'] }}
        // scopeFilterValues intentionally omitted
      />
    );

    expect(screen.getByTestId('bar-A')).toHaveAttribute('data-selected', 'false');
    expect(screen.getByTestId('bar-B')).toHaveAttribute('data-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// P4.2 — onMakeInvestigationScope wiring through ParetoChartWrapperBase
// ---------------------------------------------------------------------------
describe('ParetoChartWrapperBase — onMakeInvestigationScope (P4.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('button is absent when onMakeInvestigationScope is not provided (even with bars selected)', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        scopeFilterValues={['A']}
        // onMakeInvestigationScope intentionally omitted
      />
    );
    expect(screen.queryByTestId('pareto-make-scope-button')).not.toBeInTheDocument();
  });

  it('button is absent when selectedBars is empty (scopeFilterValues=[]) and prop is set', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        scopeFilterValues={[]}
        onMakeInvestigationScope={vi.fn()}
      />
    );
    expect(screen.queryByTestId('pareto-make-scope-button')).not.toBeInTheDocument();
  });

  it('button is absent when no scopeFilterValues and filters[factor] is empty', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        filters={{ Machine: [] }}
        onMakeInvestigationScope={vi.fn()}
      />
    );
    expect(screen.queryByTestId('pareto-make-scope-button')).not.toBeInTheDocument();
  });

  it('button renders when onMakeInvestigationScope provided and bars selected via filters[factor]', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        filters={{ Machine: ['A'] }}
        onMakeInvestigationScope={vi.fn()}
      />
    );
    expect(screen.getByTestId('pareto-make-scope-button')).toBeInTheDocument();
  });

  it('button renders when onMakeInvestigationScope provided and scopeFilterValues is non-empty', () => {
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        scopeFilterValues={['A', 'B']}
        onMakeInvestigationScope={vi.fn()}
      />
    );
    expect(screen.getByTestId('pareto-make-scope-button')).toBeInTheDocument();
  });

  it('click fires onMakeInvestigationScope with correct issueStatement (legacy filters path)', () => {
    const onMakeInvestigationScope = vi.fn();
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        filters={{ Machine: ['A'] }}
        onMakeInvestigationScope={onMakeInvestigationScope}
      />
    );
    fireEvent.click(screen.getByTestId('pareto-make-scope-button'));
    expect(onMakeInvestigationScope).toHaveBeenCalledTimes(1);
    const brief = onMakeInvestigationScope.mock.calls[0][0] as { issueStatement: string };
    expect(brief.issueStatement).toBe('Top Pareto category in Machine: A');
  });

  it('click fires onMakeInvestigationScope with correct issueStatement (scopeFilterValues path)', () => {
    const onMakeInvestigationScope = vi.fn();
    render(
      <ParetoChartWrapperBase
        {...baseProps}
        scopeFilterValues={['A', 'B']}
        onMakeInvestigationScope={onMakeInvestigationScope}
      />
    );
    fireEvent.click(screen.getByTestId('pareto-make-scope-button'));
    expect(onMakeInvestigationScope).toHaveBeenCalledTimes(1);
    const brief = onMakeInvestigationScope.mock.calls[0][0] as { issueStatement: string };
    expect(brief.issueStatement).toBe('Top Pareto category in Machine: A, B');
  });
});
