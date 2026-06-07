import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import {
  useProjectStore,
  useAnalysisScopeStore,
  getAnalysisScopeInitialState,
} from '@variscout/stores';
import { calculateAnova, type Finding } from '@variscout/core';
import { usePanelsStore } from '../../features/panels/panelsStore';

function makeCapturedFinding(id: string): Finding {
  const timestamp = Date.parse('2026-06-07T00:00:00Z');
  return {
    id,
    text: 'Captured observation',
    context: { activeFilters: {}, cumulativeScope: null },
    evidenceType: 'data',
    status: 'observed',
    createdAt: timestamp,
    deletedAt: null,
    comments: [],
    statusChangedAt: timestamp,
  };
}

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
  // G1 Task 7: InflectionOverlay is forwarded to ProbabilityPlot via render-prop;
  // Dashboard tests don't render charts directly (chart is mocked) but the
  // import must resolve.
  InflectionOverlay: () => null,
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
  VerificationCard: ({
    tabs,
    activeTab,
  }: {
    tabs: Array<{ id: string; content: React.ReactNode }>;
    activeTab: string;
  }) => (
    <div data-testid="verification-card">
      {tabs.find(t => t.id === activeTab)?.content ?? tabs[0]?.content}
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
      {options.map(opt => (
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
  FilterBreadcrumb: () => <div data-testid="filter-breadcrumb">Breadcrumb</div>,
  EditableChartTitle: ({ defaultTitle }: { defaultTitle: string }) => (
    <span data-testid="editable-title">{defaultTitle}</span>
  ),
  SelectionPanel: () => <div data-testid="selection-panel">Selection Panel</div>,
  CaptureCard: ({
    onCapture,
    onFactorOnly,
  }: {
    onCapture: () => void;
    onFactorOnly?: () => void;
  }) => (
    <div data-testid="capture-card">
      <button onClick={onCapture}>Capture</button>
      {onFactorOnly ? <button onClick={onFactorOnly}>Factor only</button> : null}
    </div>
  ),
  CreateFactorModal: () => <div data-testid="create-factor-modal">Create Factor</div>,
  FilterContextBar: () => null,
  BoxplotDisplayToggle: () => <div data-testid="boxplot-display-toggle">Display Toggle</div>,
  ChartDownloadMenu: () => <div data-testid="chart-download-menu">Download</div>,
  AnnotationContextMenu: () => null,
  HelpTooltip: () => null,
  CapabilityMetricToggle: () => <div data-testid="capability-metric-toggle" />,
  SubgroupConfigPopover: () => <div data-testid="subgroup-config-popover" />,
  useGlossary: () => ({ getTerm: () => undefined }),
  // G1 Task 7: inflection-binning workflow primitives. Mocked as inert
  // stand-ins — the workflow is exercised by tests in @variscout/ui directly;
  // Dashboard tests verify only that the chart grid still renders alongside.
  InflectionSidePanelView: () => <div data-testid="inflection-side-panel">Inflection Panel</div>,
  useInflectionBinningState: () => ({
    state: { kind: 'idle' as const, canShowBanner: false },
    dismissBanner: () => {},
    detectInflections: () => {},
    dragCut: () => {},
    addCut: () => {},
    removeCut: () => {},
    renameLevel: () => {},
    commit: () => {},
    removeBinning: () => {},
    reset: () => {},
  }),
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
      onInsightCapture,
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
              {onInsightCapture ? (
                <button onClick={onInsightCapture} data-testid="insight-capture">
                  Capture insight
                </button>
              ) : null}
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
  // LV1-E Task 7: ScopeChrome stub — renders data-testid so render-smoke tests work
  ScopeChrome: () => <div data-testid="scope-chrome">ScopeChrome</div>,
}));

// Hoisted spies for useDashboardCharts setters — shared so tests can assert
// on intent-driven calls (F1 Task 5). Per feedback_vi_mock_hoist_closure: wrap
// in closure so the vi.mock factory can read the live refs at hoist time.
const chartSetterSpies = vi.hoisted(() => ({
  setBoxplotFactor: vi.fn(),
  setFocusedChart: vi.fn(),
}));

// Mock hooks
vi.mock('../../hooks', () => ({
  useDashboardCharts: () => ({
    boxplotFactor: 'Machine',
    setBoxplotFactor: chartSetterSpies.setBoxplotFactor,
    paretoFactor: 'Machine',
    setParetoFactor: vi.fn(),
    focusedChart: null,
    setFocusedChart: chartSetterSpies.setFocusedChart,
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
  buildEngineSignalCaptureDraft: () => ({
    entryKind: 'engine-signal',
    conditionLabel: 'Process shift detected',
    evidenceLabel: 'I-Chart signal',
    proposedFactorName: 'Result shift',
    evidenceType: 'data',
    note: '',
    activeFilters: {},
    source: { chart: 'ichart', anchorX: 0, anchorY: 10 },
  }),
  resolveDerivedFactorName: (name: string) => name,
  buildChangepointDerivedColumn: (rows: Record<string, unknown>[], _index: number, name: string) =>
    rows.map((row, idx) => ({ ...row, [name]: idx === 0 ? 'in' : 'out' })),
  applyDerivedFactorToFilters: (
    activeFilters: Record<string, (string | number)[]>,
    factorName: string
  ) => ({ ...activeFilters, [factorName]: ['in'] }),
  useDefectTransform: () => null,
  useDefectSummary: () => null,
  useLensedSampleCount: () => null,
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (v: unknown) => String(v),
  }),
}));

// Improvement store mock removed — projectedCpkMap is now passed as a prop

// Mock core functions
vi.mock('@variscout/core', async () => {
  const actual = await vi.importActual('@variscout/core');
  return {
    ...actual,
    calculateAnova: vi.fn(),
    getNelsonRule2Sequences: vi.fn(() => [{ startIndex: 0, endIndex: 1 }]),
    getNelsonRule3Sequences: vi.fn(() => []),
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
    filterStack: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useProjectStore.setState(
      mockStoreState as unknown as Partial<ReturnType<typeof useProjectStore.getState>>
    );
    // F1 Task 5: reset chart-setter spies + panelsStore intent so tests don't
    // leak across each other (panelsStore intent is module-singleton state).
    chartSetterSpies.setBoxplotFactor.mockClear();
    chartSetterSpies.setFocusedChart.mockClear();
    usePanelsStore.setState({ pendingExploreIntent: null });
    // LV1-B: reset the linked-views scope store between tests so the mirror
    // assertions can't see leftover state from a prior test's apply-effect.
    useAnalysisScopeStore.setState(getAnalysisScopeInitialState());
  });

  it('renders Analysis tab by default', () => {
    render(<Dashboard />);

    expect(screen.getByText('Analysis')).toHaveClass('bg-blue-600'); // Active
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
    expect(screen.getByTestId('process-health-bar')).toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.mocked(calculateAnova).mockReturnValue(null);

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

  it('shows one-time Analyze afterglow after an engine-signal Finding capture', () => {
    const onAddChartObservation = vi.fn(() => makeCapturedFinding('f-dashboard'));
    const onOpenWall = vi.fn();

    render(
      <Dashboard
        onOpenWall={onOpenWall}
        findingsCallbacks={{
          onAddChartObservation,
          chartFindings: { ichart: [], boxplot: [], pareto: [] },
        }}
      />
    );

    fireEvent.click(screen.getByTestId('insight-capture'));
    fireEvent.click(screen.getByRole('button', { name: 'Capture' }));

    expect(screen.getByRole('button', { name: /Take it to Analyze ->/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Take it to Analyze ->/i }));
    expect(onOpenWall).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: /Take it to Analyze ->/i })
    ).not.toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────────────
  // F1 Task 5: pendingExploreIntent consumer
  // ────────────────────────────────────────────────────────────────────────
  describe('pendingExploreIntent consumer', () => {
    it('applies intent with focusedChart + boxplotFactor on mount', () => {
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'boxplot', boxplotFactor: 'Vessel' },
      });

      render(<Dashboard />);

      expect(chartSetterSpies.setFocusedChart).toHaveBeenCalledWith('boxplot');
      expect(chartSetterSpies.setBoxplotFactor).toHaveBeenCalledWith('Vessel');
      // Intent cleared after consumption
      expect(usePanelsStore.getState().pendingExploreIntent).toBeNull();
    });

    it('LV1-B: mirrors intent.boxplotFactor into useAnalysisScopeStore on mount', () => {
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'boxplot', boxplotFactor: 'Vessel' },
      });

      render(<Dashboard />);

      // LV1-B contract (spec §5.6): the apply-effect mirrors boxplotFactor
      // into the linked-views scope store alongside the local Dashboard
      // setState write. Downstream PRs (LV1-E scope chrome, LV1-G canvas viz)
      // subscribe to this store; LV1-E will retire the local-state write.
      expect(useAnalysisScopeStore.getState().boxplotFactor).toBe('Vessel');
    });

    it('LV1-B: focusedChart-only intent leaves scope.boxplotFactor undefined', () => {
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'ichart' },
      });

      render(<Dashboard />);

      // The mirror sits inside the same `if (pendingExploreIntent.boxplotFactor)`
      // guard as the local setBoxplotFactor write. When the intent omits the
      // factor, the scope-store stays at its initial state.
      expect(useAnalysisScopeStore.getState().boxplotFactor).toBeUndefined();
    });

    it('applies focusedChart-only intent without setting boxplotFactor', () => {
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'ichart' },
      });

      render(<Dashboard />);

      expect(chartSetterSpies.setFocusedChart).toHaveBeenCalledWith('ichart');
      // No boxplotFactor in intent → setBoxplotFactor not called at all from
      // the intent path. useDashboardCharts is mocked wholesale, so the only
      // route to setBoxplotFactor in this test environment is the intent
      // effect — the conditional guard at Dashboard.tsx:411 skips it cleanly.
      expect(chartSetterSpies.setBoxplotFactor).not.toHaveBeenCalled();
      expect(usePanelsStore.getState().pendingExploreIntent).toBeNull();
    });

    it('does nothing when pendingExploreIntent is null on mount', () => {
      // Default state — no intent set
      render(<Dashboard />);

      // Neither setter called from the intent effect path.
      // (setFocusedChart may still be called by the restore effect with a
      // persisted initialViewState, but we don't pass one here.)
      expect(chartSetterSpies.setFocusedChart).not.toHaveBeenCalled();
      // setBoxplotFactor may be called by useDashboardChartsBase factor-sync,
      // but those calls live behind the mock — only the intent path calls it
      // here.
      expect(chartSetterSpies.setBoxplotFactor).not.toHaveBeenCalled();
    });

    it('intent overrides persisted initialViewState.focusedChart', () => {
      // Prime intent — restore effect would run first with initialViewState,
      // but intent useEffect runs in source order after restore and
      // re-overwrites focusedChart.
      usePanelsStore.setState({
        pendingExploreIntent: { focusedChart: 'boxplot', boxplotFactor: 'Operator' },
      });

      render(<Dashboard initialViewState={{ focusedChart: 'ichart' }} />);

      // Both setters fire — restore writes 'ichart', intent then writes 'boxplot'.
      // The intent's final call is what matters; assert the most recent call.
      const calls = chartSetterSpies.setFocusedChart.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls[calls.length - 1]?.[0]).toBe('boxplot');
      expect(chartSetterSpies.setBoxplotFactor).toHaveBeenCalledWith('Operator');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // LV1-E Task 7: ScopeChrome mount + reverse-mirror effects
  // ────────────────────────────────────────────────────────────────────────
  describe('LV1-E: ScopeChrome mount + reverse-mirror effects', () => {
    it('renders the ScopeChrome stub in the analysis tab (desktop)', () => {
      // useIsMobile returns false by default (desktop)
      render(<Dashboard />);

      expect(screen.getByTestId('scope-chrome')).toBeInTheDocument();
    });

    it('LV1-E reverse-mirror: scope.yColumn change calls setOutcome on projectStore', async () => {
      render(<Dashboard />);

      // Simulate ScopeChrome writing yColumn into the scope store
      useAnalysisScopeStore.setState({ yColumn: 'Pressure' });

      // React processes the update; the reverse-mirror useEffect fires
      await vi.waitFor(() => {
        expect(useProjectStore.getState().outcome).toBe('Pressure');
      });
    });

    it('LV1-E reverse-mirror: scope.boxplotFactor change calls setBoxplotFactor', async () => {
      render(<Dashboard />);

      // Simulate ScopeChrome writing a new boxplotFactor into the scope store
      useAnalysisScopeStore.setState({ boxplotFactor: 'Operator' });

      await vi.waitFor(() => {
        expect(chartSetterSpies.setBoxplotFactor).toHaveBeenCalledWith('Operator');
      });
    });

    it('LV1-E reverse-mirror: no-op when scope.yColumn matches current outcome', async () => {
      // outcome is already 'Result' from mockStoreState
      useProjectStore.setState({ outcome: 'Result' });
      render(<Dashboard />);

      const setOutcomeSpy = vi.spyOn(useProjectStore.getState(), 'setOutcome');
      useAnalysisScopeStore.setState({ yColumn: 'Result' });

      // Give effects time to run (they shouldn't call setOutcome)
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(setOutcomeSpy).not.toHaveBeenCalled();
    });
  });
});
