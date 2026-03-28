import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as DataContextModule from '../../context/DataContext';
import * as CoreModule from '@variscout/core';
import * as UseFilterNavigationModule from '../../hooks/useFilterNavigation';
import * as UseVariationTrackingModule from '@variscout/hooks';

// Mock components
vi.mock('../charts/IChart', () => ({ default: () => <div data-testid="i-chart">I-Chart</div> }));
vi.mock('../charts/Boxplot', () => ({ default: () => <div data-testid="boxplot">Boxplot</div> }));
vi.mock('../charts/ParetoChart', () => ({
  default: () => <div data-testid="pareto-chart">Pareto</div>,
}));
vi.mock('../StatsPanel', () => ({
  default: () => <div data-testid="stats-panel">Stats Panel</div>,
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
    VerificationCard: ({ renderHistogram }: { renderHistogram: React.ReactNode }) => (
      <div data-testid="verification-card">{renderHistogram}</div>
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

// Mock useVariationTracking hook (from @variscout/hooks)
vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useVariationTracking: vi.fn(),
  };
});

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

  const mockVariationTrackingReturn = {
    breadcrumbsWithVariation: [{ id: 'root', label: 'All Data', isActive: true, source: 'ichart' }],
    cumulativeVariationPct: null,
    factorVariations: new Map(),
    impactLevel: null,
    insightText: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
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
    vi.spyOn(UseVariationTrackingModule, 'useVariationTracking').mockReturnValue(
      mockVariationTrackingReturn as unknown as ReturnType<
        typeof UseVariationTrackingModule.useVariationTracking
      >
    );
  });

  const mockDataCtx = {
    outcome: 'Result',
    factors: ['Machine'],
    rawData: [{ Result: 10, Machine: 'A' }],
    filteredData: [{ Result: 10, Machine: 'A' }],
    stats: { mean: 10, ucl: 12, lcl: 8 },
    specs: {},
    setOutcome: vi.fn(),
    filters: {},
    columnAliases: {},
    chartTitles: { ichart: '', boxplot: '', pareto: '' },
    setChartTitles: vi.fn(),
    displayOptions: { showFilterContext: true },
    setDisplayOptions: vi.fn(),
    selectedPoints: new Set<number>(),
    clearSelection: vi.fn(),
  };

  it('renders dashboard view by default with tab navigation', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    // Dashboard view shows I-Chart, Boxplot, and ProcessHealthBar
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('process-health-bar')).toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    vi.spyOn(CoreModule, 'calculateAnova').mockReturnValue(null);

    render(<Dashboard />);

    expect(screen.queryByTestId('anova-results')).not.toBeInTheDocument();
  });
});
