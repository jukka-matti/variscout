import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { calculateAnova } from '@variscout/core';
import * as UseFilterNavigationModule from '../../hooks/useFilterNavigation';
import { useProjectStore, useViewStore, getProjectInitialState } from '@variscout/stores';

// Mock components
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart</div> }));
vi.mock('../charts/Boxplot', () => ({ default: () => <div data-testid="boxplot">Boxplot</div> }));
vi.mock('../charts/ParetoChart', () => ({
  default: () => <div data-testid="pareto-chart">Pareto</div>,
}));
vi.mock('../ProcessIntelligencePanel', () => ({
  default: () => <div data-testid="stats-panel">Process Intelligence Panel</div>,
}));
vi.mock('../charts/CapabilityHistogram', () => ({
  default: () => <div data-testid="capability-histogram">Histogram</div>,
}));
vi.mock('../charts/ProbabilityPlot', () => ({
  default: () => <div data-testid="probability-plot">Probability Plot</div>,
}));
vi.mock('../AnovaResults', () => ({
  default: () => <div data-testid="anova-results">ANOVA Results</div>,
}));

// Mock new dashboard chrome components
vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: () => <div data-testid="process-health-bar">Health Bar</div>,
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

  it('opens the shared capture card for an I-Chart brush and saves a factor-backed Finding', () => {
    useProjectStore.setState({ filters: { Machine: ['A'] } });
    useViewStore.getState().setSelectedPoints(new Set([0, 1]));
    const onAddChartObservation = vi.fn();

    render(
      <Dashboard
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
  });
});
