import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
vi.mock('../RegressionPanel', () => ({
  default: () => <div data-testid="regression-panel">Regression Panel</div>,
}));
vi.mock('../AnovaResults', () => ({
  default: () => <div data-testid="anova-results">ANOVA Results</div>,
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toBlob: vi.fn(),
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
    chartTitles: { ichart: '', boxplot: '', pareto: '', histogram: '', scatter: '' },
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

    // Tab navigation present
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Regression')).toBeInTheDocument();

    // Dashboard tab is active
    expect(screen.getByText('Dashboard')).toHaveClass('bg-blue-600');

    // Dashboard view shows I-Chart, Boxplot, and Stats Panel
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('switches to regression view when Regression tab is clicked', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    fireEvent.click(screen.getByText('Regression'));

    expect(screen.getByText('Regression')).toHaveClass('bg-blue-600');
    expect(screen.getByTestId('regression-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument();
  });

  it('shows What-If button when onOpenWhatIf is provided', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    const onOpenWhatIf = vi.fn();
    render(<Dashboard onOpenWhatIf={onOpenWhatIf} />);

    const whatIfButton = screen.getByText('What-If');
    expect(whatIfButton).toBeInTheDocument();

    fireEvent.click(whatIfButton);
    expect(onOpenWhatIf).toHaveBeenCalledTimes(1);
  });

  it('does not show What-If button when onOpenWhatIf is not provided', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    expect(screen.queryByText('What-If')).not.toBeInTheDocument();
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
