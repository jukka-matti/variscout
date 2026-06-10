import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { calculateAnova, type Finding } from '@variscout/core';
import * as UseFilterNavigationModule from '../../hooks/useFilterNavigation';
import {
  usePreferencesStore,
  useProjectStore,
  useViewStore,
  getProjectInitialState,
} from '@variscout/stores';

// Mock components
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart</div> }));
vi.mock('../charts/Boxplot', () => ({ default: () => <div data-testid="boxplot">Boxplot</div> }));
vi.mock('../charts/ParetoChart', () => ({
  default: () => <div data-testid="pareto-chart">Pareto</div>,
}));
vi.mock('../ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="stats-panel">Process Intelligence Panel</div>,
}));
// Capture the specs prop so the per-measure resolution can be asserted.
const capturedHistogramSpecs = vi.hoisted(() => ({ value: undefined as unknown }));
vi.mock('../charts/CapabilityHistogram', () => ({
  default: ({ specs }: { specs: unknown }) => {
    capturedHistogramSpecs.value = specs;
    return <div data-testid="capability-histogram">Histogram</div>;
  },
}));
vi.mock('../charts/ProbabilityPlot', () => ({
  default: () => <div data-testid="probability-plot">Probability Plot</div>,
}));
vi.mock('../AnovaResults', () => ({
  default: () => <div data-testid="anova-results">ANOVA Results</div>,
}));

// Capture the ProcessHealthBar specs prop so the per-measure resolution can be
// asserted (the bar gates its own Cpk chip on `specs`, independent of stats).
const capturedHealthBarSpecs = vi.hoisted(() => ({ value: undefined as unknown }));
// Mock new dashboard chrome components
vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: ({ specs }: { specs: unknown }) => {
      capturedHealthBarSpecs.value = specs;
      return <div data-testid="process-health-bar">Health Bar</div>;
    },
    VerificationCard: ({
      tabs,
      activeTab,
    }: {
      tabs: Array<{ id: string; content: React.ReactNode }>;
      activeTab: string;
    }) => (
      <div data-testid="verification-card">
        {tabs.find((tab: { id: string }) => tab.id === activeTab)?.content ?? tabs[0]?.content}
      </div>
    ),
    SegmentedControl: ({
      options,
      value,
      onChange,
      testId,
    }: {
      options: Array<{ value: string; label: string }>;
      value: string;
      onChange: (v: string) => void;
      'aria-label': string;
      testId?: string;
    }) => (
      <div data-testid={testId ?? 'segmented-control'}>
        {options.map((opt: { value: string; label: string }) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={opt.value === value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    ),
  };
});

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toBlob: vi.fn(),
}));

// Mock useStatsWorker (Worker is not available in jsdom)
vi.mock('../../workers/useStatsWorker', () => ({
  useStatsWorker: vi.fn(() => null),
}));

// Mock core functions
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    calculateAnova: vi.fn(),
  };
});

// Mock useFilterNavigation hook
vi.mock('../../hooks/useFilterNavigation', () => ({
  default: vi.fn(),
  useFilterNavigation: vi.fn(),
}));

describe('Dashboard', () => {
  const mockApplyFilter = vi.fn();
  const mockNavigateTo = vi.fn();
  const mockClearFilters = vi.fn();

  const mockFilterNavigationReturn = {
    filterStack: [],
    applyFilter: mockApplyFilter,
    navigateTo: mockNavigateTo,
    clearFilters: mockClearFilters,
    hasFilters: false,
    breadcrumbs: [{ id: 'root', label: 'All Data', isActive: true, source: 'ichart' }],
    currentHighlight: null,
    removeLastFilter: vi.fn(),
    setHighlight: vi.fn(),
    clearHighlight: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Seed project store with test data (useDashboardCharts reads from stores)
    useProjectStore.setState({
      ...getProjectInitialState(),
      outcome: 'Result',
      factors: ['Machine'],
      rawData: [
        { Result: 10, Machine: 'A' },
        { Result: 20, Machine: 'A' },
        { Result: 30, Machine: 'B' },
        { Result: 40, Machine: 'B' },
      ],
      specs: {},
      chartTitles: { ichart: '', boxplot: '', pareto: '' },
      displayOptions: { showFilterContext: true },
    });
    useViewStore.getState().clearTransientSelections();
    usePreferencesStore.setState({ timeLens: { mode: 'cumulative' } });

    vi.spyOn(UseFilterNavigationModule, 'useFilterNavigation').mockReturnValue(
      mockFilterNavigationReturn as unknown as ReturnType<
        typeof UseFilterNavigationModule.useFilterNavigation
      >
    );
    vi.spyOn(UseFilterNavigationModule, 'default').mockReturnValue(
      mockFilterNavigationReturn as unknown as ReturnType<
        typeof UseFilterNavigationModule.useFilterNavigation
      >
    );
  });

  it('renders dashboard view by default with tab navigation', () => {
    render(<Dashboard />);

    // Dashboard view shows I-Chart, Boxplot, and ProcessHealthBar
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('process-health-bar')).toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.mocked(calculateAnova).mockReturnValue(null);

    render(<Dashboard />);

    expect(screen.queryByTestId('anova-results')).not.toBeInTheDocument();
  });

  it('feeds the histogram measureSpecs[outcome] when global specs are empty', () => {
    // Global specs empty; the per-measure spec for the outcome carries limits.
    useProjectStore.setState({
      specs: {},
      measureSpecs: { Result: { lsl: 5, usl: 45 } },
    });

    render(<Dashboard />);

    // Switch the verify card to the distribution/capability lens (2nd button).
    const verifyTab = screen.getByTestId('verify-tab');
    const lensButtons = within(verifyTab).getAllByRole('button');
    fireEvent.click(lensButtons[1]);

    // The histogram must receive the per-measure spec, not the empty global one.
    expect(capturedHistogramSpecs.value).toEqual({ lsl: 5, usl: 45 });
  });

  it('feeds ProcessHealthBar measureSpecs[outcome] when global specs are empty', () => {
    // Global specs empty; the per-measure spec for the outcome carries limits.
    // ProcessHealthBar gates its own Cpk chip on the specs prop, so a raw empty
    // global spec would hide the chip while stats.cpk is actually defined.
    useProjectStore.setState({
      specs: {},
      measureSpecs: { Result: { lsl: 5, usl: 45 } },
    });

    render(<Dashboard />);

    expect(capturedHealthBarSpecs.value).toEqual({ lsl: 5, usl: 45 });
  });

  it('opens the shared capture card for an I-Chart brush and saves a factor-backed Finding', () => {
    useProjectStore.setState({ filters: { Machine: ['A'] } });
    useViewStore.getState().setSelectedPoints(new Set([0, 1]));
    const capturedFinding: Finding = {
      id: 'f-captured',
      text: 'Captured observation',
      context: { activeFilters: {}, cumulativeScope: null },
      evidenceType: 'data',
      status: 'observed',
      createdAt: Date.parse('2026-06-07T00:00:00Z'),
      deletedAt: null,
      comments: [],
      statusChangedAt: Date.parse('2026-06-07T00:00:00Z'),
    };
    const onAddChartObservation = vi.fn(() => capturedFinding);
    const onOpenWall = vi.fn();

    render(
      <Dashboard
        onOpenWall={onOpenWall}
        findingsCallbacks={{
          onAddChartObservation,
          chartFindings: { boxplot: [], pareto: [], ichart: [] },
        }}
      />
    );

    expect(screen.getByRole('dialog', { name: 'New Finding' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Factor name'), { target: { value: 'Launch window' } });
    fireEvent.click(screen.getByRole('button', { name: 'Capture' }));

    const state = useProjectStore.getState();
    expect(state.factors).toContain('Launch window');
    expect(state.rawData.map(row => row['Launch window'])).toEqual(['in', 'in', 'out', 'out']);
    expect(state.filters).toEqual({ Machine: ['A'] });
    expect(onAddChartObservation).toHaveBeenCalledWith(
      'ichart',
      undefined,
      '',
      1,
      20,
      expect.objectContaining({
        brushedRange: { startIdx: 0, endIdx: 1 },
        captureMode: 'capture',
        activeFilters: { Machine: ['A'], 'Launch window': ['in'] },
      })
    );
    expect(useViewStore.getState().selectedPoints.size).toBe(0);
    expect(screen.getByRole('button', { name: /Take it to Analyze ->/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Take it to Analyze ->/i }));
    expect(onOpenWall).toHaveBeenCalledTimes(1);
  });

  it('suffixes edited brush factor names instead of overwriting existing raw columns', () => {
    useViewStore.getState().setSelectedPoints(new Set([0, 1]));

    render(
      <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
    );

    fireEvent.change(screen.getByLabelText('Factor name'), { target: { value: 'Machine' } });
    fireEvent.click(screen.getByRole('button', { name: 'Factor only' }));

    const state = useProjectStore.getState();
    expect(state.factors).toContain('Machine 2');
    expect(state.rawData.map(row => row.Machine)).toEqual(['A', 'A', 'B', 'B']);
    expect(state.rawData.map(row => row['Machine 2'])).toEqual(['in', 'in', 'out', 'out']);
    expect(
      screen.queryByRole('button', { name: /Take it to Analyze ->/i })
    ).not.toBeInTheDocument();
  });

  it('maps rolling-lens brush indices onto the visible raw rows', () => {
    usePreferencesStore.setState({ timeLens: { mode: 'rolling', windowSize: 2 } });
    useViewStore.getState().setSelectedPoints(new Set([0, 1]));

    render(
      <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
    );

    fireEvent.change(screen.getByLabelText('Factor name'), { target: { value: 'Recent window' } });
    fireEvent.click(screen.getByRole('button', { name: 'Factor only' }));

    expect(useProjectStore.getState().rawData.map(row => row['Recent window'])).toEqual([
      'out',
      'out',
      'in',
      'in',
    ]);
  });
});
