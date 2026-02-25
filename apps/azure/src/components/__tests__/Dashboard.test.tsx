import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as DataContextModule from '../../context/DataContext';
import * as CoreModule from '@variscout/core';

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
vi.mock('../PerformanceDashboard', () => ({
  default: () => <div data-testid="performance-dashboard">Performance Dashboard</div>,
}));
vi.mock('../ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../FilterBreadcrumb', () => ({
  default: () => <div data-testid="filter-breadcrumb">Breadcrumb</div>,
}));
vi.mock('../FactorSelector', () => ({
  default: ({
    factors,
    selected,
    onChange,
  }: {
    factors: string[];
    selected: string;
    onChange: (v: string) => void;
  }) => (
    <select data-testid="factor-selector" value={selected} onChange={e => onChange(e.target.value)}>
      {factors.map((f: string) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('../settings/SpecsPopover', () => ({
  default: () => <div data-testid="specs-popover">Specs</div>,
}));
vi.mock('../FactorManagerPopover', () => ({
  default: () => <div data-testid="factor-manager">Factor Manager</div>,
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toBlob: vi.fn(),
}));

// Mock @variscout/charts
vi.mock('@variscout/charts', () => ({
  EditableChartTitle: ({ defaultTitle }: { defaultTitle: string }) => (
    <span data-testid="editable-title">{defaultTitle}</span>
  ),
  calculateBoxplotStats: vi.fn(() => ({ key: 'A', min: 0, max: 10, median: 5, q1: 2.5, q3: 7.5 })),
  BoxplotStatsTable: () => <div data-testid="boxplot-stats-table">Stats Table</div>,
}));

// Mock @variscout/ui
vi.mock('@variscout/ui', () => ({
  SelectionPanel: () => <div data-testid="selection-panel">Selection Panel</div>,
  CreateFactorModal: () => <div data-testid="create-factor-modal">Create Factor</div>,
  FilterContextBar: () => null,
  filterContextBarAzureColorScheme: {},
  BoxplotDisplayToggle: () => <div data-testid="boxplot-display-toggle">Display Toggle</div>,
  boxplotDisplayToggleAzureColorScheme: {},
  ChartDownloadMenu: () => <div data-testid="chart-download-menu">Download</div>,
  chartDownloadMenuAzureColorScheme: {},
  AnnotationContextMenu: () => null,
  HelpTooltip: () => null,
  useGlossary: () => ({ getTerm: () => undefined }),
}));

// Mock hooks
vi.mock('../../hooks', () => ({
  useDashboardCharts: () => ({
    boxplotFactor: 'Machine',
    setBoxplotFactor: vi.fn(),
    paretoFactor: 'Machine',
    setParetoFactor: vi.fn(),
    focusedChart: null,
    setFocusedChart: vi.fn(),
    handleNextChart: vi.fn(),
    handlePrevChart: vi.fn(),
    showParetoComparison: false,
    setShowParetoComparison: vi.fn(),
    copyFeedback: null,
    handleCopyChart: vi.fn(),
    handleDownloadPng: vi.fn(),
    handleDownloadSvg: vi.fn(),
    availableOutcomes: ['Result'],
    availableStageColumns: [],
    anovaResult: null,
    boxplotData: [],
    cumulativeVariationPct: 0,
    filterChipData: [],
    factorVariations: new Map(),
    categoryContributions: new Map(),
    filterStack: [],
    applyFilter: vi.fn(),
    clearFilters: vi.fn(),
    updateFilterValues: vi.fn(),
    removeFilter: vi.fn(),
    handleDrillDown: vi.fn(),
    handleChartTitleChange: vi.fn(),
    lastAdvancedFactor: null,
  }),
}));

// Mock @variscout/hooks
vi.mock('@variscout/hooks', () => ({
  useAnnotations: () => ({
    hasAnnotations: false,
    boxplotHighlights: {},
    paretoHighlights: {},
    boxplotAnnotations: [],
    paretoAnnotations: [],
    ichartAnnotations: [],
    contextMenu: { isOpen: false, categoryKey: '', chartType: 'boxplot', position: { x: 0, y: 0 } },
    setHighlight: vi.fn(),
    createAnnotation: vi.fn(),
    createIChartAnnotation: vi.fn(),
    setIChartAnnotations: vi.fn(),
    closeContextMenu: vi.fn(),
    clearAnnotations: vi.fn(),
    openContextMenu: vi.fn(),
  }),
}));

// Mock core functions
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    calculateAnova: vi.fn(),
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDataCtx = {
    outcome: 'Result',
    factors: ['Machine'],
    rawData: [{ Result: 10, Machine: 'A' }],
    filteredData: [{ Result: 10, Machine: 'A' }],
    stats: { mean: 10, ucl: 12, lcl: 8 },
    specs: {},
    filters: {},
    setOutcome: vi.fn(),
    setFactors: vi.fn(),
    setFilters: vi.fn(),
    setSpecs: vi.fn(),
    setRawData: vi.fn(),
    columnAliases: {},
    isPerformanceMode: false,
    stageColumn: null,
    stageOrderMode: 'auto' as const,
    stagedStats: null,
    setStageColumn: vi.fn(),
    setStageOrderMode: vi.fn(),
    paretoAggregation: 'count' as const,
    setParetoAggregation: vi.fn(),
    chartTitles: {},
    setChartTitles: vi.fn(),
    timeColumn: null,
    displayOptions: {
      showFilterContext: true,
      lockYAxisToFullData: true,
    },
    setDisplayOptions: vi.fn(),
    categoryContributions: new Map(),
    selectedPoints: new Set<number>(),
    clearSelection: vi.fn(),
  };

  it('renders Analysis tab by default', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    expect(screen.getByText('Analysis')).toHaveClass('bg-blue-600'); // Active
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('switches to Regression tab', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    fireEvent.click(screen.getByText('Regression'));

    expect(screen.getByText('Regression')).toHaveClass('bg-blue-600');
    expect(screen.getByTestId('regression-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    vi.spyOn(CoreModule, 'calculateAnova').mockReturnValue(null);

    render(<Dashboard />);

    expect(screen.queryByTestId('anova-results')).not.toBeInTheDocument();
  });

  it('returns null when no outcome is selected', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      ...mockDataCtx,
      outcome: null,
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    const { container } = render(<Dashboard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('displays UCL, Mean, and LCL stats', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    expect(screen.getByText('UCL:')).toBeInTheDocument();
    expect(screen.getByText('12.00')).toBeInTheDocument();
    expect(screen.getByText('Mean:')).toBeInTheDocument();
    expect(screen.getByText('10.00')).toBeInTheDocument();
    expect(screen.getByText('LCL:')).toBeInTheDocument();
    expect(screen.getByText('8.00')).toBeInTheDocument();
  });

  it('shows Performance tab when isPerformanceMode is true', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      ...mockDataCtx,
      isPerformanceMode: true,
    } as unknown as ReturnType<typeof DataContextModule.useData>);

    render(<Dashboard />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('does not show Performance tab by default', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
  });

  it('renders download menus and copy buttons for each chart', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    const downloadMenus = screen.getAllByTestId('chart-download-menu');
    expect(downloadMenus).toHaveLength(3); // I-Chart, Boxplot, Pareto

    const copyButtons = screen.getAllByLabelText(/^Copy .+ to clipboard$/);
    expect(copyButtons).toHaveLength(4); // Dashboard + I-Chart + Boxplot + Pareto
  });

  it('renders editable chart titles', () => {
    vi.spyOn(DataContextModule, 'useData').mockReturnValue(
      mockDataCtx as unknown as ReturnType<typeof DataContextModule.useData>
    );

    render(<Dashboard />);

    const titles = screen.getAllByTestId('editable-title');
    expect(titles.length).toBeGreaterThanOrEqual(3);
  });
});
