import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useProjectStore } from '@variscout/stores';
import * as CoreModule from '@variscout/core';

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
vi.mock('../PerformanceDashboard', () => ({
  default: () => <div data-testid="performance-dashboard">Performance Dashboard</div>,
}));
vi.mock('../MobileChartCarousel', () => ({
  default: () => <div data-testid="mobile-carousel">Mobile Carousel</div>,
}));
vi.mock('../settings/SpecEditor', () => ({
  default: () => <div data-testid="spec-editor">Spec Editor</div>,
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toBlob: vi.fn(),
}));

// Mock @variscout/charts
vi.mock('@variscout/charts', () => ({
  calculateBoxplotStats: vi.fn(() => ({ key: 'A', min: 0, max: 10, median: 5, q1: 2.5, q3: 7.5 })),
  BoxplotStatsTable: () => <div data-testid="boxplot-stats-table">Stats Table</div>,
}));

// Mock @variscout/ui
vi.mock('@variscout/ui', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  FactorSelector: ({
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
  ProcessHealthBar: () => <div data-testid="process-health-bar">Health Bar</div>,
  VerificationCard: ({ tabs }: { tabs: Array<{ content: React.ReactNode }> }) => (
    <div data-testid="verification-card">{tabs[0]?.content}</div>
  ),
  FilterBreadcrumb: () => <div data-testid="filter-breadcrumb">Breadcrumb</div>,
  EditableChartTitle: ({ defaultTitle }: { defaultTitle: string }) => (
    <span data-testid="editable-title">{defaultTitle}</span>
  ),
  SelectionPanel: () => <div data-testid="selection-panel">Selection Panel</div>,
  CreateFactorModal: () => <div data-testid="create-factor-modal">Create Factor</div>,
  FilterContextBar: () => null,
  BoxplotDisplayToggle: () => <div data-testid="boxplot-display-toggle">Display Toggle</div>,
  ChartDownloadMenu: () => <div data-testid="chart-download-menu">Download</div>,
  AnnotationContextMenu: () => null,
  HelpTooltip: () => null,
  CapabilityMetricToggle: () => <div data-testid="capability-metric-toggle" />,
  SubgroupConfigPopover: () => <div data-testid="subgroup-config-popover" />,
  useGlossary: () => ({ getTerm: () => undefined }),
  DashboardChartCard: ({
    id,
    testId,
    title,
    controls,
    filterBar,
    children,
    footer,
    copyFeedback,
    chartName,
    onCopyChart,
    onDownloadPng,
    onDownloadSvg,
    onMaximize,
  }: {
    id: string;
    testId: string;
    title: React.ReactNode;
    controls?: React.ReactNode;
    filterBar?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    copyFeedback?: string | null;
    chartName: string;
    onCopyChart?: (containerId: string, chartName: string) => Promise<void>;
    onDownloadPng?: (containerId: string, chartName: string) => Promise<void>;
    onDownloadSvg?: (containerId: string, chartName: string) => void;
    onMaximize?: () => void;
  }) => (
    <div id={id} data-testid={testId}>
      {title}
      <div data-export-hide>{controls}</div>
      {filterBar}
      {children}
      {footer}
      {onCopyChart && onDownloadPng && onDownloadSvg && (
        <>
          <button
            onClick={() => onCopyChart(id, chartName)}
            aria-label={`Copy ${chartName} to clipboard`}
          >
            {copyFeedback === chartName ? 'Copied' : 'Copy'}
          </button>
          <div data-testid="chart-download-menu">Download</div>
        </>
      )}
      {onMaximize && (
        <button onClick={onMaximize} aria-label="Maximize chart">
          Maximize
        </button>
      )}
    </div>
  ),
  DashboardGrid: ({
    ichartCard,
    boxplotCard,
    paretoCard,
    piPanel,
  }: {
    ichartCard: React.ReactNode;
    boxplotCard: React.ReactNode;
    paretoCard?: React.ReactNode;
    piPanel: React.ReactNode;
  }) => (
    <div data-testid="dashboard-grid">
      {ichartCard}
      {boxplotCard}
      {paretoCard}
      {piPanel}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DashboardLayoutBase: (props: any) => {
    const {
      renderIChartContent,
      renderBoxplotContent,
      renderParetoContent,
      renderPIPanel,
      renderFocusedView,
      renderSpecEditor,
      focusedChart,
      ichartTitleSlot,
      ichartExtraControls,
      ichartHeaderExtra,
      controlStats,
      stagedStats,
      stageColumn,
      availableOutcomes,
      outcome,
      setOutcome,
      boxplotFactor,
      paretoFactor,
      copyFeedback,
      onCopyChart,
      onDownloadPng,
      onDownloadSvg,
      setFocusedChart,
      showParetoPanel,
    } = props;
    return (
      <div data-testid="dashboard-layout-base">
        {focusedChart && renderFocusedView ? (
          renderFocusedView
        ) : (
          <div data-testid="dashboard-grid">
            <div data-testid="chart-ichart">
              {ichartTitleSlot}
              {/* Controls: outcome selector */}
              <select
                data-testid="outcome-selector"
                value={String(outcome)}
                onChange={e => (setOutcome as (v: string) => void)?.(e.target.value)}
              >
                {(availableOutcomes as string[])?.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {ichartExtraControls}
              {ichartHeaderExtra}
              {/* Stats */}
              {stageColumn && stagedStats ? (
                <div>{(stagedStats as { stageOrder: string[] }).stageOrder.length} stages</div>
              ) : controlStats ? (
                <div>
                  <span>
                    <span>UCL:</span>{' '}
                    <span>{(controlStats as { ucl: number }).ucl.toFixed(2)}</span>
                  </span>
                  <span>
                    <span>Mean:</span>{' '}
                    <span>{(controlStats as { mean: number }).mean.toFixed(2)}</span>
                  </span>
                  <span>
                    <span>LCL:</span>{' '}
                    <span>{(controlStats as { lcl: number }).lcl.toFixed(2)}</span>
                  </span>
                </div>
              ) : null}
              {/* Chart title */}
              <span data-testid="editable-title">I-Chart: {String(outcome)}</span>
              {/* Export */}
              {onCopyChart && onDownloadPng && onDownloadSvg && (
                <>
                  <button
                    onClick={() =>
                      (onCopyChart as (id: string, name: string) => void)('ichart-card', 'ichart')
                    }
                    aria-label="Copy ichart to clipboard"
                  >
                    {copyFeedback === 'ichart' ? 'Copied' : 'Copy'}
                  </button>
                  <div data-testid="chart-download-menu">Download</div>
                </>
              )}
              <button
                onClick={() => (setFocusedChart as (c: string) => void)('ichart')}
                aria-label="Maximize chart"
              >
                Maximize
              </button>
              {renderIChartContent}
            </div>
            <div data-testid="chart-boxplot">
              <span data-testid="editable-title">Boxplot: {String(boxplotFactor)}</span>
              {onCopyChart && onDownloadPng && onDownloadSvg && (
                <>
                  <button
                    onClick={() =>
                      (onCopyChart as (id: string, name: string) => void)('boxplot-card', 'boxplot')
                    }
                    aria-label="Copy boxplot to clipboard"
                  >
                    {copyFeedback === 'boxplot' ? 'Copied' : 'Copy'}
                  </button>
                  <div data-testid="chart-download-menu">Download</div>
                </>
              )}
              <button
                onClick={() => (setFocusedChart as (c: string) => void)('boxplot')}
                aria-label="Maximize chart"
              >
                Maximize
              </button>
              {renderBoxplotContent}
            </div>
            {showParetoPanel && (
              <div data-testid="chart-pareto">
                <span data-testid="editable-title">Pareto: {String(paretoFactor)}</span>
                {onCopyChart && onDownloadPng && onDownloadSvg && (
                  <>
                    <button
                      onClick={() =>
                        (onCopyChart as (id: string, name: string) => void)('pareto-card', 'pareto')
                      }
                      aria-label="Copy pareto to clipboard"
                    >
                      {copyFeedback === 'pareto' ? 'Copied' : 'Copy'}
                    </button>
                    <div data-testid="chart-download-menu">Download</div>
                  </>
                )}
                <button
                  onClick={() => (setFocusedChart as (c: string) => void)('pareto')}
                  aria-label="Maximize chart"
                >
                  Maximize
                </button>
                {renderParetoContent}
              </div>
            )}
            <div data-testid="chart-stats">{renderPIPanel}</div>
          </div>
        )}
        {renderSpecEditor}
      </div>
    );
  },
  ChartInsightChip: () => null,
  NarrativeBar: () => null,
  DefectSummary: () => <div data-testid="defect-summary">Defect Summary</div>,
  useIsMobile: () => false,
  BREAKPOINTS: { phone: 640, mobile: 768, desktop: 1024, large: 1280 },
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
    filterStack: [],
    applyFilter: vi.fn(),
    clearFilters: vi.fn(),
    updateFilterValues: vi.fn(),
    removeFilter: vi.fn(),
    handleDrillDown: vi.fn(),
    handleChartTitleChange: vi.fn(),
    showParetoPanel: true,
    setShowParetoPanel: vi.fn(),
    lastAdvancedFactor: null,
  }),
}));

// Mock @variscout/hooks (includes derived hooks that Dashboard now uses directly)
vi.mock('@variscout/hooks', () => ({
  useFilteredData: () => ({
    filteredData: useProjectStore.getState().rawData,
    filteredIndexMap: new Map(),
  }),
  useAnalysisStats: () => ({
    stats: { mean: 10, ucl: 12, lcl: 8 },
    kde: null,
    isComputing: false,
  }),
  useStagedAnalysis: () => ({
    stagedData: [],
    stagedStats: null,
  }),
  useAnnotations: () => ({
    hasAnnotations: false,
    boxplotHighlights: {},
    paretoHighlights: {},
    contextMenu: { isOpen: false, categoryKey: '', chartType: 'boxplot', position: { x: 0, y: 0 } },
    setHighlight: vi.fn(),
    handleContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
    clearAnnotations: vi.fn(),
  }),
  useDashboardInsights: () => ({
    ichartInsight: {
      chipText: null,
      chipType: 'info',
      isDismissed: false,
      dismiss: vi.fn(),
      isLoading: false,
      isAI: false,
      action: null,
    },
    boxplotInsight: {
      chipText: null,
      chipType: 'info',
      isDismissed: false,
      dismiss: vi.fn(),
      isLoading: false,
      isAI: false,
      action: null,
    },
    paretoInsight: {
      chipText: null,
      chipType: 'info',
      isDismissed: false,
      dismiss: vi.fn(),
      isLoading: false,
      isAI: false,
      action: null,
    },
    statsInsight: {
      chipText: null,
      chipType: 'info',
      isDismissed: false,
      dismiss: vi.fn(),
      isLoading: false,
      isAI: false,
      action: null,
    },
    handleCpkClick: vi.fn(),
    isCapabilityMode: false,
    capabilityData: {
      cpkData: [],
      cpData: [],
      cpkStats: null,
      cpStats: null,
      subgroupResults: [],
      subgroupsMeetingTarget: undefined,
    },
  }),
  useFilterHandlers: ({
    clearFilters,
    removeFilter,
    updateFilterValues,
  }: Record<string, unknown>) => ({
    handleClearAllFilters: clearFilters,
    handleRemoveFilter: removeFilter,
    handleUpdateFilterValues: updateFilterValues,
  }),
  useCreateFactorModal: () => ({
    showCreateFactorModal: false,
    handleOpenCreateFactorModal: vi.fn(),
    handleCloseCreateFactorModal: vi.fn(),
    handleCreateFactor: vi.fn(),
  }),
  useJourneyPhase: () => 'scout',
  useCapabilityIChartData: () => ({
    cpkData: [],
    cpData: [],
    cpkStats: null,
    cpStats: null,
    subgroupResults: [],
    subgroupsMeetingTarget: 0,
  }),
  useProcessProjection: () => ({
    drillProjection: null,
    benchmarkProjection: null,
    centeringOpportunity: null,
    specSuggestion: null,
    cumulativeProjection: null,
    improvementProjection: null,
    resolvedProjection: null,
    activeProjection: null,
  }),
  useProbabilityPlotData: () => [],
  useDefectTransform: () => null,
  useDefectSummary: () => null,
}));

// Improvement store mock removed — projectedCpkMap is now passed as a prop

// Mock core functions
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    calculateAnova: vi.fn(),
  };
});

describe('Dashboard', () => {
  const mockStoreState = {
    outcome: 'Result',
    factors: ['Machine'],
    rawData: [{ Result: 10, Machine: 'A' }],
    specs: {},
    filters: {},
    columnAliases: {},
    stageColumn: null,
    stageOrderMode: 'auto' as const,
    paretoAggregation: 'count' as const,
    chartTitles: {},
    timeColumn: null,
    displayOptions: {
      showFilterContext: true,
      lockYAxisToFullData: true,
    },
    subgroupConfig: { method: 'fixed-size' as const, size: 5 },
    cpkTarget: 1.33,
    selectedPoints: new Set<number>(),
    analysisMode: 'standard' as const,
    yamazumiMapping: null,
    filterStack: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useProjectStore.setState(
      mockStoreState as unknown as Partial<ReturnType<typeof useProjectStore.getState>>
    );
  });

  it('renders Analysis tab by default', () => {
    render(<Dashboard />);

    expect(screen.getByText('Analysis')).toHaveClass('bg-blue-600'); // Active
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('process-health-bar')).toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.spyOn(CoreModule, 'calculateAnova').mockReturnValue(null);

    render(<Dashboard />);

    expect(screen.queryByTestId('anova-results')).not.toBeInTheDocument();
  });

  it('returns null when no outcome is selected', () => {
    useProjectStore.setState({ outcome: null });

    const { container } = render(<Dashboard />);

    expect(container).toBeEmptyDOMElement();
  });

  it('displays UCL, Mean, and LCL stats', () => {
    render(<Dashboard />);

    expect(screen.getByText('UCL:')).toBeInTheDocument();
    expect(screen.getByText('12.00')).toBeInTheDocument();
    expect(screen.getByText('Mean:')).toBeInTheDocument();
    expect(screen.getByText('10.00')).toBeInTheDocument();
    expect(screen.getByText('LCL:')).toBeInTheDocument();
    expect(screen.getByText('8.00')).toBeInTheDocument();
  });

  it('shows Performance tab when analysisMode is performance', () => {
    useProjectStore.setState({ analysisMode: 'performance' });

    render(<Dashboard />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('does not show Performance tab by default', () => {
    render(<Dashboard />);

    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
  });

  it('renders download menus and copy buttons for each chart', () => {
    render(<Dashboard />);

    const downloadMenus = screen.getAllByTestId('chart-download-menu');
    expect(downloadMenus).toHaveLength(3); // I-Chart, Boxplot, Pareto

    const copyButtons = screen.getAllByLabelText(/^Copy .+ to clipboard$/);
    expect(copyButtons).toHaveLength(3); // I-Chart + Boxplot + Pareto
  });

  it('renders editable chart titles', () => {
    render(<Dashboard />);

    const titles = screen.getAllByTestId('editable-title');
    expect(titles.length).toBeGreaterThanOrEqual(3);
  });
});
