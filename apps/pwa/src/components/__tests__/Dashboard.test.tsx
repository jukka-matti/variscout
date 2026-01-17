import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as DataContextModule from '../../context/DataContext';
import * as CoreModule from '@variscout/core';
import * as UseDrillDownModule from '../../hooks/useDrillDown';
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
vi.mock('../AnovaResults', () => ({
  default: () => <div data-testid="anova-results">ANOVA Results</div>,
}));

// Mock resizable panels
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  Separator: () => <div>Separator</div>,
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

// Mock useDrillDown hook
vi.mock('../../hooks/useDrillDown', () => ({
  default: vi.fn(),
  useDrillDown: vi.fn(),
}));

// Mock useVariationTracking hook
vi.mock('../../hooks/useVariationTracking', () => ({
  default: vi.fn(),
  useVariationTracking: vi.fn(),
}));

describe('Dashboard', () => {
  const mockDrillDown = vi.fn();
  const mockDrillTo = vi.fn();
  const mockClearDrill = vi.fn();

  const mockDrillDownReturn = {
    drillStack: [],
    drillDown: mockDrillDown,
    drillTo: mockDrillTo,
    clearDrill: mockClearDrill,
    hasDrills: false,
    breadcrumbs: [{ id: 'root', label: 'All Data', isActive: true, source: 'ichart' }],
    currentHighlight: null,
    drillUp: vi.fn(),
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
    vi.spyOn(UseDrillDownModule, 'useDrillDown').mockReturnValue(mockDrillDownReturn as any);
    vi.spyOn(UseDrillDownModule, 'default').mockReturnValue(mockDrillDownReturn as any);
    vi.spyOn(UseVariationTrackingModule, 'useVariationTracking').mockReturnValue(
      mockVariationTrackingReturn as any
    );
    vi.spyOn(UseVariationTrackingModule, 'default').mockReturnValue(
      mockVariationTrackingReturn as any
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
  };

  it('renders dashboard view by default', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataCtx as any);

    render(<Dashboard />);

    // Dashboard view shows I-Chart, Boxplot, and Stats Panel
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('renders regression view when activeView is regression', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataCtx as any);

    render(<Dashboard activeView="regression" />);

    expect(screen.getByTestId('regression-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument();
  });

  it('renders gagerr view when activeView is gagerr', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataCtx as any);

    render(<Dashboard activeView="gagerr" />);

    expect(screen.getByTestId('gagerr-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument();
  });

  it('renders AnovaResults when ANOVA calculation succeeds', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataCtx as any);

    // Mock calculateAnova to return a result
    vi.spyOn(CoreModule, 'calculateAnova').mockReturnValue({
      isSignificant: true,
      groups: [],
      // other props...
    } as any);

    render(<Dashboard />);

    // Need to wait or verify if AnovaResults is rendered
    expect(screen.getByTestId('anova-results')).toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(mockDataCtx as any);

    vi.spyOn(CoreModule, 'calculateAnova').mockReturnValue(null);

    render(<Dashboard />);

    expect(screen.queryByTestId('anova-results')).not.toBeInTheDocument();
  });
});
