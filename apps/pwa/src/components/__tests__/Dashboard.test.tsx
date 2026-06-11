import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { flushRaf } from '@variscout/ui/test-utils';
import { calculateAnova, type Finding } from '@variscout/core';
import * as UseFilterNavigationModule from '../../hooks/useFilterNavigation';
import {
  usePreferencesStore,
  useProjectStore,
  useViewStore,
  useAnalysisScopeStore,
  useAnalyzeStore,
  getProjectInitialState,
} from '@variscout/stores';

// Mock components. Capture the I-Chart props so the ER-4 highlight-tier contract
// (full lensed series + the member Set) can be asserted under a condition.
const capturedIChartProps = vi.hoisted(() => ({
  value: undefined as Record<string, unknown> | undefined,
}));
vi.mock('../charts/IChart', () => ({
  default: (props: Record<string, unknown>) => {
    capturedIChartProps.value = props;
    return <div data-testid="i-chart">I-Chart</div>;
  },
}));
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
// Capture the full ProcessHealthBar props so the ER-1 relocations (Subgroup
// slot, Stages selects, Export CSV/.vrs, Edit-framing) can be asserted.
const capturedHealthBarProps = vi.hoisted(() => ({
  value: undefined as Record<string, unknown> | undefined,
}));
// Mock new dashboard chrome components
vi.mock('@variscout/ui', async () => {
  const actual = await vi.importActual('@variscout/ui');
  return {
    ...actual,
    ProcessHealthBar: (props: { specs: unknown } & Record<string, unknown>) => {
      capturedHealthBarSpecs.value = props.specs;
      capturedHealthBarProps.value = props;
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

// Explicitly stub useDataDateRange — the hook reads from IndexedDB which isn't
// available in jsdom; returning null is the correct "no date range" fallback
// (mirrors the Azure test's intentional approach).
vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...(actual as object),
    useDataDateRange: () => null,
  };
});

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
    mockClearFilters.mockClear();

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
    useViewStore.getState().setTransientHighlight(null);
    useAnalysisScopeStore.setState(useAnalysisScopeStore.getInitialState());
    useAnalyzeStore.setState({ scopes: [] });
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

  it('renders dashboard view by default with tab navigation', async () => {
    render(<Dashboard />);

    // ProcessHealthBar paints synchronously; chart content mounts after the
    // one-rAF skeleton gate.
    expect(screen.getByTestId('process-health-bar')).toBeInTheDocument();
    await flushRaf();
    // Dashboard view shows I-Chart + Boxplot once painted.
    expect(screen.getByTestId('i-chart')).toBeInTheDocument();
    expect(screen.getByTestId('boxplot')).toBeInTheDocument();
  });

  it('does not render AnovaResults when calculation returns null', () => {
    vi.mocked(calculateAnova).mockReturnValue(null);

    render(<Dashboard />);

    expect(screen.queryByTestId('anova-results')).not.toBeInTheDocument();
  });

  it('feeds the histogram measureSpecs[outcome] when global specs are empty', async () => {
    // Global specs empty; the per-measure spec for the outcome carries limits.
    useProjectStore.setState({
      specs: {},
      measureSpecs: { Result: { lsl: 5, usl: 45 } },
    });

    render(<Dashboard />);

    // The histogram lives inside the verify card, which is gated by the one-rAF
    // skeleton; flush so its content (CapabilityHistogram) mounts.
    await flushRaf();

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

  describe('ER-1: context-line relocations', () => {
    it('feeds ProcessHealthBar the relocated stage controls + Export CSV/.vrs + Edit-framing', () => {
      const onExportCSV = vi.fn();
      const onExportVrs = vi.fn();
      const onManageFactors = vi.fn();
      render(
        <Dashboard
          onExportCSV={onExportCSV}
          onExportVrs={onExportVrs}
          onManageFactors={onManageFactors}
        />
      );
      const props = capturedHealthBarProps.value!;
      // Stage selects relocated from DashboardLayoutBase into the strip.
      expect(props).toHaveProperty('availableStageColumns');
      expect(typeof props.setStageColumn).toBe('function');
      expect(typeof props.onStageOrderModeChange).toBe('function');
      // PWA: both Export CSV and the relocated .vrs export.
      expect(props.onExportCSV).toBe(onExportCSV);
      expect(props.onExportVrs).toBe(onExportVrs);
      // Measure chip + Edit-framing menu wired to the factor manager.
      expect(props.onEditFraming).toBe(onManageFactors);
      expect(props.measureLabel).toBeTruthy();
    });

    it('passes the relocated Subgroup slot only when the capability metric is active', () => {
      // Default standardIChartMetric is measurement → no subgroup slot.
      render(<Dashboard />);
      expect(capturedHealthBarProps.value!.subgroupSlot).toBeUndefined();

      useProjectStore.setState({
        displayOptions: {
          ...useProjectStore.getState().displayOptions,
          standardIChartMetric: 'capability',
        },
        specs: { lsl: 5, usl: 45 },
      });
      render(<Dashboard />);
      expect(capturedHealthBarProps.value!.subgroupSlot).toBeTruthy();
    });
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

    // ER-4: a brush no longer auto-opens the CaptureCard — it shows the brush PILL.
    // The CaptureCard opens only via the pill's ✚ Capture finding.
    expect(screen.getByTestId('condition-pill')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('condition-pill-capture'));

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
    // ER-4: the capture-afterglow toast retired (subsumed by the scope bar). The
    // "Take it to Analyze →" verb now lives on the scope bar, which appears only
    // when a condition is APPLIED (not merely after a capture) — so it is absent here.
    expect(screen.queryByRole('button', { name: /Take it to Analyze/i })).not.toBeInTheDocument();
  });

  it('suffixes edited brush factor names instead of overwriting existing raw columns', () => {
    useViewStore.getState().setSelectedPoints(new Set([0, 1]));

    render(
      <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
    );

    // ER-4: open the CaptureCard via the brush pill's ✚ Capture.
    fireEvent.click(screen.getByTestId('condition-pill-capture'));
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

  // btn-manage-factors is injected via ichartHeaderExtra (rendered inside the I-Chart slot header
  // when onManageFactors is provided). This is DISTINCT from the pre-existing empty-state Factors
  // button (rendered only when hasData is false and there are no factors) — different render
  // condition, different mount point.
  describe('ER-1 Task 3: ichartHeaderExtra Factors(N) twin', () => {
    it('renders btn-manage-factors in ichartHeaderExtra with factor count', () => {
      const onManageFactors = vi.fn();
      render(<Dashboard onManageFactors={onManageFactors} />);
      const btn = screen.getByTestId('btn-manage-factors');
      expect(btn).toBeTruthy();
      // Factor count comes from projectStore.factors seeded to ['Machine'] in beforeEach
      expect(btn.textContent).toContain('Factors (1)');
    });

    it('calls onManageFactors when btn-manage-factors is clicked', () => {
      const onManageFactors = vi.fn();
      render(<Dashboard onManageFactors={onManageFactors} />);
      fireEvent.click(screen.getByTestId('btn-manage-factors'));
      expect(onManageFactors).toHaveBeenCalledOnce();
    });

    it('does not render btn-manage-factors when onManageFactors is not provided', () => {
      render(<Dashboard />);
      expect(screen.queryByTestId('btn-manage-factors')).toBeNull();
    });
  });

  it('maps rolling-lens brush indices onto the visible raw rows', () => {
    usePreferencesStore.setState({ timeLens: { mode: 'rolling', windowSize: 2 } });
    useViewStore.getState().setSelectedPoints(new Set([0, 1]));

    render(
      <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
    );

    // ER-4: open the CaptureCard via the brush pill's ✚ Capture.
    fireEvent.click(screen.getByTestId('condition-pill-capture'));
    fireEvent.change(screen.getByLabelText('Factor name'), { target: { value: 'Recent window' } });
    fireEvent.click(screen.getByRole('button', { name: 'Factor only' }));

    expect(useProjectStore.getState().rawData.map(row => row['Recent window'])).toEqual([
      'out',
      'out',
      'in',
      'in',
    ]);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ER-4: the condition loop (group pill → view-as-condition → scope bar; the
  // coherent clear; the retired afterglow / auto-CaptureCard paths).
  // ──────────────────────────────────────────────────────────────────────────
  describe('ER-4 condition loop', () => {
    it('a transient highlight shows the group pill with honest n/x̄', () => {
      // Simulate a boxplot group click (the chart is mocked; drive the store).
      useViewStore.getState().setTransientHighlight({ column: 'Machine', value: 'A' });
      render(
        <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
      );

      const pill = screen.getByTestId('condition-pill');
      expect(pill).toBeInTheDocument();
      // Machine=A → Result 10,20 (mean 15) vs B → 30,40 (mean 35); n=2.
      expect(pill.textContent).toContain('Machine');
      expect(pill.textContent).toContain('n=2');
    });

    it('view-as-condition applies the condition → scope bar + scope-store leaves; NO filters write', () => {
      useViewStore.getState().setTransientHighlight({ column: 'Machine', value: 'A' });
      render(
        <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
      );
      fireEvent.click(screen.getByTestId('condition-pill-apply'));

      // The scope bar appears with the condition + its coverage.
      expect(screen.getByTestId('scope-bar')).toBeInTheDocument();
      // A condition is scope-store-only: it does NOT write projectStore.filters.
      // useFilteredData / useAnalysisStats therefore stay full-series for the I-Chart.
      expect(useProjectStore.getState().filters).toEqual({});
      // The full leaves live in the scope store (the only home of an applied condition).
      expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([
        { kind: 'leaf', column: 'Machine', op: 'eq', value: 'A' },
      ]);
      // The transient highlight cleared on apply.
      expect(useViewStore.getState().transientHighlight).toBeNull();
    });

    it('the I-Chart plots the FULL lensed series + lights the CATEGORICAL members (D6)', () => {
      // 4 rows: Result 10/20 (Machine A), 30/40 (Machine B) — all finite Y, no
      // filters. Under a Machine=A condition the I-Chart series stays the full 4
      // points; only the Machine=A rows (display indices 0,1) are lit.
      useViewStore.getState().setTransientHighlight({ column: 'Machine', value: 'A' });
      render(
        <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
      );
      fireEvent.click(screen.getByTestId('condition-pill-apply'));

      // No filters write → useFilteredData is the full series (the I-Chart reads it
      // internally); the membership Set is the categorical subset within that series.
      expect(useProjectStore.getState().filters).toEqual({});
      const members = capturedIChartProps.value?.conditionMemberIndices as Set<number>;
      expect(members).toBeInstanceOf(Set);
      expect([...members].sort((a, b) => a - b)).toEqual([0, 1]);
    });

    it('Take it to Analyze → mints the PSS then navigates', () => {
      const onOpenWall = vi.fn();
      useViewStore.getState().setTransientHighlight({ column: 'Machine', value: 'A' });
      render(
        <Dashboard
          onOpenWall={onOpenWall}
          findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }}
        />
      );
      fireEvent.click(screen.getByTestId('condition-pill-apply'));
      fireEvent.click(screen.getByTestId('scope-bar-analyze'));

      // The PSS was minted (range-capable producer) BEFORE navigation.
      const scopes = useAnalyzeStore.getState().scopes;
      expect(scopes).toHaveLength(1);
      expect(scopes[0].outcome).toBe('Result');
      expect(onOpenWall).toHaveBeenCalledTimes(1);
    });

    it('the scope-bar × is the coherent clear (filters + scope store + leaves)', () => {
      useViewStore.getState().setTransientHighlight({ column: 'Machine', value: 'A' });
      render(
        <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
      );
      fireEvent.click(screen.getByTestId('condition-pill-apply'));
      expect(screen.getByTestId('scope-bar')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('scope-bar-clear'));

      expect(screen.queryByTestId('scope-bar')).not.toBeInTheDocument();
      expect(useAnalysisScopeStore.getState().conditionLeaves).toEqual([]);
      expect(useAnalysisScopeStore.getState().categoricalFilters).toEqual([]);
      expect(useViewStore.getState().transientHighlight).toBeNull();
      // mockFilterNavigationReturn.clearFilters fired (the coherent clear routes
      // through it).
      expect(mockFilterNavigationReturn.clearFilters).toHaveBeenCalled();
    });

    it('the capture-afterglow toast is GONE (retired path)', () => {
      render(
        <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
      );
      // No condition, no capture: the "Take it to Analyze →" verb is absent (it
      // only lives on the scope bar under an applied condition).
      expect(
        screen.queryByRole('button', { name: /Dismiss Analyze afterglow/i })
      ).not.toBeInTheDocument();
    });

    it('⊕ dedup: adding the same level twice is a no-op (applyCondition called once)', async () => {
      // Pre-apply a Machine=A condition so hasCondition=true and appliedLeaves=[Machine=A].
      // The same leaf is what ⊕ would try to append; the dedup guard must prevent it.
      const leafA = { kind: 'leaf' as const, column: 'Machine', op: 'eq' as const, value: 'A' };
      useAnalysisScopeStore.setState({ conditionLeaves: [leafA] });

      render(
        <Dashboard findingsCallbacks={{ chartFindings: { boxplot: [], pareto: [], ichart: [] } }} />
      );

      // Wait for boxplotFactor to sync to 'Machine' (useEffect in useDashboardChartsBase)
      // and for compositionViewNode to appear. The ⊕ button for level 'A' should render
      // once showCompositionView is true.
      const addBtn = await screen.findByTestId('composition-add-A');
      expect(addBtn).toBeInTheDocument();

      // First click: the leaf is already in appliedLeaves → dedup no-op, leaves unchanged.
      fireEvent.click(addBtn);
      expect(useAnalysisScopeStore.getState().conditionLeaves).toHaveLength(1);
      expect(useAnalysisScopeStore.getState().conditionLeaves[0]).toMatchObject(leafA);

      // Second click: still a no-op.
      fireEvent.click(addBtn);
      expect(useAnalysisScopeStore.getState().conditionLeaves).toHaveLength(1);
    });
  });
});
