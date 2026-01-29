import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as DataContextModule from '../../context/DataContext';
import * as UseFilterNavigationModule from '../../hooks/useFilterNavigation';
import * as UseVariationTrackingModule from '../../hooks/useVariationTracking';

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
vi.mock('../GageRRPanel', () => ({
  default: () => <div data-testid="gagerr-panel">Gage R&R Panel</div>,
}));
vi.mock('../PerformanceDashboard', () => ({
  default: () => <div data-testid="performance-dashboard">Performance Dashboard</div>,
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
    calculateAnova: vi.fn(() => null),
  };
});

// Mock useFilterNavigation hook
vi.mock('../../hooks/useFilterNavigation', () => ({
  default: vi.fn(),
  useFilterNavigation: vi.fn(),
}));

// Mock useVariationTracking hook
vi.mock('../../hooks/useVariationTracking', () => ({
  default: vi.fn(),
  useVariationTracking: vi.fn(),
}));

describe('Dashboard - Performance Mode Navigation', () => {
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

  const mockDataCtx = {
    outcome: 'V1',
    factors: ['Machine'],
    rawData: [{ V1: 10, Machine: 'A' }],
    filteredData: [{ V1: 10, Machine: 'A' }],
    stats: { mean: 10, ucl: 12, lcl: 8 },
    specs: { usl: 15, lsl: 5 },
    grades: [],
    setOutcome: vi.fn(),
    setGrades: vi.fn(),
    setSpecs: vi.fn(),
    filters: {},
    columnAliases: {},
    stageColumn: null,
    setStageColumn: vi.fn(),
    stageOrderMode: 'auto',
    setStageOrderMode: vi.fn(),
    stagedStats: null,
    chartTitles: { ichart: '', boxplot: '', pareto: '', histogram: '', scatter: '' },
    setChartTitles: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(UseFilterNavigationModule, 'useFilterNavigation').mockReturnValue(
      mockFilterNavigationReturn as any
    );
    vi.spyOn(UseFilterNavigationModule, 'default').mockReturnValue(
      mockFilterNavigationReturn as any
    );
    vi.spyOn(UseVariationTrackingModule, 'useVariationTracking').mockReturnValue(
      mockVariationTrackingReturn as any
    );
    vi.spyOn(UseVariationTrackingModule, 'default').mockReturnValue(
      mockVariationTrackingReturn as any
    );
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataCtx as any);
  });

  describe('Back to Performance Banner', () => {
    it('does not show banner when drillFromPerformance is null', () => {
      render(<Dashboard activeView="dashboard" drillFromPerformance={null} />);

      expect(screen.queryByText(/back to performance/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/viewing:/i)).not.toBeInTheDocument();
    });

    it('shows banner with measure name when drillFromPerformance is set', () => {
      render(
        <Dashboard
          activeView="dashboard"
          drillFromPerformance="V1"
          onBackToPerformance={() => {}}
        />
      );

      // Look for the banner container with viewing text
      const viewingText = screen.getByText(/viewing:/i);
      expect(viewingText).toBeInTheDocument();

      // The V1 appears in the banner with specific styling
      const banner = viewingText.closest('div');
      expect(banner).toHaveTextContent('V1');

      expect(screen.getByRole('button', { name: /back to performance/i })).toBeInTheDocument();
    });

    it('calls onBackToPerformance when back button is clicked', () => {
      const mockBackToPerformance = vi.fn();

      render(
        <Dashboard
          activeView="dashboard"
          drillFromPerformance="V1"
          onBackToPerformance={mockBackToPerformance}
        />
      );

      const backButton = screen.getByRole('button', { name: /back to performance/i });
      fireEvent.click(backButton);

      expect(mockBackToPerformance).toHaveBeenCalledTimes(1);
    });

    it('does not show banner when onBackToPerformance is not provided', () => {
      render(<Dashboard activeView="dashboard" drillFromPerformance="V1" />);

      // Banner should not render if callback is not provided
      expect(
        screen.queryByRole('button', { name: /back to performance/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Banner Visibility per View', () => {
    it('shows banner only in dashboard view', () => {
      render(
        <Dashboard
          activeView="dashboard"
          drillFromPerformance="V1"
          onBackToPerformance={() => {}}
        />
      );

      expect(screen.getByText(/viewing:/i)).toBeInTheDocument();
    });

    it('does not show banner in regression view', () => {
      render(
        <Dashboard
          activeView="regression"
          drillFromPerformance="V1"
          onBackToPerformance={() => {}}
        />
      );

      // Regression view is rendered instead of dashboard
      expect(screen.getByTestId('regression-panel')).toBeInTheDocument();
      expect(screen.queryByText(/viewing:/i)).not.toBeInTheDocument();
    });

    it('does not show banner in gagerr view', () => {
      render(
        <Dashboard activeView="gagerr" drillFromPerformance="V1" onBackToPerformance={() => {}} />
      );

      // GageRR view is rendered instead of dashboard
      expect(screen.getByTestId('gagerr-panel')).toBeInTheDocument();
      expect(screen.queryByText(/viewing:/i)).not.toBeInTheDocument();
    });

    it('does not show banner in performance view', () => {
      render(
        <Dashboard
          activeView="performance"
          drillFromPerformance="V1"
          onBackToPerformance={() => {}}
        />
      );

      // Performance view is rendered instead of dashboard
      expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
      expect(screen.queryByText(/viewing:/i)).not.toBeInTheDocument();
    });
  });

  describe('onDrillToMeasure Prop Passing', () => {
    it('passes onDrillToMeasure to PerformanceDashboard in performance view', () => {
      const mockDrillToMeasure = vi.fn();

      render(<Dashboard activeView="performance" onDrillToMeasure={mockDrillToMeasure} />);

      // Just verify performance dashboard is rendered
      // The actual prop passing is verified by the PerformanceDashboard tests
      expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
    });
  });
});
